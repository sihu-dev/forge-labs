-- ============================================
-- HEPHAITOS - Notifications System
-- QRY-025: Real-time WebSocket Notifications
-- ============================================

-- ============================================
-- 1. NOTIFICATIONS 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'price_alert',
    'trade_executed',
    'strategy_signal',
    'celebrity_trade',
    'portfolio_update',
    'system',
    'achievement',
    'coaching'
  )),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  action_url TEXT,
  action_label TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스
CREATE INDEX notifications_user_id_idx ON public.notifications(user_id);
CREATE INDEX notifications_user_unread_idx ON public.notifications(user_id) WHERE read = FALSE;
CREATE INDEX notifications_created_at_idx ON public.notifications(created_at DESC);
CREATE INDEX notifications_type_idx ON public.notifications(type);

-- RLS 정책
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications" ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);

-- 시스템/서비스가 알림 생성 (service_role 사용)
CREATE POLICY "Service can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (TRUE);

-- ============================================
-- 2. NOTIFICATION_SETTINGS 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS public.notification_settings (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  push_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  in_app_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  categories JSONB NOT NULL DEFAULT '{
    "price_alert": true,
    "trade_executed": true,
    "strategy_signal": true,
    "celebrity_trade": true,
    "portfolio_update": true,
    "system": true,
    "achievement": true,
    "coaching": true
  }',
  quiet_hours_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '08:00',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS 정책
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings" ON public.notification_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON public.notification_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON public.notification_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 3. PRICE_ALERTS 테이블 (가격 알림 설정)
-- ============================================
CREATE TABLE IF NOT EXISTS public.price_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  target_price DECIMAL(20, 8) NOT NULL,
  condition TEXT NOT NULL CHECK (condition IN ('above', 'below')),
  triggered BOOLEAN NOT NULL DEFAULT FALSE,
  triggered_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스
CREATE INDEX price_alerts_user_id_idx ON public.price_alerts(user_id);
CREATE INDEX price_alerts_active_idx ON public.price_alerts(active) WHERE active = TRUE;
CREATE INDEX price_alerts_symbol_idx ON public.price_alerts(symbol);

-- RLS 정책
ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own price alerts" ON public.price_alerts
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- 4. Realtime 구독 설정
-- ============================================
-- notifications 테이블에 대한 Realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ============================================
-- 5. 알림 생성 헬퍼 함수
-- ============================================
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_priority TEXT DEFAULT 'normal',
  p_data JSONB DEFAULT NULL,
  p_action_url TEXT DEFAULT NULL,
  p_action_label TEXT DEFAULT NULL,
  p_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
  v_settings RECORD;
BEGIN
  -- 사용자 설정 확인
  SELECT * INTO v_settings FROM public.notification_settings WHERE user_id = p_user_id;

  -- 설정이 없으면 기본값 사용
  IF v_settings IS NULL THEN
    INSERT INTO public.notification_settings (user_id) VALUES (p_user_id);
  END IF;

  -- 카테고리가 비활성화된 경우 스킵 (urgent 제외)
  IF v_settings IS NOT NULL AND
     p_priority != 'urgent' AND
     NOT COALESCE((v_settings.categories->>p_type)::boolean, true) THEN
    RETURN NULL;
  END IF;

  -- 조용한 시간 체크 (urgent 제외)
  IF v_settings IS NOT NULL AND
     v_settings.quiet_hours_enabled AND
     p_priority != 'urgent' THEN
    IF (CURRENT_TIME >= v_settings.quiet_hours_start OR
        CURRENT_TIME <= v_settings.quiet_hours_end) THEN
      -- 조용한 시간에는 저장만 하고 푸시 안함 (in_app 알림)
      NULL; -- 계속 진행
    END IF;
  END IF;

  -- 알림 생성
  INSERT INTO public.notifications (
    user_id, type, priority, title, message,
    data, action_url, action_label, expires_at
  ) VALUES (
    p_user_id, p_type, p_priority, p_title, p_message,
    p_data, p_action_url, p_action_label, p_expires_at
  ) RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. 만료된 알림 정리 함수
-- ============================================
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM public.notifications
  WHERE expires_at IS NOT NULL AND expires_at < NOW();

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. 읽지 않은 알림 수 조회 함수
-- ============================================
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM public.notifications
    WHERE user_id = p_user_id AND read = FALSE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 8. 모든 알림 읽음 처리 함수
-- ============================================
CREATE OR REPLACE FUNCTION mark_all_notifications_read(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_updated_count INTEGER;
BEGIN
  UPDATE public.notifications
  SET read = TRUE
  WHERE user_id = p_user_id AND read = FALSE;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- HEPHAITOS - Subscriptions & Payments System
-- QRY-026: Payment Webhook Integration
-- ============================================

-- ============================================
-- 1. SUBSCRIPTIONS 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL DEFAULT 'free' CHECK (plan_id IN ('free', 'starter', 'pro', 'team')),
  billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'yearly')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'past_due', 'trialing')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  payment_method TEXT CHECK (payment_method IN ('card', 'transfer', 'phone')),
  billing_key TEXT, -- 정기결제용 빌링키
  last_payment_at TIMESTAMPTZ,
  next_payment_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 인덱스
CREATE INDEX subscriptions_user_id_idx ON public.subscriptions(user_id);
CREATE INDEX subscriptions_status_idx ON public.subscriptions(status);
CREATE INDEX subscriptions_next_payment_idx ON public.subscriptions(next_payment_at)
  WHERE status = 'active';

-- RLS 정책
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage subscriptions" ON public.subscriptions
  FOR ALL USING (TRUE);

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 2. PAYMENTS 테이블 (결제 이력)
-- ============================================
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  order_id TEXT NOT NULL UNIQUE,
  payment_key TEXT UNIQUE,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled', 'refunded')),
  payment_method TEXT CHECK (payment_method IN ('card', 'transfer', 'phone', 'virtual_account')),
  -- 결제 상세
  order_name TEXT NOT NULL,
  plan_id TEXT,
  billing_cycle TEXT,
  -- 카드 정보 (마스킹)
  card_company TEXT,
  card_number TEXT, -- 마스킹된 번호
  installment_months INTEGER,
  -- 영수증
  receipt_url TEXT,
  -- 취소/환불 정보
  cancel_reason TEXT,
  cancelled_at TIMESTAMPTZ,
  refund_amount INTEGER,
  refunded_at TIMESTAMPTZ,
  -- 메타데이터
  metadata JSONB,
  -- 타임스탬프
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스
CREATE INDEX payments_user_id_idx ON public.payments(user_id);
CREATE INDEX payments_order_id_idx ON public.payments(order_id);
CREATE INDEX payments_payment_key_idx ON public.payments(payment_key);
CREATE INDEX payments_status_idx ON public.payments(status);
CREATE INDEX payments_created_at_idx ON public.payments(created_at DESC);

-- RLS 정책
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage payments" ON public.payments
  FOR ALL USING (TRUE);

CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 3. 플랜별 기능 제한
-- ============================================
CREATE TABLE IF NOT EXISTS public.plan_limits (
  plan_id TEXT PRIMARY KEY,
  backtest_per_month INTEGER,
  live_strategies INTEGER,
  data_access TEXT NOT NULL DEFAULT 'basic',
  support_level TEXT NOT NULL DEFAULT 'community',
  team_members INTEGER DEFAULT 1
);

INSERT INTO public.plan_limits (plan_id, backtest_per_month, live_strategies, data_access, support_level, team_members) VALUES
  ('free', 10, 1, 'basic', 'community', 1),
  ('starter', 100, 3, 'basic', 'email', 1),
  ('pro', NULL, NULL, 'realtime', 'priority', 1),
  ('team', NULL, NULL, 'premium', 'priority', 5)
ON CONFLICT (plan_id) DO UPDATE SET
  backtest_per_month = EXCLUDED.backtest_per_month,
  live_strategies = EXCLUDED.live_strategies,
  data_access = EXCLUDED.data_access,
  support_level = EXCLUDED.support_level,
  team_members = EXCLUDED.team_members;

-- ============================================
-- 4. 구독 생성/갱신 함수
-- ============================================
CREATE OR REPLACE FUNCTION activate_subscription(
  p_user_id UUID,
  p_plan_id TEXT,
  p_billing_cycle TEXT,
  p_payment_method TEXT DEFAULT 'card'
)
RETURNS UUID AS $$
DECLARE
  v_subscription_id UUID;
  v_period_days INTEGER;
BEGIN
  -- 기간 계산
  v_period_days := CASE WHEN p_billing_cycle = 'yearly' THEN 365 ELSE 30 END;

  -- Upsert 구독
  INSERT INTO public.subscriptions (
    user_id, plan_id, billing_cycle, status,
    current_period_start, current_period_end,
    payment_method, last_payment_at, next_payment_at
  ) VALUES (
    p_user_id, p_plan_id, p_billing_cycle, 'active',
    NOW(), NOW() + (v_period_days || ' days')::INTERVAL,
    p_payment_method, NOW(), NOW() + (v_period_days || ' days')::INTERVAL
  )
  ON CONFLICT (user_id) DO UPDATE SET
    plan_id = p_plan_id,
    billing_cycle = p_billing_cycle,
    status = 'active',
    current_period_start = NOW(),
    current_period_end = NOW() + (v_period_days || ' days')::INTERVAL,
    payment_method = p_payment_method,
    last_payment_at = NOW(),
    next_payment_at = NOW() + (v_period_days || ' days')::INTERVAL,
    cancel_at_period_end = FALSE,
    updated_at = NOW()
  RETURNING id INTO v_subscription_id;

  -- 프로필 역할 업데이트
  UPDATE public.profiles
  SET role = CASE
    WHEN p_plan_id = 'free' THEN 'free'
    WHEN p_plan_id IN ('starter', 'pro', 'team') THEN 'enrolled'
    ELSE role
  END,
  updated_at = NOW()
  WHERE id = p_user_id;

  RETURN v_subscription_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. 구독 취소 함수
-- ============================================
CREATE OR REPLACE FUNCTION cancel_subscription(
  p_user_id UUID,
  p_immediate BOOLEAN DEFAULT FALSE
)
RETURNS BOOLEAN AS $$
BEGIN
  IF p_immediate THEN
    -- 즉시 취소
    UPDATE public.subscriptions
    SET status = 'cancelled',
        cancel_at_period_end = FALSE,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    -- 프로필 역할 다운그레이드
    UPDATE public.profiles
    SET role = 'free',
        updated_at = NOW()
    WHERE id = p_user_id;
  ELSE
    -- 기간 종료 시 취소 예약
    UPDATE public.subscriptions
    SET cancel_at_period_end = TRUE,
        updated_at = NOW()
    WHERE user_id = p_user_id;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. 만료된 구독 처리 함수
-- ============================================
CREATE OR REPLACE FUNCTION process_expired_subscriptions()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- 취소 예약된 구독 중 기간이 끝난 것들 처리
  UPDATE public.subscriptions
  SET status = 'expired',
      plan_id = 'free',
      billing_cycle = NULL,
      updated_at = NOW()
  WHERE cancel_at_period_end = TRUE
    AND current_period_end < NOW()
    AND status = 'active';

  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- 해당 사용자 역할도 다운그레이드
  UPDATE public.profiles p
  SET role = 'free',
      updated_at = NOW()
  FROM public.subscriptions s
  WHERE p.id = s.user_id
    AND s.status = 'expired';

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. 결제 기록 함수
-- ============================================
CREATE OR REPLACE FUNCTION record_payment(
  p_user_id UUID,
  p_order_id TEXT,
  p_payment_key TEXT,
  p_amount INTEGER,
  p_status TEXT,
  p_order_name TEXT,
  p_plan_id TEXT DEFAULT NULL,
  p_billing_cycle TEXT DEFAULT NULL,
  p_payment_method TEXT DEFAULT 'card',
  p_card_company TEXT DEFAULT NULL,
  p_card_number TEXT DEFAULT NULL,
  p_receipt_url TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_payment_id UUID;
BEGIN
  INSERT INTO public.payments (
    user_id, order_id, payment_key, amount, status,
    order_name, plan_id, billing_cycle, payment_method,
    card_company, card_number, receipt_url, metadata,
    approved_at
  ) VALUES (
    p_user_id, p_order_id, p_payment_key, p_amount, p_status,
    p_order_name, p_plan_id, p_billing_cycle, p_payment_method,
    p_card_company, p_card_number, p_receipt_url, p_metadata,
    CASE WHEN p_status = 'completed' THEN NOW() ELSE NULL END
  )
  ON CONFLICT (order_id) DO UPDATE SET
    payment_key = COALESCE(p_payment_key, payments.payment_key),
    status = p_status,
    payment_method = COALESCE(p_payment_method, payments.payment_method),
    card_company = COALESCE(p_card_company, payments.card_company),
    card_number = COALESCE(p_card_number, payments.card_number),
    receipt_url = COALESCE(p_receipt_url, payments.receipt_url),
    approved_at = CASE WHEN p_status = 'completed' THEN NOW() ELSE payments.approved_at END,
    updated_at = NOW()
  RETURNING id INTO v_payment_id;

  -- 결제 완료 시 구독 활성화
  IF p_status = 'completed' AND p_plan_id IS NOT NULL THEN
    PERFORM activate_subscription(p_user_id, p_plan_id, p_billing_cycle, p_payment_method);
  END IF;

  RETURN v_payment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 8. 결제 취소/환불 함수
-- ============================================
CREATE OR REPLACE FUNCTION cancel_payment(
  p_payment_key TEXT,
  p_cancel_reason TEXT,
  p_refund_amount INTEGER DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.payments
  SET status = CASE WHEN p_refund_amount IS NOT NULL THEN 'refunded' ELSE 'cancelled' END,
      cancel_reason = p_cancel_reason,
      cancelled_at = NOW(),
      refund_amount = p_refund_amount,
      refunded_at = CASE WHEN p_refund_amount IS NOT NULL THEN NOW() ELSE NULL END,
      updated_at = NOW()
  WHERE payment_key = p_payment_key;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 9. 사용자 기본 구독 생성 트리거
-- ============================================
CREATE OR REPLACE FUNCTION create_default_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, plan_id, status)
  VALUES (NEW.id, 'free', 'active')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_created_subscription
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION create_default_subscription();

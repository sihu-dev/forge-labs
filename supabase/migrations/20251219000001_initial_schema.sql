-- ============================================
-- HEPHAITOS - Initial Database Schema
-- Supabase PostgreSQL Migration
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1. PROFILES (사용자 프로필)
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'free' CHECK (role IN ('visitor', 'free', 'enrolled', 'builder', 'mentor')),
  mentor_id UUID REFERENCES public.profiles(id),
  credits INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS 정책
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 자동 updated_at 트리거
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auth 사용자 생성 시 프로필 자동 생성
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- 2. STRATEGIES (전략)
-- ============================================
CREATE TABLE IF NOT EXISTS public.strategies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  config JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스
CREATE INDEX strategies_user_id_idx ON public.strategies(user_id);
CREATE INDEX strategies_status_idx ON public.strategies(status);

-- RLS 정책
ALTER TABLE public.strategies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own strategies" ON public.strategies
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own strategies" ON public.strategies
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own strategies" ON public.strategies
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own strategies" ON public.strategies
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER strategies_updated_at
  BEFORE UPDATE ON public.strategies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 3. BACKTEST_RESULTS (백테스트 결과)
-- ============================================
CREATE TABLE IF NOT EXISTS public.backtest_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  strategy_id UUID NOT NULL REFERENCES public.strategies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  config JSONB NOT NULL DEFAULT '{}',
  metrics JSONB NOT NULL DEFAULT '{}',
  equity_curve JSONB,
  trades JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  error_message TEXT,
  credits_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- 인덱스
CREATE INDEX backtest_results_user_id_idx ON public.backtest_results(user_id);
CREATE INDEX backtest_results_strategy_id_idx ON public.backtest_results(strategy_id);
CREATE INDEX backtest_results_status_idx ON public.backtest_results(status);
CREATE INDEX backtest_results_created_at_idx ON public.backtest_results(created_at DESC);

-- RLS 정책
ALTER TABLE public.backtest_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own backtest results" ON public.backtest_results
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own backtest results" ON public.backtest_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own backtest results" ON public.backtest_results
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- 4. CREDIT_TRANSACTIONS (크레딧 거래)
-- ============================================
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'usage', 'bonus', 'refund')),
  amount INTEGER NOT NULL,
  description TEXT NOT NULL,
  balance INTEGER NOT NULL,
  reference_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스
CREATE INDEX credit_transactions_user_id_idx ON public.credit_transactions(user_id);
CREATE INDEX credit_transactions_created_at_idx ON public.credit_transactions(created_at DESC);

-- RLS 정책
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credit transactions" ON public.credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- 크레딧 사용 함수 (원자적)
CREATE OR REPLACE FUNCTION use_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_description TEXT,
  p_reference_id TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- 현재 잔액 조회 (락)
  SELECT credits INTO v_current_balance
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  -- 잔액 부족 시 실패
  IF v_current_balance < p_amount THEN
    RETURN FALSE;
  END IF;

  -- 새 잔액 계산
  v_new_balance := v_current_balance - p_amount;

  -- 프로필 업데이트
  UPDATE public.profiles
  SET credits = v_new_balance
  WHERE id = p_user_id;

  -- 거래 내역 기록
  INSERT INTO public.credit_transactions (user_id, type, amount, description, balance, reference_id)
  VALUES (p_user_id, 'usage', -p_amount, p_description, v_new_balance, p_reference_id);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 크레딧 충전 함수
CREATE OR REPLACE FUNCTION add_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_type TEXT,
  p_description TEXT,
  p_reference_id TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- 현재 잔액 조회 (락)
  SELECT credits INTO v_current_balance
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  -- 새 잔액 계산
  v_new_balance := v_current_balance + p_amount;

  -- 프로필 업데이트
  UPDATE public.profiles
  SET credits = v_new_balance
  WHERE id = p_user_id;

  -- 거래 내역 기록
  INSERT INTO public.credit_transactions (user_id, type, amount, description, balance, reference_id)
  VALUES (p_user_id, p_type, p_amount, p_description, v_new_balance, p_reference_id);

  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. AGENTS (에이전트)
-- ============================================
CREATE TABLE IF NOT EXISTS public.agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  strategy_id UUID NOT NULL REFERENCES public.strategies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'stopped' CHECK (status IN ('stopped', 'starting', 'running', 'stopping', 'error')),
  config JSONB NOT NULL DEFAULT '{}',
  last_heartbeat TIMESTAMPTZ,
  error_message TEXT,
  credits_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스
CREATE INDEX agents_user_id_idx ON public.agents(user_id);
CREATE INDEX agents_status_idx ON public.agents(status);

-- RLS 정책
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own agents" ON public.agents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own agents" ON public.agents
  FOR ALL USING (auth.uid() = user_id);

CREATE TRIGGER agents_updated_at
  BEFORE UPDATE ON public.agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- GRANT PERMISSIONS
-- ============================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE public.profiles IS 'User profiles with role and credit balance';
COMMENT ON TABLE public.strategies IS 'Trading strategies created by users';
COMMENT ON TABLE public.backtest_results IS 'Backtest execution results';
COMMENT ON TABLE public.credit_transactions IS 'Credit transaction history';
COMMENT ON TABLE public.agents IS 'Trading agents running strategies';

/**
 * Create missing Supabase tables
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://demwsktllidwsxahqyvd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbXdza3RsbGlkd3N4YWhxeXZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjAzOTE2MiwiZXhwIjoyMDc3NjE1MTYyfQ.gwymDfSe4JckDrB87ASsflJaKo4EMer4PV-qN6yjX8c'
);

// Since we can't execute raw SQL via REST API,
// output the SQL that needs to be run in Supabase Dashboard

const sql = `
-- ============================================
-- 4. CREDIT_TRANSACTIONS (크레딧 거래)
-- ============================================
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'usage', 'bonus', 'refund')),
  amount INTEGER NOT NULL,
  description TEXT NOT NULL,
  balance INTEGER NOT NULL,
  reference_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS credit_transactions_user_id_idx ON public.credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS credit_transactions_created_at_idx ON public.credit_transactions(created_at DESC);

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own credit transactions" ON public.credit_transactions;
CREATE POLICY "Users can view own credit transactions" ON public.credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- 5. AGENTS (에이전트)
-- ============================================
CREATE TABLE IF NOT EXISTS public.agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

CREATE INDEX IF NOT EXISTS agents_user_id_idx ON public.agents(user_id);
CREATE INDEX IF NOT EXISTS agents_status_idx ON public.agents(status);

ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own agents" ON public.agents;
CREATE POLICY "Users can view own agents" ON public.agents
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own agents" ON public.agents;
CREATE POLICY "Users can manage own agents" ON public.agents
  FOR ALL USING (auth.uid() = user_id);
`;

console.log('='.repeat(60));
console.log('다음 SQL을 Supabase Dashboard > SQL Editor에서 실행하세요:');
console.log('https://supabase.com/dashboard/project/demwsktllidwsxahqyvd/sql/new');
console.log('='.repeat(60));
console.log(sql);

-- Lead Management Tables
-- BIDFLOW 리드 관리 시스템

-- ============================================================================
-- 1. Leads Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 입찰 연결
  bid_id UUID REFERENCES bids(id) ON DELETE SET NULL,

  -- 기본 정보
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  title TEXT,
  phone TEXT,
  linkedin_url TEXT,

  -- 조직 정보
  organization TEXT NOT NULL,
  department TEXT,

  -- 스코어링
  score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),

  -- 소스
  source TEXT DEFAULT 'bidflow', -- apollo, persana, manual, import
  verified BOOLEAN DEFAULT false,

  -- 강화 데이터
  signals JSONB DEFAULT '[]'::jsonb,
  enrichment_data JSONB DEFAULT '{}'::jsonb,
  enriched_at TIMESTAMPTZ,

  -- CRM 동기화
  crm_id TEXT,
  crm_provider TEXT, -- attio, hubspot
  crm_synced_at TIMESTAMPTZ,

  -- 딜 정보
  deal_created BOOLEAN DEFAULT false,
  deal_id TEXT,
  deal_created_at TIMESTAMPTZ,

  -- 아웃리치
  sequence_id TEXT,
  sequence_added_at TIMESTAMPTZ,
  last_contact_at TIMESTAMPTZ,

  -- 상태
  status TEXT DEFAULT 'new', -- new, contacted, qualified, converted, lost
  stage TEXT DEFAULT 'lead', -- lead, opportunity, proposal, negotiation
  priority TEXT DEFAULT 'medium', -- low, medium, high

  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(email)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_bid_id ON leads(bid_id);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_organization ON leads(organization);
CREATE INDEX IF NOT EXISTS idx_leads_score ON leads(score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);

-- RLS 정책
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own leads"
  ON leads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own leads"
  ON leads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own leads"
  ON leads FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own leads"
  ON leads FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 2. Lead Activities Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS lead_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 활동 정보
  type TEXT NOT NULL, -- email, call, meeting, note, status_change
  title TEXT NOT NULL,
  description TEXT,

  -- 메타데이터
  metadata JSONB DEFAULT '{}'::jsonb,

  -- 타임스탬프
  occurred_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_id ON lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_type ON lead_activities(type);
CREATE INDEX IF NOT EXISTS idx_lead_activities_occurred_at ON lead_activities(occurred_at DESC);

-- RLS 정책
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view activities for their leads"
  ON lead_activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM leads
      WHERE leads.id = lead_activities.lead_id
      AND leads.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert activities for their leads"
  ON lead_activities FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM leads
      WHERE leads.id = lead_activities.lead_id
      AND leads.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 3. Lead Sequences Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS lead_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 시퀀스 정보
  name TEXT NOT NULL,
  description TEXT,

  -- 외부 시퀀스 ID (Apollo 등)
  external_id TEXT,
  external_provider TEXT, -- apollo, custom

  -- 통계
  total_leads INTEGER DEFAULT 0,
  active_leads INTEGER DEFAULT 0,
  completed_leads INTEGER DEFAULT 0,

  -- 상태
  is_active BOOLEAN DEFAULT true,

  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_lead_sequences_user_id ON lead_sequences(user_id);
CREATE INDEX IF NOT EXISTS idx_lead_sequences_is_active ON lead_sequences(is_active);

-- RLS 정책
ALTER TABLE lead_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own sequences"
  ON lead_sequences FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================================
-- 4. Views
-- ============================================================================

-- 리드 통계 뷰
CREATE OR REPLACE VIEW lead_stats AS
SELECT
  user_id,
  COUNT(*) as total_leads,
  COUNT(*) FILTER (WHERE status = 'new') as new_leads,
  COUNT(*) FILTER (WHERE status = 'contacted') as contacted_leads,
  COUNT(*) FILTER (WHERE status = 'qualified') as qualified_leads,
  COUNT(*) FILTER (WHERE status = 'converted') as converted_leads,
  AVG(score) as avg_score,
  COUNT(*) FILTER (WHERE score >= 70) as high_score_leads,
  COUNT(*) FILTER (WHERE crm_synced_at IS NOT NULL) as synced_leads,
  COUNT(*) FILTER (WHERE deal_created = true) as deals_created
FROM leads
GROUP BY user_id;

-- ============================================================================
-- 5. Functions
-- ============================================================================

-- 리드 스코어 업데이트 함수
CREATE OR REPLACE FUNCTION update_lead_score(
  p_lead_id UUID,
  p_new_score INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE leads
  SET
    score = p_new_score,
    updated_at = NOW()
  WHERE id = p_lead_id;

  -- 활동 기록
  INSERT INTO lead_activities (lead_id, user_id, type, title, description, metadata)
  SELECT
    p_lead_id,
    user_id,
    'status_change',
    'Score Updated',
    'Lead score updated to ' || p_new_score,
    jsonb_build_object('old_score', score, 'new_score', p_new_score)
  FROM leads
  WHERE id = p_lead_id;
END;
$$;

-- 리드 상태 변경 함수
CREATE OR REPLACE FUNCTION update_lead_status(
  p_lead_id UUID,
  p_new_status TEXT,
  p_note TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE leads
  SET
    status = p_new_status,
    updated_at = NOW()
  WHERE id = p_lead_id;

  -- 활동 기록
  INSERT INTO lead_activities (lead_id, user_id, type, title, description)
  SELECT
    p_lead_id,
    user_id,
    'status_change',
    'Status Changed',
    COALESCE(p_note, 'Status changed to ' || p_new_status)
  FROM leads
  WHERE id = p_lead_id;
END;
$$;

-- ============================================================================
-- 6. Triggers
-- ============================================================================

-- updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lead_sequences_updated_at
  BEFORE UPDATE ON lead_sequences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

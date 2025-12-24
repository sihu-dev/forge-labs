-- =====================================================
-- FORGE LABS AUTOMATION SYSTEM MIGRATION
-- =====================================================
-- Created: 2024-12-24
-- Purpose: Lead management, campaign automation, cross-sell opportunities
-- Apps: BIDFLOW, HEPHAITOS, DRYON, FOLIO, ADE
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search optimization

-- =====================================================
-- ENUMS
-- =====================================================

-- Lead source types
CREATE TYPE lead_source AS ENUM (
  'bidflow_bid',           -- BIDFLOW 입찰 참여자
  'hephaitos_youtube',     -- HEPHAITOS 유튜브 채널
  'dryon_demo',            -- DRYON 데모 신청
  'folio_trial',           -- FOLIO 무료 체험
  'ade_waitlist',          -- ADE 대기자
  'referral',              -- 추천
  'inbound',               -- 인바운드 (웹사이트)
  'outbound',              -- 아웃바운드 (콜드 이메일)
  'event',                 -- 행사/웨비나
  'manual'                 -- 수동 등록
);

-- Lead status
CREATE TYPE lead_status AS ENUM (
  'new',                   -- 신규
  'contacted',             -- 접촉 완료
  'qualified',             -- 검증 완료
  'nurturing',             -- 육성 중
  'opportunity',           -- 기회 전환
  'converted',             -- 고객 전환
  'lost',                  -- 손실
  'disqualified'           -- 부적격
);

-- Lead tier (quality)
CREATE TYPE lead_tier AS ENUM (
  'hot',                   -- 즉시 전환 가능 (90+ 점수)
  'warm',                  -- 관심 높음 (70-89)
  'cold',                  -- 관심 낮음 (50-69)
  'ice'                    -- 장기 육성 (0-49)
);

-- Company size
CREATE TYPE company_size AS ENUM (
  'startup',               -- 1-10명
  'small',                 -- 11-50명
  'medium',                -- 51-200명
  'large',                 -- 201-1000명
  'enterprise'             -- 1000명 이상
);

-- Funding stage
CREATE TYPE funding_stage AS ENUM (
  'bootstrapped',
  'pre_seed',
  'seed',
  'series_a',
  'series_b',
  'series_c_plus',
  'ipo',
  'acquired'
);

-- Campaign type
CREATE TYPE campaign_type AS ENUM (
  'email',
  'linkedin',
  'webinar',
  'content',
  'cross_sell',
  'reactivation',
  'nurture'
);

-- Campaign status
CREATE TYPE campaign_status AS ENUM (
  'draft',
  'scheduled',
  'active',
  'paused',
  'completed',
  'archived'
);

-- Sequence type
CREATE TYPE sequence_type AS ENUM (
  'email',
  'linkedin',
  'multi_channel',
  'follow_up'
);

-- Activity type
CREATE TYPE activity_type AS ENUM (
  'email_sent',
  'email_opened',
  'email_clicked',
  'email_replied',
  'linkedin_connection',
  'linkedin_message',
  'call_made',
  'call_connected',
  'meeting_booked',
  'demo_completed',
  'contract_sent',
  'note_added',
  'status_changed'
);

-- Activity outcome
CREATE TYPE activity_outcome AS ENUM (
  'success',
  'failed',
  'pending',
  'bounced',
  'unsubscribed',
  'spam_reported'
);

-- Workflow status
CREATE TYPE workflow_status AS ENUM (
  'active',
  'paused',
  'error',
  'archived'
);

-- Cross-sell type
CREATE TYPE cross_sell_type AS ENUM (
  'bidflow_to_hephaitos',     -- 입찰자 → 트레이딩 교육
  'hephaitos_to_bidflow',     -- 트레이더 → 입찰 시스템
  'dryon_to_folio',           -- 기후 AI → 재고 최적화
  'folio_to_dryon',           -- 재고 관리 → 에너지 절감
  'any_to_ade'                -- 모든 플랫폼 → AI 개발
);

-- Cross-sell status
CREATE TYPE cross_sell_status AS ENUM (
  'identified',               -- 기회 식별
  'contacted',                -- 접촉 시도
  'pitched',                  -- 제안 완료
  'trial',                    -- 체험 중
  'converted',                -- 전환 완료
  'rejected'                  -- 거절
);

-- =====================================================
-- TABLE: companies
-- =====================================================

CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Basic info
  name TEXT NOT NULL,
  domain TEXT UNIQUE,
  industry TEXT,
  size company_size,
  employee_count INTEGER,

  -- Business info
  tech_stack TEXT[],                    -- ['Next.js', 'Supabase', 'Python']
  funding_stage funding_stage,
  total_funding_usd BIGINT,

  -- Location
  country TEXT,
  city TEXT,
  timezone TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,   -- LinkedIn URL, website, social links

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE: leads
-- =====================================================

CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Source tracking
  source lead_source NOT NULL,
  status lead_status DEFAULT 'new',
  tier lead_tier DEFAULT 'cold',
  score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),

  -- Personal info
  email TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  linkedin_url TEXT,
  job_title TEXT,

  -- Company relation
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  company_name TEXT,                     -- Denormalized for quick access
  company_domain TEXT,

  -- Cross-platform tracking
  bidflow_bid_id UUID,                   -- BIDFLOW 입찰 ID
  hephaitos_channel_id UUID,             -- HEPHAITOS 채널 ID
  dryon_demo_id UUID,                    -- DRYON 데모 신청 ID
  folio_trial_id UUID,                   -- FOLIO 체험 ID
  ade_waitlist_id UUID,                  -- ADE 대기자 ID

  -- Enrichment data (from Apollo, Clearbit, etc)
  enrichment_data JSONB DEFAULT '{}'::jsonb,
  -- Example: {
  --   "apollo": { "person_id": "...", "seniority": "manager" },
  --   "clearbit": { "employment_role": "engineering" },
  --   "linkedin": { "connections": 500, "premium": true }
  -- }

  -- Engagement tracking
  last_contacted_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ,
  engagement_score INTEGER DEFAULT 0,    -- Calculated from activities

  -- Ownership
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  team_id UUID,                          -- For multi-tenant support

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE: campaigns
-- =====================================================

CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Basic info
  name TEXT NOT NULL,
  description TEXT,
  type campaign_type NOT NULL,
  status campaign_status DEFAULT 'draft',

  -- Schedule
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,

  -- Targeting
  target_segments JSONB DEFAULT '[]'::jsonb,
  -- Example: [
  --   { "source": "bidflow_bid", "tier": "hot" },
  --   { "company_size": ["startup", "small"], "industry": "construction" }
  -- ]

  -- Metrics
  metrics JSONB DEFAULT '{}'::jsonb,
  -- Example: {
  --   "sent": 1000,
  --   "opened": 350,
  --   "clicked": 120,
  --   "replied": 45,
  --   "converted": 12,
  --   "open_rate": 0.35,
  --   "click_rate": 0.12,
  --   "reply_rate": 0.045,
  --   "conversion_rate": 0.012
  -- }

  -- Settings
  settings JSONB DEFAULT '{}'::jsonb,
  -- Example: {
  --   "send_window": { "start": "09:00", "end": "17:00", "timezone": "Asia/Seoul" },
  --   "daily_limit": 100,
  --   "auto_pause_on_bounce_rate": 0.05
  -- }

  -- Ownership
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE: sequences
-- =====================================================

CREATE TABLE sequences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Basic info
  name TEXT NOT NULL,
  description TEXT,
  type sequence_type NOT NULL,
  status campaign_status DEFAULT 'draft',

  -- Campaign relation (optional)
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,

  -- Steps definition
  steps JSONB DEFAULT '[]'::jsonb,
  -- Example: [
  --   {
  --     "step": 1,
  --     "type": "email",
  --     "delay_days": 0,
  --     "subject": "안녕하세요 {{first_name}}님",
  --     "template_id": "uuid",
  --     "conditions": { "if_not_replied": true }
  --   },
  --   {
  --     "step": 2,
  --     "type": "linkedin",
  --     "delay_days": 3,
  --     "message": "...",
  --     "conditions": { "if_email_opened": true }
  --   }
  -- ]

  -- Settings
  settings JSONB DEFAULT '{}'::jsonb,
  -- Example: {
  --   "auto_stop_on_reply": true,
  --   "max_active_leads": 500,
  --   "working_hours": { "start": "09:00", "end": "18:00" }
  -- }

  -- Stats
  total_enrolled INTEGER DEFAULT 0,
  total_completed INTEGER DEFAULT 0,
  total_converted INTEGER DEFAULT 0,

  -- Ownership
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE: activities
-- =====================================================

CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Activity type
  type activity_type NOT NULL,

  -- Relations
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  sequence_id UUID REFERENCES sequences(id) ON DELETE SET NULL,

  -- Activity data
  data JSONB DEFAULT '{}'::jsonb,
  -- Example for email_sent: {
  --   "subject": "...",
  --   "template_id": "uuid",
  --   "sent_at": "2024-12-24T10:00:00Z"
  -- }
  -- Example for meeting_booked: {
  --   "calendar_event_id": "...",
  --   "scheduled_at": "2024-12-30T14:00:00Z",
  --   "duration_minutes": 30
  -- }

  -- Outcome
  outcome activity_outcome DEFAULT 'pending',
  outcome_details TEXT,                  -- Error message, bounce reason, etc

  -- Automation tracking
  performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_automated BOOLEAN DEFAULT false,
  workflow_id UUID,                      -- n8n workflow ID if automated

  -- Timing
  activity_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE: workflows
-- =====================================================

CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- n8n integration
  n8n_workflow_id TEXT UNIQUE,           -- n8n의 실제 workflow ID
  n8n_webhook_url TEXT,                  -- Trigger webhook URL

  -- Basic info
  name TEXT NOT NULL,
  description TEXT,
  status workflow_status DEFAULT 'active',

  -- Trigger configuration
  trigger_config JSONB DEFAULT '{}'::jsonb,
  -- Example: {
  --   "type": "lead_created",
  --   "conditions": { "source": "bidflow_bid", "tier": "hot" },
  --   "actions": [
  --     { "type": "enrich_lead", "provider": "apollo" },
  --     { "type": "add_to_sequence", "sequence_id": "uuid" },
  --     { "type": "notify_slack", "channel": "#sales" }
  --   ]
  -- }

  -- Execution stats
  execution_stats JSONB DEFAULT '{}'::jsonb,
  -- Example: {
  --   "total_executions": 1234,
  --   "success_count": 1200,
  --   "error_count": 34,
  --   "avg_duration_ms": 1234,
  --   "last_executed_at": "2024-12-24T10:00:00Z"
  -- }

  -- Error handling
  last_error TEXT,
  last_error_at TIMESTAMPTZ,

  -- Ownership
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE: cross_sell_opportunities
-- =====================================================

CREATE TABLE cross_sell_opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Opportunity type
  type cross_sell_type NOT NULL,

  -- Source tracking
  source_platform TEXT NOT NULL,         -- 'bidflow', 'hephaitos', 'dryon', 'folio', 'ade'
  source_user_id UUID,                   -- User ID in source platform
  target_platform TEXT NOT NULL,

  -- Lead relation
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,

  -- Scoring
  score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  signals JSONB DEFAULT '[]'::jsonb,
  -- Example: [
  --   { "signal": "high_engagement", "weight": 30, "details": "5+ logins/week" },
  --   { "signal": "budget_indicator", "weight": 25, "details": "Enterprise plan" },
  --   { "signal": "role_fit", "weight": 20, "details": "CTO/Technical Lead" }
  -- ]

  -- Status tracking
  status cross_sell_status DEFAULT 'identified',

  -- Campaign relation (if part of automated campaign)
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,

  -- Outcome
  converted_at TIMESTAMPTZ,
  conversion_value_usd DECIMAL(10, 2),
  rejection_reason TEXT,

  -- Notes
  notes TEXT,

  -- Ownership
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  team_id UUID,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Companies indexes
CREATE INDEX idx_companies_domain ON companies(domain);
CREATE INDEX idx_companies_industry ON companies(industry);
CREATE INDEX idx_companies_size ON companies(size);

-- Leads indexes
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_company_id ON leads(company_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_tier ON leads(tier);
CREATE INDEX idx_leads_source ON leads(source);
CREATE INDEX idx_leads_owner_id ON leads(owner_id);
CREATE INDEX idx_leads_team_id ON leads(team_id);
CREATE INDEX idx_leads_score ON leads(score DESC);
CREATE INDEX idx_leads_last_activity ON leads(last_activity_at DESC NULLS LAST);
CREATE INDEX idx_leads_company_domain ON leads(company_domain);

-- Composite indexes for common queries
CREATE INDEX idx_leads_status_tier ON leads(status, tier);
CREATE INDEX idx_leads_source_status ON leads(source, status);

-- Text search indexes
CREATE INDEX idx_leads_name_trgm ON leads USING gin((first_name || ' ' || last_name) gin_trgm_ops);
CREATE INDEX idx_companies_name_trgm ON companies USING gin(name gin_trgm_ops);

-- Cross-platform tracking indexes
CREATE INDEX idx_leads_bidflow_bid_id ON leads(bidflow_bid_id) WHERE bidflow_bid_id IS NOT NULL;
CREATE INDEX idx_leads_hephaitos_channel_id ON leads(hephaitos_channel_id) WHERE hephaitos_channel_id IS NOT NULL;

-- JSONB indexes for enrichment data
CREATE INDEX idx_leads_enrichment_data ON leads USING gin(enrichment_data);

-- Campaigns indexes
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_type ON campaigns(type);
CREATE INDEX idx_campaigns_owner_id ON campaigns(owner_id);
CREATE INDEX idx_campaigns_team_id ON campaigns(team_id);
CREATE INDEX idx_campaigns_dates ON campaigns(start_date, end_date);

-- Sequences indexes
CREATE INDEX idx_sequences_status ON sequences(status);
CREATE INDEX idx_sequences_type ON sequences(type);
CREATE INDEX idx_sequences_campaign_id ON sequences(campaign_id);
CREATE INDEX idx_sequences_owner_id ON sequences(owner_id);

-- Activities indexes
CREATE INDEX idx_activities_lead_id ON activities(lead_id);
CREATE INDEX idx_activities_company_id ON activities(company_id);
CREATE INDEX idx_activities_type ON activities(type);
CREATE INDEX idx_activities_activity_at ON activities(activity_at DESC);
CREATE INDEX idx_activities_campaign_id ON activities(campaign_id);
CREATE INDEX idx_activities_sequence_id ON activities(sequence_id);
CREATE INDEX idx_activities_outcome ON activities(outcome);

-- Composite indexes for activity queries
CREATE INDEX idx_activities_lead_type ON activities(lead_id, type);
CREATE INDEX idx_activities_type_outcome ON activities(type, outcome);

-- Workflows indexes
CREATE INDEX idx_workflows_status ON workflows(status);
CREATE INDEX idx_workflows_n8n_id ON workflows(n8n_workflow_id);
CREATE INDEX idx_workflows_trigger ON workflows USING gin(trigger_config);

-- Cross-sell indexes
CREATE INDEX idx_cross_sell_type ON cross_sell_opportunities(type);
CREATE INDEX idx_cross_sell_status ON cross_sell_opportunities(status);
CREATE INDEX idx_cross_sell_lead_id ON cross_sell_opportunities(lead_id);
CREATE INDEX idx_cross_sell_score ON cross_sell_opportunities(score DESC);
CREATE INDEX idx_cross_sell_platforms ON cross_sell_opportunities(source_platform, target_platform);
CREATE INDEX idx_cross_sell_campaign_id ON cross_sell_opportunities(campaign_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE cross_sell_opportunities ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES: companies
-- =====================================================

-- Anyone can view companies (public data)
CREATE POLICY "Companies are viewable by authenticated users"
  ON companies FOR SELECT
  TO authenticated
  USING (true);

-- Only team members can insert/update companies
CREATE POLICY "Companies are insertable by team members"
  ON companies FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Companies are updatable by team members"
  ON companies FOR UPDATE
  TO authenticated
  USING (true);

-- =====================================================
-- RLS POLICIES: leads
-- =====================================================

-- Users can view leads in their team or owned by them
CREATE POLICY "Leads are viewable by team members"
  ON leads FOR SELECT
  TO authenticated
  USING (
    team_id IN (
      SELECT team_id FROM user_teams WHERE user_id = auth.uid()
    )
    OR owner_id = auth.uid()
  );

-- Users can insert leads for their team
CREATE POLICY "Leads are insertable by team members"
  ON leads FOR INSERT
  TO authenticated
  WITH CHECK (
    team_id IN (
      SELECT team_id FROM user_teams WHERE user_id = auth.uid()
    )
  );

-- Users can update leads they own or in their team
CREATE POLICY "Leads are updatable by owner or team members"
  ON leads FOR UPDATE
  TO authenticated
  USING (
    owner_id = auth.uid()
    OR team_id IN (
      SELECT team_id FROM user_teams WHERE user_id = auth.uid()
    )
  );

-- Only owners can delete leads
CREATE POLICY "Leads are deletable by owner"
  ON leads FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- =====================================================
-- RLS POLICIES: campaigns
-- =====================================================

-- Team members can view campaigns
CREATE POLICY "Campaigns are viewable by team members"
  ON campaigns FOR SELECT
  TO authenticated
  USING (
    team_id IN (
      SELECT team_id FROM user_teams WHERE user_id = auth.uid()
    )
    OR owner_id = auth.uid()
  );

-- Team members can create campaigns
CREATE POLICY "Campaigns are insertable by team members"
  ON campaigns FOR INSERT
  TO authenticated
  WITH CHECK (
    team_id IN (
      SELECT team_id FROM user_teams WHERE user_id = auth.uid()
    )
  );

-- Owners can update/delete campaigns
CREATE POLICY "Campaigns are updatable by owner"
  ON campaigns FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Campaigns are deletable by owner"
  ON campaigns FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- =====================================================
-- RLS POLICIES: sequences
-- =====================================================

-- Team members can view sequences
CREATE POLICY "Sequences are viewable by team members"
  ON sequences FOR SELECT
  TO authenticated
  USING (
    team_id IN (
      SELECT team_id FROM user_teams WHERE user_id = auth.uid()
    )
    OR owner_id = auth.uid()
  );

-- Team members can create sequences
CREATE POLICY "Sequences are insertable by team members"
  ON sequences FOR INSERT
  TO authenticated
  WITH CHECK (
    team_id IN (
      SELECT team_id FROM user_teams WHERE user_id = auth.uid()
    )
  );

-- Owners can update/delete sequences
CREATE POLICY "Sequences are updatable by owner"
  ON sequences FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Sequences are deletable by owner"
  ON sequences FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- =====================================================
-- RLS POLICIES: activities
-- =====================================================

-- Users can view activities for leads they have access to
CREATE POLICY "Activities are viewable by team members"
  ON activities FOR SELECT
  TO authenticated
  USING (
    lead_id IN (
      SELECT id FROM leads
      WHERE team_id IN (
        SELECT team_id FROM user_teams WHERE user_id = auth.uid()
      )
      OR owner_id = auth.uid()
    )
  );

-- Users can insert activities for leads they have access to
CREATE POLICY "Activities are insertable by team members"
  ON activities FOR INSERT
  TO authenticated
  WITH CHECK (
    lead_id IN (
      SELECT id FROM leads
      WHERE team_id IN (
        SELECT team_id FROM user_teams WHERE user_id = auth.uid()
      )
      OR owner_id = auth.uid()
    )
  );

-- Only creators can update their own activities
CREATE POLICY "Activities are updatable by creator"
  ON activities FOR UPDATE
  TO authenticated
  USING (performed_by = auth.uid());

-- =====================================================
-- RLS POLICIES: workflows
-- =====================================================

-- Team members can view workflows
CREATE POLICY "Workflows are viewable by team members"
  ON workflows FOR SELECT
  TO authenticated
  USING (
    team_id IN (
      SELECT team_id FROM user_teams WHERE user_id = auth.uid()
    )
    OR owner_id = auth.uid()
  );

-- Team members can create workflows
CREATE POLICY "Workflows are insertable by team members"
  ON workflows FOR INSERT
  TO authenticated
  WITH CHECK (
    team_id IN (
      SELECT team_id FROM user_teams WHERE user_id = auth.uid()
    )
  );

-- Owners can update/delete workflows
CREATE POLICY "Workflows are updatable by owner"
  ON workflows FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Workflows are deletable by owner"
  ON workflows FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- =====================================================
-- RLS POLICIES: cross_sell_opportunities
-- =====================================================

-- Team members can view opportunities
CREATE POLICY "Cross-sell opportunities are viewable by team members"
  ON cross_sell_opportunities FOR SELECT
  TO authenticated
  USING (
    team_id IN (
      SELECT team_id FROM user_teams WHERE user_id = auth.uid()
    )
    OR owner_id = auth.uid()
  );

-- Team members can create opportunities
CREATE POLICY "Cross-sell opportunities are insertable by team members"
  ON cross_sell_opportunities FOR INSERT
  TO authenticated
  WITH CHECK (
    team_id IN (
      SELECT team_id FROM user_teams WHERE user_id = auth.uid()
    )
  );

-- Team members can update opportunities
CREATE POLICY "Cross-sell opportunities are updatable by team members"
  ON cross_sell_opportunities FOR UPDATE
  TO authenticated
  USING (
    team_id IN (
      SELECT team_id FROM user_teams WHERE user_id = auth.uid()
    )
    OR owner_id = auth.uid()
  );

-- =====================================================
-- TRIGGERS: updated_at
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sequences_updated_at
  BEFORE UPDATE ON sequences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflows_updated_at
  BEFORE UPDATE ON workflows
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cross_sell_opportunities_updated_at
  BEFORE UPDATE ON cross_sell_opportunities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TRIGGERS: Lead scoring automation
-- =====================================================

-- Function to auto-calculate lead tier based on score
CREATE OR REPLACE FUNCTION auto_update_lead_tier()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.score >= 90 THEN
    NEW.tier := 'hot';
  ELSIF NEW.score >= 70 THEN
    NEW.tier := 'warm';
  ELSIF NEW.score >= 50 THEN
    NEW.tier := 'cold';
  ELSE
    NEW.tier := 'ice';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_lead_tier_on_score_change
  BEFORE INSERT OR UPDATE OF score ON leads
  FOR EACH ROW
  EXECUTE FUNCTION auto_update_lead_tier();

-- =====================================================
-- TRIGGERS: Activity tracking
-- =====================================================

-- Function to update lead's last_activity_at when activity is created
CREATE OR REPLACE FUNCTION update_lead_last_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE leads
  SET last_activity_at = NEW.activity_at
  WHERE id = NEW.lead_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_lead_activity_timestamp
  AFTER INSERT ON activities
  FOR EACH ROW
  WHEN (NEW.lead_id IS NOT NULL)
  EXECUTE FUNCTION update_lead_last_activity();

-- =====================================================
-- VIEWS: Analytics & Reporting
-- =====================================================

-- Lead pipeline view
CREATE OR REPLACE VIEW lead_pipeline AS
SELECT
  status,
  tier,
  source,
  COUNT(*) as count,
  AVG(score) as avg_score,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as new_this_week,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as new_this_month
FROM leads
GROUP BY status, tier, source;

-- Campaign performance view
CREATE OR REPLACE VIEW campaign_performance AS
SELECT
  c.id,
  c.name,
  c.type,
  c.status,
  (c.metrics->>'sent')::INTEGER as total_sent,
  (c.metrics->>'opened')::INTEGER as total_opened,
  (c.metrics->>'clicked')::INTEGER as total_clicked,
  (c.metrics->>'replied')::INTEGER as total_replied,
  (c.metrics->>'converted')::INTEGER as total_converted,
  ROUND((c.metrics->>'open_rate')::NUMERIC, 4) as open_rate,
  ROUND((c.metrics->>'click_rate')::NUMERIC, 4) as click_rate,
  ROUND((c.metrics->>'reply_rate')::NUMERIC, 4) as reply_rate,
  ROUND((c.metrics->>'conversion_rate')::NUMERIC, 4) as conversion_rate,
  c.created_at,
  c.start_date,
  c.end_date
FROM campaigns c;

-- Cross-sell funnel view
CREATE OR REPLACE VIEW cross_sell_funnel AS
SELECT
  type,
  source_platform,
  target_platform,
  status,
  COUNT(*) as count,
  AVG(score) as avg_score,
  SUM(CASE WHEN status = 'converted' THEN 1 ELSE 0 END) as converted_count,
  SUM(CASE WHEN status = 'converted' THEN conversion_value_usd ELSE 0 END) as total_revenue,
  ROUND(
    SUM(CASE WHEN status = 'converted' THEN 1 ELSE 0 END)::NUMERIC /
    NULLIF(COUNT(*), 0) * 100,
    2
  ) as conversion_rate
FROM cross_sell_opportunities
GROUP BY type, source_platform, target_platform, status;

-- Activity summary view
CREATE OR REPLACE VIEW activity_summary AS
SELECT
  l.id as lead_id,
  l.email,
  l.first_name,
  l.last_name,
  l.status,
  COUNT(a.id) as total_activities,
  COUNT(a.id) FILTER (WHERE a.type LIKE 'email%') as email_activities,
  COUNT(a.id) FILTER (WHERE a.type LIKE 'linkedin%') as linkedin_activities,
  COUNT(a.id) FILTER (WHERE a.type LIKE 'call%') as call_activities,
  MAX(a.activity_at) as last_activity_at
FROM leads l
LEFT JOIN activities a ON a.lead_id = l.id
GROUP BY l.id, l.email, l.first_name, l.last_name, l.status;

-- =====================================================
-- HELPER TABLE: user_teams (for RLS)
-- =====================================================
-- Note: This assumes you have a teams system in place
-- If not, you'll need to create it or modify RLS policies

CREATE TABLE IF NOT EXISTS user_teams (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID NOT NULL,
  role TEXT DEFAULT 'member', -- 'admin', 'member', 'viewer'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, team_id)
);

CREATE INDEX idx_user_teams_user_id ON user_teams(user_id);
CREATE INDEX idx_user_teams_team_id ON user_teams(team_id);

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE companies IS 'Company master data for B2B lead management';
COMMENT ON TABLE leads IS 'Lead/prospect tracking across all FORGE LABS platforms';
COMMENT ON TABLE campaigns IS 'Marketing and sales campaigns (email, LinkedIn, webinar, etc)';
COMMENT ON TABLE sequences IS 'Automated outbound sequences with multi-step follow-ups';
COMMENT ON TABLE activities IS 'All lead interactions and engagement tracking';
COMMENT ON TABLE workflows IS 'n8n workflow integrations for automation';
COMMENT ON TABLE cross_sell_opportunities IS 'Cross-platform upsell/cross-sell opportunities';

COMMENT ON COLUMN leads.score IS 'Lead quality score (0-100), auto-updates tier';
COMMENT ON COLUMN leads.tier IS 'Auto-calculated: hot(90+), warm(70-89), cold(50-69), ice(<50)';
COMMENT ON COLUMN leads.enrichment_data IS 'Third-party enrichment data (Apollo, Clearbit, LinkedIn)';
COMMENT ON COLUMN leads.bidflow_bid_id IS 'Link to BIDFLOW bid if lead came from there';
COMMENT ON COLUMN leads.hephaitos_channel_id IS 'Link to HEPHAITOS YouTube channel if applicable';

COMMENT ON COLUMN activities.is_automated IS 'True if activity was performed by automation (n8n, Zapier)';
COMMENT ON COLUMN activities.workflow_id IS 'n8n workflow ID if automated';

COMMENT ON COLUMN workflows.n8n_workflow_id IS 'External n8n workflow ID for integration';
COMMENT ON COLUMN workflows.trigger_config IS 'Webhook trigger configuration and conditions';

COMMENT ON COLUMN cross_sell_opportunities.signals IS 'Array of scoring signals with weights';
COMMENT ON COLUMN cross_sell_opportunities.score IS 'Opportunity quality score (0-100)';

-- =====================================================
-- SEED DATA (Optional - for development)
-- =====================================================

-- Insert sample company
INSERT INTO companies (name, domain, industry, size, tech_stack, funding_stage)
VALUES
  ('Acme Corp', 'acme.com', 'Construction', 'medium', ARRAY['SAP', 'Salesforce'], 'series_a'),
  ('TechStart Inc', 'techstart.io', 'SaaS', 'startup', ARRAY['Next.js', 'Supabase', 'Python'], 'seed')
ON CONFLICT (domain) DO NOTHING;

-- =====================================================
-- COMPLETION
-- =====================================================

-- Grant permissions for service role (for backend operations)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Grant limited permissions for authenticated users
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'FORGE LABS AUTOMATION SYSTEM MIGRATION COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Tables created: 7';
  RAISE NOTICE '  - companies (회사 마스터 데이터)';
  RAISE NOTICE '  - leads (리드 관리)';
  RAISE NOTICE '  - campaigns (캠페인)';
  RAISE NOTICE '  - sequences (아웃바운드 시퀀스)';
  RAISE NOTICE '  - activities (활동 로그)';
  RAISE NOTICE '  - workflows (n8n 워크플로우)';
  RAISE NOTICE '  - cross_sell_opportunities (크로스셀 기회)';
  RAISE NOTICE '';
  RAISE NOTICE 'Features enabled:';
  RAISE NOTICE '  ✅ Row Level Security (RLS)';
  RAISE NOTICE '  ✅ Auto-updated timestamps';
  RAISE NOTICE '  ✅ Lead tier auto-calculation';
  RAISE NOTICE '  ✅ Activity tracking triggers';
  RAISE NOTICE '  ✅ Full-text search (pg_trgm)';
  RAISE NOTICE '  ✅ JSONB indexes for enrichment data';
  RAISE NOTICE '  ✅ Analytics views';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Configure user_teams table for multi-tenant access';
  RAISE NOTICE '  2. Set up n8n webhooks in workflows table';
  RAISE NOTICE '  3. Integrate with Apollo/Clearbit for lead enrichment';
  RAISE NOTICE '  4. Create campaign templates';
  RAISE NOTICE '========================================';
END $$;

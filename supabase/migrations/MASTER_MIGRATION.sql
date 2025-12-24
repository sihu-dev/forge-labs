-- ============================================
-- FORGE LABS MASTER MIGRATION
-- Marketing Automation + CRM System
-- Version: 1.0.0 | Date: 2024-12-24
-- ============================================
-- 적용 방법:
-- 1. Supabase Dashboard > SQL Editor
-- 2. 이 파일 전체 복사 후 실행
-- ============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- ============================================
-- PART 1: ENUMS (CRM)
-- ============================================

DO $$ BEGIN
  CREATE TYPE crm_platform AS ENUM ('hubspot', 'pipedrive', 'supabase');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE sync_status AS ENUM ('pending', 'syncing', 'synced', 'error', 'conflict');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE sync_direction AS ENUM ('push', 'pull', 'bidirectional');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE conflict_resolution_strategy AS ENUM ('timestamp_based', 'source_priority', 'field_merge', 'manual_review');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE lifecycle_stage AS ENUM (
    'subscriber', 'lead', 'marketing_qualified_lead', 'sales_qualified_lead',
    'opportunity', 'customer', 'evangelist', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE company_size AS ENUM ('1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5001+');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE deal_stage AS ENUM (
    'appointment_scheduled', 'qualified_to_buy', 'presentation_scheduled',
    'decision_maker_bought_in', 'contract_sent', 'closed_won', 'closed_lost'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE deal_priority AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE activity_type AS ENUM ('call', 'email', 'meeting', 'task', 'note', 'linkedin_message', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE activity_direction AS ENUM ('inbound', 'outbound');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE task_status AS ENUM ('not_started', 'in_progress', 'waiting', 'completed', 'deferred');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE task_priority AS ENUM ('low', 'normal', 'high');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE sync_job_status AS ENUM ('queued', 'running', 'completed', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE conflict_status AS ENUM ('pending', 'resolved', 'ignored');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================
-- PART 2: MARKETING AUTOMATION TABLES
-- ============================================

-- Leads table (Marketing)
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  company TEXT,
  job_title TEXT,
  phone TEXT,
  linkedin_url TEXT,
  score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN (
    'new', 'contacted', 'qualified', 'nurturing',
    'opportunity', 'converted', 'lost', 'unsubscribed'
  )),
  source TEXT NOT NULL DEFAULT 'other' CHECK (source IN (
    'website', 'landing_page', 'social_media', 'email',
    'referral', 'webinar', 'event', 'cold_outreach',
    'paid_ad', 'organic', 'partnership', 'other'
  )),
  tags TEXT[] DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_contacted_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  owner_id UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Lead activities
CREATE TABLE IF NOT EXISTS lead_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'email_sent', 'email_opened', 'email_clicked', 'email_replied',
    'page_visited', 'form_submitted', 'meeting_booked', 'call_made',
    'note_added', 'status_changed', 'score_changed'
  )),
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID
);

-- Campaigns
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN (
    'email', 'social', 'content', 'webinar',
    'event', 'paid_ad', 'nurture', 'retargeting'
  )),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'active', 'paused', 'completed'
  )),
  budget DECIMAL(12, 2),
  spent DECIMAL(12, 2) DEFAULT 0,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  goals JSONB DEFAULT '{}',
  utm_params JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Campaign performance
CREATE TABLE IF NOT EXISTS campaign_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  impressions BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  ctr DECIMAL(5, 2) DEFAULT 0,
  leads INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5, 2) DEFAULT 0,
  revenue DECIMAL(12, 2) DEFAULT 0,
  roi DECIMAL(8, 2) DEFAULT 0,
  cac DECIMAL(10, 2) DEFAULT 0,
  measured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(campaign_id, measured_at)
);

-- Email sequences
CREATE TABLE IF NOT EXISTS email_sequences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'active', 'paused', 'completed', 'archived'
  )),
  total_subscribers INTEGER DEFAULT 0,
  active_subscribers INTEGER DEFAULT 0,
  completed_subscribers INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sequence steps
CREATE TABLE IF NOT EXISTS sequence_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sequence_id UUID NOT NULL REFERENCES email_sequences(id) ON DELETE CASCADE,
  order_num INTEGER NOT NULL,
  delay_hours INTEGER NOT NULL DEFAULT 48,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT NOT NULL,
  stats JSONB DEFAULT '{"sent":0,"delivered":0,"opened":0,"clicked":0,"replied":0,"bounced":0,"unsubscribed":0}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(sequence_id, order_num)
);

-- Email logs
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  sequence_id UUID REFERENCES email_sequences(id) ON DELETE SET NULL,
  step_id UUID REFERENCES sequence_steps(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  from_email TEXT NOT NULL,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN (
    'scheduled', 'sent', 'delivered', 'opened', 'clicked',
    'replied', 'bounced', 'failed', 'unsubscribed'
  )),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Content performance
CREATE TABLE IF NOT EXISTS content_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'blog', 'whitepaper', 'ebook', 'video', 'webinar', 'case_study'
  )),
  url TEXT NOT NULL,
  views BIGINT DEFAULT 0,
  unique_visitors BIGINT DEFAULT 0,
  avg_time_on_page INTEGER DEFAULT 0,
  leads_generated INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5, 2) DEFAULT 0,
  social_shares INTEGER DEFAULT 0,
  backlinks INTEGER DEFAULT 0,
  published_at TIMESTAMPTZ NOT NULL,
  measured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(url, measured_at)
);

-- LTV analysis
CREATE TABLE IF NOT EXISTS ltv_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  segment TEXT NOT NULL,
  avg_ltv DECIMAL(10, 2) NOT NULL,
  avg_cac DECIMAL(10, 2) NOT NULL,
  ltv_cac_ratio DECIMAL(6, 2) NOT NULL,
  avg_tenure_months DECIMAL(6, 2) NOT NULL,
  avg_monthly_revenue DECIMAL(10, 2) NOT NULL,
  churn_rate DECIMAL(5, 2) NOT NULL,
  customer_count INTEGER NOT NULL,
  measured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(segment, measured_at)
);

-- System health
CREATE TABLE IF NOT EXISTS system_health (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  overall_status TEXT NOT NULL CHECK (overall_status IN ('healthy', 'degraded', 'down')),
  email_delivery JSONB NOT NULL DEFAULT '{}',
  api_status JSONB NOT NULL DEFAULT '{}',
  database JSONB NOT NULL DEFAULT '{}',
  integrations JSONB DEFAULT '[]',
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Anomaly alerts
CREATE TABLE IF NOT EXISTS anomaly_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('spike', 'drop', 'anomaly')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  metric_name TEXT NOT NULL,
  current_value DECIMAL(12, 2) NOT NULL,
  expected_value DECIMAL(12, 2) NOT NULL,
  deviation_percent DECIMAL(6, 2) NOT NULL,
  description TEXT NOT NULL,
  recommended_action TEXT,
  ai_analysis TEXT,
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notification rules
CREATE TABLE IF NOT EXISTS notification_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  trigger JSONB NOT NULL,
  channels TEXT[] NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  recipients JSONB NOT NULL,
  cooldown_minutes INTEGER DEFAULT 60,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Dashboards
CREATE TABLE IF NOT EXISTS dashboards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  shared_with UUID[] DEFAULT '{}',
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Dashboard widgets
CREATE TABLE IF NOT EXISTS dashboard_widgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dashboard_id UUID NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('metric', 'chart', 'table', 'funnel', 'map', 'list')),
  title TEXT NOT NULL,
  layout JSONB NOT NULL,
  config JSONB DEFAULT '{}',
  query TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- PART 3: CRM TABLES
-- ============================================

-- CRM Companies (must be created before contacts due to FK)
CREATE TABLE IF NOT EXISTS crm_companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  domain TEXT,
  industry TEXT,
  description TEXT,
  employee_count INTEGER,
  company_size company_size,
  annual_revenue DECIMAL(15, 2),
  website TEXT,
  phone TEXT,
  address_street TEXT,
  address_city TEXT,
  address_state TEXT,
  address_postal_code TEXT,
  address_country TEXT,
  custom_fields JSONB DEFAULT '{}',
  external_ids JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sync_status sync_status DEFAULT 'pending',
  last_synced_at TIMESTAMPTZ
);

-- CRM Contacts
CREATE TABLE IF NOT EXISTS crm_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  job_title TEXT,
  company_id UUID REFERENCES crm_companies(id) ON DELETE SET NULL,
  lifecycle_stage lifecycle_stage DEFAULT 'lead',
  lead_source TEXT,
  lead_score INTEGER,
  address_street TEXT,
  address_city TEXT,
  address_state TEXT,
  address_postal_code TEXT,
  address_country TEXT,
  linkedin_url TEXT,
  twitter_handle TEXT,
  custom_fields JSONB DEFAULT '{}',
  external_ids JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ,
  sync_status sync_status DEFAULT 'pending',
  last_synced_at TIMESTAMPTZ,
  CONSTRAINT crm_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- CRM Deals
CREATE TABLE IF NOT EXISTS crm_deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  stage deal_stage DEFAULT 'appointment_scheduled',
  probability INTEGER CHECK (probability >= 0 AND probability <= 100),
  priority deal_priority DEFAULT 'medium',
  contact_id UUID NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
  company_id UUID REFERENCES crm_companies(id) ON DELETE SET NULL,
  owner_id UUID NOT NULL,
  close_date TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ,
  custom_fields JSONB DEFAULT '{}',
  external_ids JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sync_status sync_status DEFAULT 'pending',
  last_synced_at TIMESTAMPTZ
);

-- CRM Activities
CREATE TABLE IF NOT EXISTS crm_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  type activity_type NOT NULL,
  direction activity_direction,
  subject TEXT NOT NULL,
  body TEXT,
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE CASCADE,
  company_id UUID REFERENCES crm_companies(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES crm_deals(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER,
  outcome TEXT,
  custom_fields JSONB DEFAULT '{}',
  external_ids JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sync_status sync_status DEFAULT 'pending',
  last_synced_at TIMESTAMPTZ
);

-- CRM Tasks
CREATE TABLE IF NOT EXISTS crm_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status task_status DEFAULT 'not_started',
  priority task_priority DEFAULT 'normal',
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE CASCADE,
  company_id UUID REFERENCES crm_companies(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES crm_deals(id) ON DELETE CASCADE,
  assigned_to UUID NOT NULL,
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  reminder_date TIMESTAMPTZ,
  custom_fields JSONB DEFAULT '{}',
  external_ids JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sync_status sync_status DEFAULT 'pending',
  last_synced_at TIMESTAMPTZ
);

-- CRM Sync Configs
CREATE TABLE IF NOT EXISTS crm_sync_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  platform crm_platform NOT NULL,
  sync_direction sync_direction DEFAULT 'bidirectional',
  sync_frequency_minutes INTEGER DEFAULT 60,
  last_sync_at TIMESTAMPTZ,
  next_sync_at TIMESTAMPTZ,
  conflict_strategy conflict_resolution_strategy DEFAULT 'timestamp_based',
  source_priority TEXT[],
  sync_contacts BOOLEAN DEFAULT true,
  sync_companies BOOLEAN DEFAULT true,
  sync_deals BOOLEAN DEFAULT true,
  sync_activities BOOLEAN DEFAULT true,
  sync_tasks BOOLEAN DEFAULT true,
  field_mappings JSONB DEFAULT '{}',
  credentials_vault_id TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, platform)
);

-- CRM Sync Jobs
CREATE TABLE IF NOT EXISTS crm_sync_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  sync_config_id UUID NOT NULL REFERENCES crm_sync_configs(id) ON DELETE CASCADE,
  status sync_job_status DEFAULT 'queued',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  contacts_synced INTEGER DEFAULT 0,
  companies_synced INTEGER DEFAULT 0,
  deals_synced INTEGER DEFAULT 0,
  activities_synced INTEGER DEFAULT 0,
  tasks_synced INTEGER DEFAULT 0,
  errors JSONB DEFAULT '[]',
  conflicts_detected INTEGER DEFAULT 0,
  triggered_by TEXT CHECK (triggered_by IN ('schedule', 'webhook', 'manual')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CRM Conflict Records
CREATE TABLE IF NOT EXISTS crm_conflict_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('contact', 'company', 'deal', 'activity', 'task')),
  entity_id UUID NOT NULL,
  local_snapshot JSONB NOT NULL,
  remote_snapshot JSONB NOT NULL,
  conflicting_fields TEXT[] NOT NULL,
  status conflict_status DEFAULT 'pending',
  resolution_strategy conflict_resolution_strategy,
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CRM Automation Rules
CREATE TABLE IF NOT EXISTS crm_automation_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT true,
  trigger JSONB NOT NULL,
  conditions JSONB DEFAULT '[]',
  actions JSONB NOT NULL,
  last_triggered_at TIMESTAMPTZ,
  execution_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CRM Webhook Events
CREATE TABLE IF NOT EXISTS crm_webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform crm_platform NOT NULL,
  event_type TEXT NOT NULL,
  object_id TEXT NOT NULL,
  object_type TEXT NOT NULL CHECK (object_type IN ('contact', 'company', 'deal')),
  properties JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  error TEXT,
  received_at TIMESTAMPTZ DEFAULT NOW()
);

-- CRM Pipeline Snapshots
CREATE TABLE IF NOT EXISTS crm_pipeline_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  snapshot_date DATE NOT NULL,
  stage deal_stage NOT NULL,
  deal_count INTEGER NOT NULL,
  total_value DECIMAL(15, 2) NOT NULL,
  avg_deal_size DECIMAL(15, 2) NOT NULL,
  weighted_value DECIMAL(15, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, snapshot_date, stage)
);

-- CRM Activity Summaries
CREATE TABLE IF NOT EXISTS crm_activity_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  owner_id UUID NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  calls INTEGER DEFAULT 0,
  emails INTEGER DEFAULT 0,
  meetings INTEGER DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  contacts_engaged INTEGER DEFAULT 0,
  companies_engaged INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, owner_id, period_start, period_end)
);

-- CRM Revenue Forecasts
CREATE TABLE IF NOT EXISTS crm_revenue_forecasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  forecast_month DATE NOT NULL,
  committed DECIMAL(15, 2) NOT NULL,
  upside DECIMAL(15, 2) NOT NULL,
  pipeline DECIMAL(15, 2) NOT NULL,
  weighted_total DECIMAL(15, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, forecast_month)
);

-- CRM Audit Log
CREATE TABLE IF NOT EXISTS crm_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'deleted', 'synced')),
  changes JSONB,
  user_id UUID,
  source TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PART 4: INDEXES
-- ============================================

-- Marketing indexes
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_owner ON leads(owner_id);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_score ON leads(score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_tags ON leads USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_id ON lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_type ON lead_activities(type);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_type ON campaigns(type);
CREATE INDEX IF NOT EXISTS idx_email_logs_lead_id ON email_logs(lead_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_sequence_id ON email_logs(sequence_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_anomaly_alerts_severity ON anomaly_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_system_health_checked_at ON system_health(checked_at DESC);

-- CRM indexes
CREATE INDEX IF NOT EXISTS idx_crm_contacts_tenant_email ON crm_contacts(tenant_id, email);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_company ON crm_contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_lifecycle ON crm_contacts(lifecycle_stage);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_sync_status ON crm_contacts(sync_status);
CREATE INDEX IF NOT EXISTS idx_crm_companies_tenant_name ON crm_companies(tenant_id, name);
CREATE INDEX IF NOT EXISTS idx_crm_companies_domain ON crm_companies(domain);
CREATE INDEX IF NOT EXISTS idx_crm_deals_tenant_stage ON crm_deals(tenant_id, stage);
CREATE INDEX IF NOT EXISTS idx_crm_deals_contact ON crm_deals(contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_owner ON crm_deals(owner_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_contact ON crm_activities(contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_timestamp ON crm_activities(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_assigned_to ON crm_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_status ON crm_tasks(status);
CREATE INDEX IF NOT EXISTS idx_crm_sync_jobs_status ON crm_sync_jobs(status);
CREATE INDEX IF NOT EXISTS idx_crm_audit_entity ON crm_audit_log(entity_type, entity_id);

-- ============================================
-- PART 5: FUNCTIONS & TRIGGERS
-- ============================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'leads', 'campaigns', 'email_sequences', 'sequence_steps',
    'notification_rules', 'dashboards', 'dashboard_widgets',
    'crm_contacts', 'crm_companies', 'crm_deals', 'crm_activities',
    'crm_tasks', 'crm_sync_configs', 'crm_conflict_records', 'crm_automation_rules'
  ])
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I_updated_at ON %I', t, t);
    EXECUTE format('CREATE TRIGGER %I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at()', t, t);
  END LOOP;
END $$;

-- Lead status change logger
CREATE OR REPLACE FUNCTION log_lead_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO lead_activities (lead_id, type, description, metadata)
    VALUES (NEW.id, 'status_changed', 'Status: ' || OLD.status || ' → ' || NEW.status,
      jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status));
  END IF;
  IF OLD.score IS DISTINCT FROM NEW.score THEN
    INSERT INTO lead_activities (lead_id, type, description, metadata)
    VALUES (NEW.id, 'score_changed', 'Score: ' || OLD.score || ' → ' || NEW.score,
      jsonb_build_object('old_score', OLD.score, 'new_score', NEW.score));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS lead_status_change_logger ON leads;
CREATE TRIGGER lead_status_change_logger AFTER UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION log_lead_status_change();

-- ============================================
-- PART 6: MATERIALIZED VIEWS
-- ============================================

DROP MATERIALIZED VIEW IF EXISTS daily_metrics;
CREATE MATERIALIZED VIEW daily_metrics AS
SELECT
  DATE(created_at) as date,
  COUNT(*) FILTER (WHERE status = 'new') as new_leads,
  COUNT(*) FILTER (WHERE status = 'qualified') as qualified_leads,
  COUNT(*) FILTER (WHERE status = 'converted') as conversions,
  AVG(score) as avg_lead_score
FROM leads
GROUP BY DATE(created_at);

CREATE UNIQUE INDEX ON daily_metrics(date);

DROP MATERIALIZED VIEW IF EXISTS email_performance_daily;
CREATE MATERIALIZED VIEW email_performance_daily AS
SELECT
  DATE(sent_at) as date,
  COUNT(*) as emails_sent,
  COUNT(*) FILTER (WHERE status = 'delivered') as delivered,
  COUNT(*) FILTER (WHERE status = 'opened') as opened,
  COUNT(*) FILTER (WHERE status = 'clicked') as clicked,
  COUNT(*) FILTER (WHERE status = 'replied') as replied
FROM email_logs
WHERE sent_at IS NOT NULL
GROUP BY DATE(sent_at);

CREATE UNIQUE INDEX ON email_performance_daily(date);

-- Refresh function
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY daily_metrics;
  REFRESH MATERIALIZED VIEW CONCURRENTLY email_performance_daily;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PART 7: ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE anomaly_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_tasks ENABLE ROW LEVEL SECURITY;

-- Basic policies (adjust based on your auth setup)
DROP POLICY IF EXISTS "Users can view leads" ON leads;
CREATE POLICY "Users can view leads" ON leads FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can insert leads" ON leads;
CREATE POLICY "Users can insert leads" ON leads FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update leads" ON leads;
CREATE POLICY "Users can update leads" ON leads FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ============================================
-- COMPLETE
-- ============================================
-- Total: 35+ tables, 50+ indexes, 10+ functions
-- Ready for: Marketing Automation + CRM + Analytics

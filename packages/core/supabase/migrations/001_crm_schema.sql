-- =========================================
-- CRM SYNC SYSTEM - Database Schema
-- Version: 1.0.0
-- Created: 2024-12-24
-- =========================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================
-- ENUMS
-- =========================================

CREATE TYPE crm_platform AS ENUM ('hubspot', 'pipedrive', 'supabase');
CREATE TYPE sync_status AS ENUM ('pending', 'syncing', 'synced', 'error', 'conflict');
CREATE TYPE sync_direction AS ENUM ('push', 'pull', 'bidirectional');
CREATE TYPE conflict_resolution_strategy AS ENUM ('timestamp_based', 'source_priority', 'field_merge', 'manual_review');

CREATE TYPE lifecycle_stage AS ENUM (
  'subscriber',
  'lead',
  'marketing_qualified_lead',
  'sales_qualified_lead',
  'opportunity',
  'customer',
  'evangelist',
  'other'
);

CREATE TYPE company_size AS ENUM ('1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5001+');

CREATE TYPE deal_stage AS ENUM (
  'appointment_scheduled',
  'qualified_to_buy',
  'presentation_scheduled',
  'decision_maker_bought_in',
  'contract_sent',
  'closed_won',
  'closed_lost'
);

CREATE TYPE deal_priority AS ENUM ('low', 'medium', 'high', 'critical');

CREATE TYPE activity_type AS ENUM ('call', 'email', 'meeting', 'task', 'note', 'linkedin_message', 'other');
CREATE TYPE activity_direction AS ENUM ('inbound', 'outbound');

CREATE TYPE task_status AS ENUM ('not_started', 'in_progress', 'waiting', 'completed', 'deferred');
CREATE TYPE task_priority AS ENUM ('low', 'normal', 'high');

CREATE TYPE sync_job_status AS ENUM ('queued', 'running', 'completed', 'failed');
CREATE TYPE conflict_status AS ENUM ('pending', 'resolved', 'ignored');

-- =========================================
-- CORE TABLES
-- =========================================

-- 1. CRM CONTACTS
CREATE TABLE crm_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,

  -- Basic Info
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,

  -- Professional Info
  job_title TEXT,
  company_id UUID REFERENCES crm_companies(id) ON DELETE SET NULL,

  -- Lifecycle
  lifecycle_stage lifecycle_stage DEFAULT 'lead',
  lead_source TEXT,
  lead_score INTEGER,

  -- Address
  address_street TEXT,
  address_city TEXT,
  address_state TEXT,
  address_postal_code TEXT,
  address_country TEXT,

  -- Social
  linkedin_url TEXT,
  twitter_handle TEXT,

  -- Custom Fields
  custom_fields JSONB DEFAULT '{}',

  -- External IDs (array of {platform, external_id, last_synced_at})
  external_ids JSONB DEFAULT '[]',

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ,

  -- Sync
  sync_status sync_status DEFAULT 'pending',
  last_synced_at TIMESTAMPTZ,

  CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- 2. CRM COMPANIES
CREATE TABLE crm_companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,

  -- Basic Info
  name TEXT NOT NULL,
  domain TEXT,
  industry TEXT,
  description TEXT,

  -- Size & Revenue
  employee_count INTEGER,
  company_size company_size,
  annual_revenue DECIMAL(15, 2),

  -- Contact Info
  website TEXT,
  phone TEXT,
  address_street TEXT,
  address_city TEXT,
  address_state TEXT,
  address_postal_code TEXT,
  address_country TEXT,

  -- Custom Fields
  custom_fields JSONB DEFAULT '{}',

  -- External IDs
  external_ids JSONB DEFAULT '[]',

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Sync
  sync_status sync_status DEFAULT 'pending',
  last_synced_at TIMESTAMPTZ
);

-- 3. CRM DEALS
CREATE TABLE crm_deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,

  -- Basic Info
  name TEXT NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',

  -- Stage & Status
  stage deal_stage DEFAULT 'appointment_scheduled',
  probability INTEGER CHECK (probability >= 0 AND probability <= 100),
  priority deal_priority DEFAULT 'medium',

  -- Relationships
  contact_id UUID NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
  company_id UUID REFERENCES crm_companies(id) ON DELETE SET NULL,
  owner_id UUID NOT NULL,

  -- Timeline
  close_date TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ,

  -- Custom Fields
  custom_fields JSONB DEFAULT '{}',

  -- External IDs
  external_ids JSONB DEFAULT '[]',

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Sync
  sync_status sync_status DEFAULT 'pending',
  last_synced_at TIMESTAMPTZ
);

-- 4. CRM ACTIVITIES
CREATE TABLE crm_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,

  -- Type & Content
  type activity_type NOT NULL,
  direction activity_direction,
  subject TEXT NOT NULL,
  body TEXT,

  -- Relationships
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE CASCADE,
  company_id UUID REFERENCES crm_companies(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES crm_deals(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL,

  -- Timing
  timestamp TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER,

  -- Outcome
  outcome TEXT,

  -- Custom Fields
  custom_fields JSONB DEFAULT '{}',

  -- External IDs
  external_ids JSONB DEFAULT '[]',

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Sync
  sync_status sync_status DEFAULT 'pending',
  last_synced_at TIMESTAMPTZ
);

-- 5. CRM TASKS
CREATE TABLE crm_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,

  -- Content
  title TEXT NOT NULL,
  description TEXT,
  status task_status DEFAULT 'not_started',
  priority task_priority DEFAULT 'normal',

  -- Relationships
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE CASCADE,
  company_id UUID REFERENCES crm_companies(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES crm_deals(id) ON DELETE CASCADE,
  assigned_to UUID NOT NULL,

  -- Timeline
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Reminder
  reminder_date TIMESTAMPTZ,

  -- Custom Fields
  custom_fields JSONB DEFAULT '{}',

  -- External IDs
  external_ids JSONB DEFAULT '[]',

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Sync
  sync_status sync_status DEFAULT 'pending',
  last_synced_at TIMESTAMPTZ
);

-- =========================================
-- SYNC MANAGEMENT TABLES
-- =========================================

-- 6. SYNC CONFIGS
CREATE TABLE crm_sync_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,

  -- Platform
  platform crm_platform NOT NULL,

  -- Direction
  sync_direction sync_direction DEFAULT 'bidirectional',

  -- Schedule
  sync_frequency_minutes INTEGER DEFAULT 60,
  last_sync_at TIMESTAMPTZ,
  next_sync_at TIMESTAMPTZ,

  -- Conflict Resolution
  conflict_strategy conflict_resolution_strategy DEFAULT 'timestamp_based',
  source_priority TEXT[], -- Array of platform names in priority order

  -- Entity Filters
  sync_contacts BOOLEAN DEFAULT true,
  sync_companies BOOLEAN DEFAULT true,
  sync_deals BOOLEAN DEFAULT true,
  sync_activities BOOLEAN DEFAULT true,
  sync_tasks BOOLEAN DEFAULT true,

  -- Field Mapping Overrides
  field_mappings JSONB DEFAULT '{}',

  -- Credentials (encrypted reference to vault)
  credentials_vault_id TEXT NOT NULL,

  -- Status
  enabled BOOLEAN DEFAULT true,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(tenant_id, platform)
);

-- 7. SYNC JOBS
CREATE TABLE crm_sync_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  sync_config_id UUID NOT NULL REFERENCES crm_sync_configs(id) ON DELETE CASCADE,

  -- Execution
  status sync_job_status DEFAULT 'queued',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,

  -- Results
  contacts_synced INTEGER DEFAULT 0,
  companies_synced INTEGER DEFAULT 0,
  deals_synced INTEGER DEFAULT 0,
  activities_synced INTEGER DEFAULT 0,
  tasks_synced INTEGER DEFAULT 0,

  -- Errors
  errors JSONB DEFAULT '[]',
  conflicts_detected INTEGER DEFAULT 0,

  -- Metadata
  triggered_by TEXT CHECK (triggered_by IN ('schedule', 'webhook', 'manual')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. CONFLICT RECORDS
CREATE TABLE crm_conflict_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,

  -- Entity
  entity_type TEXT NOT NULL CHECK (entity_type IN ('contact', 'company', 'deal', 'activity', 'task')),
  entity_id UUID NOT NULL,

  -- Conflict Data
  local_snapshot JSONB NOT NULL,
  remote_snapshot JSONB NOT NULL,
  conflicting_fields TEXT[] NOT NULL,

  -- Resolution
  status conflict_status DEFAULT 'pending',
  resolution_strategy conflict_resolution_strategy,
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- AUTOMATION TABLES
-- =========================================

-- 9. AUTOMATION RULES
CREATE TABLE crm_automation_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,

  -- Metadata
  name TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT true,

  -- Trigger
  trigger JSONB NOT NULL,

  -- Conditions
  conditions JSONB DEFAULT '[]',

  -- Actions
  actions JSONB NOT NULL,

  -- Execution Stats
  last_triggered_at TIMESTAMPTZ,
  execution_count INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- WEBHOOK TABLES
-- =========================================

-- 10. WEBHOOK EVENTS
CREATE TABLE crm_webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Source
  platform crm_platform NOT NULL,
  event_type TEXT NOT NULL,

  -- Payload
  object_id TEXT NOT NULL,
  object_type TEXT NOT NULL CHECK (object_type IN ('contact', 'company', 'deal')),
  properties JSONB NOT NULL,

  -- Processing
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  error TEXT,

  -- Metadata
  received_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- REPORTING TABLES
-- =========================================

-- 11. PIPELINE SNAPSHOTS
CREATE TABLE crm_pipeline_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,

  -- Snapshot
  snapshot_date DATE NOT NULL,
  stage deal_stage NOT NULL,

  -- Metrics
  deal_count INTEGER NOT NULL,
  total_value DECIMAL(15, 2) NOT NULL,
  avg_deal_size DECIMAL(15, 2) NOT NULL,
  weighted_value DECIMAL(15, 2) NOT NULL,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(tenant_id, snapshot_date, stage)
);

-- 12. ACTIVITY SUMMARIES
CREATE TABLE crm_activity_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  owner_id UUID NOT NULL,

  -- Period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Counts by Type
  calls INTEGER DEFAULT 0,
  emails INTEGER DEFAULT 0,
  meetings INTEGER DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,

  -- Engagement
  contacts_engaged INTEGER DEFAULT 0,
  companies_engaged INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(tenant_id, owner_id, period_start, period_end)
);

-- 13. REVENUE FORECASTS
CREATE TABLE crm_revenue_forecasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,

  -- Period (first day of month)
  forecast_month DATE NOT NULL,

  -- Pipeline Segments
  committed DECIMAL(15, 2) NOT NULL,
  upside DECIMAL(15, 2) NOT NULL,
  pipeline DECIMAL(15, 2) NOT NULL,
  weighted_total DECIMAL(15, 2) NOT NULL,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(tenant_id, forecast_month)
);

-- =========================================
-- AUDIT TABLE
-- =========================================

-- 14. AUDIT LOG
CREATE TABLE crm_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,

  -- Entity
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,

  -- Action
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'deleted', 'synced')),
  changes JSONB, -- Field-level diff

  -- User
  user_id UUID,
  source TEXT, -- 'hubspot', 'pipedrive', 'supabase', 'manual', 'automation'

  -- Metadata
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- INDEXES
-- =========================================

-- Contacts
CREATE INDEX idx_contacts_tenant_email ON crm_contacts(tenant_id, email);
CREATE INDEX idx_contacts_company ON crm_contacts(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX idx_contacts_lifecycle ON crm_contacts(lifecycle_stage);
CREATE INDEX idx_contacts_sync_status ON crm_contacts(sync_status);
CREATE INDEX idx_contacts_external_ids ON crm_contacts USING GIN(external_ids);

-- Companies
CREATE INDEX idx_companies_tenant_name ON crm_companies(tenant_id, name);
CREATE INDEX idx_companies_domain ON crm_companies(domain) WHERE domain IS NOT NULL;
CREATE INDEX idx_companies_sync_status ON crm_companies(sync_status);
CREATE INDEX idx_companies_external_ids ON crm_companies USING GIN(external_ids);

-- Deals
CREATE INDEX idx_deals_tenant_stage ON crm_deals(tenant_id, stage);
CREATE INDEX idx_deals_contact ON crm_deals(contact_id);
CREATE INDEX idx_deals_company ON crm_deals(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX idx_deals_owner ON crm_deals(owner_id);
CREATE INDEX idx_deals_close_date ON crm_deals(close_date) WHERE close_date IS NOT NULL;
CREATE INDEX idx_deals_sync_status ON crm_deals(sync_status);
CREATE INDEX idx_deals_external_ids ON crm_deals USING GIN(external_ids);

-- Activities
CREATE INDEX idx_activities_contact ON crm_activities(contact_id) WHERE contact_id IS NOT NULL;
CREATE INDEX idx_activities_company ON crm_activities(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX idx_activities_deal ON crm_activities(deal_id) WHERE deal_id IS NOT NULL;
CREATE INDEX idx_activities_owner ON crm_activities(owner_id);
CREATE INDEX idx_activities_timestamp ON crm_activities(timestamp DESC);
CREATE INDEX idx_activities_type ON crm_activities(type);

-- Tasks
CREATE INDEX idx_tasks_assigned_to ON crm_tasks(assigned_to);
CREATE INDEX idx_tasks_status ON crm_tasks(status);
CREATE INDEX idx_tasks_due_date ON crm_tasks(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_tasks_contact ON crm_tasks(contact_id) WHERE contact_id IS NOT NULL;
CREATE INDEX idx_tasks_deal ON crm_tasks(deal_id) WHERE deal_id IS NOT NULL;

-- Sync
CREATE INDEX idx_sync_jobs_config ON crm_sync_jobs(sync_config_id);
CREATE INDEX idx_sync_jobs_status ON crm_sync_jobs(status);
CREATE INDEX idx_sync_jobs_created ON crm_sync_jobs(created_at DESC);

-- Conflicts
CREATE INDEX idx_conflicts_entity ON crm_conflict_records(entity_type, entity_id);
CREATE INDEX idx_conflicts_status ON crm_conflict_records(status);

-- Webhooks
CREATE INDEX idx_webhooks_processed ON crm_webhook_events(processed, received_at);
CREATE INDEX idx_webhooks_platform ON crm_webhook_events(platform);

-- Audit
CREATE INDEX idx_audit_entity ON crm_audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_tenant_timestamp ON crm_audit_log(tenant_id, timestamp DESC);

-- =========================================
-- TRIGGERS
-- =========================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER crm_contacts_updated_at BEFORE UPDATE ON crm_contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER crm_companies_updated_at BEFORE UPDATE ON crm_companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER crm_deals_updated_at BEFORE UPDATE ON crm_deals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER crm_activities_updated_at BEFORE UPDATE ON crm_activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER crm_tasks_updated_at BEFORE UPDATE ON crm_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER crm_sync_configs_updated_at BEFORE UPDATE ON crm_sync_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER crm_conflict_records_updated_at BEFORE UPDATE ON crm_conflict_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER crm_automation_rules_updated_at BEFORE UPDATE ON crm_automation_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Audit trail triggers
CREATE OR REPLACE FUNCTION crm_audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    INSERT INTO crm_audit_log (tenant_id, entity_type, entity_id, action, user_id)
    VALUES (OLD.tenant_id, TG_TABLE_NAME, OLD.id, 'deleted', auth.uid());
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO crm_audit_log (tenant_id, entity_type, entity_id, action, changes, user_id)
    VALUES (
      NEW.tenant_id,
      TG_TABLE_NAME,
      NEW.id,
      'updated',
      jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW)),
      auth.uid()
    );
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO crm_audit_log (tenant_id, entity_type, entity_id, action, user_id)
    VALUES (NEW.tenant_id, TG_TABLE_NAME, NEW.id, 'created', auth.uid());
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER crm_contacts_audit AFTER INSERT OR UPDATE OR DELETE ON crm_contacts
  FOR EACH ROW EXECUTE FUNCTION crm_audit_trigger();

CREATE TRIGGER crm_companies_audit AFTER INSERT OR UPDATE OR DELETE ON crm_companies
  FOR EACH ROW EXECUTE FUNCTION crm_audit_trigger();

CREATE TRIGGER crm_deals_audit AFTER INSERT OR UPDATE OR DELETE ON crm_deals
  FOR EACH ROW EXECUTE FUNCTION crm_audit_trigger();

-- =========================================
-- ROW LEVEL SECURITY (RLS)
-- =========================================

ALTER TABLE crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_sync_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_sync_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_conflict_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_pipeline_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_activity_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_revenue_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_audit_log ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policy (applies to all tables)
CREATE POLICY tenant_isolation_contacts ON crm_contacts
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_companies ON crm_companies
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_deals ON crm_deals
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_activities ON crm_activities
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_tasks ON crm_tasks
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_sync_configs ON crm_sync_configs
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_sync_jobs ON crm_sync_jobs
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_conflict_records ON crm_conflict_records
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_automation_rules ON crm_automation_rules
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_pipeline_snapshots ON crm_pipeline_snapshots
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_activity_summaries ON crm_activity_summaries
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_revenue_forecasts ON crm_revenue_forecasts
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_audit_log ON crm_audit_log
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- =========================================
-- VIEWS
-- =========================================

-- Contact engagement metrics
CREATE OR REPLACE VIEW crm_contact_engagement AS
SELECT
  c.id,
  c.tenant_id,
  c.email,
  c.first_name,
  c.last_name,
  c.lifecycle_stage,
  COUNT(a.id) as total_activities,
  COUNT(d.id) as active_deals,
  MAX(a.timestamp) as last_activity_at
FROM crm_contacts c
LEFT JOIN crm_activities a ON c.id = a.contact_id
LEFT JOIN crm_deals d ON c.id = d.contact_id AND d.stage NOT IN ('closed_won', 'closed_lost')
GROUP BY c.id;

-- Deal pipeline summary
CREATE OR REPLACE VIEW crm_deal_pipeline_summary AS
SELECT
  tenant_id,
  stage,
  COUNT(*) as deal_count,
  SUM(amount) as total_value,
  AVG(amount) as avg_deal_size,
  SUM(amount * probability / 100.0) as weighted_value
FROM crm_deals
WHERE stage NOT IN ('closed_won', 'closed_lost')
GROUP BY tenant_id, stage;

-- =========================================
-- FUNCTIONS
-- =========================================

-- Get contact timeline
CREATE OR REPLACE FUNCTION crm_get_contact_timeline(p_contact_id UUID)
RETURNS TABLE (
  id UUID,
  type TEXT,
  subject TEXT,
  timestamp TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.type::text,
    a.subject,
    a.timestamp
  FROM crm_activities a
  WHERE a.contact_id = p_contact_id
  ORDER BY a.timestamp DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get deal revenue forecast
CREATE OR REPLACE FUNCTION crm_get_revenue_forecast(
  p_tenant_id UUID,
  p_months INTEGER DEFAULT 6
)
RETURNS TABLE (
  forecast_month DATE,
  committed DECIMAL,
  upside DECIMAL,
  pipeline DECIMAL,
  weighted_total DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE_TRUNC('month', close_date)::date as forecast_month,
    SUM(amount) FILTER (WHERE probability >= 90) as committed,
    SUM(amount) FILTER (WHERE probability BETWEEN 50 AND 89) as upside,
    SUM(amount) FILTER (WHERE probability < 50) as pipeline,
    SUM(amount * probability / 100.0) as weighted_total
  FROM crm_deals
  WHERE tenant_id = p_tenant_id
    AND stage NOT IN ('closed_won', 'closed_lost')
    AND close_date >= DATE_TRUNC('month', NOW())
    AND close_date < DATE_TRUNC('month', NOW()) + (p_months || ' months')::interval
  GROUP BY DATE_TRUNC('month', close_date)
  ORDER BY forecast_month;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================================
-- COMMENTS
-- =========================================

COMMENT ON TABLE crm_contacts IS 'CRM contacts (leads and customers)';
COMMENT ON TABLE crm_companies IS 'CRM companies (accounts/organizations)';
COMMENT ON TABLE crm_deals IS 'CRM deals (opportunities)';
COMMENT ON TABLE crm_activities IS 'CRM activities (calls, emails, meetings)';
COMMENT ON TABLE crm_tasks IS 'CRM tasks (to-dos)';
COMMENT ON TABLE crm_sync_configs IS 'CRM sync configurations per tenant';
COMMENT ON TABLE crm_sync_jobs IS 'CRM sync job execution history';
COMMENT ON TABLE crm_conflict_records IS 'CRM sync conflict records for manual resolution';
COMMENT ON TABLE crm_automation_rules IS 'CRM automation rules engine';
COMMENT ON TABLE crm_webhook_events IS 'Incoming webhook events from external CRM platforms';
COMMENT ON TABLE crm_audit_log IS 'Audit trail for all CRM data changes';

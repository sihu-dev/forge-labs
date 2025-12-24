-- ============================================
-- Marketing Automation Database Schema
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- ============================================
-- Core Tables
-- ============================================

-- Leads table
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  company TEXT,
  job_title TEXT,
  phone TEXT,
  linkedin_url TEXT,

  -- Lead scoring and status
  score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN (
    'new', 'contacted', 'qualified', 'nurturing',
    'opportunity', 'converted', 'lost', 'unsubscribed'
  )),
  source TEXT NOT NULL CHECK (source IN (
    'website', 'landing_page', 'social_media', 'email',
    'referral', 'webinar', 'event', 'cold_outreach',
    'paid_ad', 'organic', 'partnership', 'other'
  )),

  -- Tags and custom fields
  tags TEXT[] DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_contacted_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,

  -- Assignment
  owner_id UUID REFERENCES auth.users(id),

  -- Metadata
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
  created_by UUID REFERENCES auth.users(id)
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

  -- Budget tracking
  budget DECIMAL(12, 2),
  spent DECIMAL(12, 2) DEFAULT 0,

  -- Timeline
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,

  -- Goals
  goals JSONB DEFAULT '{}', -- {leads: 100, conversions: 10, revenue: 50000}

  -- UTM parameters
  utm_params JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Campaign performance snapshots
CREATE TABLE IF NOT EXISTS campaign_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,

  -- Metrics
  impressions BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  ctr DECIMAL(5, 2) DEFAULT 0, -- Click-through rate
  leads INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5, 2) DEFAULT 0,
  revenue DECIMAL(12, 2) DEFAULT 0,
  roi DECIMAL(8, 2) DEFAULT 0, -- Return on investment
  cac DECIMAL(10, 2) DEFAULT 0, -- Customer acquisition cost

  -- Snapshot timestamp
  measured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Indexes
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

  -- Subscriber counts
  total_subscribers INTEGER DEFAULT 0,
  active_subscribers INTEGER DEFAULT 0,
  completed_subscribers INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Email sequence steps
CREATE TABLE IF NOT EXISTS sequence_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sequence_id UUID NOT NULL REFERENCES email_sequences(id) ON DELETE CASCADE,
  order_num INTEGER NOT NULL,

  -- Timing
  delay_hours INTEGER NOT NULL DEFAULT 48,

  -- Email content
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT NOT NULL,

  -- Performance stats (aggregated)
  stats JSONB DEFAULT '{
    "sent": 0,
    "delivered": 0,
    "opened": 0,
    "clicked": 0,
    "replied": 0,
    "bounced": 0,
    "unsubscribed": 0
  }',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(sequence_id, order_num)
);

-- Email logs (detailed tracking)
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  sequence_id UUID REFERENCES email_sequences(id) ON DELETE SET NULL,
  step_id UUID REFERENCES sequence_steps(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,

  -- Email details
  from_email TEXT NOT NULL,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN (
    'scheduled', 'sent', 'delivered', 'opened', 'clicked',
    'replied', 'bounced', 'failed', 'unsubscribed'
  )),

  -- Timestamps
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,

  -- Error handling
  error_message TEXT,

  -- Metadata (provider info, message IDs, etc)
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

  -- Metrics
  views BIGINT DEFAULT 0,
  unique_visitors BIGINT DEFAULT 0,
  avg_time_on_page INTEGER DEFAULT 0, -- seconds
  leads_generated INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5, 2) DEFAULT 0,
  social_shares INTEGER DEFAULT 0,
  backlinks INTEGER DEFAULT 0,

  -- Timestamps
  published_at TIMESTAMPTZ NOT NULL,
  measured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(url, measured_at)
);

-- LTV analysis (customer segments)
CREATE TABLE IF NOT EXISTS ltv_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  segment TEXT NOT NULL,

  -- Metrics
  avg_ltv DECIMAL(10, 2) NOT NULL,
  avg_cac DECIMAL(10, 2) NOT NULL,
  ltv_cac_ratio DECIMAL(6, 2) NOT NULL,
  avg_tenure_months DECIMAL(6, 2) NOT NULL,
  avg_monthly_revenue DECIMAL(10, 2) NOT NULL,
  churn_rate DECIMAL(5, 2) NOT NULL,
  customer_count INTEGER NOT NULL,

  -- Timestamp
  measured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(segment, measured_at)
);

-- System health monitoring
CREATE TABLE IF NOT EXISTS system_health (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  overall_status TEXT NOT NULL CHECK (overall_status IN (
    'healthy', 'degraded', 'down'
  )),

  -- Component statuses
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

  -- Alert details
  metric_name TEXT NOT NULL,
  current_value DECIMAL(12, 2) NOT NULL,
  expected_value DECIMAL(12, 2) NOT NULL,
  deviation_percent DECIMAL(6, 2) NOT NULL,

  description TEXT NOT NULL,
  recommended_action TEXT,
  ai_analysis TEXT,

  -- Acknowledgment
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES auth.users(id),

  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notification rules
CREATE TABLE IF NOT EXISTS notification_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,

  -- Trigger condition
  trigger JSONB NOT NULL, -- {metric, operator, threshold, time_window_minutes}

  -- Notification settings
  channels TEXT[] NOT NULL, -- ['email', 'slack', 'webhook', 'sms']
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  recipients JSONB NOT NULL, -- {email: [], slack_channel: '', webhook_url: '', phone_numbers: []}

  -- Cooldown to prevent spam
  cooldown_minutes INTEGER DEFAULT 60,
  last_triggered_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Dashboard widgets
CREATE TABLE IF NOT EXISTS dashboard_widgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dashboard_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'metric', 'chart', 'table', 'funnel', 'map', 'list'
  )),
  title TEXT NOT NULL,

  -- Layout
  layout JSONB NOT NULL, -- {x, y, w, h}

  -- Widget configuration
  config JSONB DEFAULT '{}',
  query TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Dashboards
CREATE TABLE IF NOT EXISTS dashboards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,

  -- Sharing
  is_public BOOLEAN DEFAULT FALSE,
  shared_with UUID[] DEFAULT '{}',

  -- Favorite
  is_favorite BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Indexes
-- ============================================

-- Leads
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_source ON leads(source);
CREATE INDEX idx_leads_owner ON leads(owner_id);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX idx_leads_score ON leads(score DESC);
CREATE INDEX idx_leads_tags ON leads USING GIN(tags);

-- Lead activities
CREATE INDEX idx_lead_activities_lead_id ON lead_activities(lead_id);
CREATE INDEX idx_lead_activities_type ON lead_activities(type);
CREATE INDEX idx_lead_activities_created_at ON lead_activities(created_at DESC);

-- Campaigns
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_type ON campaigns(type);
CREATE INDEX idx_campaigns_created_by ON campaigns(created_by);
CREATE INDEX idx_campaigns_dates ON campaigns(start_date, end_date);

-- Email logs
CREATE INDEX idx_email_logs_lead_id ON email_logs(lead_id);
CREATE INDEX idx_email_logs_sequence_id ON email_logs(sequence_id);
CREATE INDEX idx_email_logs_campaign_id ON email_logs(campaign_id);
CREATE INDEX idx_email_logs_status ON email_logs(status);
CREATE INDEX idx_email_logs_sent_at ON email_logs(sent_at DESC);

-- System health
CREATE INDEX idx_system_health_checked_at ON system_health(checked_at DESC);

-- Anomaly alerts
CREATE INDEX idx_anomaly_alerts_severity ON anomaly_alerts(severity);
CREATE INDEX idx_anomaly_alerts_acknowledged ON anomaly_alerts(acknowledged);
CREATE INDEX idx_anomaly_alerts_detected_at ON anomaly_alerts(detected_at DESC);

-- ============================================
-- Functions and Triggers
-- ============================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to tables
CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER email_sequences_updated_at
  BEFORE UPDATE ON email_sequences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER sequence_steps_updated_at
  BEFORE UPDATE ON sequence_steps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER notification_rules_updated_at
  BEFORE UPDATE ON notification_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER dashboards_updated_at
  BEFORE UPDATE ON dashboards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER dashboard_widgets_updated_at
  BEFORE UPDATE ON dashboard_widgets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Automatically log lead status changes
CREATE OR REPLACE FUNCTION log_lead_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO lead_activities (lead_id, type, description, metadata)
    VALUES (
      NEW.id,
      'status_changed',
      'Status changed from ' || OLD.status || ' to ' || NEW.status,
      jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status)
    );
  END IF;

  IF OLD.score IS DISTINCT FROM NEW.score THEN
    INSERT INTO lead_activities (lead_id, type, description, metadata)
    VALUES (
      NEW.id,
      'score_changed',
      'Score changed from ' || OLD.score || ' to ' || NEW.score,
      jsonb_build_object('old_score', OLD.score, 'new_score', NEW.score)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lead_status_change_logger
  AFTER UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION log_lead_status_change();

-- Update sequence step stats when email status changes
CREATE OR REPLACE FUNCTION update_sequence_step_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.step_id IS NOT NULL THEN
    UPDATE sequence_steps
    SET stats = jsonb_set(
      stats,
      ARRAY[NEW.status],
      to_jsonb((stats->>NEW.status)::int + 1)
    )
    WHERE id = NEW.step_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER email_status_stats_updater
  AFTER INSERT OR UPDATE ON email_logs
  FOR EACH ROW
  WHEN (NEW.status IN ('sent', 'delivered', 'opened', 'clicked', 'replied', 'bounced', 'unsubscribed'))
  EXECUTE FUNCTION update_sequence_step_stats();

-- ============================================
-- Row Level Security (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE ltv_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE anomaly_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboards ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Allow authenticated users to access their own data)
-- Note: Adjust these policies based on your multi-tenancy requirements

CREATE POLICY "Users can view their own leads"
  ON leads FOR SELECT
  USING (auth.uid() = owner_id OR owner_id IS NULL);

CREATE POLICY "Users can insert leads"
  ON leads FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own leads"
  ON leads FOR UPDATE
  USING (auth.uid() = owner_id OR owner_id IS NULL);

CREATE POLICY "Users can view lead activities"
  ON lead_activities FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM leads
    WHERE leads.id = lead_activities.lead_id
    AND (leads.owner_id = auth.uid() OR leads.owner_id IS NULL)
  ));

CREATE POLICY "Users can insert lead activities"
  ON lead_activities FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to view all campaigns (adjust as needed)
CREATE POLICY "Users can view campaigns"
  ON campaigns FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create campaigns"
  ON campaigns FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own campaigns"
  ON campaigns FOR UPDATE
  USING (auth.uid() = created_by);

-- Similar policies for other tables...
-- (Add more specific policies based on your access control requirements)

-- ============================================
-- Materialized Views for Performance
-- ============================================

-- Daily metrics rollup
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_metrics AS
SELECT
  DATE(created_at) as date,
  COUNT(*) FILTER (WHERE status = 'new') as new_leads,
  COUNT(*) FILTER (WHERE status = 'qualified') as qualified_leads,
  COUNT(*) FILTER (WHERE status = 'converted') as conversions,
  AVG(score) as avg_lead_score,
  COUNT(DISTINCT source) as active_sources
FROM leads
GROUP BY DATE(created_at);

CREATE UNIQUE INDEX ON daily_metrics(date);

-- Email performance rollup
CREATE MATERIALIZED VIEW IF NOT EXISTS email_performance_daily AS
SELECT
  DATE(sent_at) as date,
  COUNT(*) as emails_sent,
  COUNT(*) FILTER (WHERE status = 'delivered') as delivered,
  COUNT(*) FILTER (WHERE status = 'opened') as opened,
  COUNT(*) FILTER (WHERE status = 'clicked') as clicked,
  COUNT(*) FILTER (WHERE status = 'replied') as replied,
  COUNT(*) FILTER (WHERE status = 'bounced') as bounced,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'opened') / NULLIF(COUNT(*) FILTER (WHERE status = 'delivered'), 0), 2) as open_rate,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'clicked') / NULLIF(COUNT(*) FILTER (WHERE status = 'delivered'), 0), 2) as click_rate,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'replied') / NULLIF(COUNT(*) FILTER (WHERE status = 'delivered'), 0), 2) as reply_rate
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
-- Sample Data (Optional)
-- ============================================

-- Insert sample notification rules
INSERT INTO notification_rules (name, trigger, channels, priority, recipients, created_by)
SELECT
  'High bounce rate alert',
  '{"metric": "bounce_rate", "operator": ">", "threshold": 5, "time_window_minutes": 60}'::jsonb,
  ARRAY['email', 'slack'],
  'high',
  '{"email": ["admin@example.com"], "slack_channel": "#alerts"}'::jsonb,
  id
FROM auth.users LIMIT 1
ON CONFLICT DO NOTHING;

COMMENT ON TABLE leads IS 'Lead information and tracking';
COMMENT ON TABLE email_logs IS 'Detailed email sending and engagement logs';
COMMENT ON TABLE campaigns IS 'Marketing campaigns';
COMMENT ON TABLE anomaly_alerts IS 'AI-powered anomaly detection alerts';
COMMENT ON TABLE system_health IS 'Real-time system health monitoring';

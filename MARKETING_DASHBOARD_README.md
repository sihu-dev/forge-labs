# Marketing Automation Dashboard

> Comprehensive sales/marketing analytics dashboard with real-time monitoring, anomaly detection, and multi-channel alerting.

## Architecture Overview

This dashboard follows the FORGE LABS Nano-Factor hierarchy:

- **L0 (Atoms)**: Type definitions in `/packages/types/src/marketing/`
- **L1 (Molecules)**: Utility functions in `/packages/utils/src/marketing-metrics.ts`
- **L2 (Cells)**: UI components in `/apps/bidflow/src/components/marketing-dashboard/`
- **L3 (Tissues)**: Application layer (Supabase Edge Functions)

## Features

### 1. Dashboard Layout

#### **Executive Summary View**
- **Key Metrics**:
  - Leads Generated (daily/weekly/monthly)
  - Conversion Rate
  - Pipeline Value
  - CAC (Customer Acquisition Cost)
  - LTV (Lifetime Value)
  - LTV:CAC Ratio
  - ROI
  - Email Performance Overview

- **Trend Charts**:
  - Leads & Conversions (30-day line chart)
  - Revenue Trend (30-day area chart)
  - Quick stats with visual indicators

#### **Pipeline Visualization**
- Visual funnel chart (Lead → Qualified → Opportunity → Proposal → Converted)
- Conversion rates by stage
- Drop-off analysis
- Source breakdown (horizontal bar charts)
- Pipeline velocity (average days to conversion)

#### **Outreach Performance Metrics**
- Email statistics:
  - Sent, Delivered, Opened, Clicked, Replied
  - Delivery rate, Open rate, Click rate, Reply rate
  - Bounce rate, Unsubscribe rate
- Best send times heatmap (by hour and day of week)
- Sequence performance tracking

#### **Content Marketing Analytics**
- Content performance by type (blog, whitepaper, ebook, video, webinar, case study)
- Views, Unique visitors, Avg. time on page
- Leads generated, Conversions, Conversion rate
- Social shares, Backlinks
- Top-performing content ranking

#### **Revenue Attribution**
- Multi-touch attribution models:
  - First-Touch
  - Last-Touch
  - Linear
  - Time-Decay
  - U-Shaped (Position-Based)
- Channel attribution breakdown
- Campaign attribution
- Content attribution
- Attribution comparison charts

### 2. Key Performance Indicators (KPIs)

| Category | Metric | Formula | Good Threshold |
|----------|--------|---------|----------------|
| **Lead Generation** | New Leads | COUNT(leads) | Trend: ↑ |
| | Qualified Rate | (qualified / new_leads) × 100 | ≥ 40% |
| | Conversion Rate | (conversions / new_leads) × 100 | ≥ 3% |
| **Email Outreach** | Delivery Rate | (delivered / sent) × 100 | ≥ 95% |
| | Open Rate | (opened / delivered) × 100 | ≥ 25% |
| | Click Rate | (clicked / delivered) × 100 | ≥ 3% |
| | Reply Rate | (replied / delivered) × 100 | ≥ 5% |
| | Meeting Rate | (meetings / delivered) × 100 | ≥ 2% |
| **Financial** | CAC | (marketing_spend + sales_spend) / new_customers | Trend: ↓ |
| | LTV | avg_monthly_revenue × avg_tenure_months × profit_margin | Trend: ↑ |
| | LTV:CAC Ratio | LTV / CAC | ≥ 3:1 |
| | ROI | ((revenue - cost) / cost) × 100 | ≥ 200% |
| **Pipeline** | Velocity | avg(converted_at - created_at) | Trend: ↓ |
| | Pipeline Value | SUM(opportunity_values) | Trend: ↑ |

### 3. Real-time Monitoring

#### **System Health Dashboard**
- Overall status indicator (Healthy / Degraded / Down)
- Component monitoring:
  - Email Delivery (rate, error rate, queue size)
  - API Status (response time, error rate, rate limits)
  - Database (query time, connections)
  - External Integrations (status, last checked)

#### **Anomaly Detection (AI-Powered)**
- Z-Score based detection
- Moving Average deviation detection
- Claude AI analysis for root cause identification
- Automatic alert generation with:
  - Spike / Drop / Anomaly classification
  - Severity levels (Low / Medium / High / Critical)
  - Current vs. Expected values
  - Deviation percentage
  - Recommended actions

#### **Active Sequences Monitoring**
- Real-time subscriber counts
- Sequence status (Active / Paused / Completed)
- Performance metrics per sequence

### 4. Visualization Components

All charts use **Recharts** library for responsive, interactive visualizations:

#### **Funnel Chart**
- Visual representation of conversion funnel
- Stage-by-stage drop-off analysis
- Hover tooltips with detailed metrics

#### **Time Series (Line/Area Charts)**
- Leads & Conversions trend
- Revenue growth over time
- Custom date range selection

#### **Heatmap**
- Best send times (hour × day of week)
- Color-coded by open rate and reply rate
- Interactive tooltips

#### **Geo Distribution**
- Lead sources by location (if enabled)
- Heat map overlay
- Zoom and pan controls

#### **Sankey Diagram**
- Multi-touch attribution flow
- Channel → Campaign → Content → Conversion
- Weighted by revenue contribution

#### **Bar Charts**
- Horizontal: Source comparison
- Vertical: Campaign performance
- Stacked: Conversion funnel stages

#### **Pie/Donut Charts**
- Source distribution
- Campaign budget allocation
- Channel mix

### 5. Tech Stack

#### **Frontend**
- **Framework**: Next.js 15 (App Router)
- **UI Library**: @forge/ui (Supabase-inspired components)
- **Charts**: Recharts
- **Styling**: TailwindCSS
- **Icons**: Lucide React
- **Type Safety**: TypeScript (strict mode)

#### **Backend**
- **Database**: Supabase PostgreSQL
- **Real-time**: Supabase Realtime (WebSocket subscriptions)
- **Edge Functions**: Deno runtime
- **Cron Jobs**: Supabase pg_cron extension

#### **Data Layer**
- **ORM**: Supabase JS Client
- **Migrations**: SQL files in `/supabase/migrations/`
- **Row-Level Security (RLS)**: Enabled on all tables
- **Materialized Views**: Daily metrics rollup for performance

### 6. Alert System

#### **Notification Channels**
- **Email**: Transactional emails via Resend/SendGrid
- **Slack**: Webhook integration with rich formatting
- **Webhook**: Custom HTTP POST to external services
- **SMS**: Twilio integration (optional)

#### **Alert Configuration**
```typescript
interface NotificationRule {
  name: string;
  enabled: boolean;
  trigger: {
    metric: string;          // e.g., "bounce_rate"
    operator: '>' | '<' | '=';
    threshold: number;       // e.g., 5
    time_window_minutes?: number;
  };
  channels: ('email' | 'slack' | 'webhook' | 'sms')[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  recipients: {
    email?: string[];
    slack_channel?: string;
    webhook_url?: string;
    phone_numbers?: string[];
  };
  cooldown_minutes: number;  // Prevent spam
}
```

#### **Alert Example**
```json
{
  "name": "High Bounce Rate Alert",
  "enabled": true,
  "trigger": {
    "metric": "bounce_rate",
    "operator": ">",
    "threshold": 5,
    "time_window_minutes": 60
  },
  "channels": ["email", "slack"],
  "priority": "high",
  "recipients": {
    "email": ["marketing@company.com"],
    "slack_channel": "#marketing-alerts"
  },
  "cooldown_minutes": 60
}
```

#### **Slack Message Format**
```
🚨 Marketing Anomaly Detected

Metric: BOUNCE RATE
Severity: HIGH
Current Value: 8.5%
Expected Value: 2.1%
Deviation: +304%

Description: Email bounce rate has increased significantly

Recommended Action: Check email list quality and sender reputation

Marketing Analytics Dashboard | 2:30 PM
```

## File Structure

```
forge-labs/
├── packages/
│   ├── types/src/marketing/
│   │   └── index.ts              # L0 Types (37 interfaces, 15 enums)
│   └── utils/src/
│       └── marketing-metrics.ts  # L1 Utilities (25+ calculation functions)
│
├── apps/bidflow/src/components/marketing-dashboard/
│   ├── MarketingDashboard.tsx    # Main dashboard component
│   ├── ExecutiveSummary.tsx      # Summary view with KPIs
│   ├── PipelineView.tsx          # Funnel visualization
│   ├── OutreachMetrics.tsx       # Email performance
│   ├── ContentAnalytics.tsx      # Content marketing
│   ├── RevenueAttribution.tsx    # Attribution modeling
│   ├── RealTimeMonitor.tsx       # System health & alerts
│   └── DateRangeSelector.tsx     # Date picker component
│
├── supabase/
│   ├── migrations/
│   │   └── 20251224_marketing_automation.sql  # Database schema
│   └── functions/
│       ├── marketing-metrics/index.ts         # Metrics aggregation
│       └── anomaly-detector/index.ts          # AI anomaly detection
│
└── MARKETING_DASHBOARD_README.md             # This file
```

## Database Schema

### Core Tables (14 tables)

1. **`leads`** - Lead information and tracking
2. **`lead_activities`** - Lead engagement history
3. **`campaigns`** - Marketing campaigns
4. **`campaign_performance`** - Campaign metrics snapshots
5. **`email_sequences`** - Email automation sequences
6. **`sequence_steps`** - Individual email steps
7. **`email_logs`** - Detailed email tracking
8. **`content_performance`** - Content marketing metrics
9. **`ltv_analysis`** - Customer lifetime value analysis
10. **`system_health`** - Real-time system monitoring
11. **`anomaly_alerts`** - Detected anomalies
12. **`notification_rules`** - Alert configuration
13. **`dashboards`** - Custom dashboard definitions
14. **`dashboard_widgets`** - Widget configurations

### Materialized Views (2 views)

1. **`daily_metrics`** - Daily lead metrics rollup
2. **`email_performance_daily`** - Daily email stats rollup

### Automated Triggers

- `updated_at` timestamp auto-update
- Lead status change logging
- Email status stats aggregation

## API Endpoints

### Edge Functions

#### **1. Marketing Metrics Aggregation**
```bash
POST /functions/v1/marketing-metrics
```

**Request:**
```json
{
  "period": {
    "start": "2024-01-01T00:00:00Z",
    "end": "2024-01-31T23:59:59Z"
  },
  "metrics": ["pipeline", "outreach", "content", "ltv", "campaigns"]
}
```

**Response:**
```json
{
  "success": true,
  "period": { "start": "...", "end": "..." },
  "metrics": {
    "pipeline": {
      "new_leads": 1247,
      "qualified_leads": 485,
      "opportunities": 142,
      "conversions": 47,
      "overall_conversion_rate": 3.77,
      "avg_pipeline_velocity_days": 28.5
    },
    "outreach": {
      "emails_sent": 12480,
      "delivery_rate": 97.2,
      "open_rate": 28.5,
      "click_rate": 4.8,
      "reply_rate": 6.2
    },
    "content": { ... },
    "ltv": { ... },
    "campaigns": { ... }
  },
  "generated_at": "2024-12-24T10:30:00Z"
}
```

#### **2. Anomaly Detection**
```bash
POST /functions/v1/anomaly-detector
```

**Response:**
```json
{
  "success": true,
  "anomalies_detected": 2,
  "anomalies": [
    {
      "type": "spike",
      "severity": "high",
      "metric_name": "bounce_rate",
      "current_value": 8.5,
      "expected_value": 2.1,
      "deviation_percent": 304,
      "description": "Email bounce rate has increased significantly",
      "detected_at": "2024-12-24T10:30:00Z"
    }
  ],
  "checked_at": "2024-12-24T10:30:00Z"
}
```

## Supabase Queries

### Example: Get Pipeline Metrics

```typescript
import { createClient } from '@supabase/supabase-js';
import { aggregatePipelineMetrics } from '@forge/utils/src/marketing-metrics';

const supabase = createClient(url, key);

// Fetch leads for period
const { data: leads } = await supabase
  .from('leads')
  .select('*')
  .gte('created_at', period.start)
  .lte('created_at', period.end);

// Calculate metrics
const metrics = aggregatePipelineMetrics(leads, period);
```

### Example: Real-time Subscription

```typescript
// Subscribe to anomaly alerts
const channel = supabase
  .channel('anomaly-alerts')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'anomaly_alerts',
    },
    (payload) => {
      console.log('New anomaly detected:', payload.new);
      // Update UI
      setAlerts((prev) => [payload.new, ...prev]);
    }
  )
  .subscribe();
```

### Example: Query Email Performance

```typescript
// Get email performance for last 30 days
const { data: performance } = await supabase
  .from('email_performance_daily')
  .select('*')
  .gte('date', thirtyDaysAgo)
  .order('date', { ascending: true });
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd apps/bidflow
pnpm install
```

### 2. Configure Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional: Alert integrations
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx
RESEND_API_KEY=re_xxx
TWILIO_ACCOUNT_SID=xxx
TWILIO_AUTH_TOKEN=xxx
```

### 3. Run Database Migrations

```bash
# Initialize Supabase locally (optional)
supabase init

# Run migrations
supabase db push

# Or apply manually
psql -h db.xxx.supabase.co -U postgres -d postgres < supabase/migrations/20251224_marketing_automation.sql
```

### 4. Deploy Edge Functions

```bash
# Deploy marketing-metrics function
supabase functions deploy marketing-metrics

# Deploy anomaly-detector function
supabase functions deploy anomaly-detector

# Set up cron job (run anomaly detector every 5 minutes)
SELECT cron.schedule(
  'anomaly-detection',
  '*/5 * * * *',
  $$SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/anomaly-detector',
    headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  )$$
);
```

### 5. Start Development Server

```bash
pnpm dev
```

Navigate to: `http://localhost:3010/dashboard/marketing`

## Usage Examples

### Creating a Custom Notification Rule

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, key);

await supabase.from('notification_rules').insert({
  name: 'Low Conversion Rate Alert',
  enabled: true,
  trigger: {
    metric: 'conversion_rate',
    operator: '<',
    threshold: 2.5,
    time_window_minutes: 1440, // 24 hours
  },
  channels: ['email', 'slack'],
  priority: 'high',
  recipients: {
    email: ['sales@company.com'],
    slack_channel: '#sales-alerts',
  },
  cooldown_minutes: 120, // 2 hours
});
```

### Analyzing Best Send Times

```typescript
import { analyzeBestSendTimes } from '@forge/utils/src/marketing-metrics';

const { data: emails } = await supabase
  .from('email_logs')
  .select('sent_at, opened_at, replied_at')
  .gte('sent_at', last30Days);

const bestTimes = analyzeBestSendTimes(emails);

// Returns:
// [
//   { hour: 10, day_of_week: 2, open_rate: 32.5, reply_rate: 8.2 },
//   { hour: 14, day_of_week: 3, open_rate: 30.1, reply_rate: 7.5 },
//   ...
// ]
```

### Calculating Multi-Touch Attribution

```typescript
import {
  calculateLinearAttribution,
  calculateTimeDecayAttribution,
  calculateUShapedAttribution,
} from '@forge/utils/src/marketing-metrics';

const conversions = [
  {
    channel: 'paid_ad',
    touchpoints: [
      { channel: 'paid_ad', timestamp: '2024-01-01T10:00:00Z' },
      { channel: 'email', timestamp: '2024-01-05T14:00:00Z' },
      { channel: 'webinar', timestamp: '2024-01-10T16:00:00Z' },
      { channel: 'website', timestamp: '2024-01-15T09:00:00Z' },
    ],
    revenue: 5000,
    converted_at: '2024-01-15T10:00:00Z',
  },
];

// Linear attribution (equal credit)
const linear = calculateLinearAttribution(conversions);
// { paid_ad: 1250, email: 1250, webinar: 1250, website: 1250 }

// Time-decay (recent touches get more credit)
const timeDecay = calculateTimeDecayAttribution(conversions, 7);
// { paid_ad: 312, email: 625, webinar: 1250, website: 2813 }

// U-Shaped (40% first, 40% last, 20% middle)
const uShaped = calculateUShapedAttribution(conversions);
// { paid_ad: 2000, email: 500, webinar: 500, website: 2000 }
```

## Performance Optimizations

1. **Materialized Views**: Daily metrics pre-aggregated for fast queries
2. **Indexes**: Comprehensive indexing on frequently queried columns
3. **Edge Functions**: Compute-heavy aggregations run on edge
4. **Realtime Subscriptions**: WebSocket for live updates (not polling)
5. **Caching**: Client-side caching with React Query (optional)

## Security Best Practices

1. **Row-Level Security (RLS)**: All tables have RLS policies
2. **Service Role Key**: Only used in Edge Functions (never exposed)
3. **API Key Rotation**: Regular rotation of Supabase keys
4. **HTTPS Only**: All API calls over HTTPS
5. **Input Validation**: Zod schemas on all user inputs

## Monitoring & Observability

- **System Health**: Real-time component status
- **Error Tracking**: Centralized error logging
- **Performance Metrics**: Query times, API latency
- **Anomaly Detection**: AI-powered alerts
- **Audit Logs**: Lead activity tracking

## Future Enhancements

- [ ] **Predictive Analytics**: ML models for lead scoring
- [ ] **A/B Testing**: Campaign variant testing
- [ ] **Custom Dashboards**: Drag-and-drop widget builder
- [ ] **Export to PDF**: Automated report generation
- [ ] **Mobile App**: React Native companion app
- [ ] **Integrations**: Salesforce, HubSpot, Marketo connectors
- [ ] **Voice Alerts**: Twilio call notifications
- [ ] **Advanced Attribution**: Machine learning models

## License

MIT

## Support

For questions or issues, contact: `engineering@forge-labs.com`

---

**Built with FORGE LABS architecture** | Nano-Factor L0→L1→L2→L3

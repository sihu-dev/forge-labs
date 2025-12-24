# CRM Synchronization Architecture

> **Version**: 1.0.0
> **Last Updated**: 2024-12-24
> **Status**: Design Complete

---

## Executive Summary

Enterprise-grade CRM synchronization system for FORGE LABS platform supporting:
- **HubSpot** (Primary - recommended for B2B)
- **Pipedrive** (Alternative - sales-focused)
- **Custom Supabase CRM** (Budget option - full control)

### Key Features
- **Real-time bidirectional sync** via webhooks
- **Batch sync** for historical data migration
- **Conflict resolution** with configurable strategies
- **Multi-tenant isolation** for enterprise customers
- **Audit trail** for compliance

---

## 1. CRM Platform Comparison

| Feature | HubSpot | Pipedrive | Custom Supabase |
|---------|---------|-----------|-----------------|
| **Cost** | $45/mo (Starter) | $14.90/mo | $25/mo (Pro tier) |
| **API Quality** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ (Own) |
| **Webhooks** | ✅ Real-time | ✅ Real-time | ✅ Supabase Realtime |
| **Rate Limits** | 100 req/10s | 100 req/120s | Unlimited |
| **MCP Support** | ✅ Available | ❌ None | ✅ Custom |
| **Learning Curve** | Medium | Easy | Hard |
| **Recommended For** | B2B SaaS | Sales teams | Developers |

### Recommendation Matrix

| Use Case | Primary | Alternative |
|----------|---------|-------------|
| **BIDFLOW** (Lead gen) | HubSpot | Custom |
| **FOLIO** (Sales data) | Pipedrive | HubSpot |
| **HEPHAITOS** (Mentor/Mentee) | Custom | HubSpot |

---

## 2. Data Sync Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         SYNC ORCHESTRATOR                       │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   HubSpot    │  │  Pipedrive   │  │   Supabase   │         │
│  │   Adapter    │  │   Adapter    │  │     CRM      │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                 │                 │                  │
│         └─────────────────┴─────────────────┘                  │
│                           │                                    │
│                  ┌────────▼────────┐                           │
│                  │  Unified CRM    │                           │
│                  │  Entity Mapper  │                           │
│                  └────────┬────────┘                           │
│                           │                                    │
│         ┌─────────────────┼─────────────────┐                 │
│         │                 │                 │                 │
│    ┌────▼────┐      ┌─────▼─────┐    ┌─────▼─────┐           │
│    │ Contact │      │  Company  │    │   Deal    │           │
│    │  Sync   │      │   Sync    │    │   Sync    │           │
│    └────┬────┘      └─────┬─────┘    └─────┬─────┘           │
│         │                 │                 │                 │
│         └─────────────────┴─────────────────┘                 │
│                           │                                    │
│                  ┌────────▼────────┐                           │
│                  │ Conflict        │                           │
│                  │ Resolver        │                           │
│                  └────────┬────────┘                           │
│                           │                                    │
│                  ┌────────▼────────┐                           │
│                  │   Supabase DB   │                           │
│                  │  (Source of     │                           │
│                  │    Truth)       │                           │
│                  └─────────────────┘                           │
└─────────────────────────────────────────────────────────────────┘
```

### Sync Modes

#### 1. Real-time Sync (Webhooks)
```typescript
// HubSpot → Supabase
HubSpot Webhook → API Endpoint → Validate → Transform → Upsert → Publish Event

// Supabase → HubSpot
Supabase Trigger → Queue Job → Transform → HubSpot API → Update Local
```

**Latency**: < 5 seconds
**Use Case**: Contact updates, deal stage changes

#### 2. Batch Sync (Scheduled)
```typescript
// Historical Data Migration
Cron Job (hourly) → Fetch Changed Records → Bulk Transform → Bulk Upsert

// Reconciliation
Cron Job (daily) → Compare Checksums → Detect Drift → Auto-resolve or Alert
```

**Latency**: 5-60 minutes
**Use Case**: Initial import, data reconciliation

#### 3. Manual Sync (On-demand)
```typescript
User Action → UI Button → Trigger Sync → Progress Indicator → Success/Error
```

**Latency**: Immediate
**Use Case**: Force refresh, troubleshooting

---

## 3. Entity Mapping

### Contact (Lead/Customer)

| Unified Field | HubSpot | Pipedrive | Supabase CRM |
|---------------|---------|-----------|--------------|
| `id` | `vid` (legacy) / `id` (v3) | `id` | `uuid` |
| `email` | `email` | `email[0].value` | `email` |
| `first_name` | `firstname` | `first_name` | `first_name` |
| `last_name` | `lastname` | `last_name` | `last_name` |
| `phone` | `phone` | `phone[0].value` | `phone` |
| `company_id` | `associatedcompanyid` | `org_id` | `company_id` |
| `lifecycle_stage` | `lifecyclestage` | `custom: stage` | `lifecycle_stage` |
| `lead_source` | `hs_lead_source` | `custom: source` | `source` |
| `created_at` | `createdate` | `add_time` | `created_at` |
| `updated_at` | `lastmodifieddate` | `update_time` | `updated_at` |

### Company (Account/Organization)

| Unified Field | HubSpot | Pipedrive | Supabase CRM |
|---------------|---------|-----------|--------------|
| `id` | `companyId` | `id` | `uuid` |
| `name` | `name` | `name` | `name` |
| `domain` | `domain` | `custom: domain` | `domain` |
| `industry` | `industry` | `custom: industry` | `industry` |
| `employee_count` | `numberofemployees` | `people_count` | `employee_count` |
| `annual_revenue` | `annualrevenue` | `custom: revenue` | `annual_revenue` |
| `website` | `website` | `address` | `website` |

### Deal (Opportunity)

| Unified Field | HubSpot | Pipedrive | Supabase CRM |
|---------------|---------|-----------|--------------|
| `id` | `dealId` | `id` | `uuid` |
| `name` | `dealname` | `title` | `name` |
| `amount` | `amount` | `value` | `amount` |
| `stage` | `dealstage` | `stage_id` | `stage` |
| `probability` | `custom: probability` | `probability` | `probability` |
| `close_date` | `closedate` | `expected_close_date` | `close_date` |
| `owner_id` | `hubspot_owner_id` | `user_id` | `owner_id` |

### Activity (Timeline Event)

| Unified Field | HubSpot | Pipedrive | Supabase CRM |
|---------------|---------|-----------|--------------|
| `id` | `engagement.id` | `id` | `uuid` |
| `type` | `engagement.type` | `type` | `type` |
| `subject` | `metadata.subject` | `subject` | `subject` |
| `body` | `metadata.body` | `note` | `body` |
| `timestamp` | `engagement.timestamp` | `add_time` | `timestamp` |
| `contact_id` | `associations.contactIds[0]` | `person_id` | `contact_id` |

---

## 4. Conflict Resolution Strategies

### 4.1 Timestamp-based (Default)
```typescript
if (remote.updated_at > local.updated_at) {
  applyRemoteChanges();
} else {
  keepLocalChanges();
}
```

**Pros**: Simple, deterministic
**Cons**: Doesn't handle concurrent edits

### 4.2 Source Priority
```typescript
const priority = ['hubspot', 'pipedrive', 'supabase'];
const winner = conflicts.sort((a, b) =>
  priority.indexOf(a.source) - priority.indexOf(b.source)
)[0];
```

**Pros**: Clear business rules
**Cons**: May lose user edits

### 4.3 Field-level Merge
```typescript
const merged = {
  email: remote.email || local.email, // Remote wins if exists
  phone: local.phone || remote.phone, // Local wins if exists
  notes: `${local.notes}\n---\n${remote.notes}`, // Append
};
```

**Pros**: Preserves more data
**Cons**: Complex logic

### 4.4 Manual Review (Safest)
```typescript
if (detectConflict(local, remote)) {
  createConflictRecord({
    entity_type: 'contact',
    entity_id: local.id,
    local_snapshot: local,
    remote_snapshot: remote,
    status: 'pending_review',
  });
  notifyAdmin();
}
```

**Pros**: Human validation
**Cons**: Slow, requires UI

---

## 5. Automation Rules

### Rule Engine Architecture
```typescript
interface AutomationRule {
  id: string;
  name: string;
  trigger: TriggerConfig;
  conditions: ConditionConfig[];
  actions: ActionConfig[];
  enabled: boolean;
}

type TriggerType =
  | 'contact_created'
  | 'contact_updated'
  | 'deal_stage_changed'
  | 'meeting_scheduled'
  | 'email_replied';

type ActionType =
  | 'create_contact'
  | 'update_deal_stage'
  | 'create_task'
  | 'send_notification'
  | 'add_to_sequence';
```

### Pre-configured Rules

#### 1. Auto-create Contact on First Reply
```yaml
trigger: email_replied
conditions:
  - sender_is_new: true
actions:
  - create_contact:
      source: 'inbound_email'
      lifecycle_stage: 'lead'
  - create_deal:
      name: 'Inbound Lead - {email}'
      stage: 'qualified'
  - notify_owner: true
```

#### 2. Update Deal Stage on Meeting Scheduled
```yaml
trigger: meeting_scheduled
conditions:
  - contact_has_open_deal: true
  - deal_stage: ['qualified', 'meeting_scheduled']
actions:
  - update_deal:
      stage: 'meeting_scheduled'
      probability: 30
  - create_task:
      title: 'Prepare for meeting with {contact_name}'
      due_date: '{meeting_date - 1 day}'
```

#### 3. Create Task on Follow-up Needed
```yaml
trigger: deal_stage_changed
conditions:
  - new_stage: 'proposal_sent'
actions:
  - create_task:
      title: 'Follow up on proposal'
      due_date: '+3 days'
      assigned_to: '{deal_owner}'
  - schedule_reminder:
      delay_hours: 72
```

#### 4. Alert on Deal at Risk
```yaml
trigger: deal_updated
conditions:
  - close_date: '< 7 days'
  - stage: ['proposal_sent', 'negotiation']
  - last_activity: '> 3 days ago'
actions:
  - send_alert:
      to: '{deal_owner}'
      message: 'Deal closing soon but no recent activity'
      priority: 'high'
  - update_deal:
      custom_field_risk_level: 'high'
```

---

## 6. HubSpot MCP Integration

### Available Tools (via MCP)

```typescript
// HubSpot MCP Server provides:
mcp__hubspot__search_contacts(query: string)
mcp__hubspot__get_contact(contactId: string)
mcp__hubspot__create_contact(properties: ContactProperties)
mcp__hubspot__update_contact(contactId: string, properties: ContactProperties)
mcp__hubspot__search_companies(query: string)
mcp__hubspot__get_company(companyId: string)
mcp__hubspot__create_company(properties: CompanyProperties)
mcp__hubspot__search_deals(query: string)
mcp__hubspot__get_deal(dealId: string)
mcp__hubspot__create_deal(properties: DealProperties)
```

### Custom Properties Setup

#### Contact Properties
```typescript
const CUSTOM_CONTACT_PROPERTIES = [
  {
    name: 'forge_user_id',
    label: 'Forge User ID',
    type: 'string',
    fieldType: 'text',
    groupName: 'forge_integration',
  },
  {
    name: 'forge_signup_source',
    label: 'Signup Source',
    type: 'enumeration',
    options: ['hephaitos', 'bidflow', 'folio', 'dryon'],
    groupName: 'forge_integration',
  },
  {
    name: 'forge_plan',
    label: 'Plan Type',
    type: 'enumeration',
    options: ['free', 'pro', 'enterprise'],
    groupName: 'forge_integration',
  },
  {
    name: 'forge_mrr',
    label: 'Monthly Recurring Revenue',
    type: 'number',
    fieldType: 'number',
    groupName: 'forge_integration',
  },
  {
    name: 'forge_last_login',
    label: 'Last Login',
    type: 'datetime',
    fieldType: 'date',
    groupName: 'forge_integration',
  },
];
```

#### Deal Properties
```typescript
const CUSTOM_DEAL_PROPERTIES = [
  {
    name: 'forge_product',
    label: 'Product',
    type: 'enumeration',
    options: ['hephaitos', 'bidflow', 'folio', 'dryon', 'bundle'],
    groupName: 'forge_integration',
  },
  {
    name: 'forge_contract_type',
    label: 'Contract Type',
    type: 'enumeration',
    options: ['monthly', 'annual', 'enterprise'],
    groupName: 'forge_integration',
  },
];
```

### Workflow Triggers

```typescript
// HubSpot Workflow → Webhook → Forge API
interface HubSpotWorkflowWebhook {
  objectId: string; // Contact/Company/Deal ID
  subscriptionType: string; // contact.creation, deal.propertyChange
  propertyName?: string;
  propertyValue?: string;
}

// Handle in Forge
app.post('/api/v1/webhooks/hubspot', async (req, res) => {
  const { objectId, subscriptionType, propertyName } = req.body;

  switch (subscriptionType) {
    case 'contact.creation':
      await handleNewContact(objectId);
      break;
    case 'deal.propertyChange':
      if (propertyName === 'dealstage') {
        await handleDealStageChange(objectId);
      }
      break;
  }

  res.status(200).send('OK');
});
```

---

## 7. Reporting Sync

### Daily Pipeline Snapshot
```sql
-- Materialized view (refreshed daily at 00:00 UTC)
CREATE MATERIALIZED VIEW crm_daily_pipeline_snapshot AS
SELECT
  DATE_TRUNC('day', NOW()) as snapshot_date,
  stage,
  COUNT(*) as deal_count,
  SUM(amount) as total_value,
  AVG(amount) as avg_deal_size,
  SUM(amount * probability / 100) as weighted_value
FROM crm_deals
WHERE status = 'open'
GROUP BY stage;

-- Historical tracking
INSERT INTO crm_pipeline_history
SELECT * FROM crm_daily_pipeline_snapshot;
```

### Weekly Activity Summary
```sql
CREATE VIEW crm_weekly_activity_summary AS
SELECT
  owner_id,
  COUNT(*) FILTER (WHERE type = 'call') as calls,
  COUNT(*) FILTER (WHERE type = 'email') as emails,
  COUNT(*) FILTER (WHERE type = 'meeting') as meetings,
  COUNT(DISTINCT contact_id) as contacts_engaged
FROM crm_activities
WHERE timestamp >= NOW() - INTERVAL '7 days'
GROUP BY owner_id;
```

### Monthly Revenue Forecast
```sql
CREATE VIEW crm_monthly_revenue_forecast AS
SELECT
  DATE_TRUNC('month', close_date) as forecast_month,
  SUM(amount) FILTER (WHERE probability >= 90) as committed,
  SUM(amount) FILTER (WHERE probability BETWEEN 50 AND 89) as upside,
  SUM(amount) FILTER (WHERE probability < 50) as pipeline,
  SUM(amount * probability / 100) as weighted_total
FROM crm_deals
WHERE status = 'open'
  AND close_date >= DATE_TRUNC('month', NOW())
  AND close_date < DATE_TRUNC('month', NOW()) + INTERVAL '6 months'
GROUP BY DATE_TRUNC('month', close_date)
ORDER BY forecast_month;
```

---

## 8. Multi-tenant Isolation

```sql
-- RLS Policy for Contacts
CREATE POLICY tenant_isolation_contacts ON crm_contacts
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- RLS Policy for Deals
CREATE POLICY tenant_isolation_deals ON crm_deals
  USING (tenant_id IN (
    SELECT tenant_id FROM crm_contacts WHERE id = crm_deals.contact_id
  ));
```

---

## 9. Performance Optimization

### Indexing Strategy
```sql
-- Composite indexes for common queries
CREATE INDEX idx_contacts_tenant_email ON crm_contacts(tenant_id, email);
CREATE INDEX idx_deals_tenant_stage ON crm_deals(tenant_id, stage);
CREATE INDEX idx_activities_contact_timestamp ON crm_activities(contact_id, timestamp DESC);

-- GIN index for JSONB fields
CREATE INDEX idx_contacts_custom_fields ON crm_contacts USING GIN(custom_fields);
```

### Caching Strategy
```typescript
// Redis cache for frequently accessed entities
const CACHE_TTL = {
  CONTACT: 300, // 5 minutes
  COMPANY: 600, // 10 minutes
  DEAL: 180,    // 3 minutes
};

async function getContact(id: string): Promise<Contact> {
  const cached = await redis.get(`contact:${id}`);
  if (cached) return JSON.parse(cached);

  const contact = await db.query('SELECT * FROM crm_contacts WHERE id = $1', [id]);
  await redis.setex(`contact:${id}`, CACHE_TTL.CONTACT, JSON.stringify(contact));

  return contact;
}
```

---

## 10. Security & Compliance

### API Key Management
```typescript
// Encrypt API keys using Supabase Vault
INSERT INTO vault.secrets (name, secret)
VALUES ('hubspot_api_key', 'pat-na1-...');

// Retrieve in application
const apiKey = await supabase.rpc('get_secret', { secret_name: 'hubspot_api_key' });
```

### Audit Trail
```sql
-- Audit log for all CRM changes
CREATE TABLE crm_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  entity_type TEXT NOT NULL, -- 'contact', 'company', 'deal'
  entity_id UUID NOT NULL,
  action TEXT NOT NULL, -- 'created', 'updated', 'deleted'
  changes JSONB, -- Field-level diff
  user_id UUID,
  source TEXT, -- 'hubspot', 'pipedrive', 'manual'
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_log_entity ON crm_audit_log(entity_type, entity_id);
```

### GDPR Compliance
```typescript
// Right to be forgotten
async function deletePersonalData(contactId: string) {
  // 1. Delete from Forge DB
  await db.query('DELETE FROM crm_contacts WHERE id = $1', [contactId]);

  // 2. Delete from HubSpot
  await hubspot.crm.contacts.basicApi.archive(contactId);

  // 3. Log deletion
  await db.query(
    'INSERT INTO crm_audit_log (entity_type, entity_id, action, user_id) VALUES ($1, $2, $3, $4)',
    ['contact', contactId, 'gdpr_deleted', userId]
  );
}
```

---

## 11. Implementation Phases

### Phase 1: Foundation (Week 1-2)
- ✅ Database schema design
- ✅ L0 type definitions
- ✅ L1 utility functions
- ✅ Basic Supabase CRM

### Phase 2: HubSpot Integration (Week 3-4)
- [ ] HubSpot API client
- [ ] Webhook handlers
- [ ] Entity mappers
- [ ] Real-time sync

### Phase 3: Automation (Week 5-6)
- [ ] Rule engine
- [ ] Pre-configured rules
- [ ] Task automation
- [ ] Notifications

### Phase 4: Reporting (Week 7-8)
- [ ] Pipeline snapshots
- [ ] Activity summaries
- [ ] Revenue forecasting
- [ ] Dashboard widgets

---

## 12. Monitoring & Alerts

### Key Metrics
```typescript
interface SyncMetrics {
  // Performance
  avg_sync_latency_ms: number;
  sync_success_rate: number;
  webhook_processing_time_ms: number;

  // Volume
  contacts_synced_24h: number;
  deals_synced_24h: number;
  activities_synced_24h: number;

  // Errors
  sync_failures_24h: number;
  conflict_count_24h: number;
  api_rate_limit_hits: number;
}
```

### Alerting Rules
```yaml
alerts:
  - name: high_sync_latency
    condition: avg_sync_latency_ms > 10000
    action: notify_devops

  - name: low_success_rate
    condition: sync_success_rate < 0.95
    action: create_incident

  - name: api_rate_limit
    condition: api_rate_limit_hits > 0
    action: notify_admin
```

---

## Appendix A: API Rate Limits

| Platform | Limit | Burst | Reset |
|----------|-------|-------|-------|
| HubSpot | 100 req/10s | 150 | 10s rolling |
| Pipedrive | 100 req/120s | N/A | 120s window |
| Supabase | Unlimited (own DB) | N/A | N/A |

---

## Appendix B: Estimated Costs

### Monthly Operational Costs
```
HubSpot Starter:          $45
Supabase Pro:             $25
Upstash Redis (cache):    $10
Sentry (monitoring):      $26
Total:                    $106/month
```

### Development Costs
```
Phase 1-4 (8 weeks):      80 hours
Hourly rate:              $100/hr
Total:                    $8,000
```

---

*Document maintained by: FORGE LABS Engineering*
*Next review: Q1 2025*

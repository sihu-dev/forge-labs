# CRM Synchronization - Implementation Guide

> **Quick Start Guide for Developers**
> **Version**: 1.0.0
> **Last Updated**: 2024-12-24

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [Usage Examples](#usage-examples)
5. [API Reference](#api-reference)
6. [Webhooks Setup](#webhooks-setup)
7. [Automation Rules](#automation-rules)
8. [Troubleshooting](#troubleshooting)

---

## Quick Start

### 1. Run Database Migration

```bash
# Navigate to core package
cd packages/core

# Run Supabase migration
supabase db push --file supabase/migrations/001_crm_schema.sql

# Verify tables created
supabase db diff
```

### 2. Set Environment Variables

```bash
# .env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# HubSpot
HUBSPOT_API_KEY=pat-na1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# Pipedrive (optional)
PIPEDRIVE_API_KEY=your-pipedrive-key
```

### 3. Initialize Sync Configuration

```typescript
import { createCRMSyncOrchestrator } from '@forge/core/services/crm-sync-orchestrator';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// Create sync orchestrator
const orchestrator = createCRMSyncOrchestrator({
  supabaseUrl: process.env.SUPABASE_URL!,
  supabaseKey: process.env.SUPABASE_SERVICE_KEY!,
});

// Initialize HubSpot
await orchestrator.initializePlatform('hubspot', {
  apiKey: process.env.HUBSPOT_API_KEY!,
});
```

### 4. Create Sync Configuration

```typescript
// Insert sync config into database
const { data: syncConfig } = await supabase
  .from('crm_sync_configs')
  .insert({
    tenant_id: 'your-tenant-uuid',
    platform: 'hubspot',
    sync_direction: 'bidirectional',
    sync_frequency_minutes: 60,
    conflict_strategy: 'timestamp_based',
    sync_contacts: true,
    sync_companies: true,
    sync_deals: true,
    credentials_vault_id: 'vault-secret-id',
    enabled: true,
  })
  .select()
  .single();
```

### 5. Run Initial Sync

```typescript
const result = await orchestrator.performSync(syncConfig);

if (result.success) {
  console.log('Sync completed:', result.data);
  console.log(`Synced ${result.data.contacts_synced} contacts`);
  console.log(`Synced ${result.data.deals_synced} deals`);
} else {
  console.error('Sync failed:', result.error);
}
```

---

## Installation

### 1. Install Dependencies

```bash
# Core packages (already in monorepo)
# @forge/types
# @forge/utils
# @forge/core

# External dependencies
pnpm add @supabase/supabase-js
pnpm add zod  # For validation
```

### 2. TypeScript Configuration

Ensure `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "moduleResolution": "bundler",
    "target": "ES2022",
    "module": "ESNext",
    "strict": true
  }
}
```

---

## Configuration

### Sync Configuration Options

| Field | Type | Description | Default |
|-------|------|-------------|---------|
| `platform` | `'hubspot' \| 'pipedrive' \| 'supabase'` | CRM platform | Required |
| `sync_direction` | `'push' \| 'pull' \| 'bidirectional'` | Sync direction | `'bidirectional'` |
| `sync_frequency_minutes` | `number` | Sync interval (0 = real-time only) | `60` |
| `conflict_strategy` | `ConflictResolutionStrategy` | How to resolve conflicts | `'timestamp_based'` |
| `source_priority` | `CRMPlatform[]` | Priority order for `source_priority` strategy | `['hubspot', 'supabase']` |
| `sync_contacts` | `boolean` | Enable contact sync | `true` |
| `sync_companies` | `boolean` | Enable company sync | `true` |
| `sync_deals` | `boolean` | Enable deal sync | `true` |
| `sync_activities` | `boolean` | Enable activity sync | `true` |
| `sync_tasks` | `boolean` | Enable task sync | `true` |

### Conflict Resolution Strategies

#### 1. Timestamp-based (Recommended)
```typescript
{
  conflict_strategy: 'timestamp_based'
}
```
- **How it works**: Newest record wins based on `updated_at`
- **Pros**: Simple, deterministic
- **Cons**: Might lose concurrent edits

#### 2. Source Priority
```typescript
{
  conflict_strategy: 'source_priority',
  source_priority: ['hubspot', 'pipedrive', 'supabase']
}
```
- **How it works**: Higher priority source wins
- **Pros**: Business logic control
- **Cons**: May lose user edits from lower priority sources

#### 3. Field Merge
```typescript
{
  conflict_strategy: 'field_merge'
}
```
- **How it works**: Smart field-level merge (e.g., append notes, max for scores)
- **Pros**: Preserves more data
- **Cons**: Complex logic, potential for unexpected results

#### 4. Manual Review
```typescript
{
  conflict_strategy: 'manual_review'
}
```
- **How it works**: Creates conflict record for human review
- **Pros**: Safest, human validation
- **Cons**: Requires admin UI, slow

---

## Usage Examples

### Example 1: Sync Contacts from HubSpot

```typescript
import { createHubSpotClient } from '@forge/core/services/hubspot-client';
import { mapHubSpotContactToUnified } from '@forge/utils/crm-entity-mapper';

const hubspot = createHubSpotClient({
  apiKey: process.env.HUBSPOT_API_KEY!,
});

// Search for contacts
const result = await hubspot.searchContacts('john@example.com');

if (result.success && result.data) {
  for (const hsContact of result.data) {
    // Map to unified format
    const unifiedContact = mapHubSpotContactToUnified(hsContact, tenantId);

    // Insert into Supabase
    const { error } = await supabase
      .from('crm_contacts')
      .upsert(unifiedContact);

    if (error) console.error('Insert failed:', error);
  }
}
```

### Example 2: Create Contact in HubSpot and Sync Back

```typescript
import { mapUnifiedContactToHubSpot } from '@forge/utils/crm-entity-mapper';

// Create contact in Supabase first
const { data: localContact } = await supabase
  .from('crm_contacts')
  .insert({
    tenant_id: 'tenant-uuid',
    email: 'jane@example.com',
    first_name: 'Jane',
    last_name: 'Doe',
    lifecycle_stage: 'lead',
  })
  .select()
  .single();

// Push to HubSpot
const hubspotProps = mapUnifiedContactToHubSpot(localContact);
const result = await hubspot.createContact(hubspotProps);

if (result.success && result.data) {
  // Store external ID
  await supabase
    .from('crm_contacts')
    .update({
      external_ids: [
        {
          platform: 'hubspot',
          external_id: result.data.id,
          last_synced_at: new Date().toISOString(),
        },
      ],
    })
    .eq('id', localContact.id);
}
```

### Example 3: Detect and Resolve Conflicts

```typescript
import { resolveConflict, detectConflictingFields } from '@forge/utils/crm-conflict-resolver';

// Fetch local contact
const { data: localContact } = await supabase
  .from('crm_contacts')
  .select()
  .eq('id', contactId)
  .single();

// Fetch remote contact from HubSpot
const hubspotResult = await hubspot.getContact(externalId);
const remoteContact = mapHubSpotContactToUnified(hubspotResult.data!, tenantId);

// Detect conflicts
const conflicts = detectConflictingFields(localContact, remoteContact);

if (conflicts.length > 0) {
  console.log('Conflicts detected:', conflicts);

  // Resolve
  const resolved = resolveConflict({
    local: localContact,
    remote: remoteContact,
    strategy: 'timestamp_based',
  });

  if (resolved.resolution === 'auto') {
    // Apply merge
    await supabase
      .from('crm_contacts')
      .update(resolved.merged)
      .eq('id', contactId);
  } else {
    // Create conflict record
    await supabase
      .from('crm_conflict_records')
      .insert({
        tenant_id: localContact.tenant_id,
        entity_type: 'contact',
        entity_id: contactId,
        local_snapshot: localContact,
        remote_snapshot: remoteContact,
        conflicting_fields: resolved.conflictingFields,
        status: 'pending',
      });
  }
}
```

### Example 4: Schedule Automated Sync (Cron)

```typescript
// Using Vercel Cron or similar
// api/cron/sync-crm.ts

import { createCRMSyncOrchestrator } from '@forge/core/services/crm-sync-orchestrator';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Verify cron secret
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  // Get all enabled sync configs
  const { data: configs } = await supabase
    .from('crm_sync_configs')
    .select()
    .eq('enabled', true)
    .lte('next_sync_at', new Date().toISOString());

  const orchestrator = createCRMSyncOrchestrator({
    supabaseUrl: process.env.SUPABASE_URL!,
    supabaseKey: process.env.SUPABASE_SERVICE_KEY!,
  });

  const results = await Promise.all(
    configs.map((config) => orchestrator.performSync(config))
  );

  return res.json({
    synced: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
  });
}
```

---

## Webhooks Setup

### HubSpot Webhook Configuration

#### 1. Create Webhook Endpoint

```typescript
// app/api/webhooks/hubspot/route.ts

import { createCRMSyncOrchestrator } from '@forge/core/services/crm-sync-orchestrator';

export async function POST(req: Request) {
  const body = await req.json();

  // Verify webhook signature (recommended)
  const signature = req.headers.get('x-hubspot-signature');
  if (!verifyHubSpotSignature(signature, body)) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // Get tenant's sync config
  const syncConfig = await getSyncConfigByWebhook(body.portalId);

  // Handle event
  const orchestrator = createCRMSyncOrchestrator({
    supabaseUrl: process.env.SUPABASE_URL!,
    supabaseKey: process.env.SUPABASE_SERVICE_KEY!,
  });

  await orchestrator.handleHubSpotWebhook(body, syncConfig);

  return Response.json({ success: true });
}
```

#### 2. Register Webhook in HubSpot

Go to HubSpot Settings → Integrations → Webhooks:

```
Target URL: https://yourapp.com/api/webhooks/hubspot
Subscriptions:
  - contact.creation
  - contact.propertyChange
  - deal.creation
  - deal.propertyChange (dealstage)
```

---

## Automation Rules

### Pre-configured Automation Examples

#### Auto-create Contact on Email Reply

```typescript
const rule: IAutomationRule = {
  name: 'Auto-create contact on email reply',
  enabled: true,
  trigger: {
    type: 'email_replied',
  },
  conditions: [
    {
      field: 'sender_email',
      operator: 'is_not_empty',
      value: null,
    },
  ],
  actions: [
    {
      type: 'create_contact',
      params: {
        lifecycle_stage: 'lead',
        lead_source: 'inbound_email',
      },
    },
    {
      type: 'create_deal',
      params: {
        name: 'Inbound Lead - {email}',
        stage: 'qualified_to_buy',
        amount: 0,
      },
    },
  ],
};

// Insert into database
await supabase.from('crm_automation_rules').insert(rule);
```

#### Update Deal Stage on Meeting Scheduled

```typescript
const rule: IAutomationRule = {
  name: 'Update deal on meeting scheduled',
  enabled: true,
  trigger: {
    type: 'meeting_scheduled',
  },
  conditions: [
    {
      field: 'deal.stage',
      operator: 'equals',
      value: 'qualified_to_buy',
    },
  ],
  actions: [
    {
      type: 'update_deal',
      params: {
        stage: 'presentation_scheduled',
        probability: 40,
      },
    },
    {
      type: 'create_task',
      params: {
        title: 'Prepare for meeting with {contact_name}',
        due_date: '{meeting_date - 1 day}',
        priority: 'high',
      },
    },
  ],
};
```

---

## Troubleshooting

### Common Issues

#### 1. Sync Not Running

**Symptom**: No data appearing after sync

**Diagnosis**:
```typescript
// Check sync job status
const { data: jobs } = await supabase
  .from('crm_sync_jobs')
  .select()
  .eq('sync_config_id', configId)
  .order('created_at', { ascending: false })
  .limit(5);

console.log('Recent jobs:', jobs);
```

**Solutions**:
- Verify `enabled = true` in sync config
- Check `credentials_vault_id` is correct
- Verify API key has correct permissions
- Check rate limits (HubSpot: 100 req/10s)

#### 2. Conflicts Not Auto-Resolving

**Symptom**: Many conflict records created

**Diagnosis**:
```typescript
const { data: conflicts } = await supabase
  .from('crm_conflict_records')
  .select()
  .eq('status', 'pending');

console.log(`${conflicts.length} pending conflicts`);
```

**Solutions**:
- Change `conflict_strategy` to `'field_merge'` or `'source_priority'`
- Review conflicting fields to identify patterns
- Implement custom merge logic for specific fields

#### 3. Webhook Delays

**Symptom**: Real-time sync delayed by 30+ seconds

**Diagnosis**:
```typescript
const { data: events } = await supabase
  .from('crm_webhook_events')
  .select()
  .eq('processed', false);

console.log(`${events.length} unprocessed events`);
```

**Solutions**:
- Check webhook endpoint response time (should be < 200ms)
- Use background queue for processing (Inngest, BullMQ)
- Verify webhook signature validation isn't slow

#### 4. Missing Custom Fields

**Symptom**: Custom fields not syncing

**Diagnosis**:
```typescript
import { extractHubSpotCustomFields } from '@forge/utils/crm-entity-mapper';

const customFields = extractHubSpotCustomFields(hubspotContact.properties);
console.log('Custom fields found:', Object.keys(customFields));
```

**Solutions**:
- Add custom field to `field_mappings` in sync config
- Ensure custom field name matches HubSpot internal name
- Check field permissions in HubSpot API key

---

## Performance Optimization

### 1. Batch Operations

Use batch endpoints for large syncs:

```typescript
// Instead of:
for (const contact of contacts) {
  await hubspot.updateContact(contact.id, contact.properties);
}

// Use:
await hubspot.batchUpsertContacts(
  contacts.map((c) => ({
    id: c.external_id,
    properties: mapUnifiedContactToHubSpot(c),
  }))
);
```

### 2. Incremental Sync

Only sync changed records:

```typescript
const since = new Date(lastSyncAt);
const result = await hubspot.getRecentlyModifiedContacts(since, 100);
```

### 3. Caching

Cache frequently accessed entities:

```typescript
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

// Cache contact
await redis.setex(`contact:${id}`, 300, JSON.stringify(contact));

// Retrieve
const cached = await redis.get(`contact:${id}`);
```

---

## Next Steps

1. **Set up monitoring**: Use Sentry or similar for error tracking
2. **Create admin UI**: Build conflict resolution dashboard
3. **Add more platforms**: Implement Pipedrive, Salesforce adapters
4. **Optimize queries**: Add composite indexes for common queries
5. **Write tests**: Add unit tests for mappers and conflict resolver

---

## Support

- **Documentation**: [CRM_SYNC_ARCHITECTURE.md](./CRM_SYNC_ARCHITECTURE.md)
- **GitHub Issues**: https://github.com/forge-labs/issues
- **Slack**: #crm-sync channel

---

*Last updated: 2024-12-24*
*Maintainer: FORGE LABS Engineering*

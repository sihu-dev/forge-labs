# @forge/integrations - Quick Reference

## Installation & Import

```typescript
import {
  PersanaClient,
  ApolloClient,
  AttioClient,
  N8nClient,
} from '@forge/integrations';
```

## Client Initialization

```typescript
// Persana AI
const persana = new PersanaClient({
  apiKey: process.env.PERSANA_API_KEY!,
  timeout: 30000,        // optional, default 30s
  retryAttempts: 3,      // optional, default 3
});

// Apollo.io
const apollo = new ApolloClient({
  apiKey: process.env.APOLLO_API_KEY!,
});

// Attio CRM
const attio = new AttioClient({
  apiKey: process.env.ATTIO_API_KEY!,
});

// n8n
const n8n = new N8nClient({
  apiKey: process.env.N8N_API_KEY!,
  baseUrl: process.env.N8N_BASE_URL!,
});
```

## Common Patterns

### Error Handling

```typescript
const response = await client.someMethod();

if (!response.success) {
  console.error(response.error?.message);
  return;
}

const data = response.data!;
// Use data safely
```

### Response Type

```typescript
interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string; details?: unknown };
  metadata?: { requestId: string; timestamp: string };
  pagination?: { /* for list endpoints */ };
}
```

## Persana AI Cheat Sheet

```typescript
// Enrich person
await persana.enrichPerson({ email: 'john@example.com' });
await persana.enrichPerson({ linkedinUrl: 'https://linkedin.com/in/john' });

// Enrich company
await persana.enrichCompany({ domain: 'example.com' });
await persana.enrichCompany({ companyName: 'Example Corp' });

// Tech stack
await persana.analyzeTechStack('example.com');

// Batch operations
await persana.batchEnrichPeople([{ email: '...' }, { email: '...' }]);
await persana.batchEnrichCompanies([{ domain: '...' }, { domain: '...' }]);
```

## Apollo.io Cheat Sheet

```typescript
// Search contacts
await apollo.searchContacts({
  q_keywords: 'CEO',
  person_titles: ['CEO', 'Founder'],
  person_locations: ['San Francisco, CA'],
  organization_num_employees_ranges: ['11-50', '51-200'],
  page: 1,
  per_page: 50,
});

// Get contact
await apollo.getContact('contact-id');

// Verify email
await apollo.verifyEmail({ email: 'john@example.com' });
await apollo.batchVerifyEmails(['email1@...', 'email2@...']);

// Sequences
await apollo.listSequences();
await apollo.getSequence('sequence-id');
await apollo.addToSequence({
  contact_ids: ['id1', 'id2'],
  sequence_id: 'seq-id',
});
await apollo.removeFromSequence('seq-id', 'contact-id');
await apollo.getSequenceContacts('seq-id');
```

## Attio CRM Cheat Sheet

```typescript
// Generic records
await attio.listRecords('leads', {
  filter: { attribute: 'status', operator: 'equals', value: 'qualified' },
  sorts: [{ attribute: 'created_at', direction: 'desc' }],
  limit: 50,
});
await attio.getRecord('leads', 'record-id');
await attio.createRecord('leads', { data: { values: {...} } });
await attio.updateRecord('leads', 'record-id', { data: { values: {...} } });
await attio.deleteRecord('leads', 'record-id');

// Shortcuts
await attio.createLead({ email: '...', name: '...', company: '...' });
await attio.listLeads({ filter: {...} });
await attio.createCompany({ name: '...', domain: '...' });
await attio.listCompanies();
await attio.createDeal({ title: '...', value: 50000 });
await attio.listDeals();

// Lists
await attio.getLists();
await attio.getList('list-id');
await attio.getListEntries('list-id');
await attio.addToList('list-id', { data: { parent_record_id: 'record-id' } });
await attio.removeFromList('list-id', 'entry-id');

// Notes
await attio.createNote({
  data: {
    parent_object: 'leads',
    parent_record_id: 'lead-id',
    content: 'Follow up next week',
    format: 'plaintext',
  },
});
await attio.getNotes('leads', 'lead-id');

// Webhooks
await attio.getWebhooks();
await attio.createWebhook({
  data: {
    target_url: 'https://your-app.com/webhook',
    subscriptions: [
      { object: 'leads', event_type: 'record.created' },
    ],
  },
});
await attio.deleteWebhook('webhook-id');
```

## n8n Cheat Sheet

```typescript
// Workflows
await n8n.getWorkflows();
await n8n.getWorkflow('workflow-id');
await n8n.activateWorkflow('workflow-id');
await n8n.deactivateWorkflow('workflow-id');

// Trigger
await n8n.triggerWorkflow('workflow-id', { key: 'value' });
await n8n.testWorkflow('workflow-id', { key: 'value' });

// Executions
await n8n.getExecutions('workflow-id', 100);
await n8n.getExecution('execution-id');
await n8n.deleteExecution('execution-id');
await n8n.retryExecution('execution-id');

// Wait for completion
await n8n.waitForExecution('execution-id', {
  maxWaitTime: 60000,   // 1 minute
  pollInterval: 2000,   // 2 seconds
});

// Webhooks
const url = n8n.getWebhookUrl('webhook-path', false);
await n8n.triggerWebhook('webhook-path', { data: '...' }, 'POST');
await n8n.triggerTestWebhook('webhook-path', { data: '...' }, 'POST');
```

## Filter Operators (Attio)

- `equals` - Exact match
- `not_equals` - Not equal
- `contains` - Contains substring
- `not_contains` - Does not contain
- `starts_with` - Starts with
- `ends_with` - Ends with
- `greater_than` - Greater than (numbers/dates)
- `less_than` - Less than (numbers/dates)
- `is_empty` - Empty/null
- `is_not_empty` - Not empty/null

## Complex Filters (Attio)

```typescript
// AND condition
{
  and: [
    { attribute: 'status', operator: 'equals', value: 'qualified' },
    { attribute: 'score', operator: 'greater_than', value: 80 },
  ]
}

// OR condition
{
  or: [
    { attribute: 'source', operator: 'equals', value: 'website' },
    { attribute: 'source', operator: 'equals', value: 'referral' },
  ]
}

// Nested conditions
{
  and: [
    { attribute: 'status', operator: 'equals', value: 'qualified' },
    {
      or: [
        { attribute: 'industry', operator: 'equals', value: 'tech' },
        { attribute: 'industry', operator: 'equals', value: 'saas' },
      ]
    }
  ]
}
```

## Webhook Event Types (Attio)

- `record.created` - Record created
- `record.updated` - Record updated
- `record.deleted` - Record deleted
- `list_entry.added` - Entry added to list
- `list_entry.removed` - Entry removed from list

## n8n Execution Modes

- `integrated` - Integrated execution
- `cli` - CLI execution
- `error` - Error execution
- `internal` - Internal execution
- `manual` - Manual trigger
- `retry` - Retry execution
- `trigger` - Triggered by event
- `webhook` - Webhook trigger

## n8n Execution Status

- `success` - Completed successfully
- `error` - Failed with error
- `waiting` - Waiting for input
- `running` - Currently running
- `canceled` - Canceled by user

## Email Verification Status (Apollo)

- `valid` - Email is valid and deliverable
- `invalid` - Email is invalid
- `accept_all` - Server accepts all emails (risky)
- `unknown` - Cannot determine
- `disposable` - Disposable email address

## Best Practices

1. **Always check response.success before accessing data**
   ```typescript
   if (response.success) {
     const data = response.data!;
   }
   ```

2. **Use batch operations for multiple items**
   ```typescript
   // Good
   await persana.batchEnrichPeople(requests);

   // Avoid
   for (const req of requests) {
     await persana.enrichPerson(req);
   }
   ```

3. **Handle rate limits with delays**
   ```typescript
   for (const item of items) {
     await processItem(item);
     await new Promise(resolve => setTimeout(resolve, 100));
   }
   ```

4. **Use proper error handling**
   ```typescript
   try {
     const response = await client.method();
     if (!response.success) {
       // Handle API error
       logger.error(response.error?.message);
     }
   } catch (error) {
     // Handle network error
     logger.error(error);
   }
   ```

5. **Configure timeouts for long operations**
   ```typescript
   const client = new Client({
     apiKey: '...',
     timeout: 60000, // 1 minute for slow operations
   });
   ```

## Environment Variables

```bash
# .env
PERSANA_API_KEY=pk_live_...
APOLLO_API_KEY=...
ATTIO_API_KEY=...
ATTIO_WEBHOOK_SECRET=...
N8N_API_KEY=...
N8N_BASE_URL=https://your-n8n.app
```

## TypeScript Types

All responses are fully typed. Use type inference:

```typescript
const response = await persana.enrichPerson({ email: '...' });
// response.data is typed as PersonEnrichment | undefined

if (response.success) {
  const person = response.data!; // PersonEnrichment
  console.log(person.fullName);  // Type-safe access
}
```

## Testing

```typescript
// Mock responses for testing
const mockResponse = {
  success: true,
  data: { /* your test data */ },
  metadata: {
    requestId: 'test-id',
    timestamp: new Date().toISOString(),
  },
};
```

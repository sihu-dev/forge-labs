# @forge/integrations

External API Integration Clients for FORGE LABS platform.

## Features

- **TypeScript-first**: Full type safety with strict mode
- **Retry logic**: Automatic retry with exponential backoff
- **Error handling**: Consistent error responses across all clients
- **ESM modules**: Modern ES module support
- **Promise-based**: Async/await API

## Clients

### 1. Persana AI Client

Lead enrichment, company intelligence, and tech stack analysis.

```typescript
import { PersanaClient } from '@forge/integrations';

const persana = new PersanaClient({
  apiKey: process.env.PERSANA_API_KEY!,
  timeout: 30000,
  retryAttempts: 3,
});

// Enrich person data
const person = await persana.enrichPerson({
  email: 'john@example.com',
});

// Enrich company data
const company = await persana.enrichCompany({
  domain: 'example.com',
});

// Analyze tech stack
const techStack = await persana.analyzeTechStack('example.com');

// Batch operations
const people = await persana.batchEnrichPeople([
  { email: 'john@example.com' },
  { linkedinUrl: 'https://linkedin.com/in/jane' },
]);
```

### 2. Apollo.io Client

Contact search, email verification, and sequence management.

```typescript
import { ApolloClient } from '@forge/integrations';

const apollo = new ApolloClient({
  apiKey: process.env.APOLLO_API_KEY!,
});

// Search contacts
const contacts = await apollo.searchContacts({
  q_keywords: 'CEO',
  person_titles: ['CEO', 'Founder'],
  person_locations: ['San Francisco, CA'],
  organization_num_employees_ranges: ['11-50'],
});

// Verify email
const verification = await apollo.verifyEmail({
  email: 'john@example.com',
});

// Manage sequences
const sequences = await apollo.listSequences();

await apollo.addToSequence({
  contact_ids: ['contact-id-1', 'contact-id-2'],
  sequence_id: 'sequence-id',
});
```

### 3. Attio CRM Client

Object CRUD, lists, webhooks, and notes.

```typescript
import { AttioClient } from '@forge/integrations';

const attio = new AttioClient({
  apiKey: process.env.ATTIO_API_KEY!,
});

// Create a lead
const lead = await attio.createLead({
  email: 'john@example.com',
  name: 'John Doe',
  company: 'Example Corp',
});

// Query records with filters
const leads = await attio.listLeads({
  filter: {
    attribute: 'status',
    operator: 'equals',
    value: 'qualified',
  },
  sorts: [{ attribute: 'created_at', direction: 'desc' }],
  limit: 50,
});

// Manage lists
const lists = await attio.getLists();
await attio.addToList('list-id', {
  data: { parent_record_id: 'record-id' },
});

// Create notes
await attio.createNote({
  data: {
    parent_object: 'leads',
    parent_record_id: 'lead-id',
    content: 'Follow up next week',
    format: 'plaintext',
  },
});

// Webhooks
const webhook = await attio.createWebhook({
  data: {
    target_url: 'https://your-app.com/webhook',
    subscriptions: [
      { object: 'leads', event_type: 'record.created' },
      { object: 'leads', event_type: 'record.updated' },
    ],
  },
});
```

### 4. n8n Client

Workflow automation and execution management.

```typescript
import { N8nClient } from '@forge/integrations';

const n8n = new N8nClient({
  apiKey: process.env.N8N_API_KEY!,
  baseUrl: 'https://your-n8n-instance.app',
});

// Get workflows
const workflows = await n8n.getWorkflows();

// Trigger workflow
const execution = await n8n.triggerWorkflow('workflow-id', {
  leadEmail: 'john@example.com',
  campaignId: 'campaign-123',
});

// Wait for completion
const completed = await n8n.waitForExecution(execution.data!.id, {
  maxWaitTime: 60000, // 1 minute
  pollInterval: 2000, // 2 seconds
});

// Webhook trigger
const webhookUrl = n8n.getWebhookUrl('your-webhook-path');
await n8n.triggerWebhook('your-webhook-path', {
  event: 'lead_created',
  data: { email: 'john@example.com' },
});

// Manage executions
const executions = await n8n.getExecutions('workflow-id', 100);
await n8n.retryExecution('execution-id');
```

## Configuration

All clients support the following configuration options:

```typescript
interface BaseConfig {
  apiKey: string; // Required
  baseUrl?: string; // Optional, uses default if not provided
  timeout?: number; // Optional, default 30000ms
  retryAttempts?: number; // Optional, default 3
}
```

## Error Handling

All API methods return a consistent response format:

```typescript
interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  metadata?: {
    requestId: string;
    timestamp: string;
  };
}
```

Example error handling:

```typescript
const response = await persana.enrichPerson({ email: 'invalid@email' });

if (!response.success) {
  console.error('Error:', response.error?.message);
  console.error('Code:', response.error?.code);
  return;
}

const person = response.data!;
console.log('Enriched:', person);
```

## Retry Logic

All clients implement automatic retry with exponential backoff:

- 1st retry: 1 second delay
- 2nd retry: 2 seconds delay
- 3rd retry: 4 seconds delay

4xx errors (except 429 rate limits) are not retried.

## Environment Variables

Recommended `.env` setup:

```bash
# Persana AI
PERSANA_API_KEY=your-persana-api-key

# Apollo.io
APOLLO_API_KEY=your-apollo-api-key

# Attio CRM
ATTIO_API_KEY=your-attio-api-key

# n8n
N8N_API_KEY=your-n8n-api-key
N8N_BASE_URL=https://your-n8n-instance.app
```

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Type check
pnpm typecheck

# Test
pnpm test
```

## License

MIT

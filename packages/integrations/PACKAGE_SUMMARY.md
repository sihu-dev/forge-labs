# @forge/integrations Package Summary

## Overview

Complete TypeScript integration package for external APIs used in FORGE LABS platform. Provides type-safe, production-ready clients for Persana AI, Apollo.io, Attio CRM, and n8n automation platform.

## Package Structure

```
packages/integrations/
├── package.json                    # Package metadata and dependencies
├── tsconfig.json                   # TypeScript configuration (strict mode, ESM)
├── README.md                       # Full documentation
├── PACKAGE_SUMMARY.md             # This file
├── examples/
│   └── complete-workflow.ts       # End-to-end integration examples
└── src/
    ├── index.ts                   # Main export file
    ├── persana/
    │   ├── client.ts              # Persana AI client (142 lines)
    │   ├── types.ts               # Type definitions (105 lines)
    │   └── index.ts               # Module exports
    ├── apollo/
    │   ├── client.ts              # Apollo.io client (186 lines)
    │   ├── types.ts               # Type definitions (172 lines)
    │   └── index.ts               # Module exports
    ├── attio/
    │   ├── client.ts              # Attio CRM client (323 lines)
    │   ├── types.ts               # Type definitions (163 lines)
    │   └── index.ts               # Module exports
    └── n8n/
        ├── client.ts              # n8n client (373 lines)
        ├── types.ts               # Type definitions (137 lines)
        └── index.ts               # Module exports
```

## API Clients

### 1. Persana AI Client

**Purpose**: Lead enrichment, company intelligence, tech stack analysis

**Key Features**:
- Person enrichment from email/LinkedIn
- Company data enrichment from domain
- Technology stack analysis
- Batch operations support
- Work experience and education data

**Methods**:
- `enrichPerson(request)` - Enrich person data
- `enrichCompany(request)` - Enrich company data
- `analyzeTechStack(domain)` - Analyze tech stack
- `batchEnrichPeople(requests)` - Batch person enrichment
- `batchEnrichCompanies(requests)` - Batch company enrichment

**Types**: 13 TypeScript interfaces including PersonEnrichment, CompanyEnrichment, TechStackAnalysis

### 2. Apollo.io Client

**Purpose**: Contact search, email verification, sequence management

**Key Features**:
- Advanced contact search with filters
- Email deliverability verification
- Batch email verification
- Sequence management (add/remove contacts)
- Organization data enrichment

**Methods**:
- `searchContacts(request)` - Search for contacts
- `getContact(contactId)` - Get contact details
- `verifyEmail(request)` - Verify email address
- `batchVerifyEmails(emails)` - Batch verify emails
- `listSequences()` - List all sequences
- `addToSequence(request)` - Add contacts to sequence
- `removeFromSequence(sequenceId, contactId)` - Remove from sequence
- `getSequenceContacts(sequenceId)` - Get sequence contacts

**Types**: 16 TypeScript interfaces including Contact, Organization, EmailVerificationResult, Sequence

### 3. Attio CRM Client

**Purpose**: CRM object management, lists, webhooks, notes

**Key Features**:
- Generic object CRUD (works with any object type)
- List management (add/remove entries)
- Webhook configuration and event handling
- Notes and comments
- Advanced filtering and sorting
- Shortcut methods for Leads, Companies, Deals

**Methods**:
- `listRecords(objectSlug, request)` - Query records with filters
- `getRecord(objectSlug, recordId)` - Get single record
- `createRecord(objectSlug, request)` - Create new record
- `updateRecord(objectSlug, recordId, request)` - Update record
- `deleteRecord(objectSlug, recordId)` - Delete record
- `getLists()` - Get all lists
- `addToList(listId, request)` - Add record to list
- `createWebhook(request)` - Create webhook
- `createNote(request)` - Create note
- `createLead(values)` - Shortcut: Create lead
- `createCompany(values)` - Shortcut: Create company
- `createDeal(values)` - Shortcut: Create deal

**Types**: 18 TypeScript interfaces including ObjectRecord, Filter, Webhook, Note

### 4. n8n Client

**Purpose**: Workflow automation and execution management

**Key Features**:
- Workflow listing and management
- Manual workflow triggering with data
- Execution monitoring and status tracking
- Webhook trigger support (test and production)
- Execution retry mechanism
- Wait for completion with polling

**Methods**:
- `getWorkflows()` - List all workflows
- `getWorkflow(workflowId)` - Get workflow details
- `activateWorkflow(workflowId)` - Activate workflow
- `deactivateWorkflow(workflowId)` - Deactivate workflow
- `getExecutions(workflowId, limit)` - Get executions
- `getExecution(executionId)` - Get execution details
- `triggerWorkflow(workflowId, data)` - Trigger workflow manually
- `testWorkflow(workflowId, data)` - Test workflow (dry run)
- `triggerWebhook(webhookPath, data)` - Trigger via webhook
- `getWebhookUrl(webhookPath, isTest)` - Get webhook URL
- `waitForExecution(executionId, options)` - Poll until complete
- `retryExecution(executionId)` - Retry failed execution

**Types**: 13 TypeScript interfaces including Workflow, Execution, WorkflowNode

## Common Features

All clients implement:

### 1. Consistent Error Handling

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

### 2. Retry Logic

- Automatic retry with exponential backoff
- Default: 3 attempts (configurable)
- Backoff: 1s → 2s → 4s
- Smart retry: Skip 4xx errors (except 429)

### 3. Timeout Control

- Default: 30 seconds (configurable)
- AbortController for clean cancellation
- Timeout applies per request attempt

### 4. Type Safety

- TypeScript strict mode enabled
- Full type inference
- No `any` types
- Comprehensive interface documentation

## Usage Examples

### Basic Usage

```typescript
import { PersanaClient, ApolloClient, AttioClient, N8nClient } from '@forge/integrations';

const persana = new PersanaClient({ apiKey: process.env.PERSANA_API_KEY! });
const apollo = new ApolloClient({ apiKey: process.env.APOLLO_API_KEY! });
const attio = new AttioClient({ apiKey: process.env.ATTIO_API_KEY! });
const n8n = new N8nClient({
  apiKey: process.env.N8N_API_KEY!,
  baseUrl: process.env.N8N_BASE_URL!,
});
```

### Complete Workflow

See `examples/complete-workflow.ts` for full integration examples including:
- Lead enrichment pipeline
- Batch operations
- Contact search and CRM sync
- Workflow orchestration
- Webhook handling

## Dependencies

- `@forge/types`: Type definitions (workspace)
- `@forge/utils`: Utility functions (workspace)
- `typescript`: ^5.7.2
- `vitest`: ^2.1.8

## Build & Test

```bash
# Install dependencies
pnpm install

# Build TypeScript
pnpm build

# Type check
pnpm typecheck

# Run tests
pnpm test

# Clean build artifacts
pnpm clean
```

## Code Statistics

| Client | Client Lines | Types Lines | Total |
|--------|--------------|-------------|-------|
| Persana | 142 | 105 | 247 |
| Apollo | 186 | 172 | 358 |
| Attio | 323 | 163 | 486 |
| n8n | 373 | 137 | 510 |
| **Total** | **1,024** | **577** | **1,601** |

Additional:
- Main index: 89 lines
- Examples: 385 lines
- Documentation: 350+ lines

**Total Package**: ~2,400+ lines of production-ready code

## Integration Patterns

### 1. Enrichment Pipeline

Persana → Apollo → Attio → n8n

### 2. Lead Scoring

Apollo (search) → Persana (enrich) → Attio (score) → n8n (notify)

### 3. Automated Outreach

Attio (qualify) → Apollo (verify) → n8n (sequence) → Persana (track)

### 4. Webhook Automation

Attio webhook → n8n workflow → Persana enrichment → Attio update

## Environment Setup

Required environment variables:

```bash
PERSANA_API_KEY=your-persana-api-key
APOLLO_API_KEY=your-apollo-api-key
ATTIO_API_KEY=your-attio-api-key
ATTIO_WEBHOOK_SECRET=your-webhook-secret
N8N_API_KEY=your-n8n-api-key
N8N_BASE_URL=https://your-n8n-instance.app
```

## Next Steps

1. Install package dependencies: `pnpm install`
2. Build TypeScript: `pnpm build`
3. Review examples in `examples/complete-workflow.ts`
4. Integrate with BIDFLOW app (bidflow automation use case)
5. Add unit tests for each client
6. Configure CI/CD for package publishing

## License

MIT

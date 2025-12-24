/**
 * @forge/integrations
 * External API Integration Clients
 *
 * Provides TypeScript clients for:
 * - Persana AI: Lead enrichment, company intelligence, tech stack analysis
 * - Apollo.io: Contact search, email verification, sequence management
 * - Attio CRM: Object CRUD, lists, webhooks, notes
 * - n8n: Workflow automation, execution management
 */

// Persana AI
export { PersanaClient } from './persana/index.js';
export type {
  PersanaConfig,
  EnrichmentRequest,
  PersonEnrichment,
  CompanyEnrichment,
  TechStackAnalysis,
  WorkExperience,
  Education,
  FundingInfo,
  Technology,
  TechCategory,
  PersanaError,
} from './persana/index.js';

// Apollo.io
export { ApolloClient } from './apollo/index.js';
export type {
  ApolloConfig,
  ContactSearchRequest,
  Contact,
  PhoneNumber,
  Organization,
  EmploymentHistory,
  EmailVerificationRequest,
  EmailVerificationResult,
  Sequence,
  SequenceContact,
  AddToSequenceRequest,
  ApolloError,
} from './apollo/index.js';

// Attio CRM
export { AttioClient } from './attio/index.js';
export type {
  AttioConfig,
  ObjectRecord,
  AttributeValue,
  CreateRecordRequest,
  UpdateRecordRequest,
  ListRecordsRequest,
  Filter,
  FilterOperator,
  Sort,
  List,
  ListEntry,
  AddToListRequest,
  Webhook,
  WebhookSubscription,
  WebhookEventType,
  CreateWebhookRequest,
  WebhookEvent,
  Note,
  Actor,
  CreateNoteRequest,
  AttioError,
} from './attio/index.js';

// n8n
export { N8nClient } from './n8n/index.js';
export type {
  N8nConfig,
  Workflow,
  WorkflowNode,
  Connection,
  WorkflowSettings,
  Tag,
  Execution,
  ExecutionData,
  ExecutionNodeData,
  ExecutionError,
  TriggerWorkflowRequest,
  WebhookResponse,
  N8nError,
} from './n8n/index.js';

// Common types (re-exported from each client for convenience)
export type { APIResponse } from './persana/index.js';

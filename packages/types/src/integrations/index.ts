/**
 * @forge/types/integrations - 외부 서비스 통합 타입
 * Persana AI, Apollo.io, n8n 등
 */

// ============================================
// Persana AI
// ============================================

export interface IPersanaConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface IPersanaCompanySearch {
  domain?: string;
  name?: string;
  industry?: string[];
  size?: string[];
  techStack?: string[];
  location?: string;
}

export interface IPersanaCompanyResult {
  id: string;
  name: string;
  domain: string;
  industry: string;
  size: string;
  employeeCount?: number;
  revenue?: string;
  fundingStage?: string;
  techStack: string[];
  location: {
    city?: string;
    state?: string;
    country?: string;
  };
  linkedinUrl?: string;
  description?: string;
}

export interface IPersanaContactEnrichment {
  email?: string;
  linkedinUrl?: string;
  firstName?: string;
  lastName?: string;
  companyDomain?: string;
}

export interface IPersanaContactResult {
  email: string;
  emailVerified: boolean;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  title?: string;
  seniority?: string;
  department?: string;
  phone?: string;
  linkedinUrl?: string;
  company?: IPersanaCompanyResult;
  confidence: number;
}

// ============================================
// Apollo.io
// ============================================

export interface IApolloConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface IApolloPersonSearch {
  q_person_name?: string;
  q_organization_name?: string;
  q_organization_domains?: string[];
  person_titles?: string[];
  person_seniorities?: string[];
  contact_email_status?: string[];
  page?: number;
  per_page?: number;
}

export interface IApolloPerson {
  id: string;
  first_name: string;
  last_name: string;
  name: string;
  linkedin_url?: string;
  title?: string;
  email?: string;
  email_status?: string;
  photo_url?: string;
  twitter_url?: string;
  github_url?: string;
  facebook_url?: string;
  headline?: string;
  seniority?: string;
  departments?: string[];
  employment_history?: IApolloEmployment[];
  organization?: IApolloOrganization;
  phone_numbers?: IApolloPhone[];
}

export interface IApolloEmployment {
  organization_name: string;
  title: string;
  start_date?: string;
  end_date?: string;
  current: boolean;
}

export interface IApolloOrganization {
  id: string;
  name: string;
  website_url?: string;
  linkedin_url?: string;
  primary_domain?: string;
  industry?: string;
  estimated_num_employees?: number;
  founded_year?: number;
}

export interface IApolloPhone {
  raw_number: string;
  sanitized_number?: string;
  type?: string;
}

export interface IApolloSequence {
  id: string;
  name: string;
  active: boolean;
  created_at: string;
  num_steps: number;
  unique_scheduled: number;
  unique_delivered: number;
  unique_bounced: number;
  unique_opened: number;
  unique_replied: number;
  unique_positive_replied: number;
}

export interface IApolloSequenceContact {
  contact_id: string;
  sequence_id: string;
  status: 'active' | 'paused' | 'finished' | 'bounced';
  current_step: number;
  added_at: string;
}

// ============================================
// n8n
// ============================================

export interface IN8nConfig {
  instanceUrl: string;
  apiKey: string;
}

export interface IN8nWorkflow {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  tags?: IN8nTag[];
  nodes: IN8nNode[];
  connections: Record<string, unknown>;
}

export interface IN8nTag {
  id: string;
  name: string;
}

export interface IN8nNode {
  id: string;
  name: string;
  type: string;
  position: [number, number];
  parameters: Record<string, unknown>;
}

export interface IN8nExecution {
  id: string;
  workflowId: string;
  finished: boolean;
  mode: 'manual' | 'trigger' | 'webhook';
  startedAt: string;
  stoppedAt?: string;
  status: 'success' | 'error' | 'running' | 'waiting';
  data?: {
    resultData?: {
      runData?: Record<string, unknown>;
      error?: {
        message: string;
        stack?: string;
      };
    };
  };
}

export interface IN8nWebhook {
  id: string;
  workflowId: string;
  webhookPath: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  node: string;
}

export interface IN8nTriggerPayload {
  workflowId: string;
  data: Record<string, unknown>;
}

export interface IN8nTriggerResponse {
  executionId: string;
  status: 'success' | 'queued' | 'error';
  message?: string;
}

// ============================================
// Attio
// ============================================

export interface IAttioConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface IAttioObject {
  id: string;
  api_slug: string;
  singular_noun: string;
  plural_noun: string;
}

export interface IAttioRecord {
  id: {
    object_id: string;
    record_id: string;
  };
  values: Record<string, IAttioValue[]>;
  created_at: string;
}

export interface IAttioValue {
  attribute_type: string;
  [key: string]: unknown;
}

export interface IAttioList {
  id: {
    list_id: string;
  };
  api_slug: string;
  name: string;
  workspace_access: string;
}

export interface IAttioListEntry {
  id: {
    list_id: string;
    entry_id: string;
  };
  record_id: string;
  created_at: string;
}

export interface IAttioWebhook {
  id: string;
  target_url: string;
  subscriptions: IAttioSubscription[];
  status: 'active' | 'paused';
}

export interface IAttioSubscription {
  event_type: string;
  filter?: Record<string, unknown>;
}

// ============================================
// 공통 API 응답
// ============================================

export interface IAPIResponse<T> {
  success: boolean;
  data?: T;
  error?: IAPIError;
  meta?: {
    requestId?: string;
    rateLimit?: IRateLimit;
  };
}

export interface IAPIError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface IRateLimit {
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp
}

// ============================================
// 재시도 설정
// ============================================

export interface IRetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableStatusCodes: number[];
}

export const DEFAULT_RETRY_CONFIG: IRetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
};

/**
 * Attio CRM Integration Types
 * API 문서: https://developers.attio.com/
 */

export interface AttioConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  retryAttempts?: number;
}

export interface ObjectRecord {
  id: {
    workspace_id: string;
    object_id: string;
    record_id: string;
  };
  values: Record<string, AttributeValue[]>;
  created_at: string;
  updated_at?: string;
}

export interface AttributeValue {
  attribute_type: string;
  value: unknown;
  referenced_actor_type?: string;
  referenced_actor_id?: string;
  active_from?: string;
  active_until?: string;
}

export interface CreateRecordRequest {
  data: {
    values: Record<string, unknown>;
  };
}

export interface UpdateRecordRequest {
  data: {
    values: Record<string, unknown>;
  };
}

export interface ListRecordsRequest {
  filter?: Filter;
  sorts?: Sort[];
  limit?: number;
  offset?: number;
}

export interface Filter {
  and?: Filter[];
  or?: Filter[];
  attribute?: string;
  operator?: FilterOperator;
  value?: unknown;
}

export type FilterOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'greater_than'
  | 'less_than'
  | 'is_empty'
  | 'is_not_empty';

export interface Sort {
  attribute: string;
  direction: 'asc' | 'desc';
}

export interface List {
  id: {
    workspace_id: string;
    list_id: string;
  };
  name: string;
  parent_object: string;
  created_at: string;
  updated_at?: string;
}

export interface ListEntry {
  id: {
    workspace_id: string;
    list_id: string;
    entry_id: string;
  };
  parent_record_id: string;
  created_at: string;
}

export interface AddToListRequest {
  data: {
    parent_record_id: string;
  };
}

export interface Webhook {
  id: {
    workspace_id: string;
    webhook_id: string;
  };
  target_url: string;
  subscriptions: WebhookSubscription[];
  created_at: string;
  enabled: boolean;
}

export interface WebhookSubscription {
  object?: string;
  event_type: WebhookEventType;
}

export type WebhookEventType =
  | 'record.created'
  | 'record.updated'
  | 'record.deleted'
  | 'list_entry.added'
  | 'list_entry.removed';

export interface CreateWebhookRequest {
  data: {
    target_url: string;
    subscriptions: WebhookSubscription[];
  };
}

export interface WebhookEvent {
  id: string;
  type: WebhookEventType;
  workspace_id: string;
  object_id?: string;
  record_id?: string;
  list_id?: string;
  entry_id?: string;
  data: unknown;
  created_at: string;
}

export interface Note {
  id: {
    workspace_id: string;
    note_id: string;
  };
  parent_object: string;
  parent_record_id: string;
  title?: string;
  content: string;
  format: 'plaintext' | 'html' | 'markdown';
  created_by_actor: Actor;
  created_at: string;
}

export interface Actor {
  type: 'workspace-member' | 'api-token' | 'system';
  id: string;
}

export interface CreateNoteRequest {
  data: {
    parent_object: string;
    parent_record_id: string;
    title?: string;
    content: string;
    format?: 'plaintext' | 'html' | 'markdown';
  };
}

export interface AttioError {
  code: string;
  message: string;
  details?: unknown;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: AttioError;
  pagination?: {
    limit: number;
    offset: number;
    total_count?: number;
  };
  metadata?: {
    requestId: string;
    timestamp: string;
  };
}

/**
 * @forge/types - CRM Types (L0 - Atoms)
 *
 * Unified CRM types for multi-platform synchronization
 * Supports: HubSpot, Pipedrive, Custom Supabase CRM
 */

import type { UUID, Timestamp } from '../index.js';

// ============================================
// CRM Platform Types
// ============================================

export type CRMPlatform = 'hubspot' | 'pipedrive' | 'supabase';

export type SyncStatus =
  | 'pending'
  | 'syncing'
  | 'synced'
  | 'error'
  | 'conflict';

export type SyncDirection = 'push' | 'pull' | 'bidirectional';

export type ConflictResolutionStrategy =
  | 'timestamp_based'
  | 'source_priority'
  | 'field_merge'
  | 'manual_review';

// ============================================
// Contact (Lead/Customer)
// ============================================

export type LifecycleStage =
  | 'subscriber'
  | 'lead'
  | 'marketing_qualified_lead'
  | 'sales_qualified_lead'
  | 'opportunity'
  | 'customer'
  | 'evangelist'
  | 'other';

export interface IContact {
  id: UUID;
  tenant_id: UUID;

  // Basic Info
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;

  // Professional Info
  job_title: string | null;
  company_id: UUID | null;

  // Lifecycle
  lifecycle_stage: LifecycleStage;
  lead_source: string | null;
  lead_score: number | null;

  // Address
  address: IAddress | null;

  // Social
  linkedin_url: string | null;
  twitter_handle: string | null;

  // Custom Fields (platform-specific)
  custom_fields: Record<string, unknown>;

  // External IDs
  external_ids: IExternalMapping[];

  // Metadata
  created_at: Timestamp;
  updated_at: Timestamp;
  last_activity_at: Timestamp | null;

  // Sync
  sync_status: SyncStatus;
  last_synced_at: Timestamp | null;
}

export interface IAddress {
  street: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
}

// ============================================
// Company (Account/Organization)
// ============================================

export type CompanySize =
  | '1-10'
  | '11-50'
  | '51-200'
  | '201-500'
  | '501-1000'
  | '1001-5000'
  | '5001+';

export interface ICompany {
  id: UUID;
  tenant_id: UUID;

  // Basic Info
  name: string;
  domain: string | null;
  industry: string | null;
  description: string | null;

  // Size & Revenue
  employee_count: number | null;
  company_size: CompanySize | null;
  annual_revenue: number | null;

  // Contact Info
  website: string | null;
  phone: string | null;
  address: IAddress | null;

  // Custom Fields
  custom_fields: Record<string, unknown>;

  // External IDs
  external_ids: IExternalMapping[];

  // Metadata
  created_at: Timestamp;
  updated_at: Timestamp;

  // Sync
  sync_status: SyncStatus;
  last_synced_at: Timestamp | null;
}

// ============================================
// Deal (Opportunity)
// ============================================

export type DealStage =
  | 'appointment_scheduled'
  | 'qualified_to_buy'
  | 'presentation_scheduled'
  | 'decision_maker_bought_in'
  | 'contract_sent'
  | 'closed_won'
  | 'closed_lost';

export type DealPriority = 'low' | 'medium' | 'high' | 'critical';

export interface IDeal {
  id: UUID;
  tenant_id: UUID;

  // Basic Info
  name: string;
  amount: number;
  currency: string; // ISO 4217 (USD, KRW, EUR)

  // Stage & Status
  stage: DealStage;
  probability: number; // 0-100
  priority: DealPriority;

  // Relationships
  contact_id: UUID;
  company_id: UUID | null;
  owner_id: UUID;

  // Timeline
  close_date: Timestamp | null;
  last_activity_at: Timestamp | null;

  // Custom Fields
  custom_fields: Record<string, unknown>;

  // External IDs
  external_ids: IExternalMapping[];

  // Metadata
  created_at: Timestamp;
  updated_at: Timestamp;

  // Sync
  sync_status: SyncStatus;
  last_synced_at: Timestamp | null;
}

// ============================================
// Activity (Timeline Event)
// ============================================

export type ActivityType =
  | 'call'
  | 'email'
  | 'meeting'
  | 'task'
  | 'note'
  | 'linkedin_message'
  | 'other';

export type ActivityDirection = 'inbound' | 'outbound';

export interface IActivity {
  id: UUID;
  tenant_id: UUID;

  // Type & Content
  type: ActivityType;
  direction: ActivityDirection | null;
  subject: string;
  body: string | null;

  // Relationships
  contact_id: UUID | null;
  company_id: UUID | null;
  deal_id: UUID | null;
  owner_id: UUID;

  // Timing
  timestamp: Timestamp;
  duration_minutes: number | null;

  // Outcome
  outcome: string | null; // 'connected', 'no_answer', 'left_voicemail'

  // Custom Fields
  custom_fields: Record<string, unknown>;

  // External IDs
  external_ids: IExternalMapping[];

  // Metadata
  created_at: Timestamp;
  updated_at: Timestamp;

  // Sync
  sync_status: SyncStatus;
  last_synced_at: Timestamp | null;
}

// ============================================
// Task (To-Do)
// ============================================

export type TaskStatus = 'not_started' | 'in_progress' | 'waiting' | 'completed' | 'deferred';

export type TaskPriority = 'low' | 'normal' | 'high';

export interface ITask {
  id: UUID;
  tenant_id: UUID;

  // Content
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;

  // Relationships
  contact_id: UUID | null;
  company_id: UUID | null;
  deal_id: UUID | null;
  assigned_to: UUID;

  // Timeline
  due_date: Timestamp | null;
  completed_at: Timestamp | null;

  // Reminder
  reminder_date: Timestamp | null;

  // Custom Fields
  custom_fields: Record<string, unknown>;

  // External IDs
  external_ids: IExternalMapping[];

  // Metadata
  created_at: Timestamp;
  updated_at: Timestamp;

  // Sync
  sync_status: SyncStatus;
  last_synced_at: Timestamp | null;
}

// ============================================
// External Mapping (ID Translation)
// ============================================

export interface IExternalMapping {
  platform: CRMPlatform;
  external_id: string;
  last_synced_at: Timestamp;
}

// ============================================
// Sync Configuration
// ============================================

export interface ISyncConfig {
  id: UUID;
  tenant_id: UUID;

  // Platform
  platform: CRMPlatform;

  // Direction
  sync_direction: SyncDirection;

  // Schedule
  sync_frequency_minutes: number; // 0 = real-time only
  last_sync_at: Timestamp | null;
  next_sync_at: Timestamp | null;

  // Conflict Resolution
  conflict_strategy: ConflictResolutionStrategy;
  source_priority: CRMPlatform[]; // For source_priority strategy

  // Entity Filters
  sync_contacts: boolean;
  sync_companies: boolean;
  sync_deals: boolean;
  sync_activities: boolean;
  sync_tasks: boolean;

  // Field Mapping Overrides
  field_mappings: Record<string, IFieldMapping>;

  // Credentials (encrypted reference)
  credentials_vault_id: string;

  // Status
  enabled: boolean;

  // Metadata
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface IFieldMapping {
  source_field: string;
  target_field: string;
  transform?: string; // JavaScript expression
}

// ============================================
// Sync Job (Execution Record)
// ============================================

export type SyncJobStatus = 'queued' | 'running' | 'completed' | 'failed';

export interface ISyncJob {
  id: UUID;
  tenant_id: UUID;
  sync_config_id: UUID;

  // Execution
  status: SyncJobStatus;
  started_at: Timestamp | null;
  completed_at: Timestamp | null;
  duration_ms: number | null;

  // Results
  contacts_synced: number;
  companies_synced: number;
  deals_synced: number;
  activities_synced: number;
  tasks_synced: number;

  // Errors
  errors: ISyncError[];
  conflicts_detected: number;

  // Metadata
  triggered_by: 'schedule' | 'webhook' | 'manual';
  created_at: Timestamp;
}

export interface ISyncError {
  entity_type: 'contact' | 'company' | 'deal' | 'activity' | 'task';
  entity_id: UUID;
  error_code: string;
  error_message: string;
  timestamp: Timestamp;
}

// ============================================
// Conflict Record
// ============================================

export type ConflictStatus = 'pending' | 'resolved' | 'ignored';

export interface IConflictRecord {
  id: UUID;
  tenant_id: UUID;

  // Entity
  entity_type: 'contact' | 'company' | 'deal' | 'activity' | 'task';
  entity_id: UUID;

  // Conflict Data
  local_snapshot: Record<string, unknown>;
  remote_snapshot: Record<string, unknown>;
  conflicting_fields: string[];

  // Resolution
  status: ConflictStatus;
  resolution_strategy: ConflictResolutionStrategy | null;
  resolved_by: UUID | null;
  resolved_at: Timestamp | null;

  // Metadata
  created_at: Timestamp;
  updated_at: Timestamp;
}

// ============================================
// Automation Rule
// ============================================

export type TriggerType =
  | 'contact_created'
  | 'contact_updated'
  | 'contact_lifecycle_changed'
  | 'company_created'
  | 'company_updated'
  | 'deal_created'
  | 'deal_updated'
  | 'deal_stage_changed'
  | 'activity_created'
  | 'meeting_scheduled'
  | 'email_replied'
  | 'task_completed';

export type ActionType =
  | 'create_contact'
  | 'update_contact'
  | 'create_company'
  | 'update_company'
  | 'create_deal'
  | 'update_deal'
  | 'create_activity'
  | 'create_task'
  | 'send_email'
  | 'send_notification'
  | 'webhook'
  | 'add_to_sequence';

export interface IAutomationRule {
  id: UUID;
  tenant_id: UUID;

  // Metadata
  name: string;
  description: string | null;
  enabled: boolean;

  // Trigger
  trigger: ITriggerConfig;

  // Conditions
  conditions: IConditionConfig[];

  // Actions
  actions: IActionConfig[];

  // Execution
  last_triggered_at: Timestamp | null;
  execution_count: number;

  // Metadata
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface ITriggerConfig {
  type: TriggerType;
  filters?: Record<string, unknown>;
}

export interface IConditionConfig {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty';
  value: unknown;
}

export interface IActionConfig {
  type: ActionType;
  params: Record<string, unknown>;
  delay_minutes?: number;
}

// ============================================
// Pipeline Snapshot (Reporting)
// ============================================

export interface IPipelineSnapshot {
  id: UUID;
  tenant_id: UUID;

  // Snapshot
  snapshot_date: Timestamp;
  stage: DealStage;

  // Metrics
  deal_count: number;
  total_value: number;
  avg_deal_size: number;
  weighted_value: number; // total_value * probability

  // Created
  created_at: Timestamp;
}

// ============================================
// Activity Summary (Reporting)
// ============================================

export interface IActivitySummary {
  id: UUID;
  tenant_id: UUID;
  owner_id: UUID;

  // Period
  period_start: Timestamp;
  period_end: Timestamp;

  // Counts by Type
  calls: number;
  emails: number;
  meetings: number;
  tasks_completed: number;

  // Engagement
  contacts_engaged: number;
  companies_engaged: number;

  // Created
  created_at: Timestamp;
}

// ============================================
// Revenue Forecast (Reporting)
// ============================================

export interface IRevenueForecast {
  id: UUID;
  tenant_id: UUID;

  // Period
  forecast_month: Timestamp; // First day of month

  // Pipeline Segments
  committed: number;  // probability >= 90%
  upside: number;     // probability 50-89%
  pipeline: number;   // probability < 50%
  weighted_total: number;

  // Created
  created_at: Timestamp;
}

// ============================================
// Webhook Event
// ============================================

export type WebhookEventType =
  | 'contact.created'
  | 'contact.updated'
  | 'contact.deleted'
  | 'company.created'
  | 'company.updated'
  | 'company.deleted'
  | 'deal.created'
  | 'deal.updated'
  | 'deal.deleted';

export interface IWebhookEvent {
  id: UUID;

  // Source
  platform: CRMPlatform;
  event_type: WebhookEventType;

  // Payload
  object_id: string; // External ID
  object_type: 'contact' | 'company' | 'deal';
  properties: Record<string, unknown>;

  // Processing
  processed: boolean;
  processed_at: Timestamp | null;
  error: string | null;

  // Metadata
  received_at: Timestamp;
}

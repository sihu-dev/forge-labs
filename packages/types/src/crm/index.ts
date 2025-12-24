/**
 * @forge/types/crm - CRM 추상화 타입
 * Attio, HubSpot 등 다양한 CRM 지원
 */

// ============================================
// CRM 프로바이더
// ============================================

export type CRMProvider = 'attio' | 'hubspot' | 'salesforce';

export interface ICRMConfig {
  provider: CRMProvider;
  apiKey: string;
  apiUrl?: string;
  webhookSecret?: string;
  syncInterval?: number; // minutes
}

// ============================================
// 공통 엔티티
// ============================================

export interface ICRMEntity {
  id: string;
  externalId?: string;
  provider: CRMProvider;
  createdAt: string;
  updatedAt: string;
  lastSyncedAt?: string;
}

// ============================================
// 회사 (Company)
// ============================================

export interface ICRMCompany extends ICRMEntity {
  name: string;
  domain?: string;
  industry?: string;
  size?: string;
  revenue?: string;

  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };

  phone?: string;
  website?: string;
  linkedinUrl?: string;

  tags: string[];
  customFields: Record<string, unknown>;
}

export interface ICreateCompanyInput {
  name: string;
  domain?: string;
  industry?: string;
  size?: string;
  customFields?: Record<string, unknown>;
}

export interface IUpdateCompanyInput {
  name?: string;
  domain?: string;
  industry?: string;
  size?: string;
  customFields?: Record<string, unknown>;
}

// ============================================
// 연락처 (Contact)
// ============================================

export interface ICRMContact extends ICRMEntity {
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  phone?: string;
  mobile?: string;

  title?: string;
  department?: string;
  seniority?: string;

  companyId?: string;
  companyName?: string;

  linkedinUrl?: string;
  twitterUrl?: string;

  tags: string[];
  customFields: Record<string, unknown>;

  // 이메일 상태
  emailStatus?: 'valid' | 'invalid' | 'unknown' | 'catch_all';
  lastEmailedAt?: string;
  emailBounced?: boolean;
}

export interface ICreateContactInput {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  title?: string;
  companyId?: string;
  customFields?: Record<string, unknown>;
}

export interface IUpdateContactInput {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  title?: string;
  customFields?: Record<string, unknown>;
}

// ============================================
// 딜 (Deal/Opportunity)
// ============================================

export type DealStage =
  | 'lead'
  | 'qualified'
  | 'meeting'
  | 'proposal'
  | 'negotiation'
  | 'closed_won'
  | 'closed_lost';

export interface ICRMDeal extends ICRMEntity {
  name: string;
  stage: DealStage;
  amount?: number;
  currency?: string;
  probability?: number;

  companyId?: string;
  contactIds: string[];
  ownerId?: string;

  closeDate?: string;
  expectedCloseDate?: string;

  source?: string;
  lostReason?: string;

  // BIDFLOW/HEPHAITOS 연동
  bidflowBidId?: string;
  hephaitosEnrollmentId?: string;

  tags: string[];
  customFields: Record<string, unknown>;
}

export interface ICreateDealInput {
  name: string;
  stage?: DealStage;
  amount?: number;
  companyId?: string;
  contactIds?: string[];
  expectedCloseDate?: string;
  customFields?: Record<string, unknown>;
}

export interface IUpdateDealInput {
  name?: string;
  stage?: DealStage;
  amount?: number;
  probability?: number;
  expectedCloseDate?: string;
  customFields?: Record<string, unknown>;
}

// ============================================
// 활동 (Activity/Note)
// ============================================

export type CRMActivityType =
  | 'note'
  | 'call'
  | 'email'
  | 'meeting'
  | 'task';

export interface ICRMActivity extends ICRMEntity {
  type: CRMActivityType;
  subject?: string;
  content: string;

  contactId?: string;
  companyId?: string;
  dealId?: string;

  dueDate?: string;
  completedAt?: string;

  performedById?: string;
  isAutomated: boolean;
}

export interface ICreateActivityInput {
  type: CRMActivityType;
  subject?: string;
  content: string;
  contactId?: string;
  companyId?: string;
  dealId?: string;
  dueDate?: string;
}

// ============================================
// 검색/필터
// ============================================

export interface ICRMSearchParams {
  query?: string;
  filters?: Record<string, unknown>;
  sort?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  page?: number;
  limit?: number;
}

export interface ICRMSearchResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ============================================
// 동기화
// ============================================

export type SyncDirection = 'push' | 'pull' | 'bidirectional';

export type SyncStatus = 'pending' | 'syncing' | 'success' | 'failed';

export interface ISyncConfig {
  direction: SyncDirection;
  entities: ('company' | 'contact' | 'deal' | 'activity')[];
  conflictResolution: 'local_wins' | 'remote_wins' | 'latest_wins';
  batchSize: number;
}

export interface ISyncResult {
  status: SyncStatus;
  entitiesSynced: number;
  errors: ISyncError[];
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
}

export interface ISyncError {
  entityType: string;
  entityId: string;
  error: string;
  timestamp: string;
}

// ============================================
// 웹훅
// ============================================

export type WebhookEventType =
  | 'company.created'
  | 'company.updated'
  | 'company.deleted'
  | 'contact.created'
  | 'contact.updated'
  | 'contact.deleted'
  | 'deal.created'
  | 'deal.updated'
  | 'deal.stage_changed'
  | 'deal.closed';

export interface IWebhookEvent {
  id: string;
  type: WebhookEventType;
  provider: CRMProvider;
  data: Record<string, unknown>;
  timestamp: string;
}

export interface IWebhookConfig {
  url: string;
  events: WebhookEventType[];
  secret?: string;
  active: boolean;
}

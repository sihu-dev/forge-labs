/**
 * @forge/types/automation - 세일즈/마케팅 자동화 타입
 * HEPHAITOS + BIDFLOW 통합 자동화 시스템
 */

// ============================================
// 리드 관리
// ============================================

export type LeadSource =
  | 'bidflow'
  | 'hephaitos'
  | 'persana'
  | 'apollo'
  | 'linkedin'
  | 'website'
  | 'referral'
  | 'manual'
  | 'import';

export type LeadStatus =
  | 'new'
  | 'enriching'
  | 'enriched'
  | 'qualified'
  | 'contacted'
  | 'meeting'
  | 'proposal'
  | 'negotiation'
  | 'won'
  | 'lost'
  | 'disqualified';

export type LeadTier = 'hot' | 'warm' | 'cold';

export interface ILead {
  id: string;
  source: LeadSource;
  status: LeadStatus;
  tier: LeadTier;
  score: number; // 0-100

  // 연락처 정보
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  linkedinUrl?: string;
  title?: string;
  department?: string;

  // 회사 정보
  companyId?: string;
  companyName: string;
  companyDomain?: string;
  companySize?: string;
  industry?: string;

  // BIDFLOW 연동
  bidflowBidId?: string;
  bidflowMatchScore?: number;
  matchedProducts?: string[];

  // HEPHAITOS 연동
  hephaitosChannelId?: string;
  youtubeSubscribers?: number;
  channelTier?: 'tier_1' | 'tier_2' | 'tier_3';

  // 메타데이터
  tags: string[];
  customFields: Record<string, unknown>;
  enrichmentData?: IEnrichmentData;

  // CRM 동기화
  crmId?: string;
  crmProvider?: 'attio' | 'hubspot' | 'salesforce';
  lastSyncedAt?: string;

  // 소유권
  ownerId?: string;
  teamId?: string;

  createdAt: string;
  updatedAt: string;
}

// ============================================
// 데이터 강화
// ============================================

export interface IEnrichmentData {
  persana?: IPersanaEnrichment;
  apollo?: IApolloEnrichment;
  sources: string[];
  enrichedAt: string;
  confidence: number;
}

export interface IPersanaEnrichment {
  companySize: string;
  industry: string;
  techStack: string[];
  fundingStage?: string;
  revenue?: string;
  employeeCount?: number;
}

export interface IApolloEnrichment {
  email: string;
  emailVerified: boolean;
  phone?: string;
  linkedinUrl?: string;
  title?: string;
  seniority?: string;
  departments?: string[];
}

// ============================================
// 리드 스코어링
// ============================================

export interface ILeadScore {
  score: number;
  tier: LeadTier;
  factors: IScoreFactors;
  signals: {
    positive: string[];
    negative: string[];
  };
  recommendation: string;
  nextAction: INextAction;
  scoredAt: string;
  model: string;
}

export interface IScoreFactors {
  buyingPower: number; // 0-30
  fitScore: number; // 0-30
  urgency: number; // 0-20
  accessibility: number; // 0-20
}

export interface INextAction {
  type: 'call' | 'email' | 'linkedin' | 'nurture' | 'meeting';
  priority: 'immediate' | 'today' | 'this_week' | 'next_week';
  templateId?: string;
  notes?: string;
}

// ============================================
// 캠페인
// ============================================

export type CampaignType =
  | 'email'
  | 'linkedin'
  | 'multi_channel'
  | 'event'
  | 'webinar'
  | 'content'
  | 'paid_ads';

export type CampaignStatus =
  | 'draft'
  | 'scheduled'
  | 'active'
  | 'paused'
  | 'completed'
  | 'cancelled';

export interface ICampaign {
  id: string;
  name: string;
  description?: string;
  type: CampaignType;
  status: CampaignStatus;

  // 일정
  startDate?: string;
  endDate?: string;

  // 목표
  goal?: string;
  goalTarget?: number;

  // 예산
  budget?: number;
  actualSpend?: number;

  // 타겟팅
  targetSegments: string[];
  targetIndustries: string[];

  // 성과
  metrics: ICampaignMetrics;

  // BIDFLOW/HEPHAITOS 연동
  bidflowRelated: boolean;
  hephaitosRelated: boolean;

  ownerId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ICampaignMetrics {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  replied: number;
  leadsGenerated: number;
  opportunitiesCreated: number;
  revenueAttributed: number;
}

// ============================================
// 시퀀스
// ============================================

export type SequenceType = 'email' | 'linkedin' | 'multi_channel' | 'phone';

export type SequenceStatus = 'draft' | 'active' | 'paused' | 'archived';

export interface ISequence {
  id: string;
  name: string;
  description?: string;
  type: SequenceType;
  status: SequenceStatus;
  campaignId?: string;

  steps: ISequenceStep[];
  settings: ISequenceSettings;
  metrics: ISequenceMetrics;

  ownerId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ISequenceStep {
  stepNumber: number;
  type: 'email' | 'linkedin_connect' | 'linkedin_message' | 'call' | 'task';
  subject?: string;
  templateId?: string;
  delayDays: number;
  delayHours: number;
  aiPersonalization: boolean;
}

export interface ISequenceSettings {
  sendWindowStart: string; // "09:00"
  sendWindowEnd: string; // "18:00"
  sendDays: string[]; // ["monday", "tuesday", ...]
  timezone: string;
  stopOnReply: boolean;
  stopOnMeeting: boolean;
  dailyLimit: number;
}

export interface ISequenceMetrics {
  enrolled: number;
  inProgress: number;
  completed: number;
  replied: number;
  bounced: number;
  unsubscribed: number;
  meetingsBooked: number;
}

// ============================================
// 활동 로그
// ============================================

export type ActivityType =
  // 이메일
  | 'email_sent'
  | 'email_opened'
  | 'email_clicked'
  | 'email_replied'
  | 'email_bounced'
  // 전화
  | 'call_made'
  | 'call_received'
  | 'voicemail_left'
  // 미팅
  | 'meeting_scheduled'
  | 'meeting_completed'
  | 'meeting_no_show'
  // LinkedIn
  | 'linkedin_connect_sent'
  | 'linkedin_connected'
  | 'linkedin_message_sent'
  // 리드 상태
  | 'lead_created'
  | 'lead_qualified'
  | 'lead_stage_changed'
  | 'lead_won'
  | 'lead_lost'
  // BIDFLOW
  | 'bid_matched'
  | 'bid_reviewed'
  | 'proposal_sent'
  // HEPHAITOS
  | 'course_interest'
  | 'demo_requested'
  | 'partner_inquiry'
  // 기타
  | 'note_added'
  | 'task_created'
  | 'task_completed';

export interface IActivity {
  id: string;
  type: ActivityType;
  title: string;
  description?: string;

  // 연결 엔티티
  leadId?: string;
  companyId?: string;
  contactId?: string;

  // 상세 데이터
  data: Record<string, unknown>;
  outcome?: 'positive' | 'neutral' | 'negative' | 'pending';

  // 캠페인/시퀀스 연결
  campaignId?: string;
  sequenceId?: string;
  sequenceStep?: number;

  // 메타
  performedBy?: string;
  isAutomated: boolean;
  sourceSystem: string;

  activityAt: string;
  createdAt: string;
}

// ============================================
// 워크플로우 (n8n)
// ============================================

export type WorkflowTrigger =
  | 'new_lead'
  | 'lead_status_change'
  | 'lead_score_change'
  | 'new_bid'
  | 'bid_deadline'
  | 'campaign_event'
  | 'schedule'
  | 'webhook'
  | 'manual';

export type WorkflowCategory =
  | 'lead_enrichment'
  | 'lead_scoring'
  | 'email_automation'
  | 'data_sync'
  | 'notification'
  | 'cross_sell'
  | 'bidflow_integration'
  | 'hephaitos_integration';

export type WorkflowStatus = 'draft' | 'active' | 'paused' | 'error' | 'archived';

export interface IWorkflow {
  id: string;
  n8nWorkflowId: string;
  name: string;
  description?: string;
  category: WorkflowCategory;
  status: WorkflowStatus;

  trigger: WorkflowTrigger;
  triggerConfig: Record<string, unknown>;

  webhookUrl?: string;
  n8nInstanceUrl?: string;

  executionStats: IWorkflowStats;

  ownerId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IWorkflowStats {
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  avgDurationMs: number;
  lastRunAt?: string;
  lastRunStatus?: 'success' | 'failed';
}

export interface IWorkflowExecution {
  id: string;
  workflowId: string;
  n8nExecutionId?: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'cancelled';

  inputData: Record<string, unknown>;
  outputData: Record<string, unknown>;
  errorMessage?: string;

  startedAt: string;
  completedAt?: string;
  durationMs?: number;
}

// ============================================
// 크로스셀
// ============================================

export type CrossSellType =
  | 'bidflow_to_hephaitos'
  | 'hephaitos_to_bidflow'
  | 'industry_match';

export interface ICrossSellOpportunity {
  id: string;
  type: CrossSellType;

  source: {
    platform: 'bidflow' | 'hephaitos';
    entityType: 'bid' | 'lead' | 'enrollment';
    entityId: string;
  };

  target: {
    platform: 'bidflow' | 'hephaitos';
    opportunity: string;
  };

  score: number;
  signals: string[];
  status: 'pending' | 'contacted' | 'converted' | 'rejected';

  createdAt: string;
  updatedAt: string;
}

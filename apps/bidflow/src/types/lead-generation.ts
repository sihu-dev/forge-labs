/**
 * BIDFLOW Lead Generation TypeScript Interfaces
 *
 * Complete type definitions for the lead generation pipeline
 * including sources, enrichment, scoring, and workflow automation.
 *
 * @version 1.0.0
 * @date 2025-12-24
 */

// ============================================================================
// Brand Types (Type Safety)
// ============================================================================

export type LeadId = string & { readonly __brand: 'LeadId' };
export type BidId = string & { readonly __brand: 'BidId' };
export type CompanyId = string & { readonly __brand: 'CompanyId' };
export type ContactId = string & { readonly __brand: 'ContactId' };
export type EmailAddress = string & { readonly __brand: 'EmailAddress' };
export type PhoneNumber = string & { readonly __brand: 'PhoneNumber' };
export type LinkedInUrl = string & { readonly __brand: 'LinkedInUrl' };

// ============================================================================
// Lead Source Types
// ============================================================================

export enum LeadSource {
  G2B_PROCUREMENT = 'g2b_procurement',           // 나라장터
  LINKEDIN_SALES = 'linkedin_sales',             // LinkedIn Sales Navigator
  COMPANY_WEBSITE = 'company_website',           // 기업 홈페이지 크롤링
  INDUSTRY_DATABASE = 'industry_database',       // 산업 DB (NICE, 한국기업데이터)
  REFERRAL = 'referral',                         // 추천
  INBOUND = 'inbound',                           // 웹사이트 문의
  MANUAL = 'manual',                             // 수동 입력
}

export interface RawLead {
  // Identifiers
  id: LeadId;
  source: LeadSource;
  sourceReferenceId: string;                     // 원천 시스템의 고유 ID

  // Company (minimal info)
  companyName: string;
  companyDomain?: string;
  industry?: string;

  // Contact (optional at this stage)
  contactName?: string;
  contactTitle?: string;
  contactEmail?: EmailAddress;
  contactPhone?: PhoneNumber;

  // Metadata
  rawData: Record<string, unknown>;              // Original source data
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Data Enrichment Types
// ============================================================================

export interface CompanyEnrichment {
  // Basic Info
  legalName: string;
  domain: string;
  website: string;
  foundedYear?: number;

  // Firmographics
  industry: string;
  industryCode?: string;                         // NAICS, SIC, etc.
  employeeCount: number;
  employeeCountRange: EmployeeRange;
  estimatedRevenue: number;                      // KRW
  revenueRange: RevenueRange;

  // Location
  headquarters: {
    address: string;
    city: string;
    region: string;
    country: string;
    postalCode?: string;
  };

  // Social Profiles
  socialProfiles: {
    linkedin?: LinkedInUrl;
    facebook?: string;
    twitter?: string;
  };

  // Funding (if applicable)
  funding?: {
    totalRaised: number;
    lastRoundDate: Date;
    lastRoundAmount: number;
    investors: string[];
    fundingStage: 'seed' | 'series_a' | 'series_b' | 'series_c' | 'ipo';
  };

  // Technographics
  technologies?: string[];                       // e.g., Salesforce, SAP, etc.

  // Enrichment Metadata
  enrichmentSource: 'clay' | 'clearbit' | 'zoominfo' | 'manual';
  enrichedAt: Date;
  confidence: number;                            // 0-100
}

export interface ContactEnrichment {
  // Basic Info
  fullName: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  seniority: 'c_level' | 'vp' | 'director' | 'manager' | 'individual_contributor';
  department: 'sales' | 'marketing' | 'procurement' | 'engineering' | 'operations' | 'other';

  // Contact Info
  email: EmailAddress;
  emailConfidence: number;                       // 0-100
  emailVerified: boolean;
  emailDeliverability: 'deliverable' | 'risky' | 'undeliverable';

  phone?: PhoneNumber;
  phoneConfidence: number;
  phoneVerified: boolean;

  // Social Profiles
  linkedinUrl?: LinkedInUrl;
  linkedinConnections?: number;
  linkedinActivity?: {
    postsLast30Days: number;
    lastPostDate?: Date;
  };

  // Behavioral Data
  recentActivity?: string[];                     // News, posts, job changes

  // Enrichment Metadata
  enrichmentSource: 'hunter' | 'apollo' | 'clearbit' | 'manual';
  enrichedAt: Date;
  confidence: number;
}

export interface BehavioralEnrichment {
  // Procurement History
  procurementHistory?: {
    totalBids: number;
    wonBids: number;
    lostBids: number;
    averageBidValue: number;
    lastBidDate?: Date;
    preferredSuppliers: string[];
  };

  // News & Events
  newsMentions?: {
    count: number;
    recentHeadlines: string[];
    sentiment: 'positive' | 'neutral' | 'negative';
    lastMentionDate?: Date;
  };

  // Competitor Activity
  competitorActivity?: {
    recentWins: Array<{
      competitor: string;
      bidTitle: string;
      amount: number;
      date: Date;
    }>;
  };

  // Website Activity (if tracked)
  websiteVisits?: {
    totalVisits: number;
    lastVisitDate?: Date;
    pagesViewed: string[];
  };

  enrichedAt: Date;
}

export interface EnrichedLead extends RawLead {
  // Company Enrichment
  company: CompanyEnrichment;

  // Contact Enrichment (if available)
  contact?: ContactEnrichment;

  // Behavioral Enrichment
  behavioral?: BehavioralEnrichment;

  // Overall Enrichment Status
  enrichmentStatus: 'pending' | 'partial' | 'complete' | 'failed';
  enrichmentCompleteness: number;                // 0-100
}

// ============================================================================
// Lead Scoring Types
// ============================================================================

export interface LeadScore {
  // Total Score (0-100)
  totalScore: number;

  // Component Scores
  firmographicScore: number;                     // 0-40
  behavioralScore: number;                       // 0-30
  contactQualityScore: number;                   // 0-20
  intentScore: number;                           // 0-10

  // Grade & Priority
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  priority: 'immediate' | 'high' | 'medium' | 'low';

  // ML Prediction
  conversionProbability: number;                 // 0.0 - 1.0 (ML model)

  // Recommended Action
  recommendedAction: 'contact_now' | 'schedule_followup' | 'nurture' | 'disqualify';
  actionReason: string;

  // SLA
  slaHours: number;                              // Hours to respond

  // Scoring Metadata
  scoredAt: Date;
  modelVersion: string;                          // ML model version
}

export interface FirmographicScore {
  // Budget (15 pts)
  budgetScore: number;
  budgetValue?: number;
  budgetReason: string;

  // Employee Count (10 pts)
  employeeScore: number;
  employeeCount?: number;
  employeeReason: string;

  // Industry Fit (10 pts)
  industryScore: number;
  industry?: string;
  industryReason: string;

  // Location (5 pts)
  locationScore: number;
  location?: string;
  locationReason: string;

  // Total
  total: number;                                 // 0-40
}

export interface BehavioralScore {
  // Past Purchases (15 pts)
  purchaseHistoryScore: number;
  purchaseCount?: number;
  purchaseReason: string;

  // Engagement (10 pts)
  engagementScore: number;
  engagementMetrics?: {
    emailOpens: number;
    linkClicks: number;
    websiteVisits: number;
  };
  engagementReason: string;

  // Timeline Fit (5 pts)
  timelineScore: number;
  daysToDeadline?: number;
  timelineReason: string;

  // Total
  total: number;                                 // 0-30
}

export interface ContactQualityScore {
  // Email Verified (10 pts)
  emailScore: number;
  emailVerified?: boolean;
  emailReason: string;

  // Phone Verified (5 pts)
  phoneScore: number;
  phoneVerified?: boolean;
  phoneReason: string;

  // Decision Maker (5 pts)
  decisionMakerScore: number;
  jobTitle?: string;
  seniority?: string;
  decisionMakerReason: string;

  // Total
  total: number;                                 // 0-20
}

export interface IntentScore {
  // Buying Signals (5 pts)
  buyingSignalScore: number;
  signals?: string[];
  buyingSignalReason: string;

  // Urgency (5 pts)
  urgencyScore: number;
  urgencyIndicators?: string[];
  urgencyReason: string;

  // Total
  total: number;                                 // 0-10
}

// ============================================================================
// Pipeline Stage Types
// ============================================================================

export enum LeadStage {
  RAW = 'raw',                                   // 신규 발견
  ENRICHED = 'enriched',                         // 데이터 강화 완료
  QUALIFIED = 'qualified',                       // 스코어링 완료 (60+)
  CONTACTED = 'contacted',                       // 1차 접촉 완료
  ENGAGED = 'engaged',                           // 응답 확인
  OPPORTUNITY = 'opportunity',                   // 상담 예약
  CLOSED_WON = 'closed_won',                     // 계약 성사
  CLOSED_LOST = 'closed_lost',                   // 실패
  DISQUALIFIED = 'disqualified',                 // 자격 미달
}

export interface LeadStageHistory {
  stage: LeadStage;
  enteredAt: Date;
  exitedAt?: Date;
  durationHours?: number;
  notes?: string;
}

export interface QualifiedLead extends EnrichedLead {
  // Scoring
  score: LeadScore;

  // Stage
  stage: LeadStage;
  stageHistory: LeadStageHistory[];

  // Assignment
  assignedTo?: string;                           // Sales rep user ID
  assignedAt?: Date;
}

// ============================================================================
// Automation Trigger Types
// ============================================================================

export enum TriggerType {
  // Data Source Triggers
  NEW_BID_PUBLISHED = 'new_bid_published',
  BID_UPDATED = 'bid_updated',
  BID_DEADLINE_APPROACHING = 'bid_deadline_approaching',

  // Company Event Triggers
  COMPANY_FUNDING_NEWS = 'company_funding_news',
  COMPANY_EXPANSION = 'company_expansion',
  NEW_FACILITY_ANNOUNCED = 'new_facility_announced',

  // Contact Change Triggers
  DECISION_MAKER_JOB_CHANGE = 'decision_maker_job_change',
  NEW_PROCUREMENT_MANAGER = 'new_procurement_manager',

  // Competitor Triggers
  COMPETITOR_WON_BID = 'competitor_won_bid',
  COMPETITOR_PRODUCT_LAUNCH = 'competitor_product_launch',

  // Behavioral Triggers
  EMAIL_OPENED = 'email_opened',
  LINK_CLICKED = 'link_clicked',
  FORM_SUBMITTED = 'form_submitted',
  WEBSITE_VISITED = 'website_visited',
  LINKEDIN_PROFILE_VIEWED = 'linkedin_profile_viewed',
}

export interface Trigger {
  id: string;
  type: TriggerType;
  leadId: LeadId;

  // Trigger Data
  source: string;                                // g2b, linkedin, news, etc.
  data: Record<string, unknown>;

  // Priority
  priority: 1 | 2 | 3 | 4 | 5;                   // 1=highest

  // Actions to Execute
  actions: TriggerAction[];

  // Metadata
  triggeredAt: Date;
  processedAt?: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
}

export interface TriggerAction {
  type: 'score_boost' | 'send_alert' | 'send_email' | 'create_task' | 'update_stage';
  config: Record<string, unknown>;
  delayMs?: number;
  executedAt?: Date;
  status?: 'pending' | 'completed' | 'failed';
}

// ============================================================================
// Outreach & Communication Types
// ============================================================================

export enum OutreachChannel {
  EMAIL = 'email',
  PHONE = 'phone',
  SMS = 'sms',
  LINKEDIN = 'linkedin',
  KAKAO_TALK = 'kakao_talk',
  SLACK = 'slack',
}

export interface OutreachMessage {
  id: string;
  leadId: LeadId;
  channel: OutreachChannel;

  // Content
  subject?: string;                              // For email
  body: string;
  templateId?: string;
  personalizedFields?: Record<string, string>;

  // Recipient
  recipientEmail?: EmailAddress;
  recipientPhone?: PhoneNumber;
  recipientLinkedIn?: LinkedInUrl;

  // Tracking
  sentAt?: Date;
  deliveredAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
  repliedAt?: Date;

  // Status
  status: 'draft' | 'scheduled' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'replied' | 'failed';
  error?: string;

  // Analytics
  analytics?: {
    openCount: number;
    clickCount: number;
    linkClicks: Record<string, number>;          // URL → count
  };

  // Metadata
  createdAt: Date;
  createdBy: string;                             // User ID or 'automation'
}

export interface OutreachSequence {
  id: string;
  name: string;
  description?: string;

  // Steps
  steps: OutreachStep[];

  // Targeting
  targetStage?: LeadStage;
  targetScoreMin?: number;
  targetGrades?: Array<'A+' | 'A' | 'B'>;

  // Status
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface OutreachStep {
  stepNumber: number;
  delayDays: number;                             // Days after previous step
  channel: OutreachChannel;
  templateId: string;

  // Conditions
  conditions?: {
    ifPreviousOpened?: boolean;
    ifPreviousClicked?: boolean;
    ifNoReply?: boolean;
  };
}

// ============================================================================
// CRM Integration Types
// ============================================================================

export enum CRMSystem {
  HUBSPOT = 'hubspot',
  SALESFORCE = 'salesforce',
  PIPEDRIVE = 'pipedrive',
  ZOHO = 'zoho',
  CUSTOM = 'custom',
}

export interface CRMSyncConfig {
  system: CRMSystem;
  enabled: boolean;

  // Credentials
  credentials: {
    apiKey?: string;
    oauthToken?: string;
    instanceUrl?: string;
  };

  // Sync Settings
  syncDirection: 'bidflow_to_crm' | 'crm_to_bidflow' | 'bidirectional';
  syncFrequencyMinutes: number;

  // Field Mapping
  fieldMapping: Record<string, string>;          // BIDFLOW field → CRM field

  // Filters
  syncOnlyQualified: boolean;
  minimumScore?: number;

  // Metadata
  lastSyncAt?: Date;
  lastSyncStatus?: 'success' | 'partial' | 'failed';
  lastSyncError?: string;
}

export interface CRMOpportunity {
  id: string;
  leadId: LeadId;
  crmSystem: CRMSystem;
  crmOpportunityId: string;

  // Opportunity Data
  name: string;
  amount: number;
  currency: string;
  stage: string;                                 // CRM-specific stage
  probability: number;                           // 0-100
  closeDate?: Date;

  // Owner
  ownerId: string;
  ownerEmail: string;
  ownerName: string;

  // Sync
  syncedAt: Date;
  syncDirection: 'to_crm' | 'from_crm';
}

// ============================================================================
// Analytics & Reporting Types
// ============================================================================

export interface PipelineMetrics {
  // Period
  period: 'today' | 'week' | 'month' | 'quarter' | 'year';
  startDate: Date;
  endDate: Date;

  // Lead Volume
  totalLeads: number;
  newLeads: number;
  enrichedLeads: number;
  qualifiedLeads: number;

  // Conversion Rates
  enrichmentRate: number;                        // %
  qualificationRate: number;                     // %
  contactedRate: number;                         // %
  responseRate: number;                          // %
  opportunityRate: number;                       // %
  winRate: number;                               // %

  // Stage Distribution
  stageDistribution: Record<LeadStage, number>;

  // Source Performance
  sourcePerformance: Array<{
    source: LeadSource;
    count: number;
    qualificationRate: number;
    winRate: number;
  }>;

  // Average Scores
  averageScore: number;
  averageScoreByGrade: Record<string, number>;

  // Response Times
  avgTimeToEnrich: number;                       // hours
  avgTimeToContact: number;                      // hours
  avgTimeToOpportunity: number;                  // days
  avgTimeToClose: number;                        // days

  // Revenue Impact
  pipelineValue: number;                         // Total opportunity value
  closedWonValue: number;                        // Closed deals value
  projectedRevenue: number;                      // Weighted pipeline
}

export interface LeadSourcePerformance {
  source: LeadSource;

  // Volume
  totalLeads: number;
  qualifiedLeads: number;
  opportunities: number;
  closedWon: number;

  // Quality
  averageScore: number;
  averageConversionProbability: number;

  // Conversion Funnel
  enrichmentRate: number;
  qualificationRate: number;
  contactRate: number;
  responseRate: number;
  opportunityRate: number;
  winRate: number;

  // Revenue
  totalRevenue: number;
  averageDealSize: number;
  costPerLead?: number;
  costPerAcquisition?: number;
  roi?: number;                                  // Return on Investment
}

// ============================================================================
// N8N Workflow Types
// ============================================================================

export interface N8NWorkflowConfig {
  id: string;
  name: string;
  description: string;

  // Trigger
  trigger: {
    type: 'schedule' | 'webhook' | 'manual';
    config: Record<string, unknown>;
  };

  // Nodes
  nodes: N8NNode[];

  // Connections
  connections: Record<string, N8NConnection[]>;

  // Settings
  settings: {
    executionOrder: 'v0' | 'v1';
    saveExecutionProgress?: boolean;
    saveManualExecutions?: boolean;
  };

  // Status
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface N8NNode {
  name: string;
  type: string;                                  // n8n node type
  position: [number, number];
  parameters: Record<string, unknown>;
  credentials?: Record<string, string>;
}

export interface N8NConnection {
  node: string;
  type: 'main' | 'error';
  index: number;
}

// ============================================================================
// Utility Types
// ============================================================================

export type EmployeeRange =
  | '1-10'
  | '11-50'
  | '51-200'
  | '201-500'
  | '501-1000'
  | '1001-5000'
  | '5001+';

export type RevenueRange =
  | '0-1B'           // 10억 미만
  | '1B-10B'         // 10억 ~ 100억
  | '10B-50B'        // 100억 ~ 500억
  | '50B-100B'       // 500억 ~ 1,000억
  | '100B-500B'      // 1,000억 ~ 5,000억
  | '500B+';         // 5,000억 이상

export interface DateRange {
  start: Date;
  end: Date;
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

export interface FilterConfig {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains';
  value: unknown;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface CreateLeadRequest {
  source: LeadSource;
  sourceReferenceId: string;
  companyName: string;
  companyDomain?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  rawData?: Record<string, unknown>;
}

export interface CreateLeadResponse {
  success: boolean;
  lead?: QualifiedLead;
  error?: string;
}

export interface EnrichLeadRequest {
  leadId: LeadId;
  enrichmentOptions: {
    companyData: boolean;
    contactData: boolean;
    emailDiscovery: boolean;
    phoneDiscovery: boolean;
    behavioralData: boolean;
  };
}

export interface EnrichLeadResponse {
  success: boolean;
  lead?: EnrichedLead;
  enrichmentCompleteness: number;
  creditsUsed: number;
  error?: string;
}

export interface ScoreLeadRequest {
  leadId: LeadId;
  useMLModel: boolean;
}

export interface ScoreLeadResponse {
  success: boolean;
  score?: LeadScore;
  previousScore?: LeadScore;
  scoreChange?: number;
  error?: string;
}

export interface ListLeadsRequest {
  stage?: LeadStage;
  source?: LeadSource;
  minScore?: number;
  maxScore?: number;
  grades?: Array<'A+' | 'A' | 'B' | 'C' | 'D' | 'F'>;
  assignedTo?: string;
  dateRange?: DateRange;
  pagination: Pagination;
  sort?: SortConfig;
  filters?: FilterConfig[];
}

export interface ListLeadsResponse {
  success: boolean;
  leads: QualifiedLead[];
  pagination: Pagination;
  error?: string;
}

// ============================================================================
// Export All
// ============================================================================

export type {
  // Core Lead Types
  RawLead,
  EnrichedLead,
  QualifiedLead,

  // Enrichment
  CompanyEnrichment,
  ContactEnrichment,
  BehavioralEnrichment,

  // Scoring
  LeadScore,
  FirmographicScore,
  BehavioralScore,
  ContactQualityScore,
  IntentScore,

  // Pipeline
  LeadStageHistory,

  // Triggers
  Trigger,
  TriggerAction,

  // Outreach
  OutreachMessage,
  OutreachSequence,
  OutreachStep,

  // CRM
  CRMSyncConfig,
  CRMOpportunity,

  // Analytics
  PipelineMetrics,
  LeadSourcePerformance,

  // N8N
  N8NWorkflowConfig,
  N8NNode,
  N8NConnection,

  // API
  CreateLeadRequest,
  CreateLeadResponse,
  EnrichLeadRequest,
  EnrichLeadResponse,
  ScoreLeadRequest,
  ScoreLeadResponse,
  ListLeadsRequest,
  ListLeadsResponse,
};

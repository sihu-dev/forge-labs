/**
 * @forge/types - Outreach Automation Types (L0 - Atoms)
 *
 * Multi-channel outreach sequence automation with Claude AI personalization
 */

import type { UUID, Timestamp } from '../index.js';

// ============================================
// Channel Types
// ============================================

/** Supported outreach channels */
export type OutreachChannel = 'email' | 'linkedin' | 'phone' | 'whatsapp';

/** Channel status */
export type ChannelStatus = 'active' | 'paused' | 'disabled' | 'rate_limited';

/** Channel provider */
export type ChannelProvider =
  | 'instantly'      // Email
  | 'heyreach'       // LinkedIn
  | 'vapi'           // Phone/Voice AI
  | 'whatsapp_business'; // WhatsApp

/** Channel configuration */
export interface IChannelConfig {
  channel: OutreachChannel;
  provider: ChannelProvider;
  status: ChannelStatus;
  credentials: Record<string, string>;
  rate_limits: IRateLimit;
  settings: IChannelSettings;
}

export interface IRateLimit {
  max_per_hour: number;
  max_per_day: number;
  min_delay_seconds: number;
  current_usage: number;
  reset_at: Timestamp;
}

export interface IChannelSettings {
  enabled: boolean;
  priority: number; // 1-10, higher = more important
  fallback_channel?: OutreachChannel;
  business_hours_only: boolean;
  timezone: string;
}

// ============================================
// Sequence Types
// ============================================

/** Sequence status */
export type SequenceStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived';

/** Sequence step type */
export type SequenceStepType =
  | 'initial_outreach'
  | 'follow_up'
  | 'break_up'
  | 're_engagement'
  | 'meeting_confirmation'
  | 'custom';

/** Outreach sequence */
export interface IOutreachSequence {
  id: UUID;
  name: string;
  description: string;
  status: SequenceStatus;
  target_persona: string;
  steps: ISequenceStep[];
  performance: ISequencePerformance;
  created_at: Timestamp;
  updated_at: Timestamp;
}

/** Sequence step */
export interface ISequenceStep {
  id: UUID;
  sequence_id: UUID;
  step_number: number;
  type: SequenceStepType;
  channel: OutreachChannel;
  delay_days: number; // Days after previous step (0 for immediate)
  subject_variants?: string[]; // For email
  body_variants: string[];
  cta_variants?: string[];
  conditions: IStepCondition[];
  ai_personalization: IAIPersonalizationConfig;
}

/** Step execution condition */
export interface IStepCondition {
  type: 'previous_opened' | 'previous_clicked' | 'previous_replied' | 'custom';
  operator: 'equals' | 'not_equals' | 'contains';
  value: string | boolean;
  skip_if_true: boolean;
}

/** AI personalization configuration */
export interface IAIPersonalizationConfig {
  enabled: boolean;
  research_depth: 'basic' | 'medium' | 'deep';
  tone: 'professional' | 'casual' | 'friendly' | 'authoritative';
  custom_prompts: IClaudePrompt[];
  use_company_research: boolean;
  use_pain_point_detection: boolean;
  use_value_prop_generation: boolean;
  ab_variant_count: number; // Number of A/B variants to generate
}

/** Claude prompt template */
export interface IClaudePrompt {
  id: UUID;
  name: string;
  category: 'research' | 'personalization' | 'objection_handling' | 'value_prop';
  system_prompt: string;
  user_prompt_template: string;
  variables: string[]; // e.g., ['company_name', 'industry', 'contact_name']
  model: 'claude-3-5-sonnet-20241022' | 'claude-3-5-haiku-20241022';
  temperature: number;
  max_tokens: number;
}

// ============================================
// Contact & Lead Types
// ============================================

/** Lead status in sequence */
export type LeadStatus =
  | 'new'
  | 'in_sequence'
  | 'replied_positive'
  | 'replied_neutral'
  | 'replied_negative'
  | 'out_of_office'
  | 'unsubscribed'
  | 'bounced'
  | 'meeting_scheduled'
  | 'customer';

/** Lead/Contact */
export interface ILead {
  id: UUID;
  email: string;
  first_name: string;
  last_name: string;
  company_name: string;
  job_title?: string;
  linkedin_url?: string;
  phone?: string;
  whatsapp?: string;
  status: LeadStatus;
  tags: string[];
  custom_fields: Record<string, string>;
  enrichment_data?: IEnrichmentData;
  created_at: Timestamp;
  updated_at: Timestamp;
}

/** Enrichment data from research */
export interface IEnrichmentData {
  company_size?: string;
  industry?: string;
  revenue?: string;
  technologies?: string[];
  pain_points?: string[];
  recent_news?: string[];
  decision_maker_level?: 'c_level' | 'vp' | 'director' | 'manager' | 'individual';
  buying_intent?: 'high' | 'medium' | 'low';
  researched_at: Timestamp;
  data_sources: string[];
}

// ============================================
// Campaign & Execution Types
// ============================================

/** Campaign */
export interface ICampaign {
  id: UUID;
  name: string;
  sequence_id: UUID;
  leads: UUID[];
  status: 'scheduled' | 'running' | 'paused' | 'completed';
  start_date: Timestamp;
  end_date?: Timestamp;
  performance: ICampaignPerformance;
  settings: ICampaignSettings;
}

export interface ICampaignSettings {
  daily_send_limit: number;
  optimal_send_times: string[]; // e.g., ['09:00', '14:00', '16:30']
  skip_weekends: boolean;
  time_zone: string;
  auto_stop_on_reply: boolean;
  auto_stop_on_unsubscribe: boolean;
}

/** Outreach execution */
export interface IOutreachExecution {
  id: UUID;
  campaign_id: UUID;
  lead_id: UUID;
  step_id: UUID;
  channel: OutreachChannel;
  status: ExecutionStatus;
  scheduled_at: Timestamp;
  sent_at?: Timestamp;
  opened_at?: Timestamp;
  clicked_at?: Timestamp;
  replied_at?: Timestamp;
  content: IOutreachContent;
  tracking: IExecutionTracking;
  response_data?: IResponseData;
}

export type ExecutionStatus =
  | 'scheduled'
  | 'sending'
  | 'sent'
  | 'delivered'
  | 'opened'
  | 'clicked'
  | 'replied'
  | 'bounced'
  | 'failed'
  | 'cancelled';

export interface IOutreachContent {
  subject?: string; // For email
  body: string;
  cta?: string;
  variant_id: string; // Which A/B variant was used
  personalization_tokens: Record<string, string>;
  ai_generated: boolean;
  generation_prompt?: string;
}

export interface IExecutionTracking {
  open_count: number;
  click_count: number;
  link_clicks: Record<string, number>; // URL -> click count
  user_agent?: string;
  ip_address?: string;
  location?: string;
}

/** Response data */
export interface IResponseData {
  type: 'positive' | 'objection' | 'out_of_office' | 'unsubscribe' | 'neutral';
  message: string;
  sentiment_score: number; // -1 to 1
  detected_objections?: string[];
  next_action: ResponseAction;
  ai_suggested_reply?: string;
}

export type ResponseAction =
  | 'schedule_meeting'
  | 'send_ai_reply'
  | 'reschedule_sequence'
  | 'mark_unsubscribed'
  | 'escalate_to_human'
  | 'continue_sequence'
  | 'mark_as_customer';

// ============================================
// Performance & Analytics Types
// ============================================

export interface ISequencePerformance {
  total_leads: number;
  active_leads: number;
  completed_leads: number;

  // Email metrics
  emails_sent: number;
  emails_delivered: number;
  emails_opened: number;
  emails_clicked: number;
  emails_replied: number;
  emails_bounced: number;

  // Engagement rates
  open_rate: number;
  click_rate: number;
  reply_rate: number;
  bounce_rate: number;
  unsubscribe_rate: number;

  // Conversion metrics
  positive_replies: number;
  meetings_scheduled: number;
  customers_converted: number;
  conversion_rate: number;

  // Response handling
  objections_count: number;
  out_of_office_count: number;

  // A/B testing
  best_performing_variant?: string;
  variant_performance: Record<string, IVariantPerformance>;

  last_updated: Timestamp;
}

export interface ICampaignPerformance extends ISequencePerformance {
  campaign_id: UUID;
  daily_stats: IDailyStats[];
  channel_breakdown: Record<OutreachChannel, IChannelPerformance>;
}

export interface IVariantPerformance {
  variant_id: string;
  sent_count: number;
  open_rate: number;
  click_rate: number;
  reply_rate: number;
  conversion_rate: number;
  confidence_score: number; // Statistical significance
}

export interface IDailyStats {
  date: string; // YYYY-MM-DD
  sent: number;
  opened: number;
  clicked: number;
  replied: number;
  meetings: number;
}

export interface IChannelPerformance {
  channel: OutreachChannel;
  sent: number;
  delivered: number;
  engagement_rate: number;
  conversion_rate: number;
  avg_response_time_hours: number;
  cost_per_lead?: number;
}

// ============================================
// Integration Types
// ============================================

/** Email provider config (Instantly.ai) */
export interface IInstantlyConfig {
  api_key: string;
  workspace_id: string;
  campaign_id?: string;
  from_email: string;
  from_name: string;
  reply_to?: string;
  tracking_enabled: boolean;
  warmup_enabled: boolean;
}

/** LinkedIn provider config (HeyReach) */
export interface IHeyReachConfig {
  api_key: string;
  account_id: string;
  connection_request_limit: number;
  message_limit: number;
  use_safe_mode: boolean;
}

/** Voice AI provider config (Vapi.ai) */
export interface IVapiConfig {
  api_key: string;
  assistant_id: string;
  phone_number: string;
  voice_id: string;
  max_duration_minutes: number;
  record_calls: boolean;
}

/** WhatsApp Business API config */
export interface IWhatsAppConfig {
  phone_number_id: string;
  access_token: string;
  business_account_id: string;
  message_template_namespace: string;
  approved_templates: string[];
}

// ============================================
// AI Personalization Types
// ============================================

/** Company research result */
export interface ICompanyResearch {
  company_name: string;
  website?: string;
  industry: string;
  employee_count?: number;
  revenue_range?: string;
  headquarters?: string;
  description: string;
  recent_news: INewsItem[];
  technologies: string[];
  competitors: string[];
  pain_points: string[];
  buying_signals: string[];
  researched_at: Timestamp;
  confidence_score: number;
}

export interface INewsItem {
  title: string;
  url: string;
  published_date: string;
  summary: string;
  relevance_score: number;
}

/** Pain point identification */
export interface IPainPoint {
  category: 'operational' | 'financial' | 'growth' | 'technical' | 'competitive';
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  evidence: string[];
  our_solution_fit: number; // 0-100
}

/** Value proposition */
export interface IValueProposition {
  headline: string;
  subheadline: string;
  key_benefits: string[];
  proof_points: string[];
  cta: string;
  personalization_score: number; // 0-100
  generated_at: Timestamp;
}

/** A/B variant */
export interface IABVariant {
  id: string;
  variant_type: 'subject' | 'body' | 'cta';
  content: string;
  hypothesis: string; // Why we're testing this
  traffic_allocation: number; // 0-100 percentage
  performance?: IVariantPerformance;
  created_at: Timestamp;
}

// ============================================
// Webhook & Event Types
// ============================================

/** Webhook event */
export interface IWebhookEvent {
  id: UUID;
  type: WebhookEventType;
  channel: OutreachChannel;
  execution_id: UUID;
  lead_id: UUID;
  data: Record<string, unknown>;
  timestamp: Timestamp;
  processed: boolean;
}

export type WebhookEventType =
  | 'email.delivered'
  | 'email.opened'
  | 'email.clicked'
  | 'email.replied'
  | 'email.bounced'
  | 'email.unsubscribed'
  | 'linkedin.connection_accepted'
  | 'linkedin.message_sent'
  | 'linkedin.message_replied'
  | 'phone.call_completed'
  | 'phone.voicemail_left'
  | 'whatsapp.message_delivered'
  | 'whatsapp.message_read'
  | 'whatsapp.message_replied';

// ============================================
// Schedule Optimization Types
// ============================================

/** Send time optimization */
export interface ISendTimeOptimization {
  lead_id: UUID;
  optimal_day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  optimal_hour: number; // 0-23
  confidence: number; // 0-100
  based_on: 'historical_data' | 'industry_benchmark' | 'ml_prediction';
  timezone: string;
  last_updated: Timestamp;
}

/** A/B test configuration */
export interface IABTestConfig {
  id: UUID;
  name: string;
  element_type: 'subject' | 'body' | 'cta' | 'send_time';
  variants: IABVariant[];
  sample_size: number;
  start_date: Timestamp;
  end_date?: Timestamp;
  winner_criteria: 'open_rate' | 'click_rate' | 'reply_rate' | 'conversion_rate';
  min_confidence_level: number; // 0.95 for 95% confidence
  status: 'draft' | 'running' | 'completed' | 'winner_declared';
  winner_variant_id?: string;
}

// ============================================
// Constants
// ============================================

export const OUTREACH_CONSTANTS = {
  /** Default sequence templates */
  DEFAULT_SEQUENCE_TEMPLATES: {
    INITIAL_OUTREACH_DAY: 0,
    FOLLOW_UP_1_DAY: 3,
    FOLLOW_UP_2_DAY: 7,
    BREAK_UP_DAY: 14,
    RE_ENGAGEMENT_DAY: 30,
  },

  /** Rate limits */
  RATE_LIMITS: {
    EMAIL_PER_DAY: 200,
    LINKEDIN_CONNECTIONS_PER_DAY: 100,
    LINKEDIN_MESSAGES_PER_DAY: 150,
    PHONE_CALLS_PER_DAY: 50,
    WHATSAPP_PER_DAY: 1000,
  },

  /** Optimal send times (24h format) */
  OPTIMAL_SEND_TIMES: {
    MORNING: ['09:00', '10:30'],
    AFTERNOON: ['14:00', '15:30'],
    EVENING: ['17:00', '18:30'],
  },

  /** Response detection keywords */
  RESPONSE_KEYWORDS: {
    POSITIVE: ['interested', 'yes', 'absolutely', 'sounds good', 'let\'s talk', 'schedule', 'meeting'],
    OBJECTION: ['not interested', 'no budget', 'not now', 'maybe later', 'too expensive'],
    OUT_OF_OFFICE: ['out of office', 'ooo', 'vacation', 'away', 'auto-reply'],
    UNSUBSCRIBE: ['unsubscribe', 'remove me', 'stop', 'opt out', 'don\'t contact'],
  },

  /** AI model configs */
  AI_MODELS: {
    RESEARCH: 'claude-3-5-haiku-20241022',
    PERSONALIZATION: 'claude-3-5-sonnet-20241022',
    OBJECTION_HANDLING: 'claude-3-5-sonnet-20241022',
  },
} as const;

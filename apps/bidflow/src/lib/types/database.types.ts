/**
 * BIDFLOW Database Types
 *
 * Supabase 스키마와 1:1 매핑되는 TypeScript 타입
 * 자동 생성: npx supabase gen types typescript --local > src/lib/types/database.types.ts
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      bids: {
        Row: BidRow
        Insert: BidInsert
        Update: BidUpdate
      }
      bid_scores: {
        Row: BidScoreRow
        Insert: BidScoreInsert
        Update: BidScoreUpdate
      }
      emails: {
        Row: EmailRow
        Insert: EmailInsert
        Update: EmailUpdate
      }
      approvals: {
        Row: ApprovalRow
        Insert: ApprovalInsert
        Update: ApprovalUpdate
      }
      ab_tests: {
        Row: ABTestRow
        Insert: ABTestInsert
        Update: ABTestUpdate
      }
      performance_metrics: {
        Row: PerformanceMetricRow
        Insert: PerformanceMetricInsert
        Update: never
      }
      system_logs: {
        Row: SystemLogRow
        Insert: SystemLogInsert
        Update: never
      }
    }
  }
}

// =====================================================
// Row Types (DB에 저장된 형태)
// =====================================================

export interface BidRow {
  id: string
  bid_number: string
  title: string
  description: string | null
  organization: string
  budget: number | null
  deadline: string
  announcement_date: string | null
  category: string | null
  procurement_type: string | null
  source: 'g2b' | 'ted' | 'youtube'
  source_url: string
  raw_data: Json | null
  processing_status: ProcessingStatus
  created_at: string
  updated_at: string
}

export type ProcessingStatus =
  | 'pending'
  | 'analyzing'
  | 'scored'
  | 'approved'
  | 'rejected'
  | 'email_sent'
  | 'responded'

export interface BidScoreRow {
  id: string
  bid_id: string
  score: number
  confidence: number
  confidence_level: ConfidenceLevel
  intent: Intent | null
  win_probability: number | null
  estimated_profit: number | null
  matched_keywords: Json | null
  matched_products: Json | null
  risk_factors: Json | null
  recommendation: string | null
  model_used: string | null
  tokens_used: number | null
  analysis_duration_ms: number | null
  cache_hit: boolean
  created_at: string
  updated_at: string
}

export type ConfidenceLevel = 'low' | 'medium' | 'high' | 'very_high'
export type Intent = 'purchase' | 'maintenance' | 'disposal' | 'consulting' | 'other'

export interface EmailRow {
  id: string
  bid_id: string
  score_id: string | null
  recipient_email: string
  recipient_name: string | null
  subject: string
  body: string
  html_body: string | null
  personalization_level: 1 | 2 | 3
  variant: string | null
  test_group_id: string | null
  sent_at: string | null
  delivery_status: DeliveryStatus
  opened_at: string | null
  clicked_at: string | null
  responded_at: string | null
  response_text: string | null
  model_used: string | null
  tokens_used: number | null
  generation_duration_ms: number | null
  gmail_message_id: string | null
  gmail_thread_id: string | null
  created_at: string
  updated_at: string
}

export type DeliveryStatus =
  | 'pending'
  | 'sent'
  | 'delivered'
  | 'opened'
  | 'clicked'
  | 'responded'
  | 'bounced'
  | 'failed'

export interface ApprovalRow {
  id: string
  bid_id: string
  score_id: string | null
  approval_type: ApprovalType
  requested_by: string
  requested_at: string
  status: ApprovalStatus
  approver_id: string | null
  approver_name: string | null
  approved_at: string | null
  rejection_reason: string | null
  slack_message_ts: string | null
  slack_channel: string | null
  notification_sent: boolean
  expires_at: string | null
  metadata: Json | null
  created_at: string
  updated_at: string
}

export type ApprovalType = 'bid_match' | 'email_send' | 'high_value'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'expired' | 'auto_approved'

export interface ABTestRow {
  id: string
  name: string
  description: string | null
  test_type: string
  variants: Json
  status: ABTestStatus
  alpha_params: Json | null
  beta_params: Json | null
  total_sent: number
  total_opened: number
  total_clicked: number
  total_responded: number
  started_at: string | null
  ended_at: string | null
  winner_variant: string | null
  winner_confidence: number | null
  created_at: string
  updated_at: string
}

export type ABTestStatus = 'draft' | 'running' | 'paused' | 'completed' | 'archived'

export interface PerformanceMetricRow {
  id: string
  metric_type: MetricType
  metric_name: string
  metric_value: number
  metric_unit: string | null
  context: Json | null
  aggregation_period: 'minute' | 'hour' | 'day' | null
  period_start: string | null
  period_end: string | null
  created_at: string
}

export type MetricType =
  | 'api_latency'
  | 'matcher_accuracy'
  | 'email_response_rate'
  | 'cache_hit_rate'
  | 'cost_per_bid'

export interface SystemLogRow {
  id: string
  log_level: LogLevel
  log_source: string
  message: string
  error_code: string | null
  error_stack: string | null
  context: Json | null
  user_id: string | null
  created_at: string
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal'

// =====================================================
// Insert Types
// =====================================================

export type BidInsert = Omit<BidRow, 'id' | 'created_at' | 'updated_at' | 'processing_status'> & {
  processing_status?: ProcessingStatus
}

export type BidScoreInsert = Omit<BidScoreRow, 'id' | 'created_at' | 'updated_at' | 'cache_hit'> & {
  cache_hit?: boolean
}

export type EmailInsert = Omit<EmailRow, 'id' | 'created_at' | 'updated_at' | 'delivery_status' | 'sent_at' | 'opened_at' | 'clicked_at' | 'responded_at'> & {
  delivery_status?: DeliveryStatus
}

export type ApprovalInsert = Omit<ApprovalRow, 'id' | 'created_at' | 'updated_at' | 'status' | 'requested_at' | 'notification_sent'> & {
  status?: ApprovalStatus
  notification_sent?: boolean
}

export type ABTestInsert = Omit<ABTestRow, 'id' | 'created_at' | 'updated_at' | 'status' | 'total_sent' | 'total_opened' | 'total_clicked' | 'total_responded'> & {
  status?: ABTestStatus
}

export type PerformanceMetricInsert = Omit<PerformanceMetricRow, 'id' | 'created_at'>

export type SystemLogInsert = Omit<SystemLogRow, 'id' | 'created_at'>

// =====================================================
// Update Types
// =====================================================

export type BidUpdate = Partial<Omit<BidRow, 'id' | 'created_at' | 'updated_at'>>
export type BidScoreUpdate = Partial<Omit<BidScoreRow, 'id' | 'bid_id' | 'created_at' | 'updated_at'>>
export type EmailUpdate = Partial<Omit<EmailRow, 'id' | 'bid_id' | 'created_at' | 'updated_at'>>
export type ApprovalUpdate = Partial<Omit<ApprovalRow, 'id' | 'bid_id' | 'created_at' | 'updated_at'>>
export type ABTestUpdate = Partial<Omit<ABTestRow, 'id' | 'created_at' | 'updated_at'>>

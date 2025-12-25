/**
 * BIDFLOW Database Types
 *
 * Supabase 스키마와 1:1 매핑되는 TypeScript 타입
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

// =====================================================
// Enum Types
// =====================================================

export type BidSourceType = 'g2b' | 'ted' | 'sam' | 'custom'
export type BidStatus = 'new' | 'reviewing' | 'applied' | 'won' | 'lost' | 'cancelled'
export type ProcessingStatus = 'pending' | 'analyzing' | 'scored' | 'approved' | 'rejected' | 'email_sent' | 'responded'
export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error'
export type KeywordCategory = 'product' | 'service' | 'industry' | 'location'
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'lost'
export type LeadSource = 'bid_extraction' | 'manual' | 'import' | 'enrichment'
export type ConfidenceLevel = 'low' | 'medium' | 'high' | 'very_high'
export type Intent = 'purchase' | 'maintenance' | 'disposal' | 'consulting' | 'other'
export type DeliveryStatus = 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'responded' | 'bounced' | 'failed'
export type ApprovalType = 'bid_match' | 'email_send' | 'high_value'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'expired' | 'auto_approved'
export type ABTestStatus = 'draft' | 'running' | 'paused' | 'completed' | 'archived'
export type MetricType = 'api_latency' | 'matcher_accuracy' | 'email_response_rate' | 'cache_hit_rate' | 'cost_per_bid'
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal'
export type BidActivityType = 'created' | 'status_changed' | 'score_updated' | 'email_sent' | 'email_opened' | 'email_clicked' | 'email_responded' | 'approved' | 'rejected' | 'note_added'
export type LeadActivityType = 'created' | 'status_changed' | 'score_updated' | 'email_sent' | 'email_opened' | 'email_clicked' | 'email_responded' | 'call_made' | 'meeting_scheduled' | 'note_added' | 'enriched'

// =====================================================
// Database Interface
// =====================================================

export interface Database {
  public: {
    Tables: {
      bids: {
        Row: {
          id: string
          user_id: string
          bid_number: string
          title: string
          description: string | null
          organization: string
          budget: number | null
          deadline: string
          announcement_date: string | null
          category: string | null
          procurement_type: string | null
          source: BidSourceType
          source_url: string | null
          raw_data: Json | null
          status: BidStatus
          processing_status: ProcessingStatus
          matched: boolean
          match_score: number | null
          leads_generated: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          bid_number: string
          title: string
          description?: string | null
          organization: string
          budget?: number | null
          deadline: string
          announcement_date?: string | null
          category?: string | null
          procurement_type?: string | null
          source: BidSourceType
          source_url?: string | null
          raw_data?: Json | null
          status?: BidStatus
          processing_status?: ProcessingStatus
          matched?: boolean
          match_score?: number | null
          leads_generated?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          bid_number?: string
          title?: string
          description?: string | null
          organization?: string
          budget?: number | null
          deadline?: string
          announcement_date?: string | null
          category?: string | null
          procurement_type?: string | null
          source?: BidSourceType
          source_url?: string | null
          raw_data?: Json | null
          status?: BidStatus
          processing_status?: ProcessingStatus
          matched?: boolean
          match_score?: number | null
          leads_generated?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      bid_scores: {
        Row: {
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
        Insert: {
          id?: string
          bid_id: string
          score: number
          confidence: number
          confidence_level: ConfidenceLevel
          intent?: Intent | null
          win_probability?: number | null
          estimated_profit?: number | null
          matched_keywords?: Json | null
          matched_products?: Json | null
          risk_factors?: Json | null
          recommendation?: string | null
          model_used?: string | null
          tokens_used?: number | null
          analysis_duration_ms?: number | null
          cache_hit?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          bid_id?: string
          score?: number
          confidence?: number
          confidence_level?: ConfidenceLevel
          intent?: Intent | null
          win_probability?: number | null
          estimated_profit?: number | null
          matched_keywords?: Json | null
          matched_products?: Json | null
          risk_factors?: Json | null
          recommendation?: string | null
          model_used?: string | null
          tokens_used?: number | null
          analysis_duration_ms?: number | null
          cache_hit?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      bid_keywords: {
        Row: {
          id: string
          user_id: string
          keyword: string
          category: KeywordCategory
          priority: number
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          keyword: string
          category: KeywordCategory
          priority?: number
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          keyword?: string
          category?: KeywordCategory
          priority?: number
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      bid_sources: {
        Row: {
          id: string
          user_id: string
          source_type: BidSourceType
          name: string
          url: string | null
          api_key_encrypted: string | null
          config: Json | null
          active: boolean
          last_sync_at: string | null
          sync_status: SyncStatus
          error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          source_type: BidSourceType
          name: string
          url?: string | null
          api_key_encrypted?: string | null
          config?: Json | null
          active?: boolean
          last_sync_at?: string | null
          sync_status?: SyncStatus
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          source_type?: BidSourceType
          name?: string
          url?: string | null
          api_key_encrypted?: string | null
          config?: Json | null
          active?: boolean
          last_sync_at?: string | null
          sync_status?: SyncStatus
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      bid_activities: {
        Row: {
          id: string
          bid_id: string
          type: BidActivityType
          description: string
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          bid_id: string
          type: BidActivityType
          description: string
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: never
          bid_id?: never
          type?: never
          description?: never
          metadata?: never
          created_at?: never
        }
        Relationships: []
      }
      leads: {
        Row: {
          id: string
          user_id: string
          bid_id: string | null
          name: string
          email: string
          title: string | null
          phone: string | null
          linkedin_url: string | null
          organization: string | null
          organization_domain: string | null
          department: string | null
          score: number
          status: LeadStatus
          source: LeadSource
          sequence_id: string | null
          verified: boolean
          notes: string | null
          metadata: Json | null
          enriched_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          bid_id?: string | null
          name: string
          email: string
          title?: string | null
          phone?: string | null
          linkedin_url?: string | null
          organization?: string | null
          organization_domain?: string | null
          department?: string | null
          score?: number
          status?: LeadStatus
          source: LeadSource
          sequence_id?: string | null
          verified?: boolean
          notes?: string | null
          metadata?: Json | null
          enriched_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          bid_id?: string | null
          name?: string
          email?: string
          title?: string | null
          phone?: string | null
          linkedin_url?: string | null
          organization?: string | null
          organization_domain?: string | null
          department?: string | null
          score?: number
          status?: LeadStatus
          source?: LeadSource
          sequence_id?: string | null
          verified?: boolean
          notes?: string | null
          metadata?: Json | null
          enriched_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      lead_activities: {
        Row: {
          id: string
          lead_id: string
          type: LeadActivityType
          description: string
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          lead_id: string
          type: LeadActivityType
          description: string
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: never
          lead_id?: never
          type?: never
          description?: never
          metadata?: never
          created_at?: never
        }
        Relationships: []
      }
      lead_sequences: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          steps: Json
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          steps: Json
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          steps?: Json
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      emails: {
        Row: {
          id: string
          bid_id: string
          score_id: string | null
          recipient_email: string
          recipient_name: string | null
          subject: string
          body: string
          html_body: string | null
          personalization_level: number
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
        Insert: {
          id?: string
          bid_id: string
          score_id?: string | null
          recipient_email: string
          recipient_name?: string | null
          subject: string
          body: string
          html_body?: string | null
          personalization_level?: number
          variant?: string | null
          test_group_id?: string | null
          sent_at?: string | null
          delivery_status?: DeliveryStatus
          opened_at?: string | null
          clicked_at?: string | null
          responded_at?: string | null
          response_text?: string | null
          model_used?: string | null
          tokens_used?: number | null
          generation_duration_ms?: number | null
          gmail_message_id?: string | null
          gmail_thread_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          bid_id?: string
          score_id?: string | null
          recipient_email?: string
          recipient_name?: string | null
          subject?: string
          body?: string
          html_body?: string | null
          personalization_level?: number
          variant?: string | null
          test_group_id?: string | null
          sent_at?: string | null
          delivery_status?: DeliveryStatus
          opened_at?: string | null
          clicked_at?: string | null
          responded_at?: string | null
          response_text?: string | null
          model_used?: string | null
          tokens_used?: number | null
          generation_duration_ms?: number | null
          gmail_message_id?: string | null
          gmail_thread_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      approvals: {
        Row: {
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
        Insert: {
          id?: string
          bid_id: string
          score_id?: string | null
          approval_type: ApprovalType
          requested_by: string
          requested_at?: string
          status?: ApprovalStatus
          approver_id?: string | null
          approver_name?: string | null
          approved_at?: string | null
          rejection_reason?: string | null
          slack_message_ts?: string | null
          slack_channel?: string | null
          notification_sent?: boolean
          expires_at?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          bid_id?: string
          score_id?: string | null
          approval_type?: ApprovalType
          requested_by?: string
          requested_at?: string
          status?: ApprovalStatus
          approver_id?: string | null
          approver_name?: string | null
          approved_at?: string | null
          rejection_reason?: string | null
          slack_message_ts?: string | null
          slack_channel?: string | null
          notification_sent?: boolean
          expires_at?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      ab_tests: {
        Row: {
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
        Insert: {
          id?: string
          name: string
          description?: string | null
          test_type: string
          variants: Json
          status?: ABTestStatus
          alpha_params?: Json | null
          beta_params?: Json | null
          total_sent?: number
          total_opened?: number
          total_clicked?: number
          total_responded?: number
          started_at?: string | null
          ended_at?: string | null
          winner_variant?: string | null
          winner_confidence?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          test_type?: string
          variants?: Json
          status?: ABTestStatus
          alpha_params?: Json | null
          beta_params?: Json | null
          total_sent?: number
          total_opened?: number
          total_clicked?: number
          total_responded?: number
          started_at?: string | null
          ended_at?: string | null
          winner_variant?: string | null
          winner_confidence?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      performance_metrics: {
        Row: {
          id: string
          metric_type: MetricType
          metric_name: string
          metric_value: number
          metric_unit: string | null
          context: Json | null
          aggregation_period: string | null
          period_start: string | null
          period_end: string | null
          created_at: string
        }
        Insert: {
          id?: string
          metric_type: MetricType
          metric_name: string
          metric_value: number
          metric_unit?: string | null
          context?: Json | null
          aggregation_period?: string | null
          period_start?: string | null
          period_end?: string | null
          created_at?: string
        }
        Update: {
          id?: never
          metric_type?: never
          metric_name?: never
          metric_value?: never
          metric_unit?: never
          context?: never
          aggregation_period?: never
          period_start?: never
          period_end?: never
          created_at?: never
        }
        Relationships: []
      }
      system_logs: {
        Row: {
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
        Insert: {
          id?: string
          log_level: LogLevel
          log_source: string
          message: string
          error_code?: string | null
          error_stack?: string | null
          context?: Json | null
          user_id?: string | null
          created_at?: string
        }
        Update: {
          id?: never
          log_level?: never
          log_source?: never
          message?: never
          error_code?: never
          error_stack?: never
          context?: never
          user_id?: never
          created_at?: never
        }
        Relationships: []
      }
    }
    Views: {
      bid_stats: {
        Row: {
          user_id: string
          total_bids: number
          pending_bids: number
          analyzing_bids: number
          scored_bids: number
          approved_bids: number
          rejected_bids: number
          email_sent_bids: number
          responded_bids: number
          avg_score: number | null
          avg_confidence: number | null
          high_value_bids: number
        }
        Relationships: []
      }
      lead_stats: {
        Row: {
          user_id: string
          total_leads: number
          new_leads: number
          contacted_leads: number
          qualified_leads: number
          converted_leads: number
          lost_leads: number
          avg_score: number | null
          verified_leads: number
          conversion_rate: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
    Enums: {
      bid_source_type: BidSourceType
      bid_status: BidStatus
      processing_status: ProcessingStatus
      sync_status: SyncStatus
      keyword_category: KeywordCategory
      lead_status: LeadStatus
      lead_source: LeadSource
      confidence_level: ConfidenceLevel
      intent: Intent
      delivery_status: DeliveryStatus
      approval_type: ApprovalType
      approval_status: ApprovalStatus
      ab_test_status: ABTestStatus
      metric_type: MetricType
      log_level: LogLevel
    }
  }
}

// =====================================================
// Helper Types
// =====================================================

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Insertable<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updatable<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
export type Views<T extends keyof Database['public']['Views']> = Database['public']['Views'][T]['Row']

// Convenience type aliases
export type Bid = Tables<'bids'>
export type BidScore = Tables<'bid_scores'>
export type BidKeyword = Tables<'bid_keywords'>
export type BidSource = Tables<'bid_sources'>
export type BidActivity = Tables<'bid_activities'>
export type Lead = Tables<'leads'>
export type LeadActivity = Tables<'lead_activities'>
export type LeadSequence = Tables<'lead_sequences'>
export type Email = Tables<'emails'>
export type Approval = Tables<'approvals'>
export type ABTest = Tables<'ab_tests'>
export type PerformanceMetric = Tables<'performance_metrics'>
export type SystemLog = Tables<'system_logs'>
export type BidStats = Views<'bid_stats'>
export type LeadStats = Views<'lead_stats'>

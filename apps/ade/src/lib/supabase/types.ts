/**
 * Supabase Database Types
 *
 * 이 파일은 Supabase CLI로 자동 생성하거나 수동으로 정의합니다.
 * npx supabase gen types typescript --project-id <project-id> > types.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      business_profiles: {
        Row: {
          id: string;
          user_id: string;
          business_number: string | null;
          name: string;
          representative_name: string | null;
          email: string;
          phone: string | null;
          address: string | null;
          business_type: string | null;
          business_category: string | null;
          bank_name: string | null;
          account_number: string | null;
          account_holder: string | null;
          quote_prefix: string;
          contract_prefix: string;
          invoice_prefix: string;
          default_valid_days: number;
          default_payment_days: number;
          default_tax_rate: number;
          logo_url: string | null;
          primary_color: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          business_number?: string | null;
          name: string;
          representative_name?: string | null;
          email: string;
          phone?: string | null;
          address?: string | null;
          business_type?: string | null;
          business_category?: string | null;
          bank_name?: string | null;
          account_number?: string | null;
          account_holder?: string | null;
          quote_prefix?: string;
          contract_prefix?: string;
          invoice_prefix?: string;
          default_valid_days?: number;
          default_payment_days?: number;
          default_tax_rate?: number;
          logo_url?: string | null;
          primary_color?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          business_number?: string | null;
          name?: string;
          representative_name?: string | null;
          email?: string;
          phone?: string | null;
          address?: string | null;
          business_type?: string | null;
          business_category?: string | null;
          bank_name?: string | null;
          account_number?: string | null;
          account_holder?: string | null;
          quote_prefix?: string;
          contract_prefix?: string;
          invoice_prefix?: string;
          default_valid_days?: number;
          default_payment_days?: number;
          default_tax_rate?: number;
          logo_url?: string | null;
          primary_color?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      clients: {
        Row: {
          id: string;
          user_id: string;
          type: 'individual' | 'business';
          name: string;
          business_number: string | null;
          representative_name: string | null;
          email: string;
          phone: string | null;
          address: string | null;
          business_type: string | null;
          business_category: string | null;
          notes: string | null;
          tags: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: 'individual' | 'business';
          name: string;
          business_number?: string | null;
          representative_name?: string | null;
          email: string;
          phone?: string | null;
          address?: string | null;
          business_type?: string | null;
          business_category?: string | null;
          notes?: string | null;
          tags?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: 'individual' | 'business';
          name?: string;
          business_number?: string | null;
          representative_name?: string | null;
          email?: string;
          phone?: string | null;
          address?: string | null;
          business_type?: string | null;
          business_category?: string | null;
          notes?: string | null;
          tags?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      quotes: {
        Row: {
          id: string;
          user_id: string;
          client_id: string;
          document_number: string;
          status: string;
          title: string;
          items: Json;
          subtotal: number;
          tax_amount: number;
          total_amount: number;
          valid_until: string;
          payment_terms: string | null;
          delivery_terms: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
          sent_at: string | null;
          viewed_at: string | null;
          approved_at: string | null;
          linked_contract_id: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          client_id: string;
          document_number: string;
          status?: string;
          title: string;
          items?: Json;
          subtotal: number;
          tax_amount: number;
          total_amount: number;
          valid_until: string;
          payment_terms?: string | null;
          delivery_terms?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          sent_at?: string | null;
          viewed_at?: string | null;
          approved_at?: string | null;
          linked_contract_id?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          client_id?: string;
          document_number?: string;
          status?: string;
          title?: string;
          items?: Json;
          subtotal?: number;
          tax_amount?: number;
          total_amount?: number;
          valid_until?: string;
          payment_terms?: string | null;
          delivery_terms?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          sent_at?: string | null;
          viewed_at?: string | null;
          approved_at?: string | null;
          linked_contract_id?: string | null;
        };
      };
      contracts: {
        Row: {
          id: string;
          user_id: string;
          client_id: string;
          quote_id: string | null;
          document_number: string;
          status: string;
          title: string;
          project_name: string;
          project_description: string | null;
          items: Json;
          subtotal: number;
          tax_amount: number;
          total_amount: number;
          start_date: string;
          end_date: string;
          payment_schedule: Json;
          clauses: Json;
          provider_signature: Json | null;
          client_signature: Json | null;
          created_at: string;
          updated_at: string;
          signed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          client_id: string;
          quote_id?: string | null;
          document_number: string;
          status?: string;
          title: string;
          project_name: string;
          project_description?: string | null;
          items?: Json;
          subtotal: number;
          tax_amount: number;
          total_amount: number;
          start_date: string;
          end_date: string;
          payment_schedule?: Json;
          clauses?: Json;
          provider_signature?: Json | null;
          client_signature?: Json | null;
          created_at?: string;
          updated_at?: string;
          signed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          client_id?: string;
          quote_id?: string | null;
          document_number?: string;
          status?: string;
          title?: string;
          project_name?: string;
          project_description?: string | null;
          items?: Json;
          subtotal?: number;
          tax_amount?: number;
          total_amount?: number;
          start_date?: string;
          end_date?: string;
          payment_schedule?: Json;
          clauses?: Json;
          provider_signature?: Json | null;
          client_signature?: Json | null;
          created_at?: string;
          updated_at?: string;
          signed_at?: string | null;
        };
      };
      invoices: {
        Row: {
          id: string;
          user_id: string;
          client_id: string;
          quote_id: string | null;
          contract_id: string | null;
          payment_schedule_id: string | null;
          document_number: string;
          status: string;
          title: string;
          items: Json;
          subtotal: number;
          tax_amount: number;
          total_amount: number;
          due_date: string;
          payment_status: string;
          payment_method: string | null;
          paid_amount: number;
          paid_at: string | null;
          payment_info: Json;
          notes: string | null;
          created_at: string;
          updated_at: string;
          sent_at: string | null;
          linked_tax_invoice_id: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          client_id: string;
          quote_id?: string | null;
          contract_id?: string | null;
          payment_schedule_id?: string | null;
          document_number: string;
          status?: string;
          title: string;
          items?: Json;
          subtotal: number;
          tax_amount: number;
          total_amount: number;
          due_date: string;
          payment_status?: string;
          payment_method?: string | null;
          paid_amount?: number;
          paid_at?: string | null;
          payment_info: Json;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          sent_at?: string | null;
          linked_tax_invoice_id?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          client_id?: string;
          quote_id?: string | null;
          contract_id?: string | null;
          payment_schedule_id?: string | null;
          document_number?: string;
          status?: string;
          title?: string;
          items?: Json;
          subtotal?: number;
          tax_amount?: number;
          total_amount?: number;
          due_date?: string;
          payment_status?: string;
          payment_method?: string | null;
          paid_amount?: number;
          paid_at?: string | null;
          payment_info?: Json;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          sent_at?: string | null;
          linked_tax_invoice_id?: string | null;
        };
      };
      tax_invoices: {
        Row: {
          id: string;
          user_id: string;
          client_id: string;
          invoice_id: string | null;
          document_number: string;
          status: string;
          provider_info: Json;
          items: Json;
          subtotal: number;
          tax_amount: number;
          total_amount: number;
          issue_date: string;
          issue_type: string;
          nts_submitted_at: string | null;
          nts_approval_number: string | null;
          nts_status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          client_id: string;
          invoice_id?: string | null;
          document_number: string;
          status?: string;
          provider_info: Json;
          items?: Json;
          subtotal: number;
          tax_amount: number;
          total_amount: number;
          issue_date: string;
          issue_type?: string;
          nts_submitted_at?: string | null;
          nts_approval_number?: string | null;
          nts_status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          client_id?: string;
          invoice_id?: string | null;
          document_number?: string;
          status?: string;
          provider_info?: Json;
          items?: Json;
          subtotal?: number;
          tax_amount?: number;
          total_amount?: number;
          issue_date?: string;
          issue_type?: string;
          nts_submitted_at?: string | null;
          nts_approval_number?: string | null;
          nts_status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      frequent_items: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          default_quantity: number;
          default_unit_price: number;
          unit: string;
          category: string | null;
          usage_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          default_quantity?: number;
          default_unit_price: number;
          unit?: string;
          category?: string | null;
          usage_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          default_quantity?: number;
          default_unit_price?: number;
          unit?: string;
          category?: string | null;
          usage_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      document_events: {
        Row: {
          id: string;
          user_id: string;
          document_type: string;
          document_id: string;
          event_type: string;
          description: string | null;
          metadata: Json | null;
          occurred_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          document_type: string;
          document_id: string;
          event_type: string;
          description?: string | null;
          metadata?: Json | null;
          occurred_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          document_type?: string;
          document_id?: string;
          event_type?: string;
          description?: string | null;
          metadata?: Json | null;
          occurred_at?: string;
        };
      };
      public_tokens: {
        Row: {
          id: string;
          user_id: string;
          document_type: string;
          document_id: string;
          token: string;
          expires_at: string | null;
          viewed_at: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          document_type: string;
          document_id: string;
          token: string;
          expires_at?: string | null;
          viewed_at?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          document_type?: string;
          document_id?: string;
          token?: string;
          expires_at?: string | null;
          viewed_at?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      generate_document_number: {
        Args: {
          p_user_id: string;
          p_prefix: string;
          p_table_name: string;
          p_year?: number;
        };
        Returns: string;
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

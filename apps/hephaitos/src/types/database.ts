/**
 * Supabase Database Types
 * Generated types for type-safe database access
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      // 사용자 프로필 (extends auth.users)
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: 'user' | 'mentor' | 'admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'user' | 'mentor' | 'admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'user' | 'mentor' | 'admin'
          created_at?: string
          updated_at?: string
        }
      }

      // 크레딧 잔액
      credits: {
        Row: {
          id: string
          user_id: string
          balance: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          balance?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          balance?: number
          created_at?: string
          updated_at?: string
        }
      }

      // 크레딧 거래 내역
      credit_transactions: {
        Row: {
          id: string
          user_id: string
          amount: number
          type: 'purchase' | 'usage' | 'bonus' | 'refund'
          description: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          type: 'purchase' | 'usage' | 'bonus' | 'refund'
          description?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          type?: 'purchase' | 'usage' | 'bonus' | 'refund'
          description?: string | null
          metadata?: Json | null
          created_at?: string
        }
      }

      // 결제 내역
      payments: {
        Row: {
          id: string
          user_id: string
          amount: number
          credits: number
          payment_key: string
          order_id: string
          status: 'pending' | 'completed' | 'failed' | 'refunded'
          provider: 'toss'
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          credits: number
          payment_key: string
          order_id: string
          status?: 'pending' | 'completed' | 'failed' | 'refunded'
          provider?: 'toss'
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          credits?: number
          payment_key?: string
          order_id?: string
          status?: 'pending' | 'completed' | 'failed' | 'refunded'
          provider?: 'toss'
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }

      // 전략 저장
      saved_strategies: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          strategy_data: Json
          is_public: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          strategy_data: Json
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          strategy_data?: Json
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
      }

      // 백테스트 결과 저장
      backtest_results: {
        Row: {
          id: string
          user_id: string
          strategy_id: string
          result_data: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          strategy_id: string
          result_data: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          strategy_id?: string
          result_data?: Json
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

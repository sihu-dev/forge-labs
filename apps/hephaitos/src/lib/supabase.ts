/**
 * HEPHAITOS - Supabase Client
 * L2 (Cells) - Supabase 클라이언트 설정
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Database 타입 (Supabase 스키마)
 * TODO: supabase gen types 명령으로 자동 생성
 */
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          avatar_url: string | null;
          role: 'visitor' | 'free' | 'enrolled' | 'builder' | 'mentor';
          mentor_id: string | null;
          credits: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      strategies: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          config: Record<string, unknown>;
          status: 'draft' | 'active' | 'archived';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['strategies']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['strategies']['Insert']>;
      };
      backtest_results: {
        Row: {
          id: string;
          strategy_id: string;
          user_id: string;
          config: Record<string, unknown>;
          metrics: Record<string, unknown>;
          status: 'pending' | 'running' | 'completed' | 'failed';
          created_at: string;
          completed_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['backtest_results']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['backtest_results']['Insert']>;
      };
      credit_transactions: {
        Row: {
          id: string;
          user_id: string;
          type: 'purchase' | 'usage' | 'bonus' | 'refund';
          amount: number;
          description: string;
          balance: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['credit_transactions']['Row'], 'id' | 'created_at'>;
        Update: never;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}

/**
 * 브라우저용 Supabase 클라이언트 (싱글톤)
 */
let browserClient: SupabaseClient<Database> | null = null;

export function createBrowserClient(): SupabaseClient<Database> {
  if (browserClient) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Supabase 환경변수가 설정되지 않았습니다');
  }

  browserClient = createClient<Database>(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return browserClient;
}

/**
 * 서버용 Supabase 클라이언트 (매번 새로 생성)
 */
export function createServerClient(): SupabaseClient<Database> {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Supabase 환경변수가 설정되지 않았습니다');
  }

  return createClient<Database>(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * 관리자용 Supabase 클라이언트 (Service Role)
 * RLS 우회 - 주의해서 사용
 */
export function createAdminClient(): SupabaseClient<Database> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Supabase 관리자 환경변수가 설정되지 않았습니다');
  }

  return createClient<Database>(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export default createBrowserClient;

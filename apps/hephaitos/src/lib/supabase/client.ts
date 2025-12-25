/**
 * Supabase Client (Browser)
 * 클라이언트 사이드에서 사용하는 Supabase 클라이언트
 */

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

// 싱글톤 인스턴스
let supabaseClient: ReturnType<typeof createBrowserClient<Database>> | null = null

/**
 * Supabase 설정 여부 확인
 */
export function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

/**
 * 브라우저용 Supabase 클라이언트 생성
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

/**
 * 싱글톤 Supabase 브라우저 클라이언트 반환
 * @deprecated Use createClient() instead
 */
export function getSupabaseBrowserClient() {
  if (!supabaseClient) {
    supabaseClient = createClient()
  }
  return supabaseClient
}

/**
 * Supabase Client (Browser)
 * 클라이언트 사이드에서 사용하는 Supabase 클라이언트
 */

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

// 싱글톤 인스턴스
let supabaseClient: ReturnType<typeof createBrowserClient<Database>> | null = null

/**
 * Mock 모드 여부 확인
 * NEXT_PUBLIC_USE_SUPABASE=false 면 Mock 모드
 */
export const isMockMode = process.env.NEXT_PUBLIC_USE_SUPABASE === 'false'

/**
 * Supabase 설정 여부 확인
 * Mock 모드이면 false 반환
 */
export const isSupabaseConfigured = !isMockMode && !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')
)

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

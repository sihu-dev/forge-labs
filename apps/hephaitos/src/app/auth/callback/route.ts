/**
 * OAuth Callback Handler
 * Google/Github OAuth 콜백 처리
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // 인증 성공 - 대시보드로 리다이렉트
      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  // 인증 실패 - 로그인 페이지로 리다이렉트 (에러 메시지 포함)
  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`)
}

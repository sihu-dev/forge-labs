/**
 * HEPHAITOS - Auth Callback Route
 * OAuth 콜백 처리
 */

import { createServerClient } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/dashboard';
  const origin = requestUrl.origin;

  if (code) {
    const supabase = createServerClient();

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // 오류 시 로그인 페이지로 리다이렉트
  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_error`);
}

/**
 * Onboarding Progress API
 * 온보딩 진행 상태 조회/저장
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getOnboardingProgress,
  saveOnboardingProgress,
  completeOnboarding,
  skipOnboarding,
  recordOnboardingAnalytics,
} from '@/lib/onboarding';

/**
 * GET - 온보딩 진행 상태 조회
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: '로그인이 필요합니다' },
        { status: 401 }
      );
    }

    const progress = await getOnboardingProgress(user.id);

    return NextResponse.json({
      success: true,
      progress,
    });
  } catch (error) {
    console.error('Get onboarding progress error:', error);
    return NextResponse.json(
      { success: false, message: '진행 상태 조회 실패' },
      { status: 500 }
    );
  }
}

/**
 * POST - 온보딩 진행 상태 저장
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: '로그인이 필요합니다' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, step, data } = body;

    switch (action) {
      case 'save':
        await saveOnboardingProgress(user.id, step, data);
        await recordOnboardingAnalytics(user.id, 'step_completed', { step });
        break;

      case 'complete':
        await completeOnboarding(user.id, data);
        await recordOnboardingAnalytics(user.id, 'completed', { data });
        break;

      case 'skip':
        await skipOnboarding(user.id);
        await recordOnboardingAnalytics(user.id, 'skipped');
        break;

      default:
        return NextResponse.json(
          { success: false, message: '잘못된 액션입니다' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Save onboarding progress error:', error);
    return NextResponse.json(
      { success: false, message: '진행 상태 저장 실패' },
      { status: 500 }
    );
  }
}

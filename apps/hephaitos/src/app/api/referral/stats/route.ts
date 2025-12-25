/**
 * Referral Stats API
 * 추천 통계 조회
 */

import { NextResponse } from 'next/server';
import { getReferralStats } from '@/lib/promotion';
import { createClient } from '@/lib/supabase/server';

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

    const stats = await getReferralStats(user.id);

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('Referral stats error:', error);
    return NextResponse.json(
      { success: false, message: '통계 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

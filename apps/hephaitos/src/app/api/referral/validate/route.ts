/**
 * Referral Code Validation API
 * 추천 코드 유효성 검증
 */

import { NextRequest, NextResponse } from 'next/server';
import { getReferralCodeByCode } from '@/lib/promotion';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { valid: false, message: '추천 코드를 입력해주세요' },
        { status: 400 }
      );
    }

    const referralCode = await getReferralCodeByCode(code);

    if (!referralCode) {
      return NextResponse.json(
        { valid: false, message: '유효하지 않은 추천 코드입니다' },
        { status: 200 }
      );
    }

    // 추천인 이름 조회
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, username')
      .eq('id', referralCode.userId)
      .single();

    const referrerName = profile?.display_name || profile?.username || '회원';

    return NextResponse.json({
      valid: true,
      referrerName,
      reward: referralCode.refereeReward,
    });
  } catch (error) {
    console.error('Referral validation error:', error);
    return NextResponse.json(
      { valid: false, message: '코드 확인 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

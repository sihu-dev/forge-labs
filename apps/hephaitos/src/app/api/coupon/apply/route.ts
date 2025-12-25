/**
 * Coupon Apply API
 * 쿠폰 적용 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { applyCoupon } from '@/lib/promotion';
import { createClient } from '@/lib/supabase/server';

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

    const { code, purchaseAmount } = await request.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { success: false, message: '쿠폰 코드를 입력해주세요' },
        { status: 400 }
      );
    }

    if (typeof purchaseAmount !== 'number' || purchaseAmount <= 0) {
      return NextResponse.json(
        { success: false, message: '유효한 구매 금액이 필요합니다' },
        { status: 400 }
      );
    }

    const result = await applyCoupon(code, user.id, purchaseAmount);

    if (!result.valid) {
      return NextResponse.json({
        success: false,
        message: result.errorMessage,
      });
    }

    return NextResponse.json({
      success: true,
      coupon: {
        id: result.coupon?.id,
        code: result.coupon?.code,
        name: result.coupon?.name,
        discountType: result.coupon?.discountType,
        discountValue: result.coupon?.discountValue,
      },
      discountAmount: result.discountAmount,
      finalAmount: purchaseAmount - result.discountAmount,
    });
  } catch (error) {
    console.error('Coupon apply error:', error);
    return NextResponse.json(
      { success: false, message: '쿠폰 적용 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

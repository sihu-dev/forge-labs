/**
 * Payment Checkout API
 * POST /api/payments/checkout
 * 결제 준비 (주문 ID 생성)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateOrderId } from '@/lib/payments/toss'
import { calculatePrice } from '@/lib/credits/service'

interface CheckoutRequest {
  credits: number
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      )
    }

    const body: CheckoutRequest = await request.json()

    if (!body.credits || body.credits <= 0) {
      return NextResponse.json(
        { error: '유효하지 않은 크레딧 수량입니다' },
        { status: 400 }
      )
    }

    // 가격 계산
    const amount = calculatePrice(body.credits)

    // 주문 ID 생성
    const orderId = generateOrderId(user.id)

    // 결제 레코드 생성 (pending 상태)
    const { error } = await supabase.from('payments').insert({
      user_id: user.id,
      order_id: orderId,
      amount,
      credits: body.credits,
      payment_key: '',
      status: 'pending',
      provider: 'toss',
    })

    if (error) throw error

    return NextResponse.json({
      success: true,
      orderId,
      amount,
      credits: body.credits,
      clientKey: process.env.TOSS_CLIENT_KEY || '',
    })
  } catch (error) {
    console.error('Payment checkout failed:', error)
    return NextResponse.json(
      { error: '결제 준비 실패' },
      { status: 500 }
    )
  }
}

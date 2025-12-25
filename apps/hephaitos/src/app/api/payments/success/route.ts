/**
 * Payment Success API
 * GET /api/payments/success
 * 결제 성공 후 콜백 처리
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { approvePayment, processSuccessfulPayment } from '@/lib/payments/toss'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    const searchParams = request.nextUrl.searchParams
    const paymentKey = searchParams.get('paymentKey')
    const orderId = searchParams.get('orderId')
    const amount = searchParams.get('amount')

    if (!paymentKey || !orderId || !amount) {
      return NextResponse.redirect(
        new URL('/dashboard?payment=error', request.url)
      )
    }

    // 결제 승인 요청
    await approvePayment({
      paymentKey,
      orderId,
      amount: parseInt(amount, 10),
    })

    // 결제 정보 조회
    const { data: payment } = await supabase
      .from('payments')
      .select('credits')
      .eq('order_id', orderId)
      .single()

    if (!payment) {
      throw new Error('결제 정보를 찾을 수 없습니다')
    }

    // 결제 성공 처리 및 크레딧 지급
    await processSuccessfulPayment(
      user.id,
      paymentKey,
      orderId,
      parseInt(amount, 10),
      payment.credits
    )

    // 성공 페이지로 리다이렉트
    return NextResponse.redirect(
      new URL('/dashboard?payment=success&credits=' + payment.credits, request.url)
    )
  } catch (error) {
    console.error('Payment success processing failed:', error)
    return NextResponse.redirect(
      new URL('/dashboard?payment=error', request.url)
    )
  }
}

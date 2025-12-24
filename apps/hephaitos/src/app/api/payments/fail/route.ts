/**
 * Payment Fail API
 * GET /api/payments/fail
 * 결제 실패 처리
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { processFailedPayment } from '@/lib/payments/toss'

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
    const orderId = searchParams.get('orderId')
    const code = searchParams.get('code') || 'UNKNOWN_ERROR'
    const message = searchParams.get('message') || '결제 실패'

    if (orderId) {
      await processFailedPayment(user.id, orderId, code, message)
    }

    return NextResponse.redirect(
      new URL('/dashboard?payment=failed&message=' + encodeURIComponent(message), request.url)
    )
  } catch (error) {
    console.error('Payment fail processing failed:', error)
    return NextResponse.redirect(
      new URL('/dashboard?payment=error', request.url)
    )
  }
}

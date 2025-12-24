/**
 * Credit History API
 * GET /api/credits/history
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTransactionHistory } from '@/lib/credits/service'

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    const transactions = await getTransactionHistory(user.id, limit)

    return NextResponse.json({
      success: true,
      transactions,
    })
  } catch (error) {
    console.error('Failed to get transaction history:', error)
    return NextResponse.json(
      { error: '거래 내역 조회 실패' },
      { status: 500 }
    )
  }
}

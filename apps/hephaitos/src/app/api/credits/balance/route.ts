/**
 * Credit Balance API
 * GET /api/credits/balance
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCreditBalance } from '@/lib/credits/service'

export async function GET() {
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

    const balance = await getCreditBalance(user.id)

    return NextResponse.json({
      success: true,
      balance,
    })
  } catch (error) {
    console.error('Failed to get credit balance:', error)
    return NextResponse.json(
      { error: '크레딧 잔액 조회 실패' },
      { status: 500 }
    )
  }
}

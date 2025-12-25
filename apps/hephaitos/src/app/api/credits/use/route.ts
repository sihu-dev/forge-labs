/**
 * Credit Usage API
 * POST /api/credits/use
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { useCredits } from '@/lib/credits/service'

interface UseCreditsRequest {
  amount: number
  description: string
  metadata?: Record<string, any>
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

    const body: UseCreditsRequest = await request.json()

    if (!body.amount || body.amount <= 0) {
      return NextResponse.json(
        { error: '유효하지 않은 크레딧 수량입니다' },
        { status: 400 }
      )
    }

    const result = await useCredits(
      user.id,
      body.amount,
      body.description,
      body.metadata
    )

    return NextResponse.json({
      success: true,
      newBalance: result.newBalance,
    })
  } catch (error: any) {
    console.error('Failed to use credits:', error)
    
    if (error.message === '크레딧이 부족합니다') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: '크레딧 사용 실패' },
      { status: 500 }
    )
  }
}

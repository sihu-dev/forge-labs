/**
 * Triggers API
 * GET /api/triggers - 트리거 목록 조회
 * POST /api/triggers - 트리거 생성
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTriggerService, type CreateTriggerInput } from '@/lib/triggers'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다' },
        { status: 401 }
      )
    }

    const service = getTriggerService()
    const triggers = await service.listTriggers({ userId: user.id })

    return NextResponse.json({
      success: true,
      data: triggers,
    })
  } catch (error) {
    console.error('[API] GET /api/triggers error:', error)
    return NextResponse.json(
      { success: false, error: '트리거 목록 조회 실패' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // 입력 검증
    if (!body.name || !body.conditions || !body.actions) {
      return NextResponse.json(
        { success: false, error: '필수 필드가 누락되었습니다 (name, conditions, actions)' },
        { status: 400 }
      )
    }

    if (!Array.isArray(body.conditions) || body.conditions.length === 0) {
      return NextResponse.json(
        { success: false, error: '최소 하나의 조건이 필요합니다' },
        { status: 400 }
      )
    }

    if (!Array.isArray(body.actions) || body.actions.length === 0) {
      return NextResponse.json(
        { success: false, error: '최소 하나의 액션이 필요합니다' },
        { status: 400 }
      )
    }

    const input: CreateTriggerInput = {
      name: body.name,
      userId: user.id,
      conditions: body.conditions,
      actions: body.actions,
      cooldown: body.cooldown,
      maxExecutions: body.maxExecutions,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
      metadata: body.metadata,
    }

    const service = getTriggerService()
    const trigger = await service.createTrigger(input)

    return NextResponse.json({
      success: true,
      data: trigger,
    })
  } catch (error) {
    console.error('[API] POST /api/triggers error:', error)
    return NextResponse.json(
      { success: false, error: '트리거 생성 실패' },
      { status: 500 }
    )
  }
}

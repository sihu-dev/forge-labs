/**
 * Trigger Detail API
 * GET /api/triggers/[id] - 트리거 상세 조회
 * PATCH /api/triggers/[id] - 트리거 수정
 * DELETE /api/triggers/[id] - 트리거 삭제
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTriggerService, type UpdateTriggerInput } from '@/lib/triggers'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다' },
        { status: 401 }
      )
    }

    const service = getTriggerService()
    const trigger = await service.getTrigger(id)

    if (!trigger) {
      return NextResponse.json(
        { success: false, error: '트리거를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 소유권 확인
    if (trigger.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: '접근 권한이 없습니다' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      data: trigger,
    })
  } catch (error) {
    console.error('[API] GET /api/triggers/[id] error:', error)
    return NextResponse.json(
      { success: false, error: '트리거 조회 실패' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다' },
        { status: 401 }
      )
    }

    const service = getTriggerService()
    const existingTrigger = await service.getTrigger(id)

    if (!existingTrigger) {
      return NextResponse.json(
        { success: false, error: '트리거를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 소유권 확인
    if (existingTrigger.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: '접근 권한이 없습니다' },
        { status: 403 }
      )
    }

    const body = await request.json()

    const updates: UpdateTriggerInput = {}
    if (body.name !== undefined) updates.name = body.name
    if (body.status !== undefined) updates.status = body.status
    if (body.conditions !== undefined) updates.conditions = body.conditions
    if (body.actions !== undefined) updates.actions = body.actions
    if (body.cooldown !== undefined) updates.cooldown = body.cooldown
    if (body.maxExecutions !== undefined) updates.maxExecutions = body.maxExecutions
    if (body.expiresAt !== undefined) updates.expiresAt = body.expiresAt ? new Date(body.expiresAt) : undefined
    if (body.metadata !== undefined) updates.metadata = body.metadata

    const trigger = await service.updateTrigger(id, updates)

    return NextResponse.json({
      success: true,
      data: trigger,
    })
  } catch (error) {
    console.error('[API] PATCH /api/triggers/[id] error:', error)
    return NextResponse.json(
      { success: false, error: '트리거 수정 실패' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다' },
        { status: 401 }
      )
    }

    const service = getTriggerService()
    const existingTrigger = await service.getTrigger(id)

    if (!existingTrigger) {
      return NextResponse.json(
        { success: false, error: '트리거를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 소유권 확인
    if (existingTrigger.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: '접근 권한이 없습니다' },
        { status: 403 }
      )
    }

    await service.deleteTrigger(id)

    return NextResponse.json({
      success: true,
      message: '트리거가 삭제되었습니다',
    })
  } catch (error) {
    console.error('[API] DELETE /api/triggers/[id] error:', error)
    return NextResponse.json(
      { success: false, error: '트리거 삭제 실패' },
      { status: 500 }
    )
  }
}

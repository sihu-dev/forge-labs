/**
 * Trigger Pause API
 * POST /api/triggers/[id]/pause - 트리거 일시정지
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTriggerService } from '@/lib/triggers'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
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

    if (existingTrigger.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: '접근 권한이 없습니다' },
        { status: 403 }
      )
    }

    const trigger = await service.pauseTrigger(id)

    return NextResponse.json({
      success: true,
      data: trigger,
      message: '트리거가 일시정지되었습니다',
    })
  } catch (error) {
    console.error('[API] POST /api/triggers/[id]/pause error:', error)
    return NextResponse.json(
      { success: false, error: '트리거 일시정지 실패' },
      { status: 500 }
    )
  }
}

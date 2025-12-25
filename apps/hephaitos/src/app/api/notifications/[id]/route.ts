/**
 * Single Notification API
 * PATCH /api/notifications/[id] - 읽음 처리
 * DELETE /api/notifications/[id] - 삭제
 *
 * QRY-025: Real-time WebSocket Notifications
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * PATCH - 알림 읽음 처리
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다' },
        { status: 401 }
      )
    }

    const { data: notification, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Failed to update notification:', error)
      return NextResponse.json(
        { success: false, error: '알림 업데이트 실패' },
        { status: 500 }
      )
    }

    if (!notification) {
      return NextResponse.json(
        { success: false, error: '알림을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: notification,
    })
  } catch (error) {
    console.error('Notification PATCH error:', error)
    return NextResponse.json(
      { success: false, error: '알림 업데이트 중 오류 발생' },
      { status: 500 }
    )
  }
}

/**
 * DELETE - 알림 삭제
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다' },
        { status: 401 }
      )
    }

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Failed to delete notification:', error)
      return NextResponse.json(
        { success: false, error: '알림 삭제 실패' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '알림이 삭제되었습니다',
    })
  } catch (error) {
    console.error('Notification DELETE error:', error)
    return NextResponse.json(
      { success: false, error: '알림 삭제 중 오류 발생' },
      { status: 500 }
    )
  }
}

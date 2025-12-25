/**
 * Read All Notifications API
 * POST /api/notifications/read-all - 모든 알림 읽음 처리
 *
 * QRY-025: Real-time WebSocket Notifications
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST - 모든 알림 읽음 처리
 */
export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다' },
        { status: 401 }
      )
    }

    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false)
      .select()

    if (error) {
      console.error('Failed to mark all notifications as read:', error)
      return NextResponse.json(
        { success: false, error: '알림 읽음 처리 실패' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        updatedCount: data?.length || 0,
      },
      message: '모든 알림을 읽음 처리했습니다',
    })
  } catch (error) {
    console.error('Read all notifications error:', error)
    return NextResponse.json(
      { success: false, error: '알림 읽음 처리 중 오류 발생' },
      { status: 500 }
    )
  }
}

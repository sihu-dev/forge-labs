/**
 * Notifications API
 * GET /api/notifications - 알림 목록 조회
 * POST /api/notifications - 알림 생성 (시스템/테스트용)
 *
 * QRY-025: Real-time WebSocket Notifications
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { NotificationType, NotificationPriority } from '@/lib/notifications/types'

/**
 * GET - 알림 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다' },
        { status: 401 }
      )
    }

    // Query params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    const unreadOnly = searchParams.get('unread') === 'true'
    const type = searchParams.get('type') as NotificationType | null

    // Build query
    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (unreadOnly) {
      query = query.eq('read', false)
    }

    if (type) {
      query = query.eq('type', type)
    }

    const { data: notifications, error, count } = await query

    if (error) {
      console.error('Failed to fetch notifications:', error)
      return NextResponse.json(
        { success: false, error: '알림 조회 실패' },
        { status: 500 }
      )
    }

    // Get unread count
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false)

    return NextResponse.json({
      success: true,
      data: {
        notifications: notifications || [],
        total: count || 0,
        unreadCount: unreadCount || 0,
        hasMore: (offset + limit) < (count || 0),
      },
    })
  } catch (error) {
    console.error('Notifications GET error:', error)
    return NextResponse.json(
      { success: false, error: '알림 조회 중 오류 발생' },
      { status: 500 }
    )
  }
}

/**
 * POST - 알림 생성
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      type,
      priority = 'normal',
      title,
      message,
      data,
      actionUrl,
      actionLabel,
      expiresAt,
      targetUserId, // 다른 사용자에게 알림 (멘토 → 멘티)
    } = body as {
      type: NotificationType
      priority?: NotificationPriority
      title: string
      message: string
      data?: Record<string, unknown>
      actionUrl?: string
      actionLabel?: string
      expiresAt?: string
      targetUserId?: string
    }

    // Validation
    if (!type || !title || !message) {
      return NextResponse.json(
        { success: false, error: 'type, title, message는 필수입니다' },
        { status: 400 }
      )
    }

    // 대상 사용자 결정
    const recipientId = targetUserId || user.id

    // 다른 사용자에게 보내는 경우 권한 확인 (멘토만 가능)
    if (targetUserId && targetUserId !== user.id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!profile || !['mentor', 'admin'].includes(profile.role)) {
        return NextResponse.json(
          { success: false, error: '다른 사용자에게 알림을 보낼 권한이 없습니다' },
          { status: 403 }
        )
      }
    }

    // Insert notification
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: recipientId,
        type,
        priority,
        title,
        message,
        data,
        action_url: actionUrl,
        action_label: actionLabel,
        expires_at: expiresAt,
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to create notification:', error)
      return NextResponse.json(
        { success: false, error: '알림 생성 실패' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: notification,
    })
  } catch (error) {
    console.error('Notifications POST error:', error)
    return NextResponse.json(
      { success: false, error: '알림 생성 중 오류 발생' },
      { status: 500 }
    )
  }
}

/**
 * DELETE - 모든 알림 삭제
 */
export async function DELETE(request: NextRequest) {
  try {
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
      .eq('user_id', user.id)

    if (error) {
      console.error('Failed to delete notifications:', error)
      return NextResponse.json(
        { success: false, error: '알림 삭제 실패' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '모든 알림이 삭제되었습니다',
    })
  } catch (error) {
    console.error('Notifications DELETE error:', error)
    return NextResponse.json(
      { success: false, error: '알림 삭제 중 오류 발생' },
      { status: 500 }
    )
  }
}

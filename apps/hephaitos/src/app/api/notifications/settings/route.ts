/**
 * Notification Settings API
 * GET /api/notifications/settings - 설정 조회
 * PATCH /api/notifications/settings - 설정 업데이트
 *
 * QRY-025: Real-time WebSocket Notifications
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const DEFAULT_SETTINGS = {
  email_enabled: true,
  push_enabled: true,
  in_app_enabled: true,
  categories: {
    price_alert: true,
    trade_executed: true,
    strategy_signal: true,
    celebrity_trade: true,
    portfolio_update: true,
    system: true,
    achievement: true,
    coaching: true,
  },
  quiet_hours_enabled: false,
  quiet_hours_start: '22:00',
  quiet_hours_end: '08:00',
}

/**
 * GET - 알림 설정 조회
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다' },
        { status: 401 }
      )
    }

    const { data: settings, error } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = No rows found
      console.error('Failed to fetch notification settings:', error)
      return NextResponse.json(
        { success: false, error: '설정 조회 실패' },
        { status: 500 }
      )
    }

    // 설정이 없으면 기본값 생성
    if (!settings) {
      const { data: newSettings, error: insertError } = await supabase
        .from('notification_settings')
        .insert({ user_id: user.id, ...DEFAULT_SETTINGS })
        .select()
        .single()

      if (insertError) {
        console.error('Failed to create default settings:', insertError)
        return NextResponse.json({
          success: true,
          data: { user_id: user.id, ...DEFAULT_SETTINGS },
        })
      }

      return NextResponse.json({
        success: true,
        data: newSettings,
      })
    }

    return NextResponse.json({
      success: true,
      data: settings,
    })
  } catch (error) {
    console.error('Notification settings GET error:', error)
    return NextResponse.json(
      { success: false, error: '설정 조회 중 오류 발생' },
      { status: 500 }
    )
  }
}

/**
 * PATCH - 알림 설정 업데이트
 */
export async function PATCH(request: NextRequest) {
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
      email_enabled,
      push_enabled,
      in_app_enabled,
      categories,
      quiet_hours_enabled,
      quiet_hours_start,
      quiet_hours_end,
    } = body

    // Build update object
    const updateData: Record<string, unknown> = {}

    if (typeof email_enabled === 'boolean') updateData.email_enabled = email_enabled
    if (typeof push_enabled === 'boolean') updateData.push_enabled = push_enabled
    if (typeof in_app_enabled === 'boolean') updateData.in_app_enabled = in_app_enabled
    if (categories) updateData.categories = categories
    if (typeof quiet_hours_enabled === 'boolean') updateData.quiet_hours_enabled = quiet_hours_enabled
    if (quiet_hours_start) updateData.quiet_hours_start = quiet_hours_start
    if (quiet_hours_end) updateData.quiet_hours_end = quiet_hours_end

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: '업데이트할 항목이 없습니다' },
        { status: 400 }
      )
    }

    // Upsert settings
    const { data: settings, error } = await supabase
      .from('notification_settings')
      .upsert({
        user_id: user.id,
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to update notification settings:', error)
      return NextResponse.json(
        { success: false, error: '설정 업데이트 실패' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: settings,
    })
  } catch (error) {
    console.error('Notification settings PATCH error:', error)
    return NextResponse.json(
      { success: false, error: '설정 업데이트 중 오류 발생' },
      { status: 500 }
    )
  }
}

/**
 * User Profile API
 * PATCH /api/user/profile
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { full_name, avatar_url } = body

    // Update profile
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name,
        avatar_url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (error) {
      console.error('Profile update error:', error)
      return NextResponse.json(
        { success: false, error: '프로필 업데이트 실패' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '프로필이 업데이트되었습니다',
    })
  } catch (error) {
    console.error('Profile API error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류' },
      { status: 500 }
    )
  }
}

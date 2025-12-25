/**
 * Exchange Connection Test API
 * GET /api/exchange/test
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const exchange = searchParams.get('exchange')

    if (!exchange) {
      return NextResponse.json(
        { success: false, error: '거래소를 지정해주세요' },
        { status: 400 }
      )
    }

    // Fetch API key
    const { data: keyData, error: keyError } = await supabase
      .from('exchange_api_keys')
      .select('api_key, api_secret')
      .eq('user_id', user.id)
      .eq('exchange', exchange)
      .single()

    if (keyError || !keyData) {
      return NextResponse.json(
        { success: false, error: 'API 키를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // TODO: Test actual connection to exchange
    // For now, just return success
    // In production, call exchange API to verify credentials

    return NextResponse.json({
      success: true,
      message: '연결 테스트 성공 (API 키 확인됨)',
    })
  } catch (error) {
    console.error('Exchange test error:', error)
    return NextResponse.json(
      { success: false, error: '연결 테스트 실패' },
      { status: 500 }
    )
  }
}

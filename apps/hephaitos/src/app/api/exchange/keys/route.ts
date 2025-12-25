/**
 * Exchange API Keys Management
 * GET/POST/DELETE /api/exchange/keys
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Retrieve exchange key status
export async function GET() {
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

    // Check which exchanges have keys
    const { data: binanceKey } = await supabase
      .from('exchange_api_keys')
      .select('id')
      .eq('user_id', user.id)
      .eq('exchange', 'binance')
      .single()

    const { data: upbitKey } = await supabase
      .from('exchange_api_keys')
      .select('id')
      .eq('user_id', user.id)
      .eq('exchange', 'upbit')
      .single()

    return NextResponse.json({
      success: true,
      keys: {
        binance: { exists: !!binanceKey },
        upbit: { exists: !!upbitKey },
      },
    })
  } catch (error) {
    console.error('Exchange keys GET error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류' },
      { status: 500 }
    )
  }
}

// POST - Save exchange API key
export async function POST(request: NextRequest) {
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
    const { exchange, apiKey, apiSecret } = body

    if (!exchange || !apiKey || !apiSecret) {
      return NextResponse.json(
        { success: false, error: '모든 필드를 입력해주세요' },
        { status: 400 }
      )
    }

    // Upsert the API key (encrypted in database)
    const { error } = await supabase.from('exchange_api_keys').upsert(
      {
        user_id: user.id,
        exchange,
        api_key: apiKey,
        api_secret: apiSecret,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id,exchange',
      }
    )

    if (error) {
      console.error('Exchange key save error:', error)
      return NextResponse.json(
        { success: false, error: 'API 키 저장 실패' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'API 키가 저장되었습니다',
    })
  } catch (error) {
    console.error('Exchange keys POST error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류' },
      { status: 500 }
    )
  }
}

// DELETE - Remove exchange API key
export async function DELETE(request: NextRequest) {
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

    const { error } = await supabase
      .from('exchange_api_keys')
      .delete()
      .eq('user_id', user.id)
      .eq('exchange', exchange)

    if (error) {
      console.error('Exchange key delete error:', error)
      return NextResponse.json(
        { success: false, error: 'API 키 삭제 실패' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'API 키가 삭제되었습니다',
    })
  } catch (error) {
    console.error('Exchange keys DELETE error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류' },
      { status: 500 }
    )
  }
}

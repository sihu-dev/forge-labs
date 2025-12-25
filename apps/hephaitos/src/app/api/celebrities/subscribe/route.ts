/**
 * Celebrity Mirror Subscription API
 * QRY-016: 셀럽 미러링 구독 관리
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { autoMirrorService } from '@/lib/mirroring'

export const dynamic = 'force-dynamic'

/**
 * GET /api/celebrities/subscribe
 * Get user's mirror subscriptions
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다' },
        { status: 401 }
      )
    }

    const subscriptions = await autoMirrorService.getSubscriptions(user.id)
    const stats = await autoMirrorService.getStats(user.id)

    return NextResponse.json({
      success: true,
      data: {
        subscriptions,
        stats,
      },
    })
  } catch (error) {
    console.error('[API] Get subscriptions failed:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get subscriptions' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/celebrities/subscribe
 * Subscribe to celebrity trades
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      celebrityId,
      investmentAmount,
      autoExecute = false,
      minTradeValue = 100000,
      maxTradeValue = 10000000,
      excludeSymbols = [],
      notifyOnTrade = true,
      notifyMethods = ['inapp'],
    } = body

    if (!celebrityId) {
      return NextResponse.json(
        { success: false, error: 'celebrityId is required' },
        { status: 400 }
      )
    }

    const subscription = await autoMirrorService.subscribe(user.id, celebrityId, {
      investmentAmount,
      autoExecute,
      minTradeValue,
      maxTradeValue,
      excludeSymbols,
      notifyOnTrade,
      notifyMethods,
    })

    return NextResponse.json({
      success: true,
      data: subscription,
      message: '구독이 완료되었습니다',
    })
  } catch (error) {
    console.error('[API] Subscribe failed:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to subscribe' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/celebrities/subscribe
 * Unsubscribe from celebrity
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const celebrityId = searchParams.get('celebrityId')

    if (!celebrityId) {
      return NextResponse.json(
        { success: false, error: 'celebrityId is required' },
        { status: 400 }
      )
    }

    await autoMirrorService.unsubscribe(user.id, celebrityId)

    return NextResponse.json({
      success: true,
      message: '구독이 해지되었습니다',
    })
  } catch (error) {
    console.error('[API] Unsubscribe failed:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to unsubscribe' },
      { status: 500 }
    )
  }
}

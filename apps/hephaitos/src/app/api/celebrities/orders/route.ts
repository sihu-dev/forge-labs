/**
 * Celebrity Mirror Orders API
 * QRY-016: 미러링 주문 관리
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { autoMirrorService } from '@/lib/mirroring'

export const dynamic = 'force-dynamic'

/**
 * GET /api/celebrities/orders
 * Get pending mirror orders
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

    // Check for new trades first
    const newOrders = await autoMirrorService.checkForNewTrades(user.id)

    // Get all pending orders
    const pendingOrders = await autoMirrorService.getPendingOrders(user.id)

    return NextResponse.json({
      success: true,
      data: {
        newOrders: newOrders.length,
        orders: pendingOrders,
      },
    })
  } catch (error) {
    console.error('[API] Get orders failed:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get orders' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/celebrities/orders
 * Approve or reject mirror order
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
    const { orderId, action, reason } = body

    if (!orderId || !action) {
      return NextResponse.json(
        { success: false, error: 'orderId and action are required' },
        { status: 400 }
      )
    }

    if (action !== 'approve' && action !== 'reject' && action !== 'execute') {
      return NextResponse.json(
        { success: false, error: 'action must be approve, reject, or execute' },
        { status: 400 }
      )
    }

    let result

    switch (action) {
      case 'approve':
        result = await autoMirrorService.approveOrder(user.id, orderId)
        break
      case 'reject':
        await autoMirrorService.rejectOrder(user.id, orderId, reason)
        result = { status: 'rejected' }
        break
      case 'execute':
        result = await autoMirrorService.executeOrder(user.id, orderId)
        break
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: action === 'approve' ? '주문이 승인되었습니다'
        : action === 'reject' ? '주문이 거부되었습니다'
        : '주문이 실행되었습니다',
    })
  } catch (error) {
    console.error('[API] Order action failed:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to process order' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/celebrities/orders
 * Execute multiple approved orders
 */
export async function PUT(request: NextRequest) {
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
    const { orderIds } = body

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'orderIds array is required' },
        { status: 400 }
      )
    }

    const results = []
    const errors = []

    for (const orderId of orderIds) {
      try {
        const result = await autoMirrorService.executeOrder(user.id, orderId)
        results.push(result)
      } catch (error) {
        errors.push({
          orderId,
          error: error instanceof Error ? error.message : 'Execution failed',
        })
      }
    }

    return NextResponse.json({
      success: errors.length === 0,
      data: {
        executed: results.length,
        failed: errors.length,
        results,
        errors,
      },
      message: `${results.length}건 실행 완료, ${errors.length}건 실패`,
    })
  } catch (error) {
    console.error('[API] Batch execute failed:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to execute orders' },
      { status: 500 }
    )
  }
}

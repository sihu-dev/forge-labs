/**
 * 백테스트 진행 상황 조회 API
 * GET /api/backtest/status/[id]
 *
 * 실행 중인 백테스트의 진행 상황을 실시간으로 조회
 */

import { NextRequest, NextResponse } from 'next/server'
import { backtestProgressStore } from '@/lib/backtest-progress-store'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const backtestId = params.id

    if (!backtestId) {
      return NextResponse.json(
        { success: false, error: 'Backtest ID is required' },
        { status: 400 }
      )
    }

    // 진행 상황 조회
    const progress = backtestProgressStore.get(backtestId)

    if (!progress) {
      return NextResponse.json(
        {
          success: false,
          error: 'Backtest not found or expired',
          message: '백테스트를 찾을 수 없거나 만료되었습니다',
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      progress: {
        status: progress.status,
        progress: progress.progress,
        message: progress.message,
        currentStep: progress.currentStep,
        totalSteps: progress.totalSteps,
        currentStepIndex: progress.currentStepIndex,
        estimatedTimeRemaining: progress.estimatedTimeRemaining,
      },
    })
  } catch (error) {
    console.error('[Backtest Status API] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch backtest status',
        message: error instanceof Error ? error.message : '알 수 없는 에러',
      },
      { status: 500 }
    )
  }
}

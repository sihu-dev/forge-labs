/**
 * 백테스트 실행 API
 * POST /api/backtest/run
 */

import { NextRequest, NextResponse } from 'next/server'
import type { Node, Edge } from 'reactflow'
import { serializeStrategy } from '@/lib/strategy-serializer'

/**
 * 백테스트 실행 요청
 */
interface BacktestRunRequest {
  /** 전략 이름 */
  strategyName: string
  /** 전략 설명 */
  strategyDescription?: string
  /** 노드 그래프 */
  nodes: Node[]
  edges: Edge[]
  /** 백테스트 설정 */
  config: {
    /** 초기 자본 */
    initialCapital: number
    /** 시작일 */
    startDate: string
    /** 종료일 */
    endDate: string
    /** 수수료율 (%) */
    feeRate?: number
    /** 슬리피지 (%) */
    slippage?: number
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: BacktestRunRequest = await request.json()

    // 1. 사용자 인증 확인 (TODO: Supabase Auth)
    const userId = 'demo-user' // 임시 사용자 ID

    // 2. 노드 그래프를 IStrategy로 직렬화
    const serializationResult = serializeStrategy(
      body.nodes,
      body.edges,
      {
        name: body.strategyName,
        description: body.strategyDescription,
        userId,
      }
    )

    if (!serializationResult.success || !serializationResult.strategy) {
      return NextResponse.json(
        {
          success: false,
          error: '전략 변환 실패',
          details: serializationResult.errors,
        },
        { status: 400 }
      )
    }

    const strategy = serializationResult.strategy

    // 3. 백테스트 설정 생성
    const backtestConfig = {
      id: crypto.randomUUID(),
      strategyId: strategy.id,
      initialCapital: body.config.initialCapital,
      startDate: body.config.startDate,
      endDate: body.config.endDate,
      feeRate: body.config.feeRate || 0.1,
      slippage: body.config.slippage || 0.05,
    }

    // 4. 백테스트 실행 (비동기)
    // TODO: BacktestAgent 연동
    // const agent = new BacktestAgent(...)
    // const result = await agent.runBacktest(backtestConfig)

    // 임시 응답
    return NextResponse.json({
      success: true,
      message: '백테스트가 시작되었습니다',
      data: {
        strategyId: strategy.id,
        backtestId: backtestConfig.id,
        status: 'queued',
        strategy: {
          name: strategy.name,
          description: strategy.description,
          symbols: strategy.symbols,
          timeframe: strategy.timeframe,
        },
      },
    })
  } catch (error) {
    console.error('Backtest run error:', error)
    return NextResponse.json(
      {
        success: false,
        error: '백테스트 실행 실패',
        message: error instanceof Error ? error.message : '알 수 없는 에러',
      },
      { status: 500 }
    )
  }
}

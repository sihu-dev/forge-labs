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
    // TODO: BacktestAgent 실제 연동
    // 현재는 임시 데모 데이터 반환

    // 임시 백테스트 결과 생성
    const demoResult = generateDemoBacktestResult(
      strategy,
      body.config
    )

    return NextResponse.json({
      success: true,
      message: '백테스트가 완료되었습니다',
      data: {
        strategyId: strategy.id,
        backtestId: backtestConfig.id,
        status: 'completed',
        strategy: {
          name: strategy.name,
          description: strategy.description,
          symbols: strategy.symbols,
          timeframe: strategy.timeframe,
        },
        resultData: demoResult,
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

/**
 * 임시 백테스트 결과 생성 (데모용)
 */
function generateDemoBacktestResult(strategy: any, config: any) {
  const initialCapital = config.initialCapital
  const finalReturn = Math.random() * 40 - 10 // -10% ~ +30% 랜덤
  const finalCapital = initialCapital * (1 + finalReturn / 100)

  return {
    strategyName: strategy.name,
    symbol: strategy.symbols[0] || 'BTC/USDT',
    timeframe: strategy.timeframe,
    period: {
      start: config.startDate,
      end: config.endDate,
    },
    metrics: {
      totalReturn: finalReturn,
      annualizedReturn: finalReturn * 4, // 간단한 연환산
      sharpeRatio: 1.2 + Math.random() * 0.8,
      maxDrawdown: Math.random() * 15 + 5,
      volatility: Math.random() * 20 + 10,
      totalTrades: Math.floor(Math.random() * 50 + 20),
      winRate: 45 + Math.random() * 20,
      profitFactor: 1.1 + Math.random() * 0.9,
      avgWin: 100 + Math.random() * 200,
      avgLoss: -(50 + Math.random() * 100),
      initialCapital,
      finalCapital,
    },
    // 간단한 자산 곡선 (10개 포인트)
    equityCurve: Array.from({ length: 10 }, (_, i) => ({
      date: new Date(
        new Date(config.startDate).getTime() +
          (i * (new Date(config.endDate).getTime() - new Date(config.startDate).getTime())) / 10
      ).toISOString(),
      value: initialCapital + (finalCapital - initialCapital) * (i / 10) + (Math.random() - 0.5) * 1000,
    })),
    // 임시 거래 내역 (5개)
    trades: Array.from({ length: 5 }, (_, i) => ({
      date: new Date(
        new Date(config.startDate).getTime() +
          Math.random() * (new Date(config.endDate).getTime() - new Date(config.startDate).getTime())
      ).toISOString(),
      type: i % 2 === 0 ? 'buy' as const : 'sell' as const,
      price: 40000 + Math.random() * 10000,
      quantity: Math.random() * 0.1,
      profit: i % 2 === 1 ? (Math.random() - 0.3) * 500 : undefined,
    })),
  }
}

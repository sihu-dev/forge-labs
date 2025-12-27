/**
 * 백테스트 실행 API
 * POST /api/backtest/run
 *
 * 실제 BacktestAgent 연동 + 크레딧 차감 + DB 저장
 */

import { NextRequest, NextResponse } from 'next/server'
import type { Node, Edge } from 'reactflow'
import { createClient } from '@/lib/supabase/server'
import { serializeStrategy } from '@/lib/strategy-serializer'
import { getBacktestCost, useCredits } from '@/lib/credits/service'
import { BacktestAgent } from '@/agents/backtest-agent'
import { RealPriceDataService } from '@forge/core'
import { InMemoryStrategyRepository, InMemoryBacktestResultRepository } from '@forge/core'
import { backtestProgressStore } from '@/lib/backtest-progress-store'

/**
 * 백테스트 실행 요청
 * QRY-024: 백테스트 연동 강화
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
    /** 거래쌍 */
    symbol: string
    /** 타임프레임 */
    timeframe: string
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
    const supabase = await createClient()

    // 1. 사용자 인증 확인
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다' },
        { status: 401 }
      )
    }

    // 2. 노드 그래프를 IStrategy로 직렬화
    const serializationResult = serializeStrategy(body.nodes, body.edges, {
      name: body.strategyName,
      description: body.strategyDescription,
      userId: user.id,
    })

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

    // 3. 설정에서 심볼과 타임프레임 가져오기
    const symbol = body.config.symbol || strategy.symbols[0] || 'BTC/USDT'
    const timeframe = body.config.timeframe || strategy.timeframe || '1h'

    // 4. 백테스트 비용 계산
    const startDate = new Date(body.config.startDate)
    const endDate = new Date(body.config.endDate)
    const days = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    const creditCost = getBacktestCost({
      timeframe,
      days,
      symbols: 1, // 단일 심볼 백테스트
    })

    // 5. 크레딧 차감
    try {
      await useCredits(user.id, creditCost, '백테스트 실행: ' + strategy.name, {
        strategy_id: strategy.id,
        strategy_name: strategy.name,
        symbol,
        timeframe,
        days,
      })
    } catch (error: any) {
      return NextResponse.json(
        {
          success: false,
          error: error.message || '크레딧이 부족합니다',
          requiredCredits: creditCost,
        },
        { status: 400 }
      )
    }

    // 6. 백테스트 설정 생성
    const backtestConfig = {
      id: crypto.randomUUID(),
      strategyId: strategy.id,
      initialCapital: body.config.initialCapital,
      startDate: body.config.startDate,
      endDate: body.config.endDate,
      feeRate: body.config.feeRate || 0.1,
      slippage: body.config.slippage || 0.05,
      timeframe,
      symbols: [symbol],
    }

    const backtestId = backtestConfig.id

    // 7. 진행 상황 추적 초기화
    backtestProgressStore.initialize(backtestId)

    // 8. 백테스트 실행 (실제 엔진)
    const priceDataService = new RealPriceDataService()
    const strategyRepo = new InMemoryStrategyRepository()
    const resultRepo = new InMemoryBacktestResultRepository()

    // 전략 저장
    await strategyRepo.create(strategy)

    // 진행 상황 맵핑 (0-100% → 단계별)
    const progressSteps = [
      { range: [0, 10], step: 0, message: '전략 로드 중...' },
      { range: [10, 20], step: 1, message: '가격 데이터 로드 중...' },
      { range: [20, 80], step: 2, message: '시뮬레이션 실행 중...' },
      { range: [80, 90], step: 3, message: '성과 지표 계산 중...' },
      { range: [90, 100], step: 4, message: '결과 저장 중...' },
    ]

    const getStepInfo = (progress: number) => {
      const step = progressSteps.find(
        (s) => progress >= s.range[0] && progress < s.range[1]
      )
      return step || progressSteps[progressSteps.length - 1]
    }

    // 백테스트 에이전트 실행
    const agent = new BacktestAgent(
      priceDataService,
      strategyRepo,
      resultRepo,
      {
        onProgress: (progress, message) => {
          const stepInfo = getStepInfo(progress)
          backtestProgressStore.update(backtestId, {
            status: 'running',
            progress: Math.min(Math.round(progress), 100),
            message: message || stepInfo.message,
            currentStep: stepInfo.message,
            currentStepIndex: stepInfo.step,
          })
          console.log(`[Backtest ${backtestId}] ${progress}% - ${message}`)
        },
      }
    )

    const backtestResult = await agent.runBacktest(backtestConfig)

    if (!backtestResult.success || !backtestResult.data) {
      // 실패 시 진행 상황 업데이트
      backtestProgressStore.markFailed(
        backtestId,
        backtestResult.error || '알 수 없는 에러'
      )

      return NextResponse.json(
        {
          success: false,
          error: '백테스트 실행 실패',
          message: backtestResult.error || '알 수 없는 에러',
        },
        { status: 500 }
      )
    }

    const result = backtestResult.data

    // 9. 결과를 데이터베이스에 저장
    backtestProgressStore.update(backtestId, {
      progress: 95,
      message: '결과 저장 중...',
      currentStepIndex: 4,
    })
    const { error: saveError } = await supabase.from('backtest_results').insert({
      user_id: user.id,
      strategy_id: strategy.id,
      result_data: {
        strategyName: strategy.name,
        symbol,
        timeframe,
        period: {
          start: body.config.startDate,
          end: body.config.endDate,
        },
        metrics: result.metrics,
        equityCurve: result.equityCurve,
        trades: result.trades,
      },
    })

    if (saveError) {
      console.error('Failed to save backtest result:', saveError)
    }

    // 10. 완료 처리
    backtestProgressStore.markCompleted(backtestId, '백테스트가 완료되었습니다')

    // 11. 응답 반환 (backtestId 포함)
    return NextResponse.json({
      success: true,
      message: '백테스트가 완료되었습니다',
      data: {
        strategyId: strategy.id,
        backtestId: backtestConfig.id,
        status: 'completed',
        creditsUsed: creditCost,
        strategy: {
          name: strategy.name,
          description: strategy.description,
          symbols: strategy.symbols,
          timeframe: strategy.timeframe,
        },
        resultData: {
          strategyName: strategy.name,
          symbol,
          timeframe,
          period: {
            start: body.config.startDate,
            end: body.config.endDate,
          },
          metrics: result.metrics,
          equityCurve: result.equityCurve,
          trades: result.trades,
        },
      },
    })
  } catch (error) {
    console.error('Backtest run error:', error)

    // 에러 발생 시 진행 상황 업데이트 (backtestId가 있는 경우)
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 에러'

    // try-catch 내부에서 backtestId를 얻을 수 있는지 확인
    // (에러가 백테스트 설정 생성 이후에 발생한 경우에만)

    return NextResponse.json(
      {
        success: false,
        error: '백테스트 실행 실패',
        message: errorMessage,
      },
      { status: 500 }
    )
  }
}


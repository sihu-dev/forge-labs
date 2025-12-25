/**
 * Benchmark Comparison API
 * QRY-021: 벤치마크 비교 엔드포인트
 *
 * ⚠️ 면책조항: 벤치마크 비교는 참고용이며, 투자 조언이 아닙니다.
 */

import { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { withApiMiddleware, createApiResponse, ApiError } from '@/lib/api/middleware'
import { safeLogger } from '@/lib/utils/safe-logger'
import {
  performanceCalculator,
  type BenchmarkType,
} from '@/lib/analytics/performance-calculator'

export const dynamic = 'force-dynamic'

// 지원하는 벤치마크 목록
const SUPPORTED_BENCHMARKS: BenchmarkType[] = [
  'sp500',
  'nasdaq',
  'btc',
  'eth',
  'kospi',
  'kosdaq',
]

const BENCHMARK_INFO: Record<BenchmarkType, { name: string; description: string }> = {
  sp500: { name: 'S&P 500', description: '미국 대형주 500개 지수' },
  nasdaq: { name: 'NASDAQ Composite', description: '미국 기술주 중심 지수' },
  btc: { name: 'Bitcoin', description: '비트코인 (BTC/USD)' },
  eth: { name: 'Ethereum', description: '이더리움 (ETH/USD)' },
  kospi: { name: 'KOSPI', description: '한국 종합주가지수' },
  kosdaq: { name: 'KOSDAQ', description: '한국 코스닥 지수' },
}

/**
 * GET /api/analytics/benchmark
 * 벤치마크 비교 조회
 *
 * Query params:
 * - benchmark: sp500 | nasdaq | btc | eth | kospi | kosdaq
 * - startDate: (optional) YYYY-MM-DD
 * - endDate: (optional) YYYY-MM-DD
 */
export const GET = withApiMiddleware(
  async (request: NextRequest) => {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return createApiResponse(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const benchmark = searchParams.get('benchmark') as BenchmarkType | null

    // 벤치마크가 없으면 목록 반환
    if (!benchmark) {
      return createApiResponse({
        success: true,
        benchmarks: SUPPORTED_BENCHMARKS.map(b => ({
          id: b,
          ...BENCHMARK_INFO[b],
        })),
      })
    }

    // 유효한 벤치마크인지 확인
    if (!SUPPORTED_BENCHMARKS.includes(benchmark)) {
      return createApiResponse(
        { error: `Invalid benchmark. Must be one of: ${SUPPORTED_BENCHMARKS.join(', ')}` },
        { status: 400 }
      )
    }

    // 기간 설정 (기본: 1년)
    const now = new Date()
    const defaultStartDate = new Date(now)
    defaultStartDate.setFullYear(defaultStartDate.getFullYear() - 1)

    const startDate = searchParams.get('startDate') || defaultStartDate.toISOString().split('T')[0]
    const endDate = searchParams.get('endDate') || now.toISOString().split('T')[0]

    try {
      safeLogger.info('[Analytics API] Benchmark comparison', {
        userId: user.id,
        benchmark,
        startDate,
        endDate,
      })

      const comparison = await performanceCalculator.compareToBenchmark(
        user.id,
        benchmark,
        startDate,
        endDate
      )

      // 성과 해석
      const interpretation = interpretComparison(comparison)

      return createApiResponse({
        success: true,
        comparison,
        benchmarkInfo: BENCHMARK_INFO[benchmark],
        interpretation,
        disclaimer: '벤치마크 비교는 참고용 정보이며, 투자 조언이 아닙니다. ' +
          '과거 성과는 미래 수익을 보장하지 않습니다.',
      })
    } catch (error) {
      safeLogger.error('[Analytics API] Benchmark comparison failed', { error })
      throw new ApiError('벤치마크 비교에 실패했습니다', 500)
    }
  },
  {
    rateLimit: { category: 'api' },
    errorHandler: { logErrors: true },
  }
)

/**
 * POST /api/analytics/benchmark
 * 다중 벤치마크 비교
 */
export const POST = withApiMiddleware(
  async (request: NextRequest) => {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return createApiResponse(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      )
    }

    let body
    try {
      body = await request.json()
    } catch {
      return createApiResponse({ error: 'Invalid request body' }, { status: 400 })
    }

    const { benchmarks, startDate, endDate } = body

    if (!benchmarks || !Array.isArray(benchmarks) || benchmarks.length === 0) {
      return createApiResponse(
        { error: 'benchmarks array is required' },
        { status: 400 }
      )
    }

    // 유효한 벤치마크들인지 확인
    const invalidBenchmarks = benchmarks.filter(
      (b: string) => !SUPPORTED_BENCHMARKS.includes(b as BenchmarkType)
    )
    if (invalidBenchmarks.length > 0) {
      return createApiResponse(
        { error: `Invalid benchmarks: ${invalidBenchmarks.join(', ')}` },
        { status: 400 }
      )
    }

    // 기간 설정
    const now = new Date()
    const defaultStartDate = new Date(now)
    defaultStartDate.setFullYear(defaultStartDate.getFullYear() - 1)

    const start = startDate || defaultStartDate.toISOString().split('T')[0]
    const end = endDate || now.toISOString().split('T')[0]

    try {
      safeLogger.info('[Analytics API] Multi-benchmark comparison', {
        userId: user.id,
        benchmarks,
        startDate: start,
        endDate: end,
      })

      const comparisons = await Promise.all(
        benchmarks.map((b: BenchmarkType) =>
          performanceCalculator.compareToBenchmark(user.id, b, start, end)
        )
      )

      // 랭킹
      const rankings = {
        byAlpha: [...comparisons].sort((a, b) => b.alpha - a.alpha)
          .map(c => c.benchmark),
        bySharpe: [...comparisons].sort((a, b) => b.sharpeRatioPortfolio - a.sharpeRatioPortfolio)
          .map(c => c.benchmark),
        byCorrelation: [...comparisons].sort((a, b) => Math.abs(a.correlation) - Math.abs(b.correlation))
          .map(c => c.benchmark),
      }

      // 요약
      const summary = {
        outperformed: comparisons.filter(c => c.portfolioReturn > c.benchmarkReturn).length,
        underperformed: comparisons.filter(c => c.portfolioReturn < c.benchmarkReturn).length,
        avgAlpha: comparisons.reduce((sum, c) => sum + c.alpha, 0) / comparisons.length,
        avgBeta: comparisons.reduce((sum, c) => sum + c.beta, 0) / comparisons.length,
      }

      return createApiResponse({
        success: true,
        comparisons: comparisons.map(c => ({
          ...c,
          benchmarkInfo: BENCHMARK_INFO[c.benchmark],
          interpretation: interpretComparison(c),
        })),
        rankings,
        summary,
        disclaimer: '벤치마크 비교는 참고용 정보이며, 투자 조언이 아닙니다.',
      })
    } catch (error) {
      safeLogger.error('[Analytics API] Multi-benchmark comparison failed', { error })
      throw new ApiError('벤치마크 비교에 실패했습니다', 500)
    }
  },
  {
    rateLimit: { category: 'api' },
    errorHandler: { logErrors: true },
  }
)

/**
 * 비교 결과 해석
 */
function interpretComparison(comparison: {
  portfolioReturn: number
  benchmarkReturn: number
  alpha: number
  beta: number
  correlation: number
  sharpeRatioPortfolio: number
  sharpeRatioBenchmark: number
}): {
  performance: string
  risk: string
  correlation: string
  overall: string
} {
  const { portfolioReturn, benchmarkReturn, alpha, beta, sharpeRatioPortfolio, sharpeRatioBenchmark, correlation } = comparison

  // 성과 해석
  let performance: string
  if (portfolioReturn > benchmarkReturn + 5) {
    performance = '벤치마크 대비 상당히 우수한 성과를 보였습니다.'
  } else if (portfolioReturn > benchmarkReturn) {
    performance = '벤치마크를 소폭 상회하는 성과를 보였습니다.'
  } else if (portfolioReturn > benchmarkReturn - 5) {
    performance = '벤치마크와 유사한 수준의 성과를 보였습니다.'
  } else {
    performance = '벤치마크 대비 낮은 성과를 보였습니다.'
  }

  // 리스크 해석
  let risk: string
  if (beta < 0.8) {
    risk = '시장 대비 낮은 변동성을 보여 방어적인 포트폴리오입니다.'
  } else if (beta < 1.2) {
    risk = '시장과 유사한 수준의 변동성을 보입니다.'
  } else {
    risk = '시장 대비 높은 변동성을 보여 공격적인 포트폴리오입니다.'
  }

  // 상관관계 해석
  let correlationText: string
  const absCorr = Math.abs(correlation)
  if (absCorr > 0.8) {
    correlationText = '벤치마크와 높은 상관관계를 보여, 시장 흐름을 따르는 경향이 있습니다.'
  } else if (absCorr > 0.5) {
    correlationText = '벤치마크와 중간 수준의 상관관계를 보입니다.'
  } else {
    correlationText = '벤치마크와 낮은 상관관계를 보여, 독립적인 움직임을 합니다.'
  }

  // 종합 해석
  let overall: string
  if (alpha > 0 && sharpeRatioPortfolio > sharpeRatioBenchmark) {
    overall = '위험 대비 수익률이 벤치마크보다 우수합니다.'
  } else if (alpha > 0) {
    overall = '절대 수익률은 양호하나, 위험 조정 수익률을 개선할 여지가 있습니다.'
  } else {
    overall = '벤치마크 대비 초과 수익을 창출하지 못했습니다.'
  }

  return {
    performance,
    risk,
    correlation: correlationText,
    overall,
  }
}

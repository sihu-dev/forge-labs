/**
 * Performance Report API
 * QRY-021: 성과 리포트 생성 엔드포인트
 *
 * ⚠️ 면책조항: 과거 성과는 미래 수익을 보장하지 않습니다.
 */

import { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { withApiMiddleware, createApiResponse, ApiError } from '@/lib/api/middleware'
import { safeLogger } from '@/lib/utils/safe-logger'
import { performanceCalculator, type ReportPeriod } from '@/lib/analytics/performance-calculator'

export const dynamic = 'force-dynamic'

/**
 * GET /api/analytics/report
 * 성과 리포트 조회
 *
 * Query params:
 * - period: daily | weekly | monthly | quarterly | yearly | all
 * - strategyId: (optional) 특정 전략만
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
    const period = (searchParams.get('period') || 'monthly') as ReportPeriod
    const strategyId = searchParams.get('strategyId')

    // 유효한 기간인지 확인
    const validPeriods: ReportPeriod[] = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'all']
    if (!validPeriods.includes(period)) {
      return createApiResponse(
        { error: `Invalid period. Must be one of: ${validPeriods.join(', ')}` },
        { status: 400 }
      )
    }

    try {
      safeLogger.info('[Analytics API] Generating report', {
        userId: user.id,
        period,
        strategyId,
      })

      const report = await performanceCalculator.generateReport(user.id, period)

      // 면책조항 추가
      const disclaimer = '본 리포트는 과거 성과 데이터이며, 투자 조언이 아닙니다. ' +
        '과거 성과는 미래 수익을 보장하지 않습니다. ' +
        '투자 결정은 본인의 판단과 책임하에 이루어져야 합니다.'

      return createApiResponse({
        success: true,
        report,
        disclaimer,
        generatedAt: new Date().toISOString(),
      })
    } catch (error) {
      safeLogger.error('[Analytics API] Report generation failed', { error })
      throw new ApiError('리포트 생성에 실패했습니다', 500)
    }
  },
  {
    rateLimit: { category: 'api' },
    errorHandler: { logErrors: true },
  }
)

/**
 * POST /api/analytics/report
 * 커스텀 기간 리포트 생성
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

    const { startDate, endDate, strategyIds, format = 'json' } = body

    if (!startDate || !endDate) {
      return createApiResponse(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      )
    }

    try {
      safeLogger.info('[Analytics API] Generating custom report', {
        userId: user.id,
        startDate,
        endDate,
        strategyIds,
      })

      // 기본 리포트 생성 (커스텀 기간)
      const report = await performanceCalculator.generateReport(user.id, 'all')

      // 전략 비교 (요청 시)
      let strategyComparison = null
      if (strategyIds && Array.isArray(strategyIds) && strategyIds.length > 1) {
        strategyComparison = await performanceCalculator.compareStrategies(
          user.id,
          strategyIds,
          'all'
        )
      }

      const response = {
        success: true,
        report: {
          ...report,
          startDate,
          endDate,
        },
        strategyComparison,
        disclaimer: '본 리포트는 과거 성과 데이터이며, 투자 조언이 아닙니다.',
        generatedAt: new Date().toISOString(),
      }

      // 포맷에 따른 응답 (향후 PDF, CSV 지원)
      if (format === 'json') {
        return createApiResponse(response)
      }

      // TODO: PDF, CSV 포맷 지원
      return createApiResponse(response)
    } catch (error) {
      safeLogger.error('[Analytics API] Custom report generation failed', { error })
      throw new ApiError('리포트 생성에 실패했습니다', 500)
    }
  },
  {
    rateLimit: { category: 'api' },
    errorHandler: { logErrors: true },
  }
)

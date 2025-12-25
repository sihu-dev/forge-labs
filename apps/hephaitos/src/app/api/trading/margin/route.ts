/**
 * Margin Trading API
 * QRY-020: 레버리지/마진 거래 엔드포인트
 *
 * ⚠️ 경고: 레버리지 거래는 원금 이상의 손실이 발생할 수 있습니다.
 * 본 서비스는 교육 목적이며, 투자 조언이 아닙니다.
 */

import { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { withApiMiddleware, createApiResponse, ApiError } from '@/lib/api/middleware'
import { safeLogger } from '@/lib/utils/safe-logger'
import {
  leverageService,
  MAX_LEVERAGE,
  MARGIN_THRESHOLDS,
  type MarginType,
  type PositionSide,
} from '@/lib/trading/leverage-service'
import { complianceService } from '@/lib/legal'

export const dynamic = 'force-dynamic'

/**
 * GET /api/trading/margin
 * 마진 계좌 및 포지션 조회
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
    const type = searchParams.get('type') || 'account'
    const exchange = searchParams.get('exchange') || 'binance_futures'
    const symbol = searchParams.get('symbol')

    try {
      switch (type) {
        case 'account': {
          const account = await leverageService.getMarginAccount(user.id, exchange)

          if (!account) {
            return createApiResponse({
              success: true,
              account: null,
              message: '마진 계좌가 없습니다',
            })
          }

          // 마진 콜 확인
          const marginCall = await leverageService.checkMarginCall(user.id, exchange)

          return createApiResponse({
            success: true,
            account,
            marginCall,
            thresholds: MARGIN_THRESHOLDS,
          })
        }

        case 'leverage': {
          if (!symbol) {
            return createApiResponse(
              { error: 'symbol is required' },
              { status: 400 }
            )
          }

          const config = await leverageService.getLeverageConfig(user.id, symbol, exchange)

          return createApiResponse({
            success: true,
            config,
            maxLeverage: MAX_LEVERAGE[exchange] || 1,
          })
        }

        case 'calculate': {
          const entryPrice = parseFloat(searchParams.get('entryPrice') || '0')
          const size = parseFloat(searchParams.get('size') || '0')
          const leverage = parseInt(searchParams.get('leverage') || '1', 10)
          const side = (searchParams.get('side') || 'long') as PositionSide
          const currentPrice = parseFloat(searchParams.get('currentPrice') || String(entryPrice))

          if (entryPrice <= 0 || size <= 0) {
            return createApiResponse(
              { error: 'entryPrice and size are required' },
              { status: 400 }
            )
          }

          const calculation = leverageService.calculateMargin({
            entryPrice,
            size,
            leverage,
            side,
            currentPrice,
            exchange,
          })

          const riskWarning = leverageService.generateRiskWarning(leverage)

          return createApiResponse({
            success: true,
            calculation,
            riskWarning,
            disclaimer: '레버리지 거래는 원금 이상의 손실이 발생할 수 있습니다. ' +
              '투자 결정은 본인의 판단과 책임하에 이루어져야 합니다.',
          })
        }

        case 'liquidations': {
          const liquidations = await leverageService.getLiquidationHistory(user.id, 20)

          return createApiResponse({
            success: true,
            liquidations,
          })
        }

        default:
          return createApiResponse({ error: 'Unknown type' }, { status: 400 })
      }
    } catch (error) {
      safeLogger.error('[Margin API] GET error', { error, type })
      throw new ApiError('데이터 조회에 실패했습니다', 500)
    }
  },
  {
    rateLimit: { category: 'exchange' },
    errorHandler: { logErrors: true },
  }
)

/**
 * POST /api/trading/margin
 * 레버리지 설정 / 포지션 관리
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

    // 실계좌 연동 동의 확인
    const canUse = await complianceService.canUseFeature(user.id, 'real_account')
    if (!canUse.allowed) {
      return createApiResponse(
        { error: canUse.reason, requiresConsent: true },
        { status: 403 }
      )
    }

    let body
    try {
      body = await request.json()
    } catch {
      return createApiResponse({ error: 'Invalid request body' }, { status: 400 })
    }

    const { action, exchange = 'binance_futures' } = body

    try {
      switch (action) {
        case 'set_leverage': {
          const { symbol, leverage, marginType = 'cross' } = body

          if (!symbol || leverage === undefined) {
            return createApiResponse(
              { error: 'symbol and leverage are required' },
              { status: 400 }
            )
          }

          // 위험 경고 생성
          const riskWarning = leverageService.generateRiskWarning(leverage)

          // 높은 레버리지 경고
          if (leverage > 20) {
            safeLogger.warn('[Margin API] High leverage requested', {
              userId: user.id,
              symbol,
              leverage,
            })
          }

          const result = await leverageService.setLeverage(
            user.id,
            symbol,
            exchange,
            leverage,
            marginType as MarginType
          )

          if (!result.success) {
            return createApiResponse({ error: result.error }, { status: 400 })
          }

          return createApiResponse({
            success: true,
            message: `레버리지가 ${leverage}x로 설정되었습니다`,
            riskWarning,
            disclaimer: '레버리지 거래는 원금 이상의 손실이 발생할 수 있습니다.',
          })
        }

        case 'check_risk': {
          const { positionId, currentPrice } = body

          if (!positionId || !currentPrice) {
            return createApiResponse(
              { error: 'positionId and currentPrice are required' },
              { status: 400 }
            )
          }

          // 포지션 조회
          const account = await leverageService.getMarginAccount(user.id, exchange)
          const position = account?.positions.find(p => p.id === positionId)

          if (!position) {
            return createApiResponse({ error: 'Position not found' }, { status: 404 })
          }

          const simulation = leverageService.simulateLiquidation(position, currentPrice)
          const riskWarning = leverageService.generateRiskWarning(
            position.leverage,
            (position.margin + position.unrealizedPnL) / position.margin * 100
          )

          return createApiResponse({
            success: true,
            simulation,
            riskWarning,
          })
        }

        default:
          return createApiResponse({ error: 'Unknown action' }, { status: 400 })
      }
    } catch (error) {
      safeLogger.error('[Margin API] POST error', { error, action })
      throw new ApiError('요청 처리에 실패했습니다', 500)
    }
  },
  {
    rateLimit: { category: 'exchange' },
    errorHandler: { logErrors: true },
  }
)

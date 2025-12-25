/**
 * Leverage & Margin Trading Service
 * QRY-020: 레버리지/마진 거래 시스템
 *
 * ⚠️ 경고: 레버리지 거래는 원금 이상의 손실이 발생할 수 있습니다.
 * 본 서비스는 교육 목적이며, 투자 조언이 아닙니다.
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { safeLogger } from '@/lib/utils/safe-logger'

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

/**
 * 마진 유형
 */
export type MarginType = 'cross' | 'isolated'

/**
 * 포지션 방향
 */
export type PositionSide = 'long' | 'short'

/**
 * 레버리지 설정
 */
export interface LeverageConfig {
  symbol: string
  leverage: number // 1-125x
  marginType: MarginType
  maxLeverage: number
}

/**
 * 마진 계좌 정보
 */
export interface MarginAccount {
  userId: string
  exchange: string
  totalBalance: number
  availableBalance: number
  usedMargin: number
  unrealizedPnL: number
  marginLevel: number // 마진 레벨 (%)
  liquidationRisk: 'safe' | 'warning' | 'danger' | 'critical'
  positions: MarginPosition[]
}

/**
 * 마진 포지션
 */
export interface MarginPosition {
  id: string
  symbol: string
  side: PositionSide
  size: number
  entryPrice: number
  markPrice: number
  leverage: number
  marginType: MarginType
  margin: number // 사용된 마진
  unrealizedPnL: number
  unrealizedPnLPercent: number
  liquidationPrice: number
  takeProfitPrice: number | null
  stopLossPrice: number | null
  createdAt: string
}

/**
 * 마진 주문 요청
 */
export interface MarginOrderRequest {
  symbol: string
  side: PositionSide
  type: 'market' | 'limit' | 'stop_market' | 'stop_limit'
  quantity: number
  price?: number
  stopPrice?: number
  leverage: number
  marginType: MarginType
  reduceOnly?: boolean
  takeProfitPrice?: number
  stopLossPrice?: number
}

/**
 * 청산 이벤트
 */
export interface LiquidationEvent {
  id: string
  userId: string
  positionId: string
  symbol: string
  side: PositionSide
  size: number
  entryPrice: number
  liquidationPrice: number
  executedPrice: number
  loss: number
  timestamp: string
}

/**
 * 마진 계산 결과
 */
export interface MarginCalculation {
  requiredMargin: number
  maintenanceMargin: number
  liquidationPrice: number
  maxPositionSize: number
  estimatedPnL: number
  estimatedPnLPercent: number
  marginRatio: number
  riskLevel: 'low' | 'medium' | 'high' | 'extreme'
}

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

/**
 * 거래소별 최대 레버리지
 */
export const MAX_LEVERAGE: Record<string, number> = {
  binance_futures: 125,
  bybit: 100,
  alpaca: 4, // 주식 마진
  upbit: 1, // 레버리지 미지원
}

/**
 * 마진 레벨 임계값
 */
export const MARGIN_THRESHOLDS = {
  SAFE: 150,      // 150% 이상: 안전
  WARNING: 120,   // 120-150%: 주의
  DANGER: 110,    // 110-120%: 위험
  CRITICAL: 100,  // 100% 이하: 청산 임박
} as const

/**
 * 유지 마진율 (거래소별)
 */
export const MAINTENANCE_MARGIN_RATE: Record<string, number> = {
  binance_futures: 0.004, // 0.4%
  bybit: 0.005,           // 0.5%
  alpaca: 0.25,           // 25% (Reg T)
}

// ═══════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════

async function getSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
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
}

// ═══════════════════════════════════════════════════════════════
// Leverage Service
// ═══════════════════════════════════════════════════════════════

export class LeverageService {
  /**
   * 레버리지 설정 조회
   */
  async getLeverageConfig(
    userId: string,
    symbol: string,
    exchange: string
  ): Promise<LeverageConfig> {
    const supabase = await getSupabase()

    const { data } = await supabase
      .from('leverage_settings')
      .select('*')
      .eq('user_id', userId)
      .eq('symbol', symbol)
      .eq('exchange', exchange)
      .single()

    const maxLeverage = MAX_LEVERAGE[exchange] || 1

    if (!data) {
      return {
        symbol,
        leverage: 1,
        marginType: 'cross',
        maxLeverage,
      }
    }

    return {
      symbol: data.symbol,
      leverage: Math.min(data.leverage, maxLeverage),
      marginType: data.margin_type || 'cross',
      maxLeverage,
    }
  }

  /**
   * 레버리지 설정 변경
   */
  async setLeverage(
    userId: string,
    symbol: string,
    exchange: string,
    leverage: number,
    marginType: MarginType = 'cross'
  ): Promise<{ success: boolean; error?: string }> {
    const maxLeverage = MAX_LEVERAGE[exchange] || 1

    if (leverage < 1 || leverage > maxLeverage) {
      return {
        success: false,
        error: `레버리지는 1-${maxLeverage}x 범위 내여야 합니다`,
      }
    }

    const supabase = await getSupabase()

    const { error } = await supabase
      .from('leverage_settings')
      .upsert({
        user_id: userId,
        symbol,
        exchange,
        leverage,
        margin_type: marginType,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,symbol,exchange',
      })

    if (error) {
      safeLogger.error('[LeverageService] Failed to set leverage', { error, userId, symbol })
      return { success: false, error: '레버리지 설정에 실패했습니다' }
    }

    safeLogger.info('[LeverageService] Leverage set', { userId, symbol, leverage, marginType })
    return { success: true }
  }

  /**
   * 마진 계좌 정보 조회
   */
  async getMarginAccount(
    userId: string,
    exchange: string
  ): Promise<MarginAccount | null> {
    const supabase = await getSupabase()

    // 계좌 정보 조회
    const { data: account } = await supabase
      .from('margin_accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('exchange', exchange)
      .single()

    if (!account) {
      return null
    }

    // 포지션 조회
    const { data: positions } = await supabase
      .from('margin_positions')
      .select('*')
      .eq('user_id', userId)
      .eq('exchange', exchange)
      .eq('status', 'open')

    const marginPositions: MarginPosition[] = (positions || []).map((p: {
      id: string
      symbol: string
      side: PositionSide
      size: number
      entry_price: number
      mark_price: number
      leverage: number
      margin_type: MarginType
      margin: number
      unrealized_pnl: number
      liquidation_price: number
      take_profit_price: number | null
      stop_loss_price: number | null
      created_at: string
    }) => ({
      id: p.id,
      symbol: p.symbol,
      side: p.side,
      size: p.size,
      entryPrice: p.entry_price,
      markPrice: p.mark_price,
      leverage: p.leverage,
      marginType: p.margin_type,
      margin: p.margin,
      unrealizedPnL: p.unrealized_pnl,
      unrealizedPnLPercent: (p.unrealized_pnl / p.margin) * 100,
      liquidationPrice: p.liquidation_price,
      takeProfitPrice: p.take_profit_price,
      stopLossPrice: p.stop_loss_price,
      createdAt: p.created_at,
    }))

    const totalUnrealizedPnL = marginPositions.reduce((sum, p) => sum + p.unrealizedPnL, 0)
    const usedMargin = marginPositions.reduce((sum, p) => sum + p.margin, 0)
    const marginLevel = usedMargin > 0
      ? ((account.total_balance + totalUnrealizedPnL) / usedMargin) * 100
      : 999

    return {
      userId: account.user_id,
      exchange: account.exchange,
      totalBalance: account.total_balance,
      availableBalance: account.available_balance,
      usedMargin,
      unrealizedPnL: totalUnrealizedPnL,
      marginLevel,
      liquidationRisk: this.getLiquidationRisk(marginLevel),
      positions: marginPositions,
    }
  }

  /**
   * 청산 위험도 평가
   */
  private getLiquidationRisk(
    marginLevel: number
  ): 'safe' | 'warning' | 'danger' | 'critical' {
    if (marginLevel >= MARGIN_THRESHOLDS.SAFE) return 'safe'
    if (marginLevel >= MARGIN_THRESHOLDS.WARNING) return 'warning'
    if (marginLevel >= MARGIN_THRESHOLDS.DANGER) return 'danger'
    return 'critical'
  }

  /**
   * 마진 계산
   */
  calculateMargin(params: {
    entryPrice: number
    size: number
    leverage: number
    side: PositionSide
    currentPrice: number
    exchange: string
  }): MarginCalculation {
    const { entryPrice, size, leverage, side, currentPrice, exchange } = params

    const notionalValue = entryPrice * size
    const requiredMargin = notionalValue / leverage

    const maintenanceRate = MAINTENANCE_MARGIN_RATE[exchange] || 0.01
    const maintenanceMargin = notionalValue * maintenanceRate

    // 청산가 계산
    const liquidationPrice = this.calculateLiquidationPrice({
      entryPrice,
      leverage,
      side,
      maintenanceRate,
    })

    // 예상 PnL 계산
    const priceDiff = side === 'long'
      ? currentPrice - entryPrice
      : entryPrice - currentPrice
    const estimatedPnL = priceDiff * size
    const estimatedPnLPercent = (estimatedPnL / requiredMargin) * 100

    // 마진 비율
    const marginRatio = (requiredMargin + estimatedPnL) / maintenanceMargin * 100

    // 위험도 평가
    let riskLevel: 'low' | 'medium' | 'high' | 'extreme' = 'low'
    if (leverage > 50) riskLevel = 'extreme'
    else if (leverage > 20) riskLevel = 'high'
    else if (leverage > 5) riskLevel = 'medium'

    // 최대 포지션 크기 (가용 잔고 기준)
    const maxPositionSize = 0 // TODO: 가용 잔고에서 계산

    return {
      requiredMargin,
      maintenanceMargin,
      liquidationPrice,
      maxPositionSize,
      estimatedPnL,
      estimatedPnLPercent,
      marginRatio,
      riskLevel,
    }
  }

  /**
   * 청산가 계산
   */
  calculateLiquidationPrice(params: {
    entryPrice: number
    leverage: number
    side: PositionSide
    maintenanceRate: number
  }): number {
    const { entryPrice, leverage, side, maintenanceRate } = params

    // 청산가 공식:
    // Long: entryPrice * (1 - 1/leverage + maintenanceRate)
    // Short: entryPrice * (1 + 1/leverage - maintenanceRate)

    if (side === 'long') {
      return entryPrice * (1 - 1 / leverage + maintenanceRate)
    } else {
      return entryPrice * (1 + 1 / leverage - maintenanceRate)
    }
  }

  /**
   * 포지션 청산 시뮬레이션
   */
  simulateLiquidation(
    position: MarginPosition,
    currentPrice: number
  ): {
    wouldLiquidate: boolean
    distanceToLiquidation: number
    distancePercent: number
    estimatedLoss: number
  } {
    const { liquidationPrice, side, entryPrice, size, margin } = position

    const wouldLiquidate = side === 'long'
      ? currentPrice <= liquidationPrice
      : currentPrice >= liquidationPrice

    const distanceToLiquidation = side === 'long'
      ? currentPrice - liquidationPrice
      : liquidationPrice - currentPrice

    const distancePercent = (distanceToLiquidation / currentPrice) * 100

    // 청산 시 손실 = 마진 전액
    const estimatedLoss = wouldLiquidate ? margin : 0

    return {
      wouldLiquidate,
      distanceToLiquidation,
      distancePercent,
      estimatedLoss,
    }
  }

  /**
   * 마진 콜 알림 확인
   */
  async checkMarginCall(
    userId: string,
    exchange: string
  ): Promise<{
    hasMarginCall: boolean
    positions: Array<{
      position: MarginPosition
      marginLevel: number
      urgency: 'warning' | 'danger' | 'critical'
    }>
  }> {
    const account = await this.getMarginAccount(userId, exchange)

    if (!account) {
      return { hasMarginCall: false, positions: [] }
    }

    const positionsAtRisk = account.positions
      .map(position => {
        const marginLevel = (position.margin + position.unrealizedPnL) / position.margin * 100
        let urgency: 'warning' | 'danger' | 'critical' | null = null

        if (marginLevel < MARGIN_THRESHOLDS.CRITICAL) urgency = 'critical'
        else if (marginLevel < MARGIN_THRESHOLDS.DANGER) urgency = 'danger'
        else if (marginLevel < MARGIN_THRESHOLDS.WARNING) urgency = 'warning'

        return urgency ? { position, marginLevel, urgency } : null
      })
      .filter((p): p is NonNullable<typeof p> => p !== null)

    return {
      hasMarginCall: positionsAtRisk.length > 0,
      positions: positionsAtRisk,
    }
  }

  /**
   * 청산 내역 조회
   */
  async getLiquidationHistory(
    userId: string,
    limit = 20
  ): Promise<LiquidationEvent[]> {
    const supabase = await getSupabase()

    const { data, error } = await supabase
      .from('liquidation_events')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(limit)

    if (error) {
      safeLogger.error('[LeverageService] Failed to get liquidation history', { error, userId })
      return []
    }

    return (data || []).map((e: {
      id: string
      user_id: string
      position_id: string
      symbol: string
      side: PositionSide
      size: number
      entry_price: number
      liquidation_price: number
      executed_price: number
      loss: number
      timestamp: string
    }) => ({
      id: e.id,
      userId: e.user_id,
      positionId: e.position_id,
      symbol: e.symbol,
      side: e.side,
      size: e.size,
      entryPrice: e.entry_price,
      liquidationPrice: e.liquidation_price,
      executedPrice: e.executed_price,
      loss: e.loss,
      timestamp: e.timestamp,
    }))
  }

  /**
   * 위험 경고 생성
   */
  generateRiskWarning(
    leverage: number,
    marginLevel?: number
  ): {
    level: 'low' | 'medium' | 'high' | 'extreme'
    message: string
    recommendations: string[]
  } {
    let level: 'low' | 'medium' | 'high' | 'extreme' = 'low'
    let message = ''
    const recommendations: string[] = []

    // 레버리지 기반 경고
    if (leverage >= 50) {
      level = 'extreme'
      message = '극도로 높은 레버리지입니다. 원금 전체를 잃을 위험이 매우 높습니다.'
      recommendations.push('레버리지를 20x 이하로 낮추는 것을 권장합니다')
      recommendations.push('포지션 크기를 줄이세요')
      recommendations.push('반드시 손절가를 설정하세요')
    } else if (leverage >= 20) {
      level = 'high'
      message = '높은 레버리지입니다. 급격한 가격 변동 시 큰 손실이 발생할 수 있습니다.'
      recommendations.push('손절가 설정을 강력히 권장합니다')
      recommendations.push('포지션 크기를 적절히 조절하세요')
    } else if (leverage >= 5) {
      level = 'medium'
      message = '중간 수준의 레버리지입니다. 리스크 관리에 주의하세요.'
      recommendations.push('손절가 설정을 권장합니다')
    } else {
      level = 'low'
      message = '상대적으로 낮은 레버리지입니다.'
    }

    // 마진 레벨 기반 추가 경고
    if (marginLevel !== undefined) {
      if (marginLevel < MARGIN_THRESHOLDS.CRITICAL) {
        level = 'extreme'
        message = '청산 임박! 즉시 조치가 필요합니다.'
        recommendations.unshift('즉시 마진을 추가하거나 포지션을 줄이세요')
      } else if (marginLevel < MARGIN_THRESHOLDS.DANGER) {
        level = level === 'extreme' ? 'extreme' : 'high'
        message = '마진 레벨이 위험 수준입니다. ' + message
        recommendations.unshift('마진 추가 또는 포지션 축소를 고려하세요')
      }
    }

    return { level, message, recommendations }
  }
}

// 싱글톤 인스턴스
export const leverageService = new LeverageService()

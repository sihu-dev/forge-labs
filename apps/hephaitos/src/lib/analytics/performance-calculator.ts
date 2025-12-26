/**
 * Performance Calculator Service
 * QRY-021: 성과 계산기 - 실제 거래 데이터 기반 성과 분석
 *
 * ⚠️ 면책조항: 과거 성과는 미래 수익을 보장하지 않습니다.
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import {
  calculatePerformanceMetrics,
  calculateDailyReturns,
  calculateMonthlyReturns,
  extractDrawdownRecords,
  calculateTotalReturn,
  calculateSharpeRatio,
  calculateSortinoRatio,
  calculateMaxDrawdown,
  calculateWinRate,
  calculateProfitFactor,
} from '@forge/utils'
import type { HephaitosTypes } from '@forge/types'

type IEquityPoint = HephaitosTypes.IEquityPoint
type IRoundTrip = HephaitosTypes.IRoundTrip
type IPerformanceMetrics = HephaitosTypes.IPerformanceMetrics
type IMonthlyReturn = HephaitosTypes.IMonthlyReturn
type IDrawdownRecord = HephaitosTypes.IDrawdownRecord

// ═══════════════════════════════════════════════════════════════
// 타입 정의
// ═══════════════════════════════════════════════════════════════

/**
 * 성과 보고서 기간
 */
export type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'all'

/**
 * 벤치마크 종류
 */
export type BenchmarkType = 'sp500' | 'nasdaq' | 'btc' | 'eth' | 'kospi' | 'kosdaq'

/**
 * 거래 레코드 (Supabase)
 */
export interface TradeRecord {
  id: string
  user_id: string
  strategy_id: string | null
  symbol: string
  side: 'buy' | 'sell'
  quantity: number
  price: number
  total_value: number
  fee: number
  executed_at: string
  exchange: string
  order_type: string
  status: 'filled' | 'partial' | 'cancelled'
}

/**
 * 포트폴리오 스냅샷
 */
export interface PortfolioSnapshot {
  timestamp: string
  totalValue: number
  cash: number
  positions: Array<{
    symbol: string
    quantity: number
    avgPrice: number
    currentPrice: number
    value: number
    unrealizedPnL: number
  }>
}

/**
 * 성과 리포트
 */
export interface PerformanceReport {
  period: ReportPeriod
  startDate: string
  endDate: string
  initialValue: number
  finalValue: number
  metrics: IPerformanceMetrics
  monthlyReturns: IMonthlyReturn[]
  drawdowns: IDrawdownRecord[]
  equityCurve: IEquityPoint[]
  topPerformers: Array<{ symbol: string; return: number; trades: number }>
  worstPerformers: Array<{ symbol: string; return: number; trades: number }>
  tradeSummary: {
    totalTrades: number
    winningTrades: number
    losingTrades: number
    avgTradeSize: number
    mostTradedSymbol: string
  }
  riskMetrics: {
    valueAtRisk95: number
    valueAtRisk99: number
    conditionalVaR: number
    beta: number | null
    correlation: number | null
  }
}

/**
 * 벤치마크 비교 결과
 */
export interface BenchmarkComparison {
  benchmark: BenchmarkType
  portfolioReturn: number
  benchmarkReturn: number
  alpha: number
  beta: number
  correlation: number
  sharpeRatioPortfolio: number
  sharpeRatioBenchmark: number
  period: {
    start: string
    end: string
  }
}

// ═══════════════════════════════════════════════════════════════
// 헬퍼 함수
// ═══════════════════════════════════════════════════════════════

/**
 * Supabase 클라이언트 생성
 */
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

/**
 * 기간 시작일 계산
 */
function getPeriodStartDate(period: ReportPeriod): Date {
  const now = new Date()
  switch (period) {
    case 'daily':
      return new Date(now.setDate(now.getDate() - 1))
    case 'weekly':
      return new Date(now.setDate(now.getDate() - 7))
    case 'monthly':
      return new Date(now.setMonth(now.getMonth() - 1))
    case 'quarterly':
      return new Date(now.setMonth(now.getMonth() - 3))
    case 'yearly':
      return new Date(now.setFullYear(now.getFullYear() - 1))
    case 'all':
      return new Date('2020-01-01')
  }
}

/**
 * VaR (Value at Risk) 계산
 */
function calculateVaR(returns: number[], confidence: number): number {
  if (returns.length === 0) return 0
  const sorted = [...returns].sort((a, b) => a - b)
  const index = Math.floor((1 - confidence) * sorted.length)
  return Math.abs(sorted[index] || 0) * 100
}

/**
 * Conditional VaR (CVaR) 계산
 */
function calculateCVaR(returns: number[], confidence: number): number {
  if (returns.length === 0) return 0
  const sorted = [...returns].sort((a, b) => a - b)
  const cutoffIndex = Math.floor((1 - confidence) * sorted.length)
  const tailReturns = sorted.slice(0, cutoffIndex + 1)
  const avg = tailReturns.reduce((sum, r) => sum + r, 0) / tailReturns.length
  return Math.abs(avg) * 100
}

/**
 * 거래 내역을 RoundTrip으로 변환
 */
function convertToRoundTrips(trades: TradeRecord[]): IRoundTrip[] {
  const roundTrips: IRoundTrip[] = []
  const openPositions = new Map<string, TradeRecord[]>()

  for (const trade of trades) {
    if (trade.side === 'buy') {
      const existing = openPositions.get(trade.symbol) || []
      existing.push(trade)
      openPositions.set(trade.symbol, existing)
    } else if (trade.side === 'sell') {
      const opens = openPositions.get(trade.symbol) || []
      const entry = opens.shift()

      if (entry) {
        const grossPnL = (trade.price - entry.price) * trade.quantity
        const totalFees = entry.fee + trade.fee
        const netPnL = grossPnL - totalFees
        const returnPct = (trade.price - entry.price) / entry.price * 100

        roundTrips.push({
          id: `${entry.id}-${trade.id}`,
          symbol: trade.symbol,
          side: 'buy' as const,
          entryTrade: {
            id: entry.id,
            orderId: entry.id,
            symbol: entry.symbol,
            side: 'buy' as const,
            quantity: entry.quantity,
            price: entry.price,
            value: entry.price * entry.quantity,
            fee: entry.fee,
            feeCurrency: 'USD',
            executedAt: entry.executed_at,
          },
          exitTrade: {
            id: trade.id,
            orderId: trade.id,
            symbol: trade.symbol,
            side: 'sell' as const,
            quantity: trade.quantity,
            price: trade.price,
            value: trade.price * trade.quantity,
            fee: trade.fee,
            feeCurrency: 'USD',
            executedAt: trade.executed_at,
          },
          entryPrice: entry.price,
          exitPrice: trade.price,
          quantity: trade.quantity,
          totalFees: totalFees,
          netPnL,
          netPnLPercent: returnPct,
          holdingPeriodMs: new Date(trade.executed_at).getTime() - new Date(entry.executed_at).getTime(),
          holdingPeriodBars: 0, // Not available in this context
          enteredAt: entry.executed_at,
          exitedAt: trade.executed_at,
        })

        if (opens.length === 0) {
          openPositions.delete(trade.symbol)
        }
      }
    }
  }

  return roundTrips
}

/**
 * 자산 곡선 생성
 */
function buildEquityCurve(
  trades: TradeRecord[],
  initialCapital: number
): IEquityPoint[] {
  if (trades.length === 0) {
    return [{
      timestamp: new Date().toISOString(),
      equity: initialCapital,
      cash: initialCapital,
      positionValue: 0,
      drawdown: 0,
    }]
  }

  const curve: IEquityPoint[] = []
  let cash = initialCapital
  let positions = new Map<string, { quantity: number; avgPrice: number }>()
  let peak = initialCapital

  // 시작점
  curve.push({
    timestamp: trades[0].executed_at,
    equity: initialCapital,
    cash: initialCapital,
    positionValue: 0,
    drawdown: 0,
  })

  for (const trade of trades) {
    if (trade.side === 'buy') {
      cash -= trade.total_value + trade.fee
      const existing = positions.get(trade.symbol)
      if (existing) {
        const totalQty = existing.quantity + trade.quantity
        const totalValue = existing.quantity * existing.avgPrice + trade.quantity * trade.price
        positions.set(trade.symbol, {
          quantity: totalQty,
          avgPrice: totalValue / totalQty,
        })
      } else {
        positions.set(trade.symbol, {
          quantity: trade.quantity,
          avgPrice: trade.price,
        })
      }
    } else {
      cash += trade.total_value - trade.fee
      const existing = positions.get(trade.symbol)
      if (existing) {
        existing.quantity -= trade.quantity
        if (existing.quantity <= 0) {
          positions.delete(trade.symbol)
        }
      }
    }

    // 포지션 가치 계산 (현재 거래 가격 기준)
    let positionValue = 0
    for (const [, pos] of positions) {
      positionValue += pos.quantity * pos.avgPrice // 근사치
    }

    const equity = cash + positionValue
    peak = Math.max(peak, equity)
    const drawdown = peak > 0 ? ((peak - equity) / peak) * 100 : 0

    curve.push({
      timestamp: trade.executed_at,
      equity,
      cash,
      positionValue,
      drawdown,
    })
  }

  return curve
}

// ═══════════════════════════════════════════════════════════════
// Performance Calculator Service
// ═══════════════════════════════════════════════════════════════

export class PerformanceCalculator {
  /**
   * 사용자의 거래 내역 조회
   */
  async getTradeHistory(
    userId: string,
    options: {
      startDate?: string
      endDate?: string
      strategyId?: string
      symbol?: string
    } = {}
  ): Promise<TradeRecord[]> {
    const supabase = await getSupabase()

    let query = supabase
      .from('trades')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'filled')
      .order('executed_at', { ascending: true })

    if (options.startDate) {
      query = query.gte('executed_at', options.startDate)
    }
    if (options.endDate) {
      query = query.lte('executed_at', options.endDate)
    }
    if (options.strategyId) {
      query = query.eq('strategy_id', options.strategyId)
    }
    if (options.symbol) {
      query = query.eq('symbol', options.symbol)
    }

    const { data, error } = await query

    if (error) {
      console.error('[PerformanceCalculator] Failed to fetch trades:', error)
      return []
    }

    return (data || []) as TradeRecord[]
  }

  /**
   * 초기 자본 조회 (첫 입금 또는 프로필 설정)
   */
  async getInitialCapital(userId: string): Promise<number> {
    const supabase = await getSupabase()

    const { data: profile } = await supabase
      .from('profiles')
      .select('initial_capital')
      .eq('id', userId)
      .single()

    return profile?.initial_capital || 10000 // 기본값 $10,000
  }

  /**
   * 현재 포트폴리오 가치 조회
   */
  async getCurrentPortfolioValue(userId: string): Promise<number> {
    const supabase = await getSupabase()

    const { data: portfolio } = await supabase
      .from('portfolios')
      .select('total_value')
      .eq('user_id', userId)
      .single()

    return portfolio?.total_value || 0
  }

  /**
   * 성과 리포트 생성
   */
  async generateReport(
    userId: string,
    period: ReportPeriod = 'monthly'
  ): Promise<PerformanceReport> {
    const startDate = getPeriodStartDate(period).toISOString()
    const endDate = new Date().toISOString()

    // 거래 내역 조회
    const trades = await this.getTradeHistory(userId, { startDate, endDate })
    const initialCapital = await this.getInitialCapital(userId)
    const currentValue = await this.getCurrentPortfolioValue(userId)
    const finalValue = currentValue || initialCapital

    // RoundTrip 및 자산 곡선 생성
    const roundTrips = convertToRoundTrips(trades)
    const equityCurve = buildEquityCurve(trades, initialCapital)

    // 성과 지표 계산
    const metrics = calculatePerformanceMetrics(
      initialCapital,
      finalValue,
      equityCurve,
      roundTrips
    )

    // 월별 수익률
    const monthlyReturns = calculateMonthlyReturns(equityCurve, roundTrips)

    // 낙폭 기록
    const drawdowns = extractDrawdownRecords(equityCurve)

    // 일별 수익률 (VaR 계산용)
    const dailyReturns = calculateDailyReturns(equityCurve)

    // 심볼별 성과 분석
    const symbolStats = this.analyzeBySymbol(roundTrips)
    const sortedByReturn = [...symbolStats].sort((a, b) => b.return - a.return)

    // 거래 요약
    const tradeSummary = {
      totalTrades: trades.length,
      winningTrades: roundTrips.filter(t => t.netPnL > 0).length,
      losingTrades: roundTrips.filter(t => t.netPnL < 0).length,
      avgTradeSize: trades.length > 0
        ? trades.reduce((sum, t) => sum + t.total_value, 0) / trades.length
        : 0,
      mostTradedSymbol: this.getMostTradedSymbol(trades),
    }

    return {
      period,
      startDate,
      endDate,
      initialValue: initialCapital,
      finalValue,
      metrics,
      monthlyReturns,
      drawdowns,
      equityCurve,
      topPerformers: sortedByReturn.slice(0, 5),
      worstPerformers: sortedByReturn.slice(-5).reverse(),
      tradeSummary,
      riskMetrics: {
        valueAtRisk95: calculateVaR(dailyReturns, 0.95),
        valueAtRisk99: calculateVaR(dailyReturns, 0.99),
        conditionalVaR: calculateCVaR(dailyReturns, 0.95),
        beta: null, // 벤치마크 비교 시 계산
        correlation: null,
      },
    }
  }

  /**
   * 심볼별 성과 분석
   */
  private analyzeBySymbol(roundTrips: IRoundTrip[]): Array<{
    symbol: string
    return: number
    trades: number
  }> {
    const symbolMap = new Map<string, { pnl: number; trades: number }>()

    for (const trade of roundTrips) {
      const existing = symbolMap.get(trade.symbol) || { pnl: 0, trades: 0 }
      existing.pnl += trade.netPnL
      existing.trades++
      symbolMap.set(trade.symbol, existing)
    }

    return Array.from(symbolMap.entries()).map(([symbol, data]) => ({
      symbol,
      return: data.pnl,
      trades: data.trades,
    }))
  }

  /**
   * 가장 많이 거래한 심볼
   */
  private getMostTradedSymbol(trades: TradeRecord[]): string {
    const counts = new Map<string, number>()
    for (const trade of trades) {
      counts.set(trade.symbol, (counts.get(trade.symbol) || 0) + 1)
    }
    let max = 0
    let symbol = ''
    for (const [s, c] of counts) {
      if (c > max) {
        max = c
        symbol = s
      }
    }
    return symbol || 'N/A'
  }

  /**
   * 벤치마크 비교
   */
  async compareToBenchmark(
    userId: string,
    benchmark: BenchmarkType,
    startDate: string,
    endDate: string
  ): Promise<BenchmarkComparison> {
    const trades = await this.getTradeHistory(userId, { startDate, endDate })
    const initialCapital = await this.getInitialCapital(userId)
    const currentValue = await this.getCurrentPortfolioValue(userId)

    const roundTrips = convertToRoundTrips(trades)
    const equityCurve = buildEquityCurve(trades, initialCapital)

    const portfolioReturn = calculateTotalReturn(initialCapital, currentValue || initialCapital)
    const dailyReturns = calculateDailyReturns(equityCurve)

    // 벤치마크 데이터 가져오기 (외부 API 또는 캐시된 데이터)
    const benchmarkData = await this.fetchBenchmarkData(benchmark, startDate, endDate)
    const benchmarkReturn = benchmarkData.return
    const benchmarkDailyReturns = benchmarkData.dailyReturns

    // 베타 및 상관계수 계산
    const { beta, correlation } = this.calculateBetaAndCorrelation(
      dailyReturns,
      benchmarkDailyReturns
    )

    // 알파 계산 (Jensen's Alpha)
    const riskFreeRate = 0.02 // 연 2%
    const alpha = portfolioReturn - (riskFreeRate + beta * (benchmarkReturn - riskFreeRate))

    return {
      benchmark,
      portfolioReturn,
      benchmarkReturn,
      alpha,
      beta,
      correlation,
      sharpeRatioPortfolio: calculateSharpeRatio(dailyReturns),
      sharpeRatioBenchmark: calculateSharpeRatio(benchmarkDailyReturns),
      period: { start: startDate, end: endDate },
    }
  }

  /**
   * 벤치마크 데이터 조회
   */
  private async fetchBenchmarkData(
    benchmark: BenchmarkType,
    _startDate: string,
    _endDate: string
  ): Promise<{ return: number; dailyReturns: number[] }> {
    // TODO: 실제 외부 API (Yahoo Finance, CoinGecko 등) 연동
    // 현재는 목 데이터 반환
    const mockReturns: Record<BenchmarkType, number> = {
      sp500: 12.5,
      nasdaq: 15.2,
      btc: 45.3,
      eth: 38.7,
      kospi: 8.2,
      kosdaq: 5.1,
    }

    // 일별 수익률 목 데이터 (252 거래일)
    const mockDailyReturns = Array.from({ length: 252 }, () =>
      (Math.random() - 0.48) * 0.02 // 평균적으로 양수
    )

    return {
      return: mockReturns[benchmark] || 10,
      dailyReturns: mockDailyReturns,
    }
  }

  /**
   * 베타 및 상관계수 계산
   */
  private calculateBetaAndCorrelation(
    portfolioReturns: number[],
    benchmarkReturns: number[]
  ): { beta: number; correlation: number } {
    const n = Math.min(portfolioReturns.length, benchmarkReturns.length)
    if (n < 2) return { beta: 1, correlation: 0 }

    const pReturns = portfolioReturns.slice(0, n)
    const bReturns = benchmarkReturns.slice(0, n)

    const pMean = pReturns.reduce((s, v) => s + v, 0) / n
    const bMean = bReturns.reduce((s, v) => s + v, 0) / n

    let covariance = 0
    let pVariance = 0
    let bVariance = 0

    for (let i = 0; i < n; i++) {
      const pDiff = pReturns[i] - pMean
      const bDiff = bReturns[i] - bMean
      covariance += pDiff * bDiff
      pVariance += pDiff * pDiff
      bVariance += bDiff * bDiff
    }

    covariance /= n
    pVariance /= n
    bVariance /= n

    const beta = bVariance > 0 ? covariance / bVariance : 1
    const correlation = pVariance > 0 && bVariance > 0
      ? covariance / Math.sqrt(pVariance * bVariance)
      : 0

    return { beta, correlation }
  }

  /**
   * 전략별 성과 비교
   */
  async compareStrategies(
    userId: string,
    strategyIds: string[],
    period: ReportPeriod = 'monthly'
  ): Promise<Array<{
    strategyId: string
    strategyName: string
    metrics: IPerformanceMetrics
    rank: number
  }>> {
    const startDate = getPeriodStartDate(period).toISOString()
    const endDate = new Date().toISOString()
    const initialCapital = await this.getInitialCapital(userId)

    const results: Array<{
      strategyId: string
      strategyName: string
      metrics: IPerformanceMetrics
      finalValue: number
    }> = []

    for (const strategyId of strategyIds) {
      const trades = await this.getTradeHistory(userId, {
        startDate,
        endDate,
        strategyId,
      })

      const roundTrips = convertToRoundTrips(trades)
      const equityCurve = buildEquityCurve(trades, initialCapital)
      const finalValue = equityCurve[equityCurve.length - 1]?.equity || initialCapital

      const metrics = calculatePerformanceMetrics(
        initialCapital,
        finalValue,
        equityCurve,
        roundTrips
      )

      results.push({
        strategyId,
        strategyName: strategyId, // TODO: 전략 이름 조회
        metrics,
        finalValue,
      })
    }

    // 수익률 기준 랭킹
    results.sort((a, b) => b.metrics.totalReturn - a.metrics.totalReturn)

    return results.map((r, index) => ({
      strategyId: r.strategyId,
      strategyName: r.strategyName,
      metrics: r.metrics,
      rank: index + 1,
    }))
  }
}

// 싱글톤 인스턴스
export const performanceCalculator = new PerformanceCalculator()

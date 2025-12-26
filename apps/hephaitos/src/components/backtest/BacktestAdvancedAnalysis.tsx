'use client'

/**
 * Backtest Advanced Analysis Component
 * QRY-015: 고급 백테스트 분석 시각화
 * Lightweight Charts + SVG 기반 (Recharts 마이그레이션)
 * -300KB 번들 최적화
 */

import { memo, useMemo, useState, useCallback } from 'react'
import {
  ChartBarIcon,
  ArrowPathIcon,
  ChartPieIcon,
  CubeTransparentIcon,
  BeakerIcon,
  TableCellsIcon,
} from '@heroicons/react/24/outline'
import { LWAreaChart } from '@/components/charts/LWAreaChart'
import { LWHistogramChart } from '@/components/charts/LWHistogramChart'
import { SVGScatterChart } from '@/components/charts/SVGScatterChart'
import type { BacktestResult, BacktestTrade, PortfolioSnapshot } from '@/lib/backtest'

interface BacktestAdvancedAnalysisProps {
  result: BacktestResult
  className?: string
}

type AnalysisTab = 'distribution' | 'rolling' | 'heatmap' | 'scatter' | 'risk'

export const BacktestAdvancedAnalysis = memo(function BacktestAdvancedAnalysis({
  result,
  className = '',
}: BacktestAdvancedAnalysisProps) {
  const [activeTab, setActiveTab] = useState<AnalysisTab>('distribution')

  const handleTabChange = useCallback((tab: AnalysisTab) => {
    setActiveTab(tab)
  }, [])

  return (
    <div className={`border border-white/[0.06] rounded-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <h3 className="text-sm font-medium text-white flex items-center gap-2">
          <BeakerIcon className="w-4 h-4 text-purple-400" />
          고급 분석
        </h3>
        <div className="flex gap-1">
          <TabButton
            tab="distribution"
            current={activeTab}
            onClick={handleTabChange}
            icon={ChartBarIcon}
            label="분포"
          />
          <TabButton
            tab="rolling"
            current={activeTab}
            onClick={handleTabChange}
            icon={ArrowPathIcon}
            label="롤링"
          />
          <TabButton
            tab="heatmap"
            current={activeTab}
            onClick={handleTabChange}
            icon={TableCellsIcon}
            label="히트맵"
          />
          <TabButton
            tab="scatter"
            current={activeTab}
            onClick={handleTabChange}
            icon={ChartPieIcon}
            label="산점도"
          />
          <TabButton
            tab="risk"
            current={activeTab}
            onClick={handleTabChange}
            icon={CubeTransparentIcon}
            label="리스크"
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'distribution' && <TradeDistribution trades={result.trades} />}
        {activeTab === 'rolling' && <RollingReturns snapshots={result.equityCurve} />}
        {activeTab === 'heatmap' && <ReturnsHeatmap snapshots={result.equityCurve} />}
        {activeTab === 'scatter' && <RiskReturnScatter trades={result.trades} />}
        {activeTab === 'risk' && <RiskMetricsPanel result={result} />}
      </div>
    </div>
  )
})

// Tab Button Component
interface TabButtonProps {
  tab: AnalysisTab
  current: AnalysisTab
  onClick: (tab: AnalysisTab) => void
  icon: React.ComponentType<{ className?: string }>
  label: string
}

const TabButton = memo(function TabButton({ tab, current, onClick, icon: Icon, label }: TabButtonProps) {
  const isActive = tab === current

  const handleClick = useCallback(() => {
    onClick(tab)
  }, [onClick, tab])

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs transition-colors ${
        isActive
          ? 'bg-purple-500/20 text-purple-400'
          : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]'
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  )
})

// ============================================
// 1. Trade Distribution Analysis
// ============================================

interface TradeDistributionProps {
  trades: BacktestTrade[]
}

const TradeDistribution = memo(function TradeDistribution({ trades }: TradeDistributionProps) {
  const distributionData = useMemo(() => {
    if (trades.length === 0) return null

    // Create PnL buckets
    const pnls = trades.map(t => t.pnl)
    const minPnl = Math.min(...pnls)
    const maxPnl = Math.max(...pnls)
    const bucketSize = (maxPnl - minPnl) / 10 || 1

    const buckets: Record<string, { count: number; isPositive: boolean }> = {}
    for (let i = 0; i < 10; i++) {
      const bucketStart = minPnl + i * bucketSize
      const label = `$${bucketStart.toFixed(0)}`
      buckets[label] = { count: 0, isPositive: bucketStart >= 0 }
    }

    trades.forEach(t => {
      const bucketIndex = Math.min(Math.floor((t.pnl - minPnl) / bucketSize), 9)
      const label = `$${(minPnl + bucketIndex * bucketSize).toFixed(0)}`
      if (buckets[label]) {
        buckets[label].count += 1
      }
    })

    const data = Object.entries(buckets).map(([label, { count, isPositive }], i) => ({
      time: i,
      value: count,
      color: isPositive ? '#34d399' : '#f87171',
    }))

    // Statistics
    const avgPnl = pnls.reduce((a, b) => a + b, 0) / pnls.length
    const stdDev = Math.sqrt(pnls.reduce((sum, p) => sum + Math.pow(p - avgPnl, 2), 0) / pnls.length)
    const skewness = pnls.reduce((sum, p) => sum + Math.pow((p - avgPnl) / stdDev, 3), 0) / pnls.length

    return { data, avgPnl, stdDev, skewness, totalTrades: trades.length }
  }, [trades])

  if (!distributionData) {
    return <EmptyState message="거래 데이터가 없습니다" />
  }

  return (
    <div className="space-y-4">
      {/* Statistics Summary */}
      <div className="grid grid-cols-4 gap-4">
        <StatBox label="총 거래" value={distributionData.totalTrades.toString()} />
        <StatBox
          label="평균 손익"
          value={`$${distributionData.avgPnl.toFixed(2)}`}
          positive={distributionData.avgPnl >= 0}
        />
        <StatBox label="표준편차" value={`$${distributionData.stdDev.toFixed(2)}`} />
        <StatBox
          label="왜도"
          value={distributionData.skewness.toFixed(2)}
          hint={distributionData.skewness > 0 ? '우측 꼬리' : '좌측 꼬리'}
        />
      </div>

      {/* Distribution Chart - Lightweight Charts Histogram */}
      <LWHistogramChart
        data={distributionData.data}
        height={192}
        showReferenceLine={false}
        yAxisFormatter={(v) => `${v.toFixed(0)} 거래`}
      />

      <p className="text-xs text-zinc-500 text-center">
        손익 분포 히스토그램 (10개 구간)
      </p>
    </div>
  )
})

// ============================================
// 2. Rolling Returns Chart
// ============================================

interface RollingReturnsProps {
  snapshots: PortfolioSnapshot[]
}

const RollingReturns = memo(function RollingReturns({ snapshots }: RollingReturnsProps) {
  const rollingData = useMemo(() => {
    if (snapshots.length < 20) return null

    const data: Array<{ time: number | string; value: number; value2: number }> = []

    for (let i = 30; i < snapshots.length; i++) {
      // 7-day rolling return
      const rolling7 = ((snapshots[i].equity - snapshots[i - 7].equity) / snapshots[i - 7].equity) * 100

      // 30-day rolling return
      const rolling30 = ((snapshots[i].equity - snapshots[i - 30].equity) / snapshots[i - 30].equity) * 100

      data.push({
        time: snapshots[i].timestamp,
        value: rolling7,
        value2: rolling30
      })
    }

    const slicedData = data.slice(-60) // Last 60 data points
    const avg7 = slicedData.reduce((s, d) => s + d.value, 0) / slicedData.length
    const avg30 = slicedData.reduce((s, d) => s + d.value2, 0) / slicedData.length

    return { data: slicedData, avg7, avg30 }
  }, [snapshots])

  if (!rollingData) {
    return <EmptyState message="롤링 분석에 필요한 데이터가 부족합니다 (최소 20일)" />
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <StatBox
          label="7일 평균"
          value={`${rollingData.avg7 >= 0 ? '+' : ''}${rollingData.avg7.toFixed(2)}%`}
          positive={rollingData.avg7 >= 0}
        />
        <StatBox
          label="30일 평균"
          value={`${rollingData.avg30 >= 0 ? '+' : ''}${rollingData.avg30.toFixed(2)}%`}
          positive={rollingData.avg30 >= 0}
        />
      </div>

      {/* Rolling Returns Chart - Lightweight Charts with dual lines */}
      <LWAreaChart
        data={rollingData.data}
        height={192}
        lineColor="#5E6AD2"
        showArea={false}
        showLine2={true}
        line2Color="#F59E0B"
        referenceLine={0}
        yAxisFormatter={(v) => `${v.toFixed(0)}%`}
      />

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-[#5E6AD2]" />
          <span className="text-zinc-400">7일 수익률</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-[#F59E0B]" />
          <span className="text-zinc-400">30일 수익률</span>
        </div>
      </div>

      <p className="text-xs text-zinc-500 text-center">
        롤링 수익률 추이 (7일 / 30일)
      </p>
    </div>
  )
})

// ============================================
// 3. Returns Heatmap (by Day of Week and Hour)
// ============================================

interface ReturnsHeatmapProps {
  snapshots: PortfolioSnapshot[]
}

const ReturnsHeatmap = memo(function ReturnsHeatmap({ snapshots }: ReturnsHeatmapProps) {
  const heatmapData = useMemo(() => {
    if (snapshots.length < 7) return null

    // Group returns by day of week and time period
    const dayNames = ['일', '월', '화', '수', '목', '금', '토']
    const periodNames = ['아침', '오전', '오후', '저녁']

    const grid: Record<string, { total: number; count: number }> = {}

    // Initialize grid
    dayNames.forEach(day => {
      periodNames.forEach(period => {
        grid[`${day}-${period}`] = { total: 0, count: 0 }
      })
    })

    // Calculate returns for each snapshot
    for (let i = 1; i < snapshots.length; i++) {
      const date = new Date(snapshots[i].timestamp)
      const dayOfWeek = dayNames[date.getDay()]
      const hour = date.getHours()

      let period: string
      if (hour < 9) period = '아침'
      else if (hour < 12) period = '오전'
      else if (hour < 18) period = '오후'
      else period = '저녁'

      const returnPct = ((snapshots[i].equity - snapshots[i - 1].equity) / snapshots[i - 1].equity) * 100
      const key = `${dayOfWeek}-${period}`

      grid[key].total += returnPct
      grid[key].count += 1
    }

    // Convert to array format for rendering
    const cells = dayNames.flatMap(day =>
      periodNames.map(period => {
        const key = `${day}-${period}`
        const avg = grid[key].count > 0 ? grid[key].total / grid[key].count : 0
        return { day, period, avg }
      })
    )

    return { cells, dayNames, periodNames }
  }, [snapshots])

  if (!heatmapData) {
    return <EmptyState message="히트맵 분석에 필요한 데이터가 부족합니다" />
  }

  const getColor = (avg: number): string => {
    if (avg >= 0.5) return 'bg-emerald-500'
    if (avg >= 0.2) return 'bg-emerald-400/70'
    if (avg >= 0) return 'bg-emerald-400/30'
    if (avg >= -0.2) return 'bg-red-400/30'
    if (avg >= -0.5) return 'bg-red-400/70'
    return 'bg-red-500'
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-zinc-400">요일/시간대별 평균 수익률</p>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-xs text-zinc-500 font-normal px-2 py-1 text-left" />
              {heatmapData.dayNames.map(day => (
                <th key={day} className="text-xs text-zinc-400 font-normal px-2 py-1 text-center">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {heatmapData.periodNames.map(period => (
              <tr key={period}>
                <td className="text-xs text-zinc-400 px-2 py-1">{period}</td>
                {heatmapData.dayNames.map(day => {
                  const cell = heatmapData.cells.find(c => c.day === day && c.period === period)
                  const avg = cell?.avg || 0
                  return (
                    <td key={`${day}-${period}`} className="px-1 py-1">
                      <div
                        className={`w-full h-8 rounded flex items-center justify-center ${getColor(avg)}`}
                        title={`${day} ${period}: ${avg >= 0 ? '+' : ''}${avg.toFixed(2)}%`}
                      >
                        <span className="text-[10px] font-medium text-white">
                          {avg >= 0 ? '+' : ''}{avg.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-center gap-4 text-[10px]">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-emerald-500" />
          <span className="text-zinc-400">수익</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-500" />
          <span className="text-zinc-400">손실</span>
        </div>
      </div>
    </div>
  )
})

// ============================================
// 4. Risk-Return Scatter Plot
// ============================================

interface RiskReturnScatterProps {
  trades: BacktestTrade[]
}

const RiskReturnScatter = memo(function RiskReturnScatter({ trades }: RiskReturnScatterProps) {
  const scatterData = useMemo(() => {
    if (trades.length < 5) return null

    // Group trades by week and calculate risk/return
    const weeklyData: Record<string, { returns: number[]; total: number }> = {}

    trades.forEach(t => {
      const week = new Date(t.exitTimestamp).toISOString().slice(0, 10)
      if (!weeklyData[week]) {
        weeklyData[week] = { returns: [], total: 0 }
      }
      weeklyData[week].returns.push(t.pnl)
      weeklyData[week].total += t.pnl
    })

    const data = Object.entries(weeklyData).map(([week, { returns, total }]) => {
      const avg = total / returns.length
      const variance = returns.reduce((s, r) => s + Math.pow(r - avg, 2), 0) / returns.length
      const risk = Math.sqrt(variance)
      return {
        x: risk,
        y: avg,
        z: returns.length,
        label: week,
      }
    })

    // Calculate averages
    const avgReturn = data.reduce((s, d) => s + d.y, 0) / data.length
    const avgRisk = data.reduce((s, d) => s + d.x, 0) / data.length

    return { data, avgReturn, avgRisk }
  }, [trades])

  if (!scatterData) {
    return <EmptyState message="산점도 분석에 필요한 데이터가 부족합니다" />
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <StatBox
          label="평균 수익"
          value={`$${scatterData.avgReturn.toFixed(2)}`}
          positive={scatterData.avgReturn >= 0}
        />
        <StatBox label="평균 위험" value={`$${scatterData.avgRisk.toFixed(2)}`} />
      </div>

      {/* SVG Scatter Chart */}
      <SVGScatterChart
        data={scatterData.data}
        width={400}
        height={192}
        xLabel="위험 (표준편차)"
        yLabel="평균 수익"
        xAxisFormatter={(v) => `$${v.toFixed(0)}`}
        yAxisFormatter={(v) => `$${v.toFixed(0)}`}
        tooltipContent={(point) => (
          <div>
            <p className="text-xs text-zinc-400">{point.label}</p>
            <p className="text-sm text-emerald-400">수익: ${point.y.toFixed(2)}</p>
            <p className="text-sm text-orange-400">위험: ${point.x.toFixed(2)}</p>
            <p className="text-xs text-zinc-500">{point.z}건 거래</p>
          </div>
        )}
        className="mx-auto"
      />

      <p className="text-xs text-zinc-500 text-center">
        X축: 위험 (표준편차), Y축: 평균 수익, 크기: 거래 수
      </p>
    </div>
  )
})

// ============================================
// 5. Risk Metrics Panel
// ============================================

interface RiskMetricsPanelProps {
  result: BacktestResult
}

const RiskMetricsPanel = memo(function RiskMetricsPanel({ result }: RiskMetricsPanelProps) {
  const metrics = result.metrics
  const trades = result.trades

  // Calculate additional risk metrics
  const riskData = useMemo(() => {
    const winTrades = trades.filter(t => t.pnl > 0)
    const lossTrades = trades.filter(t => t.pnl <= 0)

    // Value at Risk (95%)
    const sortedPnls = trades.map(t => t.pnl).sort((a, b) => a - b)
    const var95Index = Math.floor(sortedPnls.length * 0.05)
    const var95 = sortedPnls[var95Index] || 0

    // Expected Shortfall (CVaR)
    const cvar = sortedPnls.slice(0, var95Index + 1).reduce((s, p) => s + p, 0) / (var95Index + 1) || 0

    // Ulcer Index
    const drawdowns = result.equityCurve.map((s, i, arr) => {
      const peak = Math.max(...arr.slice(0, i + 1).map(x => x.equity))
      return ((s.equity - peak) / peak) * 100
    })
    const ulcerIndex = Math.sqrt(drawdowns.reduce((s, d) => s + d * d, 0) / drawdowns.length)

    // Recovery Factor
    const totalReturn = (result.equityCurve[result.equityCurve.length - 1].equity / result.equityCurve[0].equity - 1) * 100
    const recoveryFactor = Math.abs(metrics.maxDrawdown) > 0 ? totalReturn / Math.abs(metrics.maxDrawdown * 100) : 0

    return {
      var95,
      cvar,
      ulcerIndex,
      recoveryFactor,
      avgWin: winTrades.length > 0 ? winTrades.reduce((s, t) => s + t.pnl, 0) / winTrades.length : 0,
      avgLoss: lossTrades.length > 0 ? lossTrades.reduce((s, t) => s + t.pnl, 0) / lossTrades.length : 0,
      largestWin: winTrades.length > 0 ? Math.max(...winTrades.map(t => t.pnl)) : 0,
      largestLoss: lossTrades.length > 0 ? Math.min(...lossTrades.map(t => t.pnl)) : 0,
    }
  }, [result, metrics, trades])

  return (
    <div className="space-y-4">
      {/* Risk Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBox
          label="VaR (95%)"
          value={`$${riskData.var95.toFixed(2)}`}
          hint="95% 신뢰수준 최대 손실"
          negative
        />
        <StatBox
          label="CVaR (ES)"
          value={`$${riskData.cvar.toFixed(2)}`}
          hint="극단 손실 평균"
          negative
        />
        <StatBox
          label="Ulcer Index"
          value={riskData.ulcerIndex.toFixed(2)}
          hint="낙폭 강도 지수"
        />
        <StatBox
          label="회복 계수"
          value={riskData.recoveryFactor.toFixed(2)}
          hint="수익/최대낙폭"
          positive={riskData.recoveryFactor >= 1}
        />
      </div>

      {/* Win/Loss Analysis */}
      <div className="grid grid-cols-2 gap-4 p-4 bg-white/[0.02] rounded-lg">
        <div className="space-y-3">
          <h4 className="text-xs font-medium text-emerald-400">수익 분석</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-xs text-zinc-400">평균 수익</span>
              <span className="text-xs text-emerald-400">${riskData.avgWin.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-zinc-400">최대 수익</span>
              <span className="text-xs text-emerald-400">${riskData.largestWin.toFixed(2)}</span>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <h4 className="text-xs font-medium text-red-400">손실 분석</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-xs text-zinc-400">평균 손실</span>
              <span className="text-xs text-red-400">${Math.abs(riskData.avgLoss).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-zinc-400">최대 손실</span>
              <span className="text-xs text-red-400">${Math.abs(riskData.largestLoss).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Risk Rating */}
      <div className="p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-400">리스크 등급</p>
            <p className="text-lg font-semibold text-purple-400 mt-1">
              {getRiskRating(metrics.sharpeRatio, metrics.maxDrawdown, riskData.recoveryFactor)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-zinc-400">종합 점수</p>
            <p className="text-2xl font-bold text-white mt-1">
              {calculateRiskScore(metrics.sharpeRatio, metrics.maxDrawdown, riskData.recoveryFactor)}
              <span className="text-sm text-zinc-400">/100</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
})

// ============================================
// Helper Components
// ============================================

interface StatBoxProps {
  label: string
  value: string
  hint?: string
  positive?: boolean
  negative?: boolean
}

const StatBox = memo(function StatBox({ label, value, hint, positive, negative }: StatBoxProps) {
  let valueClass = 'text-white'
  if (positive) valueClass = 'text-emerald-400'
  if (negative) valueClass = 'text-red-400'

  return (
    <div className="space-y-1">
      <p className="text-xs text-zinc-400">{label}</p>
      <p className={`text-base font-medium ${valueClass}`}>{value}</p>
      {hint && <p className="text-[10px] text-zinc-500">{hint}</p>}
    </div>
  )
})

const EmptyState = memo(function EmptyState({ message }: { message: string }) {
  return (
    <div className="h-48 flex items-center justify-center">
      <div className="text-center">
        <BeakerIcon className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
        <p className="text-sm text-zinc-400">{message}</p>
      </div>
    </div>
  )
})

// ============================================
// Utility Functions
// ============================================

function getRiskRating(sharpe: number, maxDD: number, recovery: number): string {
  const score = calculateRiskScore(sharpe, maxDD, recovery)
  if (score >= 80) return '매우 안전'
  if (score >= 60) return '안전'
  if (score >= 40) return '보통'
  if (score >= 20) return '위험'
  return '매우 위험'
}

function calculateRiskScore(sharpe: number, maxDD: number, recovery: number): number {
  let score = 50

  // Sharpe ratio contribution (0-30 points)
  score += Math.min(sharpe * 15, 30)

  // Max drawdown contribution (-30 to 0 points)
  score -= Math.min(Math.abs(maxDD) * 100, 30)

  // Recovery factor contribution (0-20 points)
  score += Math.min(recovery * 10, 20)

  return Math.max(0, Math.min(100, Math.round(score)))
}

export default BacktestAdvancedAnalysis

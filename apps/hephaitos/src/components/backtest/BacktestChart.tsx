'use client'

/**
 * Backtest Chart Component
 * Lightweight Charts 기반 (Recharts 마이그레이션)
 * -200KB 번들 최적화
 */

import { memo, useMemo, useState, useCallback } from 'react'
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChartBarIcon,
  PresentationChartLineIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline'
import { LWAreaChart } from '@/components/charts/LWAreaChart'
import { LWHistogramChart } from '@/components/charts/LWHistogramChart'
import type { BacktestResult, BacktestTrade, PortfolioSnapshot } from '@/lib/backtest'

interface BacktestChartProps {
  result: BacktestResult
  className?: string
}

type ChartType = 'equity' | 'drawdown' | 'trades' | 'monthly'

export const BacktestChart = memo(function BacktestChart({ result, className = '' }: BacktestChartProps) {
  const [chartType, setChartType] = useState<ChartType>('equity')

  const handleChartTypeChange = useCallback((type: ChartType) => {
    setChartType(type)
  }, [])

  return (
    <div className={`border border-white/[0.06] rounded-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <h3 className="text-sm font-medium text-white">차트 분석</h3>
        <div className="flex gap-1">
          <ChartTypeButton
            type="equity"
            current={chartType}
            onClick={handleChartTypeChange}
            icon={PresentationChartLineIcon}
            label="자산"
          />
          <ChartTypeButton
            type="drawdown"
            current={chartType}
            onClick={handleChartTypeChange}
            icon={ArrowTrendingDownIcon}
            label="낙폭"
          />
          <ChartTypeButton
            type="trades"
            current={chartType}
            onClick={handleChartTypeChange}
            icon={ChartBarIcon}
            label="거래"
          />
          <ChartTypeButton
            type="monthly"
            current={chartType}
            onClick={handleChartTypeChange}
            icon={CalendarIcon}
            label="월별"
          />
        </div>
      </div>

      {/* Chart Area */}
      <div className="p-4">
        {chartType === 'equity' && <EquityCurve snapshots={result.equityCurve} trades={result.trades} />}
        {chartType === 'drawdown' && <DrawdownChart snapshots={result.equityCurve} />}
        {chartType === 'trades' && <TradesChart trades={result.trades} />}
        {chartType === 'monthly' && <MonthlyReturnsChart snapshots={result.equityCurve} />}
      </div>
    </div>
  )
})

interface ChartTypeButtonProps {
  type: ChartType
  current: ChartType
  onClick: (type: ChartType) => void
  icon: React.ComponentType<{ className?: string }>
  label: string
}

const ChartTypeButton = memo(function ChartTypeButton({ type, current, onClick, icon: Icon, label }: ChartTypeButtonProps) {
  const isActive = type === current

  const handleClick = useCallback(() => {
    onClick(type)
  }, [onClick, type])

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs transition-colors ${
        isActive
          ? 'bg-white/[0.08] text-white'
          : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]'
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  )
})

// ============================================
// Equity Curve Chart
// ============================================

interface EquityCurveProps {
  snapshots: PortfolioSnapshot[]
  trades: BacktestTrade[]
}

const EquityCurve = memo(function EquityCurve({ snapshots, trades }: EquityCurveProps) {
  const chartData = useMemo(() => {
    if (snapshots.length === 0) return null

    const data = snapshots.map((s) => ({
      time: s.timestamp,
      value: s.equity,
    }))

    const startValue = snapshots[0].equity
    const endValue = snapshots[snapshots.length - 1].equity
    const changePercent = ((endValue - startValue) / startValue) * 100
    const isPositive = changePercent >= 0

    return { data, startValue, endValue, changePercent, isPositive }
  }, [snapshots])

  if (!chartData) {
    return <EmptyChart message="데이터가 없습니다" />
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-xs text-zinc-400">시작 자산</span>
          <p className="text-base font-medium text-white">
            ${chartData.startValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
        </div>
        <div className="text-right space-y-1">
          <span className="text-xs text-zinc-400">최종 자산</span>
          <p className={`text-base font-medium ${chartData.isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
            ${chartData.endValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            <span className="text-sm ml-1">
              ({chartData.isPositive ? '+' : ''}{chartData.changePercent.toFixed(2)}%)
            </span>
          </p>
        </div>
      </div>

      {/* Lightweight Charts Area Chart */}
      <LWAreaChart
        data={chartData.data}
        height={192}
        lineColor={chartData.isPositive ? '#34d399' : '#f87171'}
        areaTopColor={chartData.isPositive ? 'rgba(52, 211, 153, 0.3)' : 'rgba(248, 113, 113, 0.3)'}
        areaBottomColor={chartData.isPositive ? 'rgba(52, 211, 153, 0)' : 'rgba(248, 113, 113, 0)'}
        yAxisFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
      />

      {/* Trade count indicator */}
      <div className="flex items-center gap-2 text-xs text-zinc-400">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          총 {trades.length}건의 거래
        </span>
        <span>•</span>
        <span className="text-emerald-400">{trades.filter(t => t.pnl > 0).length} 승</span>
        <span className="text-red-400">{trades.filter(t => t.pnl <= 0).length} 패</span>
      </div>
    </div>
  )
})

// ============================================
// Drawdown Chart
// ============================================

interface DrawdownChartProps {
  snapshots: PortfolioSnapshot[]
}

const DrawdownChart = memo(function DrawdownChart({ snapshots }: DrawdownChartProps) {
  const chartData = useMemo(() => {
    if (snapshots.length === 0) return null

    let runningMax = 0
    const data = snapshots.map((s) => {
      runningMax = Math.max(runningMax, s.equity)
      const drawdown = ((s.equity - runningMax) / runningMax) * 100
      return {
        time: s.timestamp,
        value: drawdown,
      }
    })

    const maxDrawdown = Math.min(...data.map(d => d.value))
    const currentDrawdown = data[data.length - 1].value

    return { data, maxDrawdown, currentDrawdown }
  }, [snapshots])

  if (!chartData) {
    return <EmptyChart message="데이터가 없습니다" />
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-xs text-zinc-400">최대 낙폭</span>
          <p className="text-base font-medium text-red-400">
            {chartData.maxDrawdown.toFixed(2)}%
          </p>
        </div>
        <div className="text-right space-y-1">
          <span className="text-xs text-zinc-400">현재 낙폭</span>
          <p className="text-base font-medium text-zinc-400">
            {chartData.currentDrawdown.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Lightweight Charts Area Chart */}
      <LWAreaChart
        data={chartData.data}
        height={192}
        lineColor="#f87171"
        areaTopColor="rgba(248, 113, 113, 0.3)"
        areaBottomColor="rgba(248, 113, 113, 0)"
        referenceLine={0}
        yAxisFormatter={(v) => `${v.toFixed(0)}%`}
      />

      {/* Drawdown distribution */}
      <div className="grid grid-cols-4 gap-2">
        {[5, 10, 15, 20].map(threshold => {
          const periods = chartData.data.filter(d => d.value <= -threshold).length
          const percent = (periods / chartData.data.length * 100).toFixed(1)
          return (
            <div key={threshold} className="text-center">
              <p className="text-xs text-zinc-500">&gt;{threshold}% 낙폭</p>
              <p className="text-sm font-medium text-zinc-400">{percent}%</p>
            </div>
          )
        })}
      </div>
    </div>
  )
})

// ============================================
// Trades Chart
// ============================================

interface TradesChartProps {
  trades: BacktestTrade[]
}

const TradesChart = memo(function TradesChart({ trades }: TradesChartProps) {
  const chartData = useMemo(() => {
    if (trades.length === 0) return null

    const data = trades.slice(-50).map((t, i) => ({
      time: i,
      value: t.pnl,
    }))

    const wins = trades.filter(t => t.pnl > 0).length
    const losses = trades.filter(t => t.pnl <= 0).length
    const totalPnl = trades.reduce((sum, t) => sum + t.pnl, 0)
    const avgWin = wins > 0 ? trades.filter(t => t.pnl > 0).reduce((s, t) => s + t.pnl, 0) / wins : 0
    const avgLoss = losses > 0 ? trades.filter(t => t.pnl <= 0).reduce((s, t) => s + t.pnl, 0) / losses : 0

    return { data, wins, losses, totalPnl, avgWin, avgLoss }
  }, [trades])

  if (!chartData) {
    return <EmptyChart message="거래 내역이 없습니다" />
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-4 gap-4">
        <div className="space-y-1">
          <span className="text-xs text-zinc-400">승리</span>
          <p className="text-base font-medium text-emerald-400">{chartData.wins}</p>
        </div>
        <div className="space-y-1">
          <span className="text-xs text-zinc-400">패배</span>
          <p className="text-base font-medium text-red-400">{chartData.losses}</p>
        </div>
        <div className="space-y-1">
          <span className="text-xs text-zinc-400">평균 수익</span>
          <p className="text-sm font-medium text-emerald-400">${chartData.avgWin.toFixed(2)}</p>
        </div>
        <div className="space-y-1">
          <span className="text-xs text-zinc-400">평균 손실</span>
          <p className="text-sm font-medium text-red-400">${chartData.avgLoss.toFixed(2)}</p>
        </div>
      </div>

      {/* Lightweight Charts Histogram */}
      <LWHistogramChart
        data={chartData.data}
        height={160}
        yAxisFormatter={(v) => `$${v.toFixed(0)}`}
      />

      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-400">
          최근 {Math.min(50, trades.length)}개 거래 손익
        </p>
        <p className={`text-sm font-medium ${chartData.totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          총 손익: ${chartData.totalPnl.toFixed(2)}
        </p>
      </div>
    </div>
  )
})

// ============================================
// Monthly Returns Chart
// ============================================

interface MonthlyReturnsChartProps {
  snapshots: PortfolioSnapshot[]
}

const MonthlyReturnsChart = memo(function MonthlyReturnsChart({ snapshots }: MonthlyReturnsChartProps) {
  const chartData = useMemo(() => {
    if (snapshots.length === 0) return null

    // Group by month
    const monthlyData: Record<string, { start: number; end: number }> = {}

    snapshots.forEach(s => {
      const date = new Date(s.timestamp)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

      if (!monthlyData[key]) {
        monthlyData[key] = { start: s.equity, end: s.equity }
      } else {
        monthlyData[key].end = s.equity
      }
    })

    const entries = Object.entries(monthlyData).slice(-12) // Last 12 months
    const data = entries.map(([month, values], i) => ({
      time: i,
      value: ((values.end - values.start) / values.start) * 100,
    }))

    const positiveMonths = data.filter(d => d.value > 0).length
    const negativeMonths = data.filter(d => d.value <= 0).length
    const avgReturn = data.reduce((s, d) => s + d.value, 0) / data.length

    // For heatmap
    const heatmapData = entries.map(([month, values]) => ({
      month,
      return: ((values.end - values.start) / values.start) * 100,
    }))

    return { data, positiveMonths, negativeMonths, avgReturn, heatmapData }
  }, [snapshots])

  if (!chartData) {
    return <EmptyChart message="월별 데이터가 없습니다" />
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-xs text-zinc-400">수익 월</span>
          <p className="text-base font-medium text-emerald-400">{chartData.positiveMonths}개월</p>
        </div>
        <div className="space-y-1">
          <span className="text-xs text-zinc-400">손실 월</span>
          <p className="text-base font-medium text-red-400">{chartData.negativeMonths}개월</p>
        </div>
        <div className="text-right space-y-1">
          <span className="text-xs text-zinc-400">평균 월 수익</span>
          <p className={`text-base font-medium ${chartData.avgReturn >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {chartData.avgReturn >= 0 ? '+' : ''}{chartData.avgReturn.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Lightweight Charts Histogram with trend line */}
      <LWHistogramChart
        data={chartData.data}
        height={160}
        showTrendLine={true}
        trendLineColor="#5E6AD2"
        yAxisFormatter={(v) => `${v.toFixed(0)}%`}
      />

      {/* Monthly Returns Heatmap */}
      <div className="space-y-2">
        <span className="text-xs text-zinc-400">월별 수익률 분포</span>
        <div className="grid grid-cols-6 gap-1">
          {chartData.heatmapData.map((d, i) => {
            const intensity = Math.min(Math.abs(d.return) / 10, 1) // Normalize to max 10%
            const bgColor = d.return >= 0
              ? `rgba(52, 211, 153, ${0.2 + intensity * 0.6})`
              : `rgba(248, 113, 113, ${0.2 + intensity * 0.6})`

            return (
              <div
                key={i}
                className="aspect-square rounded flex items-center justify-center text-[10px] font-medium text-white"
                style={{ backgroundColor: bgColor }}
                title={`${d.month}: ${d.return.toFixed(2)}%`}
              >
                {d.return.toFixed(0)}%
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
})

// ============================================
// Empty Chart Placeholder
// ============================================

const EmptyChart = memo(function EmptyChart({ message }: { message: string }) {
  return (
    <div className="h-48 flex items-center justify-center">
      <div className="text-center">
        <PresentationChartLineIcon className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
        <p className="text-sm text-zinc-400">{message}</p>
      </div>
    </div>
  )
})

export default BacktestChart

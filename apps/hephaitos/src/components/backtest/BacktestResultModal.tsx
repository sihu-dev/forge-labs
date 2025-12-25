/**
 * 백테스트 결과 모달
 */

'use client'

import { useState } from 'react'
import {
  XMarkIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BanknotesIcon,
  ScaleIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'
import { EquityCurveChart } from '@/components/charts/EquityCurveChart'

interface BacktestResultModalProps {
  isOpen: boolean
  onClose: () => void
  result: BacktestResultData | null
}

interface BacktestResultData {
  strategyName: string
  symbol: string
  timeframe: string
  period: {
    start: string
    end: string
  }
  metrics: {
    // 수익률
    totalReturn: number
    annualizedReturn: number

    // 리스크
    sharpeRatio: number
    maxDrawdown: number
    volatility: number

    // 거래
    totalTrades: number
    winRate: number
    profitFactor: number

    // 손익
    avgWin: number
    avgLoss: number

    // 자본
    initialCapital: number
    finalCapital: number
  }
  equityCurve?: Array<{ date: string; value: number }>
  trades?: Array<{
    date: string
    type: 'buy' | 'sell'
    price: number
    quantity: number
    profit?: number
  }>
}

export function BacktestResultModal({
  isOpen,
  onClose,
  result,
}: BacktestResultModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'trades' | 'chart'>('overview')

  if (!isOpen || !result) return null

  const metrics = result.metrics
  const isProfit = metrics.totalReturn > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-4xl bg-[#111113] border border-white/[0.06] rounded-lg overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/[0.06] flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-medium text-white">
                백테스트 결과
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                {result.strategyName} · {result.symbol} · {result.timeframe}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 hover:bg-white/[0.04] rounded transition-colors"
              aria-label="닫기"
            >
              <XMarkIcon className="w-4 h-4 text-zinc-500" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-5 border-b border-white/[0.06] flex gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'overview'
                ? 'border-blue-500 text-white'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            개요
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('chart')}
            className={`px-3 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'chart'
                ? 'border-blue-500 text-white'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            차트
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('trades')}
            className={`px-3 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'trades'
                ? 'border-blue-500 text-white'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            거래내역
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'overview' && (
            <OverviewTab metrics={metrics} period={result.period} />
          )}
          {activeTab === 'chart' && (
            <ChartTab
              equityCurve={result.equityCurve}
              initialCapital={metrics.initialCapital}
            />
          )}
          {activeTab === 'trades' && (
            <TradesTab trades={result.trades} />
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-white/[0.06] flex justify-end gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white rounded text-sm transition-colors"
          >
            닫기
          </button>
          <button
            type="button"
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm font-medium transition-colors"
          >
            전략 저장
          </button>
        </div>
      </div>
    </div>
  )
}

// Overview Tab
function OverviewTab({
  metrics,
  period,
}: {
  metrics: BacktestResultData['metrics']
  period: BacktestResultData['period']
}) {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          icon={BanknotesIcon}
          label="총 수익률"
          value={`${metrics.totalReturn.toFixed(2)}%`}
          trend={metrics.totalReturn > 0 ? 'up' : 'down'}
          color={metrics.totalReturn > 0 ? 'emerald' : 'red'}
        />
        <MetricCard
          icon={ArrowTrendingUpIcon}
          label="연간 수익률"
          value={`${metrics.annualizedReturn.toFixed(2)}%`}
          color="blue"
        />
        <MetricCard
          icon={ScaleIcon}
          label="샤프 비율"
          value={metrics.sharpeRatio.toFixed(2)}
          color="purple"
        />
        <MetricCard
          icon={ArrowTrendingDownIcon}
          label="최대 낙폭"
          value={`${metrics.maxDrawdown.toFixed(2)}%`}
          color="orange"
        />
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 수익 지표 */}
        <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded">
          <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
            <ChartBarIcon className="w-4 h-4 text-emerald-400" />
            수익 지표
          </h4>
          <div className="space-y-2">
            <MetricRow
              label="초기 자본"
              value={`$${metrics.initialCapital.toLocaleString()}`}
            />
            <MetricRow
              label="최종 자본"
              value={`$${metrics.finalCapital.toLocaleString()}`}
              highlight={metrics.finalCapital > metrics.initialCapital}
            />
            <MetricRow
              label="총 수익"
              value={`$${(metrics.finalCapital - metrics.initialCapital).toLocaleString()}`}
              highlight={metrics.finalCapital > metrics.initialCapital}
            />
          </div>
        </div>

        {/* 거래 지표 */}
        <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded">
          <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
            <ClockIcon className="w-4 h-4 text-blue-400" />
            거래 지표
          </h4>
          <div className="space-y-2">
            <MetricRow
              label="총 거래 수"
              value={metrics.totalTrades.toString()}
            />
            <MetricRow
              label="승률"
              value={`${metrics.winRate.toFixed(1)}%`}
              highlight={metrics.winRate > 50}
            />
            <MetricRow
              label="Profit Factor"
              value={metrics.profitFactor.toFixed(2)}
              highlight={metrics.profitFactor > 1}
            />
          </div>
        </div>

        {/* 손익 지표 */}
        <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded">
          <h4 className="text-sm font-medium text-white mb-3">손익 분석</h4>
          <div className="space-y-2">
            <MetricRow
              label="평균 수익"
              value={`$${metrics.avgWin.toFixed(2)}`}
            />
            <MetricRow
              label="평균 손실"
              value={`$${Math.abs(metrics.avgLoss).toFixed(2)}`}
            />
            <MetricRow
              label="수익/손실 비율"
              value={(metrics.avgWin / Math.abs(metrics.avgLoss)).toFixed(2)}
            />
          </div>
        </div>

        {/* 리스크 지표 */}
        <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded">
          <h4 className="text-sm font-medium text-white mb-3">리스크 분석</h4>
          <div className="space-y-2">
            <MetricRow
              label="변동성"
              value={`${metrics.volatility.toFixed(2)}%`}
            />
            <MetricRow
              label="최대 낙폭"
              value={`${metrics.maxDrawdown.toFixed(2)}%`}
            />
            <MetricRow
              label="샤프 비율"
              value={metrics.sharpeRatio.toFixed(2)}
            />
          </div>
        </div>
      </div>

      {/* Period */}
      <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded">
        <p className="text-xs text-blue-400/80">
          백테스트 기간: {new Date(period.start).toLocaleDateString()} ~{' '}
          {new Date(period.end).toLocaleDateString()}
        </p>
      </div>
    </div>
  )
}

// Chart Tab
function ChartTab({
  equityCurve,
  initialCapital,
}: {
  equityCurve?: BacktestResultData['equityCurve']
  initialCapital: number
}) {
  if (!equityCurve || equityCurve.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-400">
        차트 데이터가 없습니다
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded">
        <h4 className="text-sm font-medium text-white mb-3">자산 곡선</h4>
        <EquityCurveChart data={equityCurve} initialCapital={initialCapital} />
      </div>
    </div>
  )
}

// Trades Tab
function TradesTab({
  trades,
}: {
  trades?: BacktestResultData['trades']
}) {
  if (!trades || trades.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-400">
        거래 내역이 없습니다
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/[0.06]">
            <th className="px-3 py-2 text-left text-xs font-medium text-zinc-400">
              날짜
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-zinc-400">
              타입
            </th>
            <th className="px-3 py-2 text-right text-xs font-medium text-zinc-400">
              가격
            </th>
            <th className="px-3 py-2 text-right text-xs font-medium text-zinc-400">
              수량
            </th>
            <th className="px-3 py-2 text-right text-xs font-medium text-zinc-400">
              손익
            </th>
          </tr>
        </thead>
        <tbody>
          {trades.map((trade, index) => (
            <tr
              key={index}
              className="border-b border-white/[0.04] hover:bg-white/[0.02]"
            >
              <td className="px-3 py-2 text-xs text-zinc-400">
                {new Date(trade.date).toLocaleDateString()}
              </td>
              <td className="px-3 py-2">
                <span
                  className={`text-xs font-medium ${
                    trade.type === 'buy' ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {trade.type === 'buy' ? '매수' : '매도'}
                </span>
              </td>
              <td className="px-3 py-2 text-xs text-white text-right">
                ${trade.price.toFixed(2)}
              </td>
              <td className="px-3 py-2 text-xs text-zinc-400 text-right">
                {trade.quantity.toFixed(4)}
              </td>
              <td className="px-3 py-2 text-xs text-right">
                {trade.profit !== undefined && (
                  <span
                    className={
                      trade.profit > 0 ? 'text-emerald-400' : 'text-red-400'
                    }
                  >
                    {trade.profit > 0 ? '+' : ''}${trade.profit.toFixed(2)}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Metric Card Component
function MetricCard({
  icon: Icon,
  label,
  value,
  trend,
  color = 'blue',
}: {
  icon: React.ElementType
  label: string
  value: string
  trend?: 'up' | 'down'
  color?: 'emerald' | 'red' | 'blue' | 'purple' | 'orange'
}) {
  const colorClasses = {
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    red: 'bg-red-500/10 border-red-500/20 text-red-400',
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
    orange: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
  }

  return (
    <div className={`p-3 border rounded ${colorClasses[color]}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" />
        <span className="text-xs">{label}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-lg font-semibold text-white">{value}</span>
        {trend && (
          <span className="text-xs">
            {trend === 'up' ? '↑' : '↓'}
          </span>
        )}
      </div>
    </div>
  )
}

// Metric Row Component
function MetricRow({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-zinc-400">{label}</span>
      <span
        className={`text-xs font-medium ${
          highlight ? 'text-emerald-400' : 'text-white'
        }`}
      >
        {value}
      </span>
    </div>
  )
}

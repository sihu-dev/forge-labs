/**
 * 백테스트 설정 모달
 * QRY-024: 백테스트 연동 강화
 *
 * 사용자로부터 백테스트 실행에 필요한 설정을 입력받습니다.
 * 심볼, 타임프레임, 기간 등을 선택할 수 있습니다.
 */

'use client'

import { useState } from 'react'
import {
  XMarkIcon,
  PlayIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'
import { useI18n } from '@/i18n/client'

/**
 * 백테스트 실행 설정 (API 호환 형식)
 */
export interface BacktestRunConfig {
  symbol: string
  timeframe: string
  initialCapital: number
  startDate: string  // ISO date string (YYYY-MM-DD)
  endDate: string    // ISO date string (YYYY-MM-DD)
  feeRate: number    // Percentage (e.g., 0.1 = 0.1%)
  slippage: number   // Percentage (e.g., 0.05 = 0.05%)
}

interface BacktestConfigModalProps {
  isOpen: boolean
  onClose: () => void
  onRun: (config: BacktestRunConfig) => void
  isRunning?: boolean
  defaultSymbol?: string
}

// 인기 거래쌍
const POPULAR_SYMBOLS = [
  { value: 'BTC/USDT', label: 'BTC/USDT', icon: '₿' },
  { value: 'ETH/USDT', label: 'ETH/USDT', icon: 'Ξ' },
  { value: 'SOL/USDT', label: 'SOL/USDT', icon: '◎' },
  { value: 'AAPL', label: 'Apple (AAPL)', icon: '' },
  { value: 'GOOGL', label: 'Google (GOOGL)', icon: '' },
  { value: 'TSLA', label: 'Tesla (TSLA)', icon: '' },
  { value: 'SPY', label: 'S&P 500 ETF', icon: '' },
  { value: 'QQQ', label: 'Nasdaq 100 ETF', icon: '' },
]

// 타임프레임
const TIMEFRAMES = [
  { value: '1m', label: '1분' },
  { value: '5m', label: '5분' },
  { value: '15m', label: '15분' },
  { value: '1h', label: '1시간' },
  { value: '4h', label: '4시간' },
  { value: '1d', label: '1일' },
  { value: '1w', label: '1주' },
]

// 유틸리티 함수
function getDefaultStartDate(): string {
  const date = new Date()
  date.setMonth(date.getMonth() - 3) // 3개월 전
  return date.toISOString().split('T')[0]
}

function getDefaultEndDate(): string {
  return new Date().toISOString().split('T')[0]
}

export function BacktestConfigModal({
  isOpen,
  onClose,
  onRun,
  isRunning = false,
  defaultSymbol = 'BTC/USDT',
}: BacktestConfigModalProps) {
  const { t } = useI18n()

  // 기본값 설정
  const [config, setConfig] = useState<BacktestRunConfig>({
    symbol: defaultSymbol,
    timeframe: '1h',
    initialCapital: 10000,
    startDate: getDefaultStartDate(),
    endDate: getDefaultEndDate(),
    feeRate: 0.1,     // 0.1%
    slippage: 0.05,   // 0.05%
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onRun(config)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg bg-[#111113] border border-white/[0.06] rounded-lg overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/[0.06] bg-gradient-to-r from-emerald-500/5 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ChartBarIcon className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-medium text-white">
                백테스트 설정
              </h3>
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* 심볼 & 타임프레임 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="symbol"
                className="block text-xs text-zinc-400 mb-1.5 flex items-center gap-1"
              >
                <CurrencyDollarIcon className="w-3.5 h-3.5" />
                거래쌍
              </label>
              <select
                id="symbol"
                value={config.symbol}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, symbol: e.target.value }))
                }
                className="w-full h-9 px-3 bg-white/[0.04] border border-white/[0.06] rounded text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors appearance-none cursor-pointer"
              >
                {POPULAR_SYMBOLS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.icon} {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="timeframe"
                className="block text-xs text-zinc-400 mb-1.5 flex items-center gap-1"
              >
                <ClockIcon className="w-3.5 h-3.5" />
                타임프레임
              </label>
              <select
                id="timeframe"
                value={config.timeframe}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, timeframe: e.target.value }))
                }
                className="w-full h-9 px-3 bg-white/[0.04] border border-white/[0.06] rounded text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors appearance-none cursor-pointer"
              >
                {TIMEFRAMES.map((tf) => (
                  <option key={tf.value} value={tf.value}>
                    {tf.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 초기 자본 */}
          <div>
            <label
              htmlFor="initialCapital"
              className="block text-xs text-zinc-400 mb-1.5"
            >
              초기 자본 (USD)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">$</span>
              <input
                id="initialCapital"
                type="number"
                min="100"
                step="100"
                value={config.initialCapital}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    initialCapital: parseFloat(e.target.value) || 0,
                  }))
                }
                className="w-full h-9 pl-7 pr-3 bg-white/[0.04] border border-white/[0.06] rounded text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                required
              />
            </div>
            {/* 퀵 선택 버튼 */}
            <div className="flex gap-1.5 mt-2">
              {[1000, 5000, 10000, 50000, 100000].map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => setConfig((prev) => ({ ...prev, initialCapital: amount }))}
                  className={`flex-1 py-1 text-xs rounded transition-colors ${
                    config.initialCapital === amount
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-white/[0.02] text-zinc-500 hover:text-zinc-300 border border-white/[0.04]'
                  }`}
                >
                  ${amount >= 1000 ? `${amount / 1000}K` : amount}
                </button>
              ))}
            </div>
          </div>

          {/* 기간 설정 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="startDate"
                className="block text-xs text-zinc-400 mb-1.5"
              >
                시작일
              </label>
              <input
                id="startDate"
                type="date"
                value={config.startDate}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, startDate: e.target.value }))
                }
                className="w-full h-9 px-3 bg-white/[0.04] border border-white/[0.06] rounded text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                required
              />
            </div>
            <div>
              <label
                htmlFor="endDate"
                className="block text-xs text-zinc-400 mb-1.5"
              >
                종료일
              </label>
              <input
                id="endDate"
                type="date"
                value={config.endDate}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, endDate: e.target.value }))
                }
                className="w-full h-9 px-3 bg-white/[0.04] border border-white/[0.06] rounded text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                required
              />
            </div>
          </div>

          {/* 퀵 기간 선택 */}
          <div className="flex gap-1.5">
            {[
              { label: '1개월', months: 1 },
              { label: '3개월', months: 3 },
              { label: '6개월', months: 6 },
              { label: '1년', months: 12 },
              { label: '2년', months: 24 },
            ].map(({ label, months }) => (
              <button
                key={months}
                type="button"
                onClick={() => {
                  const end = new Date()
                  const start = new Date()
                  start.setMonth(start.getMonth() - months)
                  setConfig((prev) => ({
                    ...prev,
                    startDate: start.toISOString().split('T')[0],
                    endDate: end.toISOString().split('T')[0],
                  }))
                }}
                className="flex-1 py-1 text-xs bg-white/[0.02] text-zinc-500 hover:text-zinc-300 border border-white/[0.04] rounded transition-colors"
              >
                {label}
              </button>
            ))}
          </div>

          {/* 수수료 & 슬리피지 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="feeRate"
                className="block text-xs text-zinc-400 mb-1.5"
              >
                수수료율 (%)
              </label>
              <input
                id="feeRate"
                type="number"
                min="0"
                max="5"
                step="0.01"
                value={config.feeRate}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    feeRate: parseFloat(e.target.value) || 0,
                  }))
                }
                className="w-full h-9 px-3 bg-white/[0.04] border border-white/[0.06] rounded text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
              />
            </div>
            <div>
              <label
                htmlFor="slippage"
                className="block text-xs text-zinc-400 mb-1.5"
              >
                슬리피지 (%)
              </label>
              <input
                id="slippage"
                type="number"
                min="0"
                max="5"
                step="0.01"
                value={config.slippage}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    slippage: parseFloat(e.target.value) || 0,
                  }))
                }
                className="w-full h-9 px-3 bg-white/[0.04] border border-white/[0.06] rounded text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
              />
            </div>
          </div>

          {/* 설명 */}
          <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded">
            <p className="text-xs text-blue-400/80">
              백테스트는 과거 데이터를 기반으로 전략의 성과를 시뮬레이션합니다.
              과거 성과는 미래 수익을 보장하지 않습니다.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isRunning}
              className="flex-1 h-10 px-3 bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isRunning}
              className="flex-1 h-10 px-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isRunning ? (
                <>
                  <svg
                    className="w-4 h-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  실행 중...
                </>
              ) : (
                <>
                  <PlayIcon className="w-4 h-4" />
                  백테스트 실행
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

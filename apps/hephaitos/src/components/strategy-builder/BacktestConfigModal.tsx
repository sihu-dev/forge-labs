/**
 * 백테스트 설정 모달
 *
 * 사용자로부터 백테스트 실행에 필요한 설정을 입력받습니다.
 * 전략(strategy)과 심볼(symbol)은 외부에서 제공됩니다.
 */

'use client'

import { useState } from 'react'
import { XMarkIcon, PlayIcon } from '@heroicons/react/24/outline'
import { useI18n } from '@/i18n/client'

/**
 * 백테스트 실행 설정 (모달용)
 * BacktestConfig의 부분 설정 - strategy와 symbol은 외부에서 주입
 */
export interface BacktestRunConfig {
  initialCapital: number
  startDate: number  // Unix timestamp (ms)
  endDate: number    // Unix timestamp (ms)
  commission: number // Percentage (e.g., 0.001 = 0.1%)
  slippage: number   // Percentage
}

interface BacktestConfigModalProps {
  isOpen: boolean
  onClose: () => void
  onRun: (config: BacktestRunConfig) => void
  isRunning?: boolean
}

// 유틸리티 함수
function getDefaultStartTimestamp(): number {
  const date = new Date()
  date.setMonth(date.getMonth() - 3) // 3개월 전
  return date.getTime()
}

function getDefaultEndTimestamp(): number {
  return Date.now()
}

function timestampToDateString(timestamp: number): string {
  return new Date(timestamp).toISOString().split('T')[0]
}

function dateStringToTimestamp(dateStr: string): number {
  return new Date(dateStr).getTime()
}

export function BacktestConfigModal({
  isOpen,
  onClose,
  onRun,
  isRunning = false,
}: BacktestConfigModalProps) {
  const { t } = useI18n()

  // 기본값 설정
  const [config, setConfig] = useState<BacktestRunConfig>({
    initialCapital: 10000,
    startDate: getDefaultStartTimestamp(),
    endDate: getDefaultEndTimestamp(),
    commission: 0.001, // 0.1%
    slippage: 0.0005,  // 0.05%
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onRun(config)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md bg-[#111113] border border-white/[0.06] rounded-lg overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-medium text-white">
              백테스트 설정
            </h3>
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
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* 초기 자본 */}
          <div>
            <label
              htmlFor="initialCapital"
              className="block text-xs text-zinc-400 mb-1.5"
            >
              초기 자본 (USDT)
            </label>
            <input
              id="initialCapital"
              type="number"
              min="100"
              step="100"
              value={config.initialCapital}
              onChange={(e) =>
                setConfig((prev: BacktestRunConfig) => ({
                  ...prev,
                  initialCapital: parseFloat(e.target.value) || 0,
                }))
              }
              className="w-full h-9 px-3 bg-white/[0.04] border border-white/[0.06] rounded text-sm text-white focus:outline-none focus:border-white/[0.12] transition-colors"
              required
            />
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
                value={timestampToDateString(config.startDate)}
                onChange={(e) =>
                  setConfig((prev: BacktestRunConfig) => ({
                    ...prev,
                    startDate: dateStringToTimestamp(e.target.value),
                  }))
                }
                className="w-full h-9 px-3 bg-white/[0.04] border border-white/[0.06] rounded text-sm text-white focus:outline-none focus:border-white/[0.12] transition-colors"
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
                value={timestampToDateString(config.endDate)}
                onChange={(e) =>
                  setConfig((prev: BacktestRunConfig) => ({
                    ...prev,
                    endDate: dateStringToTimestamp(e.target.value),
                  }))
                }
                className="w-full h-9 px-3 bg-white/[0.04] border border-white/[0.06] rounded text-sm text-white focus:outline-none focus:border-white/[0.12] transition-colors"
                required
              />
            </div>
          </div>

          {/* 수수료 & 슬리피지 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="commission"
                className="block text-xs text-zinc-400 mb-1.5"
              >
                수수료율 (%)
              </label>
              <input
                id="commission"
                type="number"
                min="0"
                max="5"
                step="0.01"
                value={(config.commission * 100).toFixed(2)}
                onChange={(e) =>
                  setConfig((prev: BacktestRunConfig) => ({
                    ...prev,
                    commission: (parseFloat(e.target.value) || 0) / 100,
                  }))
                }
                className="w-full h-9 px-3 bg-white/[0.04] border border-white/[0.06] rounded text-sm text-white focus:outline-none focus:border-white/[0.12] transition-colors"
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
                value={(config.slippage * 100).toFixed(2)}
                onChange={(e) =>
                  setConfig((prev: BacktestRunConfig) => ({
                    ...prev,
                    slippage: (parseFloat(e.target.value) || 0) / 100,
                  }))
                }
                className="w-full h-9 px-3 bg-white/[0.04] border border-white/[0.06] rounded text-sm text-white focus:outline-none focus:border-white/[0.12] transition-colors"
              />
            </div>
          </div>

          {/* 설명 */}
          <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded">
            <p className="text-xs text-blue-400/80">
              백테스트는 과거 데이터를 기반으로 전략의 성과를 시뮬레이션합니다.
              실제 거래 결과와 다를 수 있습니다.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isRunning}
              className="flex-1 h-9 px-3 bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isRunning}
              className="flex-1 h-9 px-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

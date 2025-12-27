/**
 * 백테스트 진행 상황 모달
 * 실시간으로 백테스트 실행 진행 상황을 표시
 */

'use client'

import { useEffect, useState } from 'react'
import {
  XMarkIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'

export interface BacktestProgress {
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: number // 0-100
  message: string
  currentStep?: string
  totalSteps?: number
  currentStepIndex?: number
  estimatedTimeRemaining?: number // seconds
}

interface BacktestProgressModalProps {
  isOpen: boolean
  onClose: () => void
  backtestId: string | null
  initialProgress?: BacktestProgress
}

export function BacktestProgressModal({
  isOpen,
  onClose,
  backtestId,
  initialProgress,
}: BacktestProgressModalProps) {
  const [progress, setProgress] = useState<BacktestProgress>(
    initialProgress || {
      status: 'pending',
      progress: 0,
      message: '백테스트 시작 중...',
    }
  )

  // 진행 상황 폴링
  useEffect(() => {
    if (!isOpen || !backtestId) return

    let intervalId: NodeJS.Timeout | null = null

    const pollProgress = async () => {
      try {
        const response = await fetch(`/api/backtest/status/${backtestId}`)
        if (!response.ok) return

        const data = await response.json()
        if (data.success && data.progress) {
          setProgress(data.progress)

          // 완료 또는 실패 시 폴링 중지
          if (data.progress.status === 'completed' || data.progress.status === 'failed') {
            if (intervalId) clearInterval(intervalId)
          }
        }
      } catch (error) {
        console.error('Failed to poll backtest progress:', error)
      }
    }

    // 즉시 첫 번째 폴링 실행
    pollProgress()

    // 1초마다 폴링
    intervalId = setInterval(pollProgress, 1000)

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [isOpen, backtestId])

  if (!isOpen) return null

  const isComplete = progress.status === 'completed'
  const isFailed = progress.status === 'failed'
  const isRunning = progress.status === 'running'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md bg-[#111113] border border-white/[0.06] rounded-lg overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/[0.06] bg-gradient-to-r from-blue-500/5 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ChartBarIcon className="w-5 h-5 text-blue-400" />
              <h3 className="text-base font-medium text-white">
                {isComplete
                  ? '백테스트 완료'
                  : isFailed
                  ? '백테스트 실패'
                  : '백테스트 실행 중'}
              </h3>
            </div>
            {(isComplete || isFailed) && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 hover:bg-white/[0.04] rounded transition-colors"
                aria-label="닫기"
              >
                <XMarkIcon className="w-4 h-4 text-zinc-500" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Status Icon */}
          <div className="flex justify-center">
            {isComplete && (
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <CheckCircleIcon className="w-10 h-10 text-emerald-400" />
              </div>
            )}
            {isFailed && (
              <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <ExclamationCircleIcon className="w-10 h-10 text-red-400" />
              </div>
            )}
            {isRunning && (
              <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <svg
                  className="w-10 h-10 animate-spin text-blue-400"
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
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-400">{progress.message}</span>
              <span className="text-white font-medium">{progress.progress}%</span>
            </div>
            <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  isComplete
                    ? 'bg-emerald-500'
                    : isFailed
                    ? 'bg-red-500'
                    : 'bg-blue-500'
                }`}
                style={{ width: `${progress.progress}%` }}
              />
            </div>
          </div>

          {/* Steps Indicator */}
          {progress.totalSteps && progress.currentStepIndex !== undefined && (
            <div className="flex items-center justify-center gap-2">
              {Array.from({ length: progress.totalSteps }).map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    index < progress.currentStepIndex!
                      ? 'bg-blue-500'
                      : index === progress.currentStepIndex!
                      ? 'bg-blue-400'
                      : 'bg-white/[0.06]'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Current Step */}
          {progress.currentStep && (
            <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded">
              <p className="text-xs text-blue-400/80">{progress.currentStep}</p>
            </div>
          )}

          {/* Estimated Time */}
          {isRunning && progress.estimatedTimeRemaining !== undefined && (
            <div className="flex items-center justify-center gap-2 text-sm text-zinc-400">
              <ClockIcon className="w-4 h-4" />
              <span>
                예상 남은 시간: {formatTime(progress.estimatedTimeRemaining)}
              </span>
            </div>
          )}

          {/* Error Message */}
          {isFailed && (
            <div className="p-3 bg-red-500/5 border border-red-500/10 rounded">
              <p className="text-xs text-red-400">{progress.message}</p>
            </div>
          )}

          {/* Success Message */}
          {isComplete && (
            <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded">
              <p className="text-xs text-emerald-400">
                백테스트가 성공적으로 완료되었습니다!
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {(isComplete || isFailed) && (
          <div className="px-5 py-4 border-t border-white/[0.06] flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm font-medium transition-colors"
            >
              {isComplete ? '결과 보기' : '닫기'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// Helper: Format seconds to human-readable time
function formatTime(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}초`
  }
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.round(seconds % 60)
  if (minutes < 60) {
    return remainingSeconds > 0
      ? `${minutes}분 ${remainingSeconds}초`
      : `${minutes}분`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes > 0
    ? `${hours}시간 ${remainingMinutes}분`
    : `${hours}시간`
}

/**
 * 백테스트 API 훅
 */

import { useState, useCallback } from 'react'
import type { Node, Edge } from 'reactflow'

export interface BacktestConfigAPI {
  initialCapital: number
  startDate: string
  endDate: string
  feeRate?: number
  slippage?: number
}

export interface BacktestResultAPI {
  strategyId: string
  backtestId: string
  status: 'queued' | 'running' | 'completed' | 'failed'
  strategy?: {
    name: string
    description: string
    symbols: string[]
    timeframe: string
  }
  // 완료된 경우의 결과 데이터
  resultData?: BacktestResultData
}

export interface BacktestResultData {
  strategyName: string
  symbol: string
  timeframe: string
  period: {
    start: string
    end: string
  }
  metrics: {
    totalReturn: number
    annualizedReturn: number
    sharpeRatio: number
    maxDrawdown: number
    volatility: number
    totalTrades: number
    winRate: number
    profitFactor: number
    avgWin: number
    avgLoss: number
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

export function useBacktestAPI() {
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<BacktestResultAPI | null>(null)

  const runBacktest = useCallback(
    async (
      strategyName: string,
      nodes: Node[],
      edges: Edge[],
      config: BacktestConfigAPI,
      strategyDescription?: string
    ): Promise<BacktestResultAPI | null> => {
      setIsRunning(true)
      setError(null)
      setResult(null)

      try {
        const response = await fetch('/api/backtest/run', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            strategyName,
            strategyDescription,
            nodes,
            edges,
            config,
          }),
        })

        const data = await response.json()

        if (!response.ok || !data.success) {
          throw new Error(data.error || data.message || '백테스트 실행 실패')
        }

        // 결과에 resultData가 포함되어 있으면 completed 상태로 설정
        const backtestResult: BacktestResultAPI = {
          ...data.data,
          status: data.data.resultData ? 'completed' : data.data.status,
        }

        setResult(backtestResult)
        return backtestResult
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '알 수 없는 에러'
        setError(errorMessage)
        return null
      } finally {
        setIsRunning(false)
      }
    },
    []
  )

  const clearResult = useCallback(() => {
    setResult(null)
    setError(null)
  }, [])

  return {
    runBacktest,
    clearResult,
    isRunning,
    error,
    result,
  }
}

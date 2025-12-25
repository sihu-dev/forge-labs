/**
 * useCredits Hook
 * 크레딧 관리를 위한 React Hook
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth/context'

interface Transaction {
  id: string
  amount: number
  type: 'purchase' | 'usage' | 'bonus' | 'refund'
  description: string | null
  metadata: any
  created_at: string
}

export function useCredits() {
  const { user } = useAuth()
  const [balance, setBalance] = useState<number | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 잔액 조회
  const fetchBalance = useCallback(async () => {
    if (!user) {
      setBalance(null)
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/credits/balance')
      const data = await response.json()

      if (data.success) {
        setBalance(data.balance)
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('크레딧 잔액 조회 실패')
    } finally {
      setLoading(false)
    }
  }, [user])

  // 거래 내역 조회
  const fetchHistory = useCallback(
    async (limit: number = 50) => {
      if (!user) return

      try {
        const response = await fetch(`/api/credits/history?limit=${limit}`)
        const data = await response.json()

        if (data.success) {
          setTransactions(data.transactions)
        }
      } catch (err) {
        console.error('Failed to fetch transaction history:', err)
      }
    },
    [user]
  )

  // 크레딧 사용
  const useCreditsAmount = useCallback(
    async (
      amount: number,
      description: string,
      metadata?: Record<string, any>
    ): Promise<{ success: boolean; error?: string }> => {
      if (!user) {
        return { success: false, error: '로그인이 필요합니다' }
      }

      try {
        const response = await fetch('/api/credits/use', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount,
            description,
            metadata,
          }),
        })

        const data = await response.json()

        if (data.success) {
          setBalance(data.newBalance)
          await fetchHistory() // 내역 갱신
          return { success: true }
        } else {
          return { success: false, error: data.error }
        }
      } catch (err) {
        return { success: false, error: '크레딧 사용 실패' }
      }
    },
    [user, fetchHistory]
  )

  // 초기 로딩
  useEffect(() => {
    fetchBalance()
    fetchHistory()
  }, [fetchBalance, fetchHistory])

  return {
    balance,
    transactions,
    loading,
    error,
    refetch: fetchBalance,
    refetchHistory: fetchHistory,
    useCredits: useCreditsAmount,
  }
}

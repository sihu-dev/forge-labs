/**
 * Triggers Hook
 * 트리거 관리를 위한 React Hook
 */

'use client'

import { useState, useCallback } from 'react'
import type { Trigger, TriggerCondition, TriggerAction } from '@/lib/triggers'

interface UseTriggerResult {
  triggers: Trigger[]
  loading: boolean
  error: string | null
  fetchTriggers: () => Promise<void>
  createTrigger: (input: CreateTriggerParams) => Promise<Trigger | null>
  updateTrigger: (id: string, input: UpdateTriggerParams) => Promise<Trigger | null>
  deleteTrigger: (id: string) => Promise<boolean>
  activateTrigger: (id: string) => Promise<Trigger | null>
  pauseTrigger: (id: string) => Promise<Trigger | null>
}

interface CreateTriggerParams {
  name: string
  conditions: TriggerCondition[]
  actions: TriggerAction[]
  cooldown?: number
  maxExecutions?: number
  expiresAt?: string
  metadata?: Record<string, unknown>
}

interface UpdateTriggerParams {
  name?: string
  conditions?: TriggerCondition[]
  actions?: TriggerAction[]
  cooldown?: number
  maxExecutions?: number
  expiresAt?: string
  metadata?: Record<string, unknown>
}

export function useTriggers(): UseTriggerResult {
  const [triggers, setTriggers] = useState<Trigger[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTriggers = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/triggers')
      const data = await response.json()

      if (data.success) {
        setTriggers(data.data)
      } else {
        setError(data.error || '트리거 목록 조회 실패')
      }
    } catch (err) {
      setError('네트워크 오류')
    } finally {
      setLoading(false)
    }
  }, [])

  const createTrigger = useCallback(async (input: CreateTriggerParams): Promise<Trigger | null> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/triggers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })

      const data = await response.json()

      if (data.success) {
        setTriggers(prev => [data.data, ...prev])
        return data.data
      } else {
        setError(data.error || '트리거 생성 실패')
        return null
      }
    } catch (err) {
      setError('네트워크 오류')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const updateTrigger = useCallback(async (id: string, input: UpdateTriggerParams): Promise<Trigger | null> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/triggers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })

      const data = await response.json()

      if (data.success) {
        setTriggers(prev => prev.map(t => t.id === id ? data.data : t))
        return data.data
      } else {
        setError(data.error || '트리거 수정 실패')
        return null
      }
    } catch (err) {
      setError('네트워크 오류')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteTrigger = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/triggers/${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        setTriggers(prev => prev.filter(t => t.id !== id))
        return true
      } else {
        setError(data.error || '트리거 삭제 실패')
        return false
      }
    } catch (err) {
      setError('네트워크 오류')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const activateTrigger = useCallback(async (id: string): Promise<Trigger | null> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/triggers/${id}/activate`, {
        method: 'POST',
      })

      const data = await response.json()

      if (data.success) {
        setTriggers(prev => prev.map(t => t.id === id ? data.data : t))
        return data.data
      } else {
        setError(data.error || '트리거 활성화 실패')
        return null
      }
    } catch (err) {
      setError('네트워크 오류')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const pauseTrigger = useCallback(async (id: string): Promise<Trigger | null> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/triggers/${id}/pause`, {
        method: 'POST',
      })

      const data = await response.json()

      if (data.success) {
        setTriggers(prev => prev.map(t => t.id === id ? data.data : t))
        return data.data
      } else {
        setError(data.error || '트리거 일시정지 실패')
        return null
      }
    } catch (err) {
      setError('네트워크 오류')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    triggers,
    loading,
    error,
    fetchTriggers,
    createTrigger,
    updateTrigger,
    deleteTrigger,
    activateTrigger,
    pauseTrigger,
  }
}

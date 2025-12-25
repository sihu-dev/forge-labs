/**
 * Exchange Key Manager
 * 거래소 API 키 관리 컴포넌트
 */

'use client'

import { useState, useEffect } from 'react'
import {
  KeyIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'

interface ExchangeKey {
  exchange: 'binance' | 'upbit'
  apiKey: string
  apiSecret: string
  testConnection?: boolean
}

interface ExchangeKeyManagerProps {
  userId: string
}

export function ExchangeKeyManager({ userId }: ExchangeKeyManagerProps) {
  const [binanceKey, setBinanceKey] = useState('')
  const [binanceSecret, setBinanceSecret] = useState('')
  const [upbitKey, setUpbitKey] = useState('')
  const [upbitSecret, setUpbitSecret] = useState('')

  const [binanceExists, setBinanceExists] = useState(false)
  const [upbitExists, setUpbitExists] = useState(false)

  const [loading, setLoading] = useState(false)
  const [testingExchange, setTestingExchange] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Load existing keys on mount
  useEffect(() => {
    loadExistingKeys()
  }, [])

  const loadExistingKeys = async () => {
    try {
      const response = await fetch('/api/exchange/keys')
      const data = await response.json()

      if (data.success) {
        setBinanceExists(data.keys.binance?.exists || false)
        setUpbitExists(data.keys.upbit?.exists || false)
      }
    } catch (error) {
      console.error('Failed to load exchange keys:', error)
    }
  }

  const handleSaveKey = async (exchange: 'binance' | 'upbit') => {
    setLoading(true)
    setMessage(null)

    const apiKey = exchange === 'binance' ? binanceKey : upbitKey
    const apiSecret = exchange === 'binance' ? binanceSecret : upbitSecret

    if (!apiKey || !apiSecret) {
      setMessage({ type: 'error', text: 'API 키와 시크릿을 모두 입력해주세요' })
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/exchange/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exchange,
          apiKey,
          apiSecret,
        }),
      })

      const data = await response.json()

      if (data.success) {
        const exchangeName = exchange.toUpperCase()
        setMessage({ type: 'success', text: exchangeName + ' API 키가 저장되었습니다' })

        if (exchange === 'binance') {
          setBinanceExists(true)
          setBinanceKey('')
          setBinanceSecret('')
        } else {
          setUpbitExists(true)
          setUpbitKey('')
          setUpbitSecret('')
        }

        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage({ type: 'error', text: data.error || 'API 키 저장 실패' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: '네트워크 오류가 발생했습니다' })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteKey = async (exchange: 'binance' | 'upbit') => {
    const exchangeName = exchange.toUpperCase()
    if (!confirm(exchangeName + ' API 키를 삭제하시겠습니까?')) {
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/exchange/keys?exchange=' + exchange, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        setMessage({ type: 'success', text: exchangeName + ' API 키가 삭제되었습니다' })

        if (exchange === 'binance') {
          setBinanceExists(false)
        } else {
          setUpbitExists(false)
        }

        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage({ type: 'error', text: data.error || 'API 키 삭제 실패' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: '네트워크 오류가 발생했습니다' })
    } finally {
      setLoading(false)
    }
  }

  const handleTestConnection = async (exchange: 'binance' | 'upbit') => {
    setTestingExchange(exchange)
    setMessage(null)

    try {
      const response = await fetch('/api/exchange/test?exchange=' + exchange)
      const data = await response.json()

      const exchangeName = exchange.toUpperCase()
      if (data.success) {
        setMessage({ type: 'success', text: exchangeName + ' 연결 성공!' })
      } else {
        setMessage({ type: 'error', text: data.error || '연결 실패' })
      }

      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      setMessage({ type: 'error', text: '연결 테스트 실패' })
    } finally {
      setTestingExchange(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Messages */}
      {message && (
        <div className={'p-4 rounded-lg border ' + (
          message.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        )}>
          {message.text}
        </div>
      )}

      {/* Binance */}
      <ExchangeKeyCard
        exchange="binance"
        name="Binance"
        exists={binanceExists}
        apiKey={binanceKey}
        apiSecret={binanceSecret}
        onApiKeyChange={setBinanceKey}
        onApiSecretChange={setBinanceSecret}
        onSave={() => handleSaveKey('binance')}
        onDelete={() => handleDeleteKey('binance')}
        onTest={() => handleTestConnection('binance')}
        loading={loading}
        testing={testingExchange === 'binance'}
      />

      {/* Upbit */}
      <ExchangeKeyCard
        exchange="upbit"
        name="Upbit"
        exists={upbitExists}
        apiKey={upbitKey}
        apiSecret={upbitSecret}
        onApiKeyChange={setUpbitKey}
        onApiSecretChange={setUpbitSecret}
        onSave={() => handleSaveKey('upbit')}
        onDelete={() => handleDeleteKey('upbit')}
        onTest={() => handleTestConnection('upbit')}
        loading={loading}
        testing={testingExchange === 'upbit'}
      />
    </div>
  )
}

interface ExchangeKeyCardProps {
  exchange: string
  name: string
  exists: boolean
  apiKey: string
  apiSecret: string
  onApiKeyChange: (value: string) => void
  onApiSecretChange: (value: string) => void
  onSave: () => void
  onDelete: () => void
  onTest: () => void
  loading: boolean
  testing: boolean
}

function ExchangeKeyCard({
  exchange,
  name,
  exists,
  apiKey,
  apiSecret,
  onApiKeyChange,
  onApiSecretChange,
  onSave,
  onDelete,
  onTest,
  loading,
  testing,
}: ExchangeKeyCardProps) {
  return (
    <div className="bg-[#111113] border border-white/[0.06] rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/[0.04] rounded-lg flex items-center justify-center">
            <KeyIcon className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-base font-medium text-white">{name}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              {exists ? (
                <>
                  <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-emerald-400">연동됨</span>
                </>
              ) : (
                <>
                  <XCircleIcon className="w-4 h-4 text-zinc-500" />
                  <span className="text-xs text-zinc-500">미연동</span>
                </>
              )}
            </div>
          </div>
        </div>

        {exists && (
          <div className="flex gap-2">
            <button
              onClick={onTest}
              disabled={loading || testing}
              className="h-8 px-3 border border-white/[0.06] hover:bg-white/[0.04] text-zinc-300 rounded text-xs transition-colors disabled:opacity-50"
            >
              {testing ? '테스트 중...' : '연결 테스트'}
            </button>
            <button
              onClick={onDelete}
              disabled={loading}
              className="h-8 px-3 border border-red-500/20 hover:bg-red-500/10 text-red-400 rounded text-xs transition-colors disabled:opacity-50"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {!exists && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-zinc-400 mb-2">
              API Key
            </label>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => onApiKeyChange(e.target.value)}
              placeholder="API 키를 입력하세요"
              className="w-full h-10 px-3 bg-white/[0.04] border border-white/[0.06] rounded text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/[0.12] transition-colors font-mono"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-2">
              API Secret
            </label>
            <input
              type="password"
              value={apiSecret}
              onChange={(e) => onApiSecretChange(e.target.value)}
              placeholder="API 시크릿을 입력하세요"
              className="w-full h-10 px-3 bg-white/[0.04] border border-white/[0.06] rounded text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/[0.12] transition-colors font-mono"
            />
          </div>

          <button
            onClick={onSave}
            disabled={loading || !apiKey || !apiSecret}
            className="w-full h-10 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '저장 중...' : 'API 키 저장'}
          </button>
        </div>
      )}
    </div>
  )
}

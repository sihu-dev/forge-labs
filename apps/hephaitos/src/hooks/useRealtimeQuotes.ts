/**
 * Real-time Quotes Hook
 * QRY-019: 실시간 시세 구독 훅
 *
 * ⚠️ 면책조항: 실시간 시세는 참고용이며, 투자 조언이 아닙니다.
 */

'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

export interface RealtimeTrade {
  type: 'trade'
  symbol: string
  price: number
  size: number
  exchange: string
  timestamp: string
}

export interface RealtimeQuote {
  type: 'quote'
  symbol: string
  bidPrice: number
  bidSize: number
  askPrice: number
  askSize: number
  timestamp: string
}

export interface RealtimeBar {
  type: 'bar'
  symbol: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  timestamp: string
}

export interface OrderUpdate {
  type: 'orderUpdate'
  event: string
  orderId: string
  symbol: string
  side: 'buy' | 'sell'
  orderType: string
  quantity: number
  filledQuantity: number
  filledAvgPrice: number | null
  timestamp: string
}

export type RealtimeData = RealtimeTrade | RealtimeQuote | RealtimeBar | OrderUpdate

export interface UseRealtimeQuotesOptions {
  symbols: string[]
  types?: ('trades' | 'quotes' | 'bars')[]
  enabled?: boolean
  onTrade?: (trade: RealtimeTrade) => void
  onQuote?: (quote: RealtimeQuote) => void
  onBar?: (bar: RealtimeBar) => void
  onOrderUpdate?: (update: OrderUpdate) => void
  onError?: (error: Error) => void
}

export interface UseRealtimeQuotesReturn {
  isConnected: boolean
  lastTrades: Map<string, RealtimeTrade>
  lastQuotes: Map<string, RealtimeQuote>
  latestBar: RealtimeBar | null
  reconnect: () => void
  disconnect: () => void
}

// ═══════════════════════════════════════════════════════════════
// Hook
// ═══════════════════════════════════════════════════════════════

export function useRealtimeQuotes(
  options: UseRealtimeQuotesOptions
): UseRealtimeQuotesReturn {
  const {
    symbols,
    types = ['trades', 'quotes'],
    enabled = true,
    onTrade,
    onQuote,
    onBar,
    onOrderUpdate,
    onError,
  } = options

  const [isConnected, setIsConnected] = useState(false)
  const [lastTrades, setLastTrades] = useState<Map<string, RealtimeTrade>>(new Map())
  const [lastQuotes, setLastQuotes] = useState<Map<string, RealtimeQuote>>(new Map())
  const [latestBar, setLatestBar] = useState<RealtimeBar | null>(null)

  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)

  const connect = useCallback(() => {
    if (symbols.length === 0 || !enabled) return

    // 기존 연결 정리
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    const params = new URLSearchParams({
      symbols: symbols.join(','),
      types: types.join(','),
    })

    const url = `/api/exchange/stream?${params.toString()}`

    try {
      const eventSource = new EventSource(url)
      eventSourceRef.current = eventSource

      eventSource.onopen = () => {
        setIsConnected(true)
        reconnectAttemptsRef.current = 0
        console.log('[useRealtimeQuotes] Connected')
      }

      eventSource.onerror = () => {
        setIsConnected(false)
        eventSource.close()

        // 지수 백오프 재연결
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000)
        reconnectAttemptsRef.current++

        if (reconnectAttemptsRef.current <= 5) {
          console.log(`[useRealtimeQuotes] Reconnecting in ${delay}ms...`)
          reconnectTimeoutRef.current = setTimeout(connect, delay)
        } else {
          onError?.(new Error('Failed to connect after 5 attempts'))
        }
      }

      // 이벤트 핸들러
      eventSource.addEventListener('connected', (event) => {
        const data = JSON.parse(event.data)
        console.log('[useRealtimeQuotes] Stream connected', data)
      })

      eventSource.addEventListener('trade', (event) => {
        const trade = JSON.parse(event.data) as RealtimeTrade
        setLastTrades(prev => {
          const next = new Map(prev)
          next.set(trade.symbol, trade)
          return next
        })
        onTrade?.(trade)
      })

      eventSource.addEventListener('quote', (event) => {
        const quote = JSON.parse(event.data) as RealtimeQuote
        setLastQuotes(prev => {
          const next = new Map(prev)
          next.set(quote.symbol, quote)
          return next
        })
        onQuote?.(quote)
      })

      eventSource.addEventListener('bar', (event) => {
        const bar = JSON.parse(event.data) as RealtimeBar
        setLatestBar(bar)
        onBar?.(bar)
      })

      eventSource.addEventListener('orderUpdate', (event) => {
        const update = JSON.parse(event.data) as OrderUpdate
        onOrderUpdate?.(update)
      })

      eventSource.addEventListener('error', (event) => {
        const data = JSON.parse((event as MessageEvent).data)
        onError?.(new Error(data.message))
      })

      eventSource.addEventListener('heartbeat', () => {
        // 하트비트 수신 확인
      })
    } catch (error) {
      console.error('[useRealtimeQuotes] Failed to create EventSource', error)
      onError?.(error instanceof Error ? error : new Error('Connection failed'))
    }
  }, [symbols, types, enabled, onTrade, onQuote, onBar, onOrderUpdate, onError])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }

    setIsConnected(false)
    reconnectAttemptsRef.current = 0
  }, [])

  const reconnect = useCallback(() => {
    disconnect()
    reconnectAttemptsRef.current = 0
    connect()
  }, [connect, disconnect])

  // 컴포넌트 마운트/언마운트 시 연결 관리
  useEffect(() => {
    if (enabled && symbols.length > 0) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [connect, disconnect, enabled, symbols.length])

  // 심볼 변경 시 재연결
  useEffect(() => {
    if (enabled && symbols.length > 0 && isConnected) {
      reconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbols.join(',')])

  return {
    isConnected,
    lastTrades,
    lastQuotes,
    latestBar,
    reconnect,
    disconnect,
  }
}

// ═══════════════════════════════════════════════════════════════
// Convenience Hooks
// ═══════════════════════════════════════════════════════════════

/**
 * 단일 심볼 실시간 가격 훅
 */
export function useRealtimePrice(symbol: string, enabled = true) {
  const [price, setPrice] = useState<number | null>(null)
  const [change, setChange] = useState<number>(0)
  const [changePercent, setChangePercent] = useState<number>(0)
  const prevPriceRef = useRef<number | null>(null)

  const { isConnected, lastTrades } = useRealtimeQuotes({
    symbols: [symbol],
    types: ['trades'],
    enabled,
    onTrade: (trade) => {
      if (prevPriceRef.current !== null) {
        const delta = trade.price - prevPriceRef.current
        setChange(delta)
        setChangePercent((delta / prevPriceRef.current) * 100)
      }
      prevPriceRef.current = trade.price
      setPrice(trade.price)
    },
  })

  return {
    isConnected,
    price,
    change,
    changePercent,
    lastTrade: lastTrades.get(symbol),
  }
}

/**
 * 여러 심볼 실시간 가격 훅
 */
export function useRealtimePrices(symbols: string[], enabled = true) {
  const [prices, setPrices] = useState<Map<string, number>>(new Map())

  const { isConnected, lastTrades, lastQuotes } = useRealtimeQuotes({
    symbols,
    types: ['trades', 'quotes'],
    enabled,
    onTrade: (trade) => {
      setPrices(prev => {
        const next = new Map(prev)
        next.set(trade.symbol, trade.price)
        return next
      })
    },
  })

  return {
    isConnected,
    prices,
    lastTrades,
    lastQuotes,
  }
}

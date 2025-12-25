/**
 * Real-time Market Data Streaming API
 * QRY-019: 실시간 시세 스트리밍 (Server-Sent Events)
 *
 * ⚠️ 면책조항: 실시간 시세는 참고용이며, 투자 조언이 아닙니다.
 */

import { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { safeLogger } from '@/lib/utils/safe-logger'
import {
  createAlpacaWebSocket,
  type AlpacaWSMessage,
} from '@/lib/broker/alpaca-websocket'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// 전역 WebSocket 인스턴스 관리 (메모리 효율)
const activeConnections = new Map<string, {
  ws: ReturnType<typeof createAlpacaWebSocket>
  subscribers: Set<string>
  lastActivity: number
}>()

// 30분 후 미사용 연결 정리
const IDLE_TIMEOUT = 30 * 60 * 1000

/**
 * GET /api/exchange/stream
 * Server-Sent Events로 실시간 시세 스트리밍
 *
 * Query params:
 * - symbols: 심볼 목록 (쉼표 구분) e.g., AAPL,MSFT,GOOGL
 * - types: 데이터 타입 (쉼표 구분) trades,quotes,bars
 */
export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return new Response(JSON.stringify({ error: '로그인이 필요합니다' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { searchParams } = new URL(request.url)
  const symbolsParam = searchParams.get('symbols') || 'AAPL'
  const typesParam = searchParams.get('types') || 'trades'

  const symbols = symbolsParam.split(',').map(s => s.trim().toUpperCase()).filter(Boolean)
  const types = typesParam.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)

  if (symbols.length === 0) {
    return new Response(JSON.stringify({ error: 'At least one symbol is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  safeLogger.info('[Stream API] Starting SSE stream', { userId: user.id, symbols, types })

  // 사용자의 Alpaca 자격 증명 조회
  const { data: credentials } = await supabase
    .from('exchange_credentials')
    .select('api_key, api_secret, is_paper')
    .eq('user_id', user.id)
    .eq('exchange', 'alpaca')
    .single()

  // Alpaca 자격 증명이 없으면 목 데이터 스트리밍
  const useMockData = !credentials?.api_key

  // SSE 스트림 생성
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: string, data: unknown) => {
        const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
        controller.enqueue(encoder.encode(message))
      }

      // 연결 확인 메시지
      sendEvent('connected', {
        symbols,
        types,
        useMockData,
        timestamp: new Date().toISOString(),
      })

      if (useMockData) {
        // 목 데이터 스트리밍 (개발/테스트용)
        const mockInterval = setInterval(() => {
          symbols.forEach(symbol => {
            const basePrice = getBasePriceForSymbol(symbol)
            const price = basePrice * (1 + (Math.random() - 0.5) * 0.002)

            if (types.includes('trades')) {
              sendEvent('trade', {
                type: 'trade',
                symbol,
                price: Math.round(price * 100) / 100,
                size: Math.floor(Math.random() * 100) + 1,
                exchange: 'MOCK',
                timestamp: new Date().toISOString(),
              })
            }

            if (types.includes('quotes')) {
              sendEvent('quote', {
                type: 'quote',
                symbol,
                bidPrice: Math.round((price - 0.01) * 100) / 100,
                askPrice: Math.round((price + 0.01) * 100) / 100,
                bidSize: Math.floor(Math.random() * 500) + 100,
                askSize: Math.floor(Math.random() * 500) + 100,
                timestamp: new Date().toISOString(),
              })
            }
          })
        }, 1000) // 1초마다

        // 연결 종료 처리
        request.signal.addEventListener('abort', () => {
          clearInterval(mockInterval)
          controller.close()
          safeLogger.info('[Stream API] Mock stream closed', { userId: user.id })
        })
      } else {
        // 실제 Alpaca WebSocket 연결
        const wsService = createAlpacaWebSocket({
          apiKey: credentials.api_key,
          apiSecret: credentials.api_secret,
          isPaper: credentials.is_paper ?? true,
          feed: 'iex', // 무료 피드
        })

        // 메시지 콜백
        const unsubscribe = wsService.onMessage((message: AlpacaWSMessage) => {
          switch (message.type) {
            case 'trade':
              if (types.includes('trades')) {
                sendEvent('trade', message)
              }
              break
            case 'quote':
              if (types.includes('quotes')) {
                sendEvent('quote', message)
              }
              break
            case 'bar':
              if (types.includes('bars')) {
                sendEvent('bar', message)
              }
              break
            case 'orderUpdate':
              sendEvent('orderUpdate', message)
              break
          }
        })

        // 에러 콜백
        wsService.onError((error) => {
          sendEvent('error', { message: error.message })
        })

        // 연결 시작
        const connected = await wsService.connectMarketData()

        if (!connected) {
          sendEvent('error', { message: 'Failed to connect to market data stream' })
          controller.close()
          return
        }

        // 구독 시작
        if (types.includes('trades')) {
          wsService.subscribeTrades(symbols)
        }
        if (types.includes('quotes')) {
          wsService.subscribeQuotes(symbols)
        }
        if (types.includes('bars')) {
          wsService.subscribeBars(symbols)
        }

        // 연결 종료 처리
        request.signal.addEventListener('abort', () => {
          unsubscribe()
          wsService.disconnect()
          controller.close()
          safeLogger.info('[Stream API] WebSocket stream closed', { userId: user.id })
        })

        // 트레이딩 업데이트도 구독
        wsService.connectTrading().catch((error) => {
          safeLogger.warn('[Stream API] Trading WebSocket failed', { error })
        })
      }

      // 30초마다 하트비트
      const heartbeatInterval = setInterval(() => {
        try {
          sendEvent('heartbeat', { timestamp: new Date().toISOString() })
        } catch {
          clearInterval(heartbeatInterval)
        }
      }, 30000)

      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeatInterval)
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Nginx 버퍼링 비활성화
    },
  })
}

/**
 * 심볼별 기본 가격 (목 데이터용)
 */
function getBasePriceForSymbol(symbol: string): number {
  const basePrices: Record<string, number> = {
    AAPL: 195.50,
    MSFT: 415.20,
    GOOGL: 175.80,
    AMZN: 185.40,
    NVDA: 875.30,
    META: 525.60,
    TSLA: 248.90,
    JPM: 195.20,
    V: 280.50,
    JNJ: 155.30,
    BTCUSD: 98500,
    ETHUSD: 3450,
  }
  return basePrices[symbol] || 100 + Math.random() * 200
}

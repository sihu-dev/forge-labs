/**
 * Alpaca WebSocket Service
 * QRY-019: 실시간 시세 및 주문 상태 스트리밍
 *
 * WebSocket Endpoints:
 * - Market Data: wss://stream.data.alpaca.markets/v2/sip (실시간 시세)
 * - Trading: wss://paper-api.alpaca.markets/stream (주문 상태)
 *
 * ⚠️ 면책조항: 실시간 데이터는 참고용이며, 투자 조언이 아닙니다.
 */

import { safeLogger } from '@/lib/utils/safe-logger'

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

export interface AlpacaWSConfig {
  apiKey: string
  apiSecret: string
  isPaper: boolean
  feed?: 'sip' | 'iex' // sip = 실시간 전체, iex = 무료
}

export type AlpacaWSMessageType =
  | 'trade'      // 체결
  | 'quote'      // 호가
  | 'bar'        // 분봉
  | 'orderUpdate' // 주문 상태 변경
  | 'tradeUpdate' // 거래 상태 변경

export interface AlpacaTradeTick {
  type: 'trade'
  symbol: string
  price: number
  size: number
  exchange: string
  timestamp: string
  tape: string
  conditions: string[]
}

export interface AlpacaQuoteTick {
  type: 'quote'
  symbol: string
  bidPrice: number
  bidSize: number
  askPrice: number
  askSize: number
  bidExchange: string
  askExchange: string
  timestamp: string
}

export interface AlpacaBarTick {
  type: 'bar'
  symbol: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  vwap: number
  timestamp: string
}

export interface AlpacaOrderUpdate {
  type: 'orderUpdate'
  event: 'new' | 'fill' | 'partial_fill' | 'canceled' | 'expired' | 'rejected' | 'replaced'
  orderId: string
  symbol: string
  side: 'buy' | 'sell'
  orderType: string
  quantity: number
  filledQuantity: number
  filledAvgPrice: number | null
  limitPrice: number | null
  stopPrice: number | null
  timestamp: string
}

export type AlpacaWSMessage =
  | AlpacaTradeTick
  | AlpacaQuoteTick
  | AlpacaBarTick
  | AlpacaOrderUpdate

export type AlpacaWSCallback = (message: AlpacaWSMessage) => void
export type AlpacaWSErrorCallback = (error: Error) => void

// ═══════════════════════════════════════════════════════════════
// Alpaca WebSocket Service
// ═══════════════════════════════════════════════════════════════

export class AlpacaWebSocketService {
  private config: AlpacaWSConfig
  private dataWs: WebSocket | null = null
  private tradingWs: WebSocket | null = null

  private subscriptions = {
    trades: new Set<string>(),
    quotes: new Set<string>(),
    bars: new Set<string>(),
  }

  private callbacks = new Set<AlpacaWSCallback>()
  private errorCallbacks = new Set<AlpacaWSErrorCallback>()

  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000 // 시작 1초, 지수 증가

  private heartbeatInterval: NodeJS.Timeout | null = null
  private isConnected = false

  constructor(config: AlpacaWSConfig) {
    this.config = config
  }

  // ═══════════════════════════════════════════════════════════════
  // Connection Management
  // ═══════════════════════════════════════════════════════════════

  /**
   * 마켓 데이터 WebSocket 연결
   */
  async connectMarketData(): Promise<boolean> {
    return new Promise((resolve) => {
      const feed = this.config.feed || 'iex'
      const wsUrl = `wss://stream.data.alpaca.markets/v2/${feed}`

      safeLogger.info('[AlpacaWS] Connecting to market data', { wsUrl })

      try {
        this.dataWs = new WebSocket(wsUrl)

        this.dataWs.onopen = () => {
          safeLogger.info('[AlpacaWS] Market data WebSocket opened')
          this.authenticate(this.dataWs!)
        }

        this.dataWs.onmessage = (event) => {
          this.handleMarketDataMessage(event.data)
          if (!this.isConnected) {
            this.isConnected = true
            this.reconnectAttempts = 0
            this.startHeartbeat()
            resolve(true)
          }
        }

        this.dataWs.onerror = (error) => {
          safeLogger.error('[AlpacaWS] Market data WebSocket error', { error })
          this.notifyError(new Error('WebSocket connection error'))
        }

        this.dataWs.onclose = (event) => {
          safeLogger.warn('[AlpacaWS] Market data WebSocket closed', {
            code: event.code,
            reason: event.reason,
          })
          this.isConnected = false
          this.stopHeartbeat()
          this.handleReconnect('data')
        }

        // 연결 타임아웃
        setTimeout(() => {
          if (!this.isConnected) {
            resolve(false)
          }
        }, 10000)
      } catch (error) {
        safeLogger.error('[AlpacaWS] Failed to create WebSocket', { error })
        resolve(false)
      }
    })
  }

  /**
   * 트레이딩 업데이트 WebSocket 연결
   */
  async connectTrading(): Promise<boolean> {
    return new Promise((resolve) => {
      const wsUrl = this.config.isPaper
        ? 'wss://paper-api.alpaca.markets/stream'
        : 'wss://api.alpaca.markets/stream'

      safeLogger.info('[AlpacaWS] Connecting to trading stream', { wsUrl })

      try {
        this.tradingWs = new WebSocket(wsUrl)

        this.tradingWs.onopen = () => {
          safeLogger.info('[AlpacaWS] Trading WebSocket opened')
          this.authenticateTrading(this.tradingWs!)
        }

        this.tradingWs.onmessage = (event) => {
          this.handleTradingMessage(event.data)
        }

        this.tradingWs.onerror = (error) => {
          safeLogger.error('[AlpacaWS] Trading WebSocket error', { error })
        }

        this.tradingWs.onclose = (event) => {
          safeLogger.warn('[AlpacaWS] Trading WebSocket closed', {
            code: event.code,
            reason: event.reason,
          })
          this.handleReconnect('trading')
        }

        // 연결 확인
        setTimeout(() => {
          resolve(this.tradingWs?.readyState === WebSocket.OPEN)
        }, 5000)
      } catch (error) {
        safeLogger.error('[AlpacaWS] Failed to create trading WebSocket', { error })
        resolve(false)
      }
    })
  }

  /**
   * 마켓 데이터 인증
   */
  private authenticate(ws: WebSocket): void {
    const authMessage = {
      action: 'auth',
      key: this.config.apiKey,
      secret: this.config.apiSecret,
    }
    ws.send(JSON.stringify(authMessage))
  }

  /**
   * 트레이딩 스트림 인증
   */
  private authenticateTrading(ws: WebSocket): void {
    const authMessage = {
      action: 'authenticate',
      data: {
        key_id: this.config.apiKey,
        secret_key: this.config.apiSecret,
      },
    }
    ws.send(JSON.stringify(authMessage))

    // 인증 후 트레이드 업데이트 구독
    setTimeout(() => {
      const listenMessage = {
        action: 'listen',
        data: {
          streams: ['trade_updates'],
        },
      }
      ws.send(JSON.stringify(listenMessage))
    }, 1000)
  }

  /**
   * 연결 종료
   */
  disconnect(): void {
    this.stopHeartbeat()
    this.isConnected = false

    if (this.dataWs) {
      this.dataWs.close()
      this.dataWs = null
    }

    if (this.tradingWs) {
      this.tradingWs.close()
      this.tradingWs = null
    }

    this.subscriptions.trades.clear()
    this.subscriptions.quotes.clear()
    this.subscriptions.bars.clear()

    safeLogger.info('[AlpacaWS] Disconnected')
  }

  // ═══════════════════════════════════════════════════════════════
  // Subscriptions
  // ═══════════════════════════════════════════════════════════════

  /**
   * 실시간 체결 구독
   */
  subscribeTrades(symbols: string[]): void {
    symbols.forEach(s => this.subscriptions.trades.add(s))
    this.updateSubscription('trades', symbols)
  }

  /**
   * 실시간 호가 구독
   */
  subscribeQuotes(symbols: string[]): void {
    symbols.forEach(s => this.subscriptions.quotes.add(s))
    this.updateSubscription('quotes', symbols)
  }

  /**
   * 실시간 분봉 구독
   */
  subscribeBars(symbols: string[]): void {
    symbols.forEach(s => this.subscriptions.bars.add(s))
    this.updateSubscription('bars', symbols)
  }

  /**
   * 구독 해제
   */
  unsubscribe(type: 'trades' | 'quotes' | 'bars', symbols: string[]): void {
    symbols.forEach(s => this.subscriptions[type].delete(s))

    if (this.dataWs?.readyState === WebSocket.OPEN) {
      const message = {
        action: 'unsubscribe',
        [type]: symbols,
      }
      this.dataWs.send(JSON.stringify(message))
    }
  }

  /**
   * 전체 구독 해제
   */
  unsubscribeAll(): void {
    if (this.dataWs?.readyState === WebSocket.OPEN) {
      const message = {
        action: 'unsubscribe',
        trades: Array.from(this.subscriptions.trades),
        quotes: Array.from(this.subscriptions.quotes),
        bars: Array.from(this.subscriptions.bars),
      }
      this.dataWs.send(JSON.stringify(message))
    }

    this.subscriptions.trades.clear()
    this.subscriptions.quotes.clear()
    this.subscriptions.bars.clear()
  }

  private updateSubscription(type: 'trades' | 'quotes' | 'bars', symbols: string[]): void {
    if (this.dataWs?.readyState === WebSocket.OPEN) {
      const message = {
        action: 'subscribe',
        [type]: symbols,
      }
      this.dataWs.send(JSON.stringify(message))
      safeLogger.debug('[AlpacaWS] Subscribed', { type, symbols })
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // Callbacks
  // ═══════════════════════════════════════════════════════════════

  /**
   * 메시지 콜백 등록
   */
  onMessage(callback: AlpacaWSCallback): () => void {
    this.callbacks.add(callback)
    return () => this.callbacks.delete(callback)
  }

  /**
   * 에러 콜백 등록
   */
  onError(callback: AlpacaWSErrorCallback): () => void {
    this.errorCallbacks.add(callback)
    return () => this.errorCallbacks.delete(callback)
  }

  private notifyCallbacks(message: AlpacaWSMessage): void {
    this.callbacks.forEach(cb => {
      try {
        cb(message)
      } catch (error) {
        safeLogger.error('[AlpacaWS] Callback error', { error })
      }
    })
  }

  private notifyError(error: Error): void {
    this.errorCallbacks.forEach(cb => {
      try {
        cb(error)
      } catch (e) {
        safeLogger.error('[AlpacaWS] Error callback failed', { error: e })
      }
    })
  }

  // ═══════════════════════════════════════════════════════════════
  // Message Handlers
  // ═══════════════════════════════════════════════════════════════

  private handleMarketDataMessage(data: string): void {
    try {
      const messages = JSON.parse(data) as Array<{
        T: string
        S?: string
        t?: string
        p?: number
        s?: number
        x?: string
        z?: string
        c?: string[]
        bp?: number
        bs?: number
        ap?: number
        as?: number
        bx?: string
        ax?: string
        o?: number
        h?: number
        l?: number
        v?: number
        vw?: number
        msg?: string
      }>

      for (const msg of messages) {
        switch (msg.T) {
          case 'success':
            safeLogger.info('[AlpacaWS] Auth success', { message: msg.msg })
            break

          case 'subscription':
            safeLogger.debug('[AlpacaWS] Subscription update', { msg })
            break

          case 'error':
            safeLogger.error('[AlpacaWS] Error message', { message: msg.msg })
            this.notifyError(new Error(msg.msg || 'Unknown error'))
            break

          case 't': // Trade
            this.notifyCallbacks({
              type: 'trade',
              symbol: msg.S!,
              price: msg.p!,
              size: msg.s!,
              exchange: msg.x!,
              timestamp: msg.t!,
              tape: msg.z!,
              conditions: msg.c || [],
            })
            break

          case 'q': // Quote
            this.notifyCallbacks({
              type: 'quote',
              symbol: msg.S!,
              bidPrice: msg.bp!,
              bidSize: msg.bs!,
              askPrice: msg.ap!,
              askSize: msg.as!,
              bidExchange: msg.bx!,
              askExchange: msg.ax!,
              timestamp: msg.t!,
            })
            break

          case 'b': // Bar
            this.notifyCallbacks({
              type: 'bar',
              symbol: msg.S!,
              open: msg.o!,
              high: msg.h!,
              low: msg.l!,
              close: msg.p!, // close is 'c' in bars but 'p' for last price
              volume: msg.v!,
              vwap: msg.vw!,
              timestamp: msg.t!,
            })
            break
        }
      }
    } catch (error) {
      safeLogger.error('[AlpacaWS] Failed to parse market data message', { error, data })
    }
  }

  private handleTradingMessage(data: string): void {
    try {
      const msg = JSON.parse(data) as {
        stream?: string
        data?: {
          event: string
          order: {
            id: string
            symbol: string
            side: string
            type: string
            qty: string
            filled_qty: string
            filled_avg_price: string | null
            limit_price: string | null
            stop_price: string | null
          }
          timestamp: string
        }
      }

      if (msg.stream === 'trade_updates' && msg.data) {
        const order = msg.data.order
        this.notifyCallbacks({
          type: 'orderUpdate',
          event: msg.data.event as AlpacaOrderUpdate['event'],
          orderId: order.id,
          symbol: order.symbol,
          side: order.side as 'buy' | 'sell',
          orderType: order.type,
          quantity: parseFloat(order.qty),
          filledQuantity: parseFloat(order.filled_qty),
          filledAvgPrice: order.filled_avg_price ? parseFloat(order.filled_avg_price) : null,
          limitPrice: order.limit_price ? parseFloat(order.limit_price) : null,
          stopPrice: order.stop_price ? parseFloat(order.stop_price) : null,
          timestamp: msg.data.timestamp,
        })
      }
    } catch (error) {
      safeLogger.error('[AlpacaWS] Failed to parse trading message', { error, data })
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // Reconnection & Heartbeat
  // ═══════════════════════════════════════════════════════════════

  private handleReconnect(type: 'data' | 'trading'): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      safeLogger.error('[AlpacaWS] Max reconnect attempts reached', { type })
      this.notifyError(new Error(`Failed to reconnect ${type} WebSocket after ${this.maxReconnectAttempts} attempts`))
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)

    safeLogger.info('[AlpacaWS] Reconnecting', { type, attempt: this.reconnectAttempts, delay })

    setTimeout(async () => {
      if (type === 'data') {
        const success = await this.connectMarketData()
        if (success) {
          // 기존 구독 복원
          if (this.subscriptions.trades.size > 0) {
            this.updateSubscription('trades', Array.from(this.subscriptions.trades))
          }
          if (this.subscriptions.quotes.size > 0) {
            this.updateSubscription('quotes', Array.from(this.subscriptions.quotes))
          }
          if (this.subscriptions.bars.size > 0) {
            this.updateSubscription('bars', Array.from(this.subscriptions.bars))
          }
        }
      } else {
        await this.connectTrading()
      }
    }, delay)
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.dataWs?.readyState === WebSocket.OPEN) {
        // Alpaca WebSocket doesn't require ping, but we can send empty message
        // this.dataWs.send(JSON.stringify({ action: 'ping' }))
      }
    }, 30000) // 30초마다
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // Status
  // ═══════════════════════════════════════════════════════════════

  getStatus(): {
    isConnected: boolean
    dataWsState: string
    tradingWsState: string
    subscriptions: {
      trades: string[]
      quotes: string[]
      bars: string[]
    }
  } {
    const wsStateMap = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED']

    return {
      isConnected: this.isConnected,
      dataWsState: this.dataWs ? wsStateMap[this.dataWs.readyState] : 'NOT_CREATED',
      tradingWsState: this.tradingWs ? wsStateMap[this.tradingWs.readyState] : 'NOT_CREATED',
      subscriptions: {
        trades: Array.from(this.subscriptions.trades),
        quotes: Array.from(this.subscriptions.quotes),
        bars: Array.from(this.subscriptions.bars),
      },
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// Factory
// ═══════════════════════════════════════════════════════════════

export function createAlpacaWebSocket(config: AlpacaWSConfig): AlpacaWebSocketService {
  return new AlpacaWebSocketService(config)
}

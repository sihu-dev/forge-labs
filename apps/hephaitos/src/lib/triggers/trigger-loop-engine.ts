/**
 * Trigger Loop Engine
 * 이벤트 기반 트리거 루프 시스템
 *
 * 전략 실행, 가격 모니터링, 알림 발송 등을 위한 핵심 엔진
 */

import { EventEmitter } from 'events'

// ============================================
// Types
// ============================================

export type TriggerType =
  | 'price_cross'      // 가격 돌파
  | 'indicator_signal' // 인디케이터 신호
  | 'time_based'       // 시간 기반
  | 'volume_spike'     // 거래량 급증
  | 'pattern_match'    // 패턴 매칭
  | 'external_webhook' // 외부 웹훅
  | 'portfolio_change' // 포트폴리오 변동
  | 'risk_threshold'   // 리스크 임계값

export type TriggerStatus = 'active' | 'paused' | 'triggered' | 'expired' | 'error'

export type ActionType =
  | 'execute_strategy'  // 전략 실행
  | 'send_notification' // 알림 발송
  | 'place_order'       // 주문 실행
  | 'update_position'   // 포지션 업데이트
  | 'log_event'         // 이벤트 로깅
  | 'call_webhook'      // 웹훅 호출
  | 'chain_trigger'     // 다음 트리거 연결

export interface TriggerCondition {
  type: TriggerType
  params: Record<string, unknown>
  operator?: 'AND' | 'OR'
}

export interface TriggerAction {
  type: ActionType
  params: Record<string, unknown>
  delay?: number // 실행 지연 (ms)
  retryCount?: number
  retryDelay?: number
}

export interface Trigger {
  id: string
  name: string
  userId: string
  status: TriggerStatus
  conditions: TriggerCondition[]
  actions: TriggerAction[]
  cooldown?: number // 재실행 대기 시간 (ms)
  maxExecutions?: number // 최대 실행 횟수
  executionCount: number
  lastTriggeredAt?: Date
  expiresAt?: Date
  metadata?: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

export interface TriggerEvent {
  type: string
  data: Record<string, unknown>
  timestamp: Date
  source: string
}

export interface TriggerResult {
  triggerId: string
  success: boolean
  actionsExecuted: number
  errors?: string[]
  executedAt: Date
  duration: number
}

// ============================================
// Trigger Evaluators
// ============================================

type ConditionEvaluator = (
  condition: TriggerCondition,
  event: TriggerEvent,
  context: EvaluationContext
) => boolean | Promise<boolean>

interface EvaluationContext {
  currentPrice?: number
  previousPrice?: number
  indicators?: Record<string, number>
  volume?: number
  portfolio?: Record<string, unknown>
  timestamp: Date
}

const conditionEvaluators: Record<TriggerType, ConditionEvaluator> = {
  price_cross: (condition, event, context) => {
    const { threshold, direction } = condition.params as { threshold: number; direction: 'above' | 'below' }
    const { currentPrice, previousPrice } = context

    if (!currentPrice || !previousPrice) return false

    if (direction === 'above') {
      return previousPrice < threshold && currentPrice >= threshold
    } else {
      return previousPrice > threshold && currentPrice <= threshold
    }
  },

  indicator_signal: (condition, event, context) => {
    const { indicator, value, operator } = condition.params as {
      indicator: string
      value: number
      operator: '>' | '<' | '==' | '>=' | '<='
    }

    const indicatorValue = context.indicators?.[indicator]
    if (indicatorValue === undefined) return false

    switch (operator) {
      case '>': return indicatorValue > value
      case '<': return indicatorValue < value
      case '==': return indicatorValue === value
      case '>=': return indicatorValue >= value
      case '<=': return indicatorValue <= value
      default: return false
    }
  },

  time_based: (condition, _event, context) => {
    const { schedule, timezone } = condition.params as { schedule: string; timezone?: string }
    // Simple cron-like check (hour:minute format for now)
    const [hour, minute] = schedule.split(':').map(Number)
    const now = context.timestamp
    return now.getHours() === hour && now.getMinutes() === minute
  },

  volume_spike: (condition, _event, context) => {
    const { multiplier, baseline } = condition.params as { multiplier: number; baseline: number }
    const { volume } = context
    if (!volume) return false
    return volume >= baseline * multiplier
  },

  pattern_match: (condition, event, _context) => {
    const { pattern } = condition.params as { pattern: string }
    const eventPattern = event.data.pattern as string | undefined
    return eventPattern === pattern
  },

  external_webhook: (condition, event, _context) => {
    const { webhookId } = condition.params as { webhookId: string }
    return event.type === 'webhook' && event.data.webhookId === webhookId
  },

  portfolio_change: (condition, _event, context) => {
    const { metric, threshold, direction } = condition.params as {
      metric: 'pnl' | 'value' | 'drawdown'
      threshold: number
      direction: 'above' | 'below'
    }

    const value = context.portfolio?.[metric] as number | undefined
    if (value === undefined) return false

    return direction === 'above' ? value >= threshold : value <= threshold
  },

  risk_threshold: (condition, _event, context) => {
    const { riskMetric, maxValue } = condition.params as { riskMetric: string; maxValue: number }
    const currentRisk = context.portfolio?.[riskMetric] as number | undefined
    if (currentRisk === undefined) return false
    return currentRisk >= maxValue
  },
}

// ============================================
// Action Executors
// ============================================

type ActionExecutor = (
  action: TriggerAction,
  trigger: Trigger,
  event: TriggerEvent
) => Promise<{ success: boolean; error?: string }>

const actionExecutors: Record<ActionType, ActionExecutor> = {
  execute_strategy: async (action, trigger, _event) => {
    try {
      const { strategyId } = action.params as { strategyId: string }
      console.log(`[TriggerLoop] Executing strategy ${strategyId} for trigger ${trigger.id}`)
      // TODO: Call strategy execution service
      return { success: true }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  },

  send_notification: async (action, trigger, _event) => {
    try {
      const { type, title, message } = action.params as { type: string; title: string; message: string }
      console.log(`[TriggerLoop] Sending ${type} notification: ${title}`)
      // TODO: Call notification service
      return { success: true }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  },

  place_order: async (action, trigger, _event) => {
    try {
      const { symbol, side, quantity, orderType } = action.params as {
        symbol: string
        side: 'buy' | 'sell'
        quantity: number
        orderType: 'market' | 'limit'
      }
      console.log(`[TriggerLoop] Placing ${orderType} ${side} order for ${quantity} ${symbol}`)
      // TODO: Call order execution service
      return { success: true }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  },

  update_position: async (action, _trigger, _event) => {
    try {
      const { positionId, updates } = action.params as { positionId: string; updates: Record<string, unknown> }
      console.log(`[TriggerLoop] Updating position ${positionId}`)
      // TODO: Call position service
      return { success: true }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  },

  log_event: async (action, trigger, event) => {
    try {
      const { level, message } = action.params as { level: string; message: string }
      console.log(`[TriggerLoop] [${level}] ${message}`, { triggerId: trigger.id, event })
      return { success: true }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  },

  call_webhook: async (action, _trigger, event) => {
    try {
      const { url, method, headers } = action.params as {
        url: string
        method: 'GET' | 'POST' | 'PUT'
        headers?: Record<string, string>
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: method !== 'GET' ? JSON.stringify(event.data) : undefined,
      })

      return { success: response.ok, error: response.ok ? undefined : `HTTP ${response.status}` }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  },

  chain_trigger: async (action, _trigger, _event) => {
    try {
      const { nextTriggerId } = action.params as { nextTriggerId: string }
      console.log(`[TriggerLoop] Chaining to trigger ${nextTriggerId}`)
      // TODO: Emit event to activate next trigger
      return { success: true }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  },
}

// ============================================
// Trigger Loop Engine
// ============================================

export class TriggerLoopEngine extends EventEmitter {
  private triggers: Map<string, Trigger> = new Map()
  private isRunning: boolean = false
  private loopInterval: NodeJS.Timeout | null = null
  private eventQueue: TriggerEvent[] = []
  private processingLock: boolean = false

  constructor(private options: {
    loopIntervalMs?: number
    maxQueueSize?: number
    batchSize?: number
  } = {}) {
    super()
    this.options = {
      loopIntervalMs: 1000,
      maxQueueSize: 10000,
      batchSize: 100,
      ...options,
    }
  }

  // ─────────────────────────────────────────
  // Lifecycle
  // ─────────────────────────────────────────

  start(): void {
    if (this.isRunning) return

    this.isRunning = true
    this.loopInterval = setInterval(() => {
      this.processEventQueue()
    }, this.options.loopIntervalMs)

    this.emit('started')
    console.log('[TriggerLoop] Engine started')
  }

  stop(): void {
    if (!this.isRunning) return

    this.isRunning = false
    if (this.loopInterval) {
      clearInterval(this.loopInterval)
      this.loopInterval = null
    }

    this.emit('stopped')
    console.log('[TriggerLoop] Engine stopped')
  }

  // ─────────────────────────────────────────
  // Trigger Management
  // ─────────────────────────────────────────

  registerTrigger(trigger: Trigger): void {
    this.triggers.set(trigger.id, trigger)
    this.emit('trigger:registered', trigger)
    console.log(`[TriggerLoop] Trigger registered: ${trigger.id} (${trigger.name})`)
  }

  unregisterTrigger(triggerId: string): void {
    const trigger = this.triggers.get(triggerId)
    if (trigger) {
      this.triggers.delete(triggerId)
      this.emit('trigger:unregistered', trigger)
      console.log(`[TriggerLoop] Trigger unregistered: ${triggerId}`)
    }
  }

  updateTrigger(triggerId: string, updates: Partial<Trigger>): void {
    const trigger = this.triggers.get(triggerId)
    if (trigger) {
      Object.assign(trigger, updates, { updatedAt: new Date() })
      this.emit('trigger:updated', trigger)
    }
  }

  getTrigger(triggerId: string): Trigger | undefined {
    return this.triggers.get(triggerId)
  }

  getActiveTriggers(): Trigger[] {
    return Array.from(this.triggers.values()).filter(t => t.status === 'active')
  }

  // ─────────────────────────────────────────
  // Event Processing
  // ─────────────────────────────────────────

  pushEvent(event: TriggerEvent): void {
    if (this.eventQueue.length >= this.options.maxQueueSize!) {
      console.warn('[TriggerLoop] Event queue full, dropping oldest events')
      this.eventQueue.shift()
    }

    this.eventQueue.push(event)
    this.emit('event:queued', event)
  }

  private async processEventQueue(): Promise<void> {
    if (this.processingLock || this.eventQueue.length === 0) return

    this.processingLock = true

    try {
      const batch = this.eventQueue.splice(0, this.options.batchSize!)

      for (const event of batch) {
        await this.processEvent(event)
      }
    } finally {
      this.processingLock = false
    }
  }

  private async processEvent(event: TriggerEvent): Promise<void> {
    const activeTriggers = this.getActiveTriggers()

    for (const trigger of activeTriggers) {
      try {
        // Check if trigger is on cooldown
        if (this.isOnCooldown(trigger)) continue

        // Check if trigger has expired
        if (this.isExpired(trigger)) {
          this.updateTrigger(trigger.id, { status: 'expired' })
          continue
        }

        // Check if max executions reached
        if (this.hasReachedMaxExecutions(trigger)) {
          this.updateTrigger(trigger.id, { status: 'expired' })
          continue
        }

        // Evaluate conditions
        const context = this.buildEvaluationContext(event)
        const shouldTrigger = await this.evaluateConditions(trigger, event, context)

        if (shouldTrigger) {
          const result = await this.executeTrigger(trigger, event)
          this.emit('trigger:executed', result)
        }
      } catch (error) {
        console.error(`[TriggerLoop] Error processing trigger ${trigger.id}:`, error)
        this.emit('trigger:error', { triggerId: trigger.id, error })
      }
    }
  }

  private isOnCooldown(trigger: Trigger): boolean {
    if (!trigger.cooldown || !trigger.lastTriggeredAt) return false

    const elapsed = Date.now() - trigger.lastTriggeredAt.getTime()
    return elapsed < trigger.cooldown
  }

  private isExpired(trigger: Trigger): boolean {
    if (!trigger.expiresAt) return false
    return new Date() > trigger.expiresAt
  }

  private hasReachedMaxExecutions(trigger: Trigger): boolean {
    if (!trigger.maxExecutions) return false
    return trigger.executionCount >= trigger.maxExecutions
  }

  private buildEvaluationContext(event: TriggerEvent): EvaluationContext {
    return {
      currentPrice: event.data.price as number | undefined,
      previousPrice: event.data.previousPrice as number | undefined,
      indicators: event.data.indicators as Record<string, number> | undefined,
      volume: event.data.volume as number | undefined,
      portfolio: event.data.portfolio as Record<string, unknown> | undefined,
      timestamp: event.timestamp,
    }
  }

  private async evaluateConditions(
    trigger: Trigger,
    event: TriggerEvent,
    context: EvaluationContext
  ): Promise<boolean> {
    if (trigger.conditions.length === 0) return false

    const results: boolean[] = []

    for (const condition of trigger.conditions) {
      const evaluator = conditionEvaluators[condition.type]
      if (!evaluator) {
        console.warn(`[TriggerLoop] Unknown condition type: ${condition.type}`)
        results.push(false)
        continue
      }

      const result = await evaluator(condition, event, context)
      results.push(result)
    }

    // Default to AND logic, check for OR operator
    const hasOrOperator = trigger.conditions.some(c => c.operator === 'OR')

    if (hasOrOperator) {
      return results.some(r => r)
    }

    return results.every(r => r)
  }

  private async executeTrigger(trigger: Trigger, event: TriggerEvent): Promise<TriggerResult> {
    const startTime = Date.now()
    const errors: string[] = []
    let actionsExecuted = 0

    console.log(`[TriggerLoop] Executing trigger: ${trigger.id} (${trigger.name})`)

    for (const action of trigger.actions) {
      try {
        // Handle delay
        if (action.delay) {
          await new Promise(resolve => setTimeout(resolve, action.delay))
        }

        const executor = actionExecutors[action.type]
        if (!executor) {
          errors.push(`Unknown action type: ${action.type}`)
          continue
        }

        let result = await executor(action, trigger, event)

        // Retry logic
        let retries = 0
        while (!result.success && retries < (action.retryCount || 0)) {
          await new Promise(resolve => setTimeout(resolve, action.retryDelay || 1000))
          result = await executor(action, trigger, event)
          retries++
        }

        if (result.success) {
          actionsExecuted++
        } else if (result.error) {
          errors.push(result.error)
        }
      } catch (error) {
        errors.push(String(error))
      }
    }

    // Update trigger state
    this.updateTrigger(trigger.id, {
      executionCount: trigger.executionCount + 1,
      lastTriggeredAt: new Date(),
    })

    return {
      triggerId: trigger.id,
      success: errors.length === 0,
      actionsExecuted,
      errors: errors.length > 0 ? errors : undefined,
      executedAt: new Date(),
      duration: Date.now() - startTime,
    }
  }

  // ─────────────────────────────────────────
  // Stats & Monitoring
  // ─────────────────────────────────────────

  getStats(): {
    isRunning: boolean
    totalTriggers: number
    activeTriggers: number
    queueSize: number
  } {
    return {
      isRunning: this.isRunning,
      totalTriggers: this.triggers.size,
      activeTriggers: this.getActiveTriggers().length,
      queueSize: this.eventQueue.length,
    }
  }
}

// ============================================
// Singleton Instance
// ============================================

let engineInstance: TriggerLoopEngine | null = null

export function getTriggerLoopEngine(): TriggerLoopEngine {
  if (!engineInstance) {
    engineInstance = new TriggerLoopEngine()
  }
  return engineInstance
}

export function resetTriggerLoopEngine(): void {
  if (engineInstance) {
    engineInstance.stop()
    engineInstance = null
  }
}

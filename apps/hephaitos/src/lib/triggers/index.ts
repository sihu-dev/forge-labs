/**
 * Trigger System Exports
 * 트리거 루프 시스템 통합 모듈
 */

export {
  TriggerLoopEngine,
  getTriggerLoopEngine,
  resetTriggerLoopEngine,
  type Trigger,
  type TriggerType,
  type TriggerStatus,
  type TriggerCondition,
  type TriggerAction,
  type ActionType,
  type TriggerEvent,
  type TriggerResult,
} from './trigger-loop-engine'

export {
  TriggerService,
  getTriggerService,
  type CreateTriggerInput,
  type UpdateTriggerInput,
  type TriggerFilter,
} from './trigger-service'

// ============================================
// 프리셋 트리거 팩토리
// ============================================

import type { TriggerCondition, TriggerAction } from './trigger-loop-engine'

/**
 * 가격 알림 트리거 조건 생성
 */
export function createPriceAlertCondition(
  symbol: string,
  threshold: number,
  direction: 'above' | 'below'
): TriggerCondition {
  return {
    type: 'price_cross',
    params: { symbol, threshold, direction },
  }
}

/**
 * 인디케이터 신호 조건 생성
 */
export function createIndicatorCondition(
  indicator: string,
  value: number,
  operator: '>' | '<' | '==' | '>=' | '<='
): TriggerCondition {
  return {
    type: 'indicator_signal',
    params: { indicator, value, operator },
  }
}

/**
 * 스케줄 조건 생성
 */
export function createScheduleCondition(
  schedule: string,
  timezone?: string
): TriggerCondition {
  return {
    type: 'time_based',
    params: { schedule, timezone },
  }
}

/**
 * 포트폴리오 변동 조건 생성
 */
export function createPortfolioCondition(
  metric: 'pnl' | 'value' | 'drawdown',
  threshold: number,
  direction: 'above' | 'below'
): TriggerCondition {
  return {
    type: 'portfolio_change',
    params: { metric, threshold, direction },
  }
}

/**
 * 알림 액션 생성
 */
export function createNotificationAction(
  type: 'email' | 'push' | 'sms',
  title: string,
  message: string
): TriggerAction {
  return {
    type: 'send_notification',
    params: { type, title, message },
  }
}

/**
 * 전략 실행 액션 생성
 */
export function createStrategyAction(strategyId: string): TriggerAction {
  return {
    type: 'execute_strategy',
    params: { strategyId },
  }
}

/**
 * 주문 실행 액션 생성
 */
export function createOrderAction(
  symbol: string,
  side: 'buy' | 'sell',
  quantity: number,
  orderType: 'market' | 'limit' = 'market'
): TriggerAction {
  return {
    type: 'place_order',
    params: { symbol, side, quantity, orderType },
  }
}

/**
 * 웹훅 호출 액션 생성
 */
export function createWebhookAction(
  url: string,
  method: 'GET' | 'POST' | 'PUT' = 'POST',
  headers?: Record<string, string>
): TriggerAction {
  return {
    type: 'call_webhook',
    params: { url, method, headers },
  }
}

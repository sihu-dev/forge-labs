/**
 * 이벤트 트리거 핸들러
 *
 * 내부 시스템 이벤트 기반 워크플로우 트리거
 */

import type { IEventTrigger } from '../types.js';

export interface IEventPayload {
  event: string;
  source: string;
  data: Record<string, unknown>;
  timestamp: string;
  trace_id?: string;
}

export interface IEventSubscription {
  id: string;
  workflow_id: string;
  event_pattern: string;
  filter?: Record<string, unknown>;
  active: boolean;
}

/**
 * 이벤트 패턴 매칭
 */
export function matchEventPattern(event: string, pattern: string): boolean {
  // 와일드카드 지원
  // 예: "lead.*" matches "lead.created", "lead.updated"
  const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
  return regex.test(event);
}

/**
 * 이벤트 필터 적용
 */
export function applyEventFilter(
  payload: IEventPayload,
  filter?: Record<string, unknown>
): boolean {
  if (!filter) {
    return true;
  }

  for (const [key, expectedValue] of Object.entries(filter)) {
    const actualValue = getNestedValue(payload.data, key);

    if (Array.isArray(expectedValue)) {
      // IN 연산
      if (!expectedValue.includes(actualValue)) {
        return false;
      }
    } else if (typeof expectedValue === 'object' && expectedValue !== null) {
      // 복잡한 조건 (예: { $gt: 50 })
      if (!evaluateCondition(actualValue, expectedValue)) {
        return false;
      }
    } else {
      // 직접 비교
      if (actualValue !== expectedValue) {
        return false;
      }
    }
  }

  return true;
}

/**
 * 중첩된 객체에서 값 추출
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((current, key) => {
    return current && typeof current === 'object' ? (current as Record<string, unknown>)[key] : undefined;
  }, obj as unknown);
}

/**
 * 조건 평가
 */
function evaluateCondition(value: unknown, condition: Record<string, unknown>): boolean {
  for (const [operator, expectedValue] of Object.entries(condition)) {
    switch (operator) {
      case '$eq':
        if (value !== expectedValue) return false;
        break;
      case '$ne':
        if (value === expectedValue) return false;
        break;
      case '$gt':
        if (typeof value !== 'number' || value <= (expectedValue as number)) return false;
        break;
      case '$gte':
        if (typeof value !== 'number' || value < (expectedValue as number)) return false;
        break;
      case '$lt':
        if (typeof value !== 'number' || value >= (expectedValue as number)) return false;
        break;
      case '$lte':
        if (typeof value !== 'number' || value > (expectedValue as number)) return false;
        break;
      case '$in':
        if (!Array.isArray(expectedValue) || !expectedValue.includes(value)) return false;
        break;
      case '$nin':
        if (!Array.isArray(expectedValue) || expectedValue.includes(value)) return false;
        break;
      case '$regex':
        if (typeof value !== 'string' || !new RegExp(expectedValue as string).test(value))
          return false;
        break;
      default:
        return false;
    }
  }
  return true;
}

/**
 * 일반적인 이벤트 타입
 */
export const COMMON_EVENTS = {
  // BIDFLOW 리드 이벤트
  LEAD_CREATED: 'lead.created',
  LEAD_UPDATED: 'lead.updated',
  LEAD_SCORED: 'lead.scored',
  LEAD_CONVERTED: 'lead.converted',

  // 아웃리치 이벤트
  EMAIL_SENT: 'outreach.email.sent',
  EMAIL_OPENED: 'outreach.email.opened',
  EMAIL_CLICKED: 'outreach.email.clicked',
  EMAIL_REPLIED: 'outreach.email.replied',

  // CRM 이벤트
  CRM_CONTACT_CREATED: 'crm.contact.created',
  CRM_CONTACT_UPDATED: 'crm.contact.updated',
  CRM_DEAL_CREATED: 'crm.deal.created',
  CRM_DEAL_WON: 'crm.deal.won',

  // 크로스셀 이벤트
  CROSS_SELL_OFFERED: 'cross_sell.offered',
  CROSS_SELL_ACCEPTED: 'cross_sell.accepted',
  CROSS_SELL_DECLINED: 'cross_sell.declined',

  // HEPHAITOS 이벤트
  USER_REGISTERED: 'user.registered',
  STRATEGY_CREATED: 'strategy.created',
  BACKTEST_COMPLETED: 'backtest.completed',
  ORDER_EXECUTED: 'order.executed',
} as const;

/**
 * 이벤트 발행
 */
export async function publishEvent(payload: IEventPayload): Promise<void> {
  // 실제 구현에서는 이벤트 버스/메시지 큐에 발행
  // 예: Redis Pub/Sub, RabbitMQ, AWS EventBridge
  console.log('[Event Published]', payload.event, payload.data);

  // 여기서는 로컬 이벤트 핸들러 호출 (예시)
  // 실제로는 구독자들에게 전파
}

/**
 * 이벤트 구독 생성
 */
export function createEventSubscription(
  workflowId: string,
  eventPattern: string,
  filter?: Record<string, unknown>
): IEventSubscription {
  return {
    id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    workflow_id: workflowId,
    event_pattern: eventPattern,
    filter,
    active: true,
  };
}

/**
 * 이벤트 페이로드 검증
 */
export function validateEventPayload(payload: IEventPayload): {
  valid: boolean;
  error?: string;
} {
  if (!payload.event || typeof payload.event !== 'string') {
    return { valid: false, error: 'Missing or invalid event name' };
  }

  if (!payload.source || typeof payload.source !== 'string') {
    return { valid: false, error: 'Missing or invalid event source' };
  }

  if (!payload.data || typeof payload.data !== 'object') {
    return { valid: false, error: 'Missing or invalid event data' };
  }

  if (!payload.timestamp) {
    return { valid: false, error: 'Missing timestamp' };
  }

  return { valid: true };
}

/**
 * 이벤트 필터 예시
 */
export const EVENT_FILTER_EXAMPLES = {
  // Tier S,A 리드만
  HIGH_VALUE_LEADS: {
    'score_tier': ['S', 'A'],
  },

  // 점수 70 이상
  HIGH_SCORE: {
    'score': { $gte: 70 },
  },

  // 특정 업종
  FINANCE_INDUSTRY: {
    'enrichment.industry_category': { $regex: '금융|finance' },
  },

  // 복합 조건
  QUALIFIED_LEAD: {
    'score': { $gte: 60 },
    'status': 'enriched',
    'enrichment.company_size': { $in: ['medium', 'large', 'enterprise'] },
  },
} as const;

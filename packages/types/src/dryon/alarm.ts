/**
 * @forge/types - DRYON Alarm Types
 * L0 (Atoms) - 알람 관리 타입 정의
 */

import type { ISensorState, SensorType } from './sensor.js';

/**
 * 알람 우선순위
 */
export type AlarmPriority = 'critical' | 'high' | 'medium' | 'low';

/**
 * 알람 카테고리
 */
export type AlarmCategory =
  | 'safety'       // 안전
  | 'quality'      // 품질
  | 'efficiency'   // 효율
  | 'maintenance'  // 유지보수
  | 'process';     // 공정

/**
 * 알람 상태
 */
export type AlarmStatus =
  | 'active'       // 활성
  | 'acknowledged' // 확인됨
  | 'resolved'     // 해결됨
  | 'suppressed';  // 억제됨

/**
 * 비교 연산자
 */
export type ComparisonOp = 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq' | 'range';

/**
 * 알람 조건
 */
export interface IAlarmCondition {
  /** 대상 센서 타입 */
  sensorType: SensorType;
  /** 측정값 필드 */
  field: string;
  /** 비교 연산자 */
  operator: ComparisonOp;
  /** 임계값 (단일) */
  threshold?: number;
  /** 범위 (range 연산자용) */
  range?: { min: number; max: number };
}

/**
 * 알람 규칙
 */
export interface IAlarmRule {
  /** 규칙 ID */
  id: string;
  /** 규칙명 */
  name: string;
  /** 설명 */
  description: string;
  /** 조건들 (AND 연산) */
  conditions: IAlarmCondition[];
  /** 조건 논리 */
  logic: 'and' | 'or';
  /** 데드밴드 (%) - 복귀 시 히스테리시스 */
  deadband: number;
  /** 지연 시간 (ms) - 조건 지속 시간 */
  delay: number;
  /** 활성화 여부 */
  enabled: boolean;
}

/**
 * 알람 정의
 */
export interface IAlarm {
  /** 알람 ID */
  id: string;
  /** 알람 코드 (고유) */
  code: string;
  /** 알람명 */
  name: string;
  /** 상세 설명 */
  description: string;

  /** 우선순위 */
  priority: AlarmPriority;
  /** 카테고리 */
  category: AlarmCategory;

  /** 트리거 규칙 */
  rule: IAlarmRule;

  /** 권장 조치 */
  recommendedActions: string[];
  /** 참조 문서 링크 */
  documentationUrl?: string;

  /** 에스컬레이션 설정 */
  escalation?: IEscalationConfig;

  /** 메타데이터 */
  metadata: {
    createdAt: string;
    updatedAt: string;
    createdBy?: string;
  };
}

/**
 * 에스컬레이션 레벨
 */
export interface IEscalationLevel {
  /** 레벨 (1부터 시작) */
  level: number;
  /** 이전 레벨 후 대기 시간 (분) */
  afterMinutes: number;
  /** 알림 대상 */
  notifyTo: string[];
  /** 자동 조치 */
  autoActions?: string[];
}

/**
 * 에스컬레이션 설정
 */
export interface IEscalationConfig {
  /** 에스컬레이션 활성화 */
  enabled: boolean;
  /** 레벨별 설정 */
  levels: IEscalationLevel[];
  /** 최대 에스컬레이션 레벨 */
  maxLevel: number;
}

/**
 * 알람 이벤트 (발생 기록)
 */
export interface IAlarmEvent {
  /** 이벤트 ID */
  id: string;
  /** 알람 ID */
  alarmId: string;
  /** 알람 코드 */
  alarmCode: string;

  /** 현재 상태 */
  status: AlarmStatus;
  /** 우선순위 (알람에서 복사) */
  priority: AlarmPriority;

  /** 발생 시간 */
  triggeredAt: string;
  /** 트리거 시점 센서 값 */
  triggerValues: Record<string, number>;
  /** 트리거 조건 설명 */
  triggerReason: string;

  /** 확인자 */
  acknowledgedBy?: string;
  /** 확인 시간 */
  acknowledgedAt?: string;
  /** 확인 메모 */
  acknowledgeNote?: string;

  /** 해결자 */
  resolvedBy?: string;
  /** 해결 시간 */
  resolvedAt?: string;
  /** 근본 원인 */
  rootCause?: string;
  /** 해결 방법 */
  resolution?: string;

  /** 현재 에스컬레이션 레벨 */
  escalationLevel: number;
  /** 에스컬레이션 이력 */
  escalationHistory?: IEscalationHistory[];

  /** 지속 시간 (ms) */
  durationMs?: number;
}

/**
 * 에스컬레이션 이력
 */
export interface IEscalationHistory {
  /** 레벨 */
  level: number;
  /** 시간 */
  at: string;
  /** 알림 대상 */
  notifiedTo: string[];
  /** 수행된 조치 */
  actionsPerformed?: string[];
}

/**
 * 알람 통계
 */
export interface IAlarmStats {
  /** 기간 */
  period: {
    start: string;
    end: string;
  };

  /** 총 알람 수 */
  totalAlarms: number;
  /** 우선순위별 */
  byPriority: Record<AlarmPriority, number>;
  /** 카테고리별 */
  byCategory: Record<AlarmCategory, number>;

  /** 평균 확인 시간 (분) */
  avgAcknowledgeTimeMin: number;
  /** 평균 해결 시간 (분) */
  avgResolutionTimeMin: number;

  /** 가장 빈번한 알람 Top 5 */
  mostFrequent: { alarmCode: string; count: number }[];
  /** 가장 오래 지속된 알람 Top 5 */
  longestDuration: { eventId: string; durationMin: number }[];
}

/**
 * 알람 필터
 */
export interface IAlarmFilter {
  /** 상태 */
  status?: AlarmStatus[];
  /** 우선순위 */
  priority?: AlarmPriority[];
  /** 카테고리 */
  category?: AlarmCategory[];
  /** 기간 */
  dateRange?: {
    start: string;
    end: string;
  };
  /** 알람 코드 */
  alarmCodes?: string[];
}

/**
 * 알람 대시보드 데이터
 */
export interface IAlarmDashboard {
  /** 현재 활성 알람 수 */
  activeCount: number;
  /** 우선순위별 활성 알람 */
  activeByPriority: Record<AlarmPriority, number>;
  /** 미확인 알람 수 */
  unacknowledgedCount: number;

  /** 최근 알람 이벤트 */
  recentEvents: IAlarmEvent[];
  /** 오늘 통계 */
  todayStats: {
    triggered: number;
    acknowledged: number;
    resolved: number;
  };
}

/**
 * 우선순위별 응답 시간 가이드 (분)
 */
export const PRIORITY_RESPONSE_TIMES: Record<AlarmPriority, number> = {
  critical: 0,    // 즉시
  high: 15,       // 15분
  medium: 60,     // 1시간
  low: 480,       // 8시간
} as const;

/**
 * 우선순위별 기본 에스컬레이션 설정
 */
export const DEFAULT_ESCALATION_CONFIG: Record<AlarmPriority, IEscalationConfig> = {
  critical: {
    enabled: true,
    maxLevel: 3,
    levels: [
      { level: 1, afterMinutes: 5, notifyTo: ['operator'], autoActions: [] },
      { level: 2, afterMinutes: 10, notifyTo: ['supervisor'], autoActions: [] },
      { level: 3, afterMinutes: 15, notifyTo: ['manager'], autoActions: ['emergency_stop'] },
    ],
  },
  high: {
    enabled: true,
    maxLevel: 2,
    levels: [
      { level: 1, afterMinutes: 15, notifyTo: ['operator'], autoActions: [] },
      { level: 2, afterMinutes: 30, notifyTo: ['supervisor'], autoActions: [] },
    ],
  },
  medium: {
    enabled: true,
    maxLevel: 1,
    levels: [
      { level: 1, afterMinutes: 60, notifyTo: ['operator'], autoActions: [] },
    ],
  },
  low: {
    enabled: false,
    maxLevel: 0,
    levels: [],
  },
} as const;

/**
 * @forge/utils - Alarm Evaluation Utilities
 * L1 (Molecules) - 알람 평가 유틸리티
 *
 * 순수 함수 기반 - 부작용 없음
 */

import type { DryonTypes } from '@forge/types';

type IAlarmCondition = DryonTypes.IAlarmCondition;
type IAlarmRule = DryonTypes.IAlarmRule;
type IAlarm = DryonTypes.IAlarm;
type IAlarmEvent = DryonTypes.IAlarmEvent;
type AlarmPriority = DryonTypes.AlarmPriority;
type ComparisonOp = DryonTypes.ComparisonOp;

/**
 * 조건 평가 결과
 */
export interface IConditionEvalResult {
  /** 조건 만족 여부 */
  triggered: boolean;
  /** 현재 값 */
  currentValue: number;
  /** 임계값 */
  threshold: number | { min: number; max: number };
  /** 편차 (임계값 대비) */
  deviation: number;
  /** 설명 */
  description: string;
}

/**
 * 규칙 평가 결과
 */
export interface IRuleEvalResult {
  /** 규칙 트리거 여부 */
  triggered: boolean;
  /** 조건별 결과 */
  conditionResults: IConditionEvalResult[];
  /** 트리거 사유 */
  reason: string;
  /** 알람 점수 (0-100) */
  score: number;
}

// ═══════════════════════════════════════════════════════════════
// 임계값 평가
// ═══════════════════════════════════════════════════════════════

/**
 * 단일 조건 평가
 */
export function evaluateCondition(
  condition: IAlarmCondition,
  sensorValues: Record<string, number>
): IConditionEvalResult {
  const currentValue = sensorValues[condition.field] ?? 0;
  let triggered = false;
  let deviation = 0;
  let description = '';

  switch (condition.operator) {
    case 'gt':
      triggered = currentValue > (condition.threshold ?? 0);
      deviation = currentValue - (condition.threshold ?? 0);
      description = `${condition.field} (${currentValue}) > ${condition.threshold}`;
      break;

    case 'gte':
      triggered = currentValue >= (condition.threshold ?? 0);
      deviation = currentValue - (condition.threshold ?? 0);
      description = `${condition.field} (${currentValue}) >= ${condition.threshold}`;
      break;

    case 'lt':
      triggered = currentValue < (condition.threshold ?? 0);
      deviation = (condition.threshold ?? 0) - currentValue;
      description = `${condition.field} (${currentValue}) < ${condition.threshold}`;
      break;

    case 'lte':
      triggered = currentValue <= (condition.threshold ?? 0);
      deviation = (condition.threshold ?? 0) - currentValue;
      description = `${condition.field} (${currentValue}) <= ${condition.threshold}`;
      break;

    case 'eq':
      triggered = Math.abs(currentValue - (condition.threshold ?? 0)) < 0.001;
      deviation = currentValue - (condition.threshold ?? 0);
      description = `${condition.field} (${currentValue}) == ${condition.threshold}`;
      break;

    case 'neq':
      triggered = Math.abs(currentValue - (condition.threshold ?? 0)) >= 0.001;
      deviation = Math.abs(currentValue - (condition.threshold ?? 0));
      description = `${condition.field} (${currentValue}) != ${condition.threshold}`;
      break;

    case 'range':
      if (condition.range) {
        const inRange =
          currentValue >= condition.range.min && currentValue <= condition.range.max;
        triggered = !inRange; // 범위 밖이면 트리거
        if (currentValue < condition.range.min) {
          deviation = condition.range.min - currentValue;
        } else if (currentValue > condition.range.max) {
          deviation = currentValue - condition.range.max;
        }
        description = `${condition.field} (${currentValue}) outside [${condition.range.min}, ${condition.range.max}]`;
      }
      break;
  }

  return {
    triggered,
    currentValue,
    threshold: condition.range ?? condition.threshold ?? 0,
    deviation,
    description,
  };
}

/**
 * 알람 규칙 평가
 */
export function evaluateRule(
  rule: IAlarmRule,
  sensorValues: Record<string, number>
): IRuleEvalResult {
  if (!rule.enabled) {
    return {
      triggered: false,
      conditionResults: [],
      reason: '규칙이 비활성화됨',
      score: 0,
    };
  }

  const conditionResults = rule.conditions.map(cond =>
    evaluateCondition(cond, sensorValues)
  );

  // 논리 연산 적용
  const triggered =
    rule.logic === 'and'
      ? conditionResults.every(r => r.triggered)
      : conditionResults.some(r => r.triggered);

  // 트리거 사유 생성
  const triggeredConditions = conditionResults.filter(r => r.triggered);
  const reason =
    triggeredConditions.length > 0
      ? triggeredConditions.map(r => r.description).join('; ')
      : '정상 범위';

  // 점수 계산 (편차 기반)
  const score = calculateAlarmScore(conditionResults);

  return {
    triggered,
    conditionResults,
    reason,
    score,
  };
}

// ═══════════════════════════════════════════════════════════════
// 데드밴드 체크
// ═══════════════════════════════════════════════════════════════

/**
 * 데드밴드 적용 체크
 *
 * 알람 상태 변경 시 히스테리시스 적용
 */
export function checkDeadband(
  condition: IAlarmCondition,
  currentValue: number,
  previouslyTriggered: boolean,
  deadbandPercent: number
): boolean {
  const threshold = condition.threshold ?? 0;
  const deadband = Math.abs(threshold * (deadbandPercent / 100));

  if (previouslyTriggered) {
    // 이미 트리거된 상태 → 복귀 조건 (데드밴드 적용)
    switch (condition.operator) {
      case 'gt':
      case 'gte':
        return currentValue > threshold - deadband;
      case 'lt':
      case 'lte':
        return currentValue < threshold + deadband;
      default:
        return evaluateCondition(condition, { [condition.field]: currentValue }).triggered;
    }
  } else {
    // 정상 상태 → 트리거 조건 (원래 임계값)
    return evaluateCondition(condition, { [condition.field]: currentValue }).triggered;
  }
}

// ═══════════════════════════════════════════════════════════════
// 알람 점수 및 우선순위
// ═══════════════════════════════════════════════════════════════

/**
 * 알람 점수 계산 (0-100)
 *
 * 편차 크기와 트리거된 조건 수 기반
 */
export function calculateAlarmScore(
  conditionResults: IConditionEvalResult[]
): number {
  if (conditionResults.length === 0) return 0;

  const triggeredResults = conditionResults.filter(r => r.triggered);
  if (triggeredResults.length === 0) return 0;

  // 트리거 비율
  const triggerRatio = triggeredResults.length / conditionResults.length;

  // 평균 편차 (정규화)
  const avgDeviation =
    triggeredResults.reduce((sum, r) => {
      const threshold =
        typeof r.threshold === 'number'
          ? r.threshold
          : (r.threshold.max - r.threshold.min) / 2;
      const normalizedDev = threshold !== 0 ? Math.abs(r.deviation / threshold) : 0;
      return sum + Math.min(normalizedDev, 1); // 최대 100%
    }, 0) / triggeredResults.length;

  // 점수: 트리거 비율 50% + 편차 크기 50%
  return Math.round((triggerRatio * 50 + avgDeviation * 50) * 100) / 100;
}

/**
 * 알람 우선순위 정렬
 */
export function prioritizeAlarms(events: IAlarmEvent[]): IAlarmEvent[] {
  const priorityOrder: Record<AlarmPriority, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };

  return [...events].sort((a, b) => {
    // 1. 우선순위
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;

    // 2. 발생 시간 (최신 먼저)
    return new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime();
  });
}

/**
 * 미확인 알람 필터
 */
export function filterUnacknowledged(events: IAlarmEvent[]): IAlarmEvent[] {
  return events.filter(e => e.status === 'active' && !e.acknowledgedAt);
}

/**
 * 에스컬레이션 대상 알람 필터
 */
export function filterNeedingEscalation(
  events: IAlarmEvent[],
  currentTime: Date = new Date()
): IAlarmEvent[] {
  return events.filter(e => {
    if (e.status !== 'active') return false;

    const triggerTime = new Date(e.triggeredAt).getTime();
    const elapsedMinutes = (currentTime.getTime() - triggerTime) / (1000 * 60);

    // 우선순위별 에스컬레이션 시간 체크
    const escalationThresholds: Record<AlarmPriority, number> = {
      critical: 5,
      high: 15,
      medium: 60,
      low: Infinity,
    };

    return elapsedMinutes > escalationThresholds[e.priority] && !e.acknowledgedAt;
  });
}

// ═══════════════════════════════════════════════════════════════
// 알람 통계 계산
// ═══════════════════════════════════════════════════════════════

/**
 * 평균 확인 시간 계산 (분)
 */
export function calculateAvgAcknowledgeTime(events: IAlarmEvent[]): number {
  const acknowledgedEvents = events.filter(e => e.acknowledgedAt);
  if (acknowledgedEvents.length === 0) return 0;

  const totalMinutes = acknowledgedEvents.reduce((sum, e) => {
    const triggerTime = new Date(e.triggeredAt).getTime();
    const ackTime = new Date(e.acknowledgedAt!).getTime();
    return sum + (ackTime - triggerTime) / (1000 * 60);
  }, 0);

  return Math.round(totalMinutes / acknowledgedEvents.length);
}

/**
 * 평균 해결 시간 계산 (분)
 */
export function calculateAvgResolutionTime(events: IAlarmEvent[]): number {
  const resolvedEvents = events.filter(e => e.resolvedAt);
  if (resolvedEvents.length === 0) return 0;

  const totalMinutes = resolvedEvents.reduce((sum, e) => {
    const triggerTime = new Date(e.triggeredAt).getTime();
    const resolveTime = new Date(e.resolvedAt!).getTime();
    return sum + (resolveTime - triggerTime) / (1000 * 60);
  }, 0);

  return Math.round(totalMinutes / resolvedEvents.length);
}

/**
 * 알람 빈도 집계 (코드별)
 */
export function countAlarmsByCode(
  events: IAlarmEvent[]
): { alarmCode: string; count: number }[] {
  const counts = new Map<string, number>();

  for (const event of events) {
    counts.set(event.alarmCode, (counts.get(event.alarmCode) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([alarmCode, count]) => ({ alarmCode, count }))
    .sort((a, b) => b.count - a.count);
}

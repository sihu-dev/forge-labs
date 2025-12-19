/**
 * DRYON - Alarm Manager Agent
 * L3 (Tissues) - 알람 관리 에이전트
 *
 * ┌────────────────────────────────────────────────────────────────┐
 * │                   알람 관리 워크플로우                           │
 * ├────────────────────────────────────────────────────────────────┤
 * │                                                                │
 * │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
 * │  │   MONITOR   │───▶│   EVALUATE  │───▶│   TRIGGER   │        │
 * │  │  센서 모니터 │    │  규칙 평가   │    │  알람 발생   │        │
 * │  └─────────────┘    └─────────────┘    └─────────────┘        │
 * │         │                                     │                │
 * │         │           ┌─────────────┐           │                │
 * │         └──────────▶│  ESCALATE   │◀──────────┘                │
 * │                     │  에스컬레이션 │                            │
 * │                     └─────────────┘                            │
 * │                            │                                   │
 * │                     ┌─────────────┐                            │
 * │                     │   NOTIFY    │                            │
 * │                     │  알림 전송   │                            │
 * │                     └─────────────┘                            │
 * │                                                                │
 * └────────────────────────────────────────────────────────────────┘
 */

import type { DryonTypes } from '@forge/types';
import type { IAlarmRepository } from '@forge/core';
import {
  evaluateAlarmCondition,
  evaluateAlarmRule,
  checkDeadband,
  prioritizeAlarms,
  filterNeedingEscalation,
  type IConditionEvalResult,
  type IRuleEvalResult,
} from '@forge/utils';

type IAlarm = DryonTypes.IAlarm;
type IAlarmEvent = DryonTypes.IAlarmEvent;
type IAlarmRule = DryonTypes.IAlarmRule;
type AlarmPriority = DryonTypes.AlarmPriority;

/**
 * 알람 관리자 설정
 */
export interface IAlarmManagerAgentConfig {
  /** 평가 주기 (ms) - 기본 5초 */
  evaluationIntervalMs: number;
  /** 에스컬레이션 체크 주기 (ms) - 기본 1분 */
  escalationCheckIntervalMs: number;
  /** 기본 데드밴드 (%) - 기본 5% */
  defaultDeadbandPercent: number;
  /** 알림 핸들러 */
  notificationHandler?: INotificationHandler;
}

/**
 * 알림 핸들러 인터페이스
 */
export interface INotificationHandler {
  /** 알람 발생 알림 */
  onAlarmTriggered(event: IAlarmEvent, alarm: IAlarm): Promise<void>;
  /** 에스컬레이션 알림 */
  onEscalation(
    event: IAlarmEvent,
    level: number,
    notifyTo: string[]
  ): Promise<void>;
  /** 알람 해제 알림 */
  onAlarmResolved(event: IAlarmEvent): Promise<void>;
}

/**
 * 평가 결과
 */
export interface IEvaluationResult {
  /** 평가 시간 */
  evaluatedAt: string;
  /** 총 알람 수 */
  totalAlarms: number;
  /** 트리거된 알람 수 */
  triggeredCount: number;
  /** 새로 생성된 이벤트 */
  newEvents: IAlarmEvent[];
  /** 해제된 이벤트 */
  resolvedEvents: IAlarmEvent[];
  /** 상세 결과 */
  details: {
    alarmCode: string;
    ruleResult: IRuleEvalResult;
  }[];
}

/**
 * 에스컬레이션 결과
 */
export interface IEscalationResult {
  /** 처리 시간 */
  processedAt: string;
  /** 에스컬레이션된 이벤트 수 */
  escalatedCount: number;
  /** 에스컬레이션 상세 */
  details: {
    eventId: string;
    alarmCode: string;
    newLevel: number;
    notifiedTo: string[];
  }[];
}

/**
 * 대시보드 데이터
 */
export interface IAlarmDashboardData {
  /** 현재 활성 알람 수 */
  activeCount: number;
  /** 우선순위별 활성 알람 */
  activeByPriority: Record<AlarmPriority, number>;
  /** 미확인 알람 수 */
  unacknowledgedCount: number;
  /** 최근 이벤트 (최대 10개) */
  recentEvents: IAlarmEvent[];
  /** 오늘 통계 */
  todayStats: {
    triggered: number;
    acknowledged: number;
    resolved: number;
  };
}

/**
 * 알람 관리자 에이전트
 */
export class AlarmManagerAgent {
  private readonly config: IAlarmManagerAgentConfig;
  private readonly alarmRepo: IAlarmRepository;

  /** 이전 트리거 상태 캐시 (데드밴드용) */
  private previousTriggerState: Map<string, boolean> = new Map();

  /** 실행 중인 인터벌 */
  private evaluationInterval?: ReturnType<typeof setInterval>;
  private escalationInterval?: ReturnType<typeof setInterval>;

  constructor(
    alarmRepo: IAlarmRepository,
    config?: Partial<IAlarmManagerAgentConfig>
  ) {
    this.alarmRepo = alarmRepo;
    this.config = {
      evaluationIntervalMs: 5000,
      escalationCheckIntervalMs: 60000,
      defaultDeadbandPercent: 5,
      ...config,
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // 알람 정의 관리
  // ═══════════════════════════════════════════════════════════════

  /**
   * 알람 등록
   */
  async registerAlarm(alarm: IAlarm): Promise<IAlarm> {
    return this.alarmRepo.createAlarm(alarm);
  }

  /**
   * 알람 활성화/비활성화
   */
  async setAlarmEnabled(alarmId: string, enabled: boolean): Promise<IAlarm | null> {
    const alarm = await this.alarmRepo.getAlarmById(alarmId);
    if (!alarm) return null;

    return this.alarmRepo.updateAlarm(alarmId, {
      rule: { ...alarm.rule, enabled },
    });
  }

  /**
   * 알람 목록 조회
   */
  async getAlarms(): Promise<IAlarm[]> {
    return this.alarmRepo.getAllAlarms();
  }

  // ═══════════════════════════════════════════════════════════════
  // 센서 데이터 평가
  // ═══════════════════════════════════════════════════════════════

  /**
   * 센서 데이터 평가 및 알람 트리거
   */
  async evaluateSensorData(
    sensorValues: Record<string, number>
  ): Promise<IEvaluationResult> {
    const alarms = await this.alarmRepo.getEnabledAlarms();
    const activeEvents = await this.alarmRepo.getActiveEvents();

    const newEvents: IAlarmEvent[] = [];
    const resolvedEvents: IAlarmEvent[] = [];
    const details: { alarmCode: string; ruleResult: IRuleEvalResult }[] = [];

    for (const alarm of alarms) {
      // 규칙 평가
      const ruleResult = evaluateAlarmRule(alarm.rule, sensorValues);
      details.push({ alarmCode: alarm.code, ruleResult });

      // 현재 활성 이벤트 확인
      const existingEvent = activeEvents.find(e => e.alarmCode === alarm.code);

      // 데드밴드 체크
      const prevTriggered = this.previousTriggerState.get(alarm.code) ?? false;
      const deadband = alarm.rule.deadband ?? this.config.defaultDeadbandPercent;

      // 조건별 데드밴드 적용
      let shouldTrigger = ruleResult.triggered;
      if (prevTriggered && !ruleResult.triggered) {
        // 복귀 시 데드밴드 체크
        const stillTriggered = alarm.rule.conditions.some(cond => {
          const value = sensorValues[cond.field] ?? 0;
          return checkDeadband(cond, value, true, deadband);
        });
        shouldTrigger = stillTriggered;
      }

      // 상태 캐시 업데이트
      this.previousTriggerState.set(alarm.code, shouldTrigger);

      if (shouldTrigger && !existingEvent) {
        // 새 알람 이벤트 생성
        const event = this.createAlarmEvent(alarm, sensorValues, ruleResult.reason);
        await this.alarmRepo.createEvent(event);
        newEvents.push(event);

        // 알림 전송
        if (this.config.notificationHandler) {
          await this.config.notificationHandler.onAlarmTriggered(event, alarm);
        }
      } else if (!shouldTrigger && existingEvent) {
        // 알람 자동 해제
        const resolved = await this.alarmRepo.updateEventStatus(
          existingEvent.id,
          'resolved',
          { resolution: '조건 정상화로 자동 해제' }
        );
        if (resolved) {
          resolvedEvents.push(resolved);
          if (this.config.notificationHandler) {
            await this.config.notificationHandler.onAlarmResolved(resolved);
          }
        }
      }
    }

    return {
      evaluatedAt: new Date().toISOString(),
      totalAlarms: alarms.length,
      triggeredCount: newEvents.length,
      newEvents,
      resolvedEvents,
      details,
    };
  }

  /**
   * 알람 이벤트 생성 헬퍼
   */
  private createAlarmEvent(
    alarm: IAlarm,
    sensorValues: Record<string, number>,
    reason: string
  ): IAlarmEvent {
    return {
      id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      alarmId: alarm.id,
      alarmCode: alarm.code,
      status: 'active',
      priority: alarm.priority,
      triggeredAt: new Date().toISOString(),
      triggerValues: { ...sensorValues },
      triggerReason: reason,
      escalationLevel: 0,
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // 에스컬레이션 처리
  // ═══════════════════════════════════════════════════════════════

  /**
   * 에스컬레이션 체크 및 처리
   */
  async processEscalations(): Promise<IEscalationResult> {
    const activeEvents = await this.alarmRepo.getActiveEvents();
    const needingEscalation = filterNeedingEscalation(activeEvents);

    const details: {
      eventId: string;
      alarmCode: string;
      newLevel: number;
      notifiedTo: string[];
    }[] = [];

    for (const event of needingEscalation) {
      const alarm = await this.alarmRepo.getAlarmById(event.alarmId);
      if (!alarm?.escalation?.enabled) continue;

      const currentLevel = event.escalationLevel;
      const nextLevel = currentLevel + 1;

      if (nextLevel > alarm.escalation.maxLevel) continue;

      const levelConfig = alarm.escalation.levels.find(l => l.level === nextLevel);
      if (!levelConfig) continue;

      // 에스컬레이션 레벨 업데이트
      await this.alarmRepo.updateEscalationLevel(
        event.id,
        nextLevel,
        levelConfig.notifyTo,
        levelConfig.autoActions
      );

      details.push({
        eventId: event.id,
        alarmCode: event.alarmCode,
        newLevel: nextLevel,
        notifiedTo: levelConfig.notifyTo,
      });

      // 에스컬레이션 알림
      if (this.config.notificationHandler) {
        await this.config.notificationHandler.onEscalation(
          event,
          nextLevel,
          levelConfig.notifyTo
        );
      }
    }

    return {
      processedAt: new Date().toISOString(),
      escalatedCount: details.length,
      details,
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // 이벤트 관리
  // ═══════════════════════════════════════════════════════════════

  /**
   * 알람 확인 (Acknowledge)
   */
  async acknowledgeEvent(
    eventId: string,
    acknowledgedBy: string,
    note?: string
  ): Promise<IAlarmEvent | null> {
    return this.alarmRepo.updateEventStatus(eventId, 'acknowledged', {
      acknowledgedBy,
      acknowledgeNote: note,
    });
  }

  /**
   * 알람 해결 (Resolve)
   */
  async resolveEvent(
    eventId: string,
    resolvedBy: string,
    rootCause?: string,
    resolution?: string
  ): Promise<IAlarmEvent | null> {
    const resolved = await this.alarmRepo.updateEventStatus(eventId, 'resolved', {
      resolvedBy,
      rootCause,
      resolution,
    });

    if (resolved && this.config.notificationHandler) {
      await this.config.notificationHandler.onAlarmResolved(resolved);
    }

    return resolved;
  }

  /**
   * 활성 이벤트 조회
   */
  async getActiveEvents(): Promise<IAlarmEvent[]> {
    const events = await this.alarmRepo.getActiveEvents();
    return prioritizeAlarms(events);
  }

  // ═══════════════════════════════════════════════════════════════
  // 대시보드
  // ═══════════════════════════════════════════════════════════════

  /**
   * 대시보드 데이터 조회
   */
  async getDashboardData(): Promise<IAlarmDashboardData> {
    const activeEvents = await this.alarmRepo.getActiveEvents();
    const unackCount = await this.alarmRepo.countUnacknowledged();

    // 우선순위별 집계
    const activeByPriority: Record<AlarmPriority, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };
    for (const event of activeEvents) {
      activeByPriority[event.priority]++;
    }

    // 오늘 통계
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString();
    const tomorrowStr = new Date(today.getTime() + 86400000).toISOString();

    const todayEvents = await this.alarmRepo.getEvents({
      dateRange: { start: todayStr, end: tomorrowStr },
    });

    const todayStats = {
      triggered: todayEvents.length,
      acknowledged: todayEvents.filter(e => e.acknowledgedAt).length,
      resolved: todayEvents.filter(e => e.resolvedAt).length,
    };

    // 최근 이벤트 (우선순위 정렬)
    const recentEvents = prioritizeAlarms(activeEvents).slice(0, 10);

    return {
      activeCount: activeEvents.length,
      activeByPriority,
      unacknowledgedCount: unackCount,
      recentEvents,
      todayStats,
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // 자동 실행 (선택적)
  // ═══════════════════════════════════════════════════════════════

  /**
   * 자동 평가/에스컬레이션 시작
   */
  startAutoEvaluation(
    getSensorData: () => Promise<Record<string, number>>
  ): void {
    // 평가 주기
    this.evaluationInterval = setInterval(async () => {
      const sensorData = await getSensorData();
      await this.evaluateSensorData(sensorData);
    }, this.config.evaluationIntervalMs);

    // 에스컬레이션 주기
    this.escalationInterval = setInterval(async () => {
      await this.processEscalations();
    }, this.config.escalationCheckIntervalMs);
  }

  /**
   * 자동 실행 중지
   */
  stopAutoEvaluation(): void {
    if (this.evaluationInterval) {
      clearInterval(this.evaluationInterval);
      this.evaluationInterval = undefined;
    }
    if (this.escalationInterval) {
      clearInterval(this.escalationInterval);
      this.escalationInterval = undefined;
    }
  }
}

/**
 * 알람 관리자 에이전트 팩토리
 */
export function createAlarmManagerAgent(
  alarmRepo: IAlarmRepository,
  config?: Partial<IAlarmManagerAgentConfig>
): AlarmManagerAgent {
  return new AlarmManagerAgent(alarmRepo, config);
}

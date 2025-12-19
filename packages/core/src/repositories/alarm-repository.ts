/**
 * @forge/core - Alarm Repository
 * L2 (Cells) - 알람 데이터 저장소
 *
 * 알람 정의 및 이벤트 CRUD
 */

import type { DryonTypes } from '@forge/types';

type IAlarm = DryonTypes.IAlarm;
type IAlarmEvent = DryonTypes.IAlarmEvent;
type IAlarmFilter = DryonTypes.IAlarmFilter;
type AlarmStatus = DryonTypes.AlarmStatus;

/**
 * 알람 저장소 인터페이스
 */
export interface IAlarmRepository {
  // ═══════════════════════════════════════════════════════════════
  // 알람 정의 CRUD
  // ═══════════════════════════════════════════════════════════════

  /** 알람 생성 */
  createAlarm(alarm: IAlarm): Promise<IAlarm>;

  /** 알람 조회 (ID) */
  getAlarmById(alarmId: string): Promise<IAlarm | null>;

  /** 알람 조회 (코드) */
  getAlarmByCode(code: string): Promise<IAlarm | null>;

  /** 전체 알람 목록 */
  getAllAlarms(): Promise<IAlarm[]>;

  /** 활성화된 알람 목록 */
  getEnabledAlarms(): Promise<IAlarm[]>;

  /** 알람 업데이트 */
  updateAlarm(alarmId: string, updates: Partial<IAlarm>): Promise<IAlarm | null>;

  /** 알람 삭제 */
  deleteAlarm(alarmId: string): Promise<boolean>;

  // ═══════════════════════════════════════════════════════════════
  // 알람 이벤트 CRUD
  // ═══════════════════════════════════════════════════════════════

  /** 이벤트 생성 (알람 발생) */
  createEvent(event: IAlarmEvent): Promise<IAlarmEvent>;

  /** 이벤트 조회 */
  getEventById(eventId: string): Promise<IAlarmEvent | null>;

  /** 이벤트 목록 (필터) */
  getEvents(filter?: IAlarmFilter): Promise<IAlarmEvent[]>;

  /** 활성 이벤트 목록 */
  getActiveEvents(): Promise<IAlarmEvent[]>;

  /** 이벤트 상태 업데이트 */
  updateEventStatus(
    eventId: string,
    status: AlarmStatus,
    metadata?: {
      acknowledgedBy?: string;
      acknowledgeNote?: string;
      resolvedBy?: string;
      rootCause?: string;
      resolution?: string;
    }
  ): Promise<IAlarmEvent | null>;

  /** 에스컬레이션 레벨 업데이트 */
  updateEscalationLevel(
    eventId: string,
    level: number,
    notifiedTo: string[],
    actionsPerformed?: string[]
  ): Promise<IAlarmEvent | null>;

  /** 이벤트 삭제 */
  deleteEvent(eventId: string): Promise<boolean>;

  // ═══════════════════════════════════════════════════════════════
  // 통계 쿼리
  // ═══════════════════════════════════════════════════════════════

  /** 기간별 이벤트 수 */
  countEventsByPeriod(
    startDate: string,
    endDate: string
  ): Promise<{ date: string; count: number }[]>;

  /** 알람 코드별 빈도 */
  countByAlarmCode(): Promise<{ alarmCode: string; count: number }[]>;

  /** 미확인 이벤트 수 */
  countUnacknowledged(): Promise<number>;
}

/**
 * In-Memory 알람 저장소 구현
 */
export class InMemoryAlarmRepository implements IAlarmRepository {
  private alarms: Map<string, IAlarm> = new Map();
  private alarmsByCode: Map<string, string> = new Map(); // code -> id
  private events: Map<string, IAlarmEvent> = new Map();

  // ═══════════════════════════════════════════════════════════════
  // 알람 정의 CRUD
  // ═══════════════════════════════════════════════════════════════

  async createAlarm(alarm: IAlarm): Promise<IAlarm> {
    this.alarms.set(alarm.id, alarm);
    this.alarmsByCode.set(alarm.code, alarm.id);
    return alarm;
  }

  async getAlarmById(alarmId: string): Promise<IAlarm | null> {
    return this.alarms.get(alarmId) ?? null;
  }

  async getAlarmByCode(code: string): Promise<IAlarm | null> {
    const alarmId = this.alarmsByCode.get(code);
    if (!alarmId) return null;
    return this.alarms.get(alarmId) ?? null;
  }

  async getAllAlarms(): Promise<IAlarm[]> {
    return Array.from(this.alarms.values());
  }

  async getEnabledAlarms(): Promise<IAlarm[]> {
    return Array.from(this.alarms.values()).filter(a => a.rule.enabled);
  }

  async updateAlarm(
    alarmId: string,
    updates: Partial<IAlarm>
  ): Promise<IAlarm | null> {
    const alarm = this.alarms.get(alarmId);
    if (!alarm) return null;

    const updated: IAlarm = {
      ...alarm,
      ...updates,
      id: alarm.id, // ID 변경 방지
      code: alarm.code, // 코드 변경 방지
      metadata: {
        ...alarm.metadata,
        updatedAt: new Date().toISOString(),
      },
    };

    this.alarms.set(alarmId, updated);
    return updated;
  }

  async deleteAlarm(alarmId: string): Promise<boolean> {
    const alarm = this.alarms.get(alarmId);
    if (!alarm) return false;

    this.alarmsByCode.delete(alarm.code);
    return this.alarms.delete(alarmId);
  }

  // ═══════════════════════════════════════════════════════════════
  // 알람 이벤트 CRUD
  // ═══════════════════════════════════════════════════════════════

  async createEvent(event: IAlarmEvent): Promise<IAlarmEvent> {
    this.events.set(event.id, event);
    return event;
  }

  async getEventById(eventId: string): Promise<IAlarmEvent | null> {
    return this.events.get(eventId) ?? null;
  }

  async getEvents(filter?: IAlarmFilter): Promise<IAlarmEvent[]> {
    let events = Array.from(this.events.values());

    if (filter) {
      // 상태 필터
      if (filter.status && filter.status.length > 0) {
        events = events.filter(e => filter.status!.includes(e.status));
      }

      // 우선순위 필터
      if (filter.priority && filter.priority.length > 0) {
        events = events.filter(e => filter.priority!.includes(e.priority));
      }

      // 기간 필터
      if (filter.dateRange) {
        const startTime = new Date(filter.dateRange.start).getTime();
        const endTime = new Date(filter.dateRange.end).getTime();
        events = events.filter(e => {
          const triggerTime = new Date(e.triggeredAt).getTime();
          return triggerTime >= startTime && triggerTime <= endTime;
        });
      }

      // 알람 코드 필터
      if (filter.alarmCodes && filter.alarmCodes.length > 0) {
        events = events.filter(e => filter.alarmCodes!.includes(e.alarmCode));
      }
    }

    // 최신순 정렬
    return events.sort(
      (a, b) =>
        new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime()
    );
  }

  async getActiveEvents(): Promise<IAlarmEvent[]> {
    return this.getEvents({ status: ['active'] });
  }

  async updateEventStatus(
    eventId: string,
    status: AlarmStatus,
    metadata?: {
      acknowledgedBy?: string;
      acknowledgeNote?: string;
      resolvedBy?: string;
      rootCause?: string;
      resolution?: string;
    }
  ): Promise<IAlarmEvent | null> {
    const event = this.events.get(eventId);
    if (!event) return null;

    const now = new Date().toISOString();

    const updated: IAlarmEvent = {
      ...event,
      status,
    };

    // 상태별 메타데이터 업데이트
    if (status === 'acknowledged' && metadata) {
      updated.acknowledgedBy = metadata.acknowledgedBy;
      updated.acknowledgedAt = now;
      updated.acknowledgeNote = metadata.acknowledgeNote;
    }

    if (status === 'resolved' && metadata) {
      updated.resolvedBy = metadata.resolvedBy;
      updated.resolvedAt = now;
      updated.rootCause = metadata.rootCause;
      updated.resolution = metadata.resolution;

      // 지속 시간 계산
      const triggerTime = new Date(event.triggeredAt).getTime();
      updated.durationMs = Date.now() - triggerTime;
    }

    this.events.set(eventId, updated);
    return updated;
  }

  async updateEscalationLevel(
    eventId: string,
    level: number,
    notifiedTo: string[],
    actionsPerformed?: string[]
  ): Promise<IAlarmEvent | null> {
    const event = this.events.get(eventId);
    if (!event) return null;

    const escalationEntry = {
      level,
      at: new Date().toISOString(),
      notifiedTo,
      actionsPerformed,
    };

    const updated: IAlarmEvent = {
      ...event,
      escalationLevel: level,
      escalationHistory: [...(event.escalationHistory ?? []), escalationEntry],
    };

    this.events.set(eventId, updated);
    return updated;
  }

  async deleteEvent(eventId: string): Promise<boolean> {
    return this.events.delete(eventId);
  }

  // ═══════════════════════════════════════════════════════════════
  // 통계 쿼리
  // ═══════════════════════════════════════════════════════════════

  async countEventsByPeriod(
    startDate: string,
    endDate: string
  ): Promise<{ date: string; count: number }[]> {
    const startTime = new Date(startDate).getTime();
    const endTime = new Date(endDate).getTime();

    const counts = new Map<string, number>();

    for (const event of this.events.values()) {
      const triggerTime = new Date(event.triggeredAt).getTime();
      if (triggerTime >= startTime && triggerTime <= endTime) {
        const dateKey = event.triggeredAt.split('T')[0];
        counts.set(dateKey, (counts.get(dateKey) ?? 0) + 1);
      }
    }

    return Array.from(counts.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  async countByAlarmCode(): Promise<{ alarmCode: string; count: number }[]> {
    const counts = new Map<string, number>();

    for (const event of this.events.values()) {
      counts.set(event.alarmCode, (counts.get(event.alarmCode) ?? 0) + 1);
    }

    return Array.from(counts.entries())
      .map(([alarmCode, count]) => ({ alarmCode, count }))
      .sort((a, b) => b.count - a.count);
  }

  async countUnacknowledged(): Promise<number> {
    let count = 0;
    for (const event of this.events.values()) {
      if (event.status === 'active' && !event.acknowledgedAt) {
        count++;
      }
    }
    return count;
  }
}

/**
 * 알람 저장소 팩토리
 */
export function createAlarmRepository(): IAlarmRepository {
  return new InMemoryAlarmRepository();
}

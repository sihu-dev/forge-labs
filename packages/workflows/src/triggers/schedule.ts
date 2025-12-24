/**
 * 스케줄 트리거 핸들러
 *
 * Cron 표현식 기반 워크플로우 스케줄링
 */

import type { IScheduleTrigger } from '../types.js';

export interface IScheduleExecution {
  scheduled_at: string;
  actual_at: string;
  delay_ms: number;
}

/**
 * Cron 표현식 검증
 */
export function validateCronExpression(expression: string): {
  valid: boolean;
  error?: string;
} {
  // 기본 Cron 형식: 분 시 일 월 요일
  // 예: "0 9 * * *" = 매일 오전 9시
  const parts = expression.trim().split(/\s+/);

  if (parts.length !== 5) {
    return {
      valid: false,
      error: 'Cron expression must have 5 parts (minute hour day month weekday)',
    };
  }

  const [minute, hour, day, month, weekday] = parts;

  // 각 필드 검증
  const validations = [
    { name: 'minute', value: minute, min: 0, max: 59 },
    { name: 'hour', value: hour, min: 0, max: 23 },
    { name: 'day', value: day, min: 1, max: 31 },
    { name: 'month', value: month, min: 1, max: 12 },
    { name: 'weekday', value: weekday, min: 0, max: 6 },
  ];

  for (const field of validations) {
    if (field.value === '*' || field.value === '*/') {
      continue; // 와일드카드는 항상 유효
    }

    // 간격 표현 (*/5)
    if (field.value.startsWith('*/')) {
      const interval = parseInt(field.value.slice(2), 10);
      if (isNaN(interval) || interval < 1) {
        return {
          valid: false,
          error: `Invalid interval in ${field.name}: ${field.value}`,
        };
      }
      continue;
    }

    // 범위 표현 (1-5)
    if (field.value.includes('-')) {
      const [start, end] = field.value.split('-').map((v) => parseInt(v, 10));
      if (isNaN(start) || isNaN(end) || start > end || start < field.min || end > field.max) {
        return {
          valid: false,
          error: `Invalid range in ${field.name}: ${field.value}`,
        };
      }
      continue;
    }

    // 리스트 표현 (1,3,5)
    if (field.value.includes(',')) {
      const values = field.value.split(',').map((v) => parseInt(v, 10));
      if (values.some((v) => isNaN(v) || v < field.min || v > field.max)) {
        return {
          valid: false,
          error: `Invalid list in ${field.name}: ${field.value}`,
        };
      }
      continue;
    }

    // 단일 값
    const value = parseInt(field.value, 10);
    if (isNaN(value) || value < field.min || value > field.max) {
      return {
        valid: false,
        error: `Invalid value in ${field.name}: ${field.value} (must be ${field.min}-${field.max})`,
      };
    }
  }

  return { valid: true };
}

/**
 * 다음 실행 시간 계산
 */
export function getNextExecutionTime(cronExpression: string, timezone?: string): Date {
  // 실제 구현에서는 cron-parser 같은 라이브러리 사용
  // 여기서는 간단한 예시
  const now = new Date();
  const [minute, hour, day, month, weekday] = cronExpression.split(/\s+/);

  // 간단한 구현: 매시간 실행 (*/N)
  if (minute.startsWith('*/')) {
    const interval = parseInt(minute.slice(2), 10);
    const nextMinute = Math.ceil(now.getMinutes() / interval) * interval;
    const next = new Date(now);
    next.setMinutes(nextMinute, 0, 0);
    if (next <= now) {
      next.setHours(next.getHours() + 1);
    }
    return next;
  }

  // 매일 특정 시간 (0 H * * *)
  if (minute === '0' && hour !== '*') {
    const targetHour = parseInt(hour, 10);
    const next = new Date(now);
    next.setHours(targetHour, 0, 0, 0);
    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }
    return next;
  }

  // 기본: 다음 시간
  const next = new Date(now);
  next.setHours(next.getHours() + 1, 0, 0, 0);
  return next;
}

/**
 * 스케줄 실행 기록 생성
 */
export function createScheduleExecution(scheduledTime: Date): IScheduleExecution {
  const now = new Date();
  return {
    scheduled_at: scheduledTime.toISOString(),
    actual_at: now.toISOString(),
    delay_ms: now.getTime() - scheduledTime.getTime(),
  };
}

/**
 * 일반적인 Cron 패턴
 */
export const COMMON_CRON_PATTERNS = {
  EVERY_MINUTE: '* * * * *',
  EVERY_5_MINUTES: '*/5 * * * *',
  EVERY_15_MINUTES: '*/15 * * * *',
  EVERY_30_MINUTES: '*/30 * * * *',
  EVERY_HOUR: '0 * * * *',
  EVERY_2_HOURS: '0 */2 * * *',
  EVERY_6_HOURS: '0 */6 * * *',
  EVERY_12_HOURS: '0 */12 * * *',
  DAILY_9AM: '0 9 * * *',
  DAILY_MIDNIGHT: '0 0 * * *',
  DAILY_NOON: '0 12 * * *',
  WEEKLY_MONDAY_9AM: '0 9 * * 1',
  MONTHLY_FIRST_9AM: '0 9 1 * *',
} as const;

/**
 * Cron 표현식을 사람이 읽을 수 있는 형식으로 변환
 */
export function cronToHumanReadable(expression: string): string {
  const patterns: Record<string, string> = {
    '* * * * *': '매 분마다',
    '*/5 * * * *': '5분마다',
    '*/15 * * * *': '15분마다',
    '*/30 * * * *': '30분마다',
    '0 * * * *': '매 시간',
    '0 */2 * * *': '2시간마다',
    '0 9 * * *': '매일 오전 9시',
    '0 0 * * *': '매일 자정',
    '0 12 * * *': '매일 정오',
    '0 9 * * 1': '매주 월요일 오전 9시',
    '0 9 1 * *': '매월 1일 오전 9시',
  };

  return patterns[expression] || expression;
}

/**
 * 타임존 변환
 */
export function convertTimezone(date: Date, timezone: string): Date {
  // 실제로는 date-fns-tz 같은 라이브러리 사용
  // 여기서는 간단한 오프셋 처리
  const timezoneOffsets: Record<string, number> = {
    'UTC': 0,
    'Asia/Seoul': 9,
    'America/New_York': -5,
    'Europe/London': 0,
  };

  const offset = timezoneOffsets[timezone] || 0;
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  return new Date(utc + 3600000 * offset);
}

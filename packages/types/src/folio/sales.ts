/**
 * @forge/types - FOLIO Sales Types
 * L0 (Atoms) - 매출 데이터 타입 정의
 */

/**
 * 요일
 */
export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

/**
 * 시간대
 */
export type TimeSlot =
  | 'early_morning'   // 06:00-09:00
  | 'morning'         // 09:00-12:00
  | 'lunch'           // 12:00-14:00
  | 'afternoon'       // 14:00-17:00
  | 'dinner'          // 17:00-20:00
  | 'night'           // 20:00-23:00
  | 'late_night';     // 23:00-06:00

/**
 * 집계 기간
 */
export type AggregationPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

/**
 * 결제 수단
 */
export type PaymentMethod = 'card' | 'cash' | 'mobile' | 'other';

/**
 * 일별 매출 기록
 */
export interface ISalesRecord {
  /** ID */
  id: string;
  /** 날짜 (YYYY-MM-DD) */
  date: string;
  /** 요일 */
  dayOfWeek: DayOfWeek;
  /** 시간대 (선택) */
  timeSlot?: TimeSlot;

  /** 총 매출액 */
  revenue: number;
  /** 거래 건수 */
  transactionCount: number;
  /** 평균 객단가 */
  avgTicket: number;
  /** 고객 수 */
  customerCount: number;

  /** 결제 수단별 매출 */
  paymentBreakdown?: Record<PaymentMethod, number>;

  /** 메타데이터 */
  metadata?: {
    source?: 'pos' | 'manual' | 'card_company';
    importedAt?: string;
  };
}

/**
 * 시간대별 매출 상세
 */
export interface IHourlySales {
  /** 날짜 */
  date: string;
  /** 시간 (0-23) */
  hour: number;
  /** 매출액 */
  revenue: number;
  /** 거래 건수 */
  transactionCount: number;
}

/**
 * 매출 요약
 */
export interface ISalesSummary {
  /** 기간 */
  period: {
    start: string;
    end: string;
    type: AggregationPeriod;
  };

  /** 총 매출 */
  totalRevenue: number;
  /** 총 거래 건수 */
  totalTransactions: number;
  /** 평균 일매출 */
  avgDailyRevenue: number;
  /** 평균 객단가 */
  avgTicket: number;

  /** 전 기간 대비 증감률 (%) */
  revenueChange?: number;
  /** 전년 동기 대비 증감률 (%) */
  yearOverYearChange?: number;

  /** 요일별 매출 비중 */
  dayOfWeekDistribution: Record<DayOfWeek, number>;
  /** 시간대별 매출 비중 */
  timeSlotDistribution?: Record<TimeSlot, number>;
}

/**
 * 매출 트렌드 포인트
 */
export interface ISalesTrendPoint {
  /** 날짜/기간 */
  date: string;
  /** 매출액 */
  revenue: number;
  /** 이동평균 */
  movingAverage?: number;
  /** 추세선 값 */
  trendValue?: number;
}

/**
 * 시간대 범위 정의
 */
export const TIME_SLOT_RANGES: Record<TimeSlot, { start: number; end: number }> = {
  early_morning: { start: 6, end: 9 },
  morning: { start: 9, end: 12 },
  lunch: { start: 12, end: 14 },
  afternoon: { start: 14, end: 17 },
  dinner: { start: 17, end: 20 },
  night: { start: 20, end: 23 },
  late_night: { start: 23, end: 6 },
} as const;

/**
 * 요일 인덱스 (일요일 = 0)
 */
export const DAY_OF_WEEK_INDEX: Record<DayOfWeek, number> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
} as const;

/**
 * 시간을 시간대로 변환
 */
export function hourToTimeSlot(hour: number): TimeSlot {
  if (hour >= 6 && hour < 9) return 'early_morning';
  if (hour >= 9 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 14) return 'lunch';
  if (hour >= 14 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 20) return 'dinner';
  if (hour >= 20 && hour < 23) return 'night';
  return 'late_night';
}

/**
 * Date를 요일로 변환
 */
export function dateToDayOfWeek(date: Date): DayOfWeek {
  const days: DayOfWeek[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  return days[date.getDay()];
}

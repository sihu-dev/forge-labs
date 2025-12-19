/**
 * @forge/core - Sales Data Service
 * L2 (Cells) - 매출 데이터 서비스
 */

import { FolioTypes } from '@forge/types';
import type { IResult, Timestamp } from '@forge/types';

type ISalesRecord = FolioTypes.ISalesRecord;
type ISalesSummary = FolioTypes.ISalesSummary;
type AggregationPeriod = FolioTypes.AggregationPeriod;
type DayOfWeek = FolioTypes.DayOfWeek;

/**
 * 매출 데이터 서비스 인터페이스
 */
export interface ISalesDataService {
  /** 매출 기록 추가 */
  addSalesRecord(record: ISalesRecord): Promise<IResult<ISalesRecord>>;

  /** 기간별 매출 조회 */
  getSalesHistory(
    startDate: string,
    endDate: string
  ): Promise<IResult<ISalesRecord[]>>;

  /** 기간별 집계 */
  aggregateByPeriod(
    startDate: string,
    endDate: string,
    period: AggregationPeriod
  ): Promise<IResult<ISalesSummary>>;

  /** 요일별 평균 매출 */
  getAverageByDayOfWeek(
    startDate: string,
    endDate: string
  ): Promise<IResult<Record<DayOfWeek, number>>>;
}

/**
 * 인메모리 매출 데이터 서비스
 */
export class InMemorySalesDataService implements ISalesDataService {
  private records: Map<string, ISalesRecord> = new Map();

  /**
   * 테스트 데이터 생성
   */
  generateTestData(
    startDate: string,
    endDate: string,
    baseRevenue: number = 500000
  ): void {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const current = new Date(start);

    const dayMultipliers: Record<DayOfWeek, number> = {
      sun: 0.7,
      mon: 0.9,
      tue: 0.95,
      wed: 1.0,
      thu: 1.05,
      fri: 1.2,
      sat: 1.3,
    };

    while (current <= end) {
      const dayOfWeek = FolioTypes.dateToDayOfWeek(current);
      const multiplier = dayMultipliers[dayOfWeek];

      // 랜덤 변동 추가 (±15%)
      const randomFactor = 0.85 + Math.random() * 0.3;
      const revenue = baseRevenue * multiplier * randomFactor;

      const transactionCount = Math.floor(revenue / 15000) + Math.floor(Math.random() * 20);
      const avgTicket = revenue / transactionCount;

      const record: ISalesRecord = {
        id: crypto.randomUUID(),
        date: current.toISOString().split('T')[0],
        dayOfWeek,
        revenue: Math.round(revenue),
        transactionCount,
        avgTicket: Math.round(avgTicket),
        customerCount: Math.floor(transactionCount * 0.8),
      };

      this.records.set(record.id, record);
      current.setDate(current.getDate() + 1);
    }
  }

  async addSalesRecord(record: ISalesRecord): Promise<IResult<ISalesRecord>> {
    const startTime = Date.now();
    this.records.set(record.id, record);

    return {
      success: true,
      data: record,
      metadata: {
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      },
    };
  }

  async getSalesHistory(
    startDate: string,
    endDate: string
  ): Promise<IResult<ISalesRecord[]>> {
    const startTime = Date.now();
    const startMs = new Date(startDate).getTime();
    const endMs = new Date(endDate).getTime();

    const filtered = Array.from(this.records.values())
      .filter(r => {
        const recordMs = new Date(r.date).getTime();
        return recordMs >= startMs && recordMs <= endMs;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return {
      success: true,
      data: filtered,
      metadata: {
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      },
    };
  }

  async aggregateByPeriod(
    startDate: string,
    endDate: string,
    period: AggregationPeriod
  ): Promise<IResult<ISalesSummary>> {
    const startTime = Date.now();
    const historyResult = await this.getSalesHistory(startDate, endDate);

    if (!historyResult.success || !historyResult.data) {
      return {
        success: false,
        error: new Error('Failed to get sales history'),
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    }

    const records = historyResult.data;
    if (records.length === 0) {
      return {
        success: false,
        error: new Error('No sales records found'),
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    }

    const totalRevenue = records.reduce((sum, r) => sum + r.revenue, 0);
    const totalTransactions = records.reduce((sum, r) => sum + r.transactionCount, 0);
    const avgDailyRevenue = totalRevenue / records.length;
    const avgTicket = totalRevenue / totalTransactions;

    // 요일별 분포
    const dayOfWeekDistribution: Record<DayOfWeek, number> = {
      mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0,
    };

    for (const record of records) {
      dayOfWeekDistribution[record.dayOfWeek] += record.revenue;
    }

    // 비율로 변환
    for (const day of Object.keys(dayOfWeekDistribution) as DayOfWeek[]) {
      dayOfWeekDistribution[day] = (dayOfWeekDistribution[day] / totalRevenue) * 100;
    }

    const summary: ISalesSummary = {
      period: {
        start: startDate,
        end: endDate,
        type: period,
      },
      totalRevenue,
      totalTransactions,
      avgDailyRevenue,
      avgTicket,
      dayOfWeekDistribution,
    };

    return {
      success: true,
      data: summary,
      metadata: {
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      },
    };
  }

  async getAverageByDayOfWeek(
    startDate: string,
    endDate: string
  ): Promise<IResult<Record<DayOfWeek, number>>> {
    const startTime = Date.now();
    const historyResult = await this.getSalesHistory(startDate, endDate);

    if (!historyResult.success || !historyResult.data) {
      return {
        success: false,
        error: new Error('Failed to get sales history'),
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    }

    const records = historyResult.data;
    const sums: Record<DayOfWeek, number> = {
      mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0,
    };
    const counts: Record<DayOfWeek, number> = {
      mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0,
    };

    for (const record of records) {
      sums[record.dayOfWeek] += record.revenue;
      counts[record.dayOfWeek]++;
    }

    const averages: Record<DayOfWeek, number> = {} as Record<DayOfWeek, number>;
    for (const day of Object.keys(sums) as DayOfWeek[]) {
      averages[day] = counts[day] > 0 ? sums[day] / counts[day] : 0;
    }

    return {
      success: true,
      data: averages,
      metadata: {
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      },
    };
  }
}

/**
 * 매출 데이터 서비스 팩토리
 */
export function createSalesDataService(): ISalesDataService {
  return new InMemorySalesDataService();
}

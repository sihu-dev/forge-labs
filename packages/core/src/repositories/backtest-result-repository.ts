/**
 * @forge/core - Backtest Result Repository
 * L2 (Cells) - 백테스트 결과 저장소
 */

import type { HephaitosTypes, IResult, IPaginatedResult, Timestamp } from '@forge/types';

type IBacktestResult = HephaitosTypes.IBacktestResult;
type IBacktestSummary = HephaitosTypes.IBacktestSummary;
type IStrategyComparison = HephaitosTypes.IStrategyComparison;

/**
 * 백테스트 결과 저장소 인터페이스
 */
export interface IBacktestResultRepository {
  /** 결과 저장 */
  save(result: IBacktestResult): Promise<IResult<IBacktestResult>>;

  /** 결과 조회 */
  getById(id: string): Promise<IResult<IBacktestResult | null>>;

  /** 전략별 결과 목록 */
  listByStrategy(
    strategyId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<IPaginatedResult<IBacktestSummary>>;

  /** 최근 결과 목록 */
  listRecent(limit?: number): Promise<IResult<IBacktestSummary[]>>;

  /** 결과 삭제 */
  delete(id: string): Promise<IResult<boolean>>;

  /** 전략 비교 */
  compareStrategies(backtestIds: string[]): Promise<IResult<IStrategyComparison>>;
}

/**
 * 인메모리 백테스트 결과 저장소
 */
export class InMemoryBacktestResultRepository implements IBacktestResultRepository {
  private results: Map<string, IBacktestResult> = new Map();
  private strategyNames: Map<string, string> = new Map();

  /**
   * 전략 이름 설정 (요약용)
   */
  setStrategyName(strategyId: string, name: string): void {
    this.strategyNames.set(strategyId, name);
  }

  async save(result: IBacktestResult): Promise<IResult<IBacktestResult>> {
    const startTime = Date.now();

    this.results.set(result.id, result);

    return {
      success: true,
      data: result,
      metadata: {
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      },
    };
  }

  async getById(id: string): Promise<IResult<IBacktestResult | null>> {
    const startTime = Date.now();
    const result = this.results.get(id) ?? null;

    return {
      success: true,
      data: result,
      metadata: {
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      },
    };
  }

  async listByStrategy(
    strategyId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<IPaginatedResult<IBacktestSummary>> {
    const startTime = Date.now();
    const limit = options?.limit ?? 20;
    const offset = options?.offset ?? 0;

    const strategyResults = Array.from(this.results.values())
      .filter(r => r.strategyId === strategyId)
      .sort((a, b) =>
        new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
      );

    const total = strategyResults.length;
    const paginated = strategyResults.slice(offset, offset + limit);

    const summaries = paginated.map(r => this.toSummary(r));

    return {
      success: true,
      data: summaries,
      pagination: {
        page: Math.floor(offset / limit) + 1,
        limit,
        total,
        hasMore: offset + limit < total,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      },
    };
  }

  async listRecent(limit: number = 10): Promise<IResult<IBacktestSummary[]>> {
    const startTime = Date.now();

    const recentResults = Array.from(this.results.values())
      .filter(r => r.status === 'completed')
      .sort((a, b) =>
        new Date(b.completedAt ?? b.startedAt).getTime() -
        new Date(a.completedAt ?? a.startedAt).getTime()
      )
      .slice(0, limit);

    const summaries = recentResults.map(r => this.toSummary(r));

    return {
      success: true,
      data: summaries,
      metadata: {
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      },
    };
  }

  async delete(id: string): Promise<IResult<boolean>> {
    const startTime = Date.now();
    const deleted = this.results.delete(id);

    return {
      success: true,
      data: deleted,
      metadata: {
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      },
    };
  }

  async compareStrategies(
    backtestIds: string[]
  ): Promise<IResult<IStrategyComparison>> {
    const startTime = Date.now();

    const results: IBacktestResult[] = [];
    for (const id of backtestIds) {
      const result = this.results.get(id);
      if (result && result.status === 'completed') {
        results.push(result);
      }
    }

    if (results.length < 2) {
      return {
        success: false,
        error: new Error('At least 2 completed backtests required for comparison'),
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    }

    const summaries = results.map(r => this.toSummary(r));

    // 기간 계산 (모든 백테스트에서 겹치는 기간)
    const allTrades = results.flatMap(r => r.trades);
    const startDates = results.map(r =>
      r.trades.length > 0 ? new Date(r.trades[0].enteredAt) : new Date()
    );
    const endDates = results.map(r =>
      r.trades.length > 0
        ? new Date(r.trades[r.trades.length - 1].exitedAt)
        : new Date()
    );

    const periodStart = new Date(Math.max(...startDates.map(d => d.getTime())));
    const periodEnd = new Date(Math.min(...endDates.map(d => d.getTime())));

    // 순위 계산
    const byReturn = [...summaries]
      .sort((a, b) => b.totalReturn - a.totalReturn)
      .map(s => s.id);

    const bySharpe = [...summaries]
      .sort((a, b) => b.sharpeRatio - a.sharpeRatio)
      .map(s => s.id);

    const byDrawdown = [...summaries]
      .sort((a, b) => a.maxDrawdown - b.maxDrawdown) // 낮을수록 좋음
      .map(s => s.id);

    const byWinRate = [...summaries]
      .sort((a, b) => b.winRate - a.winRate)
      .map(s => s.id);

    const comparison: IStrategyComparison = {
      backtestIds,
      period: {
        start: periodStart.toISOString(),
        end: periodEnd.toISOString(),
      },
      summaries,
      rankings: {
        byReturn,
        bySharpe,
        byDrawdown,
        byWinRate,
      },
    };

    return {
      success: true,
      data: comparison,
      metadata: {
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      },
    };
  }

  /**
   * 결과를 요약으로 변환
   */
  private toSummary(result: IBacktestResult): IBacktestSummary {
    const startDate =
      result.trades.length > 0
        ? result.trades[0].enteredAt
        : result.startedAt;
    const endDate =
      result.trades.length > 0
        ? result.trades[result.trades.length - 1].exitedAt
        : result.completedAt ?? result.startedAt;

    return {
      id: result.id,
      strategyId: result.strategyId,
      strategyName: this.strategyNames.get(result.strategyId) ?? 'Unknown',
      status: result.status,
      startDate,
      endDate,
      totalReturn: result.metrics.totalReturn,
      sharpeRatio: result.metrics.sharpeRatio,
      maxDrawdown: result.metrics.maxDrawdown,
      winRate: result.metrics.winRate,
      totalTrades: result.metrics.totalTrades,
      completedAt: result.completedAt,
    };
  }
}

/**
 * 백테스트 결과 저장소 팩토리
 */
export function createBacktestResultRepository(): IBacktestResultRepository {
  return new InMemoryBacktestResultRepository();
}

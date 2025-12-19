/**
 * @forge/core - Portfolio Repository
 * L2 (Cells) - 포트폴리오 데이터 저장소
 */

import type { HephaitosTypes, IResult, IPaginatedResult, IPagination, Timestamp } from '@forge/types';

type IPortfolio = HephaitosTypes.IPortfolio;
type IPortfolioSnapshot = HephaitosTypes.IPortfolioSnapshot;
type ExchangeType = HephaitosTypes.ExchangeType;
type IAsset = HephaitosTypes.IAsset;

/**
 * 포트폴리오 저장소 인터페이스
 */
export interface IPortfolioRepository {
  /** 포트폴리오 저장 */
  save(portfolio: IPortfolio): Promise<IResult<IPortfolio>>;

  /** 포트폴리오 조회 (ID) */
  getById(id: string): Promise<IResult<IPortfolio | null>>;

  /** 사용자별 포트폴리오 목록 조회 */
  getByUserId(userId: string): Promise<IResult<IPortfolio[]>>;

  /** 포트폴리오 삭제 */
  delete(id: string): Promise<IResult<boolean>>;

  /** 포트폴리오 자산 업데이트 */
  updateAssets(
    portfolioId: string,
    assets: IAsset[],
    syncedAt: Timestamp
  ): Promise<IResult<IPortfolio>>;

  /** 스냅샷 저장 */
  saveSnapshot(snapshot: IPortfolioSnapshot): Promise<IResult<IPortfolioSnapshot>>;

  /** 스냅샷 목록 조회 */
  getSnapshots(
    portfolioId: string,
    startDate?: Date,
    endDate?: Date,
    pagination?: Partial<IPagination>
  ): Promise<IPaginatedResult<IPortfolioSnapshot>>;
}

/**
 * 포트폴리오 저장소 구현 (In-Memory - 개발용)
 */
export class InMemoryPortfolioRepository implements IPortfolioRepository {
  private portfolios: Map<string, IPortfolio> = new Map();
  private snapshots: Map<string, IPortfolioSnapshot[]> = new Map();

  async save(portfolio: IPortfolio): Promise<IResult<IPortfolio>> {
    const startTime = Date.now();

    try {
      this.portfolios.set(portfolio.id, { ...portfolio });

      return {
        success: true,
        data: portfolio,
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    }
  }

  async getById(id: string): Promise<IResult<IPortfolio | null>> {
    const startTime = Date.now();

    try {
      const portfolio = this.portfolios.get(id) ?? null;

      return {
        success: true,
        data: portfolio ? { ...portfolio } : null,
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    }
  }

  async getByUserId(userId: string): Promise<IResult<IPortfolio[]>> {
    const startTime = Date.now();

    try {
      const portfolios = Array.from(this.portfolios.values())
        .filter((p) => p.user_id === userId)
        .map((p) => ({ ...p }));

      return {
        success: true,
        data: portfolios,
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    }
  }

  async delete(id: string): Promise<IResult<boolean>> {
    const startTime = Date.now();

    try {
      const deleted = this.portfolios.delete(id);
      this.snapshots.delete(id);

      return {
        success: true,
        data: deleted,
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    }
  }

  async updateAssets(
    portfolioId: string,
    assets: IAsset[],
    syncedAt: Timestamp
  ): Promise<IResult<IPortfolio>> {
    const startTime = Date.now();

    try {
      const portfolio = this.portfolios.get(portfolioId);

      if (!portfolio) {
        return {
          success: false,
          error: new Error(`Portfolio not found: ${portfolioId}`),
          metadata: {
            timestamp: new Date().toISOString(),
            duration_ms: Date.now() - startTime,
          },
        };
      }

      const totalValue = assets.reduce((sum, a) => sum + a.value_usd, 0);

      const updated: IPortfolio = {
        ...portfolio,
        assets,
        total_value_usd: totalValue,
        synced_at: syncedAt,
        sync_status: 'success',
      };

      this.portfolios.set(portfolioId, updated);

      return {
        success: true,
        data: updated,
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    }
  }

  async saveSnapshot(snapshot: IPortfolioSnapshot): Promise<IResult<IPortfolioSnapshot>> {
    const startTime = Date.now();

    try {
      const existing = this.snapshots.get(snapshot.portfolio_id) ?? [];
      existing.push({ ...snapshot });
      this.snapshots.set(snapshot.portfolio_id, existing);

      return {
        success: true,
        data: snapshot,
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    }
  }

  async getSnapshots(
    portfolioId: string,
    startDate?: Date,
    endDate?: Date,
    pagination?: Partial<IPagination>
  ): Promise<IPaginatedResult<IPortfolioSnapshot>> {
    const startTime = Date.now();
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;

    try {
      let snapshots = this.snapshots.get(portfolioId) ?? [];

      // 날짜 필터링
      if (startDate) {
        snapshots = snapshots.filter(
          (s) => new Date(s.recorded_at) >= startDate
        );
      }
      if (endDate) {
        snapshots = snapshots.filter(
          (s) => new Date(s.recorded_at) <= endDate
        );
      }

      // 시간순 정렬
      snapshots.sort(
        (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
      );

      const total = snapshots.length;
      const offset = (page - 1) * limit;
      const paged = snapshots.slice(offset, offset + limit);

      return {
        success: true,
        data: paged.map((s) => ({ ...s })),
        pagination: {
          page,
          limit,
          total,
          hasMore: offset + limit < total,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error : new Error(String(error)),
        pagination: { page, limit, total: 0, hasMore: false },
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    }
  }
}

/**
 * 포트폴리오 저장소 인스턴스 생성
 */
export function createPortfolioRepository(
  type: 'memory' | 'supabase' = 'memory'
): IPortfolioRepository {
  switch (type) {
    case 'memory':
      return new InMemoryPortfolioRepository();
    case 'supabase':
      // TODO: Supabase 구현
      throw new Error('Supabase repository not implemented yet');
    default:
      throw new Error(`Unknown repository type: ${type}`);
  }
}

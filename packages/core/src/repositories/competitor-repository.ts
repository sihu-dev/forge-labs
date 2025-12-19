/**
 * @forge/core - Competitor Repository
 * L2 (Cells) - 경쟁사 데이터 저장소
 */

import type { FolioTypes, IResult, IPaginatedResult, IPagination, Timestamp } from '@forge/types';
import { calculateDistance } from '@forge/utils';

type ICompetitor = FolioTypes.ICompetitor;
type ICompetitorChange = FolioTypes.ICompetitorChange;
type ICompetitorFilter = FolioTypes.ICompetitorFilter;
type ICoordinates = FolioTypes.ICoordinates;
type BusinessCategory = FolioTypes.BusinessCategory;

/**
 * 경쟁사 저장소 인터페이스
 */
export interface ICompetitorRepository {
  /** 경쟁사 저장/업데이트 */
  save(competitor: ICompetitor): Promise<IResult<ICompetitor>>;

  /** ID로 조회 */
  getById(id: string): Promise<IResult<ICompetitor | null>>;

  /** 사용자 모니터링 목록 조회 */
  getByUserId(
    userId: string,
    filter?: ICompetitorFilter
  ): Promise<IResult<ICompetitor[]>>;

  /** 주변 경쟁사 조회 */
  getNearby(
    center: ICoordinates,
    radiusMeters: number,
    category?: BusinessCategory,
    pagination?: Partial<IPagination>
  ): Promise<IPaginatedResult<ICompetitor>>;

  /** 삭제 */
  delete(id: string): Promise<IResult<boolean>>;

  /** 변동 이력 저장 */
  saveChange(change: ICompetitorChange): Promise<IResult<ICompetitorChange>>;

  /** 변동 이력 조회 */
  getChanges(
    competitorId: string,
    since?: Date
  ): Promise<IResult<ICompetitorChange[]>>;
}

/**
 * 경쟁사 저장소 구현 (In-Memory)
 */
export class InMemoryCompetitorRepository implements ICompetitorRepository {
  private competitors: Map<string, ICompetitor> = new Map();
  private userMonitoring: Map<string, Set<string>> = new Map(); // userId -> competitorIds
  private changes: Map<string, ICompetitorChange[]> = new Map();

  async save(competitor: ICompetitor): Promise<IResult<ICompetitor>> {
    const startTime = Date.now();

    try {
      // 기존 데이터와 비교하여 변동 감지
      const existing = this.competitors.get(competitor.id);
      if (existing) {
        const changes = this.detectChanges(existing, competitor);
        for (const change of changes) {
          await this.saveChange(change);
        }
      }

      this.competitors.set(competitor.id, { ...competitor });

      return {
        success: true,
        data: competitor,
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

  async getById(id: string): Promise<IResult<ICompetitor | null>> {
    const startTime = Date.now();

    return {
      success: true,
      data: this.competitors.get(id) ?? null,
      metadata: {
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      },
    };
  }

  async getByUserId(
    userId: string,
    filter?: ICompetitorFilter
  ): Promise<IResult<ICompetitor[]>> {
    const startTime = Date.now();

    try {
      const monitoredIds = this.userMonitoring.get(userId) ?? new Set();
      let competitors = Array.from(monitoredIds)
        .map((id) => this.competitors.get(id))
        .filter((c): c is ICompetitor => c !== undefined);

      // 필터 적용
      if (filter) {
        competitors = this.applyFilter(competitors, filter);
      }

      return {
        success: true,
        data: competitors,
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

  async getNearby(
    center: ICoordinates,
    radiusMeters: number,
    category?: BusinessCategory,
    pagination?: Partial<IPagination>
  ): Promise<IPaginatedResult<ICompetitor>> {
    const startTime = Date.now();
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;

    try {
      let competitors = Array.from(this.competitors.values())
        .map((c) => ({
          ...c,
          distance: calculateDistance(center, c.location.coordinates),
        }))
        .filter((c) => c.distance <= radiusMeters);

      // 카테고리 필터
      if (category) {
        competitors = competitors.filter((c) => c.category === category);
      }

      // 거리순 정렬
      competitors.sort((a, b) => a.distance - b.distance);

      const total = competitors.length;
      const offset = (page - 1) * limit;
      const paged = competitors.slice(offset, offset + limit);

      return {
        success: true,
        data: paged,
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

  async delete(id: string): Promise<IResult<boolean>> {
    const startTime = Date.now();
    const deleted = this.competitors.delete(id);
    this.changes.delete(id);

    return {
      success: true,
      data: deleted,
      metadata: {
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      },
    };
  }

  async saveChange(change: ICompetitorChange): Promise<IResult<ICompetitorChange>> {
    const startTime = Date.now();

    const existing = this.changes.get(change.competitorId) ?? [];
    existing.push(change);
    this.changes.set(change.competitorId, existing);

    return {
      success: true,
      data: change,
      metadata: {
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      },
    };
  }

  async getChanges(
    competitorId: string,
    since?: Date
  ): Promise<IResult<ICompetitorChange[]>> {
    const startTime = Date.now();

    let changes = this.changes.get(competitorId) ?? [];

    if (since) {
      changes = changes.filter(
        (c) => new Date(c.detectedAt) >= since
      );
    }

    return {
      success: true,
      data: changes,
      metadata: {
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      },
    };
  }

  /** 사용자 모니터링 추가 */
  async addToMonitoring(userId: string, competitorId: string): Promise<void> {
    const monitoring = this.userMonitoring.get(userId) ?? new Set();
    monitoring.add(competitorId);
    this.userMonitoring.set(userId, monitoring);
  }

  /** 사용자 모니터링 제거 */
  async removeFromMonitoring(userId: string, competitorId: string): Promise<void> {
    const monitoring = this.userMonitoring.get(userId);
    if (monitoring) {
      monitoring.delete(competitorId);
    }
  }

  private applyFilter(
    competitors: ICompetitor[],
    filter: ICompetitorFilter
  ): ICompetitor[] {
    return competitors.filter((c) => {
      if (filter.category && c.category !== filter.category) return false;
      if (filter.minRating && c.rating < filter.minRating) return false;
      if (filter.source && c.source !== filter.source) return false;
      return true;
    });
  }

  private detectChanges(
    existing: ICompetitor,
    updated: ICompetitor
  ): ICompetitorChange[] {
    const changes: ICompetitorChange[] = [];
    const now = new Date().toISOString();

    // 평점 변동
    if (existing.rating !== updated.rating) {
      changes.push({
        competitorId: updated.id,
        changeType: 'rating',
        field: 'rating',
        oldValue: existing.rating,
        newValue: updated.rating,
        detectedAt: now,
      });
    }

    // 가격 변동 (간략화)
    if (
      existing.priceRange.min !== updated.priceRange.min ||
      existing.priceRange.max !== updated.priceRange.max
    ) {
      changes.push({
        competitorId: updated.id,
        changeType: 'price',
        field: 'priceRange',
        oldValue: existing.priceRange,
        newValue: updated.priceRange,
        detectedAt: now,
      });
    }

    // 메뉴 변동
    if (existing.products.length !== updated.products.length) {
      changes.push({
        competitorId: updated.id,
        changeType: 'menu',
        field: 'products',
        oldValue: existing.products.length,
        newValue: updated.products.length,
        detectedAt: now,
      });
    }

    return changes;
  }
}

/**
 * 경쟁사 저장소 생성
 */
export function createCompetitorRepository(
  type: 'memory' | 'supabase' = 'memory'
): ICompetitorRepository {
  switch (type) {
    case 'memory':
      return new InMemoryCompetitorRepository();
    case 'supabase':
      throw new Error('Supabase repository not implemented');
    default:
      throw new Error(`Unknown repository type: ${type}`);
  }
}

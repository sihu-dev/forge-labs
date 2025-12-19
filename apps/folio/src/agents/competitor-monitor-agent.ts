/**
 * FOLIO - Competitor Monitor Agent
 * L3 (Tissues) - 경쟁사 모니터링 에이전트
 *
 * 책임:
 * - 주변 경쟁사 탐색 및 수집
 * - 변동 감지 및 알림
 * - 주기적 모니터링
 */

import type { FolioTypes, IResult, Timestamp } from '@forge/types';
import {
  type IPlaceCrawlerService,
  type ICompetitorRepository,
  createPlaceCrawlerService,
} from '@forge/core';
import { calculateDistance, formatDistance } from '@forge/utils';

type ICompetitor = FolioTypes.ICompetitor;
type ICompetitorChange = FolioTypes.ICompetitorChange;
type ICoordinates = FolioTypes.ICoordinates;
type BusinessCategory = FolioTypes.BusinessCategory;
type DataSource = FolioTypes.DataSource;

/**
 * 에이전트 설정
 */
export interface ICompetitorMonitorAgentConfig {
  /** 검색 반경 (미터) */
  searchRadiusMeters: number;
  /** 최대 경쟁사 수 */
  maxCompetitors: number;
  /** 모니터링 간격 (ms) */
  monitoringIntervalMs: number;
  /** 사용할 데이터 소스 */
  dataSources: DataSource[];
}

/**
 * 기본 설정
 */
const DEFAULT_CONFIG: ICompetitorMonitorAgentConfig = {
  searchRadiusMeters: 1000,
  maxCompetitors: 50,
  monitoringIntervalMs: 3600000, // 1시간
  dataSources: ['naver_place', 'kakao_local'],
};

/**
 * 모니터링 결과
 */
export interface IMonitoringResult {
  userId: string;
  location: ICoordinates;
  competitorsFound: number;
  newCompetitors: number;
  changesDetected: number;
  timestamp: Timestamp;
}

/**
 * 경쟁사 모니터링 에이전트
 */
export class CompetitorMonitorAgent {
  private config: ICompetitorMonitorAgentConfig;
  private repository: ICompetitorRepository;
  private crawlers: Map<DataSource, IPlaceCrawlerService> = new Map();

  constructor(
    repository: ICompetitorRepository,
    credentials: {
      naver?: { clientId: string; clientSecret: string };
      kakao?: { restApiKey: string };
    },
    config: Partial<ICompetitorMonitorAgentConfig> = {}
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.repository = repository;

    // 크롤러 초기화
    if (credentials.naver) {
      this.crawlers.set(
        'naver_place',
        createPlaceCrawlerService('naver_place', credentials.naver)
      );
    }
    if (credentials.kakao) {
      this.crawlers.set(
        'kakao_local',
        createPlaceCrawlerService('kakao_local', credentials.kakao)
      );
    }
  }

  /**
   * 주변 경쟁사 탐색
   *
   * @param userId - 사용자 ID
   * @param center - 내 매장 위치
   * @param category - 업종 카테고리
   * @returns 탐색 결과
   */
  async discoverCompetitors(
    userId: string,
    center: ICoordinates,
    category?: BusinessCategory
  ): Promise<IResult<ICompetitor[]>> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();
    const allCompetitors: ICompetitor[] = [];

    try {
      // 모든 데이터 소스에서 검색
      for (const source of this.config.dataSources) {
        const crawler = this.crawlers.get(source);
        if (!crawler) continue;

        const result = await crawler.searchNearby(
          center,
          this.config.searchRadiusMeters,
          category
        );

        if (result.success && result.data) {
          allCompetitors.push(...result.data.places);
        }
      }

      // 중복 제거 (이름 + 주소 기준)
      const unique = this.deduplicateCompetitors(allCompetitors);

      // 거리 계산 및 정렬
      const sorted = unique
        .map((c) => ({
          ...c,
          distance: calculateDistance(center, c.location.coordinates),
        }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, this.config.maxCompetitors);

      // 저장
      for (const competitor of sorted) {
        await this.repository.save(competitor);
      }

      return {
        success: true,
        data: sorted,
        metadata: {
          timestamp,
          duration_ms: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        metadata: {
          timestamp,
          duration_ms: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * 모니터링 실행 (변동 감지)
   *
   * @param userId - 사용자 ID
   * @param center - 내 매장 위치
   * @param category - 업종 카테고리
   * @returns 모니터링 결과
   */
  async runMonitoring(
    userId: string,
    center: ICoordinates,
    category?: BusinessCategory
  ): Promise<IResult<IMonitoringResult>> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();

    try {
      // 기존 모니터링 목록 조회
      const existingResult = await this.repository.getByUserId(userId);
      const existingMap = new Map(
        (existingResult.data ?? []).map((c) => [c.id, c])
      );

      // 최신 데이터 수집
      const discoverResult = await this.discoverCompetitors(
        userId,
        center,
        category
      );

      if (!discoverResult.success || !discoverResult.data) {
        return {
          success: false,
          error: discoverResult.error,
          metadata: {
            timestamp,
            duration_ms: Date.now() - startTime,
          },
        };
      }

      const freshCompetitors = discoverResult.data;
      let newCount = 0;
      let changeCount = 0;

      // 변동 감지
      for (const competitor of freshCompetitors) {
        const existing = existingMap.get(competitor.id);

        if (!existing) {
          // 신규 경쟁사
          newCount++;
          const change: ICompetitorChange = {
            competitorId: competitor.id,
            changeType: 'new',
            newValue: competitor.name,
            detectedAt: timestamp,
          };
          await this.repository.saveChange(change);
        }
      }

      // 기존 경쟁사 업데이트 시 변동 카운트
      const changesResult = await this.repository.getChanges(
        '',  // 전체
        new Date(Date.now() - 60000) // 최근 1분
      );
      changeCount = changesResult.data?.length ?? 0;

      const result: IMonitoringResult = {
        userId,
        location: center,
        competitorsFound: freshCompetitors.length,
        newCompetitors: newCount,
        changesDetected: changeCount,
        timestamp,
      };

      return {
        success: true,
        data: result,
        metadata: {
          timestamp,
          duration_ms: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        metadata: {
          timestamp,
          duration_ms: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * 경쟁사 상세 분석
   */
  async analyzeCompetitor(
    competitorId: string
  ): Promise<IResult<ICompetitorAnalysis>> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();

    try {
      const competitorResult = await this.repository.getById(competitorId);

      if (!competitorResult.success || !competitorResult.data) {
        return {
          success: false,
          error: new Error('Competitor not found'),
          metadata: {
            timestamp,
            duration_ms: Date.now() - startTime,
          },
        };
      }

      const competitor = competitorResult.data;
      const changesResult = await this.repository.getChanges(competitorId);

      const analysis: ICompetitorAnalysis = {
        competitor,
        pricePosition: this.analyzePricePosition(competitor),
        ratingTrend: this.analyzeRatingTrend(changesResult.data ?? []),
        recentChanges: changesResult.data ?? [],
        threatLevel: this.calculateThreatLevel(competitor),
      };

      return {
        success: true,
        data: analysis,
        metadata: {
          timestamp,
          duration_ms: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        metadata: {
          timestamp,
          duration_ms: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * 중복 경쟁사 제거
   */
  private deduplicateCompetitors(competitors: ICompetitor[]): ICompetitor[] {
    const seen = new Map<string, ICompetitor>();

    for (const competitor of competitors) {
      const key = `${competitor.name}_${competitor.location.address.full}`;

      if (!seen.has(key)) {
        seen.set(key, competitor);
      }
    }

    return Array.from(seen.values());
  }

  private analyzePricePosition(competitor: ICompetitor): 'low' | 'mid' | 'high' {
    const avg = (competitor.priceRange.min + competitor.priceRange.max) / 2;
    if (avg < 10000) return 'low';
    if (avg < 20000) return 'mid';
    return 'high';
  }

  private analyzeRatingTrend(changes: ICompetitorChange[]): 'up' | 'down' | 'stable' {
    const ratingChanges = changes.filter((c) => c.changeType === 'rating');
    if (ratingChanges.length < 2) return 'stable';

    const recent = ratingChanges.slice(-2);
    const diff = (recent[1].newValue as number) - (recent[0].oldValue as number);

    if (diff > 0.1) return 'up';
    if (diff < -0.1) return 'down';
    return 'stable';
  }

  private calculateThreatLevel(competitor: ICompetitor): 'low' | 'medium' | 'high' {
    // 간단한 위협도 계산 (평점 + 리뷰 수 기반)
    if (competitor.rating >= 4.5 && competitor.reviewCount >= 100) return 'high';
    if (competitor.rating >= 4.0 && competitor.reviewCount >= 30) return 'medium';
    return 'low';
  }
}

/**
 * 경쟁사 분석 결과
 */
export interface ICompetitorAnalysis {
  competitor: ICompetitor;
  pricePosition: 'low' | 'mid' | 'high';
  ratingTrend: 'up' | 'down' | 'stable';
  recentChanges: ICompetitorChange[];
  threatLevel: 'low' | 'medium' | 'high';
}

/**
 * 에이전트 인스턴스 생성
 */
export function createCompetitorMonitorAgent(
  repository: ICompetitorRepository,
  credentials: {
    naver?: { clientId: string; clientSecret: string };
    kakao?: { restApiKey: string };
  },
  config?: Partial<ICompetitorMonitorAgentConfig>
): CompetitorMonitorAgent {
  return new CompetitorMonitorAgent(repository, credentials, config);
}

/**
 * 공고 수집기 통합 관리 시스템
 * 모든 수집기를 중앙에서 관리하고 실행
 *
 * 📌 현재 구현 상태 (2025-12-10):
 * ✅ 완전 구현: 2개 (bizinfo, kstartup)
 * ⚠️ 부분 구현/스켈레톤: 28개
 *
 * 미구현 수집기는 기본적으로 빈 배열을 반환하며,
 * 시스템 동작에는 영향을 주지 않습니다.
 * 각 수집기는 enabled 플래그로 활성화/비활성화 제어 가능합니다.
 */

import PQueue from 'p-queue';
import { Announcement } from '../../types/index.js';
import { logger } from '../../utils/logger.js';

// 수집기 임포트 - 정부기관
import { BizinfoCollector } from './bizinfo-collector.js';
import { KStartupCollector } from './kstartup-collector.js';
import { KisedCollector } from './kised-collector.js';
import { NipaCollector } from './nipa-collector.js';
import { SemasCollector } from './semas-collector.js';
import { SmbaCollector } from './smba-collector.js';
import { Semas24Collector } from './semas24-collector.js';

// 금융기관
import { KoditCollector } from './kodit-collector.js';
import { KoditApiCollector } from './kodit-api-collector.js';
import { KoregCollector } from './koreg-collector.js';
import { KiboCollector } from './kibo-collector.js';

// 지자체
import { SeoulCollector } from './seoul-collector.js';
import { GyeonggiCollector } from './gyeonggi-collector.js';
import { BusanCollector } from './busan-collector.js';
import { CceiCollector } from './ccei-collector.js';
import { Maru180Collector } from './maru180-collector.js';

// 특화 플랫폼
import { TipsCollector } from './tips-collector.js';
import { KdataCollector } from './kdata-collector.js';
import { KPushCollector } from './k-push-collector.js';
import { KGlobalCollector } from './k-global-collector.js';

// 민간 플랫폼 & 액셀러레이터
import { PrimerCollector } from './primer-collector.js';
import { MashupAngelsCollector } from './mashup-angels-collector.js';
import { SparkLabsCollector } from './speedbank-collector.js';
import { TheVcCollector } from './thevc-collector.js';

// 네이버 생태계
import { NaverD2sfCollector } from './naver-d2sf-collector.js';
import { NaverConnectCollector } from './naver-connect-collector.js';
import { NaverD2Collector } from './naver-d2-collector.js';
import { NaverClovaCollector } from './naver-clova-collector.js';
import { NaverSearchApiCollector } from './naver-search-api-collector.js';
import { NaverSmesCollector } from './naver-smes-collector.js';
import { NaverStartupCollector } from './naver-startup-collector.js';

/**
 * 수집기 인터페이스
 */
export interface Collector {
  collect(keywords?: string[]): Promise<Announcement[]>;
}

/**
 * Program을 Announcement로 변환하는 어댑터
 */
function programToAnnouncement(program: any): Announcement {
  return {
    id: program.id || `${program.source}-${Date.now()}-${Math.random()}`,
    title: program.title,
    source: program.source,
    url: program.url || '',
    description: program.category || '',
    deadline: program.deadline ? new Date(program.deadline) : undefined,
    startDate: program.startDate ? new Date(program.startDate) : undefined,
    agency: program.organization || '',
    targetAudience: program.target,
    category: program.category,
    collectedAt: new Date(),
    rawData: program.rawData,
  };
}

/**
 * Program[] 수집기를 Announcement[] 수집기로 변환하는 어댑터
 */
function createProgramCollectorAdapter(collector: any): Collector {
  return {
    async collect(keywords?: string[]): Promise<Announcement[]> {
      const programs = await collector.collect(keywords);
      return programs.map(programToAnnouncement);
    },
  };
}

/**
 * 수집기 메타데이터
 */
export interface CollectorMeta {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  priority: number; // 1-10, 높을수록 우선순위 높음
  instance: Collector;
  category: 'government' | 'local' | 'private' | 'platform';
}

/**
 * 수집 결과 통계
 */
export interface CollectionStats {
  totalSources: number;
  successfulSources: number;
  failedSources: number;
  totalAnnouncements: number;
  uniqueAnnouncements: number;
  duration: number;
  sources: {
    id: string;
    name: string;
    count: number;
    status: 'success' | 'failed';
    error?: string;
  }[];
}

/**
 * 공고 수집기 관리자
 */
export class CollectorManager {
  private collectors: Map<string, CollectorMeta>;
  private queue: PQueue;

  constructor() {
    this.collectors = new Map();
    this.queue = new PQueue({
      concurrency: 5, // 동시에 5개 소스까지 수집
      interval: 1000, // 1초 간격
      intervalCap: 10, // 초당 최대 10개 요청
    });

    this.registerCollectors();
  }

  /**
   * 모든 수집기 등록
   */
  private registerCollectors() {
    const collectors: CollectorMeta[] = [
      // 정부기관 (최우선)
      {
        id: 'bizinfo',
        name: '기업마당 (Bizinfo)',
        description: '중소벤처기업부 종합 지원사업 포털',
        enabled: true,
        priority: 10,
        instance: createProgramCollectorAdapter(new BizinfoCollector()),
        category: 'government',
      },
      {
        id: 'kstartup',
        name: 'K-Startup',
        description: '창업지원 통합 플랫폼',
        enabled: true,
        priority: 10,
        instance: createProgramCollectorAdapter(new KStartupCollector()),
        category: 'government',
      },
      {
        id: 'kised',
        name: '창업진흥원 (KISED)',
        description: '창업진흥원 공고',
        enabled: true,
        priority: 9,
        instance: new KisedCollector(),
        category: 'government',
      },
      {
        id: 'nipa',
        name: '정보통신산업진흥원 (NIPA)',
        description: 'ICT/SW 지원사업',
        enabled: true,
        priority: 9,
        instance: new NipaCollector(),
        category: 'government',
      },
      {
        id: 'semas',
        name: '중소벤처기업진흥공단',
        description: '중소기업 종합 지원',
        enabled: true,
        priority: 9,
        instance: new SemasCollector(),
        category: 'government',
      },
      {
        id: 'smba',
        name: '중소벤처기업부',
        description: '중소벤처기업부 공고',
        enabled: true,
        priority: 9,
        instance: new SmbaCollector(),
        category: 'government',
      },
      {
        id: 'semas24',
        name: '소상공인24',
        description: '소상공인시장진흥공단',
        enabled: true,
        priority: 9,
        instance: new Semas24Collector(),
        category: 'government',
      },

      // 금융기관
      {
        id: 'kodit',
        name: '기술보증기금 (KODIT)',
        description: '기술보증 및 창업지원',
        enabled: true,
        priority: 8,
        instance: new KoditCollector(),
        category: 'government',
      },
      {
        id: 'kodit-api',
        name: '기술보증기금 API',
        description: '기술보증기금 공공데이터 API',
        enabled: false, // API 키 필요시 활성화
        priority: 8,
        instance: new KoditApiCollector(),
        category: 'government',
      },
      {
        id: 'koreg',
        name: '신용보증기금 (KOREG)',
        description: '신용보증 및 창업지원',
        enabled: true,
        priority: 8,
        instance: new KoregCollector(),
        category: 'government',
      },
      {
        id: 'kibo',
        name: 'IBK기업은행 창업지원',
        description: '기업은행 창업지원사업',
        enabled: true,
        priority: 7,
        instance: new KiboCollector(),
        category: 'government',
      },

      // 지자체 (서울/경기 우선)
      {
        id: 'seoul',
        name: '서울산업진흥원 (SBA)',
        description: '서울시 창업지원',
        enabled: true,
        priority: 7,
        instance: new SeoulCollector(),
        category: 'local',
      },
      {
        id: 'gyeonggi',
        name: '경기도창업지원센터',
        description: '경기도 창업지원',
        enabled: true,
        priority: 7,
        instance: new GyeonggiCollector(),
        category: 'local',
      },
      {
        id: 'busan',
        name: '부산창조경제혁신센터',
        description: '부산시 창업지원',
        enabled: true,
        priority: 6,
        instance: new BusanCollector(),
        category: 'local',
      },
      {
        id: 'ccei',
        name: '창조경제혁신센터 (전국 17개)',
        description: '전국 창조경제혁신센터 통합',
        enabled: true,
        priority: 6,
        instance: new CceiCollector(),
        category: 'local',
      },
      {
        id: 'maru180',
        name: '마루180 (서울창업허브)',
        description: '서울시 대표 창업공간',
        enabled: true,
        priority: 7,
        instance: new Maru180Collector(),
        category: 'local',
      },

      // 특화 플랫폼
      {
        id: 'tips',
        name: 'TIPS',
        description: '민간투자주도형 기술창업지원',
        enabled: true,
        priority: 8,
        instance: new TipsCollector(),
        category: 'platform',
      },
      {
        id: 'kdata',
        name: '한국데이터산업진흥원',
        description: '데이터/AI 지원사업',
        enabled: true,
        priority: 7,
        instance: new KdataCollector(),
        category: 'platform',
      },
      {
        id: 'k-push',
        name: 'K-PUSH (창업넷)',
        description: '창업지원 네트워크 플랫폼',
        enabled: true,
        priority: 7,
        instance: new KPushCollector(),
        category: 'platform',
      },
      {
        id: 'k-global',
        name: 'K-Global (글로벌창업지원단)',
        description: '해외진출 창업지원',
        enabled: true,
        priority: 7,
        instance: new KGlobalCollector(),
        category: 'platform',
      },

      // 민간 플랫폼 & 액셀러레이터
      {
        id: 'primer',
        name: 'Primer',
        description: '프라이머 액셀러레이터',
        enabled: true,
        priority: 6,
        instance: new PrimerCollector(),
        category: 'private',
      },
      {
        id: 'mashup-angels',
        name: 'Mashup Angels',
        description: '매쉬업엔젤스 투자/멘토링',
        enabled: true,
        priority: 6,
        instance: new MashupAngelsCollector(),
        category: 'private',
      },
      {
        id: 'sparklabs',
        name: 'SparkLabs',
        description: '스파크랩스 액셀러레이터',
        enabled: true,
        priority: 6,
        instance: new SparkLabsCollector(),
        category: 'private',
      },
      {
        id: 'thevc',
        name: 'TheVC',
        description: '투자/지원사업 통합 플랫폼',
        enabled: true,
        priority: 6,
        instance: new TheVcCollector(),
        category: 'private',
      },

      // 네이버 생태계
      {
        id: 'naver-d2sf',
        name: '네이버 D2SF',
        description: 'D2 Startup Factory',
        enabled: true,
        priority: 7,
        instance: new NaverD2sfCollector(),
        category: 'private',
      },
      {
        id: 'naver-connect',
        name: '네이버 커넥트재단',
        description: '소프트웨어 교육 및 창업지원',
        enabled: true,
        priority: 6,
        instance: new NaverConnectCollector(),
        category: 'private',
      },
      {
        id: 'naver-d2',
        name: '네이버 D2',
        description: '개발자 지원 프로그램',
        enabled: true,
        priority: 5,
        instance: new NaverD2Collector(),
        category: 'private',
      },
      {
        id: 'naver-clova',
        name: '네이버 CLOVA AI',
        description: 'AI 생태계 지원',
        enabled: true,
        priority: 6,
        instance: new NaverClovaCollector(),
        category: 'private',
      },
      {
        id: 'naver-search-api',
        name: '네이버 검색 API',
        description: '실시간 창업지원사업 검색',
        enabled: true,
        priority: 8,
        instance: new NaverSearchApiCollector(),
        category: 'private',
      },
      {
        id: 'naver-smes',
        name: '네이버 사장님 (지원사업)',
        description: '소상공인/창업 지원사업 통합',
        enabled: true,
        priority: 7,
        instance: new NaverSmesCollector(),
        category: 'private',
      },
      {
        id: 'naver-startup',
        name: '네이버 창업지원 카테고리',
        description: '사장님 창업지원 전용 섹션',
        enabled: true,
        priority: 8,
        instance: new NaverStartupCollector(),
        category: 'private',
      },
    ];

    collectors.forEach((collector) => {
      this.collectors.set(collector.id, collector);
    });

    logger.info(
      `📚 CollectorManager 초기화: ${collectors.length}개 수집기 등록 (활성화: ${collectors.filter((c) => c.enabled).length}개)`
    );
  }

  /**
   * 모든 활성화된 소스에서 공고 수집
   */
  async collectAll(keywords?: string[]): Promise<CollectionStats> {
    const startTime = Date.now();
    logger.info('🚀 전체 공고 수집 시작');

    const enabledCollectors = Array.from(this.collectors.values())
      .filter((c) => c.enabled)
      .sort((a, b) => b.priority - a.priority); // 우선순위 높은 순

    const results = await Promise.allSettled(
      enabledCollectors.map((collector) =>
        this.queue.add(() => this.collectFromSource(collector, keywords))
      )
    );

    // 결과 집계
    const allAnnouncements: Announcement[] = [];
    const sourceStats: CollectionStats['sources'] = [];

    results.forEach((result, index) => {
      const collector = enabledCollectors[index];
      if (!collector) return;

      if (result.status === 'fulfilled') {
        const announcements = result.value as Announcement[];
        if (announcements && Array.isArray(announcements)) {
          allAnnouncements.push(...announcements);
          sourceStats.push({
            id: collector.id,
            name: collector.name,
            count: announcements.length,
            status: 'success',
          });
        }
      } else {
        logger.error(`${collector.name} 수집 실패:`, result.reason);
        sourceStats.push({
          id: collector.id,
          name: collector.name,
          count: 0,
          status: 'failed',
          error: result.reason?.message || 'Unknown error',
        });
      }
    });

    // 중복 제거
    const uniqueAnnouncements = this.removeDuplicates(allAnnouncements);

    const duration = Date.now() - startTime;
    const stats: CollectionStats = {
      totalSources: enabledCollectors.length,
      successfulSources: sourceStats.filter((s) => s.status === 'success')
        .length,
      failedSources: sourceStats.filter((s) => s.status === 'failed').length,
      totalAnnouncements: allAnnouncements.length,
      uniqueAnnouncements: uniqueAnnouncements.length,
      duration,
      sources: sourceStats,
    };

    this.logStats(stats);

    return stats;
  }

  /**
   * 특정 소스에서만 수집
   */
  async collectFromSource(
    collector: CollectorMeta,
    keywords?: string[]
  ): Promise<Announcement[]> {
    try {
      logger.info(`📡 ${collector.name} 수집 시작`);
      const announcements = await collector.instance.collect(keywords);
      logger.info(`✅ ${collector.name}: ${announcements.length}건 수집`);
      return announcements;
    } catch (error) {
      logger.error(`❌ ${collector.name} 수집 실패:`, error);
      throw error;
    }
  }

  /**
   * 특정 카테고리 소스만 수집
   */
  async collectByCategory(
    category: 'government' | 'local' | 'private' | 'platform',
    keywords?: string[]
  ): Promise<Announcement[]> {
    const collectors = Array.from(this.collectors.values())
      .filter((c) => c.enabled && c.category === category)
      .sort((a, b) => b.priority - a.priority);

    logger.info(
      `📂 ${category} 카테고리 수집 시작 (${collectors.length}개 소스)`
    );

    const results = await Promise.allSettled(
      collectors.map((collector) =>
        this.queue.add(() => this.collectFromSource(collector, keywords))
      )
    );

    const allAnnouncements: Announcement[] = [];
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        const announcements = result.value as Announcement[];
        if (announcements && Array.isArray(announcements)) {
          allAnnouncements.push(...announcements);
        }
      }
    });

    return this.removeDuplicates(allAnnouncements);
  }

  /**
   * 중복 제거 (title + agency 기준)
   */
  private removeDuplicates(announcements: Announcement[]): Announcement[] {
    const seen = new Set<string>();
    const unique: Announcement[] = [];

    for (const announcement of announcements) {
      const key = `${announcement.title.trim()}_${announcement.agency?.trim() || announcement.source}`;

      if (!seen.has(key)) {
        seen.add(key);
        unique.push(announcement);
      }
    }

    return unique;
  }

  /**
   * 통계 로깅
   */
  private logStats(stats: CollectionStats) {
    logger.info('📊 수집 완료 통계:');
    logger.info(`  ⏱️  소요시간: ${(stats.duration / 1000).toFixed(2)}초`);
    logger.info(
      `  📡 소스: ${stats.successfulSources}/${stats.totalSources} 성공`
    );
    logger.info(`  📄 총 공고: ${stats.totalAnnouncements}건`);
    logger.info(`  ✨ 고유 공고: ${stats.uniqueAnnouncements}건`);
    logger.info(
      `  🗑️  중복 제거: ${stats.totalAnnouncements - stats.uniqueAnnouncements}건`
    );

    // 소스별 상세
    logger.info('  📋 소스별 결과:');
    stats.sources
      .sort((a, b) => b.count - a.count)
      .forEach((source) => {
        if (source.status === 'success') {
          logger.info(`     ✅ ${source.name}: ${source.count}건`);
        } else {
          logger.warn(`     ❌ ${source.name}: 실패 (${source.error})`);
        }
      });
  }

  /**
   * 수집기 활성화/비활성화
   */
  setCollectorEnabled(id: string, enabled: boolean) {
    const collector = this.collectors.get(id);
    if (collector) {
      collector.enabled = enabled;
      logger.info(`${collector.name} ${enabled ? '활성화' : '비활성화'}`);
    }
  }

  /**
   * 등록된 모든 수집기 목록
   */
  listCollectors(): CollectorMeta[] {
    return Array.from(this.collectors.values()).sort(
      (a, b) => b.priority - a.priority
    );
  }
}

// 싱글톤 인스턴스
export const collectorManager = new CollectorManager();

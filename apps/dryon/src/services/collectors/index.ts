/**
 * 공고 수집기 통합 관리
 */

import { bizinfoCollector } from './bizinfo-collector.js';
import { kstartupCollector } from './kstartup-collector.js';
import { testCollector } from './mock-collector.js';
import { kisedCrawler } from './kised-crawler.js';
import { cceiUniversalCrawler } from './ccei-universal-crawler.js';
import { NaverSearchApiCollector } from './naver-search-api-collector.js';
import { nipaCrawler } from './nipa-crawler.js';
import { sbaCrawler } from './sba-crawler.js';
import { financeCrawler } from './finance-crawler.js';
import { technoparkCrawler } from './technopark-crawler.js';
import { agencyCrawler } from './agency-crawler.js';
import { universityCrawler } from './university-crawler.js';
import { ministryCrawler } from './ministry-crawler.js';
import { sparklabsCrawler } from './sparklabs-crawler.js';
import { kakaoVenturesCrawler } from './kakao-ventures-crawler.js';
import { tumblbugCrawler } from './tumblbug-crawler.js';
import { naverD2SFCrawler } from './naver-d2sf-crawler.js';
import { primerCrawler } from './primer-crawler.js';
import { wadizCrawler } from './wadiz-crawler.js';
import { fastTrackAsiaCrawler } from './fasttrack-asia-crawler.js';
import { bonAngelsCrawler } from './bonangels-crawler.js';
import { companyKPartnersCrawler } from './company-k-partners-crawler.js';
import { thevcCrawler } from './thevc-crawler.js';
import { crevisseCrawler } from './crevisse-crawler.js';
import { crowdyCrawler } from './crowdy-crawler.js';
import { tourazCrawler } from './touraz-crawler.js';
import type { Program, Announcement } from '../../types/index.js';
import { log } from '../../utils/logger.js';
import { isDevelopment } from '../../config/index.js';
import pQueue from 'p-queue';

const naverSearchCollector = new NaverSearchApiCollector();

/**
 * Announcement를 Program으로 변환
 */
async function convertAnnouncementsToPrograms(
  announcementsPromise: Promise<Announcement[]>,
  source: string
): Promise<Program[]> {
  try {
    const announcements = await announcementsPromise;
    return announcements.map((ann) => ({
      id: ann.id,
      title: ann.title,
      organization: ann.agency || source,
      category: ann.category,
      target: ann.targetAudience,
      deadline:
        ann.deadline?.toISOString() ||
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      startDate: ann.startDate?.toISOString() || new Date().toISOString(),
      source: source as any,
      url: ann.url,
      memo: ann.description,
      rawData: ann.rawData,
    }));
  } catch (error) {
    log.error(`Failed to convert announcements from ${source}`, error);
    return [];
  }
}

/**
 * 모든 소스에서 공고 수집
 */
export async function collectAllPrograms(): Promise<Program[]> {
  log.info('🚀 Starting collection from all sources');

  const queue = new pQueue({ concurrency: 5 }); // 동시 5개까지 실행

  // 개발 모드에서는 TestCollector 사용
  if (isDevelopment) {
    log.info('🧪 Development mode: Using TestCollector with mock data');
  }

  // 수집 소스 목록
  const collectorTasks = isDevelopment
    ? [
        // 개발 모드: Mock 데이터만
        queue.add(() => testCollector.collect()),
      ]
    : [
        // 프로덕션 모드: 실제 수집
        // API 기반 (빠름)
        queue.add(() => bizinfoCollector.collect()),
        queue.add(() => kstartupCollector.collect()),
        queue.add(() =>
          convertAnnouncementsToPrograms(
            naverSearchCollector.collect(),
            'naver-search'
          )
        ),

        // 크롤링 기반 - 일반 (Cheerio)
        queue.add(() => kisedCrawler.collect()),
        queue.add(() => cceiUniversalCrawler.collect()),
        queue.add(() => sbaCrawler.collect()),
        queue.add(() => financeCrawler.collect()),
        queue.add(() => technoparkCrawler.collect()),

        // 신규 추가: 진흥원/공단 (5개)
        queue.add(() => agencyCrawler.collect()),

        // 신규 추가: 대학 창업지원단 (6개)
        queue.add(() => universityCrawler.collect()),

        // 신규 추가: 비IT 부처 (8개) - AI 융합 틈새공고
        queue.add(() => ministryCrawler.collect()),

        // 크롤링 기반 - 동적 페이지 (Puppeteer)
        queue.add(() => nipaCrawler.collect()),

        // 민간 플랫폼 크롤러 (Phase 1)
        queue.add(() => sparklabsCrawler.collect()),
        queue.add(() => kakaoVenturesCrawler.collect()),
        queue.add(() => tumblbugCrawler.collect()),

        // 민간 플랫폼 크롤러 (Phase 2)
        queue.add(() => naverD2SFCrawler.collect()),
        queue.add(() => primerCrawler.collect()),
        queue.add(() => wadizCrawler.collect()),
        queue.add(() => fastTrackAsiaCrawler.collect()),
        queue.add(() => bonAngelsCrawler.collect()),
        queue.add(() => companyKPartnersCrawler.collect()),

        // 민간 플랫폼 크롤러 (Phase 3)
        queue.add(() => thevcCrawler.collect()),
        queue.add(() => crevisseCrawler.collect()),
        queue.add(() => crowdyCrawler.collect()),

        // 관광산업 지원사업
        queue.add(() => tourazCrawler.collect()),
      ];

  const results = await Promise.allSettled(collectorTasks);

  const allPrograms: Program[] = [];
  const errors: Error[] = [];

  for (const [index, result] of results.entries()) {
    const sourceName = isDevelopment
      ? ['TestCollector'][index] || 'Unknown'
      : [
          'Bizinfo',
          'K-Startup',
          'Naver Search',
          'KISED',
          'CCEI (17개)',
          'SBA',
          'Finance (3개)',
          'Technopark (17개)',
          'Agency (5개: KOCCA, KISA, KICOX, KIAT, KEIT)',
          'University (6개)',
          'Ministry (8개: 비IT부처 AI융합)',
          'NIPA',
          'SparkLabs',
          'Kakao Ventures',
          'Tumblbug',
          'Naver D2SF',
          'Primer',
          'Wadiz',
          'Fast Track Asia',
          'BonAngels',
          'Company K Partners',
          'THE VC',
          'Crevisse Partners',
          'Crowdy',
          'Touraz (관광산업포털)',
        ][index] || 'Unknown';

    if (result.status === 'fulfilled') {
      const programs = result.value;
      if (programs) {
        log.info(`${sourceName}: collected ${programs.length} programs`);
        allPrograms.push(...programs);
      }
    } else {
      log.error(`${sourceName}: collection failed`, result.reason);
      errors.push(result.reason);
    }
  }

  // 중복 제거 (title + organization 기준)
  const uniquePrograms = removeDuplicates(allPrograms);

  log.info(
    `Total collected: ${allPrograms.length}, Unique: ${uniquePrograms.length}`
  );

  if (errors.length > 0 && uniquePrograms.length === 0) {
    throw new Error(
      `All collectors failed. Errors: ${errors.map((e) => e.message).join(', ')}`
    );
  }

  return uniquePrograms;
}

/**
 * 중복 제거
 */
function removeDuplicates(programs: Program[]): Program[] {
  const seen = new Set<string>();
  const unique: Program[] = [];

  for (const program of programs) {
    const key = `${program.title.trim()}_${program.organization.trim()}`;

    if (!seen.has(key)) {
      seen.add(key);
      unique.push(program);
    }
  }

  return unique;
}

/**
 * 특정 소스에서만 수집
 */
export async function collectFromSource(
  source: 'Bizinfo' | 'K-Startup'
): Promise<Program[]> {
  log.info(`Collecting from ${source}`);

  switch (source) {
    case 'Bizinfo':
      return await bizinfoCollector.collect();
    case 'K-Startup':
      return await kstartupCollector.collect();
    default:
      throw new Error(`Unknown source: ${source}`);
  }
}

export { bizinfoCollector, kstartupCollector };

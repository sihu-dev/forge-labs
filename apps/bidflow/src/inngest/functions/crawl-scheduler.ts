/**
 * @module inngest/functions/crawl-scheduler
 * @description 입찰 공고 크롤링 스케줄러
 */

import { inngest } from '../client';
import { NaraJangtoClient, type MappedBid } from '@/lib/clients/narajangto-api';
import { getTEDClient, convertTEDToBidData, type TEDAPIClient } from '@/lib/clients/ted-api';
import { getSAMGovClient, convertSAMToBidData, type SAMGovAPIClient } from '@/lib/clients/sam-gov-api';
import { getBidRepository } from '@/lib/domain/repositories/bid-repository';
import { createISODateString, createKRW, type CreateInput, type BidData } from '@/types';
import { sendNotification, type BidNotificationData } from '@/lib/notifications';

// ============================================================================
// 공통 타입
// ============================================================================

interface CrawlResult {
  source: string;
  total: number;
  saved: number;
  bids: BidNotificationData[];
}

// ============================================================================
// 키워드 필터링 유틸리티
// ============================================================================

/**
 * 공고가 키워드와 매칭되는지 확인
 */
function matchesKeywords(notice: MappedBid, keywords: string[]): boolean {
  if (!keywords || keywords.length === 0) {
    return true; // 키워드가 없으면 모든 공고 포함
  }

  const searchText = [
    notice.title,
    notice.organization,
    ...(notice.keywords || []),
  ].join(' ').toLowerCase();

  return keywords.some(keyword =>
    searchText.includes(keyword.toLowerCase())
  );
}

/**
 * 키워드로 공고 필터링
 */
function filterByKeywords(notices: MappedBid[], keywords: string[]): MappedBid[] {
  if (!keywords || keywords.length === 0) {
    return notices;
  }

  return notices.filter(notice => matchesKeywords(notice, keywords));
}

// ============================================================================
// TED (EU) 크롤링 헬퍼
// ============================================================================

async function crawlTED(logger: { info: (msg: string) => void; warn: (msg: string) => void; error: (msg: string, e?: unknown) => void }): Promise<CrawlResult> {
  const result: CrawlResult = { source: 'ted', total: 0, saved: 0, bids: [] };

  try {
    const client = getTEDClient();
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 7); // 최근 7일

    const notices = await client.searchFlowMeterTenders({ fromDate });
    result.total = notices.length;
    logger.info(`TED에서 ${notices.length}건 수집`);

    if (notices.length === 0) return result;

    const repository = getBidRepository();

    for (const notice of notices) {
      try {
        // 중복 확인
        const existing = await repository.findByExternalId('ted', notice.noticeId);
        if (existing.success && existing.data) continue;

        // BidData로 변환 및 저장
        const bidInput = convertTEDToBidData(notice);
        const createResult = await repository.create(bidInput);

        if (createResult.success) {
          result.saved++;
          result.bids.push({
            id: notice.noticeId,
            title: notice.title,
            organization: notice.buyerName,
            deadline: notice.deadline,
            estimatedAmount: notice.estimatedValue?.amount ?? null,
            url: notice.url,
          });
        }
      } catch (error) {
        logger.error(`TED 저장 실패: ${notice.noticeId}`, error);
      }
    }

    logger.info(`TED: ${result.saved}건 저장 완료`);
  } catch (error) {
    logger.error('TED 크롤링 실패:', error);
  }

  return result;
}

// ============================================================================
// SAM.gov (미국) 크롤링 헬퍼
// ============================================================================

async function crawlSAMGov(logger: { info: (msg: string) => void; warn: (msg: string) => void; error: (msg: string, e?: unknown) => void }): Promise<CrawlResult> {
  const result: CrawlResult = { source: 'sam', total: 0, saved: 0, bids: [] };

  try {
    const apiKey = process.env.SAM_GOV_API_KEY;
    if (!apiKey) {
      logger.warn('SAM.gov API 키가 없습니다. 스킵합니다.');
      return result;
    }

    const client = getSAMGovClient();
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 7); // 최근 7일

    const opportunities = await client.searchFlowMeterOpportunities({ fromDate });
    result.total = opportunities.length;
    logger.info(`SAM.gov에서 ${opportunities.length}건 수집`);

    if (opportunities.length === 0) return result;

    const repository = getBidRepository();

    for (const opportunity of opportunities) {
      try {
        // 중복 확인
        const existing = await repository.findByExternalId('sam', opportunity.noticeId);
        if (existing.success && existing.data) continue;

        // BidData로 변환 및 저장
        const bidInput = convertSAMToBidData(opportunity);
        const createResult = await repository.create(bidInput);

        if (createResult.success) {
          result.saved++;
          result.bids.push({
            id: opportunity.noticeId,
            title: opportunity.title,
            organization: opportunity.department || 'US Government',
            deadline: opportunity.responseDeadLine || '',
            estimatedAmount: opportunity.award?.amount ?? null,
            url: opportunity.uiLink || `https://sam.gov/opp/${opportunity.noticeId}/view`,
          });
        }
      } catch (error) {
        logger.error(`SAM.gov 저장 실패: ${opportunity.noticeId}`, error);
      }
    }

    logger.info(`SAM.gov: ${result.saved}건 저장 완료`);
  } catch (error) {
    logger.error('SAM.gov 크롤링 실패:', error);
  }

  return result;
}

// ============================================================================
// 스케줄된 크롤링 작업
// ============================================================================

/**
 * 정기 크롤링 작업 (매일 9시, 15시, 21시)
 */
export const scheduledCrawl = inngest.createFunction(
  {
    id: 'scheduled-bid-crawl',
    name: '정기 입찰 공고 크롤링',
  },
  { cron: '0 9,15,21 * * *' },
  async ({ step, logger }) => {
    logger.info('크롤링 시작');

    // Step 1: 나라장터 크롤링
    const naraResults = await step.run('crawl-narajangto', async () => {
      const apiKey = process.env.NARA_JANGTO_API_KEY;
      if (!apiKey) {
        logger.warn('나라장터 API 키가 없습니다. 스킵합니다.');
        return [];
      }

      const client = new NaraJangtoClient(apiKey);
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - 7); // 최근 7일

      try {
        const notices = await client.searchFlowMeterBids({ fromDate });
        logger.info(`나라장터에서 ${notices.length}건 수집`);
        return notices;
      } catch (error) {
        logger.error('나라장터 크롤링 실패:', error);
        return [];
      }
    });

    // Step 1-2: 나라장터 DB 저장
    const naraResult = await step.run('save-narajangto-to-db', async () => {
      if (naraResults.length === 0) {
        return { saved: 0, bids: [] as MappedBid[] };
      }

      const repository = getBidRepository();
      let saved = 0;

      for (const bid of naraResults) {
        try {
          // 중복 확인
          const existing = await repository.findByExternalId('narajangto', bid.external_id);
          if (existing.success && existing.data) {
            continue; // 이미 존재하면 스킵
          }

          // 새 공고 저장 (Inngest 직렬화로 Date가 string으로 변환될 수 있음)
          const deadlineValue = bid.deadline as unknown;
          const deadlineStr = typeof deadlineValue === 'string'
            ? deadlineValue
            : new Date(deadlineValue as string | number | Date).toISOString();

          const createInput: CreateInput<BidData> = {
            source: 'narajangto',
            externalId: bid.external_id,
            title: bid.title,
            organization: bid.organization,
            deadline: createISODateString(deadlineStr),
            estimatedAmount: bid.estimated_amount ? createKRW(BigInt(bid.estimated_amount)) : null,
            status: 'new',
            priority: 'medium',
            type: 'product',
            keywords: bid.keywords,
            url: bid.url,
            rawData: bid.raw_data,
          };

          const result = await repository.create(createInput);
          if (result.success) {
            saved++;
          }
        } catch (error) {
          logger.error(`저장 실패: ${bid.external_id}`, error);
        }
      }

      logger.info(`나라장터: ${saved}건 저장 완료`);
      return { saved, bids: naraResults.slice(0, saved) };
    });

    // Step 2: TED (EU) 크롤링
    const tedResults = await step.run('crawl-ted', async () => {
      return await crawlTED(logger);
    });

    // Step 3: SAM.gov (미국) 크롤링
    const samResults = await step.run('crawl-sam', async () => {
      return await crawlSAMGov(logger);
    });

    // 전체 저장 건수
    const totalSaved = naraResult.saved + tedResults.saved + samResults.saved;

    // Step 4: 알림 발송 (새 공고가 있는 경우)
    if (totalSaved > 0) {
      await step.run('send-notification', async () => {
        // Inngest JSON 직렬화로 인해 Date가 string으로 변환됨
        type SerializedBid = { external_id: string; title: string; organization: string; deadline: string; estimated_amount: number | null; url: string | null };

        // 저장된 공고 데이터를 알림용으로 변환
        const naraBids: BidNotificationData[] = (naraResult.bids as SerializedBid[]).map((bid) => ({
          id: bid.external_id,
          title: bid.title,
          organization: bid.organization,
          deadline: bid.deadline,
          estimatedAmount: bid.estimated_amount,
          url: bid.url,
        }));

        const allBids = [...naraBids, ...tedResults.bids, ...samResults.bids];

        // Slack 알림 발송
        const results = await sendNotification(['slack'], {
          type: 'new_bids',
          bids: allBids,
        });

        const success = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success);

        logger.info(`알림 발송 완료: ${success}/${results.length} 성공`);
        if (failed.length > 0) {
          logger.warn('알림 발송 실패:', failed.map(r => `${r.channel}: ${r.error}`));
        }
      });
    }

    return {
      success: true,
      results: {
        narajangto: { crawled: naraResults.length, saved: naraResult.saved },
        ted: { crawled: tedResults.total, saved: tedResults.saved },
        sam: { crawled: samResults.total, saved: samResults.saved },
      },
      totalSaved,
    };
  }
);

// ============================================================================
// 수동 크롤링 트리거
// ============================================================================

/**
 * 수동 크롤링 이벤트
 */
export const manualCrawl = inngest.createFunction(
  {
    id: 'manual-bid-crawl',
    name: '수동 입찰 공고 크롤링',
  },
  { event: 'bid/crawl.requested' },
  async ({ event, step, logger }) => {
    const { source = 'all', keywords = [] } = event.data || {};

    logger.info(`수동 크롤링 시작: source=${source}, keywords=${keywords.length}개`);

    // 나라장터 크롤링 결과
    let naraResult: { success: boolean; total: number; filtered: number; saved: number; bids: BidNotificationData[] } | null = null;

    if (source === 'narajangto' || source === 'all') {
      // Step 1: 나라장터 크롤링 + 키워드 필터링 + DB 저장
      const result = await step.run('crawl-narajangto-manual', async () => {
        const apiKey = process.env.NARA_JANGTO_API_KEY;
        if (!apiKey) {
          return { success: false, error: 'API 키 없음', total: 0, filtered: 0, saved: 0, notices: [] as MappedBid[] };
        }

        const client = new NaraJangtoClient(apiKey);
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - 30); // 최근 30일

        // 크롤링
        const notices = await client.searchFlowMeterBids({ fromDate });
        const total = notices.length;

        // 키워드 필터링
        const filtered = filterByKeywords(notices, keywords);
        logger.info(`키워드 필터링: ${total}건 → ${filtered.length}건`);

        // DB 저장
        const repository = getBidRepository();
        let saved = 0;
        const savedNotices: MappedBid[] = [];

        for (const bid of filtered) {
          try {
            // 중복 확인
            const existing = await repository.findByExternalId('narajangto', bid.external_id);
            if (existing.success && existing.data) {
              continue;
            }

            // 새 공고 저장
            const deadlineStr = typeof bid.deadline === 'string'
              ? bid.deadline
              : new Date(bid.deadline).toISOString();

            const createInput: CreateInput<BidData> = {
              source: 'narajangto',
              externalId: bid.external_id,
              title: bid.title,
              organization: bid.organization,
              deadline: createISODateString(deadlineStr),
              estimatedAmount: bid.estimated_amount ? createKRW(BigInt(bid.estimated_amount)) : null,
              status: 'new',
              priority: 'medium',
              type: 'product',
              keywords: bid.keywords,
              url: bid.url,
              rawData: bid.raw_data,
            };

            const createResult = await repository.create(createInput);
            if (createResult.success) {
              saved++;
              savedNotices.push(bid);
            }
          } catch (error) {
            logger.error(`저장 실패: ${bid.external_id}`, error);
          }
        }

        return {
          success: true,
          total,
          filtered: filtered.length,
          saved,
          notices: savedNotices,
        };
      });

      if (!result.success) {
        // API 키 없는 경우도 계속 진행 (다른 소스 크롤링 가능)
        logger.warn('나라장터 크롤링 실패: ' + ('error' in result ? result.error : '알 수 없는 오류'));
      } else {
        // 성공 시 naraResult 설정
        type SerializedBid = Omit<MappedBid, 'deadline'> & { deadline: string };
        naraResult = {
          success: true,
          total: result.total,
          filtered: result.filtered,
          saved: result.saved,
          bids: (result.notices as SerializedBid[]).map((bid) => ({
            id: bid.external_id,
            title: bid.title,
            organization: bid.organization,
            deadline: bid.deadline,
            estimatedAmount: bid.estimated_amount,
            url: bid.url,
          })),
        };
      }
    }

    // TED 크롤링
    let tedResult: CrawlResult = { source: 'ted', total: 0, saved: 0, bids: [] };
    if (source === 'ted' || source === 'all') {
      tedResult = await step.run('crawl-ted-manual', async () => {
        return await crawlTED(logger);
      });
    }

    // SAM.gov 크롤링
    let samResult: CrawlResult = { source: 'sam', total: 0, saved: 0, bids: [] };
    if (source === 'sam' || source === 'all') {
      samResult = await step.run('crawl-sam-manual', async () => {
        return await crawlSAMGov(logger);
      });
    }

    // 결과 집계
    const totalSaved = (naraResult?.saved ?? 0) + tedResult.saved + samResult.saved;

    // 알림 발송 (새 공고가 있는 경우)
    if (totalSaved > 0) {
      await step.run('send-all-notifications', async () => {
        const allBids = [
          ...(naraResult?.bids ?? []),
          ...tedResult.bids,
          ...samResult.bids,
        ];

        await sendNotification(['slack'], {
          type: 'new_bids',
          bids: allBids,
        });
      });
    }

    return {
      success: true,
      results: {
        narajangto: naraResult ? { total: naraResult.total, filtered: naraResult.filtered, saved: naraResult.saved } : null,
        ted: tedResult.total > 0 ? { total: tedResult.total, saved: tedResult.saved } : null,
        sam: samResult.total > 0 ? { total: samResult.total, saved: samResult.saved } : null,
      },
      totalSaved,
      keywords: keywords.length > 0 ? keywords : '(전체)',
    };
  }
);

// ============================================================================
// 마감 임박 알림
// ============================================================================

/**
 * D-3, D-1 마감 알림
 */
export const deadlineReminder = inngest.createFunction(
  {
    id: 'deadline-reminder',
    name: '마감 임박 알림',
  },
  { cron: '0 9 * * *' }, // 매일 9시
  async ({ step, logger }) => {
    const repository = getBidRepository();

    // D-3 마감 공고 조회
    const d3Bids = await step.run('find-d3-bids', async () => {
      const result = await repository.findUpcoming(3);
      if (!result.success) return [];
      return result.data.filter((bid) => {
        const deadline = new Date(bid.deadline);
        const now = new Date();
        const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays === 3;
      });
    });

    // D-1 마감 공고 조회
    const d1Bids = await step.run('find-d1-bids', async () => {
      const result = await repository.findUpcoming(1);
      if (!result.success) return [];
      return result.data.filter((bid) => {
        const deadline = new Date(bid.deadline);
        const now = new Date();
        const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays === 1;
      });
    });

    logger.info(`마감 임박: D-3=${d3Bids.length}건, D-1=${d1Bids.length}건`);

    // D-3 알림 발송
    if (d3Bids.length > 0) {
      await step.run('send-d3-notification', async () => {
        const notificationBids: BidNotificationData[] = d3Bids.map(bid => ({
          id: bid.id,
          title: bid.title,
          organization: bid.organization,
          deadline: bid.deadline,
          estimatedAmount: bid.estimatedAmount ? Number(bid.estimatedAmount) : null,
          url: bid.url,
          daysRemaining: 3,
        }));

        const results = await sendNotification(['slack'], {
          type: 'deadline_d3',
          bids: notificationBids,
        });

        logger.info(`D-3 알림 발송: ${results.filter(r => r.success).length}/${results.length} 성공`);
      });
    }

    // D-1 알림 발송
    if (d1Bids.length > 0) {
      await step.run('send-d1-notification', async () => {
        const notificationBids: BidNotificationData[] = d1Bids.map(bid => ({
          id: bid.id,
          title: bid.title,
          organization: bid.organization,
          deadline: bid.deadline,
          estimatedAmount: bid.estimatedAmount ? Number(bid.estimatedAmount) : null,
          url: bid.url,
          daysRemaining: 1,
        }));

        const results = await sendNotification(['slack'], {
          type: 'deadline_d1',
          bids: notificationBids,
        });

        logger.info(`D-1 알림 발송: ${results.filter(r => r.success).length}/${results.length} 성공`);
      });
    }

    return {
      d3Count: d3Bids.length,
      d1Count: d1Bids.length,
    };
  }
);

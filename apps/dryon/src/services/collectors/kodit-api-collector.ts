/**
 * 기술보증기금(KODIT) API 공고 수집기
 * 공공데이터포털 API 활용
 */

import axios from 'axios';
import { Announcement } from '../../types/index.js';
import { logger } from '../../utils/logger.js';
import { config } from '../../config/index.js';

export class KoditApiCollector {
  private readonly apiKey: string;
  private readonly apiUrl: string;

  constructor() {
    this.apiKey = config.apis?.kodit?.apiKey || '';
    this.apiUrl =
      config.apis?.kodit?.url ||
      'https://api.odcloud.kr/api/15076574/v1/uddi:41944402-8249-4e45-9e9d-a52507a1db35';
  }

  async collect(keywords?: string[]): Promise<Announcement[]> {
    if (!this.apiKey) {
      logger.warn('⚠️ KODIT_API_KEY not configured, skipping');
      return [];
    }

    try {
      logger.info('🏢 기술보증기금 API 공고 수집 시작');

      const response = await axios.get(this.apiUrl, {
        params: {
          page: 1,
          perPage: 100,
          serviceKey: this.apiKey,
        },
        timeout: 15000,
      });

      const data = response.data.data || [];
      const announcements: Announcement[] = [];

      for (const item of data) {
        const title = item.공고명 || item.title || '';
        const description = item.공고내용 || item.description || '';

        // 키워드 필터링
        if (keywords && keywords.length > 0) {
          const content = `${title} ${description}`.toLowerCase();
          const hasKeyword = keywords.some((keyword) =>
            content.includes(keyword.toLowerCase())
          );
          if (!hasKeyword) continue;
        }

        announcements.push({
          id: `kodit-api-${item.공고번호 || item.id || Date.now()}`,
          title,
          source: 'kodit',
          url: item.공고URL || item.url || 'https://www.kibo.or.kr',
          description,
          deadline: item.마감일 ? new Date(item.마감일) : undefined,
          collectedAt: new Date(),
          agency: '기술보증기금',
          budget: item.지원규모 || undefined,
        });
      }

      logger.info(`✅ 기술보증기금 API: ${announcements.length}건 수집`);
      return announcements;
    } catch (error) {
      logger.error('기술보증기금 API 공고 수집 실패', error);
      return [];
    }
  }
}

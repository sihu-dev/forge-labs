/**
 * 소상공인24 공고 수집기
 * 소상공인시장진흥공단
 * https://www.semas24.or.kr
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { Announcement } from '../../types/index.js';
import { logger } from '../../utils/logger.js';

export class Semas24Collector {
  private readonly baseUrl = 'https://www.semas24.or.kr';
  private readonly announcementUrl = `${this.baseUrl}/main/customer/notice`;

  async collect(keywords?: string[]): Promise<Announcement[]> {
    try {
      logger.info('🏪 소상공인24 공고 수집 시작');

      const response = await axios.get(this.announcementUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        timeout: 10000,
      });

      const $ = cheerio.load(response.data);
      const announcements: Announcement[] = [];

      // 공고 목록 파싱
      $('.board-list tbody tr, .list-table tbody tr').each((_, element) => {
        const $row = $(element);
        const title = $row.find('.subject a, .title a').text().trim();
        const link = $row.find('.subject a, .title a').attr('href');

        if (!title || !link) return;

        // 키워드 필터링
        if (keywords && keywords.length > 0) {
          const hasKeyword = keywords.some((keyword) =>
            title.toLowerCase().includes(keyword.toLowerCase())
          );
          if (!hasKeyword) return;
        }

        const fullUrl = link.startsWith('http')
          ? link
          : `${this.baseUrl}${link}`;
        const id = `semas24-${link.split('=').pop() || Date.now()}`;

        announcements.push({
          id,
          title,
          source: 'semas24',
          url: fullUrl,
          description: title,
          collectedAt: new Date(),
          agency: '소상공인시장진흥공단',
        });
      });

      logger.info(`✅ 소상공인24: ${announcements.length}건 수집`);
      return announcements;
    } catch (error) {
      logger.error('소상공인24 공고 수집 실패', error);
      return [];
    }
  }
}

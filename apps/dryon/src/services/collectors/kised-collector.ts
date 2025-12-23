/**
 * 창업진흥원(KISED) 공고 수집기
 * https://www.kised.or.kr
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { Announcement } from '../../types/index.js';
import { logger } from '../../utils/logger.js';

export class KisedCollector {
  private readonly baseUrl = 'https://www.kised.or.kr';
  private readonly announcementUrl = `${this.baseUrl}/board.es?mid=a10401000000&bid=0001`;

  async collect(keywords?: string[]): Promise<Announcement[]> {
    try {
      logger.info('🚀 창업진흥원 공고 수집 시작');

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
      $('.board-list tbody tr').each((_, element) => {
        const $row = $(element);
        const title = $row.find('.title a').text().trim();
        const link = $row.find('.title a').attr('href');

        if (!title || !link) return;

        // 키워드 필터링
        if (keywords && keywords.length > 0) {
          const hasKeyword = keywords.some(
            (keyword) =>
              title.includes(keyword) ||
              title.toLowerCase().includes(keyword.toLowerCase())
          );
          if (!hasKeyword) return;
        }

        const fullUrl = link.startsWith('http')
          ? link
          : `${this.baseUrl}${link}`;
        const id = `kised-${link.split('=').pop() || Date.now()}`;

        announcements.push({
          id,
          title,
          source: 'kised',
          url: fullUrl,
          description: title,
          collectedAt: new Date(),
          agency: '창업진흥원',
        });
      });

      logger.info(`✅ 창업진흥원: ${announcements.length}건 수집`);
      return announcements;
    } catch (error) {
      logger.error('창업진흥원 공고 수집 실패', error);
      return [];
    }
  }
}

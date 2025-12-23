/**
 * TIPS(민간투자주도형 기술창업지원) 공고 수집기
 * https://www.jointips.or.kr
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { Announcement } from '../../types/index.js';
import { logger } from '../../utils/logger.js';

export class TipsCollector {
  private readonly baseUrl = 'https://www.jointips.or.kr';
  private readonly announcementUrl = `${this.baseUrl}/board/notice`;

  async collect(keywords?: string[]): Promise<Announcement[]> {
    try {
      logger.info('💡 TIPS 공고 수집 시작');

      const response = await axios.get(this.announcementUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        timeout: 10000,
      });

      const $ = cheerio.load(response.data);
      const announcements: Announcement[] = [];

      $('.board-list tbody tr').each((_, element) => {
        const $row = $(element);
        const title = $row.find('.title a').text().trim();
        const link = $row.find('.title a').attr('href');

        if (!title || !link) return;

        if (keywords && keywords.length > 0) {
          const hasKeyword = keywords.some((keyword) =>
            title.toLowerCase().includes(keyword.toLowerCase())
          );
          if (!hasKeyword) return;
        }

        const fullUrl = link.startsWith('http')
          ? link
          : `${this.baseUrl}${link}`;
        const id = `tips-${link.split('=').pop() || Date.now()}`;

        announcements.push({
          id,
          title,
          source: 'tips',
          url: fullUrl,
          description: title,
          collectedAt: new Date(),
          agency: 'TIPS운영센터',
        });
      });

      logger.info(`✅ TIPS: ${announcements.length}건 수집`);
      return announcements;
    } catch (error) {
      logger.error('TIPS 공고 수집 실패', error);
      return [];
    }
  }
}

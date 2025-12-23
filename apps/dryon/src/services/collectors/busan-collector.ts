/**
 * 부산시 공고 수집기
 * 부산창조경제혁신센터
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { Announcement } from '../../types/index.js';
import { logger } from '../../utils/logger.js';

export class BusanCollector {
  private readonly baseUrl = 'https://www.bscic.or.kr';
  private readonly announcementUrl = `${this.baseUrl}/board/notice`;

  async collect(keywords?: string[]): Promise<Announcement[]> {
    try {
      logger.info('🌊 부산시 공고 수집 시작');

      const response = await axios.get(this.announcementUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        timeout: 10000,
      });

      const $ = cheerio.load(response.data);
      const announcements: Announcement[] = [];

      $('.board-list li').each((_, element) => {
        const $item = $(element);
        const title = $item.find('.title a').text().trim();
        const link = $item.find('.title a').attr('href');

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
        const id = `busan-${link.split('=').pop() || Date.now()}`;

        announcements.push({
          id,
          title,
          source: 'busan',
          url: fullUrl,
          description: title,
          collectedAt: new Date(),
          agency: '부산창조경제혁신센터',
        });
      });

      logger.info(`✅ 부산시: ${announcements.length}건 수집`);
      return announcements;
    } catch (error) {
      logger.error('부산시 공고 수집 실패', error);
      return [];
    }
  }
}

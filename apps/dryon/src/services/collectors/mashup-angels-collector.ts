/**
 * Mashup Angels (매쉬업엔젤스) 공고 수집기
 * https://www.mashupangels.com
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { Announcement } from '../../types/index.js';
import { logger } from '../../utils/logger.js';

export class MashupAngelsCollector {
  private readonly baseUrl = 'https://www.mashupangels.com';
  private readonly announcementUrl = `${this.baseUrl}/notice`;

  async collect(keywords?: string[]): Promise<Announcement[]> {
    try {
      logger.info('👼 Mashup Angels 공고 수집 시작');

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
      $('.notice-list li, .board-list tbody tr').each((_, element) => {
        const $item = $(element);
        const title = $item.find('.title, .subject').text().trim();
        const link = $item.find('a').attr('href');

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
        const id = `mashup-${link.split('/').pop() || Date.now()}`;

        announcements.push({
          id,
          title,
          source: 'mashup-angels',
          url: fullUrl,
          description: title,
          collectedAt: new Date(),
          agency: 'Mashup Angels',
          category: '액셀러레이터',
        });
      });

      logger.info(`✅ Mashup Angels: ${announcements.length}건 수집`);
      return announcements;
    } catch (error) {
      logger.error('Mashup Angels 공고 수집 실패', error);
      return [];
    }
  }
}

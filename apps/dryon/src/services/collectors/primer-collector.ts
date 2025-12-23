/**
 * Primer (프라이머) 공고 수집기
 * https://www.primer.kr
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { Announcement } from '../../types/index.js';
import { logger } from '../../utils/logger.js';

export class PrimerCollector {
  private readonly baseUrl = 'https://www.primer.kr';
  private readonly announcementUrl = `${this.baseUrl}/notice`;

  async collect(keywords?: string[]): Promise<Announcement[]> {
    try {
      logger.info('🚀 Primer 공고 수집 시작');

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
      $('.notice-list li, .board-list li').each((_, element) => {
        const $item = $(element);
        const title = $item.find('.title, a').text().trim();
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
        const id = `primer-${link.split('/').pop() || Date.now()}`;

        announcements.push({
          id,
          title,
          source: 'primer',
          url: fullUrl,
          description: title,
          collectedAt: new Date(),
          agency: 'Primer (액셀러레이터)',
          category: '민간투자',
        });
      });

      logger.info(`✅ Primer: ${announcements.length}건 수집`);
      return announcements;
    } catch (error) {
      logger.error('Primer 공고 수집 실패', error);
      return [];
    }
  }
}

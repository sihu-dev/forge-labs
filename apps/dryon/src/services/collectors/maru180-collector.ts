/**
 * Maru180 (마루180) 공고 수집기
 * 서울창업허브 마루180
 * https://www.maru180.com
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { Announcement } from '../../types/index.js';
import { logger } from '../../utils/logger.js';

export class Maru180Collector {
  private readonly baseUrl = 'https://www.maru180.com';
  private readonly announcementUrl = `${this.baseUrl}/board/notice`;

  async collect(keywords?: string[]): Promise<Announcement[]> {
    try {
      logger.info('🏢 Maru180 공고 수집 시작');

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
        const title = $row.find('.subject a').text().trim();
        const link = $row.find('.subject a').attr('href');

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
        const id = `maru180-${link.split('=').pop() || Date.now()}`;

        announcements.push({
          id,
          title,
          source: 'maru180',
          url: fullUrl,
          description: title,
          collectedAt: new Date(),
          agency: '마루180 (서울창업허브)',
          category: '지자체',
        });
      });

      logger.info(`✅ Maru180: ${announcements.length}건 수집`);
      return announcements;
    } catch (error) {
      logger.error('Maru180 공고 수집 실패', error);
      return [];
    }
  }
}

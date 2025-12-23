/**
 * 중소벤처기업진흥공단(SEMAS) 공고 수집기
 * https://www.semas.or.kr
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { Announcement } from '../../types/index.js';
import { logger } from '../../utils/logger.js';

export class SemasCollector {
  private readonly baseUrl = 'https://www.semas.or.kr';
  private readonly announcementUrl = `${this.baseUrl}/board/view.do?board_code=NOTICE`;

  async collect(keywords?: string[]): Promise<Announcement[]> {
    try {
      logger.info('🏢 중소벤처기업진흥공단 공고 수집 시작');

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
        const id = `semas-${link.split('=').pop() || Date.now()}`;

        announcements.push({
          id,
          title,
          source: 'semas',
          url: fullUrl,
          description: title,
          collectedAt: new Date(),
          agency: '중소벤처기업진흥공단',
        });
      });

      logger.info(`✅ 중소벤처기업진흥공단: ${announcements.length}건 수집`);
      return announcements;
    } catch (error) {
      logger.error('중소벤처기업진흥공단 공고 수집 실패', error);
      return [];
    }
  }
}

/**
 * 중소기업청 (중소벤처기업부) 공고 수집기
 * https://www.mss.go.kr
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { Announcement } from '../../types/index.js';
import { logger } from '../../utils/logger.js';

export class SmbaCollector {
  private readonly baseUrl = 'https://www.mss.go.kr';
  private readonly announcementUrl = `${this.baseUrl}/site/smba/ex/bbs/List.do?cbIdx=86`;

  async collect(keywords?: string[]): Promise<Announcement[]> {
    try {
      logger.info('🏛️ 중소벤처기업부 공고 수집 시작');

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
      $('.board-list tbody tr, .list tbody tr').each((_, element) => {
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
        const id = `smba-${link.split('=').pop() || Date.now()}`;

        announcements.push({
          id,
          title,
          source: 'smba',
          url: fullUrl,
          description: title,
          collectedAt: new Date(),
          agency: '중소벤처기업부',
        });
      });

      logger.info(`✅ 중소벤처기업부: ${announcements.length}건 수집`);
      return announcements;
    } catch (error) {
      logger.error('중소벤처기업부 공고 수집 실패', error);
      return [];
    }
  }
}

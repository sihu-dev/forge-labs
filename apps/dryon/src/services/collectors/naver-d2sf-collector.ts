/**
 * 네이버 D2SF (D2 Startup Factory) 공고 수집기
 * https://d2sf.naver.com
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { Announcement } from '../../types/index.js';
import { logger } from '../../utils/logger.js';

export class NaverD2sfCollector {
  private readonly baseUrl = 'https://d2sf.naver.com';
  private readonly announcementUrl = `${this.baseUrl}/notice`;

  async collect(keywords?: string[]): Promise<Announcement[]> {
    try {
      logger.info('🟢 네이버 D2SF 공고 수집 시작');

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
      $('.notice-list li, .board-list tbody tr, .program-list .item').each(
        (_, element) => {
          const $item = $(element);
          const title = $item.find('.title, .subject, h3, h4').text().trim();
          const link = $item.find('a').attr('href');
          const description = $item
            .find('.desc, .description, p')
            .text()
            .trim();

          if (!title || !link) return;

          // 키워드 필터링
          if (keywords && keywords.length > 0) {
            const content = `${title} ${description}`.toLowerCase();
            const hasKeyword = keywords.some((keyword) =>
              content.includes(keyword.toLowerCase())
            );
            if (!hasKeyword) return;
          }

          const fullUrl = link.startsWith('http')
            ? link
            : `${this.baseUrl}${link}`;
          const id = `naver-d2sf-${link.split('/').pop() || Date.now()}`;

          announcements.push({
            id,
            title,
            source: 'naver-d2sf',
            url: fullUrl,
            description: description || title,
            collectedAt: new Date(),
            agency: '네이버 D2 Startup Factory',
            category: '민간투자',
          });
        }
      );

      logger.info(`✅ 네이버 D2SF: ${announcements.length}건 수집`);
      return announcements;
    } catch (error) {
      logger.error('네이버 D2SF 공고 수집 실패', error);
      return [];
    }
  }
}

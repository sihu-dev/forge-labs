/**
 * 서울시 공고 수집기
 * 서울시 청년창업 지원사업 등
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { Announcement } from '../../types/index.js';
import { logger } from '../../utils/logger.js';

export class SeoulCollector {
  private readonly baseUrl = 'https://www.sba.kr';
  private readonly announcementUrl = `${this.baseUrl}/kr/board01`;

  async collect(keywords?: string[]): Promise<Announcement[]> {
    try {
      logger.info('🏙️ 서울시 공고 수집 시작');

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
      $('.board_list li').each((_, element) => {
        const $item = $(element);
        const title = $item.find('.subject').text().trim();
        const link = $item.find('a').attr('href');
        const category = $item.find('.cate').text().trim();

        if (!title || !link) return;

        // 키워드 필터링
        if (keywords && keywords.length > 0) {
          const content = `${title} ${category}`.toLowerCase();
          const hasKeyword = keywords.some((keyword) =>
            content.includes(keyword.toLowerCase())
          );
          if (!hasKeyword) return;
        }

        const fullUrl = link.startsWith('http')
          ? link
          : `${this.baseUrl}${link}`;
        const id = `seoul-${link.split('=').pop() || Date.now()}`;

        announcements.push({
          id,
          title,
          source: 'seoul',
          url: fullUrl,
          description: `${category} - ${title}`,
          collectedAt: new Date(),
          agency: '서울산업진흥원',
        });
      });

      logger.info(`✅ 서울시: ${announcements.length}건 수집`);
      return announcements;
    } catch (error) {
      logger.error('서울시 공고 수집 실패', error);
      return [];
    }
  }
}

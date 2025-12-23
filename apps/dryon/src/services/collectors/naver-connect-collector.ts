/**
 * 네이버 커넥트재단 공고 수집기
 * https://connect.or.kr
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { Announcement } from '../../types/index.js';
import { logger } from '../../utils/logger.js';

export class NaverConnectCollector {
  private readonly baseUrl = 'https://connect.or.kr';
  private readonly announcementUrl = `${this.baseUrl}/notice`;

  async collect(keywords?: string[]): Promise<Announcement[]> {
    try {
      logger.info('🟢 네이버 커넥트재단 공고 수집 시작');

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
        const title = $item.find('.title, .subject, h3').text().trim();
        const link = $item.find('a').attr('href');
        const description = $item.find('.desc, p').text().trim();

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
        const id = `naver-connect-${link.split('/').pop() || Date.now()}`;

        announcements.push({
          id,
          title,
          source: 'naver-connect',
          url: fullUrl,
          description: description || title,
          collectedAt: new Date(),
          agency: '네이버 커넥트재단',
          category: '교육/CSR',
        });
      });

      logger.info(`✅ 네이버 커넥트재단: ${announcements.length}건 수집`);
      return announcements;
    } catch (error) {
      logger.error('네이버 커넥트재단 공고 수집 실패', error);
      return [];
    }
  }
}

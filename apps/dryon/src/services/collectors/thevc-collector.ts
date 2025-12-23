/**
 * TheVC (더브이씨) 공고 수집기
 * https://thevc.kr
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { Announcement } from '../../types/index.js';
import { logger } from '../../utils/logger.js';

export class TheVcCollector {
  private readonly baseUrl = 'https://thevc.kr';
  private readonly announcementUrl = `${this.baseUrl}/programs`;

  async collect(keywords?: string[]): Promise<Announcement[]> {
    try {
      logger.info('💼 TheVC 공고 수집 시작');

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
      $('.program-item, .card').each((_, element) => {
        const $item = $(element);
        const title = $item.find('.title, h3, h4').text().trim();
        const link = $item.find('a').attr('href');
        const description = $item
          .find('.description, .summary, p')
          .text()
          .trim();
        const company = $item.find('.company, .organizer').text().trim();

        if (!title || !link) return;

        // 키워드 필터링
        if (keywords && keywords.length > 0) {
          const content = `${title} ${description} ${company}`.toLowerCase();
          const hasKeyword = keywords.some((keyword) =>
            content.includes(keyword.toLowerCase())
          );
          if (!hasKeyword) return;
        }

        const fullUrl = link.startsWith('http')
          ? link
          : `${this.baseUrl}${link}`;
        const id = `thevc-${link.split('/').pop() || Date.now()}`;

        announcements.push({
          id,
          title,
          source: 'thevc',
          url: fullUrl,
          description: description || title,
          collectedAt: new Date(),
          agency: company || 'TheVC 플랫폼',
          category: '민간플랫폼',
        });
      });

      logger.info(`✅ TheVC: ${announcements.length}건 수집`);
      return announcements;
    } catch (error) {
      logger.error('TheVC 공고 수집 실패', error);
      return [];
    }
  }
}

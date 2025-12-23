/**
 * SparkLabs (스파크랩스) 공고 수집기
 * https://www.sparklabs.co.kr
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { Announcement } from '../../types/index.js';
import { logger } from '../../utils/logger.js';

export class SparkLabsCollector {
  private readonly baseUrl = 'https://www.sparklabs.co.kr';
  private readonly announcementUrl = `${this.baseUrl}/apply`;

  async collect(keywords?: string[]): Promise<Announcement[]> {
    try {
      logger.info('⚡ SparkLabs 공고 수집 시작');

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
      $('.program-list li, .apply-list li').each((_, element) => {
        const $item = $(element);
        const title = $item.find('.title, h3').text().trim();
        const link = $item.find('a').attr('href');
        const description = $item.find('.description, p').text().trim();

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
        const id = `sparklabs-${link.split('/').pop() || Date.now()}`;

        announcements.push({
          id,
          title,
          source: 'sparklabs',
          url: fullUrl,
          description: description || title,
          collectedAt: new Date(),
          agency: 'SparkLabs',
          category: '액셀러레이터',
        });
      });

      logger.info(`✅ SparkLabs: ${announcements.length}건 수집`);
      return announcements;
    } catch (error) {
      logger.error('SparkLabs 공고 수집 실패', error);
      return [];
    }
  }
}

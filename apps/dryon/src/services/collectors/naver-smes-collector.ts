/**
 * 네이버 사장님 - 창업/소상공인 지원사업 수집기
 * https://smes.naver.com
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { Announcement } from '../../types/index.js';
import { logger } from '../../utils/logger.js';

export class NaverSmesCollector {
  private readonly baseUrl = 'https://smes.naver.com';
  private readonly announcementUrl = `${this.baseUrl}/policy/support`;

  async collect(keywords?: string[]): Promise<Announcement[]> {
    try {
      logger.info('💼 네이버 사장님 (지원사업) 공고 수집 시작');

      const response = await axios.get(this.announcementUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        timeout: 10000,
      });

      const $ = cheerio.load(response.data);
      const announcements: Announcement[] = [];

      // 지원사업 목록 파싱
      $('.support_list li, .policy-list .item, .support-item').each(
        (_, element) => {
          const $item = $(element);
          const title = $item
            .find('.title, .support_title, h3, h4')
            .text()
            .trim();
          const link = $item.find('a').attr('href');
          const description = $item
            .find('.description, .summary, .desc, p')
            .text()
            .trim();
          const agency = $item.find('.agency, .organizer, .org').text().trim();

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
          const id = `naver-smes-${link.split('/').pop() || Date.now()}`;

          announcements.push({
            id,
            title,
            source: 'naver-smes',
            url: fullUrl,
            description: description || title,
            collectedAt: new Date(),
            agency: agency || '네이버 사장님',
            category: '창업/소상공인 지원',
            targetAudience: '소상공인, 자영업자, 예비창업자',
          });
        }
      );

      logger.info(`✅ 네이버 사장님: ${announcements.length}건 수집`);
      return announcements;
    } catch (error) {
      logger.error('네이버 사장님 공고 수집 실패', error);
      return [];
    }
  }
}

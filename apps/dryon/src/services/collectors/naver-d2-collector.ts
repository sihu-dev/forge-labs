/**
 * 네이버 D2 (개발자 지원) 공고 수집기
 * https://d2.naver.com
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { Announcement } from '../../types/index.js';
import { logger } from '../../utils/logger.js';

export class NaverD2Collector {
  private readonly baseUrl = 'https://d2.naver.com';
  private readonly announcementUrl = `${this.baseUrl}/news`;

  async collect(keywords?: string[]): Promise<Announcement[]> {
    try {
      logger.info('🟢 네이버 D2 공고 수집 시작');

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
      $('.post-item, .news-item, article').each((_, element) => {
        const $item = $(element);
        const title = $item.find('.post-title, .title, h2, h3').text().trim();
        const link = $item.find('a').attr('href');
        const description = $item
          .find('.post-excerpt, .excerpt, p')
          .text()
          .trim();

        if (!title || !link) return;

        // 키워드 필터링 (D2는 기술 행사/프로그램 중심)
        const techKeywords = [
          '해커톤',
          '컨퍼런스',
          '밋업',
          '채용',
          '프로그램',
          '지원',
          '공모',
          ...(keywords || []),
        ];

        const content = `${title} ${description}`.toLowerCase();
        const hasKeyword = techKeywords.some((keyword) =>
          content.includes(keyword.toLowerCase())
        );
        if (!hasKeyword) return;

        const fullUrl = link.startsWith('http')
          ? link
          : `${this.baseUrl}${link}`;
        const id = `naver-d2-${link.split('/').pop() || Date.now()}`;

        announcements.push({
          id,
          title,
          source: 'naver-d2',
          url: fullUrl,
          description: description || title,
          collectedAt: new Date(),
          agency: '네이버 D2 (개발자 지원)',
          category: '기술/개발자',
        });
      });

      logger.info(`✅ 네이버 D2: ${announcements.length}건 수집`);
      return announcements;
    } catch (error) {
      logger.error('네이버 D2 공고 수집 실패', error);
      return [];
    }
  }
}

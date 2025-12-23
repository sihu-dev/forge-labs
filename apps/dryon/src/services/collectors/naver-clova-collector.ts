/**
 * 네이버 클로바 AI 지원 프로그램 수집기
 * CLOVA AI 생태계 지원
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { Announcement } from '../../types/index.js';
import { logger } from '../../utils/logger.js';

export class NaverClovaCollector {
  private readonly baseUrl = 'https://clova.ai';
  private readonly announcementUrl = `${this.baseUrl}/ko/partner`;

  async collect(keywords?: string[]): Promise<Announcement[]> {
    try {
      logger.info('🟢 네이버 CLOVA AI 공고 수집 시작');

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
      $('.program-item, .partner-program, .support-item').each((_, element) => {
        const $item = $(element);
        const title = $item.find('.title, h3, h4').text().trim();
        const link = $item.find('a').attr('href');
        const description = $item.find('.description, p').text().trim();

        if (!title || !link) return;

        // AI/개발자 중심 키워드
        const aiKeywords = [
          'AI',
          '인공지능',
          'CLOVA',
          '파트너',
          '지원',
          '개발',
          '협력',
          ...(keywords || []),
        ];

        const content = `${title} ${description}`.toLowerCase();
        const hasKeyword = aiKeywords.some((keyword) =>
          content.includes(keyword.toLowerCase())
        );
        if (!hasKeyword) return;

        const fullUrl = link.startsWith('http')
          ? link
          : `${this.baseUrl}${link}`;
        const id = `naver-clova-${link.split('/').pop() || Date.now()}`;

        announcements.push({
          id,
          title,
          source: 'naver-clova',
          url: fullUrl,
          description: description || title,
          collectedAt: new Date(),
          agency: '네이버 CLOVA AI',
          category: 'AI/기술지원',
        });
      });

      logger.info(`✅ 네이버 CLOVA: ${announcements.length}건 수집`);
      return announcements;
    } catch (error) {
      logger.error('네이버 CLOVA 공고 수집 실패', error);
      return [];
    }
  }
}

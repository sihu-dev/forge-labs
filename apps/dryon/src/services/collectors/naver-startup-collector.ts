/**
 * 네이버 검색 - 창업지원 카테고리 전용 수집기
 * 사장님 카테고리의 창업지원사업 섹션
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { Announcement } from '../../types/index.js';
import { logger } from '../../utils/logger.js';

export class NaverStartupCollector {
  private readonly baseUrl = 'https://smes.naver.com';
  private readonly categories = [
    '/policy/support/startup', // 창업지원
    '/policy/support/funding', // 자금지원
    '/policy/support/consulting', // 컨설팅
    '/policy/support/education', // 교육
    '/policy/support/space', // 공간지원
  ];

  async collect(keywords?: string[]): Promise<Announcement[]> {
    try {
      logger.info('🚀 네이버 창업지원 카테고리 공고 수집 시작');

      const allAnnouncements: Announcement[] = [];

      // 각 카테고리에서 수집
      for (const category of this.categories) {
        const announcements = await this.collectFromCategory(
          category,
          keywords
        );
        allAnnouncements.push(...announcements);

        // Rate limit 고려
        await this.delay(500);
      }

      // 중복 제거
      const uniqueAnnouncements = this.removeDuplicates(allAnnouncements);

      logger.info(`✅ 네이버 창업지원: ${uniqueAnnouncements.length}건 수집`);
      return uniqueAnnouncements;
    } catch (error) {
      logger.error('네이버 창업지원 공고 수집 실패', error);
      return [];
    }
  }

  private async collectFromCategory(
    category: string,
    keywords?: string[]
  ): Promise<Announcement[]> {
    try {
      const url = `${this.baseUrl}${category}`;
      const response = await axios.get(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        timeout: 10000,
      });

      const $ = cheerio.load(response.data);
      const announcements: Announcement[] = [];

      // 공고 목록 파싱 (여러 가능한 선택자)
      $(
        '.policy_list li, .support_list li, .program-list .item, .policy-item, .card'
      ).each((_, element) => {
        const $item = $(element);

        // 제목 찾기 (여러 선택자 시도)
        const title = $item
          .find('.title, .policy_title, .support_title, h3, h4, .tit')
          .first()
          .text()
          .trim();

        // 링크 찾기
        const link = $item.find('a').first().attr('href');

        // 설명 찾기
        const description = $item
          .find('.desc, .description, .summary, .content, p')
          .first()
          .text()
          .trim();

        // 기관명 찾기
        const agency = $item
          .find('.agency, .org, .organizer, .source')
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
        const id = `naver-startup-${category.split('/').pop()}-${link.split('/').pop() || Date.now()}`;

        const categoryName = this.getCategoryName(category);

        announcements.push({
          id,
          title,
          source: 'naver-startup',
          url: fullUrl,
          description: description || title,
          collectedAt: new Date(),
          agency: agency || '네이버 창업지원',
          category: categoryName,
        });
      });

      logger.debug(
        `  ${this.getCategoryName(category)}: ${announcements.length}건`
      );
      return announcements;
    } catch (error) {
      logger.debug(`카테고리 수집 실패 (${category})`, error);
      return [];
    }
  }

  private getCategoryName(category: string): string {
    const names: Record<string, string> = {
      startup: '창업지원',
      funding: '자금지원',
      consulting: '컨설팅',
      education: '교육지원',
      space: '공간지원',
    };

    const key = category.split('/').pop() || '';
    return names[key] || '창업지원';
  }

  private removeDuplicates(announcements: Announcement[]): Announcement[] {
    const seen = new Set<string>();
    const unique: Announcement[] = [];

    for (const announcement of announcements) {
      const key = announcement.url;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(announcement);
      }
    }

    return unique;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

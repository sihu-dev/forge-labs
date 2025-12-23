/**
 * 네이버 검색 API - 창업지원사업 수집기
 * 네이버 검색 API를 활용한 실시간 공고 수집
 * https://developers.naver.com/docs/serviceapi/search/news/news.md
 */

import axios from 'axios';
import { Announcement } from '../../types/index.js';
import { logger } from '../../utils/logger.js';
import { config } from '../../config/index.js';

export class NaverSearchApiCollector {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly searchUrl = 'https://openapi.naver.com/v1/search';

  constructor() {
    this.clientId = config.naver?.clientId || process.env.NAVER_CLIENT_ID || '';
    this.clientSecret =
      config.naver?.clientSecret || process.env.NAVER_CLIENT_SECRET || '';
  }

  async collect(keywords?: string[]): Promise<Announcement[]> {
    if (!this.clientId || !this.clientSecret) {
      logger.warn(
        '⚠️ NAVER_CLIENT_ID or NAVER_CLIENT_SECRET not configured, skipping'
      );
      return [];
    }

    try {
      logger.info('🔍 네이버 검색 API 공고 수집 시작');

      const announcements: Announcement[] = [];

      // 검색 키워드 목록
      const searchQueries = [
        '창업지원사업',
        '정부지원사업 창업',
        '스타트업 지원',
        '예비창업 지원',
        '초기창업 지원',
        '중소기업 지원사업',
        '창업 공모',
        '스타트업 공고',
        ...(keywords || []),
      ];

      // 각 키워드로 검색 (뉴스 + 블로그)
      for (const query of searchQueries.slice(0, 5)) {
        // 최대 5개 쿼리
        const newsResults = await this.searchNews(query);
        const blogResults = await this.searchBlog(query);

        announcements.push(...newsResults, ...blogResults);

        // Rate limit 고려
        await this.delay(100);
      }

      // 중복 제거
      const uniqueAnnouncements = this.removeDuplicates(announcements);

      logger.info(`✅ 네이버 검색 API: ${uniqueAnnouncements.length}건 수집`);
      return uniqueAnnouncements;
    } catch (error) {
      logger.error('네이버 검색 API 공고 수집 실패', error);
      return [];
    }
  }

  /**
   * 뉴스 검색
   */
  private async searchNews(query: string): Promise<Announcement[]> {
    try {
      const response = await axios.get(`${this.searchUrl}/news.json`, {
        params: {
          query,
          display: 20, // 최대 20개
          sort: 'date', // 최신순
        },
        headers: {
          'X-Naver-Client-Id': this.clientId,
          'X-Naver-Client-Secret': this.clientSecret,
        },
      });

      const items = response.data.items || [];
      const announcements: Announcement[] = [];

      for (const item of items) {
        // 공고 관련 키워드 필터링
        const title = this.stripHtml(item.title);
        const description = this.stripHtml(item.description);

        if (!this.isRelevantAnnouncement(title, description)) {
          continue;
        }

        announcements.push({
          id: `naver-news-${item.link.split('/').pop() || Date.now()}`,
          title,
          source: 'naver-search',
          url: item.link,
          description,
          collectedAt: new Date(),
          agency: this.stripHtml(
            item.originallink?.split('/')[2] || '네이버 뉴스'
          ),
          category: '뉴스',
        });
      }

      return announcements;
    } catch (error) {
      logger.debug(`네이버 뉴스 검색 실패 (${query})`, error);
      return [];
    }
  }

  /**
   * 블로그 검색
   */
  private async searchBlog(query: string): Promise<Announcement[]> {
    try {
      const response = await axios.get(`${this.searchUrl}/blog.json`, {
        params: {
          query,
          display: 20,
          sort: 'date',
        },
        headers: {
          'X-Naver-Client-Id': this.clientId,
          'X-Naver-Client-Secret': this.clientSecret,
        },
      });

      const items = response.data.items || [];
      const announcements: Announcement[] = [];

      for (const item of items) {
        const title = this.stripHtml(item.title);
        const description = this.stripHtml(item.description);

        if (!this.isRelevantAnnouncement(title, description)) {
          continue;
        }

        announcements.push({
          id: `naver-blog-${item.link.split('/').pop() || Date.now()}`,
          title,
          source: 'naver-search',
          url: item.link,
          description,
          collectedAt: new Date(),
          agency: this.stripHtml(item.bloggername || '네이버 블로그'),
          category: '블로그',
        });
      }

      return announcements;
    } catch (error) {
      logger.debug(`네이버 블로그 검색 실패 (${query})`, error);
      return [];
    }
  }

  /**
   * 공고 관련성 판단
   */
  private isRelevantAnnouncement(title: string, description: string): boolean {
    const content = `${title} ${description}`.toLowerCase();

    // 공고 관련 키워드
    const relevantKeywords = [
      '공고',
      '모집',
      '신청',
      '접수',
      '지원사업',
      '사업공고',
      '참가기업',
      '신청기간',
      '마감',
      '선정',
      '지원',
    ];

    // 제외 키워드
    const excludeKeywords = ['채용', '구인', '이력서', '입사', '구직'];

    const hasRelevant = relevantKeywords.some((keyword) =>
      content.includes(keyword)
    );
    const hasExclude = excludeKeywords.some((keyword) =>
      content.includes(keyword)
    );

    return hasRelevant && !hasExclude;
  }

  /**
   * HTML 태그 제거
   */
  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .trim();
  }

  /**
   * 중복 제거
   */
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

  /**
   * 딜레이
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

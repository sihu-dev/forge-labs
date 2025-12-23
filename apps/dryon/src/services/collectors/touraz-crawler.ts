/**
 * 한국관광공사 관광산업포털(touraz.kr) 크롤러
 * 관광/여행 스타트업 지원사업 공고 수집
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { log } from '../../utils/logger.js';
import type { Program } from '../../types/index.js';

const BASE_URL = 'https://touraz.kr';
const LIST_URL = `${BASE_URL}/announcementList`;

// 탭별 URL (다양한 지원사업 탭)
const TAB_MODES = [
  { mode: 'ktoip', name: '한국관광공사' },
  { mode: 'local', name: '지자체/공공기관' },
  { mode: 'private', name: '민간' },
];

export class TourazCrawler {
  async collect(): Promise<Program[]> {
    try {
      log.info('🛫 관광산업포털(touraz.kr) 크롤링 시작');

      const allPrograms: Program[] = [];

      for (const tab of TAB_MODES) {
        try {
          const programs = await this.scrapeTab(tab.mode, tab.name);
          if (programs.length > 0) {
            log.info(`✅ ${tab.name}: ${programs.length}개 수집`);
            allPrograms.push(...programs);
          }
        } catch (error) {
          log.debug(`${tab.name} 탭 크롤링 실패`, error);
        }
      }

      log.info(`✅ 관광산업포털 전체: ${allPrograms.length}개 공고 수집 완료`);
      return allPrograms;
    } catch (error) {
      log.error('관광산업포털 크롤링 실패', error);
      return [];
    }
  }

  private async scrapeTab(
    tabMode: string,
    tabName: string
  ): Promise<Program[]> {
    const url = `${LIST_URL}?tabMode=${tabMode}`;

    const response = await axios.get(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      timeout: 20000,
    });

    const $ = cheerio.load(response.data);
    const programs: Program[] = [];

    // 카드 리스트 구조: ul.board-card-wrap li
    const cardSelectors = [
      'ul.board-card-wrap li',
      '.board-card-body li',
      '.card-list li',
      '.announcement-list li',
    ];

    for (const selector of cardSelectors) {
      const cards = $(selector);
      if (cards.length === 0) continue;

      cards.each((_, card) => {
        const program = this.parseCard($, $(card), tabName);
        if (program) {
          programs.push(program);
        }
      });

      if (programs.length > 0) break;
    }

    // 테이블 구조도 시도
    if (programs.length === 0) {
      $('table tbody tr').each((_, row) => {
        const program = this.parseTableRow($, $(row), tabName);
        if (program) {
          programs.push(program);
        }
      });
    }

    // 접수중인 공고만 필터링
    const activePrograms = programs.filter(
      (p) => !p.memo?.includes('종료') && !p.memo?.includes('마감')
    );

    return activePrograms.slice(0, 15);
  }

  private parseCard(
    $: cheerio.CheerioAPI,
    $card: cheerio.Cheerio<any>,
    tabName: string
  ): Program | null {
    try {
      // 상태 확인 (접수/종료)
      const cardText = $card.text();
      const status = this.extractStatus(cardText);

      // 종료된 공고는 건너뛰기
      if (status === '종료' || status === '마감') {
        return null;
      }

      // 제목 및 링크 추출
      const $link = $card.find('a[href*="pssrpView"], a[href*="View"]').first();
      let title = '';
      let href = '';

      if ($link.length) {
        title = $link.text().trim().replace(/\s+/g, ' ');
        href = $link.attr('href') || '';
      }

      // 제목이 없으면 다른 방법으로 시도
      if (!title) {
        title = $card
          .find('.title, .subject, h3, h4, strong')
          .first()
          .text()
          .trim();
      }

      if (!title || title.length < 5) return null;

      // 지원사업 관련성 확인
      if (!this.isRelevantProgram(title)) return null;

      // URL 생성
      let url = '';
      if (href) {
        url = href.startsWith('http') ? href : `${BASE_URL}${href}`;
      }

      // 신청기간 추출
      const { startDate, deadline } = this.extractDates($, $card);

      // 기관명 추출
      const organization = this.extractOrganization($, $card, tabName);

      return {
        id: `touraz-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title,
        organization,
        category: this.extractCategory(title),
        target: this.extractTarget(title),
        deadline: deadline || this.getDefaultDeadline(),
        startDate: startDate || new Date().toISOString(),
        source: 'touraz',
        url,
        memo: `관광산업포털 | ${tabName} | 상태: ${status || '확인필요'}`,
      };
    } catch {
      return null;
    }
  }

  private parseTableRow(
    _$: cheerio.CheerioAPI,
    $row: cheerio.Cheerio<any>,
    tabName: string
  ): Program | null {
    try {
      const $link = $row.find('a').first();
      const title = $link.text().trim().replace(/\s+/g, ' ');
      const href = $link.attr('href') || '';

      if (!title || title.length < 5) return null;
      if (!this.isRelevantProgram(title)) return null;

      const url = href.startsWith('http') ? href : `${BASE_URL}${href}`;
      const status = this.extractStatus($row.text());

      if (status === '종료' || status === '마감') {
        return null;
      }

      return {
        id: `touraz-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title,
        organization: tabName,
        category: this.extractCategory(title),
        target: this.extractTarget(title),
        deadline: this.getDefaultDeadline(),
        startDate: new Date().toISOString(),
        source: 'touraz',
        url,
        memo: `관광산업포털 | ${tabName} | 상태: ${status || '확인필요'}`,
      };
    } catch {
      return null;
    }
  }

  private extractStatus(text: string): string {
    if (text.includes('접수중') || text.includes('접수')) return '접수중';
    if (text.includes('종료')) return '종료';
    if (text.includes('마감')) return '마감';
    if (text.includes('예정')) return '접수예정';
    return '';
  }

  private extractDates(
    $: cheerio.CheerioAPI,
    $card: cheerio.Cheerio<any>
  ): { startDate: string | null; deadline: string | null } {
    let startDate: string | null = null;
    let deadline: string | null = null;

    // 신청기간 찾기: "2025-11-27 ~ 2025-12-12" 형태
    const datePattern = /(\d{4}-\d{2}-\d{2})\s*~\s*(\d{4}-\d{2}-\d{2})/;
    const cardText = $card.text();
    const dateMatch = cardText.match(datePattern);

    if (dateMatch && dateMatch[1] && dateMatch[2]) {
      try {
        startDate = new Date(dateMatch[1]).toISOString();
        deadline = new Date(dateMatch[2] + 'T23:59:59').toISOString();
      } catch {
        // 무시
      }
    }

    // dl/dt/dd 구조에서 찾기
    $card.find('dl').each((_, dl) => {
      const text = $(dl).text();
      const match = text.match(datePattern);
      if (match && match[1] && match[2]) {
        try {
          startDate = new Date(match[1]).toISOString();
          deadline = new Date(match[2] + 'T23:59:59').toISOString();
        } catch {
          // 무시
        }
      }
    });

    return { startDate, deadline };
  }

  private extractOrganization(
    $: cheerio.CheerioAPI,
    $card: cheerio.Cheerio<any>,
    defaultOrg: string
  ): string {
    // 담당부서 또는 기관명 찾기
    const orgPatterns = ['담당부서', '주관기관', '기관'];
    let org = defaultOrg;

    $card.find('dl, dd, span').each((_, el) => {
      const text = $(el).text();
      for (const pattern of orgPatterns) {
        if (text.includes(pattern)) {
          const parts = text.split(/[:\s]+/);
          const idx = parts.findIndex((p) => p.includes(pattern));
          const nextPart = parts[idx + 1];
          if (idx >= 0 && nextPart) {
            org = nextPart.trim();
            break;
          }
        }
      }
    });

    return org || '한국관광공사';
  }

  private isRelevantProgram(title: string): boolean {
    // 지원사업 관련 키워드
    const relevantKeywords = [
      '공고',
      '모집',
      '지원',
      '신청',
      '접수',
      '사업',
      '선정',
      '참여',
      '기업',
      '창업',
      '스타트업',
      '육성',
      '입주',
      '센터',
      '바우처',
      '관광',
      '여행',
      '투어',
      '액셀러레이팅',
      '인큐베이팅',
    ];

    // 제외 키워드
    const excludeKeywords = [
      '채용',
      '구인',
      '입사',
      '결과발표',
      '선정결과',
      '취소',
      '정정',
      '변경안내',
    ];

    const lowerTitle = title.toLowerCase();
    const hasRelevant = relevantKeywords.some((kw) => lowerTitle.includes(kw));
    const hasExclude = excludeKeywords.some((kw) => lowerTitle.includes(kw));

    return hasRelevant && !hasExclude;
  }

  private extractCategory(title: string): string {
    if (/입주|센터/.test(title)) return '입주지원';
    if (/액셀러|엑셀러/.test(title)) return '액셀러레이팅';
    if (/관광|여행|투어/.test(title)) return '관광산업';
    if (/창업|스타트업/.test(title)) return '창업지원';
    if (/바우처/.test(title)) return '바우처';
    if (/R&D|연구/.test(title)) return 'R&D';
    if (/수출|해외|글로벌/.test(title)) return '글로벌';
    return '관광지원사업';
  }

  private extractTarget(title: string): string {
    if (/예비창업/.test(title)) return '예비창업자';
    if (/초기창업|창업기업/.test(title)) return '창업기업';
    if (/중소기업/.test(title)) return '중소기업';
    if (/스타트업|벤처/.test(title)) return '스타트업/벤처';
    if (/관광기업/.test(title)) return '관광기업';
    if (/여행사/.test(title)) return '여행사';
    return '관광산업 기업';
  }

  private getDefaultDeadline(): string {
    return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  }
}

export const tourazCrawler = new TourazCrawler();

/**
 * 서울산업진흥원 (SBA) 크롤러
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { log } from '../../utils/logger.js';
import type { Program } from '../../types/index.js';

export class SbaCrawler {
  private readonly boardUrls = [
    'https://www.sba.kr/kr/sbcu01s1', // 공지사항
    'https://www.sba.kr/kr/sbcu02s1', // 사업공고
  ];

  async collect(): Promise<Program[]> {
    try {
      log.info('🕷️ 서울산업진흥원 (SBA) 크롤링 시작');
      const allPrograms: Program[] = [];

      for (const url of this.boardUrls) {
        const programs = await this.scrapeBoard(url);
        allPrograms.push(...programs);
      }

      log.info(`✅ SBA: ${allPrograms.length}개 공고 수집 완료`);
      return allPrograms;
    } catch (error) {
      log.error('SBA 크롤링 실패', error);
      return [];
    }
  }

  private async scrapeBoard(url: string): Promise<Program[]> {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        timeout: 15000,
      });

      const $ = cheerio.load(response.data);
      const programs: Program[] = [];

      // SBA 게시판 구조에 맞는 셀렉터
      const selectors = [
        '.board-list tbody tr',
        '.notice-list .item',
        'table tbody tr',
        '.list-group .list-item',
      ];

      for (const selector of selectors) {
        const elements = $(selector);
        if (elements.length === 0) continue;

        elements.each((_, element) => {
          const program = this.parseListItem($, $(element));
          if (program) {
            programs.push(program);
          }
        });

        if (programs.length > 0) break;
      }

      return programs.slice(0, 10); // 최대 10개
    } catch (error) {
      log.warn(`SBA 게시판 크롤링 실패: ${url}`, error);
      return [];
    }
  }

  private parseListItem(
    _$: cheerio.CheerioAPI,
    $row: cheerio.Cheerio<any>
  ): Program | null {
    try {
      // 제목 추출
      const $titleLink = $row.find(
        'td.subject a, td.title a, a.subject, .title a'
      );
      if (!$titleLink.length) return null;

      const title = $titleLink.text().trim();
      if (!title || title.length < 5 || title === '제목' || title === '번호') {
        return null;
      }

      // 공고 관련성 확인
      if (!this.isRelevantProgram(title)) return null;

      // URL
      const href = $titleLink.attr('href');
      if (!href) return null;

      const baseUrl = 'https://www.sba.kr';
      const url = href.startsWith('http') ? href : `${baseUrl}${href}`;

      // 날짜
      const dateText = $row.find('td.date, .date, .created-date').text().trim();

      // 카테고리
      const category = this.extractCategory(title);

      return {
        id: `sba-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title,
        organization: '서울산업진흥원',
        category,
        target: '서울 소재 중소기업 및 창업기업',
        deadline:
          this.parseDeadline(title, dateText) ||
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        startDate: new Date().toISOString(),
        source: 'sba',
        url,
        memo: `SBA 공고 | 등록: ${dateText}`,
      };
    } catch (error) {
      return null;
    }
  }

  private isRelevantProgram(title: string): boolean {
    const lowerTitle = title.toLowerCase();

    const relevantKeywords = [
      '공고',
      '모집',
      '지원',
      '신청',
      '접수',
      '창업',
      '스타트업',
      '사업',
      '선정',
    ];

    const excludeKeywords = ['채용', '구인', '입사', '인사'];

    const hasRelevant = relevantKeywords.some((kw) => lowerTitle.includes(kw));
    const hasExclude = excludeKeywords.some((kw) => lowerTitle.includes(kw));

    return hasRelevant && !hasExclude;
  }

  private parseDeadline(title: string, dateText: string): string | null {
    // 제목에서 마감일 패턴
    const patterns = [
      /(\d{4})[.-](\d{1,2})[.-](\d{1,2})/,
      /(\d{1,2})월\s*(\d{1,2})일/,
      /~\s*(\d{1,2})[./](\d{1,2})/,
    ];

    for (const pattern of patterns) {
      const match = title.match(pattern);
      if (match && match[1] && match[2] && match[3]) {
        try {
          if (match[1].length === 4) {
            const year = parseInt(match[1]);
            const month = parseInt(match[2]) - 1;
            const day = parseInt(match[3]);
            return new Date(year, month, day).toISOString();
          }
        } catch (e) {
          // 무시
        }
      }
    }

    // 등록일 기준 +30일
    if (dateText) {
      const match = dateText.match(/(\d{4})[.-](\d{1,2})[.-](\d{1,2})/);
      if (match && match[1] && match[2] && match[3]) {
        try {
          const year = parseInt(match[1]);
          const month = parseInt(match[2]) - 1;
          const day = parseInt(match[3]);
          const postDate = new Date(year, month, day);
          return new Date(
            postDate.getTime() + 30 * 24 * 60 * 60 * 1000
          ).toISOString();
        } catch (e) {
          // 무시
        }
      }
    }

    return null;
  }

  private extractCategory(title: string): string {
    if (/AI|인공지능/.test(title)) return 'AI/SW';
    if (/예비창업/.test(title)) return '예비창업';
    if (/초기창업/.test(title)) return '초기창업';
    if (/수출|해외/.test(title)) return '글로벌';
    if (/청년|대학생/.test(title)) return '청년창업';
    return '창업지원';
  }
}

export const sbaCrawler = new SbaCrawler();

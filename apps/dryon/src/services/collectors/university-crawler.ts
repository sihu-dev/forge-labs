/**
 * 대학 창업지원단 통합 크롤러
 * KAIST, 서울대, 연세대, 고려대, 포항공대, 한양대
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { log } from '../../utils/logger.js';
import type { Program } from '../../types/index.js';
import pQueue from 'p-queue';

interface UniversitySource {
  code: string;
  name: string;
  shortName: string;
  url: string;
  boardUrl: string;
}

const UNIVERSITY_SOURCES: UniversitySource[] = [
  {
    code: 'kaist',
    name: 'KAIST 창업원',
    shortName: 'KAIST',
    url: 'https://startup.kaist.ac.kr',
    boardUrl: 'https://startup.kaist.ac.kr/ko/notice/',
  },
  {
    code: 'snu',
    name: '서울대 창업지원단',
    shortName: '서울대',
    url: 'https://startup.snu.ac.kr',
    boardUrl: 'https://startup.snu.ac.kr/board/notice',
  },
  {
    code: 'yonsei',
    name: '연세대 창업지원단',
    shortName: '연세대',
    url: 'https://venture.yonsei.ac.kr',
    boardUrl: 'https://venture.yonsei.ac.kr/notice',
  },
  {
    code: 'korea',
    name: '고려대 창업지원단',
    shortName: '고려대',
    url: 'https://kustart.korea.ac.kr',
    boardUrl: 'https://kustart.korea.ac.kr/kustart/notice/list.do',
  },
  {
    code: 'postech',
    name: '포항공대 창업지원단',
    shortName: '포항공대',
    url: 'https://startup.postech.ac.kr',
    boardUrl: 'https://startup.postech.ac.kr/board/notice',
  },
  {
    code: 'hanyang',
    name: '한양대 창업지원단',
    shortName: '한양대',
    url: 'https://startup.hanyang.ac.kr',
    boardUrl: 'https://startup.hanyang.ac.kr/board/notice',
  },
];

export class UniversityCrawler {
  async collect(): Promise<Program[]> {
    try {
      log.info(
        `🎓 대학 창업지원단 (${UNIVERSITY_SOURCES.length}개) 크롤링 시작`
      );

      const queue = new pQueue({ concurrency: 3 });
      const allPrograms: Program[] = [];

      const results = await Promise.allSettled(
        UNIVERSITY_SOURCES.map((source) =>
          queue.add(() => this.scrapeSource(source))
        )
      );

      for (const [index, result] of results.entries()) {
        const source = UNIVERSITY_SOURCES[index];
        if (!source) continue;

        if (result.status === 'fulfilled') {
          const programs = result.value;
          if (programs && programs.length > 0) {
            log.info(`✅ ${source.shortName}: ${programs.length}개 수집`);
            allPrograms.push(...programs);
          }
        } else {
          log.warn(`❌ ${source.shortName}: 수집 실패`, result.reason);
        }
      }

      log.info(
        `✅ 대학 창업지원단 전체: ${allPrograms.length}개 공고 수집 완료`
      );
      return allPrograms;
    } catch (error) {
      log.error('대학 창업지원단 크롤링 실패', error);
      return [];
    }
  }

  private async scrapeSource(source: UniversitySource): Promise<Program[]> {
    try {
      const response = await axios.get(source.boardUrl, {
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

      // 대학 게시판 구조에 맞는 선택자
      const selectors = [
        '.board-list tbody tr',
        'table.board_list tbody tr',
        '.notice-list li',
        '.list-table tbody tr',
        '.bbs_list tbody tr',
        'article.post',
        '.post-item',
        '.news-item',
        'table tbody tr',
        '.board_list li',
      ];

      for (const selector of selectors) {
        const elements = $(selector);
        if (elements.length === 0) continue;

        elements.each((_, element) => {
          const program = this.parseListItem($, $(element), source);
          if (program) {
            programs.push(program);
          }
        });

        if (programs.length > 0) break;
      }

      return programs.slice(0, 8); // 최대 8개
    } catch (error) {
      log.debug(`${source.shortName} 크롤링 오류`, error);
      return [];
    }
  }

  private parseListItem(
    _$: cheerio.CheerioAPI,
    $row: cheerio.Cheerio<any>,
    source: UniversitySource
  ): Program | null {
    try {
      // 제목 추출
      const titleSelectors = [
        'td.subject a',
        'td.title a',
        'a.title',
        '.title a',
        '.subject a',
        'h3 a',
        'h4 a',
        '.post-title a',
        'a[href*="view"]',
        'a[href*="detail"]',
        'td:nth-child(2) a',
      ];

      let title = '';
      let href = '';

      for (const selector of titleSelectors) {
        const $link = $row.find(selector);
        if ($link.length) {
          title = $link.text().trim();
          href = $link.attr('href') || '';
          if (title && title.length >= 5) break;
        }
      }

      if (!title || title.length < 5) return null;

      // 제외 패턴
      if (['번호', '제목', '구분', '작성자'].includes(title)) return null;

      // 공고 관련성 확인
      if (!this.isRelevantProgram(title)) return null;

      // URL 생성
      const url = href.startsWith('http') ? href : `${source.url}${href}`;

      // 날짜 추출
      const dateText = $row
        .find('td.date, .date, .regdate, .post-date')
        .text()
        .trim();

      return {
        id: `${source.code}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title,
        organization: source.name,
        category: this.extractCategory(title),
        target: '대학(원)생 및 창업자',
        deadline:
          this.parseDeadline(title, dateText) ||
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        startDate: new Date().toISOString(),
        source: `university-${source.code}` as Program['source'],
        url,
        memo: `${source.name} | 등록: ${dateText}`,
      };
    } catch {
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
      '프로그램',
      '액셀러레이팅',
      '데모데이',
      '인큐베이팅',
      '멘토링',
    ];

    const excludeKeywords = [
      '채용',
      '구인',
      '입사',
      '결과',
      '선정결과',
      '강의',
      '수업',
    ];

    const hasRelevant = relevantKeywords.some((kw) => lowerTitle.includes(kw));
    const hasExclude = excludeKeywords.some((kw) => lowerTitle.includes(kw));

    return hasRelevant && !hasExclude;
  }

  private parseDeadline(title: string, dateText: string): string | null {
    const patterns = [
      /(\d{4})[.-](\d{1,2})[.-](\d{1,2})/,
      /(\d{1,2})월\s*(\d{1,2})일/,
      /~\s*(\d{1,2})[./](\d{1,2})/,
    ];

    for (const pattern of patterns) {
      const match = title.match(pattern);
      if (match && match[1] && match[2]) {
        try {
          if (match[1].length === 4 && match[3]) {
            const year = parseInt(match[1]);
            const month = parseInt(match[2]) - 1;
            const day = parseInt(match[3]);
            return new Date(year, month, day).toISOString();
          }
        } catch {
          // 무시
        }
      }
    }

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
        } catch {
          // 무시
        }
      }
    }

    return null;
  }

  private extractCategory(title: string): string {
    if (/AI|인공지능|딥테크/.test(title)) return 'AI/기술창업';
    if (/예비창업/.test(title)) return '예비창업';
    if (/액셀러레이팅|AC/.test(title)) return '액셀러레이팅';
    if (/R&D|연구/.test(title)) return 'R&D';
    if (/글로벌|해외/.test(title)) return '글로벌';
    return '대학창업지원';
  }
}

export const universityCrawler = new UniversityCrawler();

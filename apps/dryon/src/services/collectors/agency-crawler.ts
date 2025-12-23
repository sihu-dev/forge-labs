/**
 * 진흥원/공단 통합 크롤러
 * KOCCA, KISA, KICOX, KIAT, KEIT
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { log } from '../../utils/logger.js';
import type { Program } from '../../types/index.js';
import pQueue from 'p-queue';

interface AgencySource {
  code: string;
  name: string;
  url: string;
  boardUrl?: string;
}

const AGENCY_SOURCES: AgencySource[] = [
  {
    code: 'kocca',
    name: '한국콘텐츠진흥원',
    url: 'https://www.kocca.kr',
    boardUrl:
      'https://www.kocca.kr/cop/bbs/selectBoardList.do?bbsId=BBSMSTR_000000000051',
  },
  {
    code: 'kisa',
    name: '한국인터넷진흥원',
    url: 'https://www.kisa.or.kr',
    boardUrl: 'https://www.kisa.or.kr/401',
  },
  {
    code: 'kicox',
    name: '한국산업단지공단',
    url: 'https://www.kicox.or.kr',
    boardUrl:
      'https://www.kicox.or.kr/user/bbs/BD_selectBbsList.do?q_bbsCode=1002',
  },
  {
    code: 'kiat',
    name: '한국산업기술진흥원',
    url: 'https://www.kiat.or.kr',
    boardUrl:
      'https://www.kiat.or.kr/front/board/boardContentsListPage.do?board_id=3',
  },
  {
    code: 'keit',
    name: '한국산업기술평가관리원',
    url: 'https://www.keit.re.kr',
    boardUrl: 'https://www.keit.re.kr/board/list.do?boardId=NOTICE',
  },
];

export class AgencyCrawler {
  async collect(): Promise<Program[]> {
    try {
      log.info(`🏛️ 진흥원/공단 (${AGENCY_SOURCES.length}개) 크롤링 시작`);

      const queue = new pQueue({ concurrency: 3 });
      const allPrograms: Program[] = [];

      const results = await Promise.allSettled(
        AGENCY_SOURCES.map((source) =>
          queue.add(() => this.scrapeSource(source))
        )
      );

      for (const [index, result] of results.entries()) {
        const source = AGENCY_SOURCES[index];
        if (!source) continue;

        if (result.status === 'fulfilled') {
          const programs = result.value;
          if (programs && programs.length > 0) {
            log.info(`✅ ${source.name}: ${programs.length}개 수집`);
            allPrograms.push(...programs);
          }
        } else {
          log.warn(`❌ ${source.name}: 수집 실패`, result.reason);
        }
      }

      log.info(`✅ 진흥원/공단 전체: ${allPrograms.length}개 공고 수집 완료`);
      return allPrograms;
    } catch (error) {
      log.error('진흥원/공단 크롤링 실패', error);
      return [];
    }
  }

  private async scrapeSource(source: AgencySource): Promise<Program[]> {
    try {
      const targetUrl = source.boardUrl || source.url;
      const response = await axios.get(targetUrl, {
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

      // 다양한 게시판 구조 대응
      const selectors = [
        'table.board_list tbody tr',
        '.board-list tbody tr',
        '.tbl-list tbody tr',
        '.list-table tbody tr',
        '.bbsList tbody tr',
        '.notice-list li',
        '.board_list tbody tr',
        'table tbody tr',
        '.list_box li',
        '.bbs_list tbody tr',
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

      return programs.slice(0, 10); // 최대 10개
    } catch (error) {
      log.debug(`${source.name} 크롤링 오류`, error);
      return [];
    }
  }

  private parseListItem(
    _$: cheerio.CheerioAPI,
    $row: cheerio.Cheerio<any>,
    source: AgencySource
  ): Program | null {
    try {
      // 제목 추출 - 다양한 선택자 시도
      const titleSelectors = [
        'td.subject a',
        'td.title a',
        'a.title',
        '.title a',
        '.subject a',
        'td:nth-child(2) a',
        'a[href*="view"]',
        'a[href*="detail"]',
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
      const excludePatterns = ['번호', '제목', '구분', '작성자', '조회'];
      if (excludePatterns.some((p) => title === p)) return null;

      // 공고 관련성 확인
      if (!this.isRelevantProgram(title)) return null;

      // URL 생성
      const url = href.startsWith('http') ? href : `${source.url}${href}`;

      // 날짜 추출
      const dateText = $row
        .find('td.date, .date, .regdate, td:last-child')
        .text()
        .trim();

      // 카테고리 추출
      const category = this.extractCategory(title, source.code);

      return {
        id: `${source.code}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title,
        organization: source.name,
        category,
        target: this.extractTarget(title),
        deadline:
          this.parseDeadline(title, dateText) ||
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        startDate: new Date().toISOString(),
        source: source.code as Program['source'],
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
      '사업',
      '선정',
      '참여',
      'R&D',
      '과제',
      '기업',
      '창업',
      '스타트업',
    ];

    const excludeKeywords = [
      '채용',
      '구인',
      '입사',
      '결과',
      '선정결과',
      '정정',
      '취소',
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

  private extractCategory(title: string, code: string): string {
    // 기관별 특화 분류
    if (code === 'kocca') {
      if (/게임|영상|애니|웹툰|만화/.test(title)) return '콘텐츠/AI';
      return '콘텐츠';
    }
    if (code === 'kisa') {
      if (/보안|정보보호/.test(title)) return '보안/AI';
      return '인터넷/보안';
    }
    if (code === 'kicox') return '산업단지/입주';
    if (code === 'kiat' || code === 'keit') {
      if (/AI|인공지능/.test(title)) return 'AI/R&D';
      return 'R&D';
    }

    // 공통 분류
    if (/AI|인공지능/.test(title)) return 'AI/SW';
    if (/R&D|연구개발/.test(title)) return 'R&D';
    if (/창업|스타트업/.test(title)) return '창업지원';

    return '정부지원사업';
  }

  private extractTarget(title: string): string {
    if (/예비창업/.test(title)) return '예비창업자';
    if (/초기창업/.test(title)) return '초기창업기업';
    if (/중소기업/.test(title)) return '중소기업';
    if (/벤처/.test(title)) return '벤처기업';
    if (/대학|학생/.test(title)) return '대학/학생';
    return '기업 및 창업자';
  }
}

export const agencyCrawler = new AgencyCrawler();

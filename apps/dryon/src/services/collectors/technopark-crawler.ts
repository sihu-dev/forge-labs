/**
 * 지역 테크노파크 통합 크롤러 (개선판)
 * 전국 주요 테크노파크 - 사업공고 전용 페이지 크롤링
 * 접수중인 지원사업만 필터링하여 수집
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { log } from '../../utils/logger.js';
import type { Program } from '../../types/index.js';
import pQueue from 'p-queue';

interface TechnoparkSource {
  code: string;
  name: string;
  baseUrl: string;
  /** 사업공고/지원사업 목록 페이지 (공지사항이 아닌 실제 지원사업) */
  businessUrl: string;
  /** 상세 페이지 URL 패턴 (seq를 치환) */
  detailPattern?: string;
}

const TECHNOPARK_SOURCES: TechnoparkSource[] = [
  // === 충청권 ===
  {
    code: 'ctp',
    name: '충남테크노파크',
    baseUrl: 'https://ctp.or.kr',
    businessUrl: 'https://ctp.or.kr/business/data.do',
    detailPattern: 'https://ctp.or.kr/business/datadetail.do?seq={seq}',
  },
  {
    code: 'cbtp',
    name: '충북테크노파크',
    baseUrl: 'https://www.cbtp.or.kr',
    businessUrl: 'https://www.cbtp.or.kr/bbs/board.php?bo_table=business',
  },
  {
    code: 'djtp',
    name: '대전테크노파크',
    baseUrl: 'https://www.djtp.or.kr',
    businessUrl: 'https://www.djtp.or.kr/sub/business.do',
  },
  {
    code: 'sjtp',
    name: '세종테크노파크',
    baseUrl: 'https://www.sjtp.or.kr',
    businessUrl: 'https://www.sjtp.or.kr/bbs/board.php?bo_table=business',
  },
  // === 수도권 ===
  {
    code: 'gtp',
    name: '경기테크노파크',
    baseUrl: 'https://www.gtp.or.kr',
    businessUrl:
      'https://www.gtp.or.kr/web/board/BD_board.list.do?boardId=BUSINESS',
  },
  {
    code: 'itp',
    name: '인천테크노파크',
    baseUrl: 'https://www.itp.or.kr',
    businessUrl: 'https://www.itp.or.kr/intro.asp?tmid=13&seq=59',
  },
  // === 영남권 ===
  {
    code: 'dtp',
    name: '대구테크노파크',
    baseUrl: 'https://www.dtp.or.kr',
    businessUrl: 'https://www.dtp.or.kr/www/contents.do?key=1516',
  },
  {
    code: 'btp',
    name: '부산테크노파크',
    baseUrl: 'https://www.btp.or.kr',
    businessUrl: 'https://www.btp.or.kr/bbs/list.php?table=bbs_business',
  },
  {
    code: 'utp',
    name: '울산테크노파크',
    baseUrl: 'https://www.utp.or.kr',
    businessUrl: 'https://www.utp.or.kr/board/list.asp?BoardID=business',
  },
  {
    code: 'gbtp',
    name: '경북테크노파크',
    baseUrl: 'https://www.gbtp.or.kr',
    businessUrl: 'https://www.gbtp.or.kr/bbs/board.php?bo_table=business',
  },
  {
    code: 'gntp',
    name: '경남테크노파크',
    baseUrl: 'https://www.gntp.or.kr',
    businessUrl: 'https://www.gntp.or.kr/bbs/board.php?bo_table=business',
  },
  {
    code: 'pohangtp',
    name: '포항테크노파크',
    baseUrl: 'https://www.pohangtp.org',
    businessUrl: 'https://www.pohangtp.org/bbs/board.php?bo_table=business',
  },
  // === 호남권 ===
  {
    code: 'gjtp',
    name: '광주테크노파크',
    baseUrl: 'https://www.gjtp.or.kr',
    businessUrl: 'https://www.gjtp.or.kr/bbs/board.php?bo_table=business',
  },
  {
    code: 'jbtp',
    name: '전북테크노파크',
    baseUrl: 'https://www.jbtp.or.kr',
    businessUrl: 'https://www.jbtp.or.kr/home/sub.php?menukey=336',
  },
  {
    code: 'jntp',
    name: '전남테크노파크',
    baseUrl: 'https://www.jntp.or.kr',
    businessUrl: 'https://www.jntp.or.kr/bbs/board.php?bo_table=business',
  },
  // === 강원/제주 ===
  {
    code: 'gwtp',
    name: '강원테크노파크',
    baseUrl: 'https://www.gwtp.or.kr',
    businessUrl: 'https://www.gwtp.or.kr/bbs/board.php?bo_table=business',
  },
  {
    code: 'jejutp',
    name: '제주테크노파크',
    baseUrl: 'https://www.jejutp.or.kr',
    businessUrl: 'https://www.jejutp.or.kr/bbs/board.php?bo_table=business',
  },
];

export class TechnoparkCrawler {
  async collect(): Promise<Program[]> {
    try {
      log.info(
        `🏭 지역 테크노파크 (${TECHNOPARK_SOURCES.length}개) 사업공고 크롤링 시작`
      );

      const queue = new pQueue({ concurrency: 3 });
      const allPrograms: Program[] = [];

      const results = await Promise.allSettled(
        TECHNOPARK_SOURCES.map((source) =>
          queue.add(() => this.scrapeSource(source))
        )
      );

      for (const [index, result] of results.entries()) {
        const source = TECHNOPARK_SOURCES[index];
        if (!source) continue;

        if (result.status === 'fulfilled') {
          const programs = result.value;
          if (programs && programs.length > 0) {
            log.info(`✅ ${source.name}: ${programs.length}개 사업공고 수집`);
            allPrograms.push(...programs);
          }
        } else {
          log.warn(`❌ ${source.name}: 수집 실패`, result.reason);
        }
      }

      log.info(
        `✅ 테크노파크 전체: ${allPrograms.length}개 사업공고 수집 완료`
      );
      return allPrograms;
    } catch (error) {
      log.error('테크노파크 크롤링 실패', error);
      return [];
    }
  }

  private async scrapeSource(source: TechnoparkSource): Promise<Program[]> {
    try {
      const response = await axios.get(source.businessUrl, {
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

      // 다양한 게시판 구조 대응 (사업공고 테이블)
      const tableSelectors = [
        'table tbody tr',
        '.board-list tbody tr',
        'table.board_list tbody tr',
        '.tbl-list tbody tr',
        '.list-table tbody tr',
        '.bbsList tbody tr',
        '.bbs_list tbody tr',
        '#boardList tbody tr',
        '.table-list tbody tr',
      ];

      // 리스트 구조 대응
      const listSelectors = [
        '.notice-list li',
        '.board_list li',
        '.list_box li',
        'ul.list li',
        '.news-list li',
      ];

      // 테이블 구조 먼저 시도
      for (const selector of tableSelectors) {
        const elements = $(selector);
        if (elements.length === 0) continue;

        elements.each((_, element) => {
          const program = this.parseTableRow($, $(element), source);
          if (program) {
            programs.push(program);
          }
        });

        if (programs.length > 0) break;
      }

      // 테이블에서 못 찾았으면 리스트 구조 시도
      if (programs.length === 0) {
        for (const selector of listSelectors) {
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
      }

      // 접수중인 공고만 필터링 (마감된 공고 제외)
      const activePrograms = programs.filter((p) => !p.memo?.includes('마감'));

      return activePrograms.slice(0, 10); // 최대 10개
    } catch (error) {
      log.debug(`${source.name} 크롤링 오류`, error);
      return [];
    }
  }

  private parseTableRow(
    $: cheerio.CheerioAPI,
    $row: cheerio.Cheerio<any>,
    source: TechnoparkSource
  ): Program | null {
    try {
      // 제목/링크 추출 - 다양한 선택자 시도
      const titleSelectors = [
        'td a[href*="detail"]',
        'td a[href*="view"]',
        'td a[href*="seq="]',
        'td.subject a',
        'td.title a',
        'a.title',
        '.title a',
        '.subject a',
        'td:nth-child(2) a',
        'td:nth-child(3) a',
        'a[href*=".do"]',
      ];

      let title = '';
      let href = '';

      for (const selector of titleSelectors) {
        const $link = $row.find(selector).first();
        if ($link.length) {
          title = $link.text().trim().replace(/\s+/g, ' ');
          href = $link.attr('href') || '';
          if (title && title.length >= 5) break;
        }
      }

      // 제목이 없으면 td 텍스트에서 추출 시도
      if (!title || title.length < 5) {
        const $td = $row.find('td').eq(1);
        title = $td.text().trim().replace(/\s+/g, ' ');
        href = $td.find('a').attr('href') || '';
      }

      if (!title || title.length < 5) return null;

      // 제외 패턴
      const excludePatterns = [
        '번호',
        '제목',
        '구분',
        '작성자',
        '조회',
        'No.',
        '№',
      ];
      if (excludePatterns.some((p) => title === p || title.startsWith(p)))
        return null;

      // 공고 관련성 확인
      if (!this.isRelevantProgram(title)) return null;

      // URL 생성
      let url = '';
      if (href) {
        if (href.startsWith('http')) {
          url = href;
        } else if (href.startsWith('/')) {
          url = `${source.baseUrl}${href}`;
        } else if (href.includes('seq=')) {
          // seq 파라미터가 있으면 상세페이지 URL 생성
          const seqMatch = href.match(/seq=(\d+)/);
          if (seqMatch && seqMatch[1] && source.detailPattern) {
            url = source.detailPattern.replace('{seq}', seqMatch[1]);
          } else {
            url = `${source.baseUrl}/${href}`;
          }
        } else {
          url = `${source.baseUrl}/${href}`;
        }
      }

      // 접수상태 및 마감일 추출
      const statusInfo = this.extractStatusAndDeadline($, $row);

      // 마감된 공고는 건너뛰기
      if (statusInfo.status === '마감') {
        return null;
      }

      // 등록일 추출
      const dateText =
        $row
          .find(
            'td.date, .date, .regdate, td:nth-last-child(2), td:nth-last-child(3)'
          )
          .text()
          .trim() || '';

      // 카테고리 추출
      const category = this.extractCategory(title);

      return {
        id: `${source.code}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title,
        organization: source.name,
        category,
        target: this.extractTarget(title),
        deadline:
          statusInfo.deadline ||
          this.parseDeadline(title, dateText) ||
          this.getDefaultDeadline(),
        startDate: new Date().toISOString(),
        source: 'technopark',
        url,
        memo: `${source.name} | 상태: ${statusInfo.status || '확인필요'} | 등록: ${dateText}`,
      };
    } catch {
      return null;
    }
  }

  private parseListItem(
    _$: cheerio.CheerioAPI,
    $item: cheerio.Cheerio<any>,
    source: TechnoparkSource
  ): Program | null {
    try {
      const $link = $item.find('a').first();
      const title = $link.text().trim().replace(/\s+/g, ' ');
      const href = $link.attr('href') || '';

      if (!title || title.length < 5) return null;
      if (!this.isRelevantProgram(title)) return null;

      const url = href.startsWith('http') ? href : `${source.baseUrl}${href}`;
      const dateText = $item.find('.date, .regdate, span').last().text().trim();

      return {
        id: `${source.code}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title,
        organization: source.name,
        category: this.extractCategory(title),
        target: this.extractTarget(title),
        deadline:
          this.parseDeadline(title, dateText) || this.getDefaultDeadline(),
        startDate: new Date().toISOString(),
        source: 'technopark',
        url,
        memo: `${source.name} | 등록: ${dateText}`,
      };
    } catch {
      return null;
    }
  }

  /**
   * 접수상태 및 마감일 추출 (충남테크노파크 스타일)
   * <li>접수중</li> <li>2025-12-31 18:00 마감</li> 형태 파싱
   */
  private extractStatusAndDeadline(
    $: cheerio.CheerioAPI,
    $row: cheerio.Cheerio<any>
  ): { status: string; deadline: string | null } {
    let status = '';
    let deadline: string | null = null;

    // 상태 배지 찾기
    const statusTexts = [
      '접수중',
      '마감',
      '접수예정',
      '진행중',
      '모집중',
      '종료',
    ];
    $row.find('li, span, .badge, .status, .state').each((_, el) => {
      const text = $(el).text().trim();
      for (const s of statusTexts) {
        if (text.includes(s)) {
          status = s;
          break;
        }
      }
    });

    // 마감일 찾기 (YYYY-MM-DD HH:MM 형태)
    $row.find('li, span, td').each((_, el) => {
      const text = $(el).text().trim();
      const deadlineMatch = text.match(
        /(\d{4})-(\d{2})-(\d{2})\s*(\d{2}:\d{2})?/
      );
      if (
        deadlineMatch &&
        deadlineMatch[1] &&
        deadlineMatch[2] &&
        deadlineMatch[3]
      ) {
        try {
          const year = parseInt(deadlineMatch[1]);
          const month = parseInt(deadlineMatch[2]) - 1;
          const day = parseInt(deadlineMatch[3]);
          const time = deadlineMatch[4] || '23:59';
          const [hour, minute] = time.split(':').map((n) => parseInt(n, 10));
          deadline = new Date(year, month, day, hour, minute).toISOString();
        } catch {
          // 무시
        }
      }
    });

    return { status, deadline };
  }

  private isRelevantProgram(title: string): boolean {
    const lowerTitle = title.toLowerCase();

    // 지원사업 관련 키워드 (필수)
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
      'R&D',
      '과제',
      '바우처',
      '디지털',
      'SW',
      'AI',
    ];

    // 제외 키워드
    const excludeKeywords = [
      '채용',
      '구인',
      '입사',
      '결과',
      '선정결과',
      '정정',
      '취소',
      '인사',
      '휴무',
      '안내문',
      '변경안내',
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

    // 제목에서 마감일 찾기
    for (const pattern of patterns) {
      const match = title.match(pattern);
      if (match && match[1] && match[2]) {
        try {
          if (match[1].length === 4 && match[3]) {
            const year = parseInt(match[1]);
            const month = parseInt(match[2]) - 1;
            const day = parseInt(match[3]);
            return new Date(year, month, day, 23, 59, 59).toISOString();
          }
        } catch {
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
        } catch {
          // 무시
        }
      }
    }

    return null;
  }

  private getDefaultDeadline(): string {
    // 기본값: 현재로부터 30일 후
    return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  }

  private extractCategory(title: string): string {
    if (/AI|인공지능/.test(title)) return 'AI/SW';
    if (/SW|소프트웨어|디지털/.test(title)) return 'SW/디지털';
    if (/예비창업/.test(title)) return '예비창업';
    if (/초기창업/.test(title)) return '초기창업';
    if (/R&D|연구개발|기술개발/.test(title)) return 'R&D';
    if (/청년|대학생/.test(title)) return '청년창업';
    if (/바우처/.test(title)) return '바우처';
    if (/수출|해외|글로벌/.test(title)) return '글로벌';
    if (/제조|스마트공장|자율형공장/.test(title)) return '스마트제조';
    return '지역창업지원';
  }

  private extractTarget(title: string): string {
    if (/예비창업/.test(title)) return '예비창업자';
    if (/초기창업|창업기업/.test(title)) return '창업기업';
    if (/중소기업/.test(title)) return '중소기업';
    if (/스타트업|벤처/.test(title)) return '스타트업/벤처';
    if (/청년/.test(title)) return '청년';
    if (/대학|학생/.test(title)) return '대학/학생';
    if (/소공인|소상공인/.test(title)) return '소상공인';
    return '지역 기업 및 창업자';
  }
}

export const technoparkCrawler = new TechnoparkCrawler();

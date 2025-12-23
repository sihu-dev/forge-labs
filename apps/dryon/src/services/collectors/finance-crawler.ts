/**
 * 금융기관 크롤러 (KODIT, KOREG, KIBO)
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { log } from '../../utils/logger.js';
import type { Program } from '../../types/index.js';
import pQueue from 'p-queue';

interface FinanceSource {
  code: string;
  name: string;
  url: string;
}

const FINANCE_SOURCES: FinanceSource[] = [
  {
    code: 'kodit',
    name: '신용보증기금',
    url: 'https://www.kodit.co.kr/brd/view.do?seq=&srchFr=&srchTo=&srchWord=&srchTp=&itm_seq_1=0&itm_seq_2=0&multi_itm_seq=0&company_cd=&company_nm=&page=1&brd_id=BDIDX_000000000000000',
  },
  {
    code: 'koreg',
    name: '기술보증기금',
    url: 'https://www.kibo.or.kr/websquare/websquare.html?w2xPath=/ui/kib/ui/biz/BD_KIBHO0001M.xml',
  },
  {
    code: 'kibo',
    name: '중소벤처기업진흥공단',
    url: 'https://www.kosmes.or.kr/sbc/SH/SBC_SH_070_L.do',
  },
];

export class FinanceCrawler {
  async collect(): Promise<Program[]> {
    try {
      log.info('🕷️ 금융기관 (3개) 크롤링 시작');

      const queue = new pQueue({ concurrency: 2 });
      const allPrograms: Program[] = [];

      const results = await Promise.allSettled(
        FINANCE_SOURCES.map((source) =>
          queue.add(() => this.scrapeSource(source))
        )
      );

      for (const [index, result] of results.entries()) {
        const source = FINANCE_SOURCES[index];
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

      log.info(`✅ 금융기관 전체: ${allPrograms.length}개 공고 수집 완료`);
      return allPrograms;
    } catch (error) {
      log.error('금융기관 크롤링 실패', error);
      return [];
    }
  }

  private async scrapeSource(source: FinanceSource): Promise<Program[]> {
    try {
      const response = await axios.get(source.url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        timeout: 15000,
      });

      const $ = cheerio.load(response.data);
      const programs: Program[] = [];

      // 다양한 게시판 구조 대응
      const selectors = [
        '.board-list tbody tr',
        'table.board_list tbody tr',
        '.notice-list .item',
        '.tbl-list tbody tr',
        '.list-table tbody tr',
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
    source: FinanceSource
  ): Program | null {
    try {
      // 제목 추출
      const $titleLink = $row.find(
        'td.subject a, td.title a, a.title, .title a, .subject a'
      );
      if (!$titleLink.length) return null;

      const title = $titleLink.text().trim();
      if (
        !title ||
        title.length < 5 ||
        title === '제목' ||
        title === '번호' ||
        title === '구분'
      ) {
        return null;
      }

      // 공고 관련성 확인
      if (!this.isRelevantProgram(title)) return null;

      // URL
      const href = $titleLink.attr('href');
      if (!href) return null;

      const url = href.startsWith('http')
        ? href
        : `${new URL(source.url).origin}${href}`;

      // 날짜
      const dateText = $row.find('td.date, .date, .created').text().trim();

      // 카테고리
      const category = this.extractCategory(title, source.code);

      return {
        id: `${source.code}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title,
        organization: source.name,
        category,
        target: '중소기업 및 창업기업',
        deadline:
          this.parseDeadline(title, dateText) ||
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        startDate: new Date().toISOString(),
        source: source.code as any,
        url,
        memo: `${source.name} | 등록: ${dateText}`,
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
      '보증',
      '대출',
      '융자',
      '사업',
      '창업',
      '투자',
    ];

    const excludeKeywords = ['채용', '구인', '입사', '인사발령'];

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

  private extractCategory(title: string, sourceCode: string): string {
    if (/보증/.test(title)) return '금융지원';
    if (/대출|융자/.test(title)) return '금융지원';
    if (/투자/.test(title)) return '투자유치';
    if (/예비창업/.test(title)) return '예비창업';
    if (/초기창업/.test(title)) return '초기창업';

    // 기관별 기본 카테고리
    if (sourceCode === 'kodit' || sourceCode === 'koreg') return '금융지원';
    return '창업지원';
  }
}

export const financeCrawler = new FinanceCrawler();

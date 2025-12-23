/**
 * KISED (창업진흥원) 크롤러
 * 웹 스크래핑 기반 공고 수집
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { log } from '../../utils/logger.js';
import type { Program } from '../../types/index.js';

export class KisedCrawler {
  private readonly baseUrl = 'https://www.kised.or.kr';
  private readonly boardUrl =
    'https://www.kised.or.kr/board.es?mid=a10301000000&bid=0001';

  async collect(): Promise<Program[]> {
    try {
      log.info('🕷️ KISED 크롤링 시작');

      const programs: Program[] = [];
      const maxPages = 3; // 최대 3페이지 수집

      for (let page = 1; page <= maxPages; page++) {
        const pagePrograms = await this.scrapePage(page);
        programs.push(...pagePrograms);

        // Rate limiting
        await this.delay(1000);
      }

      log.info(`✅ KISED: ${programs.length}개 공고 수집 완료`);
      return programs;
    } catch (error) {
      log.error('KISED 크롤링 실패', error);
      return [];
    }
  }

  private async scrapePage(page: number): Promise<Program[]> {
    try {
      const url = `${this.boardUrl}&pn=${page}`;
      log.debug(`KISED 페이지 ${page} 크롤링: ${url}`);

      const response = await axios.get(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        timeout: 10000,
      });

      const $ = cheerio.load(response.data);
      const programs: Program[] = [];

      // 게시판 목록 파싱
      $('.board-list tbody tr, table.board_list tr').each((_, element) => {
        try {
          const $row = $(element);

          // 제목 추출
          const $titleLink = $row.find('td.title a, td.subject a');
          if (!$titleLink.length) return;

          const title = $titleLink.text().trim();
          if (!title || title === '번호' || title === '제목') return;

          // 필터링: 공고 관련 키워드
          if (!this.isRelevantProgram(title)) return;

          // 상세 URL
          const href = $titleLink.attr('href');
          const detailUrl = href?.startsWith('http')
            ? href
            : `${this.baseUrl}${href}`;

          // 날짜 추출
          const dateText =
            $row.find('td.date, td.reg_date').text().trim() || '';
          const deadline = this.parseDeadline(title, dateText);

          // 카테고리/분야 추정
          const category = this.extractCategory(title);

          const program: Program = {
            id: `kised-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title,
            organization: '창업진흥원 (KISED)',
            category,
            target: this.extractTarget(title),
            deadline:
              deadline ||
              new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            startDate: new Date().toISOString(),
            source: 'kised',
            url: detailUrl,
            memo: `등록일: ${dateText}`,
          };

          programs.push(program);
        } catch (err) {
          log.debug('KISED 행 파싱 오류', err);
        }
      });

      log.debug(`KISED 페이지 ${page}: ${programs.length}개 발견`);
      return programs;
    } catch (error) {
      log.error(`KISED 페이지 ${page} 크롤링 실패`, error);
      return [];
    }
  }

  /**
   * 공고 관련성 판단
   */
  private isRelevantProgram(title: string): boolean {
    const lowerTitle = title.toLowerCase();

    const relevantKeywords = [
      '공고',
      '모집',
      '지원',
      '신청',
      '접수',
      '선정',
      '창업',
      '스타트업',
      '사업',
      '예비창업',
      '초기창업',
    ];

    const excludeKeywords = ['채용', '구인', '입사', '인턴'];

    const hasRelevant = relevantKeywords.some((kw) => lowerTitle.includes(kw));
    const hasExclude = excludeKeywords.some((kw) => lowerTitle.includes(kw));

    return hasRelevant && !hasExclude;
  }

  /**
   * 마감일 추출/추정
   */
  private parseDeadline(title: string, dateText: string): string | null {
    // 제목에서 마감일 패턴 찾기
    const deadlinePatterns = [
      /(\d{4})[.-](\d{1,2})[.-](\d{1,2})/,
      /(\d{1,2})월\s*(\d{1,2})일/,
      /~\s*(\d{1,2})[./](\d{1,2})/,
    ];

    for (const pattern of deadlinePatterns) {
      const match = title.match(pattern);
      if (match) {
        try {
          if (match[1] && match[2] && match[3]) {
            // YYYY-MM-DD 형식
            const year = parseInt(match[1]);
            const month = parseInt(match[2]) - 1;
            const day = parseInt(match[3]);
            return new Date(year, month, day).toISOString();
          } else if (match[1] && match[2]) {
            // MM월 DD일 형식 - 올해로 가정
            const month = parseInt(match[1]) - 1;
            const day = parseInt(match[2]);
            const year = new Date().getFullYear();
            return new Date(year, month, day).toISOString();
          }
        } catch (e) {
          // 파싱 실패 시 무시
        }
      }
    }

    // 등록일 기준 +30일로 추정
    if (dateText) {
      const match = dateText.match(/(\d{4})[.-](\d{1,2})[.-](\d{1,2})/);
      if (match && match[1] && match[2] && match[3]) {
        try {
          const year = parseInt(match[1]);
          const month = parseInt(match[2]) - 1;
          const day = parseInt(match[3]);
          const postDate = new Date(year, month, day);
          const estimatedDeadline = new Date(
            postDate.getTime() + 30 * 24 * 60 * 60 * 1000
          );
          return estimatedDeadline.toISOString();
        } catch (e) {
          // 실패
        }
      }
    }

    return null;
  }

  /**
   * 카테고리 추출
   */
  private extractCategory(title: string): string {
    if (/예비창업|창업준비/.test(title)) return '예비창업';
    if (/초기창업|신규창업/.test(title)) return '초기창업';
    if (/AI|인공지능/.test(title)) return 'AI/SW';
    if (/SW|소프트웨어/.test(title)) return 'SW/플랫폼';
    if (/대학생|청년/.test(title)) return '대학생창업';
    if (/글로벌|해외/.test(title)) return '글로벌진출';

    return '창업지원';
  }

  /**
   * 지원 대상 추출
   */
  private extractTarget(title: string): string {
    const targets: string[] = [];

    if (/예비창업/.test(title)) targets.push('예비창업자');
    if (/초기창업/.test(title)) targets.push('초기창업기업');
    if (/대학생/.test(title)) targets.push('대학생');
    if (/청년/.test(title)) targets.push('청년창업자');
    if (/중소기업/.test(title)) targets.push('중소기업');

    return targets.length > 0 ? targets.join(', ') : '창업자 및 중소기업';
  }

  /**
   * 딜레이
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const kisedCrawler = new KisedCrawler();

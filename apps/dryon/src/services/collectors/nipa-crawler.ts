/**
 * NIPA (한국지능정보사회진흥원) 크롤러
 * 동적 페이지 처리를 위해 Puppeteer 사용
 */

import puppeteer from 'puppeteer';
import { log } from '../../utils/logger.js';
import type { Program } from '../../types/index.js';

export class NipaCrawler {
  private readonly baseUrl = 'https://www.nipa.kr';
  private readonly boardUrls = [
    'https://www.nipa.kr/board/boardList.it?menuNo=417', // 공고/공모
    'https://www.nipa.kr/board/boardList.it?menuNo=419', // 사업공고
  ];

  async collect(): Promise<Program[]> {
    try {
      log.info('🕷️ NIPA 크롤링 시작 (Puppeteer)');
      const allPrograms: Program[] = [];

      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      try {
        for (const boardUrl of this.boardUrls) {
          const programs = await this.scrapeBoardWithPuppeteer(
            browser,
            boardUrl
          );
          allPrograms.push(...programs);
        }
      } finally {
        await browser.close();
      }

      log.info(`✅ NIPA: ${allPrograms.length}개 공고 수집 완료`);
      return allPrograms;
    } catch (error) {
      log.error('NIPA 크롤링 실패', error);
      return [];
    }
  }

  private async scrapeBoardWithPuppeteer(
    browser: puppeteer.Browser,
    url: string
  ): Promise<Program[]> {
    const page = await browser.newPage();

    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      // 게시글 목록 대기
      await page.waitForSelector('.board-list, .list-table', {
        timeout: 10000,
      });

      // 페이지에서 데이터 추출

      const programs = (await page.evaluate(`
        (() => {
          const items = [];
          const selectors = [
            '.board-list tbody tr',
            '.list-table tbody tr',
            '.tbl-list tbody tr',
          ];

          for (const selector of selectors) {
            const rows = document.querySelectorAll(selector);
            if (rows.length === 0) continue;

            rows.forEach((row) => {
              const titleLink = row.querySelector(
                'td.subject a, td.title a, .subject a, .title a'
              );
              if (!titleLink) return;

              const title = titleLink.textContent?.trim() || '';
              if (!title || title.length < 5) return;

              const relevantKeywords = [
                '공고', '모집', '지원', '신청', '접수',
                '스타트업', '창업', '사업',
              ];
              const hasRelevant = relevantKeywords.some((kw) =>
                title.includes(kw)
              );
              if (!hasRelevant) return;

              const href = titleLink.getAttribute('href') || '';
              const dateText =
                row.querySelector('td.date, .date')?.textContent?.trim() || '';

              items.push({ title, url: href, dateText });
            });

            if (items.length > 0) break;
          }

          return items.slice(0, 15);
        })()
      `)) as Array<{ title: string; url: string; dateText: string }>;

      // Program 객체로 변환
      return programs.map((item) => ({
        id: `nipa-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: item.title,
        organization: 'NIPA (정보통신산업진흥원)',
        category: this.extractCategory(item.title),
        target: 'ICT/SW 기업 및 예비창업자',
        deadline:
          this.parseDeadline(item.title, item.dateText) ||
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        startDate: new Date().toISOString(),
        source: 'nipa',
        url: item.url.startsWith('http')
          ? item.url
          : `${this.baseUrl}${item.url}`,
        memo: `NIPA 공고 | 등록: ${item.dateText}`,
      }));
    } catch (error) {
      log.warn(`NIPA 게시판 크롤링 실패: ${url}`, error);
      return [];
    } finally {
      await page.close();
    }
  }

  private parseDeadline(title: string, dateText: string): string | null {
    // 제목에서 마감일 패턴 추출
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
    if (/클라우드/.test(title)) return 'SW/플랫폼';
    if (/빅데이터|데이터/.test(title)) return 'AI/SW';
    if (/예비창업/.test(title)) return '예비창업';
    if (/초기창업/.test(title)) return '초기창업';
    return 'ICT/SW';
  }
}

export const nipaCrawler = new NipaCrawler();

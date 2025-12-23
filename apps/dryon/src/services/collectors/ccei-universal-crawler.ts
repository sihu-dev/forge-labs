/**
 * 창조경제혁신센터 (CCEI) 범용 크롤러
 * 전국 17개 창조경제혁신센터 통합 수집
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { log } from '../../utils/logger.js';
import type { Program } from '../../types/index.js';
import pQueue from 'p-queue';

const CCEI_REGIONS = [
  { code: 'gangwon', name: '강원' },
  { code: 'gyeongnam', name: '경남' },
  { code: 'gyeongbuk', name: '경북' },
  { code: 'gwangju', name: '광주' },
  { code: 'daegu', name: '대구' },
  { code: 'daejeon', name: '대전' },
  { code: 'sejong', name: '세종' },
  { code: 'ulsan', name: '울산' },
  { code: 'incheon', name: '인천' },
  { code: 'jeonnam', name: '전남' },
  { code: 'jeonbuk', name: '전북' },
  { code: 'jeju', name: '제주' },
  { code: 'chungnam', name: '충남' },
  { code: 'chungbuk', name: '충북' },
  { code: 'pohang', name: '포항' },
  { code: 'changwon', name: '창원' },
  { code: 'pyeongtaek', name: '평택' },
];

export class CceiUniversalCrawler {
  private readonly urlPattern =
    'https://{region}ccei.creativekorea.or.kr/board/list.do?menuNo=';

  async collect(): Promise<Program[]> {
    try {
      log.info('🕷️ 창조경제혁신센터 (17개) 크롤링 시작');

      const queue = new pQueue({ concurrency: 3 });
      const allPrograms: Program[] = [];

      // 병렬 크롤링
      const results = await Promise.allSettled(
        CCEI_REGIONS.map((region) => queue.add(() => this.scrapeRegion(region)))
      );

      for (const [index, result] of results.entries()) {
        const region = CCEI_REGIONS[index];
        if (!region) continue;

        if (result.status === 'fulfilled') {
          const programs = result.value;
          if (programs && programs.length > 0) {
            log.info(`✅ CCEI ${region.name}: ${programs.length}개 수집`);
            allPrograms.push(...programs);
          }
        } else {
          log.warn(`❌ CCEI ${region.name}: 수집 실패`, result.reason);
        }
      }

      log.info(`✅ CCEI 전체: ${allPrograms.length}개 공고 수집 완료`);
      return allPrograms;
    } catch (error) {
      log.error('CCEI 크롤링 실패', error);
      return [];
    }
  }

  private async scrapeRegion(region: {
    code: string;
    name: string;
  }): Promise<Program[]> {
    try {
      // 각 센터마다 게시판 구조가 약간 다를 수 있으므로 여러 URL 시도
      const possibleMenuNos = ['200001', '200002', '100001', '100002'];

      for (const menuNo of possibleMenuNos) {
        try {
          const url = this.urlPattern.replace('{region}', region.code) + menuNo;
          const response = await axios.get(url, {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
            timeout: 10000,
          });

          const $ = cheerio.load(response.data);
          const programs: Program[] = [];

          // 다양한 게시판 구조 대응
          const selectors = [
            '.board-list tbody tr',
            'table.board_list tr',
            '.notice-list .item',
            '.list-group-item',
          ];

          for (const selector of selectors) {
            const elements = $(selector);
            if (elements.length > 0) {
              elements.each((_, element) => {
                const program = this.parseListItem($, $(element), region);
                if (program) {
                  programs.push(program);
                }
              });

              if (programs.length > 0) {
                return programs.slice(0, 10); // 최대 10개만
              }
            }
          }
        } catch (error) {
          // 다음 menuNo 시도
          continue;
        }
      }

      // 모든 시도 실패
      log.debug(`CCEI ${region.name}: 게시판을 찾을 수 없음`);
      return [];
    } catch (error) {
      log.error(`CCEI ${region.name} 크롤링 오류`, error);
      return [];
    }
  }

  private parseListItem(
    _$: cheerio.CheerioAPI,
    $row: cheerio.Cheerio<any>,
    region: { code: string; name: string }
  ): Program | null {
    try {
      // 제목 추출
      const $titleLink = $row.find(
        'td.title a, td.subject a, a.title, .title a'
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

      const baseUrl = `https://${region.code}ccei.creativekorea.or.kr`;
      const url = href.startsWith('http') ? href : `${baseUrl}${href}`;

      // 날짜
      const dateText = $row.find('td.date, .date').text().trim();

      // 카테고리
      const category = this.extractCategory(title);

      return {
        id: `ccei-${region.code}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title,
        organization: `${region.name} 창조경제혁신센터`,
        category,
        target: '지역 창업자 및 중소기업',
        deadline:
          this.parseDeadline(title, dateText) ||
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        startDate: new Date().toISOString(),
        source: 'ccei',
        url,
        memo: `${region.name}CCEI | 등록: ${dateText}`,
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

    const excludeKeywords = ['채용', '구인', '입사'];

    const hasRelevant = relevantKeywords.some((kw) => lowerTitle.includes(kw));
    const hasExclude = excludeKeywords.some((kw) => lowerTitle.includes(kw));

    return hasRelevant && !hasExclude;
  }

  private parseDeadline(title: string, _dateText: string): string | null {
    // 제목에서 마감일 패턴
    const patterns = [
      /(\d{4})[.-](\d{1,2})[.-](\d{1,2})/,
      /(\d{1,2})월\s*(\d{1,2})일/,
      /~\s*(\d{1,2})[./](\d{1,2})/,
    ];

    for (const pattern of patterns) {
      const match = title.match(pattern);
      if (match) {
        try {
          if (match[1]?.length === 4 && match[2] && match[3]) {
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

    return null;
  }

  private extractCategory(title: string): string {
    if (/AI|인공지능/.test(title)) return 'AI/SW';
    if (/예비창업/.test(title)) return '예비창업';
    if (/초기창업/.test(title)) return '초기창업';
    if (/청년|대학생/.test(title)) return '청년창업';
    return '지역창업지원';
  }
}

export const cceiUniversalCrawler = new CceiUniversalCrawler();

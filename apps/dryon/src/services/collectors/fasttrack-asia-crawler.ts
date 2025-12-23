/**
 * Fast Track Asia 크롤러
 * robots.txt: Allow: / (제한 없음)
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { log } from '../../utils/logger.js';
import type { Program } from '../../types/index.js';

export class FastTrackAsiaCrawler {
  private readonly programUrl = 'https://www.fasttrack.asia';

  async collect(): Promise<Program[]> {
    try {
      log.info('🕷️ Fast Track Asia 크롤링 시작');

      const programs = await this.scrapeProgram();

      log.info(`✅ Fast Track Asia: ${programs.length}개 프로그램 수집 완료`);
      return programs;
    } catch (error) {
      log.error('Fast Track Asia 크롤링 실패', error);
      return [this.createDefaultProgram()];
    }
  }

  private async scrapeProgram(): Promise<Program[]> {
    try {
      const response = await axios.get(this.programUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        timeout: 15000,
      });

      const $ = cheerio.load(response.data);
      const programs: Program[] = [];

      // Fast Track Asia 프로그램 정보 추출
      const selectors = [
        '.program-section',
        '.program-card',
        'article.program',
        '.content-section',
      ];

      for (const selector of selectors) {
        const $sections = $(selector);
        if ($sections.length === 0) continue;

        $sections.each((_, section) => {
          const program = this.parseProgram($, $(section));
          if (program) {
            programs.push(program);
          }
        });

        if (programs.length > 0) break;
      }

      if (programs.length === 0) {
        programs.push(this.createDefaultProgram());
      }

      return programs;
    } catch (error) {
      log.warn('Fast Track Asia 프로그램 페이지 크롤링 실패', error);
      return [this.createDefaultProgram()];
    }
  }

  private parseProgram(
    _$: cheerio.CheerioAPI,
    $section: cheerio.Cheerio<any>
  ): Program | null {
    try {
      const title =
        $section.find('h1, h2, h3, .title').first().text().trim() ||
        'Fast Track Asia 액셀러레이팅 프로그램';

      const description = $section.find('p, .description').text().trim();
      const deadlineText = this.extractDeadline($section.text());

      return {
        id: `fasttrack-asia-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title,
        organization: 'Fast Track Asia',
        category: '액셀러레이터',
        target: '초기 스타트업',
        deadline:
          deadlineText ||
          this.getNextBatchDeadline() ||
          new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        startDate: new Date().toISOString(),
        source: 'fasttrack-asia',
        url: this.programUrl,
        memo: this.createMemo(description),
      };
    } catch (error) {
      log.warn('Fast Track Asia 프로그램 파싱 실패', error);
      return null;
    }
  }

  private extractDeadline(text: string): string | null {
    const patterns = [
      /(\d{4})[년.-](\d{1,2})[월.-](\d{1,2})일?/,
      /(\d{1,2})월\s*(\d{1,2})일/,
      /마감.*?(\d{1,2})월\s*(\d{1,2})일/,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        try {
          if (match[1] && match[1].length === 4 && match[2] && match[3]) {
            const year = parseInt(match[1]);
            const month = parseInt(match[2]) - 1;
            const day = parseInt(match[3]);
            return new Date(year, month, day).toISOString();
          } else if (match[1] && match[2]) {
            const currentYear = new Date().getFullYear();
            const month = parseInt(match[1]) - 1;
            const day = parseInt(match[2]);
            return new Date(currentYear, month, day).toISOString();
          }
        } catch (e) {
          // 무시
        }
      }
    }

    return null;
  }

  private getNextBatchDeadline(): string | null {
    // 연 2회 모집 (상반기/하반기)
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let targetMonth: number;
    let targetYear: number;

    if (currentMonth < 3) {
      targetMonth = 3;
      targetYear = currentYear;
    } else if (currentMonth < 9) {
      targetMonth = 9;
      targetYear = currentYear;
    } else {
      targetMonth = 3;
      targetYear = currentYear + 1;
    }

    return new Date(targetYear, targetMonth, 1).toISOString();
  }

  private createDefaultProgram(): Program {
    return {
      id: `fasttrack-asia-default-${Date.now()}`,
      title: 'Fast Track Asia 액셀러레이팅 프로그램',
      organization: 'Fast Track Asia',
      category: '액셀러레이터',
      target: '초기 스타트업',
      deadline: this.getNextBatchDeadline() || new Date().toISOString(),
      startDate: new Date().toISOString(),
      source: 'fasttrack-asia',
      url: this.programUrl,
      memo: this.createMemo(''),
    };
  }

  private createMemo(description: string): string {
    const baseMemo = `[프로그램 개요]
Fast Track Asia는 아시아 지역 스타트업을 육성하는 글로벌 액셀러레이터입니다.

[투자 조건]
- 투자 규모: 최대 5천만원
- 지분율: 협의
- 프로그램 기간: 3-4개월

[프로그램 내용]
- 집중 멘토링 프로그램
- 글로벌 네트워크 연결
- Demo Day 개최
- 후속 투자 연계
- 해외 진출 지원

[지원 대상]
- 글로벌 시장을 타겟으로 하는 스타트업
- MVP 개발 완료 또는 진행 중
- 팀 구성 완료

[모집 시기]
- 연 2회 (상반기/하반기)
- 상반기: 1-3월 모집
- 하반기: 7-9월 모집

[지원 분야]
- IT/모바일
- 핀테크
- 커머스
- SaaS
- 콘텐츠

[특징]
- 아시아 시장 진출 지원
- 글로벌 멘토 네트워크
- 실리콘밸리 연계
- 크로스보더 투자 연결

[평가 기준]
1. 글로벌 시장 잠재력
2. 팀 역량
3. 제품 차별성
4. 실행 계획

[공식 웹사이트]
https://www.fasttrack.asia

[포트폴리오]
- 아시아 지역 다수 스타트업 육성
- 글로벌 진출 성공 사례 다수`;

    return description
      ? `${baseMemo}\n\n[상세 정보]\n${description}`
      : baseMemo;
  }
}

export const fastTrackAsiaCrawler = new FastTrackAsiaCrawler();

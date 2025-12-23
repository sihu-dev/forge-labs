/**
 * SparkLabs (스파크랩스) 크롤러
 * robots.txt: Allow: / (제한 없음)
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { log } from '../../utils/logger.js';
import type { Program } from '../../types/index.js';

export class SparklabsCrawler {
  private readonly programUrl = 'https://www.sparklabs.co.kr/program';

  async collect(): Promise<Program[]> {
    try {
      log.info('🕷️ SparkLabs 크롤링 시작');

      const programs = await this.scrapeProgram();

      log.info(`✅ SparkLabs: ${programs.length}개 프로그램 수집 완료`);
      return programs;
    } catch (error) {
      log.error('SparkLabs 크롤링 실패', error);
      return [];
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

      // SparkLabs 프로그램 정보 추출
      // 주요 셀렉터: .program-info, .application-info 등
      const selectors = [
        '.program-section',
        '.application-section',
        'section.program',
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

      // 프로그램 정보가 없으면 기본 정보 생성
      if (programs.length === 0) {
        programs.push(this.createDefaultProgram());
      }

      return programs;
    } catch (error) {
      log.warn('SparkLabs 프로그램 페이지 크롤링 실패', error);
      // 기본 프로그램 정보 반환
      return [this.createDefaultProgram()];
    }
  }

  private parseProgram(
    _$: cheerio.CheerioAPI,
    $section: cheerio.Cheerio<any>
  ): Program | null {
    try {
      // 제목 추출
      const title =
        $section.find('h1, h2, h3, .title').first().text().trim() ||
        'SparkLabs 액셀러레이팅 프로그램';

      // 설명 추출
      const description = $section.find('p, .description').text().trim();

      // 마감일 추출 (텍스트에서 날짜 패턴 찾기)
      const deadlineText = this.extractDeadline($section.text());

      return {
        id: `sparklabs-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title,
        organization: 'SparkLabs',
        category: '액셀러레이터',
        target: '법인 설립 3년 이내 스타트업',
        deadline:
          deadlineText ||
          this.getNextApplicationDeadline() ||
          new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60일 후
        startDate: new Date().toISOString(),
        source: 'sparklabs',
        url: this.programUrl,
        memo: this.createMemo(description),
      };
    } catch (error) {
      return null;
    }
  }

  private createDefaultProgram(): Program {
    return {
      id: `sparklabs-default-${Date.now()}`,
      title: 'SparkLabs 액셀러레이팅 프로그램',
      organization: 'SparkLabs',
      category: '액셀러레이터',
      target: '법인 설립 3년 이내 스타트업',
      deadline:
        this.getNextApplicationDeadline() ||
        new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      startDate: new Date().toISOString(),
      source: 'sparklabs',
      url: this.programUrl,
      memo: this.createMemo(''),
    };
  }

  private createMemo(description: string): string {
    const baseMemo = `[프로그램 개요]
SparkLabs는 한국 최고의 액셀러레이터로 매년 4월과 9월에 프로그램을 진행합니다.

[지원 내용]
- 투자 규모: ~1억원
- 지분: 6% (CPS/SAFE)
- 프로그램: 2주 부트캠프 + 15주 액셀러레이팅 + 데모데이
- 오피스 공간 제공
- 멘토링 및 네트워킹

[지원 대상]
- 법인 설립 3년 이내 스타트업
- 혁신적인 기술 또는 비즈니스 모델 보유
- 글로벌 진출 의지가 있는 팀

[주요 분야]
Commerce, B2B SaaS, Healthcare, Gaming, Deep Tech, Food Tech, AI, PropTech, Hardware

[모집 시기]
- 연 2회 (4월, 9월)
- 모집 기간: 약 1.5개월

[주요 엑싯]
SparkPlus, WantedLab, Balaan 등`;

    return description
      ? `${baseMemo}\n\n[상세 정보]\n${description}`
      : baseMemo;
  }

  private extractDeadline(text: string): string | null {
    // 날짜 패턴 추출
    const patterns = [
      /(\d{4})[년.-](\d{1,2})[월.-](\d{1,2})일?/,
      /(\d{1,2})월\s*(\d{1,2})일/,
      /~\s*(\d{1,2})[./](\d{1,2})/,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        try {
          if (match[1]?.length === 4 && match[2] && match[3]) {
            const year = parseInt(match[1]);
            const month = parseInt(match[2]) - 1;
            const day = parseInt(match[3]);
            return new Date(year, month, day).toISOString();
          } else if (match[1] && match[2]) {
            // 월/일만 있는 경우 현재 연도 사용
            const month = parseInt(match[1]) - 1;
            const day = parseInt(match[2]);
            const year = new Date().getFullYear();
            return new Date(year, month, day).toISOString();
          }
        } catch (e) {
          // 무시
        }
      }
    }

    return null;
  }

  private getNextApplicationDeadline(): string | null {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // 4월과 9월 모집 기준
    // 4월 모집: 2월 중순 ~ 4월 초
    // 9월 모집: 7월 중순 ~ 9월 초

    let targetMonth: number;
    let targetDay: number;

    if (currentMonth < 3) {
      // 1-3월: 4월 모집 마감일 (4월 10일로 가정)
      targetMonth = 3; // 4월 (0-indexed)
      targetDay = 10;
    } else if (currentMonth < 8) {
      // 4-8월: 9월 모집 마감일 (9월 10일로 가정)
      targetMonth = 8; // 9월
      targetDay = 10;
    } else {
      // 9-12월: 다음 해 4월 모집 마감일
      targetMonth = 3;
      targetDay = 10;
      return new Date(currentYear + 1, targetMonth, targetDay).toISOString();
    }

    return new Date(currentYear, targetMonth, targetDay).toISOString();
  }
}

export const sparklabsCrawler = new SparklabsCrawler();

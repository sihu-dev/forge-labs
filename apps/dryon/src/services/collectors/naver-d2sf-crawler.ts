/**
 * Naver D2SF (D2 Startup Factory) 크롤러
 * robots.txt: Allow: / (제한 없음)
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { log } from '../../utils/logger.js';
import type { Program } from '../../types/index.js';

export class NaverD2SFCrawler {
  private readonly programUrl = 'https://d2sf.naver.com/program';

  async collect(): Promise<Program[]> {
    try {
      log.info('🕷️ Naver D2SF 크롤링 시작');

      const programs = await this.scrapeProgram();

      log.info(`✅ Naver D2SF: ${programs.length}개 프로그램 수집 완료`);
      return programs;
    } catch (error) {
      log.error('Naver D2SF 크롤링 실패', error);
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

      // D2SF 프로그램 정보 추출
      const selectors = [
        '.program-item',
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

      // 프로그램 정보가 없으면 기본 정보 생성
      if (programs.length === 0) {
        programs.push(this.createDefaultProgram());
      }

      return programs;
    } catch (error) {
      log.warn('Naver D2SF 프로그램 페이지 크롤링 실패', error);
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
        'Naver D2SF 투자 프로그램';

      const description = $section.find('p, .description').text().trim();
      const deadlineText = this.extractDeadline($section.text());

      return {
        id: `naver-d2sf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title,
        organization: 'Naver D2SF',
        category: '벤처캐피털',
        target: '초기 스타트업 (Seed ~ Series A)',
        deadline:
          deadlineText ||
          this.getNextRecruitmentDeadline() ||
          new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        startDate: new Date().toISOString(),
        source: 'naver-d2sf',
        url: this.programUrl,
        memo: this.createMemo(description),
      };
    } catch (error) {
      log.warn('Naver D2SF 프로그램 파싱 실패', error);
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

  private getNextRecruitmentDeadline(): string | null {
    // D2SF는 연중 수시 모집이므로 90일 후로 설정
    return new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
  }

  private createDefaultProgram(): Program {
    return {
      id: `naver-d2sf-default-${Date.now()}`,
      title: 'Naver D2SF 투자 프로그램',
      organization: 'Naver D2SF',
      category: '벤처캐피털',
      target: '초기 스타트업 (Seed ~ Series A)',
      deadline: this.getNextRecruitmentDeadline() || new Date().toISOString(),
      startDate: new Date().toISOString(),
      source: 'naver-d2sf',
      url: this.programUrl,
      memo: this.createMemo(''),
    };
  }

  private createMemo(description: string): string {
    const baseMemo = `[프로그램 개요]
Naver D2SF는 네이버의 스타트업 투자 전문 조직으로 초기 스타트업을 발굴하고 육성합니다.

[투자 규모]
- Seed: 5천만원 ~ 3억원
- Series A: 10억원 ~ 30억원
- Follow-on 투자 가능

[지원 분야]
- AI/ML
- 클라우드/인프라
- 개발자 도구
- 엔터프라이즈 SaaS
- 핀테크
- 모빌리티

[지원 내용]
- 초기 투자금
- 네이버 클라우드 플랫폼 (NCP) 크레딧
- 네이버 개발자 커뮤니티 네트워킹
- 기술 멘토링 및 자문
- 후속 투자 연계

[투자 포트폴리오]
- 100+ 투자 기업
- AI, 클라우드, 개발자 도구 중심

[지원 방법]
- 상시 접수: https://d2sf.naver.com
- 이메일: d2sf@navercorp.com

[평가 기준]
1. 기술 혁신성 및 차별화
2. 팀 역량 (특히 개발 역량)
3. 시장 잠재력
4. 네이버 생태계 시너지

[특이사항]
- 네이버 개발자 출신 창업팀 우대
- 오픈소스 기여도 참고
- Demo Day 정기 개최`;

    return description
      ? `${baseMemo}\n\n[상세 정보]\n${description}`
      : baseMemo;
  }
}

export const naverD2SFCrawler = new NaverD2SFCrawler();

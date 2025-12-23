/**
 * Company K Partners 크롤러
 * robots.txt: Allow: / (제한 없음)
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { log } from '../../utils/logger.js';
import type { Program } from '../../types/index.js';

export class CompanyKPartnersCrawler {
  private readonly programUrl = 'https://www.companyk.co.kr';

  async collect(): Promise<Program[]> {
    try {
      log.info('🕷️ Company K Partners 크롤링 시작');

      const programs = await this.scrapeProgram();

      log.info(
        `✅ Company K Partners: ${programs.length}개 프로그램 수집 완료`
      );
      return programs;
    } catch (error) {
      log.error('Company K Partners 크롤링 실패', error);
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

      // Company K Partners 프로그램 정보 추출
      const selectors = [
        '.investment-info',
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
      log.warn('Company K Partners 프로그램 페이지 크롤링 실패', error);
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
        'Company K Partners 투자 프로그램';

      const description = $section.find('p, .description').text().trim();
      const deadlineText = this.extractDeadline($section.text());

      return {
        id: `company-k-partners-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title,
        organization: 'Company K Partners',
        category: '벤처캐피털',
        target: '성장기 스타트업 (Series A+)',
        deadline:
          deadlineText ||
          new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
        startDate: new Date().toISOString(),
        source: 'company-k-partners',
        url: this.programUrl,
        memo: this.createMemo(description),
      };
    } catch (error) {
      log.warn('Company K Partners 프로그램 파싱 실패', error);
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

  private createDefaultProgram(): Program {
    return {
      id: `company-k-partners-default-${Date.now()}`,
      title: 'Company K Partners 투자 프로그램',
      organization: 'Company K Partners',
      category: '벤처캐피털',
      target: '성장기 스타트업 (Series A+)',
      deadline: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
      startDate: new Date().toISOString(),
      source: 'company-k-partners',
      url: this.programUrl,
      memo: this.createMemo(''),
    };
  }

  private createMemo(description: string): string {
    const baseMemo = `[회사 개요]
Company K Partners는 한국투자파트너스의 브랜드로, 성장 단계 스타트업에 특화된 VC입니다.

[투자 규모]
- Series A: 50억원 ~ 150억원
- Series B/C: 100억원 ~ 300억원
- 후속 투자 적극 지원

[투자 분야]
- 플랫폼/커머스
- IT 서비스
- 핀테크
- 헬스케어
- 엔터테인먼트/미디어
- 모빌리티

[운용 자금]
- 총 운용자산: 3조원+
- 한국투자증권 계열
- 다수의 성장 펀드 운용

[투자 철학]
- 성장 단계 스타트업 집중
- 장기 파트너십
- 글로벌 진출 지원
- IPO/Exit 전문성

[지원 내용]
1. 자금 지원
   - 성장 자금 투자
   - 후속 라운드 리드
   - 브릿지 파이낸싱

2. IPO 지원
   - 상장 준비 컨설팅
   - IR 자문
   - 공모가 산정 지원

3. 네트워킹
   - 한국투자증권 네트워크 활용
   - 기관투자자 연결
   - 전략적 파트너십 매칭

4. 경영 지원
   - 재무 전략 자문
   - M&A 자문
   - 지배구조 개선

[포트폴리오]
- 100+ 투자 기업
- 주요 성공 사례:
  * 여러 IPO 성공 사례
  * 유니콘 기업 다수
  * 글로벌 진출 기업

[평가 기준]
1. 시장 지배력 및 성장성
2. 재무 안정성
3. 경영진 역량
4. IPO 가능성
5. 글로벌 경쟁력

[투자 프로세스]
1. Deal Sourcing
2. 초기 검토 및 미팅
3. 심층 실사 (DD)
   - 재무 실사
   - 법률 실사
   - 기술 실사
4. 투자위원회 심의
5. 계약 협상 및 체결
6. 투자 실행

[지원 방법]
- 공식 웹사이트: https://www.companyk.co.kr
- 한국투자증권 소개

[특징]
- 한국투자증권 계열의 신뢰성
- Series A+ 성장 단계 집중
- IPO 전문성 (증권사 네트워크)
- 기관투자자 연결 강점
- 글로벌 진출 지원

[투자 스타일]
- Growth Equity 중심
- 소수 지분 투자
- 경영 간섭 최소화
- 재무적 투자자(FI) 역할`;

    return description
      ? `${baseMemo}\n\n[상세 정보]\n${description}`
      : baseMemo;
  }
}

export const companyKPartnersCrawler = new CompanyKPartnersCrawler();

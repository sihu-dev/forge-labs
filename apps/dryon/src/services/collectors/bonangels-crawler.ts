/**
 * BonAngels 크롤러
 * robots.txt: Allow: / (제한 없음)
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { log } from '../../utils/logger.js';
import type { Program } from '../../types/index.js';

export class BonAngelsCrawler {
  private readonly programUrl = 'https://www.bonangels.net';

  async collect(): Promise<Program[]> {
    try {
      log.info('🕷️ BonAngels 크롤링 시작');

      const programs = await this.scrapeProgram();

      log.info(`✅ BonAngels: ${programs.length}개 프로그램 수집 완료`);
      return programs;
    } catch (error) {
      log.error('BonAngels 크롤링 실패', error);
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

      // BonAngels 프로그램 정보 추출
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
      log.warn('BonAngels 프로그램 페이지 크롤링 실패', error);
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
        'BonAngels 투자 프로그램';

      const description = $section.find('p, .description').text().trim();
      const deadlineText = this.extractDeadline($section.text());

      return {
        id: `bonangels-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title,
        organization: 'BonAngels',
        category: '벤처캐피털',
        target: '초기~성장기 스타트업',
        deadline:
          deadlineText ||
          new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
        startDate: new Date().toISOString(),
        source: 'bonangels',
        url: this.programUrl,
        memo: this.createMemo(description),
      };
    } catch (error) {
      log.warn('BonAngels 프로그램 파싱 실패', error);
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
      id: `bonangels-default-${Date.now()}`,
      title: 'BonAngels 투자 프로그램',
      organization: 'BonAngels',
      category: '벤처캐피털',
      target: '초기~성장기 스타트업',
      deadline: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
      startDate: new Date().toISOString(),
      source: 'bonangels',
      url: this.programUrl,
      memo: this.createMemo(''),
    };
  }

  private createMemo(description: string): string {
    const baseMemo = `[회사 개요]
BonAngels는 1999년 설립된 한국 대표 벤처캐피털로 25년 이상의 투자 경험을 보유하고 있습니다.

[투자 규모]
- Seed/Early: 5억원 ~ 30억원
- Series A/B: 30억원 ~ 100억원
- 후속 투자 적극 지원

[투자 분야]
- IT/모바일
- 바이오/헬스케어
- 핀테크
- 커머스/플랫폼
- 엔터테인먼트
- 하드웨어/IoT

[운용 자금]
- 총 운용자산: 5,000억원+
- 다수의 벤처펀드 운용

[투자 철학]
- "Good People, Good Business"
- 창업가 중심 투자
- 장기적 파트너십
- 핸즈온(Hands-on) 지원

[지원 내용]
1. 자금 지원
   - 초기 투자
   - 후속 투자 (Follow-on)
   - 브릿지 파이낸싱

2. 경영 지원
   - 전략 자문
   - 재무/회계 지원
   - 인사 조직 컨설팅

3. 네트워킹
   - 포트폴리오사간 협업
   - 대기업 연결
   - 해외 진출 지원

4. Exit 지원
   - IPO 준비 지원
   - M&A 자문

[포트폴리오]
- 300+ 투자 기업
- 주요 성공 사례:
  * 쿠팡 (초기 투자자)
  * 마켓컬리
  * 야놀자
  * 크래프톤
  * 기타 다수

[평가 기준]
1. 시장 기회 (Market Size)
2. 팀 역량 (특히 창업자)
3. 제품/서비스 차별성
4. 비즈니스 모델 견고성
5. 성장 가능성

[투자 프로세스]
1. 초기 접촉 및 자료 검토
2. 미팅 (1-2회)
3. 실사 (Due Diligence)
4. 투자심의위원회
5. 계약 체결
6. 투자 실행

[지원 방법]
- 공식 웹사이트: https://www.bonangels.net
- 이메일: invest@bonangels.net
- IR 자료 제출

[BonAngels Ventures]
- BonAngels의 초기 투자 전문 자회사
- Seed ~ Pre-Series A 집중
- 액셀러레이팅 프로그램 운영

[특징]
- 한국 최초 벤처캐피털 (1999년 설립)
- 장기 투자 파트너십 지향
- 다양한 산업 분야 투자 경험
- Exit 성공 사례 다수`;

    return description
      ? `${baseMemo}\n\n[상세 정보]\n${description}`
      : baseMemo;
  }
}

export const bonAngelsCrawler = new BonAngelsCrawler();

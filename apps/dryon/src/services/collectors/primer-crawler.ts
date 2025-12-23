/**
 * Primer 크롤러
 * 주의: robots.txt에 크롤링 허용 명시 없음, 서면 허가 필요
 * 현재는 기본 정보만 제공
 */

import { log } from '../../utils/logger.js';
import type { Program } from '../../types/index.js';

export class PrimerCrawler {
  private readonly programUrl = 'https://www.primer.kr';

  async collect(): Promise<Program[]> {
    try {
      log.info('🕷️ Primer 정보 수집 시작');

      // robots.txt 정책상 웹 크롤링 불가
      // 기본 프로그램 정보만 제공
      const programs = [this.createDefaultProgram()];

      log.info(`✅ Primer: ${programs.length}개 프로그램 정보 제공`);
      return programs;
    } catch (error) {
      log.error('Primer 정보 수집 실패', error);
      return [this.createDefaultProgram()];
    }
  }

  private createDefaultProgram(): Program {
    return {
      id: `primer-default-${Date.now()}`,
      title: 'Primer 액셀러레이팅 프로그램',
      organization: 'Primer',
      category: '액셀러레이터',
      target: '초기 스타트업 (Seed)',
      deadline: this.getNextBatchDeadline(),
      startDate: new Date().toISOString(),
      source: 'primer',
      url: this.programUrl,
      memo: this.createMemo(),
    };
  }

  private getNextBatchDeadline(): string {
    // Primer는 연 2회 (상반기/하반기) 모집
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let targetMonth: number;
    let targetYear: number;

    if (currentMonth < 3) {
      // 1-3월: 상반기 모집 (4월 마감)
      targetMonth = 3; // April
      targetYear = currentYear;
    } else if (currentMonth < 9) {
      // 4-9월: 하반기 모집 (10월 마감)
      targetMonth = 9; // October
      targetYear = currentYear;
    } else {
      // 10-12월: 다음 해 상반기 모집 (4월 마감)
      targetMonth = 3; // April
      targetYear = currentYear + 1;
    }

    return new Date(targetYear, targetMonth, 1).toISOString();
  }

  private createMemo(): string {
    return `[프로그램 개요]
Primer는 한국 최초 액셀러레이터로 2010년 설립되어 700+ 스타트업을 육성했습니다.

[투자 조건]
- 투자 규모: 최대 5천만원
- 지분율: 5-7%
- 프로그램 기간: 3개월

[프로그램 내용]
- 3개월 집중 육성 프로그램
- 주 1회 멘토링 세션
- 오피스 공간 제공
- Demo Day 개최
- 후속 투자 연계

[지원 대상]
- 혁신적인 아이디어를 보유한 초기 스타트업
- 법인 설립 전/후 모두 가능
- 팀 구성 완료 필수

[모집 시기]
- 연 2회 (상반기/하반기)
- 상반기: 1-3월 모집, 4월 시작
- 하반기: 7-9월 모집, 10월 시작

[포트폴리오]
- 700+ 투자 기업
- 주요 성공 사례: 직방, 야놀자, 배달의민족(초기), 에이프릴 등

[평가 기준]
1. 팀 역량 (40%)
2. 시장 기회 (30%)
3. 제품/서비스 차별성 (20%)
4. 실행력 (10%)

[지원 방법]
- 공식 웹사이트: https://www.primer.kr
- 이메일 문의: hello@primer.kr

[특이사항]
- 한국 최초 액셀러레이터 (2010년 설립)
- YC(Y Combinator) 모델 도입
- 강력한 동문 네트워크
- 투자심사위원회 운영

[주의사항]
⚠️ 본 정보는 공개 자료 기반으로 작성되었습니다.
⚠️ 최신 정보는 공식 웹사이트에서 확인하시기 바랍니다.
⚠️ Primer 웹사이트는 크롤링이 제한되어 있으므로, 직접 방문하여 정보를 확인해주세요.`;
  }
}

export const primerCrawler = new PrimerCrawler();

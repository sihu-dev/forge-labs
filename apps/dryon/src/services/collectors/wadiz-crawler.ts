/**
 * Wadiz 크롤러
 * 주의: robots.txt에서 크롤러 차단 (Disallow: /)
 * 현재는 기본 정보만 제공
 */

import { log } from '../../utils/logger.js';
import type { Program } from '../../types/index.js';

export class WadizCrawler {
  private readonly fundingUrl = 'https://www.wadiz.kr/web/wreward/category/288';

  async collect(): Promise<Program[]> {
    try {
      log.info('🕷️ Wadiz 정보 수집 시작');

      // robots.txt 정책상 웹 크롤링 불가 (Disallow: /)
      // 기본 프로그램 정보만 제공
      const programs = [this.createDefaultProgram()];

      log.info(`✅ Wadiz: ${programs.length}개 프로그램 정보 제공`);
      return programs;
    } catch (error) {
      log.error('Wadiz 정보 수집 실패', error);
      return [this.createDefaultProgram()];
    }
  }

  private createDefaultProgram(): Program {
    return {
      id: `wadiz-default-${Date.now()}`,
      title: 'Wadiz 크라우드펀딩 플랫폼',
      organization: 'Wadiz',
      category: '크라우드펀딩',
      target: '스타트업 및 창업자',
      deadline: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      startDate: new Date().toISOString(),
      source: 'wadiz',
      url: this.fundingUrl,
      memo: this.createMemo(),
    };
  }

  private createMemo(): string {
    return `[플랫폼 개요]
Wadiz는 한국 1위 크라우드펀딩 플랫폼으로 리워드형, 투자형 펀딩을 모두 제공합니다.

[펀딩 유형]
1. 리워드형 펀딩
   - 제품/서비스 선구매 방식
   - 목표 금액 미달성 시 환불 (All-or-Nothing)
   - 또는 달성률 무관 펀딩 진행 (Keep-it-All)

2. 투자형 펀딩 (증권형)
   - 스타트업 지분 투자
   - 최소 투자금: 10만원~
   - 온라인소액투자중개업 라이선스 보유

[스타트업 활용 전략]
1. 시장 검증 (Market Validation)
   - 실제 고객 반응 확인
   - 초기 매출 확보

2. 마케팅 효과
   - 브랜드 인지도 상승
   - 언론 보도 기회

3. 투자 유치 연계
   - 투자형 펀딩으로 직접 투자 유치
   - 펀딩 성공 이력으로 VC 어필

[성공 사례]
- 누적 펀딩액: 1조원+
- 테크/가전 분야 다수 성공
- 평균 달성률: 200%+

[주요 카테고리]
- 테크/가전
- 패션/잡화
- 뷰티
- 푸드
- 디자인
- 출판

[펀딩 절차]
1. 프로젝트 기획서 제출
2. 심사 (5-7 영업일)
3. 펀딩 페이지 제작
4. 펀딩 시작 (통상 30-60일)
5. 목표 달성 시 정산
6. 리워드 제작 및 배송

[심사 기준]
1. 프로젝트 실현 가능성
2. 리워드 구성의 합리성
3. 메이커(창업자) 신뢰도
4. 스토리텔링 완성도

[수수료]
- 플랫폼 수수료: 펀딩 금액의 5-9%
- 결제 수수료: 약 3%

[공식 사이트]
- 리워드형: https://www.wadiz.kr
- 투자형: https://www.wadiz.kr/web/winvest

[지원 서비스]
- 펀딩 컨설팅
- 마케팅 지원
- 후속 판매 연계 (스토어 입점)

[주의사항]
⚠️ 본 정보는 공개 자료 기반으로 작성되었습니다.
⚠️ 최신 정보는 공식 웹사이트에서 확인하시기 바랍니다.
⚠️ Wadiz 웹사이트는 크롤러를 차단하고 있으므로, 직접 방문하여 정보를 확인해주세요.`;
  }
}

export const wadizCrawler = new WadizCrawler();

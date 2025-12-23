/**
 * Mock 수집기
 * 테스트 및 개발용 가상 데이터 생성
 * 현재 날짜 기준으로 유효한 마감일을 가진 공고만 생성
 */

import { log } from '../../utils/logger.js';
import type { Program } from '../../types/index.js';

export interface Collector {
  collect(keywords?: string[]): Promise<Program[]>;
}

/**
 * MockCollector - 미구현 수집기용
 *
 * 실제 수집 로직이 구현될 때까지 빈 배열을 반환하며,
 * 로그를 통해 Mock 사용 중임을 알립니다.
 */
export class MockCollector implements Collector {
  constructor(
    private readonly sourceName: string,
    private readonly reason: string = '구현 예정'
  ) {}

  async collect(_keywords?: string[]): Promise<Program[]> {
    log.debug(`📦 ${this.sourceName}: Mock 수집기 사용 중 (${this.reason})`);
    return [];
  }
}

/**
 * 현재 날짜 기준 유효한 마감일 생성
 * @param daysFromNow 오늘부터 N일 후
 */
function getFutureDeadline(daysFromNow: number): string {
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + daysFromNow);
  deadline.setHours(23, 59, 59, 0);
  return deadline.toISOString();
}

/**
 * TestCollector - 테스트용 실제 같은 가상 데이터 생성
 * 현재 날짜 기준으로 유효한 마감일을 가진 공고 생성
 */
export class TestCollector implements Collector {
  async collect(_keywords?: string[]): Promise<Program[]> {
    log.info(
      '🧪 TestCollector: 가상 공고 데이터 생성 중 (현재 날짜 기준 유효한 마감일)'
    );

    const today = new Date();
    const currentYear = today.getFullYear();
    const nextYear = currentYear + 1;

    const mockPrograms: Program[] = [
      {
        id: 'MOCK_001',
        title: `${currentYear}년 팁스(TIPS) 창업기업 지원계획`,
        organization: '중소벤처기업부 / 창업진흥원',
        category: '창업지원',
        target: '혁신기술 보유 초기창업기업',
        deadline: getFutureDeadline(19), // D-19
        startDate: new Date().toISOString(),
        source: 'kised',
        url: 'https://www.kised.or.kr/menu.es?mid=a10302000000',
        memo: `[사업 목적] 글로벌 시장을 겨냥한 기술력과 아이디어를 보유한 초기 창업기업 지원\n\n[지원 내용] R&D자금 최대 5억원, 창업자금 1억원, 엔젤투자매칭, 해외진출 지원\n\n[지원 대상] 기술력 있는 창업기업으로 엔젤투자사 추천 기업\n\n[평가 기준] 1. 기술혁신성 2. 글로벌 시장성 3. 팀 역량 4. 투자유치 가능성`,
      },
      {
        id: 'MOCK_002',
        title: `${nextYear}년 초격차 스타트업 프로젝트 민간검증 트랙`,
        organization: '중소벤처기업부 / 창업진흥원',
        category: 'AI/딥테크',
        target: '딥테크·혁신기술 보유 스타트업',
        deadline: getFutureDeadline(14), // D-14
        startDate: new Date().toISOString(),
        source: 'kised',
        url: 'https://www.kised.or.kr/menu.es?mid=a10302000000',
        memo: `[사업 개요] 민간 투자·협력 기반 초격차 스타트업 발굴 및 육성\n\n[지원 규모] 민간 검증을 통한 사업화 자금 지원, 투자 연계\n\n[지원 분야] AI, 빅데이터, 바이오, 로봇, 우주항공 등 딥테크 분야\n\n[우대사항] 민간 파트너 협력 의향서 보유 기업, 기존 투자유치 실적 보유`,
      },
      {
        id: 'MOCK_003',
        title: `${currentYear}년 AI바우처 지원사업`,
        organization: '과학기술정보통신부 / NIPA',
        category: 'AI/SW',
        target: 'AI 도입을 희망하는 중소·중견기업',
        deadline: getFutureDeadline(30), // D-30
        startDate: new Date().toISOString(),
        source: 'nipa',
        url: 'https://www.nipa.kr/home/2-2/15816',
        memo: `[사업 목적] AI를 적용하고자 하는 수요기업이 최적의 AI를 도입할 수 있도록 지원\n\n[지원 규모] 수요기업당 최대 3억원 (매칭 비율에 따라 차등)\n\n[지원 분야] AI 기반 플랫폼 서비스, 데이터 분석 및 예측, 컴퓨터 비전, NLP, 위치기반 AI 서비스 (LBS)\n\n[우대사항] 관광/여행 산업 AI 적용, 지역 특화 서비스`,
      },
      {
        id: 'MOCK_004',
        title: `${nextYear}년 예비창업패키지 예비창업자 모집`,
        organization: '중소벤처기업부 / 창업진흥원',
        category: '예비창업',
        target: '예비창업자 (사업자등록 전)',
        deadline: getFutureDeadline(45), // D-45
        startDate: new Date().toISOString(),
        source: 'kised',
        url: 'https://www.kised.or.kr/menu.es?mid=a10205010000',
        memo: `[사업 취지] 혁신적인 기술과 사업모델(BM)을 보유한 예비창업자를 발굴·지원\n\n[지원 규모] 사업화 자금 평균 0.5억원, 창업프로그램 등\n\n[필수 요건] 사업공고일 기준 사업자 등록 및 법인설립 등기를 하지 않은 예비창업자\n\n[신청방법] K-Startup 누리집 온라인 접수`,
      },
      {
        id: 'MOCK_005',
        title: `${nextYear}년 초기창업패키지 창업기업 모집`,
        organization: '중소벤처기업부 / 창업진흥원',
        category: '창업지원',
        target: '창업 후 3년 이내 초기창업기업',
        deadline: getFutureDeadline(45), // D-45
        startDate: new Date().toISOString(),
        source: 'K-Startup',
        url: 'https://www.kised.or.kr/menu.es?mid=a10205020000',
        memo: `[사업 목적] 유망 창업 아이템 및 기술을 보유한 초기창업기업의 사업 안정화와 성장 지원\n\n[지원 내용] 사업화 자금: 최대 1억원 (평균 0.7억원), 창업프로그램 등\n\n[지원 대상] 창업 후 3년 이내 초기창업기업\n\n[평가 기준] 기술혁신성, 사업성, 팀 역량, 사업화 가능성`,
      },
    ];

    log.info(
      `✅ TestCollector: ${mockPrograms.length}개 가상 공고 생성 완료 (마감일: 현재 기준 D+14 ~ D+45)`
    );
    return mockPrograms;
  }
}

export const testCollector = new TestCollector();

/**
 * 유니콘 패턴 분석기
 * 성공 스타트업 패턴 딥 분석 및 적용
 */

import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import type {
  MarketVariables,
  SimulationResult,
} from '../agents/business-optimizer-agent.js';

/**
 * 유니콘 기업 패턴
 */
export interface UnicornPattern {
  category: string; // 카테고리 (핀테크, 헬스케어 등)
  commonTraits: string[]; // 공통 특성
  successFactors: string[]; // 성공 요인
  timingIndicators: string[]; // 타이밍 지표
  marketConditions: string[]; // 시장 조건
}

/**
 * 패턴 매칭 결과
 */
export interface PatternMatchResult {
  matchedPatterns: UnicornPattern[];
  matchScore: number; // 0-100
  alignment: {
    category: string;
    score: number;
    reasons: string[];
  }[];
  gaps: string[]; // 부족한 부분
  actionItems: string[]; // 개선 액션
}

/**
 * 유니콘 분석기
 */
export class UnicornAnalyzer {
  private readonly client: Anthropic;

  // 실제 유니콘 기업 데이터 (한국 + 글로벌)
  private readonly unicornDatabase: UnicornPattern[] = [
    {
      category: '핀테크',
      commonTraits: [
        '기존 금융 프로세스의 디지털 혁신',
        '사용자 경험(UX) 극대화',
        '빠른 거래 처리 속도',
        '높은 보안 수준',
      ],
      successFactors: [
        '규제 당국과의 협력',
        '금융 라이센스 확보',
        '파트너십 네트워크',
        '데이터 기반 리스크 관리',
      ],
      timingIndicators: [
        '금융 규제 완화',
        '모바일 뱅킹 보급률 증가',
        '디지털 결제 시장 성장',
      ],
      marketConditions: [
        '중앙은행의 디지털 화폐 정책',
        '오픈뱅킹 API 확산',
        '금융 포용성 정책',
      ],
    },
    {
      category: 'AI/머신러닝',
      commonTraits: [
        '독자적인 알고리즘 또는 모델',
        '대규모 데이터셋 확보',
        '높은 정확도와 성능',
        '실시간 처리 능력',
      ],
      successFactors: [
        'AI 인재 확보',
        '컴퓨팅 인프라 투자',
        '산업 특화 데이터',
        '지속적인 모델 개선',
      ],
      timingIndicators: [
        'AI 칩 가격 하락',
        '클라우드 컴퓨팅 비용 감소',
        '오픈소스 AI 도구 발전',
      ],
      marketConditions: [
        'AI 정책 지원',
        '데이터 3법 개정',
        '산업별 AI 수요 증가',
      ],
    },
    {
      category: '헬스케어',
      commonTraits: [
        '임상 데이터 기반 검증',
        '의료진과의 협업',
        '환자 중심 설계',
        '규제 준수',
      ],
      successFactors: [
        '의료기기 인증 (식약처)',
        '보험 수가 등재',
        '병원 네트워크 구축',
        '임상 시험 결과',
      ],
      timingIndicators: [
        '원격의료 규제 완화',
        '디지털 헬스케어 정책',
        '고령화 사회 진입',
      ],
      marketConditions: [
        '의료 데이터 개방',
        '건강보험 재정 압박',
        'AI 의료기기 가이드라인',
      ],
    },
    {
      category: 'SaaS/B2B',
      commonTraits: [
        '구독 기반 수익 모델',
        '높은 고객 유지율 (90%+)',
        '빠른 온보딩 프로세스',
        'API 우선 설계',
      ],
      successFactors: [
        '제품 주도 성장 (PLG)',
        '강력한 고객 지원',
        '커뮤니티 구축',
        '파트너 에코시스템',
      ],
      timingIndicators: [
        '클라우드 전환 가속',
        '재택근무 확산',
        '디지털 트랜스포메이션',
      ],
      marketConditions: [
        '중소기업 IT 투자 증가',
        'No-code 도구 확산',
        'API 경제 성장',
      ],
    },
    {
      category: '이커머스/커머스테크',
      commonTraits: [
        '개인화된 추천 시스템',
        '빠른 배송 네트워크',
        '간편 결제 지원',
        '모바일 우선 경험',
      ],
      successFactors: [
        '물류 효율화',
        '판매자 생태계 구축',
        '데이터 기반 마케팅',
        '고객 락인 전략',
      ],
      timingIndicators: [
        '온라인 쇼핑 보급률 증가',
        '모바일 결제 확산',
        '소셜 커머스 성장',
      ],
      marketConditions: [
        '물류 인프라 발전',
        '결제 수수료 인하',
        '크로스보더 규제 완화',
      ],
    },
  ];

  constructor() {
    this.client = new Anthropic({
      apiKey: config.anthropic.apiKey,
    });
  }

  /**
   * 유니콘 패턴 매칭 분석
   */
  async analyzeUnicornPotential(
    businessPlan: string,
    marketVars: MarketVariables,
    simulation: SimulationResult
  ): Promise<PatternMatchResult> {
    logger.info('🦄 유니콘 패턴 분석 시작...');

    // 1. 사업 카테고리 분류
    const category = await this.classifyCategory(businessPlan);

    // 2. 관련 유니콘 패턴 필터링
    const relevantPatterns = this.unicornDatabase.filter(
      (p) => p.category === category
    );

    // 3. 패턴 매칭 점수 계산
    const matchResults = await this.calculatePatternMatch(
      businessPlan,
      relevantPatterns,
      marketVars
    );

    // 4. 격차 분석
    const gaps = await this.identifyGaps(businessPlan, relevantPatterns);

    // 5. 개선 액션 제안
    const actionItems = await this.generateActionItems(gaps, simulation);

    const overallScore =
      matchResults.reduce((sum, r) => sum + r.score, 0) /
      Math.max(matchResults.length, 1);

    logger.info('✅ 유니콘 패턴 분석 완료', {
      category,
      matchScore: overallScore.toFixed(1),
      gaps: gaps.length,
    });

    return {
      matchedPatterns: relevantPatterns,
      matchScore: overallScore,
      alignment: matchResults,
      gaps,
      actionItems,
    };
  }

  /**
   * 사업 카테고리 분류
   */
  private async classifyCategory(businessPlan: string): Promise<string> {
    const prompt = `
다음 사업 계획을 분석하여 가장 적합한 카테고리를 선택하세요.

[사업 계획]
${businessPlan}

[카테고리 옵션]
- 핀테크
- AI/머신러닝
- 헬스케어
- SaaS/B2B
- 이커머스/커머스테크

다음 JSON 형식으로 응답하세요:
{
  "category": "<선택한 카테고리>",
  "confidence": <0-1>,
  "reasoning": "분류 근거"
}`;

    const message = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    });

    const firstContent = message.content?.[0];
    const responseText =
      firstContent && firstContent.type === 'text' ? firstContent.text : '';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      logger.warn('카테고리 분류 실패, 기본값 사용');
      return 'AI/머신러닝';
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return parsed.category;
  }

  /**
   * 패턴 매칭 점수 계산
   */
  private async calculatePatternMatch(
    businessPlan: string,
    patterns: UnicornPattern[],
    marketVars: MarketVariables
  ): Promise<
    {
      category: string;
      score: number;
      reasons: string[];
    }[]
  > {
    const results: {
      category: string;
      score: number;
      reasons: string[];
    }[] = [];

    for (const pattern of patterns) {
      const prompt = `
다음 사업 계획이 유니콘 기업 패턴과 얼마나 일치하는지 평가하세요.

[사업 계획]
${businessPlan}

[시장 분석]
- 시장 규모: ${marketVars.marketSize}억원
- 경쟁 강도: ${marketVars.competitionIntensity}/10
- PMF 확률: ${(marketVars.pmfProbability * 100).toFixed(1)}%

[유니콘 패턴: ${pattern.category}]
공통 특성: ${pattern.commonTraits.join(', ')}
성공 요인: ${pattern.successFactors.join(', ')}
타이밍 지표: ${pattern.timingIndicators.join(', ')}
시장 조건: ${pattern.marketConditions.join(', ')}

다음을 평가하세요:
1. 공통 특성 일치도 (0-100)
2. 성공 요인 보유도 (0-100)
3. 타이밍 적절성 (0-100)
4. 시장 조건 부합도 (0-100)

JSON 형식으로 응답:
{
  "traitMatch": <0-100>,
  "successFactorMatch": <0-100>,
  "timingMatch": <0-100>,
  "marketConditionMatch": <0-100>,
  "overallScore": <0-100>,
  "reasons": ["이유1", "이유2", ...]
}`;

      const message = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      });

      const secondContent = message.content?.[0];
      const responseText =
        secondContent && secondContent.type === 'text'
          ? secondContent.text
          : '';
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        results.push({
          category: pattern.category,
          score: parsed.overallScore,
          reasons: parsed.reasons,
        });
      }
    }

    return results;
  }

  /**
   * 격차 분석
   */
  private async identifyGaps(
    businessPlan: string,
    patterns: UnicornPattern[]
  ): Promise<string[]> {
    const prompt = `
다음 사업 계획을 유니콘 패턴과 비교하여 부족한 부분을 찾으세요.

[사업 계획]
${businessPlan}

[유니콘 패턴 요구사항]
${patterns
  .map(
    (p) => `
[${p.category}]
- 공통 특성: ${p.commonTraits.join(', ')}
- 성공 요인: ${p.successFactors.join(', ')}
`
  )
  .join('\n')}

부족한 부분을 구체적으로 나열하세요.

JSON 형식:
{
  "gaps": [
    "격차 1",
    "격차 2",
    ...
  ]
}`;

    const message = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const thirdContent = message.content?.[0];
    const responseText =
      thirdContent && thirdContent.type === 'text' ? thirdContent.text : '';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return [];
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return parsed.gaps;
  }

  /**
   * 개선 액션 제안
   */
  private async generateActionItems(
    gaps: string[],
    simulation: SimulationResult
  ): Promise<string[]> {
    if (gaps.length === 0) {
      return ['현재 계획이 유니콘 패턴과 잘 일치합니다. 실행에 집중하세요.'];
    }

    const prompt = `
다음 격차를 해소하기 위한 구체적인 액션 아이템을 제안하세요.

[격차 분석]
${gaps.map((g, i) => `${i + 1}. ${g}`).join('\n')}

[시뮬레이션 결과]
- 성공 확률: ${(simulation.successProbability * 100).toFixed(1)}%
- 유니콘 잠재력: ${(simulation.unicornPotential * 100).toFixed(1)}%
- 리스크: ${simulation.riskLevel}
- 추천사항: ${simulation.recommendations.join('; ')}

각 격차에 대해 SMART 기준(구체적, 측정가능, 달성가능, 관련성, 시한)의 액션 아이템을 제안하세요.

JSON 형식:
{
  "actionItems": [
    "액션 1 (3개월 내)",
    "액션 2 (6개월 내)",
    ...
  ]
}`;

    const message = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const fourthContent = message.content?.[0];
    const responseText =
      fourthContent && fourthContent.type === 'text' ? fourthContent.text : '';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return ['액션 아이템 생성 실패'];
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return parsed.actionItems;
  }
}

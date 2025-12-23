/**
 * 비즈니스 최적화 에이전트
 * Monte Carlo 시뮬레이션 + Chain-of-Thought 추론으로 사업 계획 최적화
 */

import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import type { AnalyzedProgram } from '../types/index.js';

/**
 * 다차원 시장 변수
 */
export interface MarketVariables {
  marketSize: number; // 시장 규모 (억원)
  competitionIntensity: number; // 경쟁 강도 (0-10)
  technicalDifficulty: number; // 기술 난이도 (0-10)
  regulatoryRisk: number; // 규제 리스크 (0-10)
  pmfProbability: number; // Product-Market Fit 확률 (0-1)
}

/**
 * 가중치 시스템
 */
export interface WeightSystem {
  marketSize: number; // 시장 규모 가중치
  competition: number; // 경쟁 강도 가중치 (역)
  technology: number; // 기술 가중치
  regulatory: number; // 규제 가중치 (역)
  pmf: number; // PMF 가중치
}

/**
 * 시뮬레이션 결과
 */
export interface SimulationResult {
  meanScore: number; // 평균 점수
  medianScore: number; // 중앙값
  stdDeviation: number; // 표준 편차
  confidenceInterval: [number, number]; // 95% 신뢰구간
  successProbability: number; // 성공 확률 (점수 > 70)
  unicornPotential: number; // 유니콘 잠재력 (점수 > 90)
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  recommendations: string[];
}

/**
 * 최적화 제안
 */
export interface OptimizationProposal {
  originalPlan: string;
  optimizedPlan: string;
  adjustments: {
    field: string;
    before: string;
    after: string;
    reasoning: string;
  }[];
  marketVariables: MarketVariables; // 시장 변수 추가
  simulationResult: SimulationResult;
  irReport: string;
}

/**
 * 비즈니스 최적화 에이전트
 */
export class BusinessOptimizerAgent {
  private readonly client: Anthropic;
  private readonly iterations = 10000;

  constructor() {
    this.client = new Anthropic({
      apiKey: config.anthropic.apiKey,
    });
  }

  /**
   * 공고에 맞게 사업 계획 최적화
   */
  async optimizeForAnnouncement(
    announcement: AnalyzedProgram,
    currentPlan: string
  ): Promise<OptimizationProposal> {
    logger.info(`🎯 사업 계획 최적화 시작: ${announcement.title}`);

    // 1. 시장 변수 추출
    const marketVars = await this.extractMarketVariables(
      announcement,
      currentPlan
    );

    // 2. Monte Carlo 시뮬레이션 실행
    const simulationResult = await this.runMonteCarloSimulation(marketVars);

    // 3. Chain-of-Thought로 최적화 제안 생성
    const optimization = await this.generateOptimization(
      announcement,
      currentPlan,
      marketVars,
      simulationResult
    );

    // 4. IR 리포트 생성
    const irReport = await this.generateIRReport(
      announcement,
      optimization,
      simulationResult
    );

    return {
      originalPlan: currentPlan,
      optimizedPlan: optimization.optimizedPlan,
      adjustments: optimization.adjustments,
      marketVariables: marketVars, // 실제 시장 변수 포함
      simulationResult,
      irReport,
    };
  }

  /**
   * 시장 변수 추출 (Claude AI 활용)
   */
  private async extractMarketVariables(
    announcement: AnalyzedProgram,
    currentPlan: string
  ): Promise<MarketVariables> {
    logger.info('📊 시장 변수 추출 중...');

    const prompt = `
당신은 시장 분석 전문가입니다. 다음 정보를 바탕으로 핵심 시장 변수를 추출하세요.

[공고 정보]
제목: ${announcement.title}
기관: ${announcement.organization}
설명: ${announcement.url}
평가 기준: ${announcement.analysis?.keyEvaluationCriteria?.join(', ') || 'N/A'}

[현재 사업 계획]
${currentPlan}

다음 변수를 0-10 또는 0-1 스케일로 평가하고, 근거를 제시하세요:

1. marketSize (시장 규모, 억원 단위)
2. competitionIntensity (경쟁 강도, 0-10)
3. technicalDifficulty (기술 난이도, 0-10)
4. regulatoryRisk (규제 리스크, 0-10)
5. pmfProbability (Product-Market Fit 확률, 0-1)

반드시 다음 JSON 형식으로만 응답하세요:
{
  "marketSize": <숫자>,
  "competitionIntensity": <0-10>,
  "technicalDifficulty": <0-10>,
  "regulatoryRisk": <0-10>,
  "pmfProbability": <0-1>,
  "reasoning": {
    "marketSize": "근거",
    "competition": "근거",
    "technology": "근거",
    "regulatory": "근거",
    "pmf": "근거"
  }
}`;

    const message = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    });

    const firstContent = message.content?.[0];
    const responseText =
      firstContent && firstContent.type === 'text' ? firstContent.text : '';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('Failed to extract market variables');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    logger.info('✅ 시장 변수 추출 완료', {
      marketSize: parsed.marketSize,
      competition: parsed.competitionIntensity,
    });

    return {
      marketSize: parsed.marketSize,
      competitionIntensity: parsed.competitionIntensity,
      technicalDifficulty: parsed.technicalDifficulty,
      regulatoryRisk: parsed.regulatoryRisk,
      pmfProbability: parsed.pmfProbability,
    };
  }

  /**
   * Monte Carlo 시뮬레이션 실행 (10,000회)
   */
  private async runMonteCarloSimulation(
    vars: MarketVariables
  ): Promise<SimulationResult> {
    logger.info(`🎲 Monte Carlo 시뮬레이션 시작 (${this.iterations}회)...`);

    const weights: WeightSystem = {
      marketSize: 0.3,
      competition: 0.2,
      technology: 0.2,
      regulatory: 0.15,
      pmf: 0.15,
    };

    const scores: number[] = [];

    for (let i = 0; i < this.iterations; i++) {
      // 각 변수에 노이즈 추가 (정규분포)
      const noisyVars = {
        marketSize: this.addNoise(vars.marketSize, 0.2),
        competitionIntensity: this.clamp(
          this.addNoise(vars.competitionIntensity, 0.15),
          0,
          10
        ),
        technicalDifficulty: this.clamp(
          this.addNoise(vars.technicalDifficulty, 0.15),
          0,
          10
        ),
        regulatoryRisk: this.clamp(
          this.addNoise(vars.regulatoryRisk, 0.15),
          0,
          10
        ),
        pmfProbability: this.clamp(
          this.addNoise(vars.pmfProbability, 0.1),
          0,
          1
        ),
      };

      // 종합 점수 계산
      const score = this.calculateScore(noisyVars, weights);
      scores.push(score);
    }

    // 통계 계산
    const sorted = scores.sort((a, b) => a - b);
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const median = sorted[Math.floor(sorted.length / 2)] ?? mean;
    const variance =
      scores.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);

    // 95% 신뢰구간
    const ci95Low =
      sorted[Math.floor(this.iterations * 0.025)] ?? sorted[0] ?? 0;
    const ci95High =
      sorted[Math.floor(this.iterations * 0.975)] ??
      sorted[sorted.length - 1] ??
      100;

    // 성공 확률
    const successCount = scores.filter((s) => s > 70).length;
    const successProb = successCount / this.iterations;

    // 유니콘 잠재력
    const unicornCount = scores.filter((s) => s > 90).length;
    const unicornPotential = unicornCount / this.iterations;

    // 리스크 레벨
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
    if (stdDev < 5) riskLevel = 'LOW';
    else if (stdDev < 10) riskLevel = 'MEDIUM';
    else if (stdDev < 15) riskLevel = 'HIGH';
    else riskLevel = 'EXTREME';

    // 추천사항
    const recommendations = this.generateRecommendations(
      vars,
      mean,
      stdDev,
      successProb
    );

    logger.info('✅ 시뮬레이션 완료', {
      mean: mean.toFixed(2),
      stdDev: stdDev.toFixed(2),
      successProb: (successProb * 100).toFixed(1) + '%',
    });

    return {
      meanScore: mean,
      medianScore: median,
      stdDeviation: stdDev,
      confidenceInterval: [ci95Low, ci95High],
      successProbability: successProb,
      unicornPotential,
      riskLevel,
      recommendations,
    };
  }

  /**
   * 점수 계산
   */
  private calculateScore(vars: MarketVariables, weights: WeightSystem): number {
    // 시장 규모 정규화 (0-100)
    const marketScore = Math.min((vars.marketSize / 10000) * 100, 100);

    // 경쟁 강도 (낮을수록 좋음)
    const competitionScore = (10 - vars.competitionIntensity) * 10;

    // 기술 난이도 (적절한 수준이 좋음 - 너무 쉽거나 어려우면 안 됨)
    const techScore = 100 - Math.abs(vars.technicalDifficulty - 6) * 10;

    // 규제 리스크 (낮을수록 좋음)
    const regulatoryScore = (10 - vars.regulatoryRisk) * 10;

    // PMF 확률
    const pmfScore = vars.pmfProbability * 100;

    // 가중 평균
    const totalScore =
      marketScore * weights.marketSize +
      competitionScore * weights.competition +
      techScore * weights.technology +
      regulatoryScore * weights.regulatory +
      pmfScore * weights.pmf;

    return Math.max(0, Math.min(100, totalScore));
  }

  /**
   * 정규분포 노이즈 추가
   */
  private addNoise(value: number, stdDev: number): number {
    // Box-Muller 변환으로 정규분포 생성
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

    return value + z0 * stdDev * value;
  }

  /**
   * 값 제한
   */
  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * 추천사항 생성
   */
  private generateRecommendations(
    vars: MarketVariables,
    mean: number,
    stdDev: number,
    successProb: number
  ): string[] {
    const recommendations: string[] = [];

    if (vars.competitionIntensity > 7) {
      recommendations.push('경쟁 강도가 높습니다. 차별화 전략이 필수적입니다.');
    }

    if (vars.technicalDifficulty > 8) {
      recommendations.push(
        '기술 난이도가 높습니다. 단계별 개발 로드맵과 기술 파트너 확보를 권장합니다.'
      );
    }

    if (vars.regulatoryRisk > 6) {
      recommendations.push(
        '규제 리스크가 있습니다. 법률 자문 및 인허가 전략을 수립하세요.'
      );
    }

    if (vars.pmfProbability < 0.6) {
      recommendations.push(
        'Product-Market Fit 검증이 필요합니다. 사전 고객 인터뷰와 MVP 테스트를 진행하세요.'
      );
    }

    if (stdDev > 12) {
      recommendations.push(
        '불확실성이 높습니다. 리스크 관리 계획과 플랜 B를 준비하세요.'
      );
    }

    if (successProb < 0.5) {
      recommendations.push(
        '성공 확률이 낮습니다. 사업 모델을 재검토하거나 다른 기회를 고려하세요.'
      );
    }

    if (mean > 80 && successProb > 0.7) {
      recommendations.push(
        '매우 유망한 기회입니다. 적극적으로 지원을 추진하세요.'
      );
    }

    return recommendations;
  }

  /**
   * Chain-of-Thought로 최적화 제안 생성
   */
  private async generateOptimization(
    announcement: AnalyzedProgram,
    currentPlan: string,
    vars: MarketVariables,
    simulation: SimulationResult
  ): Promise<{
    optimizedPlan: string;
    adjustments: OptimizationProposal['adjustments'];
  }> {
    logger.info('🧠 Chain-of-Thought 최적화 추론 시작...');

    const prompt = `
당신은 전략 컨설턴트입니다. Chain-of-Thought 추론으로 사업 계획을 최적화하세요.

[공고 정보]
제목: ${announcement.title}
기관: ${announcement.organization}
평가 기준: ${announcement.analysis?.keyEvaluationCriteria?.join('\n- ') || 'N/A'}
추정 예산: ${announcement.analysis?.estimatedBudget || 'N/A'}

[현재 사업 계획]
${currentPlan}

[시장 분석 결과]
- 시장 규모: ${vars.marketSize}억원
- 경쟁 강도: ${vars.competitionIntensity}/10
- 기술 난이도: ${vars.technicalDifficulty}/10
- 규제 리스크: ${vars.regulatoryRisk}/10
- PMF 확률: ${(vars.pmfProbability * 100).toFixed(1)}%

[시뮬레이션 결과]
- 평균 점수: ${simulation.meanScore.toFixed(1)}
- 성공 확률: ${(simulation.successProbability * 100).toFixed(1)}%
- 유니콘 잠재력: ${(simulation.unicornPotential * 100).toFixed(1)}%
- 리스크: ${simulation.riskLevel}
- 추천사항: ${simulation.recommendations.join('; ')}

**Chain-of-Thought 추론 과정을 단계별로 수행하세요:**

1. 공고의 핵심 평가 기준 파악
2. 현재 계획의 강점과 약점 분석
3. 시장 변수와 시뮬레이션 결과 해석
4. 각 평가 기준에 대한 최적화 전략 도출
5. 구체적인 조정 사항 제안

다음 JSON 형식으로 응답하세요:
{
  "thinkingProcess": [
    "1단계: ...",
    "2단계: ...",
    "3단계: ...",
    "4단계: ...",
    "5단계: ..."
  ],
  "optimizedPlan": "최적화된 사업 계획 (마크다운)",
  "adjustments": [
    {
      "field": "조정 분야",
      "before": "현재 내용",
      "after": "개선 내용",
      "reasoning": "변경 근거"
    }
  ]
}`;

    const message = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }],
    });

    const secondContent = message.content?.[0];
    const responseText =
      secondContent && secondContent.type === 'text' ? secondContent.text : '';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('Failed to generate optimization');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    logger.info('✅ 최적화 제안 생성 완료', {
      adjustments: parsed.adjustments.length,
    });

    return {
      optimizedPlan: parsed.optimizedPlan,
      adjustments: parsed.adjustments,
    };
  }

  /**
   * IR 리포트 생성 (투자자용)
   */
  private async generateIRReport(
    announcement: AnalyzedProgram,
    optimization: {
      optimizedPlan: string;
      adjustments: OptimizationProposal['adjustments'];
    },
    simulation: SimulationResult
  ): Promise<string> {
    logger.info('📊 IR 리포트 생성 중...');

    const prompt = `
당신은 IR 전문가입니다. 다음 정보를 바탕으로 투자자용 Executive Summary를 작성하세요.

[지원 공고]
제목: ${announcement.title}
기관: ${announcement.organization}

[최적화된 사업 계획]
${optimization.optimizedPlan}

[통계적 검증 결과 (10,000회 시뮬레이션)]
- 평균 점수: ${simulation.meanScore.toFixed(1)}/100
- 중앙값: ${simulation.medianScore.toFixed(1)}/100
- 표준편차: ${simulation.stdDeviation.toFixed(2)}
- 95% 신뢰구간: [${simulation.confidenceInterval[0].toFixed(1)}, ${simulation.confidenceInterval[1].toFixed(1)}]
- 성공 확률 (70점 이상): ${(simulation.successProbability * 100).toFixed(1)}%
- 유니콘 잠재력 (90점 이상): ${(simulation.unicornPotential * 100).toFixed(1)}%
- 리스크 레벨: ${simulation.riskLevel}

[핵심 개선사항]
${optimization.adjustments.map((a) => `- ${a.field}: ${a.after}`).join('\n')}

다음 구조로 IR 리포트를 작성하세요 (마크다운):

# Executive Summary

## 1. 사업 개요
(핵심 가치 제안 및 시장 기회)

## 2. 통계적 검증 결과
(Monte Carlo 시뮬레이션 결과 해석)

## 3. 성공 요인 분석
(강점 및 차별화 포인트)

## 4. 리스크 관리
(주요 리스크 및 완화 전략)

## 5. 재무 전망
(예상 시장 규모 및 매출 가능성)

## 6. 투자 하이라이트
(Why Now? Why Us?)

## 7. Next Steps
(실행 계획 및 마일스톤)
`;

    const message = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 6000,
      messages: [{ role: 'user', content: prompt }],
    });

    const thirdContent = message.content?.[0];
    const irReport =
      thirdContent && thirdContent.type === 'text' ? thirdContent.text : '';

    logger.info('✅ IR 리포트 생성 완료');

    return irReport;
  }
}

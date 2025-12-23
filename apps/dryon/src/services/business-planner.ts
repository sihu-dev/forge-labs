/**
 * 비즈니스 플래너 통합 서비스
 * 최적화 에이전트 + 유니콘 분석기 통합
 */

import { logger } from '../utils/logger.js';
import { BusinessOptimizerAgent } from '../agents/business-optimizer-agent.js';
import { UnicornAnalyzer } from './unicorn-analyzer.js';
import type { AnalyzedProgram } from '../types/index.js';
import type {
  MarketVariables,
  OptimizationProposal,
  SimulationResult,
} from '../agents/business-optimizer-agent.js';
import type { PatternMatchResult } from './unicorn-analyzer.js';

/**
 * 완전한 비즈니스 계획 패키지
 */
export interface ComprehensiveBusinessPlan {
  // 기본 정보
  announcement: AnalyzedProgram;
  originalPlan: string;

  // 최적화 결과
  optimization: OptimizationProposal;

  // 유니콘 분석
  unicornAnalysis: PatternMatchResult;

  // 최종 추천
  finalRecommendation: {
    shouldApply: boolean;
    confidence: number; // 0-100
    priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    reasoning: string[];
    risks: string[];
    nextSteps: string[];
  };

  // 메타데이터
  generatedAt: Date;
  processingTime: number; // milliseconds
}

/**
 * 비즈니스 플래너
 */
export class BusinessPlanner {
  private readonly optimizer: BusinessOptimizerAgent;
  private readonly unicornAnalyzer: UnicornAnalyzer;

  constructor() {
    this.optimizer = new BusinessOptimizerAgent();
    this.unicornAnalyzer = new UnicornAnalyzer();
  }

  /**
   * 종합 비즈니스 계획 생성
   */
  async createComprehensivePlan(
    announcement: AnalyzedProgram,
    currentBusinessPlan: string
  ): Promise<ComprehensiveBusinessPlan> {
    const startTime = Date.now();

    logger.info(`🚀 종합 비즈니스 계획 생성 시작: ${announcement.title}`);

    try {
      // 1. 사업 계획 최적화 (Monte Carlo + Chain-of-Thought)
      logger.info('1️⃣ 사업 계획 최적화 중...');
      const optimization = await this.optimizer.optimizeForAnnouncement(
        announcement,
        currentBusinessPlan
      );

      // 2. 유니콘 패턴 분석
      logger.info('2️⃣ 유니콘 패턴 분석 중...');
      const unicornAnalysis =
        await this.unicornAnalyzer.analyzeUnicornPotential(
          optimization.optimizedPlan,
          await this.extractMarketVars(optimization),
          optimization.simulationResult
        );

      // 3. 최종 추천 생성
      logger.info('3️⃣ 최종 추천 생성 중...');
      const finalRecommendation = this.generateFinalRecommendation(
        announcement,
        optimization.simulationResult,
        unicornAnalysis
      );

      const processingTime = Date.now() - startTime;

      logger.info(
        `✅ 종합 계획 생성 완료 (${(processingTime / 1000).toFixed(1)}초)`,
        {
          shouldApply: finalRecommendation.shouldApply,
          confidence: finalRecommendation.confidence,
          priority: finalRecommendation.priority,
        }
      );

      return {
        announcement,
        originalPlan: currentBusinessPlan,
        optimization,
        unicornAnalysis,
        finalRecommendation,
        generatedAt: new Date(),
        processingTime,
      };
    } catch (error) {
      logger.error('비즈니스 계획 생성 실패', error);
      throw error;
    }
  }

  /**
   * 시장 변수 추출 (OptimizationProposal에서)
   */
  private async extractMarketVars(
    optimization: OptimizationProposal
  ): Promise<MarketVariables> {
    // BusinessOptimizerAgent에서 추출한 실제 시장 변수 사용
    return optimization.marketVariables;
  }

  /**
   * 최종 추천 생성
   */
  private generateFinalRecommendation(
    announcement: AnalyzedProgram,
    simulation: SimulationResult,
    unicorn: PatternMatchResult
  ): ComprehensiveBusinessPlan['finalRecommendation'] {
    // 지원 여부 결정 로직
    const shouldApply = this.decideShouldApply(simulation, unicorn);

    // 신뢰도 계산 (시뮬레이션 + 유니콘 매칭)
    const confidence = this.calculateConfidence(simulation, unicorn);

    // 우선순위 결정
    const priority = this.decidePriority(simulation, unicorn, confidence);

    // 추천 근거
    const reasoning = this.buildReasoning(
      announcement,
      simulation,
      unicorn,
      shouldApply
    );

    // 리스크 정리
    const risks = this.summarizeRisks(simulation, unicorn);

    // 다음 단계
    const nextSteps = this.defineNextSteps(shouldApply, simulation, unicorn);

    return {
      shouldApply,
      confidence,
      priority,
      reasoning,
      risks,
      nextSteps,
    };
  }

  /**
   * 지원 여부 결정
   */
  private decideShouldApply(
    simulation: SimulationResult,
    unicorn: PatternMatchResult
  ): boolean {
    // 기준:
    // 1. 성공 확률 > 50%
    // 2. 평균 점수 > 60
    // 3. 유니콘 매칭 점수 > 50
    // 4. 리스크 < EXTREME

    return (
      simulation.successProbability > 0.5 &&
      simulation.meanScore > 60 &&
      unicorn.matchScore > 50 &&
      simulation.riskLevel !== 'EXTREME'
    );
  }

  /**
   * 신뢰도 계산
   */
  private calculateConfidence(
    simulation: SimulationResult,
    unicorn: PatternMatchResult
  ): number {
    // 가중 평균
    const simWeight = 0.6;
    const unicornWeight = 0.4;

    const simConfidence = simulation.successProbability * 100;
    const unicornConfidence = unicorn.matchScore;

    return simConfidence * simWeight + unicornConfidence * unicornWeight;
  }

  /**
   * 우선순위 결정
   */
  private decidePriority(
    simulation: SimulationResult,
    _unicorn: PatternMatchResult,
    confidence: number
  ): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
    // CRITICAL: 유니콘 잠재력 높고, 신뢰도 85% 이상
    if (simulation.unicornPotential > 0.2 && confidence > 85) {
      return 'CRITICAL';
    }

    // HIGH: 성공 확률 70% 이상, 신뢰도 75% 이상
    if (simulation.successProbability > 0.7 && confidence > 75) {
      return 'HIGH';
    }

    // MEDIUM: 성공 확률 50% 이상
    if (simulation.successProbability > 0.5) {
      return 'MEDIUM';
    }

    return 'LOW';
  }

  /**
   * 추천 근거 생성
   */
  private buildReasoning(
    announcement: AnalyzedProgram,
    simulation: SimulationResult,
    unicorn: PatternMatchResult,
    shouldApply: boolean
  ): string[] {
    const reasons: string[] = [];

    if (shouldApply) {
      reasons.push(
        `✅ 지원 강력 추천 - 통계적으로 ${(simulation.successProbability * 100).toFixed(1)}% 성공 확률`
      );

      if (simulation.meanScore > 80) {
        reasons.push(
          `💎 매우 높은 적합도 - 평균 점수 ${simulation.meanScore.toFixed(1)}/100`
        );
      }

      if (simulation.unicornPotential > 0.1) {
        reasons.push(
          `🦄 유니콘 잠재력 ${(simulation.unicornPotential * 100).toFixed(1)}% - 빠른 성장 가능성`
        );
      }

      if (unicorn.matchScore > 70) {
        reasons.push(
          `📊 성공 패턴 일치 ${unicorn.matchScore.toFixed(1)}% - 검증된 전략 활용 가능`
        );
      }

      if (announcement.analysis?.estimatedBudget) {
        reasons.push(
          `💰 지원 규모: ${announcement.analysis.estimatedBudget} - ROI 기대`
        );
      }
    } else {
      reasons.push(
        `⚠️ 현 시점 지원 비추천 - 성공 확률 ${(simulation.successProbability * 100).toFixed(1)}%`
      );

      if (
        simulation.riskLevel === 'EXTREME' ||
        simulation.riskLevel === 'HIGH'
      ) {
        reasons.push(`🔴 높은 리스크 레벨: ${simulation.riskLevel}`);
      }

      if (unicorn.gaps.length > 3) {
        reasons.push(`📉 주요 격차 ${unicorn.gaps.length}개 발견 - 준비 부족`);
      }

      if (simulation.meanScore < 60) {
        reasons.push(
          `📊 낮은 적합도 - 평균 점수 ${simulation.meanScore.toFixed(1)}/100`
        );
      }
    }

    return reasons;
  }

  /**
   * 리스크 요약
   */
  private summarizeRisks(
    simulation: SimulationResult,
    unicorn: PatternMatchResult
  ): string[] {
    const risks: string[] = [];

    // 시뮬레이션 추천사항 중 리스크 추출
    for (const rec of simulation.recommendations) {
      if (
        rec.includes('리스크') ||
        rec.includes('불확실성') ||
        rec.includes('주의')
      ) {
        risks.push(rec);
      }
    }

    // 유니콘 격차를 리스크로 변환
    for (const gap of unicorn.gaps.slice(0, 3)) {
      // 상위 3개만
      risks.push(`⚠️ ${gap}`);
    }

    // 통계적 리스크
    if (simulation.stdDeviation > 10) {
      risks.push(
        `📊 높은 변동성 (표준편차 ${simulation.stdDeviation.toFixed(1)}) - 결과 예측 어려움`
      );
    }

    return risks;
  }

  /**
   * 다음 단계 정의
   */
  private defineNextSteps(
    shouldApply: boolean,
    _simulation: SimulationResult,
    unicorn: PatternMatchResult
  ): string[] {
    const steps: string[] = [];

    if (shouldApply) {
      steps.push('1️⃣ 최적화된 사업계획서 검토 및 피드백');
      steps.push('2️⃣ IR 리포트 기반 내부 의사결정 회의');
      steps.push('3️⃣ 필수 서류 준비 체크리스트 확인');
      steps.push('4️⃣ 신청 플랫폼 계정 생성 및 로그인');

      if (unicorn.actionItems.length > 0) {
        steps.push(`5️⃣ 강화 액션: ${unicorn.actionItems[0]}`);
      }

      steps.push('6️⃣ D-7일 전까지 최종 제출');
    } else {
      steps.push('1️⃣ 유니콘 격차 분석 리뷰');
      steps.push('2️⃣ 3개월 내 개선 로드맵 수립');

      for (const action of unicorn.actionItems.slice(0, 3)) {
        steps.push(`   - ${action}`);
      }

      steps.push('3️⃣ 시장 조건 모니터링 (분기별)');
      steps.push('4️⃣ 다른 유사 공고 탐색 (적합도 높은 기회 찾기)');
    }

    return steps;
  }

  /**
   * 여러 공고에 대한 우선순위 정렬
   */
  async prioritizeOpportunities(
    announcements: AnalyzedProgram[],
    currentBusinessPlan: string
  ): Promise<ComprehensiveBusinessPlan[]> {
    logger.info(`📊 ${announcements.length}개 공고 우선순위 분석 시작...`);

    const plans: ComprehensiveBusinessPlan[] = [];

    for (const announcement of announcements) {
      try {
        const plan = await this.createComprehensivePlan(
          announcement,
          currentBusinessPlan
        );
        plans.push(plan);
      } catch (error) {
        logger.error(`공고 분석 실패: ${announcement.title}`, error);
      }
    }

    // 우선순위 기준으로 정렬
    const sorted = plans.sort((a, b) => {
      const priorityOrder = {
        CRITICAL: 4,
        HIGH: 3,
        MEDIUM: 2,
        LOW: 1,
      };

      const aPriority = priorityOrder[a.finalRecommendation.priority];
      const bPriority = priorityOrder[b.finalRecommendation.priority];

      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }

      // 우선순위 같으면 신뢰도로 정렬
      return (
        b.finalRecommendation.confidence - a.finalRecommendation.confidence
      );
    });

    logger.info(`✅ 우선순위 정렬 완료`, {
      total: sorted.length,
      critical: sorted.filter(
        (p) => p.finalRecommendation.priority === 'CRITICAL'
      ).length,
      high: sorted.filter((p) => p.finalRecommendation.priority === 'HIGH')
        .length,
    });

    return sorted;
  }
}

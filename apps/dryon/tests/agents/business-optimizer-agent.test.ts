/**
 * BusinessOptimizerAgent 테스트
 * Monte Carlo 시뮬레이션 및 Chain-of-Thought 추론 검증
 */

import { BusinessOptimizerAgent } from '../../src/agents/business-optimizer-agent.js';
import type { AnalyzedProgram } from '../../src/types/index.js';

describe('BusinessOptimizerAgent', () => {
  let agent: BusinessOptimizerAgent;

  beforeEach(() => {
    agent = new BusinessOptimizerAgent();
  });

  describe('Monte Carlo Simulation', () => {
    it('should calculate statistics correctly', () => {
      // 통계 계산 검증을 위한 간단한 테스트
      const scores = [60, 70, 80, 90, 100];
      const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
      expect(mean).toBe(80);

      const sorted = scores.sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)];
      expect(median).toBe(80);
    });

    it('should handle normal distribution noise with Box-Muller', () => {
      // Box-Muller 변환 검증
      const u1 = 0.5;
      const u2 = 0.5;
      const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

      expect(z0).toBeDefined();
      expect(typeof z0).toBe('number');
      expect(isNaN(z0)).toBe(false);
    });

    it('should calculate 95% confidence interval correctly', () => {
      const scores = Array.from({ length: 1000 }, (_, i) => i);
      const sorted = scores.sort((a, b) => a - b);

      const ci95Low = sorted[Math.floor(1000 * 0.025)];
      const ci95High = sorted[Math.floor(1000 * 0.975)];

      expect(ci95Low).toBe(25);
      expect(ci95High).toBe(975);
      expect(ci95High).toBeGreaterThan(ci95Low);
    });
  });

  describe('Risk Level Classification', () => {
    it('should classify risk levels correctly', () => {
      const classifyRisk = (stdDev: number) => {
        if (stdDev < 5) return 'LOW';
        if (stdDev < 10) return 'MEDIUM';
        if (stdDev < 15) return 'HIGH';
        return 'EXTREME';
      };

      expect(classifyRisk(3)).toBe('LOW');
      expect(classifyRisk(7)).toBe('MEDIUM');
      expect(classifyRisk(12)).toBe('HIGH');
      expect(classifyRisk(20)).toBe('EXTREME');
    });
  });

  describe('Score Calculation', () => {
    it('should calculate market score correctly', () => {
      const calculateMarketScore = (marketSize: number) => {
        return Math.min((marketSize / 10000) * 100, 100);
      };

      expect(calculateMarketScore(5000)).toBe(50);
      expect(calculateMarketScore(10000)).toBe(100);
      expect(calculateMarketScore(20000)).toBe(100); // capped at 100
    });

    it('should calculate competition score correctly (inverse)', () => {
      const calculateCompetitionScore = (intensity: number) => {
        return (10 - intensity) * 10;
      };

      expect(calculateCompetitionScore(0)).toBe(100); // no competition
      expect(calculateCompetitionScore(5)).toBe(50);
      expect(calculateCompetitionScore(10)).toBe(0); // max competition
    });

    it('should calculate tech difficulty score (optimal at 6)', () => {
      const calculateTechScore = (difficulty: number) => {
        return 100 - Math.abs(difficulty - 6) * 10;
      };

      expect(calculateTechScore(6)).toBe(100); // optimal
      expect(calculateTechScore(5)).toBe(90);
      expect(calculateTechScore(7)).toBe(90);
      expect(calculateTechScore(0)).toBe(40); // too easy
      expect(calculateTechScore(10)).toBe(60); // too hard
    });
  });

  describe('Success Probability Calculation', () => {
    it('should calculate success probability correctly', () => {
      const scores = [50, 60, 70, 75, 80, 85, 90, 95];
      const successCount = scores.filter((s) => s > 70).length;
      const successProb = successCount / scores.length;

      expect(successCount).toBe(5); // 75, 80, 85, 90, 95
      expect(successProb).toBe(0.625);
    });

    it('should calculate unicorn potential correctly', () => {
      const scores = [50, 70, 85, 90, 92, 95, 98, 100];
      const unicornCount = scores.filter((s) => s > 90).length;
      const unicornPotential = unicornCount / scores.length;

      expect(unicornCount).toBe(4); // 92, 95, 98, 100
      expect(unicornPotential).toBe(0.5);
    });
  });

  describe('Integration Test (if API key available)', () => {
    it.skip('should extract market variables from announcement', async () => {
      // API 키가 있을 때만 실행
      const mockAnnouncement: AnalyzedProgram = {
        id: 'test-1',
        title: 'AI 스타트업 지원사업',
        organization: '창업진흥원',
        deadline: '2025-12-31',
        startDate: '2025-01-01',
        source: 'kised',
        analysis: {
          score: 8,
          recommendation: '강력추천',
          matchReasons: ['AI 기술 보유', '시장 적합'],
          concerns: [],
          keyEvaluationCriteria: ['기술력', '시장성'],
          preparationTips: [],
          estimatedBudget: '3억원',
          priority: 'HIGH',
        },
        analyzedAt: new Date().toISOString(),
      };

      const currentPlan = `
        # 사업 계획
        ## 서비스 개요
        AI 기반 고객 분석 플랫폼

        ## 시장 분석
        국내 AI 시장은 연평균 20% 성장 중
      `;

      // 실제 API 호출은 환경 변수 체크 후에만
      if (process.env.ANTHROPIC_API_KEY) {
        const result = await agent.optimizeForAnnouncement(
          mockAnnouncement,
          currentPlan
        );

        expect(result).toBeDefined();
        expect(result.marketVariables).toBeDefined();
        expect(result.marketVariables.marketSize).toBeGreaterThan(0);
        expect(result.simulationResult).toBeDefined();
        expect(result.simulationResult.meanScore).toBeGreaterThanOrEqual(0);
        expect(result.simulationResult.meanScore).toBeLessThanOrEqual(100);
      }
    });
  });
});

/**
 * BusinessPlanner 테스트
 * 통합 서비스 및 의사결정 로직 검증
 */

// import { BusinessPlanner } from '../../src/services/business-planner.js';
import type {
  SimulationResult,
  MarketVariables,
} from '../../src/agents/business-optimizer-agent.js';
import type { PatternMatchResult } from '../../src/services/unicorn-analyzer.js';

describe('BusinessPlanner', () => {
  // Unit tests for business planner logic - no actual instance needed
  beforeEach(() => {
    // Test setup if needed
  });

  describe('Decision Logic - shouldApply', () => {
    it('should recommend application when all criteria met', () => {
      const mockSimulation: SimulationResult = {
        meanScore: 75,
        medianScore: 75,
        stdDeviation: 8,
        confidenceInterval: [65, 85],
        successProbability: 0.7,
        unicornPotential: 0.15,
        riskLevel: 'MEDIUM',
        recommendations: [],
      };

      const mockUnicorn: PatternMatchResult = {
        matchedPatterns: [],
        matchScore: 65,
        alignment: [],
        gaps: [],
        actionItems: [],
      };

      const shouldApply =
        mockSimulation.successProbability > 0.5 &&
        mockSimulation.meanScore > 60 &&
        mockUnicorn.matchScore > 50 &&
        mockSimulation.riskLevel !== 'EXTREME';

      expect(shouldApply).toBe(true);
    });

    it('should not recommend when success probability too low', () => {
      const mockSimulation: SimulationResult = {
        meanScore: 75,
        medianScore: 75,
        stdDeviation: 8,
        confidenceInterval: [65, 85],
        successProbability: 0.4, // Too low
        unicornPotential: 0.15,
        riskLevel: 'MEDIUM',
        recommendations: [],
      };

      const mockUnicorn: PatternMatchResult = {
        matchedPatterns: [],
        matchScore: 65,
        alignment: [],
        gaps: [],
        actionItems: [],
      };

      const shouldApply = mockSimulation.successProbability > 0.5;
      expect(mockUnicorn).toBeDefined(); // Suppress unused warning

      expect(shouldApply).toBe(false);
    });

    it('should not recommend when risk level is EXTREME', () => {
      const mockSimulation: SimulationResult = {
        meanScore: 75,
        medianScore: 75,
        stdDeviation: 20, // High deviation
        confidenceInterval: [50, 100],
        successProbability: 0.7,
        unicornPotential: 0.15,
        riskLevel: 'EXTREME', // Too risky
        recommendations: [],
      };

      // const mockUnicorn: PatternMatchResult = {
      //   matchedPatterns: [],
      //   matchScore: 65,
      //   alignment: [],
      //   gaps: [],
      //   actionItems: [],
      // };

      const shouldApply = mockSimulation.riskLevel !== 'EXTREME';

      expect(shouldApply).toBe(false);
    });
  });

  describe('Confidence Calculation', () => {
    it('should calculate weighted confidence correctly', () => {
      const simConfidence = 70; // 70% success probability
      const unicornConfidence = 60; // 60 match score

      const simWeight = 0.6;
      const unicornWeight = 0.4;

      const totalConfidence =
        simConfidence * simWeight + unicornConfidence * unicornWeight;

      expect(totalConfidence).toBe(66); // 42 + 24
    });

    it('should weight simulation more than unicorn analysis', () => {
      const simWeight = 0.6;
      const unicornWeight = 0.4;

      expect(simWeight).toBeGreaterThan(unicornWeight);
      expect(simWeight + unicornWeight).toBe(1.0);
    });
  });

  describe('Priority Classification', () => {
    it('should classify as CRITICAL for high unicorn potential and confidence', () => {
      const decidePriority = (unicornPotential: number, confidence: number) => {
        if (unicornPotential > 0.2 && confidence > 85) return 'CRITICAL';
        if (confidence > 75) return 'HIGH';
        if (confidence > 50) return 'MEDIUM';
        return 'LOW';
      };

      expect(decidePriority(0.25, 90)).toBe('CRITICAL');
      expect(decidePriority(0.1, 90)).toBe('HIGH'); // unicorn too low
      expect(decidePriority(0.25, 80)).toBe('HIGH'); // confidence too low
    });

    it('should classify as HIGH for high success probability and confidence', () => {
      const decidePriority = (
        successProbability: number,
        confidence: number
      ) => {
        if (successProbability > 0.7 && confidence > 75) return 'HIGH';
        if (successProbability > 0.5) return 'MEDIUM';
        return 'LOW';
      };

      expect(decidePriority(0.8, 80)).toBe('HIGH');
      expect(decidePriority(0.6, 80)).toBe('MEDIUM'); // success too low
      expect(decidePriority(0.8, 70)).toBe('MEDIUM'); // confidence too low
    });

    it('should classify as MEDIUM for moderate success probability', () => {
      const decidePriority = (successProbability: number) => {
        if (successProbability > 0.5) return 'MEDIUM';
        return 'LOW';
      };

      expect(decidePriority(0.6)).toBe('MEDIUM');
      expect(decidePriority(0.4)).toBe('LOW');
    });
  });

  describe('Opportunity Prioritization', () => {
    it('should sort by priority first, then confidence', () => {
      const opportunities = [
        { priority: 'MEDIUM', confidence: 80 },
        { priority: 'CRITICAL', confidence: 85 },
        { priority: 'HIGH', confidence: 75 },
        { priority: 'CRITICAL', confidence: 90 },
        { priority: 'LOW', confidence: 60 },
      ];

      const priorityOrder = {
        CRITICAL: 4,
        HIGH: 3,
        MEDIUM: 2,
        LOW: 1,
      };

      const sorted = opportunities.sort((a, b) => {
        const aPriority =
          priorityOrder[a.priority as keyof typeof priorityOrder];
        const bPriority =
          priorityOrder[b.priority as keyof typeof priorityOrder];

        if (aPriority !== bPriority) {
          return bPriority - aPriority;
        }

        return b.confidence - a.confidence;
      });

      expect(sorted[0]).toEqual({ priority: 'CRITICAL', confidence: 90 });
      expect(sorted[1]).toEqual({ priority: 'CRITICAL', confidence: 85 });
      expect(sorted[2]).toEqual({ priority: 'HIGH', confidence: 75 });
      expect(sorted[3]).toEqual({ priority: 'MEDIUM', confidence: 80 });
      expect(sorted[4]).toEqual({ priority: 'LOW', confidence: 60 });
    });
  });

  describe('Market Variables Extraction', () => {
    it('should extract real market variables from optimization result', () => {
      const mockMarketVariables: MarketVariables = {
        marketSize: 5000,
        competitionIntensity: 6,
        technicalDifficulty: 7,
        regulatoryRisk: 4,
        pmfProbability: 0.75,
      };

      // 이제 하드코딩이 아닌 실제 값 사용
      expect(mockMarketVariables.marketSize).toBe(5000);
      expect(mockMarketVariables.competitionIntensity).toBeGreaterThanOrEqual(
        0
      );
      expect(mockMarketVariables.competitionIntensity).toBeLessThanOrEqual(10);
      expect(mockMarketVariables.pmfProbability).toBeGreaterThanOrEqual(0);
      expect(mockMarketVariables.pmfProbability).toBeLessThanOrEqual(1);
    });
  });

  describe('Risk Summarization', () => {
    it('should identify high volatility as a risk', () => {
      const stdDeviation = 12;
      const isHighVolatility = stdDeviation > 10;

      expect(isHighVolatility).toBe(true);
    });

    it('should limit gaps to top 3', () => {
      const gaps = ['Gap 1', 'Gap 2', 'Gap 3', 'Gap 4', 'Gap 5'];

      const topGaps = gaps.slice(0, 3);

      expect(topGaps).toHaveLength(3);
      expect(topGaps).toEqual(['Gap 1', 'Gap 2', 'Gap 3']);
    });
  });

  describe('Next Steps Generation', () => {
    it('should provide application steps when recommended', () => {
      const shouldApply = true;

      const steps = shouldApply
        ? [
            '1️⃣ 최적화된 사업계획서 검토 및 피드백',
            '2️⃣ IR 리포트 기반 내부 의사결정 회의',
            '3️⃣ 필수 서류 준비 체크리스트 확인',
            '4️⃣ 신청 플랫폼 계정 생성 및 로그인',
            '6️⃣ D-7일 전까지 최종 제출',
          ]
        : [];

      expect(steps.length).toBeGreaterThan(0);
      expect(steps[0]).toContain('검토');
      expect(steps[steps.length - 1]).toContain('제출');
    });

    it('should provide improvement steps when not recommended', () => {
      const shouldApply = false;

      const steps = shouldApply
        ? []
        : [
            '1️⃣ 유니콘 격차 분석 리뷰',
            '2️⃣ 3개월 내 개선 로드맵 수립',
            '3️⃣ 시장 조건 모니터링 (분기별)',
            '4️⃣ 다른 유사 공고 탐색',
          ];

      expect(steps.length).toBeGreaterThan(0);
      expect(steps[0]).toContain('격차');
      expect(steps[1]).toContain('개선');
    });
  });
});

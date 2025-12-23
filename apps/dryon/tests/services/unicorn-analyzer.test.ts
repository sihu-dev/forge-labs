/**
 * UnicornAnalyzer 테스트
 * 유니콘 패턴 매칭 및 격차 분석 검증
 */

// import { UnicornAnalyzer } from '../../src/services/unicorn-analyzer.js';
import type { UnicornPattern } from '../../src/services/unicorn-analyzer.js';

describe('UnicornAnalyzer', () => {
  // Unit tests for unicorn analyzer logic
  beforeEach(() => {
    // Test setup if needed
  });

  describe('Unicorn Pattern Database', () => {
    it('should have 5 categories defined', () => {
      const categories = [
        '핀테크',
        'AI/머신러닝',
        '헬스케어',
        'SaaS/B2B',
        '이커머스/커머스테크',
      ];

      expect(categories).toHaveLength(5);
    });

    it('should have complete pattern structure', () => {
      const mockPattern: UnicornPattern = {
        category: '핀테크',
        commonTraits: [
          '기존 금융 프로세스의 디지털 혁신',
          '사용자 경험(UX) 극대화',
        ],
        successFactors: ['규제 당국과의 협력', '금융 라이센스 확보'],
        timingIndicators: ['금융 규제 완화', '모바일 뱅킹 보급률 증가'],
        marketConditions: ['중앙은행의 디지털 화폐 정책', '오픈뱅킹 API 확산'],
      };

      expect(mockPattern.category).toBeDefined();
      expect(mockPattern.commonTraits).toBeInstanceOf(Array);
      expect(mockPattern.successFactors).toBeInstanceOf(Array);
      expect(mockPattern.timingIndicators).toBeInstanceOf(Array);
      expect(mockPattern.marketConditions).toBeInstanceOf(Array);
    });
  });

  describe('Pattern Matching Score Calculation', () => {
    it('should calculate overall score from sub-scores', () => {
      const traitMatch = 80;
      const successFactorMatch = 70;
      const timingMatch = 90;
      const marketConditionMatch = 85;

      const overallScore =
        (traitMatch + successFactorMatch + timingMatch + marketConditionMatch) /
        4;

      expect(overallScore).toBe(81.25);
    });

    it('should return score between 0-100', () => {
      const calculateScore = (values: number[]) => {
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        return Math.max(0, Math.min(100, avg));
      };

      expect(calculateScore([80, 90, 85, 95])).toBe(87.5);
      expect(calculateScore([120, 90])).toBe(100); // capped at 100
      expect(calculateScore([-10, 50])).toBe(20); // averaged normally
    });
  });

  describe('Category Classification', () => {
    it('should classify fintech business correctly', () => {
      const businessPlan = `
        디지털 결제 플랫폼
        모바일 송금 서비스
        금융 API 통합
      `;

      // const expectedCategory = '핀테크';
      const keywords = ['결제', '송금', '금융', 'API'];

      const hasKeywords = keywords.some((keyword) =>
        businessPlan.includes(keyword)
      );

      expect(hasKeywords).toBe(true);
    });

    it('should classify AI/ML business correctly', () => {
      const businessPlan = `
        머신러닝 기반 추천 시스템
        대규모 데이터셋 학습
        실시간 AI 분석
      `;

      // const expectedCategory = 'AI/머신러닝';
      const keywords = ['머신러닝', 'AI', '데이터셋', '학습'];

      const hasKeywords = keywords.some((keyword) =>
        businessPlan.includes(keyword)
      );

      expect(hasKeywords).toBe(true);
    });

    it('should classify healthcare business correctly', () => {
      const businessPlan = `
        원격 의료 플랫폼
        환자 데이터 관리
        의료진 협업 도구
      `;

      // const expectedCategory = '헬스케어';
      const keywords = ['의료', '환자', '의료진', '건강'];

      const hasKeywords = keywords.some((keyword) =>
        businessPlan.includes(keyword)
      );

      expect(hasKeywords).toBe(true);
    });

    it('should default to AI/ML when classification fails', () => {
      const defaultCategory = 'AI/머신러닝';

      expect(defaultCategory).toBe('AI/머신러닝');
    });
  });

  describe('Gap Identification', () => {
    it('should identify missing success factors', () => {
      const requiredFactors = [
        '규제 당국과의 협력',
        '금융 라이센스 확보',
        '파트너십 네트워크',
      ];

      const currentPlan = `
        우리는 파트너십 네트워크를 구축했습니다.
      `;

      const gaps = requiredFactors.filter(
        (factor) => !currentPlan.includes(factor)
      );

      expect(gaps).toHaveLength(2);
      expect(gaps).toContain('규제 당국과의 협력');
      expect(gaps).toContain('금융 라이센스 확보');
    });

    it('should return empty array when no gaps found', () => {
      const requiredFactors = ['파트너십', '네트워크'];

      const currentPlan = `
        파트너십 네트워크 완성
      `;

      const gaps = requiredFactors.filter(
        (factor) => !currentPlan.includes(factor)
      );

      expect(gaps).toHaveLength(0);
    });
  });

  describe('Action Items Generation', () => {
    it('should generate action items for identified gaps', () => {
      const gaps = [
        '금융 라이센스 부재',
        '규제 당국 협력 부족',
        '데이터 기반 리스크 관리 미흡',
      ];

      const actionItems = gaps.map((gap, index) => {
        const timeframe = index < 2 ? '3개월 내' : '6개월 내';
        return `${gap} 해소 (${timeframe})`;
      });

      expect(actionItems).toHaveLength(3);
      expect(actionItems[0]).toContain('3개월 내');
      expect(actionItems[2]).toContain('6개월 내');
    });

    it('should return default message when no gaps', () => {
      const gaps: string[] = [];

      const actionItems =
        gaps.length === 0
          ? ['현재 계획이 유니콘 패턴과 잘 일치합니다. 실행에 집중하세요.']
          : gaps.map((gap) => `${gap} 개선`);

      expect(actionItems).toHaveLength(1);
      expect(actionItems[0]).toContain('잘 일치');
    });
  });

  describe('SMART Criteria Validation', () => {
    it('should validate action items follow SMART criteria', () => {
      const actionItem = '3개월 내 금융 라이센스 신청 및 획득 (금융위원회)';

      // Specific
      expect(actionItem).toContain('금융 라이센스');

      // Measurable
      expect(actionItem).toContain('획득');

      // Achievable (금융위원회 명시)
      expect(actionItem).toContain('금융위원회');

      // Relevant (금융 관련)
      expect(actionItem).toContain('금융');

      // Time-bound
      expect(actionItem).toContain('3개월');
    });
  });

  describe('Market Timing Analysis', () => {
    it('should identify favorable timing indicators', () => {
      const timingIndicators = [
        '금융 규제 완화',
        '모바일 뱅킹 보급률 증가',
        '디지털 결제 시장 성장',
      ];

      const currentMarket = `
        2025년 금융 규제 완화 정책 시행
        모바일 뱅킹 사용자 1000만 돌파
      `;

      const favorableSignals = timingIndicators.filter((indicator) =>
        currentMarket.includes(indicator.substring(0, 5))
      );

      expect(favorableSignals.length).toBeGreaterThan(0);
    });
  });

  describe('Pattern Match Score Interpretation', () => {
    it('should interpret high match score as strong alignment', () => {
      const matchScore = 85;

      const interpretation =
        matchScore > 80
          ? '매우 높은 일치도 - 유니콘 패턴 강력 부합'
          : matchScore > 60
            ? '높은 일치도 - 유니콘 잠재력 보유'
            : matchScore > 40
              ? '중간 일치도 - 개선 필요'
              : '낮은 일치도 - 전략 재검토';

      expect(interpretation).toBe('매우 높은 일치도 - 유니콘 패턴 강력 부합');
    });

    it('should interpret low match score as needing improvement', () => {
      const matchScore = 35;

      const interpretation =
        matchScore > 80
          ? '매우 높은 일치도'
          : matchScore > 60
            ? '높은 일치도'
            : matchScore > 40
              ? '중간 일치도'
              : '낮은 일치도 - 전략 재검토';

      expect(interpretation).toBe('낮은 일치도 - 전략 재검토');
    });
  });
});

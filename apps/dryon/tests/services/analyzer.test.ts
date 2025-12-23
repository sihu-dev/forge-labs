import { Analyzer } from '../../src/services/analyzer';
import { Announcement } from '../../src/types';

describe('Analyzer', () => {
  let analyzer: Analyzer;

  beforeEach(() => {
    analyzer = new Analyzer();
  });

  const mockAnnouncement: Announcement = {
    id: 'test-001',
    title: '예비창업 패키지 지원사업',
    source: 'bizinfo',
    url: 'https://example.com/test',
    description: 'AI 기반 창업 지원사업입니다.',
    deadline: new Date('2025-12-31'),
    collectedAt: new Date(),
  };

  describe('analyze', () => {
    it('should return analysis result with score', async () => {
      const result = await analyzer.analyze(mockAnnouncement);

      expect(result).toHaveProperty('score');
      expect(result.score).toBeGreaterThanOrEqual(1);
      expect(result.score).toBeLessThanOrEqual(10);
    });

    it('should include reasoning', async () => {
      const result = await analyzer.analyze(mockAnnouncement);

      expect(result).toHaveProperty('reasoning');
      expect(typeof result.reasoning).toBe('string');
      expect(result.reasoning.length).toBeGreaterThan(0);
    });

    it('should extract keywords', async () => {
      const result = await analyzer.analyze(mockAnnouncement);

      expect(result).toHaveProperty('keywords');
      expect(Array.isArray(result.keywords)).toBe(true);
    });

    it('should parse evaluation criteria', async () => {
      const result = await analyzer.analyze(mockAnnouncement);

      expect(result).toHaveProperty('evaluationCriteria');
      expect(Array.isArray(result.evaluationCriteria)).toBe(true);
    });

    it('should provide strategy', async () => {
      const result = await analyzer.analyze(mockAnnouncement);

      expect(result).toHaveProperty('strategy');
      expect(typeof result.strategy).toBe('string');
    });
  });

  describe('score calculation', () => {
    it('should give higher score to relevant announcements', async () => {
      const relevant: Announcement = {
        ...mockAnnouncement,
        title: 'AI 스타트업 창업 지원사업',
        description: 'Next.js 기반 소프트웨어 개발 예비창업자 지원',
      };

      const result = await analyzer.analyze(relevant);
      expect(result.score).toBeGreaterThan(5);
    });
  });

  describe('batch analysis', () => {
    it('should analyze multiple announcements', async () => {
      const announcements: Announcement[] = [
        mockAnnouncement,
        { ...mockAnnouncement, id: 'test-002', title: '다른 지원사업' },
      ];

      const results = await analyzer.batchAnalyze(announcements);

      expect(results).toHaveLength(2);
      expect(results[0]).toHaveProperty('score');
      expect(results[1]).toHaveProperty('score');
    });
  });
});

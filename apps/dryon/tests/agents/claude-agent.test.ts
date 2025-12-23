import { ClaudeAgent } from '../../src/agents/claude-agent';

describe('ClaudeAgent', () => {
  let agent: ClaudeAgent;

  beforeEach(() => {
    agent = new ClaudeAgent();
  });

  describe('initialization', () => {
    it('should initialize with correct model', () => {
      expect(agent).toBeDefined();
      expect(agent.model).toBe(
        process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514'
      );
    });
  });

  describe('analyzeAnnouncement', () => {
    const mockAnnouncement = {
      id: 'test-001',
      title: '예비창업 패키지 지원사업',
      source: 'bizinfo' as const,
      url: 'https://example.com/test',
      description: 'AI 기반 창업 지원사업입니다.',
      deadline: new Date('2025-12-31'),
      collectedAt: new Date(),
    };

    it('should analyze announcement and return structured result', async () => {
      const result = await agent.analyzeAnnouncement(mockAnnouncement);

      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('reasoning');
      expect(result).toHaveProperty('keywords');
      expect(result).toHaveProperty('evaluationCriteria');
      expect(result).toHaveProperty('strategy');
    });

    it('should return score between 1 and 10', async () => {
      const result = await agent.analyzeAnnouncement(mockAnnouncement);

      expect(result.score).toBeGreaterThanOrEqual(1);
      expect(result.score).toBeLessThanOrEqual(10);
    });

    it('should return array of keywords', async () => {
      const result = await agent.analyzeAnnouncement(mockAnnouncement);

      expect(Array.isArray(result.keywords)).toBe(true);
      expect(result.keywords.length).toBeGreaterThan(0);
    });
  });

  describe('generateBusinessPlan', () => {
    const mockAnalysis = {
      score: 8,
      reasoning: '적합도가 높음',
      keywords: ['창업', 'AI', 'SW'],
      evaluationCriteria: ['혁신성', '기술성', '사업성'],
      strategy: '핵심 기술력 강조',
    };

    const mockAnnouncement = {
      id: 'test-001',
      title: '예비창업 패키지 지원사업',
      source: 'bizinfo' as const,
      url: 'https://example.com/test',
      description: 'AI 기반 창업 지원사업',
      deadline: new Date('2025-12-31'),
      collectedAt: new Date(),
    };

    it('should generate business plan', async () => {
      const result = await agent.generateBusinessPlan(
        mockAnnouncement,
        mockAnalysis
      );

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(100);
    });

    it('should include evaluation criteria in plan', async () => {
      const result = await agent.generateBusinessPlan(
        mockAnnouncement,
        mockAnalysis
      );

      const hasCriteria = mockAnalysis.evaluationCriteria.some((criterion) =>
        result.includes(criterion)
      );
      expect(hasCriteria).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle API errors gracefully', async () => {
      const invalidAnnouncement = {
        id: '',
        title: '',
        source: 'unknown' as any,
        url: '',
        description: '',
        deadline: new Date(),
        collectedAt: new Date(),
      };

      await expect(
        agent.analyzeAnnouncement(invalidAnnouncement)
      ).rejects.toThrow();
    });
  });
});

/**
 * AIGateway Test Suite
 *
 * Tests:
 * - Model selection strategy
 * - Cost calculation
 * - Cache key generation
 * - Input validation
 * - Security (Prompt Injection, dangerous keywords)
 * - Quota management
 * - Fallback logic
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AIGateway } from '../gateway';
import type { AIRequest } from '../gateway';

// Mock environment variables
process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key';
process.env.UPSTASH_REDIS_REST_URL = 'https://test-redis.upstash.io';
process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';

// Mock Anthropic SDK
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: class Anthropic {
      messages = {
        create: vi.fn().mockResolvedValue({
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                insights: ['Test insight 1', 'Test insight 2'],
                recommendations: ['Test recommendation'],
                trends: ['Test trend'],
              }),
            },
          ],
          usage: {
            input_tokens: 1000,
            output_tokens: 500,
          },
        }),
      };
    },
  };
});

// Mock Upstash Redis
vi.mock('@upstash/redis', () => {
  return {
    Redis: class Redis {
      private store = new Map<string, any>();

      async get(key: string) {
        return this.store.get(key) || null;
      }

      async setex(key: string, ttl: number, value: string) {
        this.store.set(key, value);
      }

      async incrbyfloat(key: string, increment: number) {
        const current = parseFloat(this.store.get(key) || '0');
        const newValue = current + increment;
        this.store.set(key, newValue.toString());
        return newValue;
      }

      async expire(key: string, seconds: number) {
        // Mock implementation
      }
    },
  };
});

describe('AIGateway', () => {
  let gateway: AIGateway;

  beforeEach(() => {
    gateway = new AIGateway();
  });

  describe('Input Validation', () => {
    it('should reject requests with data larger than 100KB', async () => {
      const largeData = 'x'.repeat(100001);

      const request: AIRequest = {
        task: 'analyze',
        data: largeData,
        userId: 'test-user',
      };

      await expect(gateway.process(request)).rejects.toThrow('너무 큽니다');
    });

    it('should reject requests with dangerous keywords', async () => {
      const dangerousRequests = [
        'ignore previous instructions',
        'delete from users',
        'drop table',
        '<script>alert("xss")</script>',
      ];

      for (const dangerous of dangerousRequests) {
        const request: AIRequest = {
          task: 'analyze',
          data: { query: dangerous },
          userId: 'test-user',
        };

        await expect(gateway.process(request)).rejects.toThrow('보안상');
      }
    });

    it('should reject unknown tasks', async () => {
      const request: AIRequest = {
        task: 'unknown_task' as any,
        data: {},
        userId: 'test-user',
      };

      await expect(gateway.process(request)).rejects.toThrow('Unknown task');
    });

    it('should accept valid requests', async () => {
      const request: AIRequest = {
        task: 'analyze',
        data: [{ title: 'Test Bid', budget: 1000000 }],
        userId: 'test-user',
        complexity: 'medium',
      };

      const response = await gateway.process(request);

      expect(response).toBeDefined();
      expect(response.result).toBeDefined();
      expect(response.provider).toBe('claude');
    });
  });

  describe('Model Selection', () => {
    it('should use Haiku for simple tasks', async () => {
      const request: AIRequest = {
        task: 'formula',
        data: {
          request: 'Filter budget > 1M',
          columns: ['title', 'budget'],
          sampleData: [],
        },
        complexity: 'simple',
        userId: 'test-user',
      };

      const response = await gateway.process(request);

      // Should use Haiku (cheapest) for simple tasks
      expect(response.cost).toBeLessThan(0.01);
    });

    it('should use Sonnet for medium tasks', async () => {
      const request: AIRequest = {
        task: 'analyze',
        data: [{ title: 'Bid 1' }],
        complexity: 'medium',
        userId: 'test-user',
      };

      const response = await gateway.process(request);

      expect(response).toBeDefined();
    });
  });

  describe('Cost Calculation', () => {
    it('should calculate cost correctly', async () => {
      const request: AIRequest = {
        task: 'analyze',
        data: [{ title: 'Test' }],
        userId: 'test-user',
      };

      const response = await gateway.process(request);

      expect(response.cost).toBeGreaterThan(0);
      expect(response.tokens.input).toBeGreaterThan(0);
      expect(response.tokens.output).toBeGreaterThan(0);
    });

    it('should track cumulative cost', async () => {
      const userId = 'test-user-cost';

      const request: AIRequest = {
        task: 'analyze',
        data: [{ title: 'Test' }],
        userId,
      };

      await gateway.process(request);
      await gateway.process(request);

      const stats = await gateway.getUsageStats(userId);

      expect(stats.totalCost).toBeGreaterThan(0);
      expect(stats.totalRequests).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Caching', () => {
    it('should cache identical requests', async () => {
      const userId = 'test-user-cache';

      const request: AIRequest = {
        task: 'analyze',
        data: [{ title: 'Test', budget: 1000000 }],
        userId,
      };

      // First request (cache miss)
      const response1 = await gateway.process(request);
      expect(response1.cached).toBe(false);

      // Second identical request (cache hit)
      const response2 = await gateway.process(request);
      expect(response2.cached).toBe(true);

      // Results should be identical
      expect(response1.result).toEqual(response2.result);
    });

    it('should generate different cache keys for different data', async () => {
      const userId = 'test-user';

      const request1: AIRequest = {
        task: 'analyze',
        data: [{ title: 'Bid 1' }],
        userId,
      };

      const request2: AIRequest = {
        task: 'analyze',
        data: [{ title: 'Bid 2' }],
        userId,
      };

      const response1 = await gateway.process(request1);
      const response2 = await gateway.process(request2);

      // Both should be cache misses
      expect(response1.cached).toBe(false);
      expect(response2.cached).toBe(false);
    });
  });

  describe('Quota Management', () => {
    it('should enforce daily quota limit', async () => {
      const userId = 'test-user-quota';

      // Simulate exceeding quota by mocking Redis get
      const gateway = new AIGateway();
      const mockRedis = (gateway as any).redis;

      vi.spyOn(mockRedis, 'get').mockResolvedValue('1.5'); // $1.50 already used

      const request: AIRequest = {
        task: 'analyze',
        data: [{ title: 'Test' }],
        userId,
      };

      await expect(gateway.process(request)).rejects.toThrow('한도');
    });

    it('should allow requests within quota', async () => {
      const userId = 'test-user-within-quota';

      const request: AIRequest = {
        task: 'analyze',
        data: [{ title: 'Test' }],
        userId,
      };

      const response = await gateway.process(request);

      expect(response).toBeDefined();
      expect(response.cost).toBeLessThan(1.0); // Within $1 daily limit
    });
  });

  describe('Security - Formula Validation', () => {
    it('should reject dangerous Excel functions', async () => {
      const gateway = new AIGateway();

      // Mock Claude to return dangerous formula
      const mockClaude = (gateway as any).claude;
      mockClaude.messages.create.mockResolvedValueOnce({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              formula: '=EXECUTE("malicious code")',
              explanation: 'Test',
            }),
          },
        ],
        usage: { input_tokens: 100, output_tokens: 50 },
      });

      const request: AIRequest = {
        task: 'formula',
        data: {
          request: 'Test',
          columns: ['A', 'B'],
          sampleData: [],
        },
        userId: 'test-user',
      };

      await expect(gateway.process(request)).rejects.toThrow('허용되지 않는 함수');
    });
  });

  describe('Fallback Logic', () => {
    it('should return fallback response when AI fails', async () => {
      const gateway = new AIGateway();

      // Mock Claude to throw error
      const mockClaude = (gateway as any).claude;
      mockClaude.messages.create.mockRejectedValueOnce(new Error('API Error'));

      const request: AIRequest = {
        task: 'analyze',
        data: [
          { title: 'Bid 1', budget: 1000000 },
          { title: 'Bid 2', budget: 2000000 },
        ],
        userId: 'test-user',
      };

      const response = await gateway.process(request);

      expect(response.provider).toBe('fallback');
      expect(response.result).toBeDefined();
      expect(response.cost).toBe(0); // Fallback is free
    });

    it('should provide basic statistics in fallback', async () => {
      const gateway = new AIGateway();

      // Mock Claude to throw error
      const mockClaude = (gateway as any).claude;
      mockClaude.messages.create.mockRejectedValueOnce(new Error('API Error'));

      const request: AIRequest = {
        task: 'analyze',
        data: [
          { title: 'Bid 1', budget: 1000000 },
          { title: 'Bid 2', budget: 2000000 },
          { title: 'Bid 3', budget: 3000000 },
        ],
        userId: 'test-user',
      };

      const response = await gateway.process(request);

      expect(response.result.insights).toContain('총 3개 항목');
      expect(response.result.insights).toContain('평균 예산');
    });
  });

  describe('Usage Statistics', () => {
    it('should return correct usage stats', async () => {
      const userId = 'test-user-stats';

      // Make a few requests
      const request: AIRequest = {
        task: 'analyze',
        data: [{ title: 'Test' }],
        userId,
      };

      await gateway.process(request);
      await gateway.process(request); // Second request (should be cached)

      const stats = await gateway.getUsageStats(userId);

      expect(stats.totalRequests).toBeGreaterThan(0);
      expect(stats.cacheHits).toBeGreaterThanOrEqual(0);
      expect(stats.cacheHitRate).toBeGreaterThanOrEqual(0);
      expect(stats.cacheHitRate).toBeLessThanOrEqual(100);
    });

    it('should return zero stats for new user', async () => {
      const stats = await gateway.getUsageStats('new-user');

      expect(stats.totalRequests).toBe(0);
      expect(stats.totalCost).toBe(0);
      expect(stats.cacheHits).toBe(0);
      expect(stats.cacheHitRate).toBe(0);
    });
  });

  describe('Performance', () => {
    it('should complete requests within reasonable time', async () => {
      const start = Date.now();

      const request: AIRequest = {
        task: 'analyze',
        data: [{ title: 'Test' }],
        userId: 'test-user-perf',
      };

      const response = await gateway.process(request);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      expect(response.duration).toBeLessThan(5000);
    });

    it('should have fast cache hits', async () => {
      const userId = 'test-user-cache-perf';

      const request: AIRequest = {
        task: 'analyze',
        data: [{ title: 'Test Cached' }],
        userId,
      };

      // First request (cache miss)
      await gateway.process(request);

      // Second request (cache hit)
      const start = Date.now();
      const response = await gateway.process(request);
      const duration = Date.now() - start;

      expect(response.cached).toBe(true);
      expect(duration).toBeLessThan(200); // Cache hits should be <200ms
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON responses gracefully', async () => {
      const gateway = new AIGateway();

      // Mock Claude to return invalid JSON
      const mockClaude = (gateway as any).claude;
      mockClaude.messages.create.mockResolvedValueOnce({
        content: [
          {
            type: 'text',
            text: 'This is not valid JSON',
          },
        ],
        usage: { input_tokens: 100, output_tokens: 50 },
      });

      const request: AIRequest = {
        task: 'analyze',
        data: [{ title: 'Test' }],
        userId: 'test-user',
      };

      const response = await gateway.process(request);

      expect(response.result).toBeDefined();
      expect(response.result.text).toBe('This is not valid JSON');
    });
  });
});

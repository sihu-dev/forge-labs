/**
 * AI API Integration Tests
 *
 * Tests all 4 AI endpoints:
 * - POST /api/v1/ai/analyze
 * - POST /api/v1/ai/formula
 * - POST /api/v1/ai/extract-bid
 * - GET /api/v1/ai/stats
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Mock authentication
vi.mock('@/lib/security/auth-middleware', () => ({
  withAuth: (handler: any) => handler,
  withRateLimit: (handler: any) => handler,
}));

// Mock environment
process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io';
process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';

describe('AI API Integration', () => {
  const mockUser = {
    id: 'test-user-123',
    email: 'test@example.com',
    role: 'user',
  };

  describe('POST /api/v1/ai/analyze', () => {
    it('should analyze bid data successfully', async () => {
      const { POST } = await import('../analyze/route');

      const request = new NextRequest('http://localhost:3010/api/v1/ai/analyze', {
        method: 'POST',
        body: JSON.stringify({
          data: [
            { title: 'Bid 1', budget: 1000000, deadline: '2025-02-01' },
            { title: 'Bid 2', budget: 2000000, deadline: '2025-02-15' },
          ],
          complexity: 'medium',
        }),
      });

      // Add user to request
      (request as any).user = mockUser;

      const response = await POST(request as any);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data).toBeDefined();
      expect(json.meta).toBeDefined();
      expect(json.meta.provider).toBeDefined();
    });

    it('should reject invalid data format', async () => {
      const { POST } = await import('../analyze/route');

      const request = new NextRequest('http://localhost:3010/api/v1/ai/analyze', {
        method: 'POST',
        body: JSON.stringify({
          data: 'invalid', // Should be array
        }),
      });

      (request as any).user = mockUser;

      const response = await POST(request as any);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('INVALID_INPUT');
    });

    it('should reject empty data', async () => {
      const { POST } = await import('../analyze/route');

      const request = new NextRequest('http://localhost:3010/api/v1/ai/analyze', {
        method: 'POST',
        body: JSON.stringify({
          data: [],
        }),
      });

      (request as any).user = mockUser;

      const response = await POST(request as any);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('EMPTY_DATA');
    });
  });

  describe('POST /api/v1/ai/formula', () => {
    it('should generate Excel formula successfully', async () => {
      const { POST } = await import('../formula/route');

      const request = new NextRequest('http://localhost:3010/api/v1/ai/formula', {
        method: 'POST',
        body: JSON.stringify({
          request: '예산 1억 이상만 필터링',
          columns: ['title', 'budget', 'deadline'],
          sampleData: [{ title: 'Test', budget: 100000000, deadline: '2025-01-31' }],
        }),
      });

      (request as any).user = mockUser;

      const response = await POST(request as any);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data).toBeDefined();
      expect(json.data.formula).toBeDefined();
      expect(json.data.explanation).toBeDefined();
    });

    it('should reject missing request', async () => {
      const { POST } = await import('../formula/route');

      const request = new NextRequest('http://localhost:3010/api/v1/ai/formula', {
        method: 'POST',
        body: JSON.stringify({
          columns: ['A', 'B'],
        }),
      });

      (request as any).user = mockUser;

      const response = await POST(request as any);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.success).toBe(false);
    });

    it('should reject request that is too long', async () => {
      const { POST } = await import('../formula/route');

      const longRequest = 'x'.repeat(501);

      const request = new NextRequest('http://localhost:3010/api/v1/ai/formula', {
        method: 'POST',
        body: JSON.stringify({
          request: longRequest,
          columns: ['A'],
        }),
      });

      (request as any).user = mockUser;

      const response = await POST(request as any);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error.code).toBe('REQUEST_TOO_LONG');
    });
  });

  describe('POST /api/v1/ai/extract-bid', () => {
    it('should extract bid info from HTML', async () => {
      const { POST } = await import('../extract-bid/route');

      const request = new NextRequest('http://localhost:3010/api/v1/ai/extract-bid', {
        method: 'POST',
        body: JSON.stringify({
          url: 'https://www.g2b.go.kr/test',
          html: '<html><body>입찰 공고...</body></html>',
        }),
      });

      (request as any).user = mockUser;

      const response = await POST(request as any);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data).toBeDefined();
      expect(json.data.source).toBe('chrome_extension');
    });

    it('should reject non-whitelisted URLs', async () => {
      const { POST } = await import('../extract-bid/route');

      const request = new NextRequest('http://localhost:3010/api/v1/ai/extract-bid', {
        method: 'POST',
        body: JSON.stringify({
          url: 'https://evil.com/phishing',
          html: '<html>...</html>',
        }),
      });

      (request as any).user = mockUser;

      const response = await POST(request as any);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error.code).toBe('INVALID_URL');
      expect(json.error.allowedDomains).toBeDefined();
    });

    it('should reject HTTP (non-HTTPS) URLs', async () => {
      const { POST } = await import('../extract-bid/route');

      const request = new NextRequest('http://localhost:3010/api/v1/ai/extract-bid', {
        method: 'POST',
        body: JSON.stringify({
          url: 'http://www.g2b.go.kr/test', // HTTP instead of HTTPS
          html: '<html>...</html>',
        }),
      });

      (request as any).user = mockUser;

      const response = await POST(request as any);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error.code).toBe('INVALID_URL');
    });

    it('should reject content larger than 50KB', async () => {
      const { POST } = await import('../extract-bid/route');

      const largeHtml = 'x'.repeat(50001);

      const request = new NextRequest('http://localhost:3010/api/v1/ai/extract-bid', {
        method: 'POST',
        body: JSON.stringify({
          url: 'https://www.g2b.go.kr/test',
          html: largeHtml,
        }),
      });

      (request as any).user = mockUser;

      const response = await POST(request as any);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error.code).toBe('CONTENT_TOO_LARGE');
    });
  });

  describe('GET /api/v1/ai/stats', () => {
    it('should return usage statistics', async () => {
      const { GET } = await import('../stats/route');

      const request = new NextRequest('http://localhost:3010/api/v1/ai/stats', {
        method: 'GET',
      });

      (request as any).user = mockUser;

      const response = await GET(request as any);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data).toBeDefined();
      expect(json.data).toHaveProperty('totalRequests');
      expect(json.data).toHaveProperty('totalCost');
      expect(json.data).toHaveProperty('cacheHits');
      expect(json.data).toHaveProperty('cacheHitRate');
    });
  });

  describe('Error Scenarios', () => {
    it('should handle quota exceeded gracefully', async () => {
      // Mock AIGateway to throw quota error
      vi.mock('@/lib/ai/gateway', () => ({
        AIGateway: class {
          async process() {
            throw new Error('일일 AI 사용 한도($1)를 초과했습니다');
          }
        },
      }));

      const { POST } = await import('../analyze/route');

      const request = new NextRequest('http://localhost:3010/api/v1/ai/analyze', {
        method: 'POST',
        body: JSON.stringify({
          data: [{ title: 'Test' }],
        }),
      });

      (request as any).user = mockUser;

      const response = await POST(request as any);
      const json = await response.json();

      expect(response.status).toBe(429);
      expect(json.error.code).toBe('QUOTA_EXCEEDED');
    });
  });
});

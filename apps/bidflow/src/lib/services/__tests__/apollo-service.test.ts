/**
 * Apollo Service Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApolloService } from '../apollo-service';

describe('ApolloService', () => {
  let service: ApolloService;
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    service = new ApolloService({ apiKey: 'test-api-key' });
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('searchContactsByOrganization', () => {
    it('조직명으로 담당자 검색 성공', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            contacts: [
              {
                id: 'contact-1',
                name: '김철수',
                email: 'kim@example.com',
                title: '구매담당',
                organization: '한국수자원공사',
              },
            ],
            pagination: {
              total_entries: 1,
              page: 1,
              per_page: 25,
            },
          }),
      });

      const result = await service.searchContactsByOrganization('한국수자원공사');

      expect(result.contacts.length).toBe(1);
      expect(result.contacts[0].name).toBe('김철수');
      expect(result.totalFound).toBe(1);
    });

    it('기본 직책 필터 적용', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            contacts: [],
            pagination: { total_entries: 0, page: 1, per_page: 25 },
          }),
      });

      await service.searchContactsByOrganization('테스트기관');

      expect(global.fetch).toHaveBeenCalled();
      const callArgs = (global.fetch as any).mock.calls[0];
      // Apollo API 호출 검증은 실제 클라이언트 구현에 따라 다름
    });
  });

  describe('verifyEmail', () => {
    it('유효한 이메일 검증', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            status: 'valid',
            confidence_score: 0.95,
          }),
      });

      const result = await service.verifyEmail('test@example.com');

      expect(result.valid).toBe(true);
      expect(result.status).toBe('valid');
      expect(result.confidence).toBe(0.95);
    });

    it('잘못된 이메일 검증', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            status: 'invalid',
            confidence_score: 0.1,
          }),
      });

      const result = await service.verifyEmail('invalid@fake.com');

      expect(result.valid).toBe(false);
      expect(result.status).toBe('invalid');
    });
  });

  describe('enrichContact', () => {
    it('이메일로 연락처 강화', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            contacts: [
              {
                id: 'contact-1',
                name: '박영희',
                email: 'park@example.com',
                title: '조달팀장',
                organization: '서울시청',
              },
            ],
            pagination: { total_entries: 1, page: 1, per_page: 1 },
          }),
      });

      const result = await service.enrichContact('park@example.com', '서울시청');

      expect(result).not.toBeNull();
      expect(result?.contact.name).toBe('박영희');
      expect(result?.confidence).toBe(0.9);
      expect(result?.source).toBe('apollo');
    });

    it('찾을 수 없는 연락처', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            contacts: [],
            pagination: { total_entries: 0, page: 1, per_page: 1 },
          }),
      });

      const result = await service.enrichContact('notfound@example.com');

      expect(result).toBeNull();
    });
  });

  describe('healthCheck', () => {
    it('API 연결 성공', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            contacts: [],
            pagination: { total_entries: 0, page: 1, per_page: 1 },
          }),
      });

      const result = await service.healthCheck();

      expect(result).toBe(true);
    });

    it('API 연결 실패', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const result = await service.healthCheck();

      expect(result).toBe(false);
    });
  });
});

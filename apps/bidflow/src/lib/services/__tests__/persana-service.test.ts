/**
 * Persana Service Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PersanaService } from '../persana-service';

describe('PersanaService', () => {
  let service: PersanaService;
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    service = new PersanaService({ apiKey: 'test-api-key' });
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('enrichPerson', () => {
    it('이메일로 사람 정보 강화', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            person: {
              fullName: '이철수',
              email: 'lee@example.com',
              title: '시설담당',
              linkedinUrl: 'https://linkedin.com/in/lee',
              experience: [
                {
                  company: '한국전력',
                  title: '시설담당',
                  current: true,
                },
              ],
              confidence: 0.9,
            },
          }),
      });

      const result = await service.enrichPerson({ email: 'lee@example.com' });

      expect(result).not.toBeNull();
      expect(result?.fullName).toBe('이철수');
      expect(result?.title).toBe('시설담당');
    });
  });

  describe('enrichCompany', () => {
    it('도메인으로 회사 정보 강화', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            company: {
              name: 'CMNTech',
              domain: 'cmntech.co.kr',
              industry: 'Manufacturing',
              employees: 50,
              funding: {
                totalRaised: 1000000000,
                lastRound: 'Series A',
                lastRoundDate: '2023-01-01',
              },
              confidence: 0.85,
            },
          }),
      });

      const result = await service.enrichCompany({ domain: 'cmntech.co.kr' });

      expect(result).not.toBeNull();
      expect(result?.name).toBe('CMNTech');
      expect(result?.employees).toBe(50);
    });
  });

  describe('enrichLead', () => {
    it('완전한 리드 강화 (사람 + 회사)', async () => {
      global.fetch = vi
        .fn()
        // First call: enrichPerson
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              person: {
                name: '김담당',
                email: 'kim@company.com',
                title: '구매팀장',
              },
            }),
        })
        // Second call: enrichCompany
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              company: {
                name: '테스트기업',
                domain: 'company.com',
                employee_count: 100,
              },
            }),
        });

      const result = await service.enrichLead({
        email: 'kim@company.com',
        name: '김담당',
        company: '테스트기업',
        domain: 'company.com',
      });

      expect(result.person).toBeDefined();
      expect(result.company).toBeDefined();
      expect(result.score).toBeGreaterThan(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('리드 스코어 계산 - 의사결정권자', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            person: {
              name: '박대표',
              email: 'park@company.com',
              title: '대표이사', // 의사결정권자 = +30점
              linkedin_url: 'https://linkedin.com/in/park', // LinkedIn = +10점
              experience: [{ company: 'Test', title: 'CEO' }], // 경력 = +10점
            },
            company: {
              employee_count: 1500, // 직원 1000명 이상 = +20점
              funding: [{ amount_raised: 5000000000 }], // 펀딩 = +20점
              industry: 'manufacturing', // 타겟 업종 = +10점
            },
          }),
      });

      const result = await service.enrichLead({
        email: 'park@company.com',
        domain: 'company.com',
      });

      // 30 + 10 + 10 + 20 + 20 + 10 = 100점
      expect(result.score).toBe(100);
    });
  });

  describe('detectBuyingSignals', () => {
    it('펀딩 시그널 탐지', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            company: {
              funding: [
                {
                  funding_type: 'Series B',
                  amount_raised: 3000000000,
                  announced_date: new Date(
                    Date.now() - 30 * 24 * 60 * 60 * 1000
                  ).toISOString(), // 한 달 전
                },
              ],
            },
          }),
      });

      const result = await service.enrichLead({ domain: 'funded-company.com' });

      const fundingSignals = result.signals.filter((s) => s.type === 'funding');
      expect(fundingSignals.length).toBeGreaterThan(0);
      expect(fundingSignals[0].strength).toBe('strong');
    });
  });
});

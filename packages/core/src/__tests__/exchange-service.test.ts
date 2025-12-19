/**
 * @forge/core - Exchange Service Tests
 * 거래소 서비스 팩토리 및 개별 서비스 테스트
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ExchangeServiceFactory, BinanceService, UpbitService } from '../services/exchange-service';
import type { HephaitosTypes } from '@forge/types';

type IExchangeCredentials = HephaitosTypes.IExchangeCredentials;

// ═══════════════════════════════════════════════════════════════
// 테스트 데이터 헬퍼
// ═══════════════════════════════════════════════════════════════

const createBinanceCredentials = (overrides: Partial<IExchangeCredentials> = {}): IExchangeCredentials => ({
  exchange: 'binance',
  api_key: 'A'.repeat(64),
  api_secret: 'B'.repeat(64),
  ...overrides,
});

const createUpbitCredentials = (overrides: Partial<IExchangeCredentials> = {}): IExchangeCredentials => ({
  exchange: 'upbit',
  api_key: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  api_secret: 'x9y8z7w6-v5u4-3210-lkji-hgfedcba9876',
  ...overrides,
});

// ═══════════════════════════════════════════════════════════════
// ExchangeServiceFactory 테스트
// ═══════════════════════════════════════════════════════════════

describe('ExchangeServiceFactory', () => {
  describe('getService', () => {
    it('Binance 서비스 생성', () => {
      const service = ExchangeServiceFactory.getService('binance');

      expect(service).toBeDefined();
      expect(service.exchange).toBe('binance');
      expect(service).toBeInstanceOf(BinanceService);
    });

    it('Upbit 서비스 생성', () => {
      const service = ExchangeServiceFactory.getService('upbit');

      expect(service).toBeDefined();
      expect(service.exchange).toBe('upbit');
      expect(service).toBeInstanceOf(UpbitService);
    });

    it('동일 거래소 재요청 시 같은 인스턴스 반환 (싱글톤)', () => {
      const service1 = ExchangeServiceFactory.getService('binance');
      const service2 = ExchangeServiceFactory.getService('binance');

      expect(service1).toBe(service2);
    });

    it('지원하지 않는 거래소는 에러', () => {
      expect(() => {
        ExchangeServiceFactory.getService('unknown' as never);
      }).toThrow('Unsupported exchange');
    });
  });

  describe('getSupportedExchanges', () => {
    it('지원 거래소 목록 반환', () => {
      const exchanges = ExchangeServiceFactory.getSupportedExchanges();

      expect(exchanges).toContain('binance');
      expect(exchanges).toContain('upbit');
      expect(exchanges.length).toBeGreaterThanOrEqual(2);
    });
  });
});

// ═══════════════════════════════════════════════════════════════
// BinanceService 테스트
// ═══════════════════════════════════════════════════════════════

describe('BinanceService', () => {
  let service: BinanceService;
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    service = new BinanceService();
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('getBalance', () => {
    it('잘못된 API 키 형식 거부', async () => {
      const invalidCredentials = createBinanceCredentials({
        api_key: 'short-key',
      });

      const result = await service.getBalance(invalidCredentials);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('API 호출 성공 시 잔고 반환', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          balances: [
            { asset: 'BTC', free: '1.5', locked: '0.5' },
            { asset: 'USDT', free: '1000', locked: '0' },
          ],
        }),
      });

      const credentials = createBinanceCredentials();
      const result = await service.getBalance(credentials);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('API 호출 실패 시 에러 반환', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      });

      const credentials = createBinanceCredentials();
      const result = await service.getBalance(credentials);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('네트워크 에러 처리', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const credentials = createBinanceCredentials();
      const result = await service.getBalance(credentials);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Network error');
    });
  });

  describe('validateCredentials', () => {
    it('유효한 자격 증명 검증', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ balances: [] }),
      });

      const credentials = createBinanceCredentials();
      const result = await service.validateCredentials(credentials);

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
    });

    it('잘못된 자격 증명 검증', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      });

      const credentials = createBinanceCredentials();
      const result = await service.validateCredentials(credentials);

      expect(result.success).toBe(false);
      expect(result.data).toBe(false);
    });
  });

  describe('getTransactions', () => {
    it('거래 내역 반환 (현재 빈 배열)', async () => {
      const credentials = createBinanceCredentials();
      const result = await service.getTransactions(credentials);

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });
  });
});

// ═══════════════════════════════════════════════════════════════
// UpbitService 테스트
// ═══════════════════════════════════════════════════════════════

describe('UpbitService', () => {
  let service: UpbitService;
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    service = new UpbitService();
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('getBalance', () => {
    it('잘못된 API 키 형식 거부 (UUID 형식 필요)', async () => {
      const invalidCredentials = createUpbitCredentials({
        api_key: 'not-a-valid-uuid',
      });

      const result = await service.getBalance(invalidCredentials);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('API 호출 성공 시 잔고 반환', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([
          { currency: 'BTC', balance: '1.5', locked: '0', avg_buy_price: '50000000' },
          { currency: 'KRW', balance: '1000000', locked: '0', avg_buy_price: '0' },
        ]),
      });

      const credentials = createUpbitCredentials();
      const result = await service.getBalance(credentials);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('API 호출 실패 시 에러 반환', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      });

      const credentials = createUpbitCredentials();
      const result = await service.getBalance(credentials);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('validateCredentials', () => {
    it('유효한 자격 증명 검증', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      });

      const credentials = createUpbitCredentials();
      const result = await service.validateCredentials(credentials);

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
    });
  });

  describe('JWT 토큰 생성', () => {
    it('올바른 JWT 형식', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      });

      const credentials = createUpbitCredentials();
      await service.getBalance(credentials);

      expect(global.fetch).toHaveBeenCalled();

      const callArgs = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      const headers = callArgs[1]?.headers as Record<string, string>;
      expect(headers?.Authorization).toMatch(/^Bearer /);
    });
  });
});

// ═══════════════════════════════════════════════════════════════
// 자격 증명 형식 테스트
// ═══════════════════════════════════════════════════════════════

describe('Credentials Format Validation', () => {
  it('Binance API 키는 64자 영숫자', async () => {
    const service = new BinanceService();

    // 64자 미만
    const shortKey = createBinanceCredentials({ api_key: 'A'.repeat(32) });
    const shortResult = await service.getBalance(shortKey);
    expect(shortResult.success).toBe(false);

    // 특수문자 포함
    const specialChar = createBinanceCredentials({ api_key: 'A'.repeat(63) + '!' });
    const specialResult = await service.getBalance(specialChar);
    expect(specialResult.success).toBe(false);
  });

  it('Upbit API 키는 UUID 형식', async () => {
    const service = new UpbitService();

    // 잘못된 UUID 형식
    const invalidUuid = createUpbitCredentials({ api_key: 'not-a-uuid' });
    const result = await service.getBalance(invalidUuid);
    expect(result.success).toBe(false);
  });

  it('빈 API 키/시크릿 거부', async () => {
    const binanceService = new BinanceService();
    const upbitService = new UpbitService();

    const emptyBinance = createBinanceCredentials({ api_key: '', api_secret: '' });
    const emptyUpbit = createUpbitCredentials({ api_key: '', api_secret: '' });

    const binanceResult = await binanceService.getBalance(emptyBinance);
    const upbitResult = await upbitService.getBalance(emptyUpbit);

    expect(binanceResult.success).toBe(false);
    expect(upbitResult.success).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════
// 메타데이터 테스트
// ═══════════════════════════════════════════════════════════════

describe('Response Metadata', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('모든 응답에 메타데이터 포함', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ balances: [] }),
    });

    const service = new BinanceService();
    const credentials = createBinanceCredentials();
    const result = await service.getBalance(credentials);

    expect(result.metadata).toBeDefined();
    expect(result.metadata?.timestamp).toBeDefined();
    expect(result.metadata?.duration_ms).toBeGreaterThanOrEqual(0);
  });

  it('에러 응답에도 메타데이터 포함', async () => {
    const service = new BinanceService();
    const invalidCredentials = createBinanceCredentials({ api_key: 'invalid' });
    const result = await service.getBalance(invalidCredentials);

    expect(result.success).toBe(false);
    expect(result.metadata).toBeDefined();
    expect(result.metadata?.timestamp).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════
// 에러 케이스 테스트
// ═══════════════════════════════════════════════════════════════

describe('Error Handling', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('타임아웃 처리', async () => {
    global.fetch = vi.fn().mockImplementation(() =>
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 100)
      )
    );

    const service = new BinanceService();
    const credentials = createBinanceCredentials();
    const result = await service.getBalance(credentials);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('JSON 파싱 에러', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.reject(new Error('Invalid JSON')),
    });

    const service = new BinanceService();
    const credentials = createBinanceCredentials();
    const result = await service.getBalance(credentials);

    expect(result.success).toBe(false);
  });

  it('Rate Limit 에러', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
    });

    const service = new BinanceService();
    const credentials = createBinanceCredentials();
    const result = await service.getBalance(credentials);

    expect(result.success).toBe(false);
    expect(result.error?.message).toContain('429');
  });
});

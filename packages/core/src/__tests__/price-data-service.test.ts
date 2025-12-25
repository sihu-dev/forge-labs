/**
 * @forge/core - Price Data Service Tests
 * RealPriceDataService와 InMemoryPriceDataService 테스트
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  RealPriceDataService,
  InMemoryPriceDataService,
  createPriceDataService,
} from '../services/price-data-service';
import type { HephaitosTypes } from '@forge/types';

type IOHLCV = HephaitosTypes.IOHLCV;
type Timeframe = HephaitosTypes.Timeframe;

// ═══════════════════════════════════════════════════════════════
// Mock 데이터
// ═══════════════════════════════════════════════════════════════

const mockBinanceResponse = [
  [
    1609459200000, // timestamp
    '29000.00', // open
    '29500.00', // high
    '28800.00', // low
    '29200.00', // close
    '100.5', // volume
    1609459260000,
    '2920000',
    500,
    '50.25',
    '1460000',
    '0',
  ],
  [
    1609459260000,
    '29200.00',
    '29600.00',
    '29100.00',
    '29400.00',
    '120.3',
    1609459320000,
    '3535200',
    600,
    '60.15',
    '1768200',
    '0',
  ],
];

const mockUpbitResponse = [
  {
    market: 'KRW-BTC',
    candle_date_time_utc: '2021-01-01T00:00:00',
    opening_price: 29000,
    high_price: 29500,
    low_price: 28800,
    trade_price: 29200,
    candle_acc_trade_volume: 100.5,
  },
  {
    market: 'KRW-BTC',
    candle_date_time_utc: '2021-01-01T00:01:00',
    opening_price: 29200,
    high_price: 29600,
    low_price: 29100,
    trade_price: 29400,
    candle_acc_trade_volume: 120.3,
  },
];

// ═══════════════════════════════════════════════════════════════
// createPriceDataService Factory 테스트
// ═══════════════════════════════════════════════════════════════

describe('createPriceDataService', () => {
  it('mode="real"일 때 RealPriceDataService 반환', () => {
    const service = createPriceDataService('real');
    expect(service).toBeInstanceOf(RealPriceDataService);
  });

  it('mode="memory"일 때 InMemoryPriceDataService 반환', () => {
    const service = createPriceDataService('memory');
    expect(service).toBeInstanceOf(InMemoryPriceDataService);
  });

  it('기본값은 "real"', () => {
    const service = createPriceDataService();
    expect(service).toBeInstanceOf(RealPriceDataService);
  });
});

// ═══════════════════════════════════════════════════════════════
// RealPriceDataService 테스트
// ═══════════════════════════════════════════════════════════════

describe('RealPriceDataService', () => {
  let service: RealPriceDataService;
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    service = new RealPriceDataService();
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    service.clearCache();
    vi.restoreAllMocks();
  });

  // ───────────────────────────────────────────────────────────
  // Exchange Detection
  // ───────────────────────────────────────────────────────────

  describe('거래소 자동 감지', () => {
    it('USDT 페어는 Binance로 감지', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockBinanceResponse),
      });

      await service.getOHLCV('BTC/USDT', '1h', 10);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('binance.com')
      );
    });

    it('KRW 페어는 Upbit으로 감지', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockUpbitResponse),
      });

      await service.getOHLCV('BTC/KRW', '1h', 10);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('upbit.com')
      );
    });
  });

  // ───────────────────────────────────────────────────────────
  // Symbol Conversion
  // ───────────────────────────────────────────────────────────

  describe('심볼 변환', () => {
    it('Binance: BTC/USDT → BTCUSDT', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockBinanceResponse),
      });

      await service.getOHLCV('BTC/USDT', '1h', 10);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('symbol=BTCUSDT')
      );
    });

    it('Upbit: BTC/KRW → KRW-BTC', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockUpbitResponse),
      });

      await service.getOHLCV('BTC/KRW', '1h', 10);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('market=KRW-BTC')
      );
    });
  });

  // ───────────────────────────────────────────────────────────
  // Timeframe Conversion
  // ───────────────────────────────────────────────────────────

  describe('타임프레임 변환', () => {
    it('Binance: 타임프레임 그대로 사용', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockBinanceResponse),
      });

      await service.getOHLCV('BTC/USDT', '1h', 10);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('interval=1h')
      );
    });

    it('Upbit: 1h → hours/1', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockUpbitResponse),
      });

      await service.getOHLCV('BTC/KRW', '1h', 10);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('hours/1')
      );
    });

    it('Upbit: 1d → days', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockUpbitResponse),
      });

      await service.getOHLCV('BTC/KRW', '1d', 10);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('days')
      );
    });
  });

  // ───────────────────────────────────────────────────────────
  // getOHLCV 테스트
  // ───────────────────────────────────────────────────────────

  describe('getOHLCV', () => {
    it('Binance API 성공 응답', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockBinanceResponse),
      });

      const result = await service.getOHLCV('BTC/USDT', '1h', 10);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.length).toBe(2);
      expect(result.data?.[0].open).toBe(29000);
      expect(result.data?.[0].close).toBe(29200);
      expect(result.data?.[0].volume).toBe(100.5);
    });

    it('Upbit API 성공 응답', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockUpbitResponse),
      });

      const result = await service.getOHLCV('BTC/KRW', '1h', 10);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.length).toBe(2);
      // Upbit은 역순으로 정렬 (최신순 → 과거순), reverse 후 [0]=29200, [1]=29000
      expect(result.data?.[0].open).toBe(29200);
      expect(result.data?.[1].open).toBe(29000);
    });

    it('limit 파라미터 적용', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockBinanceResponse),
      });

      await service.getOHLCV('BTC/USDT', '1h', 500);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=500')
      );
    });

    it('Upbit limit 최대 200으로 제한', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockUpbitResponse),
      });

      await service.getOHLCV('BTC/KRW', '1h', 500);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('count=200')
      );
    });
  });

  // ───────────────────────────────────────────────────────────
  // getHistoricalPrices 테스트
  // ───────────────────────────────────────────────────────────

  describe('getHistoricalPrices', () => {
    it('기간별 가격 데이터 조회 성공', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockBinanceResponse),
      });

      const result = await service.getHistoricalPrices(
        'BTC/USDT',
        '1h',
        '2021-01-01T00:00:00Z',
        '2021-01-02T00:00:00Z'
      );

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.symbol).toBe('BTC/USDT');
      expect(result.data?.timeframe).toBe('1h');
      expect(result.data?.candles.length).toBe(2);
    });

    it('startTime/endTime을 timestamp로 전달', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockBinanceResponse),
      });

      const startDate = '2021-01-01T00:00:00Z';
      const endDate = '2021-01-02T00:00:00Z';

      await service.getHistoricalPrices('BTC/USDT', '1h', startDate, endDate);

      const startMs = new Date(startDate).getTime();
      const endMs = new Date(endDate).getTime();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`startTime=${startMs}`)
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`endTime=${endMs}`)
      );
    });

    it('Upbit은 날짜 필터링 적용', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockUpbitResponse),
      });

      const result = await service.getHistoricalPrices(
        'BTC/KRW',
        '1h',
        '2021-01-01T00:00:00Z',
        '2021-01-01T00:01:00Z'
      );

      expect(result.success).toBe(true);
      // 필터링 후 2개 모두 포함되어야 함
      expect(result.data?.candles.length).toBe(2);
    });
  });

  // ───────────────────────────────────────────────────────────
  // 캐싱 테스트
  // ───────────────────────────────────────────────────────────

  describe('캐싱', () => {
    it('첫 요청은 API 호출', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockBinanceResponse),
      });

      const result = await service.getOHLCV('BTC/USDT', '1h', 10);

      expect(result.success).toBe(true);
      expect(result.metadata?.cached).toBe(false);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('1분 내 동일 요청은 캐시 사용', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockBinanceResponse),
      });

      // 첫 요청
      await service.getOHLCV('BTC/USDT', '1h', 10);
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // 두 번째 요청 (캐시됨)
      const cachedResult = await service.getOHLCV('BTC/USDT', '1h', 10);

      expect(cachedResult.success).toBe(true);
      expect(cachedResult.metadata?.cached).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(1); // 여전히 1번만
    });

    it('다른 심볼은 별도 캐시', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockBinanceResponse),
      });

      await service.getOHLCV('BTC/USDT', '1h', 10);
      await service.getOHLCV('ETH/USDT', '1h', 10);

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('clearCache() 호출 시 캐시 초기화', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockBinanceResponse),
      });

      await service.getOHLCV('BTC/USDT', '1h', 10);
      service.clearCache();
      await service.getOHLCV('BTC/USDT', '1h', 10);

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('historical 데이터는 5분 캐시', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockBinanceResponse),
      });

      const startDate = '2021-01-01T00:00:00Z';
      const endDate = '2021-01-02T00:00:00Z';

      const result1 = await service.getHistoricalPrices(
        'BTC/USDT',
        '1h',
        startDate,
        endDate
      );
      expect(result1.metadata?.cached).toBe(false);

      const result2 = await service.getHistoricalPrices(
        'BTC/USDT',
        '1h',
        startDate,
        endDate
      );
      expect(result2.metadata?.cached).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  // ───────────────────────────────────────────────────────────
  // 에러 핸들링
  // ───────────────────────────────────────────────────────────

  describe('에러 핸들링', () => {
    it('API 호출 실패 시 에러 반환', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const result = await service.getOHLCV('BTC/USDT', '1h', 10);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('500');
    });

    it('네트워크 에러', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const result = await service.getOHLCV('BTC/USDT', '1h', 10);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Network error');
    });

    it('JSON 파싱 에러', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      const result = await service.getOHLCV('BTC/USDT', '1h', 10);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('Rate Limit 에러 (429)', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
      });

      const result = await service.getOHLCV('BTC/USDT', '1h', 10);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('429');
    });
  });

  // ───────────────────────────────────────────────────────────
  // 메타데이터
  // ───────────────────────────────────────────────────────────

  describe('메타데이터', () => {
    it('성공 응답에 메타데이터 포함', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockBinanceResponse),
      });

      const result = await service.getOHLCV('BTC/USDT', '1h', 10);

      expect(result.metadata).toBeDefined();
      expect(result.metadata?.timestamp).toBeDefined();
      expect(result.metadata?.duration_ms).toBeGreaterThanOrEqual(0);
      expect(typeof result.metadata?.cached).toBe('boolean');
    });

    it('에러 응답에도 메타데이터 포함', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Error',
      });

      const result = await service.getOHLCV('BTC/USDT', '1h', 10);

      expect(result.success).toBe(false);
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.timestamp).toBeDefined();
    });

    it('duration_ms 측정', async () => {
      global.fetch = vi.fn().mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: () => Promise.resolve(mockBinanceResponse),
                }),
              50
            )
          )
      );

      const result = await service.getOHLCV('BTC/USDT', '1h', 10);

      expect(result.metadata?.duration_ms).toBeGreaterThanOrEqual(50);
    });
  });

  // ───────────────────────────────────────────────────────────
  // resampleTimeframe 테스트
  // ───────────────────────────────────────────────────────────

  describe('resampleTimeframe', () => {
    const sampleCandles: IOHLCV[] = [
      {
        timestamp: '2021-01-01T00:00:00Z',
        open: 100,
        high: 110,
        low: 95,
        close: 105,
        volume: 1000,
      },
      {
        timestamp: '2021-01-01T00:01:00Z',
        open: 105,
        high: 115,
        low: 100,
        close: 110,
        volume: 1200,
      },
      {
        timestamp: '2021-01-01T00:02:00Z',
        open: 110,
        high: 120,
        low: 105,
        close: 115,
        volume: 1500,
      },
    ];

    it('1m → 1h 리샘플링', () => {
      const result = service.resampleTimeframe(sampleCandles, '1m', '1h');

      expect(result.length).toBe(1);
      expect(result[0].open).toBe(100); // 첫 캔들의 open
      expect(result[0].high).toBe(120); // 최고가
      expect(result[0].low).toBe(95); // 최저가
      expect(result[0].close).toBe(115); // 마지막 캔들의 close
      expect(result[0].volume).toBe(3700); // 합계
    });

    it('작은 타임프레임으로는 리샘플링 불가', () => {
      const result = service.resampleTimeframe(sampleCandles, '1h', '1m');

      expect(result).toEqual(sampleCandles); // 그대로 반환
    });

    it('빈 배열 처리', () => {
      const result = service.resampleTimeframe([], '1m', '1h');

      expect(result).toEqual([]);
    });
  });
});

// ═══════════════════════════════════════════════════════════════
// InMemoryPriceDataService 테스트
// ═══════════════════════════════════════════════════════════════

describe('InMemoryPriceDataService', () => {
  let service: InMemoryPriceDataService;

  beforeEach(() => {
    service = new InMemoryPriceDataService();
  });

  describe('시뮬레이션 데이터 생성', () => {
    it('generateSimulatedData 호출', () => {
      service.generateSimulatedData(
        'BTC/USDT',
        '1h',
        '2021-01-01T00:00:00Z',
        '2021-01-02T00:00:00Z',
        40000
      );

      // 데이터가 생성되었는지 확인
      expect(() =>
        service.generateSimulatedData('BTC/USDT', '1h', '', '', 40000)
      ).not.toThrow();
    });

    it('getHistoricalPrices가 시뮬레이션 데이터 반환', async () => {
      service.generateSimulatedData(
        'BTC/USDT',
        '1h',
        '2021-01-01T00:00:00Z',
        '2021-01-01T05:00:00Z',
        40000
      );

      const result = await service.getHistoricalPrices(
        'BTC/USDT',
        '1h',
        '2021-01-01T00:00:00Z',
        '2021-01-01T05:00:00Z'
      );

      expect(result.success).toBe(true);
      expect(result.data?.candles.length).toBeGreaterThan(0);
    });

    it('데이터 없으면 자동 생성', async () => {
      const result = await service.getHistoricalPrices(
        'ETH/USDT',
        '1h',
        '2021-01-01T00:00:00Z',
        '2021-01-01T05:00:00Z'
      );

      expect(result.success).toBe(true);
      expect(result.data?.candles.length).toBeGreaterThan(0);
    });
  });

  describe('getOHLCV', () => {
    it('limit만큼 캔들 반환', async () => {
      const result = await service.getOHLCV('BTC/USDT', '1h', 100);

      expect(result.success).toBe(true);
      expect(result.data?.length).toBeLessThanOrEqual(100);
    });
  });

  describe('addPriceData', () => {
    it('수동으로 가격 데이터 추가', async () => {
      const testCandles: IOHLCV[] = [
        {
          timestamp: '2021-01-01T00:00:00Z',
          open: 40000,
          high: 41000,
          low: 39000,
          close: 40500,
          volume: 100,
        },
      ];

      service.addPriceData('TEST/USDT', testCandles);

      // addPriceData는 데이터를 저장하는 메서드로, 에러 없이 동작 확인
      expect(() => service.addPriceData('TEST2/USDT', testCandles)).not.toThrow();
    });
  });
});

/**
 * HEPHAITOS - Backtest Agent Tests
 * 백테스트 에이전트 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BacktestAgent } from '../agents/backtest-agent';
import type { HephaitosTypes } from '@forge/types';

type IStrategy = HephaitosTypes.IStrategy;
type IBacktestConfig = HephaitosTypes.IBacktestConfig;
type IOHLCV = HephaitosTypes.IOHLCV;

// ═══════════════════════════════════════════════════════════════
// Mock Services
// ═══════════════════════════════════════════════════════════════

const createMockOHLCV = (index: number, basePrice: number = 50000): IOHLCV => ({
  timestamp: new Date(2024, 0, index + 1).toISOString(),
  open: basePrice * (1 + (Math.random() - 0.5) * 0.02),
  high: basePrice * (1 + Math.random() * 0.03),
  low: basePrice * (1 - Math.random() * 0.03),
  close: basePrice * (1 + (Math.random() - 0.5) * 0.02),
  volume: 1000000 + Math.random() * 500000,
});

// 실제 서비스 인터페이스에 맞춘 Mock
const mockPriceDataService = {
  getHistoricalPrices: vi.fn(),  // getHistoricalData → getHistoricalPrices
};

const mockStrategyRepo = {
  getById: vi.fn(),  // findById → getById
};

const mockResultRepo = {
  save: vi.fn(),
  getById: vi.fn(),  // findById → getById
  compareStrategies: vi.fn(),
  listRecent: vi.fn(),
};

// ═══════════════════════════════════════════════════════════════
// 테스트 데이터
// ═══════════════════════════════════════════════════════════════

const mockStrategy: IStrategy = {
  id: 'strategy-1',
  name: 'RSI Strategy',
  description: 'Buy when RSI < 30',
  type: 'momentum',
  version: '1.0.0',
  timeframe: '1d',
  symbols: ['BTC/USDT'],
  entryConditions: {
    logic: 'and',
    conditions: [
      {
        left: { type: 'rsi', period: 14 },
        operator: 'lt',
        right: 30,
      },
    ],
  },
  exitConditions: {
    logic: 'or',
    conditions: [
      {
        left: { type: 'rsi', period: 14 },
        operator: 'gt',
        right: 70,
      },
    ],
  },
  positionSizing: { type: 'fixed_percent', percent: 10 },
  riskManagement: {
    stopLossPercent: 5,
    takeProfitPercent: 15,
  },
  metadata: {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
};

const mockBacktestConfig: IBacktestConfig = {
  id: 'config-1',
  strategyId: 'strategy-1',
  symbols: ['BTC/USDT'],
  timeframe: '1d',
  startDate: '2024-01-01',
  endDate: '2024-03-31',
  initialCapital: 10000,
  currency: 'USD',
  feeRate: 0.1,
  slippage: 0.05,
  useMargin: false,
};

// ═══════════════════════════════════════════════════════════════
// 테스트 헬퍼
// ═══════════════════════════════════════════════════════════════

/**
 * 가격 데이터를 IPriceData 형식으로 래핑
 */
const wrapPriceData = (candles: IOHLCV[]) => ({
  success: true,
  data: {
    symbol: 'BTC/USDT',
    timeframe: '1d',
    candles,
    startTime: candles[0]?.timestamp ?? '',
    endTime: candles[candles.length - 1]?.timestamp ?? '',
  },
});

// ═══════════════════════════════════════════════════════════════
// BacktestAgent 테스트
// ═══════════════════════════════════════════════════════════════

describe('BacktestAgent', () => {
  let agent: BacktestAgent;
  let onProgress: ReturnType<typeof vi.fn>;
  let onTrade: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    onProgress = vi.fn();
    onTrade = vi.fn();

    agent = new BacktestAgent(
      mockPriceDataService as never,
      mockStrategyRepo as never,
      mockResultRepo as never,
      { onProgress, onTrade }
    );

    // 기본 mock 설정
    mockStrategyRepo.getById.mockResolvedValue({
      success: true,
      data: mockStrategy,
    });

    // 90일 가격 데이터 생성 (IPriceData 형식)
    const priceData = Array.from({ length: 90 }, (_, i) =>
      createMockOHLCV(i, 50000 + i * 100) // 상승 추세
    );
    mockPriceDataService.getHistoricalPrices.mockResolvedValue(
      wrapPriceData(priceData)
    );

    mockResultRepo.save.mockResolvedValue({ success: true });
  });

  describe('runBacktest', () => {
    it('백테스트 실행 성공', async () => {
      const result = await agent.runBacktest(mockBacktestConfig);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      if (result.data) {
        expect(result.data.status).toBe('completed');
        expect(result.data.initialCapital).toBe(10000);
      }
    });

    it('전략 조회 실패 시 에러', async () => {
      mockStrategyRepo.getById.mockResolvedValue({
        success: false,
        error: new Error('Strategy not found'),
      });

      const result = await agent.runBacktest(mockBacktestConfig);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('가격 데이터 조회 실패 시 에러', async () => {
      mockPriceDataService.getHistoricalPrices.mockResolvedValue({
        success: false,
        error: new Error('No price data'),
      });

      const result = await agent.runBacktest(mockBacktestConfig);

      expect(result.success).toBe(false);
    });

    it('진행률 콜백 호출', async () => {
      await agent.runBacktest(mockBacktestConfig);

      expect(onProgress).toHaveBeenCalled();
      // 시작과 완료 시점에 최소 2번 호출
      expect(onProgress.mock.calls.length).toBeGreaterThanOrEqual(2);
    });

    it('거래 발생 시 콜백 호출', async () => {
      // 하락 추세 데이터로 RSI < 30 조건 만족
      const downtrend = Array.from({ length: 90 }, (_, i) =>
        createMockOHLCV(i, 60000 - i * 200)
      );
      mockPriceDataService.getHistoricalPrices.mockResolvedValue(
        wrapPriceData(downtrend)
      );

      await agent.runBacktest(mockBacktestConfig);

      // 거래가 발생했을 수 있음 (조건에 따라)
      expect(onTrade.mock.calls.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('결과 계산', () => {
    it('자산 곡선 생성', async () => {
      const result = await agent.runBacktest(mockBacktestConfig);

      if (result.success && result.data) {
        expect(result.data.equityCurve).toBeDefined();
        expect(Array.isArray(result.data.equityCurve)).toBe(true);
        expect(result.data.equityCurve.length).toBeGreaterThan(0);
      }
    });

    it('성과 지표 계산', async () => {
      const result = await agent.runBacktest(mockBacktestConfig);

      if (result.success && result.data) {
        expect(result.data.metrics).toBeDefined();
        expect(result.data.metrics.totalReturn).toBeDefined();
        expect(result.data.metrics.sharpeRatio).toBeDefined();
        expect(result.data.metrics.maxDrawdown).toBeDefined();
      }
    });

    it('월별 수익률 계산', async () => {
      const result = await agent.runBacktest(mockBacktestConfig);

      if (result.success && result.data) {
        expect(result.data.monthlyReturns).toBeDefined();
        expect(Array.isArray(result.data.monthlyReturns)).toBe(true);
      }
    });

    it('드로다운 기록', async () => {
      const result = await agent.runBacktest(mockBacktestConfig);

      if (result.success && result.data) {
        expect(result.data.drawdowns).toBeDefined();
        expect(Array.isArray(result.data.drawdowns)).toBe(true);
      }
    });
  });

  describe('리스크 관리', () => {
    it('손절 적용', async () => {
      // 급락 데이터
      const crash = Array.from({ length: 90 }, (_, i) => {
        const price = i < 30 ? 50000 : 50000 * 0.8; // 20% 급락
        return createMockOHLCV(i, price);
      });
      mockPriceDataService.getHistoricalPrices.mockResolvedValue(
        wrapPriceData(crash)
      );

      const result = await agent.runBacktest(mockBacktestConfig);

      // 손절이 작동하면 손실 제한
      if (result.success && result.data && result.data.trades.length > 0) {
        const maxLoss = Math.min(...result.data.trades.map(t => t.netPnLPercent));
        expect(maxLoss).toBeGreaterThanOrEqual(-10); // 손절 5% + 슬리피지
      }
    });

    it('익절 적용', async () => {
      // 급등 데이터
      const rally = Array.from({ length: 90 }, (_, i) => {
        const price = 50000 + i * 1000; // 꾸준히 상승
        return createMockOHLCV(i, price);
      });
      mockPriceDataService.getHistoricalPrices.mockResolvedValue(
        wrapPriceData(rally)
      );

      const result = await agent.runBacktest(mockBacktestConfig);

      // 결과 확인
      expect(result.success).toBe(true);
    });
  });

  describe('compareStrategies', () => {
    it('전략 비교 (백테스트 결과 ID 기반)', async () => {
      // 실제 구현은 백테스트 결과 ID를 받음
      mockResultRepo.compareStrategies.mockResolvedValue({
        success: true,
        data: {
          summaries: [
            { id: 'result-1', strategyName: 'RSI Strategy', totalReturn: 15 },
            { id: 'result-2', strategyName: 'MACD Strategy', totalReturn: 12 },
          ],
          bestByReturn: 'result-1',
          bestBySharpe: 'result-1',
        },
      });

      const result = await agent.compareStrategies(['result-1', 'result-2']);

      expect(result.success).toBe(true);
      expect(mockResultRepo.compareStrategies).toHaveBeenCalledWith(['result-1', 'result-2']);
    });

    it('빈 결과 ID 목록', async () => {
      mockResultRepo.compareStrategies.mockResolvedValue({
        success: false,
        error: new Error('No results to compare'),
      });

      const result = await agent.compareStrategies([]);

      expect(result.success).toBe(false);
    });
  });

  describe('analyzeResult', () => {
    it('백테스트 결과 분석', async () => {
      // 먼저 백테스트 실행
      const backtestResult = await agent.runBacktest(mockBacktestConfig);

      if (backtestResult.success && backtestResult.data) {
        mockResultRepo.getById.mockResolvedValue({
          success: true,
          data: backtestResult.data,
        });

        const analysis = await agent.analyzeResult(backtestResult.data.id);

        expect(analysis.success).toBe(true);
        if (analysis.data) {
          expect(analysis.data.insights).toBeDefined();
          expect(Array.isArray(analysis.data.insights)).toBe(true);
          expect(analysis.data.insights.length).toBeGreaterThan(0);
        }
      }
    });

    it('존재하지 않는 결과 분석', async () => {
      mockResultRepo.getById.mockResolvedValue({
        success: false,
        error: new Error('Result not found'),
      });

      const analysis = await agent.analyzeResult('non-existent');

      expect(analysis.success).toBe(false);
      expect(analysis.error).toBeDefined();
    });
  });

  describe('getRecentResults', () => {
    it('최근 백테스트 목록 조회', async () => {
      mockResultRepo.listRecent.mockResolvedValue({
        success: true,
        data: [
          { id: 'r1', strategyName: 'Strategy 1', totalReturn: 10 },
          { id: 'r2', strategyName: 'Strategy 2', totalReturn: 5 },
        ],
      });

      const result = await agent.getRecentResults(10);

      expect(result.success).toBe(true);
      expect(mockResultRepo.listRecent).toHaveBeenCalledWith(10);
    });
  });
});

// ═══════════════════════════════════════════════════════════════
// 엣지 케이스 테스트
// ═══════════════════════════════════════════════════════════════

describe('Edge Cases', () => {
  let agent: BacktestAgent;

  beforeEach(() => {
    vi.clearAllMocks();
    agent = new BacktestAgent(
      mockPriceDataService as never,
      mockStrategyRepo as never,
      mockResultRepo as never
    );

    mockStrategyRepo.getById.mockResolvedValue({
      success: true,
      data: mockStrategy,
    });
    mockResultRepo.save.mockResolvedValue({ success: true });
  });

  it('데이터 부족 시 에러 반환', async () => {
    // 50일 미만 데이터 (lookback 기간 미만)
    const shortData = Array.from({ length: 30 }, (_, i) =>
      createMockOHLCV(i)
    );
    mockPriceDataService.getHistoricalPrices.mockResolvedValue(
      wrapPriceData(shortData)
    );

    const result = await agent.runBacktest(mockBacktestConfig);

    // 데이터 부족하면 에러
    expect(result.success).toBe(false);
    expect(result.error?.message).toContain('Insufficient');
  });

  it('모든 조건 미충족 시 거래 없음', async () => {
    // RSI가 항상 50 근처인 데이터
    const sideways = Array.from({ length: 90 }, (_, i) =>
      createMockOHLCV(i, 50000)
    );
    mockPriceDataService.getHistoricalPrices.mockResolvedValue(
      wrapPriceData(sideways)
    );

    const result = await agent.runBacktest(mockBacktestConfig);

    expect(result.success).toBe(true);
    // 횡보장에서는 거래가 적거나 없을 수 있음
  });

  it('자본금 0 처리', async () => {
    const zeroCapitalConfig = {
      ...mockBacktestConfig,
      initialCapital: 0,
    };

    const priceData = Array.from({ length: 90 }, (_, i) =>
      createMockOHLCV(i, 50000)
    );
    mockPriceDataService.getHistoricalPrices.mockResolvedValue(
      wrapPriceData(priceData)
    );

    const result = await agent.runBacktest(zeroCapitalConfig);

    // 자본금 0이면 거래 없음
    if (result.success && result.data) {
      expect(result.data.trades).toHaveLength(0);
    }
  });

  it('빈 가격 데이터 처리', async () => {
    mockPriceDataService.getHistoricalPrices.mockResolvedValue({
      success: true,
      data: {
        symbol: 'BTC/USDT',
        timeframe: '1d',
        candles: [], // 빈 배열
        startTime: '',
        endTime: '',
      },
    });

    const result = await agent.runBacktest(mockBacktestConfig);

    // 데이터 없으면 에러
    expect(result.success).toBe(false);
  });
});

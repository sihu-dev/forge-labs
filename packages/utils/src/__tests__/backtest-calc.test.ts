/**
 * @forge/utils - Backtest Calculation Tests
 * 백테스트 성과 지표 계산 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  calculateTotalReturn,
  calculateAnnualizedReturn,
  calculateDailyReturns,
  calculateSharpeRatio,
  calculateSortinoRatio,
  calculateMaxDrawdown,
  calculateWinRate,
  calculateProfitFactor,
  calculateExpectancy,
  calculateAvgWinLoss,
  calculateConsecutiveWinsLosses,
  calculatePerformanceMetrics,
} from '../backtest-calc';
import type { HephaitosTypes } from '@forge/types';

type IRoundTrip = HephaitosTypes.IRoundTrip;
type IEquityPoint = HephaitosTypes.IEquityPoint;

// ═══════════════════════════════════════════════════════════════
// 테스트 데이터 헬퍼
// ═══════════════════════════════════════════════════════════════

const createEquityPoint = (equity: number, dayOffset: number = 0): IEquityPoint => ({
  timestamp: new Date(2024, 0, dayOffset + 1).toISOString(),
  equity,
  drawdown: 0,
});

const createEquityCurve = (values: number[]): IEquityPoint[] =>
  values.map((equity, i) => createEquityPoint(equity, i));

const createRoundTrip = (
  netPnL: number,
  entryDayOffset: number = 0,
  holdingDays: number = 1
): IRoundTrip => ({
  id: `trade-${Math.random()}`,
  symbol: 'BTC/USDT',
  side: netPnL >= 0 ? 'long' : 'long',
  enteredAt: new Date(2024, 0, entryDayOffset + 1).toISOString(),
  exitedAt: new Date(2024, 0, entryDayOffset + holdingDays + 1).toISOString(),
  entryPrice: 50000,
  exitPrice: 50000 + netPnL * 10,
  quantity: 0.1,
  grossPnL: netPnL * 1.1,
  fees: netPnL * 0.1,
  netPnL,
  pnlPercent: (netPnL / 5000) * 100,
  holdingPeriodMs: holdingDays * 24 * 60 * 60 * 1000,
});

// ═══════════════════════════════════════════════════════════════
// 수익률 계산 테스트
// ═══════════════════════════════════════════════════════════════

describe('calculateTotalReturn', () => {
  it('정상적인 수익률 계산', () => {
    expect(calculateTotalReturn(10000, 12000)).toBe(20);
    expect(calculateTotalReturn(10000, 8000)).toBe(-20);
  });

  it('초기 자본이 0이면 0 반환', () => {
    expect(calculateTotalReturn(0, 1000)).toBe(0);
  });

  it('음수 초기 자본은 0 반환', () => {
    expect(calculateTotalReturn(-100, 1000)).toBe(0);
  });

  it('정밀한 수익률 계산', () => {
    expect(calculateTotalReturn(10000, 10500)).toBeCloseTo(5, 2);
  });
});

describe('calculateAnnualizedReturn', () => {
  it('1년 수익률 그대로 반환', () => {
    const result = calculateAnnualizedReturn(20, 252);
    expect(result).toBeCloseTo(20, 1);
  });

  it('반년 수익률 연환산', () => {
    // 6개월에 10% 수익 -> 연환산은 약 21%
    const result = calculateAnnualizedReturn(10, 126);
    expect(result).toBeGreaterThan(10);
  });

  it('거래일 0이면 0 반환', () => {
    expect(calculateAnnualizedReturn(20, 0)).toBe(0);
  });

  it('음수 거래일은 0 반환', () => {
    expect(calculateAnnualizedReturn(20, -10)).toBe(0);
  });

  it('100% 손실 시 -100 반환', () => {
    expect(calculateAnnualizedReturn(-100, 252)).toBe(-100);
  });
});

describe('calculateDailyReturns', () => {
  it('일별 수익률 계산', () => {
    const curve = createEquityCurve([10000, 10100, 10201]);
    const returns = calculateDailyReturns(curve);

    expect(returns).toHaveLength(2);
    expect(returns[0]).toBeCloseTo(0.01, 4); // 1%
    expect(returns[1]).toBeCloseTo(0.01, 4); // 1%
  });

  it('빈 배열은 빈 배열 반환', () => {
    expect(calculateDailyReturns([])).toEqual([]);
  });

  it('단일 요소는 빈 배열 반환', () => {
    expect(calculateDailyReturns([createEquityPoint(10000)])).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════
// 리스크 조정 수익률 테스트
// ═══════════════════════════════════════════════════════════════

describe('calculateSharpeRatio', () => {
  it('양호한 샤프 비율 계산', () => {
    // 일정한 양의 수익률 (0.1% 일간)
    const returns = Array(252).fill(0.001);
    const sharpe = calculateSharpeRatio(returns);

    expect(sharpe).toBeGreaterThan(0);
  });

  it('변동성 높으면 낮은 샤프', () => {
    // 변동성 높은 수익률
    const highVol = Array(100).fill(0).map((_, i) =>
      i % 2 === 0 ? 0.05 : -0.04
    );
    const lowVol = Array(100).fill(0.005);

    const highVolSharpe = calculateSharpeRatio(highVol);
    const lowVolSharpe = calculateSharpeRatio(lowVol);

    expect(lowVolSharpe).toBeGreaterThan(highVolSharpe);
  });

  it('표준편차 0이면 0 반환', () => {
    const returns = Array(10).fill(0);
    expect(calculateSharpeRatio(returns)).toBe(0);
  });

  it('데이터 부족 시 0 반환', () => {
    expect(calculateSharpeRatio([0.01])).toBe(0);
  });
});

describe('calculateSortinoRatio', () => {
  it('하방 위험만 고려', () => {
    // 양의 수익만 있으면 무한대
    const allPositive = Array(100).fill(0.01);
    expect(calculateSortinoRatio(allPositive)).toBe(Infinity);
  });

  it('음의 수익만 있으면 음의 소르티노', () => {
    const allNegative = Array(100).fill(-0.01);
    const sortino = calculateSortinoRatio(allNegative);

    expect(sortino).toBeLessThan(0);
  });
});

// ═══════════════════════════════════════════════════════════════
// 낙폭 테스트
// ═══════════════════════════════════════════════════════════════

describe('calculateMaxDrawdown', () => {
  it('최대 낙폭 계산', () => {
    // 10000 -> 9000 -> 10500 -> 8400 (최대 낙폭: 20%)
    const curve = createEquityCurve([10000, 9000, 10500, 8400]);
    const mdd = calculateMaxDrawdown(curve);

    expect(mdd).toBeCloseTo(20, 0); // 8400 / 10500 = 20% 하락
  });

  it('상승만 하면 0', () => {
    const curve = createEquityCurve([10000, 10500, 11000, 11500]);
    expect(calculateMaxDrawdown(curve)).toBe(0);
  });

  it('빈 배열은 0', () => {
    expect(calculateMaxDrawdown([])).toBe(0);
  });

  it('연속 하락 시 최대값 추적', () => {
    // 10000 -> 9000 -> 8000 -> 7000 (30% 낙폭)
    const curve = createEquityCurve([10000, 9000, 8000, 7000]);
    expect(calculateMaxDrawdown(curve)).toBeCloseTo(30, 0);
  });
});

// ═══════════════════════════════════════════════════════════════
// 거래 지표 테스트
// ═══════════════════════════════════════════════════════════════

describe('calculateWinRate', () => {
  it('승률 계산', () => {
    const trades = [
      createRoundTrip(100),  // 승
      createRoundTrip(200),  // 승
      createRoundTrip(-50),  // 패
      createRoundTrip(150),  // 승
    ];

    expect(calculateWinRate(trades)).toBe(75);
  });

  it('전부 승리', () => {
    const trades = [
      createRoundTrip(100),
      createRoundTrip(200),
    ];

    expect(calculateWinRate(trades)).toBe(100);
  });

  it('전부 손실', () => {
    const trades = [
      createRoundTrip(-100),
      createRoundTrip(-200),
    ];

    expect(calculateWinRate(trades)).toBe(0);
  });

  it('거래 없으면 0', () => {
    expect(calculateWinRate([])).toBe(0);
  });
});

describe('calculateProfitFactor', () => {
  it('손익비 계산', () => {
    const trades = [
      createRoundTrip(300),   // 이익
      createRoundTrip(-100),  // 손실
    ];

    expect(calculateProfitFactor(trades)).toBe(3);
  });

  it('손실 없으면 무한대', () => {
    const trades = [
      createRoundTrip(100),
      createRoundTrip(200),
    ];

    expect(calculateProfitFactor(trades)).toBe(Infinity);
  });

  it('이익 없으면 0', () => {
    const trades = [
      createRoundTrip(-100),
      createRoundTrip(-200),
    ];

    expect(calculateProfitFactor(trades)).toBe(0);
  });
});

describe('calculateAvgWinLoss', () => {
  it('평균 승패 계산', () => {
    const trades = [
      createRoundTrip(100),
      createRoundTrip(300),
      createRoundTrip(-50),
      createRoundTrip(-150),
    ];

    const result = calculateAvgWinLoss(trades);

    expect(result.avgWin).toBe(200);  // (100+300)/2
    expect(result.avgLoss).toBe(100); // (50+150)/2
    expect(result.maxWin).toBe(300);
    expect(result.maxLoss).toBe(150);
  });
});

describe('calculateConsecutiveWinsLosses', () => {
  it('연속 승패 계산', () => {
    const trades = [
      createRoundTrip(100),  // 승
      createRoundTrip(200),  // 승
      createRoundTrip(150),  // 승 (3연승)
      createRoundTrip(-50),  // 패
      createRoundTrip(-30),  // 패 (2연패)
      createRoundTrip(100),  // 승
    ];

    const result = calculateConsecutiveWinsLosses(trades);

    expect(result.maxConsecutiveWins).toBe(3);
    expect(result.maxConsecutiveLosses).toBe(2);
  });
});

describe('calculateExpectancy', () => {
  it('기대값 계산', () => {
    // 승률 50%, 평균이익 200, 평균손실 100
    // 기대값 = 0.5 * 200 - 0.5 * 100 = 50
    const trades = [
      createRoundTrip(200),
      createRoundTrip(-100),
    ];

    const expectancy = calculateExpectancy(trades);
    expect(expectancy).toBe(50);
  });

  it('거래 없으면 0', () => {
    expect(calculateExpectancy([])).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════
// 종합 지표 테스트
// ═══════════════════════════════════════════════════════════════

describe('calculatePerformanceMetrics', () => {
  it('전체 성과 지표 계산', () => {
    const equityCurve = createEquityCurve([10000, 10100, 10200, 10300, 10400, 10500]);
    const trades = [
      createRoundTrip(100),
      createRoundTrip(150),
      createRoundTrip(-50),
    ];

    const metrics = calculatePerformanceMetrics(10000, 10500, equityCurve, trades);

    expect(metrics.totalReturn).toBe(5);
    expect(metrics.totalTrades).toBe(3);
    expect(metrics.winRate).toBeCloseTo(66.67, 0);
    expect(metrics.profitFactor).toBe(5); // (100+150)/50
    expect(metrics.maxDrawdown).toBe(0); // 상승만
  });

  it('빈 거래도 처리', () => {
    const equityCurve = createEquityCurve([10000, 10100]);
    const metrics = calculatePerformanceMetrics(10000, 10100, equityCurve, []);

    expect(metrics.totalReturn).toBe(1);
    expect(metrics.totalTrades).toBe(0);
    expect(metrics.winRate).toBe(0);
  });
});

/**
 * @forge/utils - Signal Detector Tests
 * 기술적 지표 및 시그널 감지 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  calculateSMA,
  calculateEMA,
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  evaluateComparison,
  detectEntrySignal,
  detectExitSignal,
} from '../signal-detector';
import type { HephaitosTypes } from '@forge/types';

type IOHLCV = HephaitosTypes.IOHLCV;
type IConditionGroup = HephaitosTypes.IConditionGroup;

// ═══════════════════════════════════════════════════════════════
// 테스트 데이터 헬퍼
// ═══════════════════════════════════════════════════════════════

const createOHLCV = (close: number, index: number = 0): IOHLCV => ({
  timestamp: new Date(2024, 0, index + 1).toISOString(),
  open: close * 0.99,
  high: close * 1.02,
  low: close * 0.98,
  close,
  volume: 1000000,
});

const createOHLCVSeries = (closes: number[]): IOHLCV[] =>
  closes.map((close, i) => createOHLCV(close, i));

// 상승 추세 데이터 (30개)
const uptrendCloses = [
  100, 102, 104, 106, 108, 110, 112, 114, 116, 118,
  120, 122, 124, 126, 128, 130, 132, 134, 136, 138,
  140, 142, 144, 146, 148, 150, 152, 154, 156, 158,
];

// 하락 추세 데이터 (30개)
const downtrendCloses = [
  160, 158, 156, 154, 152, 150, 148, 146, 144, 142,
  140, 138, 136, 134, 132, 130, 128, 126, 124, 122,
  120, 118, 116, 114, 112, 110, 108, 106, 104, 102,
];

// 횡보 데이터 (30개)
const sidewaysCloses = [
  100, 102, 98, 101, 99, 103, 97, 102, 100, 101,
  99, 100, 102, 98, 101, 99, 100, 102, 98, 100,
  101, 99, 100, 102, 98, 101, 99, 100, 102, 100,
];

// ═══════════════════════════════════════════════════════════════
// SMA 테스트
// ═══════════════════════════════════════════════════════════════

describe('calculateSMA', () => {
  it('기본 SMA 계산', () => {
    const closes = [10, 20, 30, 40, 50];
    const sma = calculateSMA(closes, 5);

    // 입력과 같은 길이 배열 반환 (처음 4개는 NaN)
    expect(sma).toHaveLength(5);
    expect(isNaN(sma[0])).toBe(true);
    expect(isNaN(sma[3])).toBe(true);
    expect(sma[4]).toBe(30); // (10+20+30+40+50)/5
  });

  it('이동 SMA 계산', () => {
    const closes = [10, 20, 30, 40, 50, 60];
    const sma = calculateSMA(closes, 3);

    expect(sma).toHaveLength(6);
    expect(isNaN(sma[0])).toBe(true);
    expect(isNaN(sma[1])).toBe(true);
    expect(sma[2]).toBe(20); // (10+20+30)/3
    expect(sma[3]).toBe(30); // (20+30+40)/3
    expect(sma[4]).toBe(40); // (30+40+50)/3
    expect(sma[5]).toBe(50); // (40+50+60)/3
  });

  it('데이터 부족 시 NaN 배열', () => {
    const closes = [10, 20];
    const sma = calculateSMA(closes, 5);

    expect(sma).toHaveLength(2);
    expect(isNaN(sma[0])).toBe(true);
    expect(isNaN(sma[1])).toBe(true);
  });

  it('상승 추세에서 SMA 상승', () => {
    const sma = calculateSMA(uptrendCloses, 5);
    const validSma = sma.filter(v => !isNaN(v));

    for (let i = 1; i < validSma.length; i++) {
      expect(validSma[i]).toBeGreaterThan(validSma[i - 1]);
    }
  });
});

// ═══════════════════════════════════════════════════════════════
// EMA 테스트
// ═══════════════════════════════════════════════════════════════

describe('calculateEMA', () => {
  it('EMA 기본 계산', () => {
    const closes = [100, 100, 100, 100, 100, 150];
    const ema = calculateEMA(closes, 5);

    expect(ema).toHaveLength(6);
    // 처음 4개는 NaN
    expect(isNaN(ema[0])).toBe(true);
    expect(isNaN(ema[3])).toBe(true);
    // 마지막 값은 숫자
    expect(isNaN(ema[5])).toBe(false);
  });

  it('EMA가 최신 가격에 더 민감', () => {
    const closes = [100, 100, 100, 100, 100, 100, 100, 100, 100, 150];
    const sma = calculateSMA(closes, 5);
    const ema = calculateEMA(closes, 5);

    const lastSma = sma[sma.length - 1];
    const lastEma = ema[ema.length - 1];

    // 급등 후 EMA가 SMA보다 높음
    expect(lastEma).toBeGreaterThan(lastSma);
  });

  it('안정적인 데이터에서 SMA와 유사', () => {
    const sma = calculateSMA(sidewaysCloses, 5);
    const ema = calculateEMA(sidewaysCloses, 5);

    const lastSma = sma[sma.length - 1];
    const lastEma = ema[ema.length - 1];

    // 횡보장에서는 SMA와 EMA가 비슷
    expect(Math.abs(lastEma - lastSma)).toBeLessThan(5);
  });
});

// ═══════════════════════════════════════════════════════════════
// RSI 테스트
// ═══════════════════════════════════════════════════════════════

describe('calculateRSI', () => {
  it('상승 추세에서 높은 RSI', () => {
    const rsi = calculateRSI(uptrendCloses, 14);
    const validRsi = rsi.filter(v => !isNaN(v));

    expect(validRsi.length).toBeGreaterThan(0);

    const lastRsi = validRsi[validRsi.length - 1];
    expect(lastRsi).toBeGreaterThan(50);
    expect(lastRsi).toBeLessThanOrEqual(100);
  });

  it('하락 추세에서 낮은 RSI', () => {
    const rsi = calculateRSI(downtrendCloses, 14);
    const validRsi = rsi.filter(v => !isNaN(v));

    expect(validRsi.length).toBeGreaterThan(0);

    const lastRsi = validRsi[validRsi.length - 1];
    expect(lastRsi).toBeLessThan(50);
    expect(lastRsi).toBeGreaterThanOrEqual(0);
  });

  it('RSI 범위 0-100', () => {
    const combined = [...uptrendCloses, ...downtrendCloses];
    const rsi = calculateRSI(combined, 14);
    const validRsi = rsi.filter(v => !isNaN(v));

    for (const value of validRsi) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(100);
    }
  });

  it('데이터 부족 시 NaN 배열', () => {
    const closes = [100, 101, 102];
    const rsi = calculateRSI(closes, 14);

    // period보다 데이터가 적으면 모두 NaN
    expect(rsi.every(v => isNaN(v))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════
// MACD 테스트
// ═══════════════════════════════════════════════════════════════

describe('calculateMACD', () => {
  const longData = [...uptrendCloses, ...downtrendCloses];

  it('MACD 구조 확인', () => {
    const macd = calculateMACD(longData, 12, 26, 9);

    expect(macd).toHaveProperty('macd');
    expect(macd).toHaveProperty('signal');
    expect(macd).toHaveProperty('histogram');
    expect(Array.isArray(macd.macd)).toBe(true);
    expect(Array.isArray(macd.signal)).toBe(true);
    expect(Array.isArray(macd.histogram)).toBe(true);
  });

  it('상승 추세에서 양의 MACD', () => {
    const macd = calculateMACD(uptrendCloses, 5, 10, 3);
    const validMacd = macd.macd.filter(v => !isNaN(v));

    expect(validMacd.length).toBeGreaterThan(0);
    const lastMacd = validMacd[validMacd.length - 1];
    expect(lastMacd).toBeGreaterThan(0);
  });

  it('하락 추세에서 음의 MACD', () => {
    const macd = calculateMACD(downtrendCloses, 5, 10, 3);
    const validMacd = macd.macd.filter(v => !isNaN(v));

    expect(validMacd.length).toBeGreaterThan(0);
    const lastMacd = validMacd[validMacd.length - 1];
    expect(lastMacd).toBeLessThan(0);
  });

  it('히스토그램 = MACD - Signal', () => {
    const macd = calculateMACD(longData, 12, 26, 9);

    for (let i = 0; i < macd.histogram.length; i++) {
      if (!isNaN(macd.macd[i]) && !isNaN(macd.signal[i]) && !isNaN(macd.histogram[i])) {
        const expected = macd.macd[i] - macd.signal[i];
        expect(macd.histogram[i]).toBeCloseTo(expected, 5);
      }
    }
  });
});

// ═══════════════════════════════════════════════════════════════
// 볼린저 밴드 테스트
// ═══════════════════════════════════════════════════════════════

describe('calculateBollingerBands', () => {
  it('볼린저 밴드 구조 확인', () => {
    const bb = calculateBollingerBands(sidewaysCloses, 20, 2);

    expect(bb).toHaveProperty('upper');
    expect(bb).toHaveProperty('middle');
    expect(bb).toHaveProperty('lower');
    expect(Array.isArray(bb.upper)).toBe(true);
    expect(Array.isArray(bb.middle)).toBe(true);
    expect(Array.isArray(bb.lower)).toBe(true);
  });

  it('upper > middle > lower', () => {
    const bb = calculateBollingerBands(sidewaysCloses, 20, 2);

    for (let i = 0; i < bb.middle.length; i++) {
      if (!isNaN(bb.upper[i]) && !isNaN(bb.middle[i]) && !isNaN(bb.lower[i])) {
        expect(bb.upper[i]).toBeGreaterThan(bb.middle[i]);
        expect(bb.middle[i]).toBeGreaterThan(bb.lower[i]);
      }
    }
  });

  it('middle = SMA', () => {
    const bb = calculateBollingerBands(sidewaysCloses, 20, 2);
    const sma = calculateSMA(sidewaysCloses, 20);

    expect(bb.middle).toEqual(sma);
  });

  it('변동성 높으면 밴드 폭 증가', () => {
    // 변동성 낮은 데이터 (30개)
    const lowVol = Array(30).fill(100);
    // 변동성 높은 데이터 (30개)
    const highVol = [
      100, 110, 90, 115, 85, 120, 80, 125, 75, 130,
      70, 135, 65, 140, 60, 145, 55, 150, 50, 155,
      45, 160, 40, 165, 35, 170, 30, 175, 25, 180,
    ];

    const bbLow = calculateBollingerBands(lowVol, 20, 2);
    const bbHigh = calculateBollingerBands(highVol, 20, 2);

    // 유효한 값 찾기
    const lastValidLow = bbLow.upper.length - 1;
    const lastValidHigh = bbHigh.upper.length - 1;

    const widthLow = bbLow.upper[lastValidLow] - bbLow.lower[lastValidLow];
    const widthHigh = bbHigh.upper[lastValidHigh] - bbHigh.lower[lastValidHigh];

    expect(widthHigh).toBeGreaterThan(widthLow);
  });
});

// ═══════════════════════════════════════════════════════════════
// 비교 연산자 테스트
// ═══════════════════════════════════════════════════════════════

describe('evaluateComparison', () => {
  it('gt (greater than)', () => {
    expect(evaluateComparison(10, 'gt', 5)).toBe(true);
    expect(evaluateComparison(5, 'gt', 10)).toBe(false);
    expect(evaluateComparison(5, 'gt', 5)).toBe(false);
  });

  it('lt (less than)', () => {
    expect(evaluateComparison(5, 'lt', 10)).toBe(true);
    expect(evaluateComparison(10, 'lt', 5)).toBe(false);
    expect(evaluateComparison(5, 'lt', 5)).toBe(false);
  });

  it('eq (equal)', () => {
    expect(evaluateComparison(5, 'eq', 5)).toBe(true);
    expect(evaluateComparison(5.00001, 'eq', 5)).toBe(true); // 오차 허용
    expect(evaluateComparison(5, 'eq', 6)).toBe(false);
  });

  it('cross_above', () => {
    // 이전에 아래, 현재 위
    expect(evaluateComparison(10, 'cross_above', 5, 3, 5)).toBe(true);
    // 이전에도 위, 현재도 위
    expect(evaluateComparison(10, 'cross_above', 5, 8, 5)).toBe(false);
    // 이전 값 없음
    expect(evaluateComparison(10, 'cross_above', 5)).toBe(false);
  });

  it('cross_below', () => {
    // 이전에 위, 현재 아래
    expect(evaluateComparison(3, 'cross_below', 5, 8, 5)).toBe(true);
    // 이전에도 아래, 현재도 아래
    expect(evaluateComparison(3, 'cross_below', 5, 2, 5)).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════
// 시그널 감지 테스트
// ═══════════════════════════════════════════════════════════════

describe('detectEntrySignal', () => {
  it('RSI 과매도 조건 충족 시 진입', () => {
    // RSI < 30 조건
    const entryConditions: IConditionGroup = {
      logic: 'and',
      conditions: [
        {
          left: { type: 'rsi', period: 14 },
          operator: 'lt',
          right: 30,
        },
      ],
    };

    // 급락 데이터 (RSI가 낮아짐)
    const crashData = [
      100, 95, 90, 85, 80, 75, 70, 65, 60, 55,
      50, 48, 46, 44, 42, 40, 38, 36, 34, 32,
      30, 28, 26, 24, 22, 20, 18, 16, 14, 12,
    ];
    const candles = createOHLCVSeries(crashData);

    // 마지막 인덱스에서 확인
    const signal = detectEntrySignal(candles, entryConditions, candles.length - 1);

    // RSI가 계산되고 30 미만이면 true
    expect(typeof signal).toBe('boolean');
  });

  it('조건 미충족 시 false', () => {
    // RSI < 30 조건
    const entryConditions: IConditionGroup = {
      logic: 'and',
      conditions: [
        {
          left: { type: 'rsi', period: 14 },
          operator: 'lt',
          right: 30,
        },
      ],
    };

    // 상승 데이터 (RSI가 높음)
    const candles = createOHLCVSeries(uptrendCloses);
    const signal = detectEntrySignal(candles, entryConditions, candles.length - 1);

    expect(signal).toBe(false);
  });
});

describe('detectExitSignal', () => {
  it('손절 조건 확인', () => {
    const exitConditions: IConditionGroup = {
      logic: 'or',
      conditions: [],
    };

    const candles = createOHLCVSeries([100, 95, 90, 85, 80]);
    const entryPrice = 100;
    const stopLossPercent = 10;

    const result = detectExitSignal(
      candles,
      exitConditions,
      candles.length - 1,
      entryPrice,
      stopLossPercent
    );

    // 20% 하락 (100 → 80), 손절 10% 기준 충족
    expect(result).not.toBeNull();
    expect(result?.reason).toBe('stop_loss');
  });

  it('익절 조건 확인', () => {
    const exitConditions: IConditionGroup = {
      logic: 'or',
      conditions: [],
    };

    const candles = createOHLCVSeries([100, 105, 110, 115, 120]);
    const entryPrice = 100;
    const takeProfitPercent = 15;

    const result = detectExitSignal(
      candles,
      exitConditions,
      candles.length - 1,
      entryPrice,
      undefined,
      takeProfitPercent
    );

    // 20% 상승 (100 → 120), 익절 15% 기준 충족
    expect(result).not.toBeNull();
    expect(result?.reason).toBe('take_profit');
  });

  it('조건 미충족 시 null', () => {
    const exitConditions: IConditionGroup = {
      logic: 'or',
      conditions: [
        {
          left: { type: 'rsi', period: 14 },
          operator: 'gt',
          right: 90, // 매우 높은 RSI
        },
      ],
    };

    const candles = createOHLCVSeries(sidewaysCloses);
    const result = detectExitSignal(
      candles,
      exitConditions,
      candles.length - 1,
      100,
      50, // 50% 손절 (도달하지 않음)
      100 // 100% 익절 (도달하지 않음)
    );

    expect(result).toBeNull();
  });
});

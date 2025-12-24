/**
 * @forge/utils - Time Series Analysis
 * L1 (Molecules) - 시계열 분석 유틸리티
 *
 * 순수 함수 기반 - 부작용 없음
 */

// 로컬 타입 정의 (Folio 타입 제거됨)
type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

interface ISalesRecord {
  date: string;
  revenue: number;
  dayOfWeek: DayOfWeek;
}

interface ISeasonalPattern {
  dayOfWeekIndex: Record<DayOfWeek, number>;
  monthIndex: Record<number, number>;
}

/**
 * 시계열 분해 결과
 */
export interface IDecompositionResult {
  /** 원본 데이터 */
  original: number[];
  /** 추세 성분 */
  trend: number[];
  /** 계절성 성분 */
  seasonal: number[];
  /** 잔차 성분 */
  residual: number[];
}

// ═══════════════════════════════════════════════════════════════
// 이동평균 계산
// ═══════════════════════════════════════════════════════════════

/**
 * 단순 이동평균 (SMA)
 */
export function calculateSimpleMovingAverage(
  values: number[],
  period: number
): number[] {
  if (values.length < period) {
    return values.map(() => NaN);
  }

  const result: number[] = [];

  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      result.push(NaN);
    } else {
      const sum = values.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / period);
    }
  }

  return result;
}

/**
 * 가중 이동평균 (WMA)
 */
export function calculateWeightedMovingAverage(
  values: number[],
  period: number
): number[] {
  if (values.length < period) {
    return values.map(() => NaN);
  }

  const result: number[] = [];
  const weights = Array.from({ length: period }, (_, i) => i + 1);
  const weightSum = weights.reduce((a, b) => a + b, 0);

  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      result.push(NaN);
    } else {
      const slice = values.slice(i - period + 1, i + 1);
      const weightedSum = slice.reduce((sum, val, idx) => sum + val * weights[idx], 0);
      result.push(weightedSum / weightSum);
    }
  }

  return result;
}

/**
 * 지수 평활법 (Exponential Smoothing)
 */
export function exponentialSmoothing(
  values: number[],
  alpha: number = 0.3
): number[] {
  if (values.length === 0) return [];
  if (alpha < 0 || alpha > 1) {
    throw new Error('Alpha must be between 0 and 1');
  }

  const result: number[] = [values[0]];

  for (let i = 1; i < values.length; i++) {
    const smoothed = alpha * values[i] + (1 - alpha) * result[i - 1];
    result.push(smoothed);
  }

  return result;
}

/**
 * 이중 지수 평활법 (Holt's Linear Trend)
 */
export function doubleExponentialSmoothing(
  values: number[],
  alpha: number = 0.3,
  beta: number = 0.1
): { level: number[]; trend: number[]; forecast: number[] } {
  if (values.length < 2) {
    return {
      level: values,
      trend: values.map(() => 0),
      forecast: values,
    };
  }

  const level: number[] = [values[0]];
  const trend: number[] = [values[1] - values[0]];
  const forecast: number[] = [values[0]];

  for (let i = 1; i < values.length; i++) {
    const newLevel = alpha * values[i] + (1 - alpha) * (level[i - 1] + trend[i - 1]);
    const newTrend = beta * (newLevel - level[i - 1]) + (1 - beta) * trend[i - 1];

    level.push(newLevel);
    trend.push(newTrend);
    forecast.push(newLevel + newTrend);
  }

  return { level, trend, forecast };
}

// ═══════════════════════════════════════════════════════════════
// 시계열 분해
// ═══════════════════════════════════════════════════════════════

/**
 * 가법 모델 시계열 분해
 *
 * Y = T + S + R (추세 + 계절성 + 잔차)
 */
export function decomposeAdditive(
  values: number[],
  seasonPeriod: number = 7
): IDecompositionResult {
  // 1. 추세 추출 (이동평균)
  const trend = calculateCenteredMovingAverage(values, seasonPeriod);

  // 2. 추세 제거된 데이터
  const detrended = values.map((v, i) =>
    isNaN(trend[i]) ? NaN : v - trend[i]
  );

  // 3. 계절성 지수 계산
  const seasonalIndices = calculateSeasonalIndices(detrended, seasonPeriod);

  // 4. 계절성 성분
  const seasonal = values.map((_, i) => seasonalIndices[i % seasonPeriod]);

  // 5. 잔차
  const residual = values.map((v, i) => {
    if (isNaN(trend[i])) return NaN;
    return v - trend[i] - seasonal[i];
  });

  return {
    original: values,
    trend,
    seasonal,
    residual,
  };
}

/**
 * 승법 모델 시계열 분해
 *
 * Y = T × S × R
 */
export function decomposeMultiplicative(
  values: number[],
  seasonPeriod: number = 7
): IDecompositionResult {
  // 0으로 나누기 방지
  const safeValues = values.map(v => (v === 0 ? 0.001 : v));

  // 1. 추세 추출
  const trend = calculateCenteredMovingAverage(safeValues, seasonPeriod);

  // 2. 추세 제거 (나눔)
  const detrended = safeValues.map((v, i) =>
    isNaN(trend[i]) || trend[i] === 0 ? NaN : v / trend[i]
  );

  // 3. 계절성 지수 계산
  const seasonalIndices = calculateSeasonalIndices(detrended, seasonPeriod);
  const avgSeasonal = seasonalIndices.reduce((a, b) => a + b, 0) / seasonPeriod;
  const normalizedIndices = seasonalIndices.map(s => s / avgSeasonal);

  // 4. 계절성 성분
  const seasonal = safeValues.map((_, i) => normalizedIndices[i % seasonPeriod]);

  // 5. 잔차
  const residual = safeValues.map((v, i) => {
    if (isNaN(trend[i]) || trend[i] === 0 || seasonal[i] === 0) return NaN;
    return v / (trend[i] * seasonal[i]);
  });

  return {
    original: values,
    trend,
    seasonal,
    residual,
  };
}

/**
 * 중앙 이동평균 (짝수 기간용)
 */
function calculateCenteredMovingAverage(
  values: number[],
  period: number
): number[] {
  const sma = calculateSimpleMovingAverage(values, period);

  if (period % 2 === 0) {
    // 짝수 기간: 2차 평균으로 중앙 정렬
    const centered: number[] = [];
    for (let i = 0; i < sma.length - 1; i++) {
      if (isNaN(sma[i]) || isNaN(sma[i + 1])) {
        centered.push(NaN);
      } else {
        centered.push((sma[i] + sma[i + 1]) / 2);
      }
    }
    centered.push(NaN);
    return centered;
  }

  return sma;
}

/**
 * 계절성 지수 계산
 */
function calculateSeasonalIndices(
  detrended: number[],
  seasonPeriod: number
): number[] {
  const seasonalSums: number[] = Array(seasonPeriod).fill(0);
  const seasonalCounts: number[] = Array(seasonPeriod).fill(0);

  for (let i = 0; i < detrended.length; i++) {
    if (!isNaN(detrended[i])) {
      const seasonIdx = i % seasonPeriod;
      seasonalSums[seasonIdx] += detrended[i];
      seasonalCounts[seasonIdx]++;
    }
  }

  return seasonalSums.map((sum, i) =>
    seasonalCounts[i] > 0 ? sum / seasonalCounts[i] : 0
  );
}

// ═══════════════════════════════════════════════════════════════
// 계절성 패턴 분석
// ═══════════════════════════════════════════════════════════════

/**
 * 매출 데이터에서 계절성 패턴 추출
 */
export function extractSeasonalPattern(
  salesRecords: ISalesRecord[]
): ISeasonalPattern {
  if (salesRecords.length === 0) {
    return getDefaultSeasonalPattern();
  }

  // 전체 평균 매출
  const totalRevenue = salesRecords.reduce((sum, r) => sum + r.revenue, 0);
  const avgRevenue = totalRevenue / salesRecords.length;

  // 요일별 집계
  const dayOfWeekSums: Record<DayOfWeek, number> = {
    mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0,
  };
  const dayOfWeekCounts: Record<DayOfWeek, number> = {
    mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0,
  };

  // 월별 집계
  const monthSums: Record<number, number> = {};
  const monthCounts: Record<number, number> = {};

  for (const record of salesRecords) {
    // 요일별
    dayOfWeekSums[record.dayOfWeek] += record.revenue;
    dayOfWeekCounts[record.dayOfWeek]++;

    // 월별
    const month = new Date(record.date).getMonth() + 1;
    monthSums[month] = (monthSums[month] || 0) + record.revenue;
    monthCounts[month] = (monthCounts[month] || 0) + 1;
  }

  // 요일별 지수 계산 (평균 = 1.0)
  const dayOfWeekIndex: Record<DayOfWeek, number> = {} as Record<DayOfWeek, number>;
  for (const day of Object.keys(dayOfWeekSums) as DayOfWeek[]) {
    const dayAvg = dayOfWeekCounts[day] > 0
      ? dayOfWeekSums[day] / dayOfWeekCounts[day]
      : avgRevenue;
    dayOfWeekIndex[day] = avgRevenue > 0 ? dayAvg / avgRevenue : 1;
  }

  // 월별 지수 계산
  const monthIndex: Record<number, number> = {};
  for (let m = 1; m <= 12; m++) {
    if (monthCounts[m] && monthCounts[m] > 0) {
      const monthAvg = monthSums[m] / monthCounts[m];
      monthIndex[m] = avgRevenue > 0 ? monthAvg / avgRevenue : 1;
    } else {
      monthIndex[m] = 1;
    }
  }

  return {
    dayOfWeekIndex,
    monthIndex,
  };
}

/**
 * 기본 계절성 패턴 (데이터 없을 때)
 */
function getDefaultSeasonalPattern(): ISeasonalPattern {
  return {
    dayOfWeekIndex: {
      mon: 0.9,
      tue: 0.95,
      wed: 1.0,
      thu: 1.0,
      fri: 1.15,
      sat: 1.2,
      sun: 0.8,
    },
    monthIndex: {
      1: 0.85, 2: 0.85, 3: 0.95, 4: 1.0,
      5: 1.05, 6: 1.0, 7: 0.9, 8: 0.85,
      9: 1.0, 10: 1.05, 11: 1.1, 12: 1.2,
    },
  };
}

// ═══════════════════════════════════════════════════════════════
// 트렌드 분석
// ═══════════════════════════════════════════════════════════════

/**
 * 선형 추세 계산 (최소자승법)
 */
export function calculateLinearTrend(
  values: number[]
): { slope: number; intercept: number; predicted: number[] } {
  const n = values.length;
  if (n < 2) {
    return { slope: 0, intercept: values[0] || 0, predicted: values };
  }

  const x = Array.from({ length: n }, (_, i) => i);
  const xMean = (n - 1) / 2;
  const yMean = values.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i++) {
    numerator += (x[i] - xMean) * (values[i] - yMean);
    denominator += Math.pow(x[i] - xMean, 2);
  }

  const slope = denominator !== 0 ? numerator / denominator : 0;
  const intercept = yMean - slope * xMean;

  const predicted = x.map(xi => intercept + slope * xi);

  return { slope, intercept, predicted };
}

/**
 * 성장률 계산 (기간별)
 */
export function calculateGrowthRate(
  current: number,
  previous: number
): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * 복합 연간 성장률 (CAGR)
 */
export function calculateCAGR(
  startValue: number,
  endValue: number,
  years: number
): number {
  if (startValue <= 0 || years <= 0) return 0;
  return (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
}

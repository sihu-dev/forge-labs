/**
 * @forge/utils - Forecast Calculation Utilities
 * L1 (Molecules) - 매출 예측 계산
 *
 * 순수 함수 기반 - 부작용 없음
 */

import type { FolioTypes } from '@forge/types';

type DayOfWeek = FolioTypes.DayOfWeek;
type ISeasonalPattern = FolioTypes.ISeasonalPattern;
type IExternalFactors = FolioTypes.IExternalFactors;
type IFactorContribution = FolioTypes.IFactorContribution;
type IConfidenceInterval = FolioTypes.IConfidenceInterval;

/**
 * 단순 예측 결과
 */
export interface ISimpleForecast {
  /** 예측값 */
  predicted: number;
  /** 기본값 (조정 전) */
  baseValue: number;
  /** 조정 내역 */
  adjustments: IFactorContribution[];
}

// ═══════════════════════════════════════════════════════════════
// 기본 예측 모델
// ═══════════════════════════════════════════════════════════════

/**
 * 단순 이동평균 예측
 *
 * 최근 N일 평균을 예측값으로 사용
 */
export function forecastSimpleMA(
  historicalValues: number[],
  period: number = 7
): number {
  if (historicalValues.length === 0) return 0;

  const relevantValues = historicalValues.slice(-period);
  return relevantValues.reduce((a, b) => a + b, 0) / relevantValues.length;
}

/**
 * 가중 이동평균 예측
 *
 * 최근 데이터에 더 높은 가중치
 */
export function forecastWeightedMA(
  historicalValues: number[],
  period: number = 7
): number {
  if (historicalValues.length === 0) return 0;

  const relevantValues = historicalValues.slice(-period);
  const weights = relevantValues.map((_, i) => i + 1);
  const weightSum = weights.reduce((a, b) => a + b, 0);

  const weightedSum = relevantValues.reduce(
    (sum, val, i) => sum + val * weights[i],
    0
  );

  return weightedSum / weightSum;
}

/**
 * 지수 평활 예측
 */
export function forecastExponential(
  historicalValues: number[],
  alpha: number = 0.3
): number {
  if (historicalValues.length === 0) return 0;

  let forecast = historicalValues[0];
  for (let i = 1; i < historicalValues.length; i++) {
    forecast = alpha * historicalValues[i] + (1 - alpha) * forecast;
  }

  return forecast;
}

/**
 * Holt 선형 추세 예측
 *
 * 추세를 반영한 예측
 */
export function forecastHoltLinear(
  historicalValues: number[],
  periodsAhead: number = 1,
  alpha: number = 0.3,
  beta: number = 0.1
): number[] {
  if (historicalValues.length < 2) {
    return Array(periodsAhead).fill(historicalValues[0] || 0);
  }

  // 초기화
  let level = historicalValues[0];
  let trend = historicalValues[1] - historicalValues[0];

  // 학습
  for (let i = 1; i < historicalValues.length; i++) {
    const newLevel = alpha * historicalValues[i] + (1 - alpha) * (level + trend);
    const newTrend = beta * (newLevel - level) + (1 - beta) * trend;
    level = newLevel;
    trend = newTrend;
  }

  // 예측
  const forecasts: number[] = [];
  for (let h = 1; h <= periodsAhead; h++) {
    forecasts.push(level + h * trend);
  }

  return forecasts;
}

// ═══════════════════════════════════════════════════════════════
// 계절성 조정
// ═══════════════════════════════════════════════════════════════

/**
 * 계절성 조정 적용
 */
export function applySeasonalAdjustment(
  baseValue: number,
  dayOfWeek: DayOfWeek,
  month: number,
  pattern: ISeasonalPattern
): { adjusted: number; contribution: IFactorContribution } {
  const dayIndex = pattern.dayOfWeekIndex[dayOfWeek] || 1;
  const monthIndex = pattern.monthIndex[month] || 1;

  // 복합 계절 지수
  const combinedIndex = dayIndex * monthIndex;
  const adjusted = baseValue * combinedIndex;

  const contribution: IFactorContribution = {
    type: 'seasonality',
    name: '계절성',
    contribution: adjusted - baseValue,
    contributionPercent: (combinedIndex - 1) * 100,
    direction: combinedIndex >= 1 ? 'positive' : 'negative',
    description: `${dayOfWeek} 지수: ${dayIndex.toFixed(2)}, ${month}월 지수: ${monthIndex.toFixed(2)}`,
  };

  return { adjusted, contribution };
}

// ═══════════════════════════════════════════════════════════════
// 외부 요인 조정
// ═══════════════════════════════════════════════════════════════

/**
 * 날씨 영향 계수 계산
 */
export function calculateWeatherImpact(
  weather: FolioTypes.IWeatherData
): { factor: number; contribution: IFactorContribution } {
  let factor = 1.0;
  const reasons: string[] = [];

  // 기온 영향 (적정 온도 15-25°C 기준)
  if (weather.temperature < 0) {
    factor *= 0.85;
    reasons.push('영하 기온');
  } else if (weather.temperature < 10) {
    factor *= 0.92;
    reasons.push('낮은 기온');
  } else if (weather.temperature > 35) {
    factor *= 0.88;
    reasons.push('폭염');
  } else if (weather.temperature > 30) {
    factor *= 0.95;
    reasons.push('높은 기온');
  }

  // 강수량 영향
  if (weather.precipitation > 50) {
    factor *= 0.7;
    reasons.push('폭우');
  } else if (weather.precipitation > 20) {
    factor *= 0.8;
    reasons.push('비');
  } else if (weather.precipitation > 5) {
    factor *= 0.9;
    reasons.push('약한 비');
  }

  // 날씨 상태
  if (weather.condition === 'stormy') {
    factor *= 0.6;
    reasons.push('악천후');
  } else if (weather.condition === 'snowy') {
    factor *= 0.75;
    reasons.push('눈');
  }

  const contribution: IFactorContribution = {
    type: 'weather',
    name: '날씨',
    contribution: 0, // 나중에 계산
    contributionPercent: (factor - 1) * 100,
    direction: factor >= 1 ? 'positive' : 'negative',
    description: reasons.length > 0 ? reasons.join(', ') : '양호한 날씨',
  };

  return { factor, contribution };
}

/**
 * 휴일 영향 계수 계산
 */
export function calculateHolidayImpact(
  holiday: FolioTypes.IHolidayData | undefined
): { factor: number; contribution: IFactorContribution } {
  if (!holiday) {
    return {
      factor: 1.0,
      contribution: {
        type: 'holiday',
        name: '휴일',
        contribution: 0,
        contributionPercent: 0,
        direction: 'neutral',
        description: '평일',
      },
    };
  }

  // 휴일 타입에 따른 기본 계수
  let baseFactor: number;
  switch (holiday.type) {
    case 'national':
      baseFactor = holiday.expectedImpact >= 4 ? 1.3 : 0.8;
      break;
    case 'regional':
      baseFactor = holiday.expectedImpact >= 3 ? 1.2 : 1.0;
      break;
    case 'school':
      baseFactor = 1.1;
      break;
    default:
      baseFactor = 1.0;
  }

  // expectedImpact으로 조정 (1-5 스케일)
  const impactAdjustment = (holiday.expectedImpact - 3) * 0.1;
  const factor = baseFactor + impactAdjustment;

  const contribution: IFactorContribution = {
    type: 'holiday',
    name: holiday.name,
    contribution: 0,
    contributionPercent: (factor - 1) * 100,
    direction: factor >= 1 ? 'positive' : 'negative',
    description: `${holiday.type} 휴일 (영향도: ${holiday.expectedImpact}/5)`,
  };

  return { factor, contribution };
}

/**
 * 이벤트 영향 계수 계산
 */
export function calculateEventImpact(
  events: FolioTypes.IEventData[] | undefined
): { factor: number; contribution: IFactorContribution } {
  if (!events || events.length === 0) {
    return {
      factor: 1.0,
      contribution: {
        type: 'event',
        name: '이벤트',
        contribution: 0,
        contributionPercent: 0,
        direction: 'neutral',
        description: '예정된 이벤트 없음',
      },
    };
  }

  // 모든 이벤트 영향 합산 (곱셈)
  let combinedFactor = 1.0;
  const eventNames: string[] = [];

  for (const event of events) {
    combinedFactor *= event.impactFactor;
    eventNames.push(event.name);
  }

  const contribution: IFactorContribution = {
    type: 'event',
    name: '이벤트',
    contribution: 0,
    contributionPercent: (combinedFactor - 1) * 100,
    direction: combinedFactor >= 1 ? 'positive' : 'negative',
    description: eventNames.join(', '),
  };

  return { factor: combinedFactor, contribution };
}

/**
 * 외부 요인 통합 적용
 */
export function applyExternalFactors(
  baseValue: number,
  factors: IExternalFactors
): { adjusted: number; contributions: IFactorContribution[] } {
  const contributions: IFactorContribution[] = [];
  let adjusted = baseValue;

  // 날씨
  if (factors.weather) {
    const { factor, contribution } = calculateWeatherImpact(factors.weather);
    const oldValue = adjusted;
    adjusted *= factor;
    contribution.contribution = adjusted - oldValue;
    contributions.push(contribution);
  }

  // 휴일
  const { factor: holidayFactor, contribution: holidayContrib } =
    calculateHolidayImpact(factors.holiday);
  const beforeHoliday = adjusted;
  adjusted *= holidayFactor;
  holidayContrib.contribution = adjusted - beforeHoliday;
  contributions.push(holidayContrib);

  // 이벤트
  if (factors.events) {
    const { factor, contribution } = calculateEventImpact(factors.events);
    const beforeEvent = adjusted;
    adjusted *= factor;
    contribution.contribution = adjusted - beforeEvent;
    contributions.push(contribution);
  }

  return { adjusted, contributions };
}

// ═══════════════════════════════════════════════════════════════
// 신뢰구간 계산
// ═══════════════════════════════════════════════════════════════

/**
 * 예측 오차 기반 신뢰구간 계산
 */
export function calculateConfidenceInterval(
  predicted: number,
  historicalErrors: number[],
  confidenceLevel: number = 95
): IConfidenceInterval {
  if (historicalErrors.length === 0) {
    // 기본 ±20%
    const margin = predicted * 0.2;
    return { lower: predicted - margin, upper: predicted + margin, level: confidenceLevel };
  }

  // 표준편차 계산
  const mean = historicalErrors.reduce((a, b) => a + b, 0) / historicalErrors.length;
  const variance = historicalErrors.reduce((sum, e) => sum + Math.pow(e - mean, 2), 0) / historicalErrors.length;
  const stdDev = Math.sqrt(variance);

  // Z-score (정규분포 가정)
  const zScore = confidenceLevel === 95 ? 1.96 : confidenceLevel === 80 ? 1.28 : 1.645;

  const margin = zScore * stdDev;

  return {
    lower: Math.max(0, predicted - margin),
    upper: predicted + margin,
    level: confidenceLevel,
  };
}

/**
 * 백분율 기반 간단한 신뢰구간
 */
export function calculateSimpleConfidenceInterval(
  predicted: number,
  confidenceLevel: number = 95
): IConfidenceInterval {
  // 신뢰수준에 따른 마진
  const marginPercent = confidenceLevel === 95 ? 0.25 : confidenceLevel === 80 ? 0.15 : 0.2;

  return {
    lower: predicted * (1 - marginPercent),
    upper: predicted * (1 + marginPercent),
    level: confidenceLevel,
  };
}

// ═══════════════════════════════════════════════════════════════
// 예측 정확도 평가
// ═══════════════════════════════════════════════════════════════

/**
 * MAPE (Mean Absolute Percentage Error) 계산
 */
export function calculateMAPE(
  actuals: number[],
  predictions: number[]
): number {
  if (actuals.length !== predictions.length || actuals.length === 0) {
    return NaN;
  }

  let sum = 0;
  let count = 0;

  for (let i = 0; i < actuals.length; i++) {
    if (actuals[i] !== 0) {
      sum += Math.abs((actuals[i] - predictions[i]) / actuals[i]);
      count++;
    }
  }

  return count > 0 ? (sum / count) * 100 : NaN;
}

/**
 * RMSE (Root Mean Square Error) 계산
 */
export function calculateRMSE(
  actuals: number[],
  predictions: number[]
): number {
  if (actuals.length !== predictions.length || actuals.length === 0) {
    return NaN;
  }

  const squaredErrors = actuals.map(
    (actual, i) => Math.pow(actual - predictions[i], 2)
  );
  const meanSquaredError = squaredErrors.reduce((a, b) => a + b, 0) / actuals.length;

  return Math.sqrt(meanSquaredError);
}

/**
 * MAE (Mean Absolute Error) 계산
 */
export function calculateMAE(
  actuals: number[],
  predictions: number[]
): number {
  if (actuals.length !== predictions.length || actuals.length === 0) {
    return NaN;
  }

  const absoluteErrors = actuals.map(
    (actual, i) => Math.abs(actual - predictions[i])
  );

  return absoluteErrors.reduce((a, b) => a + b, 0) / actuals.length;
}

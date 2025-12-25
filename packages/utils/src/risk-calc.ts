/**
 * @forge/utils - Risk Calculation Utilities
 * L1 (Molecules) - 리스크 계산 유틸리티
 *
 * 순수 함수 기반 - 부작용 없음
 */

import type { HephaitosTypes } from '@forge/types';

type RiskLevel = HephaitosTypes.RiskLevel;
type VaRMethod = HephaitosTypes.VaRMethod;
type IVaRResult = HephaitosTypes.IVaRResult;
type ICVaRResult = HephaitosTypes.ICVaRResult;
type IDrawdownAnalysis = HephaitosTypes.IDrawdownAnalysis;
type IPositionSizeRecommendation = HephaitosTypes.IPositionSizeRecommendation;

/**
 * 연간 거래일 수
 */
const TRADING_DAYS_PER_YEAR = 252;

/**
 * 무위험 수익률 (연 2%)
 */
const RISK_FREE_RATE = 0.02;

// ═══════════════════════════════════════════════════════════════
// VaR (Value at Risk) 계산
// ═══════════════════════════════════════════════════════════════

/**
 * 역사적 VaR 계산
 *
 * 과거 수익률 분포에서 백분위수 기반 계산
 *
 * @param returns - 일별 수익률 배열 (소수점, 예: 0.01 = 1%)
 * @param portfolioValue - 포트폴리오 총 가치
 * @param confidenceLevel - 신뢰수준 (예: 0.95 = 95%)
 * @param holdingPeriod - 보유기간 (일)
 */
export function calculateHistoricalVaR(
  returns: number[],
  portfolioValue: number,
  confidenceLevel: number = 0.95,
  holdingPeriod: number = 1
): IVaRResult {
  if (returns.length === 0) {
    return createEmptyVaR(portfolioValue, confidenceLevel, holdingPeriod, 'historical');
  }

  // 수익률 정렬 (오름차순)
  const sortedReturns = [...returns].sort((a, b) => a - b);

  // 백분위수 인덱스 계산
  const percentileIndex = Math.floor((1 - confidenceLevel) * sortedReturns.length);
  const varReturn = sortedReturns[Math.max(0, percentileIndex)];

  // 보유기간 조정 (√T 룰)
  const adjustedVarReturn = varReturn * Math.sqrt(holdingPeriod);

  // VaR 값 계산 (손실이므로 음수를 양수로)
  const varValue = Math.abs(adjustedVarReturn * portfolioValue);
  const varPercentage = Math.abs(adjustedVarReturn) * 100;

  return {
    value: varValue,
    percentage: varPercentage,
    confidenceLevel,
    holdingPeriod,
    method: 'historical',
    calculatedAt: new Date().toISOString(),
  };
}

/**
 * 모수적 VaR 계산 (정규분포 가정)
 *
 * @param returns - 일별 수익률 배열
 * @param portfolioValue - 포트폴리오 총 가치
 * @param confidenceLevel - 신뢰수준
 * @param holdingPeriod - 보유기간 (일)
 */
export function calculateParametricVaR(
  returns: number[],
  portfolioValue: number,
  confidenceLevel: number = 0.95,
  holdingPeriod: number = 1
): IVaRResult {
  if (returns.length < 2) {
    return createEmptyVaR(portfolioValue, confidenceLevel, holdingPeriod, 'parametric');
  }

  const meanReturn = mean(returns);
  const stdDev = standardDeviation(returns);

  // Z-score (정규분포 가정)
  const zScore = getZScore(confidenceLevel);

  // VaR = μ - z × σ (손실이므로 음수 방향)
  const varReturn = meanReturn - zScore * stdDev;

  // 보유기간 조정
  const adjustedVarReturn = varReturn * Math.sqrt(holdingPeriod);

  const varValue = Math.abs(adjustedVarReturn * portfolioValue);
  const varPercentage = Math.abs(adjustedVarReturn) * 100;

  return {
    value: varValue,
    percentage: varPercentage,
    confidenceLevel,
    holdingPeriod,
    method: 'parametric',
    calculatedAt: new Date().toISOString(),
  };
}

/**
 * 몬테카를로 VaR 계산
 *
 * @param returns - 일별 수익률 배열
 * @param portfolioValue - 포트폴리오 총 가치
 * @param confidenceLevel - 신뢰수준
 * @param holdingPeriod - 보유기간 (일)
 * @param simulations - 시뮬레이션 횟수
 */
export function calculateMonteCarloVaR(
  returns: number[],
  portfolioValue: number,
  confidenceLevel: number = 0.95,
  holdingPeriod: number = 1,
  simulations: number = 10000
): IVaRResult {
  if (returns.length < 2) {
    return createEmptyVaR(portfolioValue, confidenceLevel, holdingPeriod, 'monte_carlo');
  }

  const meanReturn = mean(returns);
  const stdDev = standardDeviation(returns);

  // 몬테카를로 시뮬레이션
  const simulatedReturns: number[] = [];
  for (let i = 0; i < simulations; i++) {
    let cumulativeReturn = 0;
    for (let d = 0; d < holdingPeriod; d++) {
      // Box-Muller 변환으로 정규분포 난수 생성
      const u1 = Math.random();
      const u2 = Math.random();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      const dailyReturn = meanReturn + stdDev * z;
      cumulativeReturn += dailyReturn;
    }
    simulatedReturns.push(cumulativeReturn);
  }

  // 정렬 후 백분위수 추출
  simulatedReturns.sort((a, b) => a - b);
  const percentileIndex = Math.floor((1 - confidenceLevel) * simulations);
  const varReturn = simulatedReturns[Math.max(0, percentileIndex)];

  const varValue = Math.abs(varReturn * portfolioValue);
  const varPercentage = Math.abs(varReturn) * 100;

  return {
    value: varValue,
    percentage: varPercentage,
    confidenceLevel,
    holdingPeriod,
    method: 'monte_carlo',
    calculatedAt: new Date().toISOString(),
  };
}

/**
 * VaR 계산 (방법 선택)
 */
export function calculateVaR(
  returns: number[],
  portfolioValue: number,
  options: {
    method?: VaRMethod;
    confidenceLevel?: number;
    holdingPeriod?: number;
  } = {}
): IVaRResult {
  const {
    method = 'historical',
    confidenceLevel = 0.95,
    holdingPeriod = 1,
  } = options;

  switch (method) {
    case 'historical':
      return calculateHistoricalVaR(returns, portfolioValue, confidenceLevel, holdingPeriod);
    case 'parametric':
      return calculateParametricVaR(returns, portfolioValue, confidenceLevel, holdingPeriod);
    case 'monte_carlo':
      return calculateMonteCarloVaR(returns, portfolioValue, confidenceLevel, holdingPeriod);
    default:
      return calculateHistoricalVaR(returns, portfolioValue, confidenceLevel, holdingPeriod);
  }
}

// ═══════════════════════════════════════════════════════════════
// CVaR (Conditional VaR / Expected Shortfall)
// ═══════════════════════════════════════════════════════════════

/**
 * CVaR 계산 (Expected Shortfall)
 *
 * VaR를 초과하는 손실의 기대값
 *
 * @param returns - 일별 수익률 배열
 * @param portfolioValue - 포트폴리오 총 가치
 * @param confidenceLevel - 신뢰수준
 * @param holdingPeriod - 보유기간 (일)
 */
export function calculateCVaR(
  returns: number[],
  portfolioValue: number,
  confidenceLevel: number = 0.95,
  holdingPeriod: number = 1
): ICVaRResult {
  if (returns.length === 0) {
    const baseVaR = createEmptyVaR(portfolioValue, confidenceLevel, holdingPeriod, 'historical');
    return {
      ...baseVaR,
      cvarValue: 0,
      cvarPercentage: 0,
    };
  }

  // VaR 먼저 계산
  const varResult = calculateHistoricalVaR(returns, portfolioValue, confidenceLevel, holdingPeriod);

  // VaR 이하 수익률들의 평균 (Expected Shortfall)
  const sortedReturns = [...returns].sort((a, b) => a - b);
  const cutoffIndex = Math.floor((1 - confidenceLevel) * sortedReturns.length);
  const tailReturns = sortedReturns.slice(0, Math.max(1, cutoffIndex));

  const avgTailReturn = mean(tailReturns);
  const adjustedTailReturn = avgTailReturn * Math.sqrt(holdingPeriod);

  const cvarValue = Math.abs(adjustedTailReturn * portfolioValue);
  const cvarPercentage = Math.abs(adjustedTailReturn) * 100;

  return {
    ...varResult,
    cvarValue,
    cvarPercentage,
  };
}

// ═══════════════════════════════════════════════════════════════
// 드로다운 분석
// ═══════════════════════════════════════════════════════════════

/**
 * 드로다운 분석 수행
 *
 * @param equityValues - 시계열 자산 가치 배열
 * @param timestamps - 시계열 타임스탬프 배열
 */
export function analyzeDrawdown(
  equityValues: number[],
  timestamps: string[]
): IDrawdownAnalysis {
  if (equityValues.length === 0) {
    return createEmptyDrawdownAnalysis();
  }

  let peak = equityValues[0];
  let peakIndex = 0;
  let maxDrawdown = 0;
  let maxDrawdownIndex = 0;
  let currentDrawdown = 0;
  let drawdownStartIndex = 0;
  let maxDuration = 0;
  let currentDuration = 0;
  let drawdownCount = 0;
  let significantDrawdowns = 0;
  let inDrawdown = false;

  const drawdowns: number[] = [];

  for (let i = 0; i < equityValues.length; i++) {
    const value = equityValues[i];

    if (value > peak) {
      // 새 고점
      if (inDrawdown) {
        inDrawdown = false;
        const duration = i - drawdownStartIndex;
        maxDuration = Math.max(maxDuration, duration);
      }
      peak = value;
      peakIndex = i;
      currentDrawdown = 0;
      currentDuration = 0;
    } else {
      // 드로다운 상태
      const dd = ((peak - value) / peak) * 100;
      currentDrawdown = dd;

      if (!inDrawdown && dd > 0) {
        inDrawdown = true;
        drawdownStartIndex = peakIndex;
        drawdownCount++;
        if (dd >= 5) significantDrawdowns++;
      }

      drawdowns.push(dd);

      if (dd > maxDrawdown) {
        maxDrawdown = dd;
        maxDrawdownIndex = i;
      }

      currentDuration = i - peakIndex;
    }
  }

  // 현재 드로다운 중인 경우 duration 계산
  if (inDrawdown) {
    maxDuration = Math.max(maxDuration, equityValues.length - 1 - drawdownStartIndex);
  }

  const avgDrawdown = drawdowns.length > 0 ? mean(drawdowns.filter(d => d > 0)) : 0;

  // 회복 예상 기간 (과거 평균 기반, 단순 추정)
  const estimatedRecovery = currentDrawdown > 0 && maxDuration > 0
    ? Math.ceil((currentDrawdown / maxDrawdown) * maxDuration)
    : null;

  return {
    currentDrawdown,
    maxDrawdown,
    maxDrawdownDate: timestamps[maxDrawdownIndex] || new Date().toISOString(),
    avgDrawdown,
    currentDuration,
    maxDuration,
    estimatedRecovery,
    drawdownCount,
    significantDrawdowns,
  };
}

/**
 * 최대 드로다운 계산 (간단 버전)
 */
export function calculateMaxDrawdown(values: number[]): number {
  if (values.length === 0) return 0;

  let peak = values[0];
  let maxDD = 0;

  for (const value of values) {
    if (value > peak) {
      peak = value;
    } else {
      const dd = ((peak - value) / peak) * 100;
      maxDD = Math.max(maxDD, dd);
    }
  }

  return maxDD;
}

/**
 * 현재 드로다운 계산
 */
export function calculateCurrentDrawdown(values: number[]): number {
  if (values.length === 0) return 0;

  const peak = Math.max(...values);
  const current = values[values.length - 1];

  return ((peak - current) / peak) * 100;
}

// ═══════════════════════════════════════════════════════════════
// 리스크 조정 수익률
// ═══════════════════════════════════════════════════════════════

/**
 * 샤프 비율 계산
 */
export function calculateSharpeRatio(
  returns: number[],
  riskFreeRate: number = RISK_FREE_RATE
): number {
  if (returns.length < 2) return 0;

  const avgReturn = mean(returns);
  const stdDev = standardDeviation(returns);

  if (stdDev === 0) return 0;

  // 연환산
  const annualizedReturn = avgReturn * TRADING_DAYS_PER_YEAR;
  const annualizedStdDev = stdDev * Math.sqrt(TRADING_DAYS_PER_YEAR);

  return (annualizedReturn - riskFreeRate) / annualizedStdDev;
}

/**
 * 소르티노 비율 계산
 */
export function calculateSortinoRatio(
  returns: number[],
  riskFreeRate: number = RISK_FREE_RATE
): number {
  if (returns.length < 2) return 0;

  const avgReturn = mean(returns);
  const negativeReturns = returns.filter(r => r < 0);

  if (negativeReturns.length === 0) return Infinity;

  const downsideDeviation = standardDeviation(negativeReturns);
  if (downsideDeviation === 0) return Infinity;

  const annualizedReturn = avgReturn * TRADING_DAYS_PER_YEAR;
  const annualizedDownside = downsideDeviation * Math.sqrt(TRADING_DAYS_PER_YEAR);

  return (annualizedReturn - riskFreeRate) / annualizedDownside;
}

/**
 * 칼마 비율 계산
 */
export function calculateCalmarRatio(
  annualizedReturn: number,
  maxDrawdown: number
): number {
  if (maxDrawdown === 0) return Infinity;
  return annualizedReturn / Math.abs(maxDrawdown);
}

/**
 * 정보 비율 계산 (벤치마크 대비)
 */
export function calculateInformationRatio(
  portfolioReturns: number[],
  benchmarkReturns: number[]
): number {
  if (portfolioReturns.length !== benchmarkReturns.length || portfolioReturns.length < 2) {
    return 0;
  }

  // 초과 수익률 계산
  const excessReturns = portfolioReturns.map((r, i) => r - benchmarkReturns[i]);
  const avgExcess = mean(excessReturns);
  const trackingError = standardDeviation(excessReturns);

  if (trackingError === 0) return 0;

  // 연환산
  const annualizedExcess = avgExcess * TRADING_DAYS_PER_YEAR;
  const annualizedTE = trackingError * Math.sqrt(TRADING_DAYS_PER_YEAR);

  return annualizedExcess / annualizedTE;
}

// ═══════════════════════════════════════════════════════════════
// 변동성 계산
// ═══════════════════════════════════════════════════════════════

/**
 * 일간 변동성 계산
 */
export function calculateDailyVolatility(returns: number[]): number {
  return standardDeviation(returns) * 100;
}

/**
 * 연환산 변동성 계산
 */
export function calculateAnnualizedVolatility(returns: number[]): number {
  const dailyVol = standardDeviation(returns);
  return dailyVol * Math.sqrt(TRADING_DAYS_PER_YEAR) * 100;
}

/**
 * 하방 변동성 계산
 */
export function calculateDownsideVolatility(returns: number[]): number {
  const negativeReturns = returns.filter(r => r < 0);
  if (negativeReturns.length === 0) return 0;
  return standardDeviation(negativeReturns) * Math.sqrt(TRADING_DAYS_PER_YEAR) * 100;
}

/**
 * 베타 계산 (시장 대비)
 */
export function calculateBeta(
  portfolioReturns: number[],
  marketReturns: number[]
): number {
  if (portfolioReturns.length !== marketReturns.length || portfolioReturns.length < 2) {
    return 1;
  }

  const covariance = calculateCovariance(portfolioReturns, marketReturns);
  const marketVariance = variance(marketReturns);

  if (marketVariance === 0) return 1;

  return covariance / marketVariance;
}

// ═══════════════════════════════════════════════════════════════
// 집중도 지표
// ═══════════════════════════════════════════════════════════════

/**
 * 허핀달-허쉬만 지수 (HHI) 계산
 *
 * 포트폴리오 집중도 측정 (0-10000)
 * - 10000: 단일 자산 (최대 집중)
 * - 낮을수록 분산됨
 *
 * @param weights - 자산별 비중 배열 (0-100%)
 */
export function calculateHHI(weights: number[]): number {
  if (weights.length === 0) return 0;
  return weights.reduce((sum, w) => sum + Math.pow(w, 2), 0);
}

/**
 * 상관관계 리스크 점수 계산
 *
 * 자산간 상관관계가 높을수록 분산 효과 감소
 *
 * @param correlationMatrix - 상관관계 행렬
 */
export function calculateCorrelationRisk(correlationMatrix: number[][]): number {
  if (correlationMatrix.length === 0) return 0;

  let totalCorr = 0;
  let count = 0;

  for (let i = 0; i < correlationMatrix.length; i++) {
    for (let j = i + 1; j < correlationMatrix.length; j++) {
      totalCorr += Math.abs(correlationMatrix[i][j]);
      count++;
    }
  }

  if (count === 0) return 0;

  // 평균 절대 상관관계를 0-100 점수로 변환
  return (totalCorr / count) * 100;
}

// ═══════════════════════════════════════════════════════════════
// 포지션 사이징
// ═══════════════════════════════════════════════════════════════

/**
 * 포지션 사이즈 권고
 *
 * Kelly Criterion 기반 + 리스크 제한
 */
export function recommendPositionSize(
  portfolioValue: number,
  expectedVolatility: number,
  stopLossPercent: number,
  riskTolerance: number = 2, // 포트폴리오 대비 최대 리스크 %
  winRate: number = 0.5,
  avgWinLoss: number = 1.5
): IPositionSizeRecommendation {
  // Kelly 비율 계산
  const kellyFraction = winRate - (1 - winRate) / avgWinLoss;
  const halfKelly = Math.max(0, kellyFraction / 2); // Half Kelly (보수적)

  // 변동성 기반 조정
  const volatilityAdjustment = 20 / Math.max(expectedVolatility, 10);

  // 손절 기반 최대 포지션
  const maxRiskAmount = portfolioValue * (riskTolerance / 100);
  const stopLossBasedSize = maxRiskAmount / (stopLossPercent / 100);

  // 최종 권장 사이즈 계산
  const recommendedPercent = Math.min(
    halfKelly * 100 * volatilityAdjustment,
    25 // 최대 25%
  );
  const recommendedSize = portfolioValue * (recommendedPercent / 100);

  // 최대 허용 사이즈
  const maxAllowedPercent = Math.min(stopLossBasedSize / portfolioValue * 100, 30);
  const maxAllowedSize = Math.min(stopLossBasedSize, portfolioValue * 0.3);

  // 리스크 수준 평가
  const riskLevel = assessRiskLevel(recommendedPercent, expectedVolatility);

  return {
    symbol: '',
    recommendedSize,
    recommendedPercent,
    maxAllowedSize,
    maxAllowedPercent,
    basis: {
      portfolioValue,
      riskTolerance,
      expectedVolatility,
      stopLossPercent,
    },
    riskLevel,
    rationale: generatePositionRationale(recommendedPercent, riskLevel, expectedVolatility),
  };
}

// ═══════════════════════════════════════════════════════════════
// 리스크 수준 평가
// ═══════════════════════════════════════════════════════════════

/**
 * 리스크 수준 평가
 */
export function assessRiskLevel(
  positionPercent: number,
  volatility: number
): RiskLevel {
  const riskScore = positionPercent * (volatility / 20);

  if (riskScore <= 5) return 'minimal';
  if (riskScore <= 15) return 'low';
  if (riskScore <= 30) return 'moderate';
  if (riskScore <= 50) return 'high';
  return 'extreme';
}

/**
 * 종합 리스크 점수 계산 (0-100)
 */
export function calculateRiskScore(
  var95: number, // VaR 95% (%)
  maxDrawdown: number, // 최대 드로다운 (%)
  volatility: number, // 연환산 변동성 (%)
  hhi: number // HHI (0-10000)
): number {
  // 각 지표 정규화 (0-25)
  const varScore = Math.min(var95 * 5, 25);
  const ddScore = Math.min(maxDrawdown * 0.83, 25);
  const volScore = Math.min(volatility * 0.5, 25);
  const hhiScore = Math.min(hhi / 400, 25);

  return Math.round(varScore + ddScore + volScore + hhiScore);
}

/**
 * 리스크 점수에서 수준 도출
 */
export function getRiskLevelFromScore(score: number): RiskLevel {
  if (score <= 20) return 'minimal';
  if (score <= 40) return 'low';
  if (score <= 60) return 'moderate';
  if (score <= 80) return 'high';
  return 'extreme';
}

// ═══════════════════════════════════════════════════════════════
// 헬퍼 함수
// ═══════════════════════════════════════════════════════════════

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function variance(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = mean(values);
  return values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
}

function standardDeviation(values: number[]): number {
  return Math.sqrt(variance(values));
}

function calculateCovariance(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length < 2) return 0;
  const meanX = mean(x);
  const meanY = mean(y);
  let covariance = 0;
  for (let i = 0; i < x.length; i++) {
    covariance += (x[i] - meanX) * (y[i] - meanY);
  }
  return covariance / x.length;
}

function getZScore(confidenceLevel: number): number {
  // 일반적인 신뢰수준 Z-score
  const zScores: Record<number, number> = {
    0.90: 1.282,
    0.95: 1.645,
    0.99: 2.326,
  };
  return zScores[confidenceLevel] ?? 1.645;
}

function createEmptyVaR(
  portfolioValue: number,
  confidenceLevel: number,
  holdingPeriod: number,
  method: VaRMethod
): IVaRResult {
  return {
    value: 0,
    percentage: 0,
    confidenceLevel,
    holdingPeriod,
    method,
    calculatedAt: new Date().toISOString(),
  };
}

function createEmptyDrawdownAnalysis(): IDrawdownAnalysis {
  return {
    currentDrawdown: 0,
    maxDrawdown: 0,
    maxDrawdownDate: new Date().toISOString(),
    avgDrawdown: 0,
    currentDuration: 0,
    maxDuration: 0,
    estimatedRecovery: null,
    drawdownCount: 0,
    significantDrawdowns: 0,
  };
}

function generatePositionRationale(
  positionPercent: number,
  riskLevel: RiskLevel,
  volatility: number
): string {
  const messages: Record<RiskLevel, string> = {
    minimal: `낮은 변동성(${volatility.toFixed(1)}%)과 보수적 사이징으로 안전한 포지션`,
    low: `적정 변동성 수준에서 Half Kelly 기반 권장 사이즈`,
    moderate: `변동성 대비 적정 사이즈이나 시장 상황 모니터링 필요`,
    high: `높은 변동성으로 인한 리스크 증가, 사이즈 축소 권장`,
    extreme: `극단적 변동성, 진입 재고 또는 최소 사이즈 권장`,
  };
  return messages[riskLevel];
}

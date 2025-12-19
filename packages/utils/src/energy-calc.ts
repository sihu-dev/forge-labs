/**
 * @forge/utils - Energy Calculation Utilities
 * L1 (Molecules) - 에너지 효율 계산 유틸리티
 *
 * SEC, COP, 효율, 비용, 피크 관리 등
 */

import type { DryonTypes } from '@forge/types';

type TimeOfUse = DryonTypes.TimeOfUse;
type EnergyType = DryonTypes.EnergyType;
type IEnergyReading = DryonTypes.IEnergyReading;
type IEfficiencyBenchmark = DryonTypes.IEfficiencyBenchmark;

// ═══════════════════════════════════════════════════════════════
// 비에너지소비량 (SEC)
// ═══════════════════════════════════════════════════════════════

/**
 * SEC (Specific Energy Consumption) 계산
 *
 * SEC = 에너지 소비량 (kWh) / 건조 슬러지량 (kg)
 */
export function calculateSEC(
  energyConsumption: number, // kWh
  driedSludgeAmount: number  // kg
): number {
  if (driedSludgeAmount <= 0) return 0;
  return energyConsumption / driedSludgeAmount;
}

/**
 * SEC 목표 대비 성과 (%)
 */
export function calculateSECPerformance(
  actualSEC: number,
  targetSEC: number
): number {
  if (targetSEC <= 0) return 0;
  // 목표 대비 성과 (낮을수록 좋음)
  return ((targetSEC - actualSEC) / targetSEC) * 100;
}

// ═══════════════════════════════════════════════════════════════
// 성능계수 (COP)
// ═══════════════════════════════════════════════════════════════

/**
 * COP (Coefficient of Performance) 계산
 *
 * COP = 열출력 / 전기입력
 */
export function calculateCOP(
  heatOutput: number,    // kWh (열)
  electricInput: number  // kWh (전기)
): number {
  if (electricInput <= 0) return 0;
  return heatOutput / electricInput;
}

// ═══════════════════════════════════════════════════════════════
// 건조 효율
// ═══════════════════════════════════════════════════════════════

/**
 * 건조 효율 계산 (%)
 *
 * 효율 = (수분제거량 × 증발잠열) / 투입에너지 × 100
 */
export function calculateDryingEfficiency(
  moistureRemoved: number,    // kg
  energyInput: number,        // kWh
  latentHeat: number = 0.627  // kWh/kg (물의 증발잠열)
): number {
  if (energyInput <= 0) return 0;
  const theoreticalEnergy = moistureRemoved * latentHeat;
  return (theoreticalEnergy / energyInput) * 100;
}

/**
 * 수분 제거량 계산
 */
export function calculateMoistureRemoved(
  inputWeight: number,      // kg (습슬러지)
  inputMoisture: number,    // % (입력 수분)
  outputWeight: number,     // kg (건조슬러지)
  outputMoisture: number    // % (출력 수분)
): number {
  const inputWater = inputWeight * (inputMoisture / 100);
  const outputWater = outputWeight * (outputMoisture / 100);
  return inputWater - outputWater;
}

// ═══════════════════════════════════════════════════════════════
// 부하율 및 역률
// ═══════════════════════════════════════════════════════════════

/**
 * 부하율 계산 (%)
 *
 * Load Factor = 평균 전력 / 피크 전력 × 100
 */
export function calculateLoadFactor(
  avgPower: number,
  peakPower: number
): number {
  if (peakPower <= 0) return 0;
  return (avgPower / peakPower) * 100;
}

/**
 * 역률 계산
 *
 * Power Factor = 유효전력 / 피상전력
 */
export function calculatePowerFactor(
  activePower: number,    // kW
  apparentPower: number   // kVA
): number {
  if (apparentPower <= 0) return 0;
  return Math.min(1, activePower / apparentPower);
}

/**
 * 피상전력 계산
 */
export function calculateApparentPower(
  activePower: number,    // kW
  reactivePower: number   // kVar
): number {
  return Math.sqrt(activePower ** 2 + reactivePower ** 2);
}

// ═══════════════════════════════════════════════════════════════
// 피크 수요
// ═══════════════════════════════════════════════════════════════

/**
 * 피크 수요 분석
 */
export function analyzePeakDemand(
  readings: IEnergyReading[]
): {
  peak: number;
  peakTime: string;
  avg: number;
  loadFactor: number;
} {
  if (readings.length === 0) {
    return { peak: 0, peakTime: '', avg: 0, loadFactor: 0 };
  }

  let peak = 0;
  let peakTime = '';
  let total = 0;
  let count = 0;

  for (const reading of readings) {
    const power = reading.power ?? reading.activePower ?? 0;
    if (power > peak) {
      peak = power;
      peakTime = reading.timestamp;
    }
    total += power;
    count++;
  }

  const avg = count > 0 ? total / count : 0;
  const loadFactor = calculateLoadFactor(avg, peak);

  return { peak, peakTime, avg, loadFactor };
}

/**
 * 피크 사용률 계산 (%)
 */
export function calculatePeakUtilization(
  currentPeak: number,
  contractedPower: number
): number {
  if (contractedPower <= 0) return 0;
  return (currentPeak / contractedPower) * 100;
}

// ═══════════════════════════════════════════════════════════════
// 에너지 비용
// ═══════════════════════════════════════════════════════════════

/**
 * TOU (Time of Use) 요금 계산
 */
export interface ITOURates {
  peak: number;
  shoulder: number;
  off_peak: number;
}

/**
 * 시간대별 에너지 비용 계산
 */
export function calculateEnergyCostByTOU(
  consumptionByTOU: Record<TimeOfUse, number>,
  rates: ITOURates
): { total: number; byTOU: Record<TimeOfUse, number> } {
  const byTOU: Record<TimeOfUse, number> = {
    peak: consumptionByTOU.peak * rates.peak,
    shoulder: consumptionByTOU.shoulder * rates.shoulder,
    off_peak: consumptionByTOU.off_peak * rates.off_peak,
  };

  const total = byTOU.peak + byTOU.shoulder + byTOU.off_peak;

  return { total, byTOU };
}

/**
 * 수요 요금 계산
 */
export function calculateDemandCharge(
  peakDemand: number,      // kW
  demandRate: number       // 원/kW
): number {
  return peakDemand * demandRate;
}

/**
 * 단위당 에너지 비용 (원/kg)
 */
export function calculateUnitEnergyCost(
  totalCost: number,
  driedSludgeAmount: number
): number {
  if (driedSludgeAmount <= 0) return 0;
  return totalCost / driedSludgeAmount;
}

// ═══════════════════════════════════════════════════════════════
// 에너지 변환
// ═══════════════════════════════════════════════════════════════

/**
 * 에너지 타입별 kWh 변환
 */
export function convertToKwh(
  amount: number,
  energyType: EnergyType
): number {
  switch (energyType) {
    case 'electricity':
      return amount; // 이미 kWh
    case 'natural_gas':
      return amount * 10.5; // Nm³ → kWh
    case 'steam':
      return amount * 640; // ton → kWh
    case 'heat':
      return amount; // kWh
    default:
      return amount;
  }
}

/**
 * 총 에너지 소비 (kWh 환산)
 */
export function calculateTotalEnergy(
  consumption: Record<EnergyType, number>
): number {
  let total = 0;
  for (const [type, amount] of Object.entries(consumption)) {
    total += convertToKwh(amount, type as EnergyType);
  }
  return total;
}

// ═══════════════════════════════════════════════════════════════
// 시간대 판별
// ═══════════════════════════════════════════════════════════════

/**
 * 시간대 판별 (한국 전력 기준)
 */
export function determineTimeOfUse(
  date: Date,
  isSummer: boolean = false
): TimeOfUse {
  const hour = date.getHours();

  if (isSummer) {
    // 여름철 (7-8월)
    if ((hour >= 10 && hour < 12) || (hour >= 13 && hour < 17)) {
      return 'peak';
    }
    if (
      (hour >= 9 && hour < 10) ||
      (hour >= 12 && hour < 13) ||
      (hour >= 17 && hour < 23)
    ) {
      return 'shoulder';
    }
  } else {
    // 비여름철
    if ((hour >= 10 && hour < 12) || (hour >= 17 && hour < 20) || (hour >= 22 && hour < 23)) {
      return 'shoulder';
    }
  }

  return 'off_peak';
}

/**
 * 여름철 여부 판별
 */
export function isSummerSeason(date: Date): boolean {
  const month = date.getMonth() + 1;
  return month === 7 || month === 8;
}

// ═══════════════════════════════════════════════════════════════
// 이상 감지
// ═══════════════════════════════════════════════════════════════

/**
 * 이상값 감지 결과
 */
export interface IAnomalyResult {
  /** 이상 여부 */
  isAnomaly: boolean;
  /** 편차 (표준편차 대비) */
  deviation: number;
  /** 설명 */
  reason?: string;
}

/**
 * 에너지 이상값 감지
 */
export function detectEnergyAnomaly(
  currentValue: number,
  historicalValues: number[],
  sensitivity: number = 2 // 표준편차 배수
): IAnomalyResult {
  if (historicalValues.length < 5) {
    return { isAnomaly: false, deviation: 0 };
  }

  const n = historicalValues.length;
  const mean = historicalValues.reduce((a, b) => a + b, 0) / n;
  const variance =
    historicalValues.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);

  if (stdDev === 0) {
    return { isAnomaly: false, deviation: 0 };
  }

  const deviation = (currentValue - mean) / stdDev;
  const isAnomaly = Math.abs(deviation) > sensitivity;

  let reason: string | undefined;
  if (isAnomaly) {
    reason =
      deviation > 0
        ? `평균 대비 ${Math.abs(deviation).toFixed(1)}σ 높음`
        : `평균 대비 ${Math.abs(deviation).toFixed(1)}σ 낮음`;
  }

  return { isAnomaly, deviation, reason };
}

// ═══════════════════════════════════════════════════════════════
// 효율 벤치마크 비교
// ═══════════════════════════════════════════════════════════════

/**
 * 벤치마크 비교 결과
 */
export interface IBenchmarkComparison {
  metric: string;
  current: number;
  target: number;
  gap: number;
  gapPercent: number;
  status: 'good' | 'warning' | 'critical';
}

/**
 * 효율 벤치마크 비교
 */
export function compareToBenchmark(
  current: {
    sec: number;
    cop?: number;
    dryingEfficiency: number;
    loadFactor: number;
    powerFactor?: number;
  },
  benchmark: IEfficiencyBenchmark
): IBenchmarkComparison[] {
  const results: IBenchmarkComparison[] = [];

  // SEC (낮을수록 좋음)
  const secGap = current.sec - benchmark.targetSEC;
  const secGapPercent = (secGap / benchmark.targetSEC) * 100;
  results.push({
    metric: 'SEC (kWh/kg)',
    current: current.sec,
    target: benchmark.targetSEC,
    gap: secGap,
    gapPercent: secGapPercent,
    status: secGapPercent <= 0 ? 'good' : secGapPercent < 20 ? 'warning' : 'critical',
  });

  // COP (높을수록 좋음)
  if (current.cop !== undefined) {
    const copGap = current.cop - benchmark.targetCOP;
    const copGapPercent = (copGap / benchmark.targetCOP) * 100;
    results.push({
      metric: 'COP',
      current: current.cop,
      target: benchmark.targetCOP,
      gap: copGap,
      gapPercent: copGapPercent,
      status: copGapPercent >= 0 ? 'good' : copGapPercent > -20 ? 'warning' : 'critical',
    });
  }

  // 건조 효율 (높을수록 좋음)
  const effGap = current.dryingEfficiency - benchmark.targetDryingEfficiency;
  const effGapPercent = (effGap / benchmark.targetDryingEfficiency) * 100;
  results.push({
    metric: '건조 효율 (%)',
    current: current.dryingEfficiency,
    target: benchmark.targetDryingEfficiency,
    gap: effGap,
    gapPercent: effGapPercent,
    status: effGapPercent >= 0 ? 'good' : effGapPercent > -15 ? 'warning' : 'critical',
  });

  // 부하율 (높을수록 좋음)
  const lfGap = current.loadFactor - benchmark.targetLoadFactor;
  const lfGapPercent = (lfGap / benchmark.targetLoadFactor) * 100;
  results.push({
    metric: '부하율 (%)',
    current: current.loadFactor,
    target: benchmark.targetLoadFactor,
    gap: lfGap,
    gapPercent: lfGapPercent,
    status: lfGapPercent >= 0 ? 'good' : lfGapPercent > -20 ? 'warning' : 'critical',
  });

  // 역률 (높을수록 좋음)
  if (current.powerFactor !== undefined) {
    const pfGap = current.powerFactor - benchmark.targetPowerFactor;
    const pfGapPercent = (pfGap / benchmark.targetPowerFactor) * 100;
    results.push({
      metric: '역률',
      current: current.powerFactor,
      target: benchmark.targetPowerFactor,
      gap: pfGap,
      gapPercent: pfGapPercent,
      status: pfGapPercent >= 0 ? 'good' : pfGapPercent > -5 ? 'warning' : 'critical',
    });
  }

  return results;
}

// ═══════════════════════════════════════════════════════════════
// 예측
// ═══════════════════════════════════════════════════════════════

/**
 * 간단한 이동평균 기반 소비 예측
 */
export function predictConsumption(
  historicalData: number[],
  periodsAhead: number = 1
): number[] {
  if (historicalData.length < 3) {
    return Array(periodsAhead).fill(
      historicalData.length > 0 ? historicalData[historicalData.length - 1] : 0
    );
  }

  // 최근 7개 데이터로 이동평균
  const windowSize = Math.min(7, historicalData.length);
  const recent = historicalData.slice(-windowSize);
  const avg = recent.reduce((a, b) => a + b, 0) / recent.length;

  // 추세 계산
  const firstHalf = recent.slice(0, Math.floor(windowSize / 2));
  const secondHalf = recent.slice(Math.ceil(windowSize / 2));
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  const trend = secondAvg - firstAvg;

  // 예측
  const predictions: number[] = [];
  for (let i = 1; i <= periodsAhead; i++) {
    predictions.push(Math.max(0, avg + trend * i));
  }

  return predictions;
}

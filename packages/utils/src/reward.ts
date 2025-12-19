/**
 * @forge/utils - Reward Utilities
 * L1 (Molecules) - 강화학습 보상 함수
 *
 * 자가개선 성장 루프의 LEARN 단계 핵심
 * 이 보상 함수가 시스템의 "자가개선" 방향을 결정함
 */

import type { DryonTypes } from '@forge/types';

type IOutcomeMetrics = DryonTypes.IOutcomeMetrics;
type ISensorAggregates = DryonTypes.ISensorAggregates;

/**
 * 보상 함수 가중치
 */
export interface IRewardWeights {
  /** 에너지 절감 가중치 */
  energySaving: number;
  /** 품질 유지 가중치 */
  qualityMaintenance: number;
  /** 안정성 가중치 */
  stability: number;
  /** 처리량 가중치 */
  throughput: number;
}

/**
 * 기본 보상 가중치
 */
export const DEFAULT_REWARD_WEIGHTS: IRewardWeights = {
  energySaving: 0.4,        // 에너지 절감이 가장 중요
  qualityMaintenance: 0.35, // 품질 유지도 매우 중요
  stability: 0.15,          // 안정성
  throughput: 0.1,          // 처리량은 부수적
} as const;

/**
 * 보상 계산 결과
 */
export interface IRewardBreakdown {
  /** 총 보상 */
  total: number;
  /** 구성 요소별 보상 */
  components: {
    energy: number;
    quality: number;
    stability: number;
    throughput: number;
  };
  /** 페널티 */
  penalties: {
    qualityViolation: number;
    energyIncrease: number;
    instability: number;
  };
  /** 설명 */
  explanation: string;
}

/**
 * 메인 보상 함수 (Reward Function)
 *
 * 강화학습의 핵심: 좋은 행동에 높은 보상, 나쁜 행동에 낮은 보상
 *
 * @param outcome - 실행 결과 메트릭
 * @param weights - 가중치 (선택)
 * @returns 보상값 (-1 ~ 1 범위)
 */
export function computeReward(
  outcome: IOutcomeMetrics,
  weights: IRewardWeights = DEFAULT_REWARD_WEIGHTS
): IRewardBreakdown {
  // 1. 에너지 절감 보상 (0 ~ 1)
  // 10% 절감 = 0.5, 20% 절감 = 1.0
  const energyReward = Math.min(1, Math.max(0, outcome.energySavingRate / 20));

  // 2. 품질 유지 보상 (0 ~ 1)
  // 90점 = 0.5, 100점 = 1.0, 80점 이하 = 0
  const qualityReward = outcome.qualityScore >= 80
    ? Math.min(1, (outcome.qualityScore - 80) / 20)
    : 0;

  // 3. 안정성 보상 (0 ~ 1)
  // 90점 = 0.5, 100점 = 1.0
  const stabilityReward = Math.min(1, Math.max(0, outcome.stabilityScore / 100));

  // 4. 처리량 보상 (-0.5 ~ 0.5)
  // 처리량 감소 없으면 보너스, 감소하면 페널티
  const throughputReward = Math.min(0.5, Math.max(-0.5, outcome.throughputChange / 20));

  // 페널티 계산
  const penalties = {
    // 품질 기준 미달 페널티 (심각)
    qualityViolation: outcome.qualityScore < 80 ? -0.5 : 0,
    // 에너지 증가 페널티
    energyIncrease: outcome.energySavingRate < 0 ? Math.min(0, outcome.energySavingRate / 10) : 0,
    // 불안정성 페널티
    instability: outcome.stabilityScore < 70 ? -0.2 : 0,
  };

  // 가중 합계
  const components = {
    energy: energyReward * weights.energySaving,
    quality: qualityReward * weights.qualityMaintenance,
    stability: stabilityReward * weights.stability,
    throughput: throughputReward * weights.throughput,
  };

  const rawReward =
    components.energy +
    components.quality +
    components.stability +
    components.throughput;

  const totalPenalty =
    penalties.qualityViolation +
    penalties.energyIncrease +
    penalties.instability;

  const total = Math.max(-1, Math.min(1, rawReward + totalPenalty));

  // 설명 생성
  const explanation = generateRewardExplanation(outcome, total, components, penalties);

  return {
    total,
    components,
    penalties,
    explanation,
  };
}

/**
 * 보상 설명 생성
 */
function generateRewardExplanation(
  outcome: IOutcomeMetrics,
  total: number,
  components: IRewardBreakdown['components'],
  penalties: IRewardBreakdown['penalties']
): string {
  const parts: string[] = [];

  if (outcome.energySavingRate > 0) {
    parts.push(`에너지 ${outcome.energySavingRate.toFixed(1)}% 절감`);
  } else if (outcome.energySavingRate < 0) {
    parts.push(`에너지 ${Math.abs(outcome.energySavingRate).toFixed(1)}% 증가 (페널티)`);
  }

  if (outcome.qualityScore >= 90) {
    parts.push(`우수한 품질 유지 (${outcome.qualityScore}점)`);
  } else if (outcome.qualityScore < 80) {
    parts.push(`품질 기준 미달 (${outcome.qualityScore}점) - 심각한 페널티`);
  }

  if (outcome.stabilityScore < 70) {
    parts.push(`공정 불안정 (${outcome.stabilityScore}점)`);
  }

  const verdict = total > 0.5
    ? '매우 좋은 결과'
    : total > 0.2
    ? '양호한 결과'
    : total > 0
    ? '보통 결과'
    : total > -0.3
    ? '개선 필요'
    : '좋지 않은 결과';

  return `${verdict}: ${parts.join(', ')}. 총 보상: ${total.toFixed(3)}`;
}

/**
 * 상태 변화 계산
 */
export function calculateStateChange(
  before: ISensorAggregates,
  after: ISensorAggregates
): IOutcomeMetrics {
  // 에너지 절감률
  const energySaved = before.energyConsumption - after.energyConsumption;
  const energySavingRate =
    before.energyConsumption > 0
      ? (energySaved / before.energyConsumption) * 100
      : 0;

  // 품질 점수 (수분 함량 기준)
  // 목표: 10% 수분 함량, 편차가 작을수록 높은 점수
  const targetMoisture = 10;
  const moistureDeviation = Math.abs(after.moistureContent - targetMoisture);
  const qualityScore = Math.max(0, 100 - moistureDeviation * 5);

  // 안정성 점수 (온도 변화 기준)
  const tempVariation = Math.abs(after.temperatureOut - before.temperatureOut);
  const stabilityScore = Math.max(0, 100 - tempVariation * 5);

  // 처리량 변화
  const throughputChange =
    before.throughput > 0
      ? ((after.throughput - before.throughput) / before.throughput) * 100
      : 0;

  return {
    energySaved,
    energySavingRate,
    qualityScore,
    stabilityScore,
    throughputChange,
  };
}

/**
 * 패턴 신뢰도 업데이트
 *
 * 성공 시 신뢰도 증가, 실패 시 감소
 * 지수 이동 평균 사용
 */
export function updateConfidence(
  currentConfidence: number,
  reward: number,
  learningRate: number = 0.1
): number {
  // reward를 0-1 범위로 정규화
  const normalizedReward = (reward + 1) / 2;

  // 지수 이동 평균
  const newConfidence =
    currentConfidence * (1 - learningRate) +
    normalizedReward * learningRate;

  // 0.1 ~ 0.99 범위로 클램핑
  return Math.max(0.1, Math.min(0.99, newConfidence));
}

/**
 * 탐색-활용 균형 (Epsilon-Greedy)
 *
 * @param confidence - 현재 추천의 신뢰도
 * @param explorationRate - 탐색 비율 (0-1)
 * @returns true면 탐색, false면 활용
 */
export function shouldExplore(
  confidence: number,
  explorationRate: number = 0.1
): boolean {
  // 신뢰도가 낮으면 더 많이 탐색
  const adjustedRate = explorationRate * (1 - confidence);
  return Math.random() < adjustedRate;
}

/**
 * 유사도 기반 패턴 매칭 점수
 */
export function calculatePatternMatchScore(
  current: ISensorAggregates,
  patternConditions: {
    temperatureRange?: { min: number; max: number };
    humidityRange?: { min: number; max: number };
    energyRange?: { min: number; max: number };
  }
): number {
  let matchScore = 0;
  let conditionCount = 0;

  if (patternConditions.temperatureRange) {
    conditionCount++;
    const { min, max } = patternConditions.temperatureRange;
    const temp = current.temperatureIn;
    if (temp >= min && temp <= max) {
      matchScore += 1;
    } else {
      // 범위 밖이면 거리에 따라 부분 점수
      const distance = temp < min ? min - temp : temp - max;
      matchScore += Math.max(0, 1 - distance / 10);
    }
  }

  if (patternConditions.humidityRange) {
    conditionCount++;
    const { min, max } = patternConditions.humidityRange;
    if (current.humidity >= min && current.humidity <= max) {
      matchScore += 1;
    }
  }

  if (patternConditions.energyRange) {
    conditionCount++;
    const { min, max } = patternConditions.energyRange;
    if (current.energyConsumption >= min && current.energyConsumption <= max) {
      matchScore += 1;
    }
  }

  return conditionCount > 0 ? matchScore / conditionCount : 0;
}

/**
 * @forge/types - DRYON Recommendation Types
 * L0 (Atoms) - 최적화 추천 타입 정의
 *
 * 자가개선 성장 루프의 DECIDE, ACT 단계 지원
 */

import type { Timestamp } from '../index';

/**
 * 최적화 유형
 */
export type OptimizationType =
  | 'energy'       // 에너지 절감
  | 'quality'      // 품질 향상
  | 'throughput'   // 처리량 증가
  | 'balanced';    // 균형 최적화

/**
 * 우선순위
 */
export type Priority = 'critical' | 'high' | 'medium' | 'low';

/**
 * 실행 모드
 */
export type ExecutionMode =
  | 'auto'           // 자동 적용
  | 'semi_auto'      // 승인 후 적용
  | 'monitoring';    // 모니터링만

/**
 * 최적화 액션 (적용할 파라미터)
 */
export interface IOptimizationAction {
  /** 액션 ID */
  id: string;
  /** 목표 건조 온도 (°C) */
  targetTemperature?: number;
  /** 팬 속도 (%) */
  fanSpeed?: number;
  /** 투입 속도 (kg/h) */
  feedRate?: number;
  /** 체류 시간 (분) */
  residenceTime?: number;
  /** 압력 설정 (Pa) */
  pressureSetpoint?: number;
  /** 추가 파라미터 */
  additionalParams?: Record<string, number>;
}

/**
 * 예상 효과
 */
export interface IPredictedEffect {
  /** 에너지 절감률 (%) */
  energySavingRate: number;
  /** 예상 품질 점수 */
  qualityScore: number;
  /** 처리량 변화 (%) */
  throughputChange: number;
  /** 안정화 시간 (분) */
  stabilizationTimeMin: number;
}

/**
 * 최적화 추천
 */
export interface IOptimizationRecommendation {
  /** 추천 ID */
  id: string;
  /** 생성 일시 */
  createdAt: Timestamp;

  /** 최적화 유형 */
  type: OptimizationType;
  /** 우선순위 */
  priority: Priority;
  /** 제목 */
  title: string;
  /** 설명 */
  description: string;

  /** 추천 액션 */
  action: IOptimizationAction;
  /** 예상 효과 */
  predictedEffect: IPredictedEffect;

  /** 신뢰도 (0-1) */
  confidence: number;
  /** 근거 패턴 ID (있으면) */
  basedOnPatternId?: string;

  /** 실행 상태 */
  status: RecommendationStatus;
  /** 실행 모드 */
  executionMode: ExecutionMode;

  /** 만료 시간 */
  expiresAt?: Timestamp;
}

/**
 * 추천 상태
 */
export type RecommendationStatus =
  | 'pending'      // 대기 중
  | 'approved'     // 승인됨
  | 'applied'      // 적용됨
  | 'completed'    // 완료 (결과 수집됨)
  | 'rejected'     // 거부됨
  | 'expired'      // 만료됨
  | 'failed';      // 실패

/**
 * 추천 실행 결과
 */
export interface IRecommendationResult {
  /** 추천 ID */
  recommendationId: string;
  /** 실행 일시 */
  executedAt: Timestamp;
  /** 완료 일시 */
  completedAt: Timestamp;

  /** 성공 여부 */
  success: boolean;
  /** 실제 결과 */
  actualEffect: {
    energySavingRate: number;
    qualityScore: number;
    throughputChange: number;
  };

  /** 예측 대비 오차 */
  predictionError: {
    energySavingError: number;
    qualityScoreError: number;
    throughputError: number;
  };

  /** 에러 정보 (실패 시) */
  error?: string;
}

/**
 * 안전 제한
 */
export interface ISafetyLimits {
  /** 최대 온도 */
  maxTemperature: number;
  /** 최소 온도 */
  minTemperature: number;
  /** 최대 변경폭 (1회) */
  maxChangePerStep: number;
  /** 최소 품질 점수 */
  minQualityScore: number;
  /** 최대 에너지 소비 증가율 */
  maxEnergyIncreaseRate: number;
}

/**
 * 기본 안전 제한
 */
export const DEFAULT_SAFETY_LIMITS: ISafetyLimits = {
  maxTemperature: 150,
  minTemperature: 60,
  maxChangePerStep: 10, // 10% 또는 10 단위
  minQualityScore: 80,
  maxEnergyIncreaseRate: 5, // 5% 이상 에너지 증가 방지
} as const;

/**
 * 추천 필터
 */
export interface IRecommendationFilter {
  type?: OptimizationType;
  minConfidence?: number;
  priority?: Priority;
  status?: RecommendationStatus;
  since?: Timestamp;
}

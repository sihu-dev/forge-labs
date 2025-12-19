/**
 * @forge/types - DRYON Feedback Types
 * L0 (Atoms) - 학습 피드백 타입 정의
 *
 * 자가개선 성장 루프의 LEARN 단계 핵심 타입
 * 이 타입들이 시스템의 "자가개선" 능력을 가능하게 함
 */

import type { Timestamp } from '../index';
import type { ISensorState, ISensorAggregates } from './sensor.js';
import type { IOptimizationAction } from './recommendation.js';

/**
 * 학습 경험 (Experience)
 *
 * 강화학습의 기본 단위: (State, Action, Reward, NextState)
 */
export interface ILearningExperience {
  /** 경험 ID */
  id: string;
  /** 타임스탬프 */
  timestamp: Timestamp;

  /** 실행 전 상태 (State) */
  beforeState: ISensorState;
  /** 적용된 액션 (Action) */
  action: IOptimizationAction;
  /** 실행 후 상태 (Next State) */
  afterState: ISensorState;

  /** 관찰 기간 (ms) */
  observationDurationMs: number;

  /** 결과 메트릭 */
  outcome: IOutcomeMetrics;
  /** 계산된 보상 (Reward) */
  reward: number;

  /** 메타데이터 */
  metadata: {
    /** 운영자 승인 여부 */
    operatorApproved: boolean;
    /** 자동 적용 여부 */
    autoApplied: boolean;
    /** 환경 조건 */
    environmentConditions?: Record<string, unknown>;
  };
}

/**
 * 결과 메트릭
 */
export interface IOutcomeMetrics {
  /** 에너지 절감량 (kWh) */
  energySaved: number;
  /** 에너지 절감률 (%) */
  energySavingRate: number;
  /** 품질 점수 (0-100) */
  qualityScore: number;
  /** 안정성 점수 (0-100) */
  stabilityScore: number;
  /** 처리량 변화 (%) */
  throughputChange: number;
}

/**
 * 학습 패턴 (Pattern)
 *
 * 유사한 상황에서의 최적 행동을 기억
 * 경험이 쌓이면서 신뢰도가 높아짐
 */
export interface ILearningPattern {
  /** 패턴 ID */
  id: string;
  /** 패턴 이름 */
  name: string;
  /** 생성 일시 */
  createdAt: Timestamp;
  /** 마지막 업데이트 */
  updatedAt: Timestamp;

  /** 상태 조건 (이 조건에 매칭되면 이 패턴 적용) */
  conditions: IPatternConditions;
  /** 추천 액션 */
  recommendedAction: IOptimizationAction;

  /** 통계 */
  stats: IPatternStats;
  /** 신뢰도 (0-1) */
  confidence: number;
  /** 활성화 여부 */
  isActive: boolean;
}

/**
 * 패턴 조건
 */
export interface IPatternConditions {
  /** 온도 범위 */
  temperatureRange?: { min: number; max: number };
  /** 습도 범위 */
  humidityRange?: { min: number; max: number };
  /** 에너지 소비 범위 */
  energyRange?: { min: number; max: number };
  /** 시간대 조건 */
  timeOfDay?: { start: string; end: string };
  /** 요일 조건 */
  dayOfWeek?: number[];
  /** 계절 조건 */
  season?: 'spring' | 'summer' | 'fall' | 'winter';
  /** 커스텀 조건 */
  custom?: Record<string, unknown>;
}

/**
 * 패턴 통계
 */
export interface IPatternStats {
  /** 총 적용 횟수 */
  totalApplications: number;
  /** 성공 횟수 */
  successCount: number;
  /** 실패 횟수 */
  failureCount: number;
  /** 성공률 */
  successRate: number;
  /** 평균 에너지 절감률 */
  avgEnergySavingRate: number;
  /** 평균 품질 점수 */
  avgQualityScore: number;
  /** 평균 보상 */
  avgReward: number;
  /** 최근 10회 성공률 */
  recentSuccessRate: number;
}

/**
 * 학습 피드백 (단일 피드백)
 */
export interface ILearningFeedback {
  /** 피드백 ID */
  id: string;
  /** 관련 경험 ID */
  experienceId: string;
  /** 타임스탬프 */
  timestamp: Timestamp;

  /** 피드백 유형 */
  type: FeedbackType;
  /** 피드백 값 */
  value: number;
  /** 피드백 소스 */
  source: FeedbackSource;

  /** 설명 */
  description?: string;
}

/**
 * 피드백 유형
 */
export type FeedbackType =
  | 'reward'           // 보상 (자동 계산)
  | 'correction'       // 보정 (운영자)
  | 'override'         // 오버라이드 (운영자)
  | 'rating'           // 평가 (운영자)
  | 'auto_adjustment'; // 자동 조정

/**
 * 피드백 소스
 */
export type FeedbackSource =
  | 'system'           // 시스템 자동
  | 'operator'         // 운영자
  | 'sensor'           // 센서 데이터
  | 'external';        // 외부 시스템

/**
 * 모델 상태
 */
export interface IModelState {
  /** 버전 */
  version: string;
  /** 마지막 업데이트 */
  lastUpdatedAt: Timestamp;
  /** 총 학습 경험 수 */
  totalExperiences: number;
  /** 활성 패턴 수 */
  activePatterns: number;
  /** 평균 예측 정확도 */
  avgPredictionAccuracy: number;
  /** 모델 성능 추이 */
  performanceTrend: 'improving' | 'stable' | 'declining';
}

/**
 * 학습 설정
 */
export interface ILearningConfig {
  /** 학습률 */
  learningRate: number;
  /** 할인 계수 (미래 보상의 현재 가치) */
  discountFactor: number;
  /** 탐색 비율 (exploration vs exploitation) */
  explorationRate: number;
  /** 최소 신뢰도 임계값 */
  minConfidenceThreshold: number;
  /** 패턴 활성화 최소 적용 횟수 */
  minApplicationsForActivation: number;
  /** 온라인 학습 활성화 */
  enableOnlineLearning: boolean;
}

/**
 * 기본 학습 설정
 */
export const DEFAULT_LEARNING_CONFIG: ILearningConfig = {
  learningRate: 0.1,
  discountFactor: 0.95,
  explorationRate: 0.1,
  minConfidenceThreshold: 0.6,
  minApplicationsForActivation: 5,
  enableOnlineLearning: true,
} as const;

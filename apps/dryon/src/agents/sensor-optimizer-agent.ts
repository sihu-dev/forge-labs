/**
 * DRYON - Sensor Optimizer Agent
 * L3 (Tissues) - 자가개선 최적화 에이전트
 *
 * 자가개선 성장 루프 (Self-Improving Growth Loop) 구현
 *
 * ┌──────────┐    ┌──────────┐    ┌──────────┐
 * │  SENSE   │───▶│  DECIDE  │───▶│   ACT    │
 * │ (센서)   │    │ (분석)   │    │ (실행)   │
 * └──────────┘    └──────────┘    └──────────┘
 *       ▲                               │
 *       │         ┌──────────┐          │
 *       └─────────│  LEARN   │◀─────────┘
 *                 │ (학습)   │
 *                 └──────────┘
 */

import { DryonTypes } from '@forge/types';
import type { IResult, Timestamp } from '@forge/types';
import type { IFeedbackRepository } from '@forge/core';
import {
  computeReward,
  calculateStateChange,
  updateConfidence,
  shouldExplore,
  calculatePatternMatchScore,
} from '@forge/utils';

type ISensorState = DryonTypes.ISensorState;
type ISensorAggregates = DryonTypes.ISensorAggregates;
type IOptimizationRecommendation = DryonTypes.IOptimizationRecommendation;
type IOptimizationAction = DryonTypes.IOptimizationAction;
type ILearningExperience = DryonTypes.ILearningExperience;
type ILearningPattern = DryonTypes.ILearningPattern;
type ILearningConfig = DryonTypes.ILearningConfig;
type IModelState = DryonTypes.IModelState;
type ExecutionMode = DryonTypes.ExecutionMode;

/**
 * 에이전트 설정
 */
export interface ISensorOptimizerAgentConfig {
  /** 실행 모드 */
  executionMode: ExecutionMode;
  /** 학습 설정 */
  learning: ILearningConfig;
  /** 관찰 기간 (ms) */
  observationPeriodMs: number;
  /** 최소 신뢰도 자동 적용 임계값 */
  autoApplyConfidenceThreshold: number;
}

/**
 * 기본 설정
 */
const DEFAULT_CONFIG: ISensorOptimizerAgentConfig = {
  executionMode: 'semi_auto',
  learning: DryonTypes.DEFAULT_LEARNING_CONFIG,
  observationPeriodMs: 300000, // 5분
  autoApplyConfidenceThreshold: 0.8,
};

/**
 * 최적화 사이클 결과
 */
export interface IOptimizationCycleResult {
  /** 사이클 ID */
  cycleId: string;
  /** 타임스탬프 */
  timestamp: Timestamp;
  /** 단계별 결과 */
  phases: {
    sense: { success: boolean; state?: ISensorState };
    decide: { success: boolean; recommendation?: IOptimizationRecommendation };
    act: { success: boolean; applied: boolean };
    learn: { success: boolean; reward?: number; patternUpdated: boolean };
  };
  /** 전체 성공 여부 */
  success: boolean;
  /** 학습된 내용 요약 */
  learningInsight?: string;
}

/**
 * 센서 최적화 에이전트 (자가개선 루프)
 */
export class SensorOptimizerAgent {
  private config: ISensorOptimizerAgentConfig;
  private feedbackRepo: IFeedbackRepository;

  // 현재 상태 추적
  private currentState: ISensorState | null = null;
  private pendingAction: IOptimizationAction | null = null;
  private pendingRecommendation: IOptimizationRecommendation | null = null;

  constructor(
    feedbackRepo: IFeedbackRepository,
    config: Partial<ISensorOptimizerAgentConfig> = {}
  ) {
    this.feedbackRepo = feedbackRepo;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 전체 최적화 사이클 실행
   *
   * SENSE → DECIDE → ACT → LEARN
   */
  async runOptimizationCycle(
    sensorState: ISensorState
  ): Promise<IResult<IOptimizationCycleResult>> {
    const cycleId = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    const result: IOptimizationCycleResult = {
      cycleId,
      timestamp,
      phases: {
        sense: { success: false },
        decide: { success: false },
        act: { success: false, applied: false },
        learn: { success: false, patternUpdated: false },
      },
      success: false,
    };

    try {
      // ═══════════════════════════════════════
      // Phase 1: SENSE (감지)
      // ═══════════════════════════════════════
      const senseResult = await this.sense(sensorState);
      result.phases.sense = {
        success: senseResult.success,
        state: senseResult.data ?? undefined,
      };

      if (!senseResult.success || !senseResult.data) {
        return this.wrapResult(result, timestamp);
      }

      // ═══════════════════════════════════════
      // Phase 2: DECIDE (결정)
      // ═══════════════════════════════════════
      const decideResult = await this.decide(senseResult.data);
      result.phases.decide = {
        success: decideResult.success,
        recommendation: decideResult.data ?? undefined,
      };

      if (!decideResult.success || !decideResult.data) {
        // 추천 없음 - 현상 유지
        result.success = true;
        return this.wrapResult(result, timestamp);
      }

      // ═══════════════════════════════════════
      // Phase 3: ACT (실행)
      // ═══════════════════════════════════════
      const actResult = await this.act(decideResult.data);
      result.phases.act = {
        success: actResult.success,
        applied: actResult.data ?? false,
      };

      if (!actResult.data) {
        // 적용 안됨 (거부 또는 대기)
        result.success = true;
        return this.wrapResult(result, timestamp);
      }

      // ═══════════════════════════════════════
      // Phase 4: LEARN (학습) - 관찰 후 실행
      // ═══════════════════════════════════════
      // 실제로는 observationPeriodMs 후에 호출됨
      // 여기서는 시뮬레이션을 위해 바로 호출

      result.success = true;
      result.learningInsight = '액션 적용됨. 관찰 기간 후 학습 단계 실행 예정.';

      return this.wrapResult(result, timestamp);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        metadata: {
          timestamp,
          duration_ms: 0,
        },
      };
    }
  }

  /**
   * Phase 1: SENSE (감지)
   *
   * 센서 데이터를 수집하고 정규화
   */
  private async sense(
    sensorState: ISensorState
  ): Promise<IResult<ISensorState>> {
    const startTime = Date.now();

    try {
      // 이전 상태 저장 (학습용)
      const previousState = this.currentState;

      // 현재 상태 업데이트
      this.currentState = sensorState;

      // 이상치 감지 및 필터링 (여기서는 간략화)
      const validatedState = this.validateSensorData(sensorState);

      return {
        success: true,
        data: validatedState,
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * Phase 2: DECIDE (결정)
   *
   * 현재 상태에서 최적 액션 결정
   * 학습된 패턴 활용 + 탐색/활용 균형
   */
  private async decide(
    state: ISensorState
  ): Promise<IResult<IOptimizationRecommendation | null>> {
    const startTime = Date.now();

    try {
      // 1. 매칭되는 패턴 검색
      const patternsResult = await this.feedbackRepo.findMatchingPatterns({
        temperatureRange: {
          min: state.aggregates.temperatureIn - 10,
          max: state.aggregates.temperatureIn + 10,
        },
        humidityRange: {
          min: state.aggregates.humidity - 10,
          max: state.aggregates.humidity + 10,
        },
      });

      const patterns = patternsResult.data ?? [];

      // 2. 탐색 vs 활용 결정
      let selectedPattern: ILearningPattern | null = null;
      let isExploration = false;

      if (patterns.length > 0) {
        const bestPattern = patterns[0]; // 가장 높은 신뢰도

        if (shouldExplore(bestPattern.confidence, this.config.learning.explorationRate)) {
          // 탐색: 새로운 액션 시도
          isExploration = true;
        } else {
          // 활용: 검증된 패턴 사용
          selectedPattern = bestPattern;
        }
      } else {
        // 패턴 없음: 기본 최적화 로직
        isExploration = true;
      }

      // 3. 추천 생성
      const action = selectedPattern
        ? selectedPattern.recommendedAction
        : this.generateExploratoryAction(state.aggregates);

      const confidence = selectedPattern?.confidence ?? 0.3;

      // 신뢰도가 낮으면 추천 안함
      if (confidence < this.config.learning.minConfidenceThreshold && !isExploration) {
        return {
          success: true,
          data: null,
          metadata: {
            timestamp: new Date().toISOString(),
            duration_ms: Date.now() - startTime,
          },
        };
      }

      const recommendation: IOptimizationRecommendation = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        type: 'energy',
        priority: confidence > 0.7 ? 'high' : 'medium',
        title: selectedPattern
          ? `패턴 기반 최적화: ${selectedPattern.name}`
          : '탐색적 최적화',
        description: isExploration
          ? '새로운 파라미터 조합 탐색'
          : `신뢰도 ${(confidence * 100).toFixed(0)}%의 검증된 패턴`,
        action,
        predictedEffect: {
          energySavingRate: selectedPattern?.stats.avgEnergySavingRate ?? 5,
          qualityScore: selectedPattern?.stats.avgQualityScore ?? 85,
          throughputChange: 0,
          stabilizationTimeMin: 10,
        },
        confidence,
        basedOnPatternId: selectedPattern?.id,
        status: 'pending',
        executionMode: this.config.executionMode,
      };

      this.pendingRecommendation = recommendation;
      this.pendingAction = action;

      return {
        success: true,
        data: recommendation,
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * Phase 3: ACT (실행)
   *
   * 추천 액션 적용
   */
  private async act(
    recommendation: IOptimizationRecommendation
  ): Promise<IResult<boolean>> {
    const startTime = Date.now();

    try {
      // 실행 모드에 따른 처리
      switch (this.config.executionMode) {
        case 'auto':
          // 자동 적용 (신뢰도 임계값 충족 시)
          if (recommendation.confidence >= this.config.autoApplyConfidenceThreshold) {
            await this.applyAction(recommendation.action);
            return {
              success: true,
              data: true,
              metadata: {
                timestamp: new Date().toISOString(),
                duration_ms: Date.now() - startTime,
              },
            };
          }
          // 신뢰도 부족 - 대기
          return {
            success: true,
            data: false,
            metadata: {
              timestamp: new Date().toISOString(),
              duration_ms: Date.now() - startTime,
            },
          };

        case 'semi_auto':
          // 반자동: 운영자 승인 대기 상태로 전환
          // 실제로는 승인 이벤트를 기다림
          return {
            success: true,
            data: false, // 아직 적용 안됨
            metadata: {
              timestamp: new Date().toISOString(),
              duration_ms: Date.now() - startTime,
            },
          };

        case 'monitoring':
          // 모니터링 모드: 적용하지 않음
          return {
            success: true,
            data: false,
            metadata: {
              timestamp: new Date().toISOString(),
              duration_ms: Date.now() - startTime,
            },
          };

        default:
          return {
            success: true,
            data: false,
            metadata: {
              timestamp: new Date().toISOString(),
              duration_ms: Date.now() - startTime,
            },
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * Phase 4: LEARN (학습)
   *
   * 실행 결과를 학습하여 모델 개선
   * 이것이 "자가개선"의 핵심!
   */
  async learn(
    beforeState: ISensorState,
    action: IOptimizationAction,
    afterState: ISensorState,
    patternId?: string
  ): Promise<IResult<{ reward: number; insight: string }>> {
    const startTime = Date.now();

    try {
      // 1. 결과 메트릭 계산
      const outcome = calculateStateChange(
        beforeState.aggregates,
        afterState.aggregates
      );

      // 2. 보상 계산 (핵심!)
      const rewardBreakdown = computeReward(outcome);
      const reward = rewardBreakdown.total;

      // 3. 경험 저장
      const experience: ILearningExperience = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        beforeState,
        action,
        afterState,
        observationDurationMs: this.config.observationPeriodMs,
        outcome,
        reward,
        metadata: {
          operatorApproved: this.config.executionMode !== 'auto',
          autoApplied: this.config.executionMode === 'auto',
        },
      };

      await this.feedbackRepo.saveExperience(experience);

      // 4. 패턴 업데이트 (있으면)
      if (patternId) {
        const success = reward > 0;
        await this.feedbackRepo.updatePatternStats(patternId, success, reward);
      }

      // 5. 새 패턴 후보 검토 (높은 보상 시)
      if (reward > 0.5 && !patternId) {
        await this.considerNewPattern(beforeState, action, outcome, reward);
      }

      // 6. 학습 인사이트 생성
      const insight = this.generateLearningInsight(rewardBreakdown, patternId);

      return {
        success: true,
        data: { reward, insight },
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * 모델 상태 조회
   */
  async getModelState(): Promise<IResult<IModelState>> {
    return this.feedbackRepo.getModelState();
  }

  /**
   * 운영자 승인 처리
   */
  async approveRecommendation(
    recommendationId: string,
    approved: boolean
  ): Promise<IResult<boolean>> {
    const startTime = Date.now();

    if (
      !this.pendingRecommendation ||
      this.pendingRecommendation.id !== recommendationId
    ) {
      return {
        success: false,
        error: new Error('No matching pending recommendation'),
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    }

    if (approved && this.pendingAction) {
      await this.applyAction(this.pendingAction);
      return {
        success: true,
        data: true,
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    }

    // 거부됨
    this.pendingRecommendation = null;
    this.pendingAction = null;

    return {
      success: true,
      data: false,
      metadata: {
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      },
    };
  }

  // ═══════════════════════════════════════
  // 내부 헬퍼 메서드
  // ═══════════════════════════════════════

  private validateSensorData(state: ISensorState): ISensorState {
    // 간략화된 검증 - 실제로는 더 정교한 이상치 감지 필요
    return state;
  }

  private generateExploratoryAction(
    aggregates: ISensorAggregates
  ): IOptimizationAction {
    // 현재 상태에서 약간의 변화를 주는 탐색적 액션
    return {
      id: crypto.randomUUID(),
      targetTemperature: aggregates.temperatureDryer - 5, // 5도 낮춤 (에너지 절감 시도)
      fanSpeed: aggregates.throughput > 100 ? 90 : 100,
      feedRate: aggregates.throughput,
    };
  }

  private async applyAction(action: IOptimizationAction): Promise<void> {
    // 실제로는 PLC/SCADA에 명령 전송
    console.log('Applying action:', action);
  }

  private async considerNewPattern(
    state: ISensorState,
    action: IOptimizationAction,
    outcome: DryonTypes.IOutcomeMetrics,
    reward: number
  ): Promise<void> {
    // 새로운 성공적인 패턴을 후보로 등록
    const newPattern: ILearningPattern = {
      id: crypto.randomUUID(),
      name: `Auto-discovered Pattern ${new Date().toISOString().slice(0, 10)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      conditions: {
        temperatureRange: {
          min: state.aggregates.temperatureIn - 5,
          max: state.aggregates.temperatureIn + 5,
        },
        humidityRange: {
          min: state.aggregates.humidity - 5,
          max: state.aggregates.humidity + 5,
        },
      },
      recommendedAction: action,
      stats: {
        totalApplications: 1,
        successCount: reward > 0 ? 1 : 0,
        failureCount: reward > 0 ? 0 : 1,
        successRate: reward > 0 ? 1 : 0,
        avgEnergySavingRate: outcome.energySavingRate,
        avgQualityScore: outcome.qualityScore,
        avgReward: reward,
        recentSuccessRate: reward > 0 ? 1 : 0,
      },
      confidence: 0.3, // 초기 신뢰도
      isActive: false, // 아직 비활성 (검증 필요)
    };

    await this.feedbackRepo.savePattern(newPattern);
  }

  private generateLearningInsight(
    rewardBreakdown: ReturnType<typeof computeReward>,
    patternId?: string
  ): string {
    const parts: string[] = [];

    if (rewardBreakdown.total > 0.5) {
      parts.push('우수한 결과');
    } else if (rewardBreakdown.total > 0) {
      parts.push('양호한 결과');
    } else {
      parts.push('개선 필요');
    }

    if (patternId) {
      parts.push(`패턴 ${patternId} 신뢰도 업데이트됨`);
    } else if (rewardBreakdown.total > 0.5) {
      parts.push('새 패턴 후보 등록됨');
    }

    parts.push(rewardBreakdown.explanation);

    return parts.join('. ');
  }

  private wrapResult(
    result: IOptimizationCycleResult,
    timestamp: Timestamp
  ): IResult<IOptimizationCycleResult> {
    return {
      success: result.success,
      data: result,
      metadata: {
        timestamp,
        duration_ms: 0,
      },
    };
  }
}

/**
 * 에이전트 인스턴스 생성
 */
export function createSensorOptimizerAgent(
  feedbackRepo: IFeedbackRepository,
  config?: Partial<ISensorOptimizerAgentConfig>
): SensorOptimizerAgent {
  return new SensorOptimizerAgent(feedbackRepo, config);
}

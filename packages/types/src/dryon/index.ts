/**
 * @forge/types - DRYON Types
 * L0 (Atoms) - DRYON 도메인 타입 통합 export
 *
 * 자가개선 성장 루프 (Self-Improving Growth Loop) 패턴 지원
 */

// Sensor Types (SENSE 단계)
export {
  type SensorType,
  type SensorProtocol,
  type DataQuality,
  type ISensorMeta,
  type ISensorReading,
  type ISensorState,
  type ISensorAggregates,
  type ISensorConfig,
  type ISensor,
} from './sensor.js';

// Recommendation Types (DECIDE, ACT 단계)
export {
  type OptimizationType,
  type Priority,
  type ExecutionMode,
  type IOptimizationAction,
  type IPredictedEffect,
  type IOptimizationRecommendation,
  type RecommendationStatus,
  type IRecommendationResult,
  type ISafetyLimits,
  type IRecommendationFilter,
  DEFAULT_SAFETY_LIMITS,
} from './recommendation.js';

// Feedback Types (LEARN 단계 - 핵심!)
export {
  type ILearningExperience,
  type IOutcomeMetrics,
  type ILearningPattern,
  type IPatternConditions,
  type IPatternStats,
  type ILearningFeedback,
  type FeedbackType,
  type FeedbackSource,
  type IModelState,
  type ILearningConfig,
  DEFAULT_LEARNING_CONFIG,
} from './feedback.js';

// Alarm Types (알람 관리)
export {
  type AlarmPriority,
  type AlarmCategory,
  type AlarmStatus,
  type ComparisonOp,
  type IAlarmCondition,
  type IAlarmRule,
  type IAlarm,
  type IEscalationLevel,
  type IEscalationConfig,
  type IAlarmEvent,
  type IEscalationHistory,
  type IAlarmStats,
  type IAlarmFilter,
  type IAlarmDashboard,
  PRIORITY_RESPONSE_TIMES,
  DEFAULT_ESCALATION_CONFIG,
} from './alarm.js';

// Energy Types (에너지 모니터링)
export {
  type EnergyType,
  type TimeOfUse,
  type AggregationPeriod,
  type EfficiencyCategory,
  type IEnergyReading,
  type IEnergyConsumption,
  type IEfficiencyMetrics,
  type IEfficiencyBenchmark,
  type IEnergyTariff,
  type IEnergyCost,
  type IPeakDemand,
  type IEfficiencyRecommendation,
  type IEnergyDashboard,
  type IEnergyMonitorConfig,
  DEFAULT_ENERGY_CONFIG,
  DEFAULT_EFFICIENCY_BENCHMARK,
  ENERGY_CONVERSION,
} from './energy.js';

/**
 * DRYON - K-슬러지 AI 건조/처리 최적화
 * L3 (Tissues) - 앱 엔트리 포인트
 *
 * 자가개선 성장 루프 (Self-Improving Growth Loop) 패턴 적용
 *
 * ┌──────────────────────────────────────────────────────────────┐
 * │                    DRYON AI 시스템                           │
 * ├──────────────────────────────────────────────────────────────┤
 * │                                                              │
 * │   ┌──────────┐    ┌──────────┐    ┌──────────┐              │
 * │   │  SENSE   │───▶│  DECIDE  │───▶│   ACT    │              │
 * │   │ 센서수집  │    │ 패턴분석  │    │ 파라미터  │              │
 * │   └──────────┘    └──────────┘    └──────────┘              │
 * │        ▲                               │                     │
 * │        │         ┌──────────┐          │                     │
 * │        └─────────│  LEARN   │◀─────────┘                     │
 * │                  │ 보상학습  │                                │
 * │                  └──────────┘                                │
 * │                                                              │
 * │   핵심: 실행 결과의 보상(Reward)을 통해 패턴 신뢰도 갱신       │
 * │         → 시스템이 스스로 최적화 방향을 학습                   │
 * │                                                              │
 * └──────────────────────────────────────────────────────────────┘
 */

// ============================================
// L3 Agent Exports
// ============================================

export {
  SensorOptimizerAgent,
  createSensorOptimizerAgent,
  type ISensorOptimizerAgentConfig,
  type IOptimizationCycleResult,
} from './agents/sensor-optimizer-agent.js';

export {
  AlarmManagerAgent,
  createAlarmManagerAgent,
  type IAlarmManagerAgentConfig,
  type INotificationHandler,
  type IEvaluationResult,
  type IEscalationResult,
  type IAlarmDashboardData,
} from './agents/alarm-manager-agent.js';

export {
  EnergyMonitorAgent,
  createEnergyMonitorAgent,
  type IEnergyMonitorAgentConfig,
} from './agents/energy-monitor-agent.js';

// ============================================
// Re-exports from Dependencies
// ============================================

// L0 Types
export { DryonTypes } from '@forge/types';

// L1 Utilities (Reward Functions)
export {
  computeReward,
  calculateStateChange,
  updateConfidence,
  shouldExplore,
  calculatePatternMatchScore,
  DEFAULT_REWARD_WEIGHTS,
  type IRewardWeights,
  type IRewardBreakdown,
} from '@forge/utils';

// L1 Utilities (Alarm Evaluation)
export {
  evaluateAlarmCondition,
  evaluateAlarmRule,
  checkDeadband,
  calculateAlarmScore,
  prioritizeAlarms,
  filterUnacknowledged,
  filterNeedingEscalation,
  calculateAvgAcknowledgeTime,
  calculateAvgResolutionTime,
  countAlarmsByCode,
  type IConditionEvalResult,
  type IRuleEvalResult,
} from '@forge/utils';

// L1 Utilities (Energy Calculation)
export {
  calculateSEC,
  calculateSECPerformance,
  calculateCOP,
  calculateDryingEfficiency,
  calculateMoistureRemoved,
  calculateLoadFactor,
  calculatePowerFactor,
  calculateApparentPower,
  analyzePeakDemand,
  calculatePeakUtilization,
  calculateEnergyCostByTOU,
  calculateDemandCharge,
  calculateUnitEnergyCost,
  convertToKwh,
  calculateTotalEnergy,
  determineTimeOfUse,
  isSummerSeason,
  detectEnergyAnomaly,
  compareToBenchmark,
  predictConsumption,
  type ITOURates,
  type IAnomalyResult,
  type IBenchmarkComparison,
} from '@forge/utils';

// L2 Repositories
export {
  type IFeedbackRepository,
  InMemoryFeedbackRepository,
  createFeedbackRepository,
  type IAlarmRepository,
  InMemoryAlarmRepository,
  createAlarmRepository,
  type IEnergyRepository,
  InMemoryEnergyRepository,
  createEnergyRepository,
} from '@forge/core';

// ============================================
// Convenience Factory
// ============================================

import { createSensorOptimizerAgent, type ISensorOptimizerAgentConfig } from './agents/sensor-optimizer-agent.js';
import { createAlarmManagerAgent, type IAlarmManagerAgentConfig } from './agents/alarm-manager-agent.js';
import { createEnergyMonitorAgent, type IEnergyMonitorAgentConfig } from './agents/energy-monitor-agent.js';
import { createFeedbackRepository, createAlarmRepository, createEnergyRepository } from '@forge/core';

/**
 * DRYON 센서 최적화 시스템 초기화
 *
 * 모든 의존성이 연결된 최적화 에이전트 생성
 */
export function initializeDryonSystem(
  config?: Partial<ISensorOptimizerAgentConfig>
) {
  // L2 Repository 생성
  const feedbackRepo = createFeedbackRepository();

  // L3 Agent 생성
  const agent = createSensorOptimizerAgent(feedbackRepo, config);

  return {
    agent,
    feedbackRepo,
  };
}

/**
 * DRYON 알람 관리 시스템 초기화
 *
 * 모든 의존성이 연결된 알람 관리자 에이전트 생성
 */
export function initializeAlarmSystem(
  config?: Partial<IAlarmManagerAgentConfig>
) {
  // L2 Repository 생성
  const alarmRepo = createAlarmRepository();

  // L3 Agent 생성
  const agent = createAlarmManagerAgent(alarmRepo, config);

  return {
    agent,
    alarmRepo,
  };
}

/**
 * DRYON 에너지 모니터링 시스템 초기화
 *
 * 모든 의존성이 연결된 에너지 모니터 에이전트 생성
 */
export function initializeEnergySystem(
  config?: Partial<IEnergyMonitorAgentConfig>
) {
  // L2 Repository 생성
  const energyRepo = createEnergyRepository();

  // L3 Agent 생성
  const agent = createEnergyMonitorAgent(energyRepo, config);

  return {
    agent,
    energyRepo,
  };
}

/**
 * 기본 내보내기: 시스템 초기화 함수
 */
export default initializeDryonSystem;

console.log('DRYON - K-슬러지 AI 건조/처리 최적화 v3.0.0 (센서최적화 + 알람관리 + 에너지모니터링)');

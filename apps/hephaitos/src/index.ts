/**
 * HEPHAITOS - 트레이딩 AI 에이전트 엔진
 *
 * 진입점
 */

// ============================================
// L3 Agents
// ============================================

// Portfolio Sync Agent
export {
  PortfolioSyncAgent,
  createPortfolioSyncAgent,
  type IPortfolioSyncAgentConfig,
} from './agents/portfolio-sync-agent.js';

// Backtest Agent
export {
  BacktestAgent,
  createBacktestAgent,
  type IBacktestAgentConfig,
} from './agents/backtest-agent.js';

// Order Executor Agent
export {
  OrderExecutorAgent,
  createOrderExecutorAgent,
  type IOrderExecutorAgentConfig,
  type IOrderSubmitResult,
  type IClosePositionResult,
} from './agents/order-executor-agent.js';

// ============================================
// Re-exports from Dependencies
// ============================================

// L0 Types
export { HephaitosTypes } from '@forge/types';

// L1 Utilities (Backtest Calculations)
export {
  calculatePerformanceMetrics,
  calculateSharpeRatio,
  calculateWinRate,
  calculateProfitFactor,
  detectEntrySignal,
  detectExitSignal,
  calculateSMA,
  calculateEMA,
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
} from '@forge/utils';

// L1 Utilities (Order Calculations)
export {
  calculatePositionSize,
  calculateRequiredMargin,
  calculateLeverage,
  calculateStopLossPrice,
  calculateTakeProfitPrice,
  calculateTakeProfitByRR,
  updateTrailingStopPrice,
  calculatePnL,
  calculatePnLPercent,
  calculateUnrealizedPnL,
  calculateAvgEntryPrice,
  calculateRiskRewardRatio,
  validateOrder,
  type IPositionSizeInput,
  type IPositionSizeResult,
  type IOrderValidation,
} from '@forge/utils';

// L2 Services & Repositories
export {
  type IPriceDataService,
  type IStrategyRepository,
  type IBacktestResultRepository,
  type IOrderRepository,
  type IPositionRepository,
  createPriceDataService,
  createStrategyRepository,
  createBacktestResultRepository,
  createOrderRepository,
  createPositionRepository,
} from '@forge/core';

// ============================================
// Convenience Factory
// ============================================

import { createBacktestAgent, type IBacktestAgentConfig } from './agents/backtest-agent.js';
import { createOrderExecutorAgent, type IOrderExecutorAgentConfig } from './agents/order-executor-agent.js';
import {
  createPriceDataService,
  createStrategyRepository,
  createBacktestResultRepository,
  createOrderRepository,
  createPositionRepository,
} from '@forge/core';

/**
 * HEPHAITOS 백테스트 시스템 초기화
 *
 * 모든 의존성이 연결된 백테스트 에이전트 생성
 */
export function initializeBacktestSystem(config?: IBacktestAgentConfig) {
  const priceDataService = createPriceDataService();
  const strategyRepo = createStrategyRepository();
  const resultRepo = createBacktestResultRepository();

  const agent = createBacktestAgent(
    priceDataService,
    strategyRepo,
    resultRepo,
    config
  );

  return {
    agent,
    priceDataService,
    strategyRepo,
    resultRepo,
  };
}

/**
 * HEPHAITOS 주문 실행 시스템 초기화
 *
 * 모든 의존성이 연결된 주문 실행 에이전트 생성
 *
 * ⚠️ 면책조항: 본 시스템은 교육 및 시뮬레이션 목적입니다.
 * 실제 투자 조언이 아니며, 투자 결정에 따른 손실은 본인 책임입니다.
 */
export function initializeOrderExecutionSystem(
  config?: Partial<IOrderExecutorAgentConfig>
) {
  const orderRepo = createOrderRepository();
  const positionRepo = createPositionRepository();

  const agent = createOrderExecutorAgent(orderRepo, positionRepo, config);

  return {
    agent,
    orderRepo,
    positionRepo,
  };
}

console.log('HEPHAITOS - 트레이딩 AI 에이전트 엔진 v3.0.0 (백테스팅 + 주문 실행)');

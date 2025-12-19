/**
 * FOLIO - 소상공인 AI SaaS
 *
 * 진입점
 */

// ============================================
// L3 Agents
// ============================================

// Competitor Monitor Agent
export {
  CompetitorMonitorAgent,
  createCompetitorMonitorAgent,
  type ICompetitorMonitorAgentConfig,
  type IMonitoringResult,
  type ICompetitorAnalysis,
} from './agents/competitor-monitor-agent.js';

// Sales Forecast Agent
export {
  SalesForecastAgent,
  createSalesForecastAgent,
  type ISalesForecastAgentConfig,
} from './agents/sales-forecast-agent.js';

// Inventory Optimizer Agent
export {
  InventoryOptimizerAgent,
  createInventoryOptimizerAgent,
  type IInventoryOptimizerConfig,
  type IDemandData,
} from './agents/inventory-optimizer-agent.js';

// ============================================
// Re-exports from Dependencies
// ============================================

// L0 Types
export { FolioTypes } from '@forge/types';

// L1 Utilities (Time Series & Forecast)
export {
  extractSeasonalPattern,
  forecastHoltLinear,
  forecastExponential,
  applySeasonalAdjustment,
  applyExternalFactors,
  calculateMAPE,
} from '@forge/utils';

// L1 Utilities (Inventory Calculation)
export {
  calculateEOQ,
  calculateROP,
  calculateSafetyStock,
  calculateDaysOfSupply,
  calculateStockoutRisk,
  classifyABC,
  calculateOrderQuantity,
  calculateOrderUrgency,
  type IEOQResult,
  type IABCResult,
} from '@forge/utils';

// L2 Services & Repositories
export {
  type ISalesDataService,
  type IForecastRepository,
  type IInventoryRepository,
  createSalesDataService,
  createForecastRepository,
  createInventoryRepository,
} from '@forge/core';

// ============================================
// Convenience Factory
// ============================================

import { createSalesForecastAgent, type ISalesForecastAgentConfig } from './agents/sales-forecast-agent.js';
import { createInventoryOptimizerAgent, type IInventoryOptimizerConfig } from './agents/inventory-optimizer-agent.js';
import {
  createSalesDataService,
  createForecastRepository,
  createInventoryRepository,
} from '@forge/core';

/**
 * FOLIO 매출 예측 시스템 초기화
 */
export function initializeForecastSystem(config?: Partial<ISalesForecastAgentConfig>) {
  const salesDataService = createSalesDataService();
  const forecastRepo = createForecastRepository();

  const agent = createSalesForecastAgent(
    salesDataService,
    forecastRepo,
    config
  );

  return {
    agent,
    salesDataService,
    forecastRepo,
  };
}

/**
 * FOLIO 재고 최적화 시스템 초기화
 */
export function initializeInventorySystem(config?: Partial<IInventoryOptimizerConfig>) {
  const inventoryRepo = createInventoryRepository();

  const agent = createInventoryOptimizerAgent(inventoryRepo, config);

  return {
    agent,
    inventoryRepo,
  };
}

console.log('FOLIO - 소상공인 AI SaaS v3.0.0 (매출 예측 + 재고 최적화)');

/**
 * @forge/utils - L1 유틸리티 함수 (Molecules)
 *
 * 순수 함수 기반 유틸리티 모음
 * 부작용 없이 입력에서 출력을 생성
 */

// Balance Utilities
export {
  normalizeBalance,
  calculateTotalValue,
  sortByValue,
  filterDust,
} from './balance.js';

// Currency Utilities
export {
  convertCurrency,
  updateRatesCache,
  getCachedRates,
  formatCurrency,
  abbreviateNumber,
  formatPercent,
  type IExchangeRates,
} from './currency.js';

// PnL Utilities
export {
  calculateAssetPnL,
  calculatePortfolioPnL,
  calculateSnapshotReturn,
  calculatePeriodReturns,
  calculateSharpeRatio,
  calculateMaxDrawdown,
  type IPnLResult,
  type IPeriodReturn,
} from './pnl.js';

// Validation Utilities
export {
  validateApiKey,
  isValidSymbol,
  isValidAmount,
  isValidUUID,
  isValidTimestamp,
  isValidEmail,
  validatePortfolioName,
  validateRequiredFields,
  type IValidationResult,
} from './validation.js';

// Geo Utilities
export {
  calculateDistance,
  createBoundingBox,
  isWithinBoundingBox,
  isWithinRadius,
  calculateCentroid,
  sortByDistance,
  formatDistance,
} from './geo.js';

// Reward Utilities (자가개선 성장 루프)
export {
  computeReward,
  calculateStateChange,
  updateConfidence,
  shouldExplore,
  calculatePatternMatchScore,
  DEFAULT_REWARD_WEIGHTS,
  type IRewardWeights,
  type IRewardBreakdown,
} from './reward.js';

// Backtest Calculation Utilities (HEPHAITOS)
export {
  calculateTotalReturn,
  calculateAnnualizedReturn,
  calculateDailyReturns,
  calculateSharpeRatio as calculateBacktestSharpe,
  calculateSortinoRatio,
  calculateCalmarRatio,
  calculateDrawdownSeries,
  calculateMaxDrawdown as calculateBacktestMaxDrawdown,
  calculateAvgDrawdown,
  extractDrawdownRecords,
  calculateWinRate,
  calculateProfitFactor,
  calculateAvgWinLoss,
  calculateConsecutiveWinsLosses,
  calculateExpectancy,
  calculateAvgHoldingPeriod,
  calculateMonthlyReturns,
  calculatePerformanceMetrics,
} from './backtest-calc.js';

// Signal Detection Utilities (HEPHAITOS)
export {
  calculateSMA,
  calculateEMA,
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  calculateATR,
  getIndicatorValues,
  evaluateComparison,
  evaluateCondition,
  evaluateConditionGroup,
  detectEntrySignal,
  detectExitSignal,
} from './signal-detector.js';

// Time Series Analysis (FOLIO)
export {
  calculateSimpleMovingAverage,
  calculateWeightedMovingAverage,
  exponentialSmoothing,
  doubleExponentialSmoothing,
  decomposeAdditive,
  decomposeMultiplicative,
  extractSeasonalPattern,
  calculateLinearTrend,
  calculateGrowthRate,
  calculateCAGR,
  type IDecompositionResult,
} from './time-series.js';

// Forecast Calculation (FOLIO)
export {
  forecastSimpleMA,
  forecastWeightedMA,
  forecastExponential,
  forecastHoltLinear,
  applySeasonalAdjustment,
  calculateWeatherImpact,
  calculateHolidayImpact,
  calculateEventImpact,
  applyExternalFactors,
  calculateConfidenceInterval,
  calculateSimpleConfidenceInterval,
  calculateMAPE,
  calculateRMSE,
  calculateMAE,
  type ISimpleForecast,
} from './forecast-calc.js';

// Alarm Evaluation (DRYON)
export {
  evaluateCondition as evaluateAlarmCondition,
  evaluateRule as evaluateAlarmRule,
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
} from './alarm-eval.js';

// Order Calculation (HEPHAITOS)
export {
  calculatePositionSize,
  calculateRequiredMargin,
  calculateLeverage,
  calculateLiquidationPrice,
  calculateStopLossPrice,
  calculateATRStopLoss,
  calculateTakeProfitPrice,
  calculateTakeProfitByRR,
  updateTrailingStopPrice,
  calculatePnL,
  calculatePnLPercent,
  calculateUnrealizedPnL,
  calculateAvgEntryPrice,
  calculateRiskRewardRatio,
  calculateRMultiple,
  validateOrder,
  simulateSlippage,
  calculateSlippage,
  type IPositionSizeInput,
  type IPositionSizeResult,
  type IOrderValidation,
} from './order-calc.js';

// Inventory Calculation (FOLIO)
export {
  calculateEOQ,
  calculateROP,
  calculateSafetyStock,
  calculateSafetyStockByDays,
  calculateTurnoverRate,
  calculateDaysOfSupply,
  estimateStockoutDate,
  calculateAnnualHoldingCost,
  calculateHoldingCostPerUnit,
  calculateStockoutRisk,
  determineStockStatus,
  classifyABC,
  calculateOrderQuantity,
  calculateOrderUrgency,
  calculateDemandStatistics,
  type IEOQInput,
  type IEOQResult,
  type IROPInput,
  type ISafetyStockInput,
  type IABCInput,
  type IABCResult,
  type IOrderQuantityInput,
} from './inventory-calc.js';

// Energy Calculation (DRYON)
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
} from './energy-calc.js';

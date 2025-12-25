/**
 * Analytics Module Exports
 * QRY-021: 성과 분석 및 리포팅
 */

export {
  PerformanceCalculator,
  performanceCalculator,
  type ReportPeriod,
  type BenchmarkType,
  type TradeRecord,
  type PortfolioSnapshot,
  type PerformanceReport,
  type BenchmarkComparison,
} from './performance-calculator'

export {
  useAnalytics,
  usePageViewTracking,
  trackEvent,
  analyticsEvents,
  type AnalyticsEvent,
} from './useAnalytics'

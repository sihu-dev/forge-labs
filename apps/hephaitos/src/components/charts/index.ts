/**
 * Charts Components Index
 * Lightweight Charts + SVG 기반 차트 컴포넌트
 * Recharts 의존성 제거로 -900KB 번들 최적화
 */

// ============================================
// TradingView Lightweight Charts 기반
// ============================================

export { TradingChart } from './TradingChart'
export type { TradingChartProps, OHLCVData, IndicatorOverlay, IndicatorPane } from './TradingChart'

export { IndicatorChart } from './IndicatorChart'
export type { IndicatorChartProps } from './IndicatorChart'

export { EquityCurveChart } from './EquityCurveChart'

export { LWAreaChart } from './LWAreaChart'
export type { AreaChartDataPoint, LWAreaChartProps } from './LWAreaChart'

export { LWHistogramChart } from './LWHistogramChart'
export type { HistogramDataPoint, LWHistogramChartProps } from './LWHistogramChart'

// ============================================
// SVG 기반 (Lightweight Charts 미지원 유형)
// ============================================

export { SVGPieChart } from './SVGPieChart'
export type { PieChartDataPoint, SVGPieChartProps } from './SVGPieChart'

export { SVGScatterChart } from './SVGScatterChart'
export type { ScatterDataPoint, SVGScatterChartProps } from './SVGScatterChart'

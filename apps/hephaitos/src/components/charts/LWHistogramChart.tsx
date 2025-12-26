'use client'

/**
 * Lightweight Charts Histogram/Bar Chart
 * Recharts BarChart 대체 컴포넌트
 * -200KB 번들 사이즈 절약
 */

import { memo, useRef, useEffect } from 'react'
import {
  createChart,
  ColorType,
  LineStyle,
  CrosshairMode,
  HistogramSeries,
  LineSeries,
  type IChartApi,
  type ISeriesApi,
  type Time,
  type HistogramData,
} from 'lightweight-charts'

// ============================================
// Types
// ============================================

export interface HistogramDataPoint {
  time: string | number | Date
  value: number
  color?: string
}

export interface LWHistogramChartProps {
  data: HistogramDataPoint[]
  height?: number
  positiveColor?: string
  negativeColor?: string
  defaultColor?: string
  showReferenceLine?: boolean
  referenceLineValue?: number
  referenceLineColor?: string
  showTrendLine?: boolean
  trendLineColor?: string
  yAxisFormatter?: (value: number) => string
  className?: string
}

// ============================================
// Theme
// ============================================

const chartTheme = {
  background: 'transparent',
  textColor: '#71717a',
  gridColor: 'rgba(255, 255, 255, 0.04)',
  borderColor: 'rgba(255, 255, 255, 0.06)',
  crosshairColor: '#5E6AD2',
}

// ============================================
// Utility
// ============================================

function convertToTime(input: string | number | Date): Time {
  if (typeof input === 'number') {
    return input as Time
  }
  const date = input instanceof Date ? input : new Date(input)
  return Math.floor(date.getTime() / 1000) as Time
}

// ============================================
// Component
// ============================================

export const LWHistogramChart = memo(function LWHistogramChart({
  data,
  height = 160,
  positiveColor = '#34d399',
  negativeColor = '#f87171',
  defaultColor,
  showReferenceLine = true,
  referenceLineValue = 0,
  referenceLineColor = 'rgba(255, 255, 255, 0.1)',
  showTrendLine = false,
  trendLineColor = '#5E6AD2',
  yAxisFormatter,
  className = '',
}: LWHistogramChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const histogramSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null)
  const refLineSeriesRef = useRef<ISeriesApi<'Line'> | null>(null)
  const trendLineSeriesRef = useRef<ISeriesApi<'Line'> | null>(null)

  // Initialize chart
  useEffect(() => {
    if (!containerRef.current) return

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height,
      layout: {
        background: { type: ColorType.Solid, color: chartTheme.background },
        textColor: chartTheme.textColor,
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 10,
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: chartTheme.gridColor, style: LineStyle.Dotted },
      },
      crosshair: {
        mode: CrosshairMode.Magnet,
        vertLine: {
          color: chartTheme.crosshairColor,
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#27272a',
        },
        horzLine: {
          color: chartTheme.crosshairColor,
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#27272a',
        },
      },
      rightPriceScale: {
        borderColor: chartTheme.borderColor,
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderColor: chartTheme.borderColor,
        timeVisible: false,
        fixLeftEdge: true,
        fixRightEdge: true,
      },
      handleScale: false,
      handleScroll: false,
    })

    chartRef.current = chart

    // Add histogram series
    const histogramSeries = chart.addSeries(HistogramSeries, {
      priceFormat: {
        type: 'custom',
        formatter: yAxisFormatter || ((price: number) => price.toFixed(2)),
      },
    })
    histogramSeriesRef.current = histogramSeries

    // Handle resize
    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth })
      }
    }

    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(containerRef.current)

    return () => {
      resizeObserver.disconnect()
      chart.remove()
      chartRef.current = null
      histogramSeriesRef.current = null
      refLineSeriesRef.current = null
      trendLineSeriesRef.current = null
    }
  }, [height, yAxisFormatter])

  // Update data
  useEffect(() => {
    if (!chartRef.current || !histogramSeriesRef.current || data.length === 0) return

    const chartData: HistogramData<Time>[] = data
      .map((d, index) => {
        const color = d.color || (defaultColor || (d.value >= 0 ? positiveColor : negativeColor))
        return {
          time: typeof d.time === 'number' && d.time < 100000
            ? (index as unknown as Time) // Use index if small numbers (for bar indices)
            : convertToTime(d.time),
          value: d.value,
          color,
        }
      })

    histogramSeriesRef.current.setData(chartData)

    // Reference line
    if (showReferenceLine) {
      if (!refLineSeriesRef.current) {
        refLineSeriesRef.current = chartRef.current.addSeries(LineSeries, {
          color: referenceLineColor,
          lineWidth: 1,
          lineStyle: LineStyle.Solid,
          crosshairMarkerVisible: false,
          lastValueVisible: false,
          priceLineVisible: false,
        })
      }
      const refLineData = chartData.map((d) => ({
        time: d.time,
        value: referenceLineValue,
      }))
      refLineSeriesRef.current.setData(refLineData)
    }

    // Trend line
    if (showTrendLine) {
      if (!trendLineSeriesRef.current) {
        trendLineSeriesRef.current = chartRef.current.addSeries(LineSeries, {
          color: trendLineColor,
          lineWidth: 2,
          crosshairMarkerVisible: false,
          lastValueVisible: false,
          priceLineVisible: false,
        })
      }
      const trendData = chartData.map((d) => ({
        time: d.time,
        value: d.value,
      }))
      trendLineSeriesRef.current.setData(trendData)
    }

    chartRef.current.timeScale().fitContent()
  }, [data, positiveColor, negativeColor, defaultColor, showReferenceLine, referenceLineValue, referenceLineColor, showTrendLine, trendLineColor])

  return <div ref={containerRef} className={`w-full ${className}`} />
})

export default LWHistogramChart

'use client'

/**
 * Lightweight Charts Area/Line Chart
 * Recharts AreaChart/LineChart 대체 컴포넌트
 * -200KB 번들 사이즈 절약
 */

import { memo, useRef, useEffect, useCallback } from 'react'
import {
  createChart,
  ColorType,
  LineStyle,
  CrosshairMode,
  AreaSeries,
  LineSeries,
  type IChartApi,
  type ISeriesApi,
  type Time,
  type AreaData,
  type LineData,
} from 'lightweight-charts'

// ============================================
// Types
// ============================================

export interface AreaChartDataPoint {
  time: string | number | Date
  value: number
  value2?: number // For dual series
}

export interface LWAreaChartProps {
  data: AreaChartDataPoint[]
  height?: number
  lineColor?: string
  areaTopColor?: string
  areaBottomColor?: string
  showArea?: boolean
  showLine2?: boolean
  line2Color?: string
  referenceLine?: number
  referenceLineColor?: string
  yAxisFormatter?: (value: number) => string
  tooltipFormatter?: (value: number) => string
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

export const LWAreaChart = memo(function LWAreaChart({
  data,
  height = 200,
  lineColor = '#34d399',
  areaTopColor = 'rgba(52, 211, 153, 0.3)',
  areaBottomColor = 'rgba(52, 211, 153, 0)',
  showArea = true,
  showLine2 = false,
  line2Color = '#f59e0b',
  referenceLine,
  referenceLineColor = 'rgba(255, 255, 255, 0.1)',
  yAxisFormatter,
  className = '',
}: LWAreaChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const areaSeriesRef = useRef<ISeriesApi<'Area'> | null>(null)
  const line2SeriesRef = useRef<ISeriesApi<'Line'> | null>(null)
  const refLineSeriesRef = useRef<ISeriesApi<'Line'> | null>(null)

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
        vertLines: { color: chartTheme.gridColor, style: LineStyle.Dotted },
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

    // Add area/line series
    if (showArea) {
      const areaSeries = chart.addSeries(AreaSeries, {
        lineColor,
        topColor: areaTopColor,
        bottomColor: areaBottomColor,
        lineWidth: 2,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 4,
        priceFormat: {
          type: 'custom',
          formatter: yAxisFormatter || ((price: number) => price.toFixed(2)),
        },
      })
      areaSeriesRef.current = areaSeries
    } else {
      const lineSeries = chart.addSeries(LineSeries, {
        color: lineColor,
        lineWidth: 2,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 4,
        priceFormat: {
          type: 'custom',
          formatter: yAxisFormatter || ((price: number) => price.toFixed(2)),
        },
      })
      areaSeriesRef.current = lineSeries as unknown as ISeriesApi<'Area'>
    }

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
      areaSeriesRef.current = null
      line2SeriesRef.current = null
      refLineSeriesRef.current = null
    }
  }, [height, lineColor, areaTopColor, areaBottomColor, showArea, yAxisFormatter])

  // Update data
  useEffect(() => {
    if (!chartRef.current || !areaSeriesRef.current || data.length === 0) return

    const chartData: AreaData<Time>[] = data
      .map((d) => ({
        time: convertToTime(d.time),
        value: d.value,
      }))
      .sort((a, b) => (a.time as number) - (b.time as number))

    areaSeriesRef.current.setData(chartData)

    // Second line series
    if (showLine2 && data.some(d => d.value2 !== undefined)) {
      if (!line2SeriesRef.current) {
        line2SeriesRef.current = chartRef.current.addSeries(LineSeries, {
          color: line2Color,
          lineWidth: 2,
          crosshairMarkerVisible: false,
        })
      }
      const line2Data: LineData<Time>[] = data
        .filter(d => d.value2 !== undefined)
        .map((d) => ({
          time: convertToTime(d.time),
          value: d.value2!,
        }))
        .sort((a, b) => (a.time as number) - (b.time as number))
      line2SeriesRef.current.setData(line2Data)
    }

    // Reference line
    if (referenceLine !== undefined) {
      if (!refLineSeriesRef.current) {
        refLineSeriesRef.current = chartRef.current.addSeries(LineSeries, {
          color: referenceLineColor,
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          crosshairMarkerVisible: false,
          lastValueVisible: false,
          priceLineVisible: false,
        })
      }
      const refLineData: LineData<Time>[] = chartData.map((d) => ({
        time: d.time,
        value: referenceLine,
      }))
      refLineSeriesRef.current.setData(refLineData)
    }

    chartRef.current.timeScale().fitContent()
  }, [data, showLine2, line2Color, referenceLine, referenceLineColor])

  return <div ref={containerRef} className={`w-full ${className}`} />
})

export default LWAreaChart

'use client'

/**
 * SVG Scatter Chart Component
 * Recharts ScatterChart 대체 - 순수 SVG 구현
 * -200KB 번들 사이즈 절약
 */

import { memo, useState, useCallback, useMemo } from 'react'

// ============================================
// Types
// ============================================

export interface ScatterDataPoint {
  x: number
  y: number
  z?: number // Optional size value
  label?: string
  color?: string
}

export interface SVGScatterChartProps {
  data: ScatterDataPoint[]
  width?: number
  height?: number
  xLabel?: string
  yLabel?: string
  positiveColor?: string
  negativeColor?: string
  minRadius?: number
  maxRadius?: number
  showGrid?: boolean
  showReferenceLineY?: boolean
  referenceLineYValue?: number
  xAxisFormatter?: (value: number) => string
  yAxisFormatter?: (value: number) => string
  tooltipContent?: (point: ScatterDataPoint) => React.ReactNode
  className?: string
}

// ============================================
// Component
// ============================================

export const SVGScatterChart = memo(function SVGScatterChart({
  data,
  width = 300,
  height = 200,
  xLabel = 'X',
  yLabel = 'Y',
  positiveColor = '#34d399',
  negativeColor = '#f87171',
  minRadius = 5,
  maxRadius = 20,
  showGrid = true,
  showReferenceLineY = true,
  referenceLineYValue = 0,
  xAxisFormatter = (v) => v.toFixed(0),
  yAxisFormatter = (v) => v.toFixed(0),
  tooltipContent,
  className = '',
}: SVGScatterChartProps) {
  const [activePoint, setActivePoint] = useState<number | null>(null)

  // Calculate bounds
  const bounds = useMemo(() => {
    if (data.length === 0) {
      return { minX: 0, maxX: 100, minY: -50, maxY: 50, minZ: 1, maxZ: 1 }
    }

    const xValues = data.map((d) => d.x)
    const yValues = data.map((d) => d.y)
    const zValues = data.filter((d) => d.z !== undefined).map((d) => d.z!)

    const minX = Math.min(...xValues)
    const maxX = Math.max(...xValues)
    const minY = Math.min(...yValues, referenceLineYValue)
    const maxY = Math.max(...yValues, referenceLineYValue)
    const minZ = zValues.length > 0 ? Math.min(...zValues) : 1
    const maxZ = zValues.length > 0 ? Math.max(...zValues) : 1

    // Add some padding
    const xPadding = (maxX - minX) * 0.1 || 10
    const yPadding = (maxY - minY) * 0.1 || 10

    return {
      minX: minX - xPadding,
      maxX: maxX + xPadding,
      minY: minY - yPadding,
      maxY: maxY + yPadding,
      minZ,
      maxZ,
    }
  }, [data, referenceLineYValue])

  // Chart dimensions
  const margin = { top: 20, right: 20, bottom: 40, left: 50 }
  const chartWidth = width - margin.left - margin.right
  const chartHeight = height - margin.top - margin.bottom

  // Scale functions
  const scaleX = useCallback(
    (value: number) => {
      return ((value - bounds.minX) / (bounds.maxX - bounds.minX)) * chartWidth
    },
    [bounds, chartWidth]
  )

  const scaleY = useCallback(
    (value: number) => {
      return chartHeight - ((value - bounds.minY) / (bounds.maxY - bounds.minY)) * chartHeight
    },
    [bounds, chartHeight]
  )

  const scaleRadius = useCallback(
    (value: number | undefined) => {
      if (value === undefined || bounds.maxZ === bounds.minZ) return (minRadius + maxRadius) / 2
      return minRadius + ((value - bounds.minZ) / (bounds.maxZ - bounds.minZ)) * (maxRadius - minRadius)
    },
    [bounds, minRadius, maxRadius]
  )

  // Generate grid lines
  const gridLines = useMemo(() => {
    const xLines: number[] = []
    const yLines: number[] = []

    const xStep = (bounds.maxX - bounds.minX) / 5
    const yStep = (bounds.maxY - bounds.minY) / 5

    for (let i = 0; i <= 5; i++) {
      xLines.push(bounds.minX + i * xStep)
      yLines.push(bounds.minY + i * yStep)
    }

    return { xLines, yLines }
  }, [bounds])

  // Points with positions
  const points = useMemo(() => {
    return data.map((d, i) => ({
      ...d,
      index: i,
      cx: scaleX(d.x),
      cy: scaleY(d.y),
      r: scaleRadius(d.z),
      fillColor: d.color || (d.y >= 0 ? positiveColor : negativeColor),
    }))
  }, [data, scaleX, scaleY, scaleRadius, positiveColor, negativeColor])

  if (data.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ width, height }}>
        <span className="text-xs text-zinc-500">데이터 없음</span>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <svg width={width} height={height} className="overflow-visible">
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          {/* Grid */}
          {showGrid && (
            <g className="text-zinc-800">
              {/* Horizontal grid lines */}
              {gridLines.yLines.map((y, i) => (
                <line
                  key={`h-${i}`}
                  x1={0}
                  y1={scaleY(y)}
                  x2={chartWidth}
                  y2={scaleY(y)}
                  stroke="currentColor"
                  strokeWidth={1}
                  strokeDasharray="2,2"
                  opacity={0.3}
                />
              ))}
              {/* Vertical grid lines */}
              {gridLines.xLines.map((x, i) => (
                <line
                  key={`v-${i}`}
                  x1={scaleX(x)}
                  y1={0}
                  x2={scaleX(x)}
                  y2={chartHeight}
                  stroke="currentColor"
                  strokeWidth={1}
                  strokeDasharray="2,2"
                  opacity={0.3}
                />
              ))}
            </g>
          )}

          {/* Reference line Y=0 */}
          {showReferenceLineY && (
            <line
              x1={0}
              y1={scaleY(referenceLineYValue)}
              x2={chartWidth}
              y2={scaleY(referenceLineYValue)}
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth={1}
              strokeDasharray="4,4"
            />
          )}

          {/* X Axis */}
          <line
            x1={0}
            y1={chartHeight}
            x2={chartWidth}
            y2={chartHeight}
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth={1}
          />

          {/* Y Axis */}
          <line
            x1={0}
            y1={0}
            x2={0}
            y2={chartHeight}
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth={1}
          />

          {/* X Axis Labels */}
          {gridLines.xLines.map((x, i) => (
            <text
              key={`xl-${i}`}
              x={scaleX(x)}
              y={chartHeight + 15}
              textAnchor="middle"
              className="text-[10px] fill-zinc-500"
            >
              {xAxisFormatter(x)}
            </text>
          ))}

          {/* Y Axis Labels */}
          {gridLines.yLines.map((y, i) => (
            <text
              key={`yl-${i}`}
              x={-10}
              y={scaleY(y)}
              textAnchor="end"
              dominantBaseline="middle"
              className="text-[10px] fill-zinc-500"
            >
              {yAxisFormatter(y)}
            </text>
          ))}

          {/* Axis labels */}
          <text
            x={chartWidth / 2}
            y={chartHeight + 32}
            textAnchor="middle"
            className="text-[10px] fill-zinc-400"
          >
            {xLabel}
          </text>
          <text
            x={-margin.left + 12}
            y={chartHeight / 2}
            textAnchor="middle"
            transform={`rotate(-90, ${-margin.left + 12}, ${chartHeight / 2})`}
            className="text-[10px] fill-zinc-400"
          >
            {yLabel}
          </text>

          {/* Data Points */}
          {points.map((point) => (
            <circle
              key={point.index}
              cx={point.cx}
              cy={point.cy}
              r={point.r}
              fill={point.fillColor}
              opacity={activePoint === null || activePoint === point.index ? 0.8 : 0.3}
              className="transition-opacity duration-200 cursor-pointer"
              onMouseEnter={() => setActivePoint(point.index)}
              onMouseLeave={() => setActivePoint(null)}
            />
          ))}
        </g>
      </svg>

      {/* Tooltip */}
      {activePoint !== null && (
        <div
          className="absolute bg-zinc-900/95 backdrop-blur border border-white/[0.08] rounded-lg px-3 py-2 shadow-xl pointer-events-none z-10"
          style={{
            left: margin.left + points[activePoint].cx + 10,
            top: margin.top + points[activePoint].cy - 30,
          }}
        >
          {tooltipContent ? (
            tooltipContent(data[activePoint])
          ) : (
            <div>
              {data[activePoint].label && (
                <p className="text-xs text-zinc-400">{data[activePoint].label}</p>
              )}
              <p className="text-sm text-emerald-400">
                {xLabel}: {xAxisFormatter(data[activePoint].x)}
              </p>
              <p className="text-sm text-orange-400">
                {yLabel}: {yAxisFormatter(data[activePoint].y)}
              </p>
              {data[activePoint].z !== undefined && (
                <p className="text-xs text-zinc-500">크기: {data[activePoint].z}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
})

export default SVGScatterChart

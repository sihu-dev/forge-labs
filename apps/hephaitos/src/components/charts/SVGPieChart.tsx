'use client'

/**
 * SVG Pie Chart Component
 * Recharts PieChart 대체 - 순수 SVG 구현
 * -200KB 번들 사이즈 절약
 */

import { memo, useState, useCallback, useMemo } from 'react'

// ============================================
// Types
// ============================================

export interface PieChartDataPoint {
  name: string
  value: number
  color: string
}

export interface SVGPieChartProps {
  data: PieChartDataPoint[]
  size?: number
  innerRadius?: number
  outerRadius?: number
  paddingAngle?: number
  showLabels?: boolean
  showLegend?: boolean
  legendPosition?: 'right' | 'bottom'
  onSliceHover?: (index: number | null) => void
  className?: string
}

// ============================================
// Utility Functions
// ============================================

function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number
): { x: number; y: number } {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  }
}

function describeArc(
  x: number,
  y: number,
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number
): string {
  const startOuter = polarToCartesian(x, y, outerRadius, endAngle)
  const endOuter = polarToCartesian(x, y, outerRadius, startAngle)
  const startInner = polarToCartesian(x, y, innerRadius, endAngle)
  const endInner = polarToCartesian(x, y, innerRadius, startAngle)

  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'

  if (innerRadius === 0) {
    // Pie slice (no inner radius)
    return [
      'M', x, y,
      'L', startOuter.x, startOuter.y,
      'A', outerRadius, outerRadius, 0, largeArcFlag, 0, endOuter.x, endOuter.y,
      'Z',
    ].join(' ')
  }

  // Donut slice
  return [
    'M', startOuter.x, startOuter.y,
    'A', outerRadius, outerRadius, 0, largeArcFlag, 0, endOuter.x, endOuter.y,
    'L', endInner.x, endInner.y,
    'A', innerRadius, innerRadius, 0, largeArcFlag, 1, startInner.x, startInner.y,
    'Z',
  ].join(' ')
}

// ============================================
// Component
// ============================================

export const SVGPieChart = memo(function SVGPieChart({
  data,
  size = 160,
  innerRadius = 45,
  outerRadius = 70,
  paddingAngle = 2,
  showLabels = false,
  showLegend = true,
  legendPosition = 'right',
  onSliceHover,
  className = '',
}: SVGPieChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const total = useMemo(() => data.reduce((sum, d) => sum + d.value, 0), [data])

  const slices = useMemo(() => {
    if (total === 0) return []

    let currentAngle = 0
    return data.map((d, index) => {
      const sliceAngle = (d.value / total) * 360 - paddingAngle
      const startAngle = currentAngle + paddingAngle / 2
      const endAngle = startAngle + sliceAngle
      currentAngle += (d.value / total) * 360

      const midAngle = (startAngle + endAngle) / 2
      const labelPos = polarToCartesian(size / 2, size / 2, (innerRadius + outerRadius) / 2, midAngle)

      return {
        ...d,
        index,
        startAngle,
        endAngle,
        path: describeArc(size / 2, size / 2, innerRadius, outerRadius, startAngle, endAngle),
        labelPos,
        percentage: (d.value / total) * 100,
      }
    })
  }, [data, total, size, innerRadius, outerRadius, paddingAngle])

  const handleMouseEnter = useCallback((index: number) => {
    setActiveIndex(index)
    onSliceHover?.(index)
  }, [onSliceHover])

  const handleMouseLeave = useCallback(() => {
    setActiveIndex(null)
    onSliceHover?.(null)
  }, [onSliceHover])

  if (data.length === 0 || total === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
        <span className="text-xs text-zinc-500">데이터 없음</span>
      </div>
    )
  }

  const isHorizontal = legendPosition === 'right'

  return (
    <div className={`flex ${isHorizontal ? 'flex-row items-center gap-6' : 'flex-col items-center gap-4'} ${className}`}>
      {/* SVG Pie Chart */}
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {slices.map((slice) => (
          <g key={slice.index}>
            <path
              d={slice.path}
              fill={slice.color}
              opacity={activeIndex === null || activeIndex === slice.index ? 1 : 0.4}
              onMouseEnter={() => handleMouseEnter(slice.index)}
              onMouseLeave={handleMouseLeave}
              className="transition-opacity duration-200 cursor-pointer"
              style={{
                transform: activeIndex === slice.index ? 'scale(1.02)' : 'scale(1)',
                transformOrigin: 'center',
                transition: 'transform 0.2s, opacity 0.2s',
              }}
            />
            {showLabels && slice.percentage > 5 && (
              <text
                x={slice.labelPos.x}
                y={slice.labelPos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-[10px] fill-white font-medium pointer-events-none"
              >
                {slice.percentage.toFixed(0)}%
              </text>
            )}
          </g>
        ))}

        {/* Center hole tooltip */}
        {activeIndex !== null && innerRadius > 0 && (
          <g>
            <text
              x={size / 2}
              y={size / 2 - 8}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-[10px] fill-zinc-400"
            >
              {slices[activeIndex].name}
            </text>
            <text
              x={size / 2}
              y={size / 2 + 8}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-sm fill-white font-semibold"
            >
              {slices[activeIndex].percentage.toFixed(1)}%
            </text>
          </g>
        )}
      </svg>

      {/* Legend */}
      {showLegend && (
        <div className={`grid ${isHorizontal ? 'grid-cols-2' : 'grid-cols-3'} gap-2`}>
          {data.map((d, i) => (
            <div
              key={d.name}
              className={`flex items-center gap-2 p-1.5 rounded transition-colors cursor-pointer ${
                activeIndex === i ? 'bg-white/[0.06]' : 'hover:bg-white/[0.04]'
              }`}
              onMouseEnter={() => handleMouseEnter(i)}
              onMouseLeave={handleMouseLeave}
            >
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: d.color }}
              />
              <span className="text-xs text-white font-medium truncate">{d.name}</span>
              <span className="text-xs text-zinc-400 ml-auto">
                {total > 0 ? ((d.value / total) * 100).toFixed(1) : 0}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
})

export default SVGPieChart

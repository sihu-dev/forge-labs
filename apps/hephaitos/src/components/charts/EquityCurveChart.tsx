/**
 * Equity Curve Chart Component
 * TradingView Lightweight Charts를 사용한 자산 곡선 시각화
 */

'use client'

import { useEffect, useRef } from 'react'
import { createChart, ColorType, LineStyle, CrosshairMode, AreaSeries, LineSeries, UTCTimestamp } from 'lightweight-charts'

interface EquityCurveChartProps {
  data: Array<{ date: string; value: number }>
  initialCapital: number
}

export function EquityCurveChart({ data, initialCapital }: EquityCurveChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<any>(null)

  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0) return

    // 차트 생성
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 300,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#71717A',
      },
      grid: {
        vertLines: { color: '#27272A' },
        horzLines: { color: '#27272A' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: '#5E6AD2',
          width: 1,
          style: LineStyle.Dashed,
        },
        horzLine: {
          color: '#5E6AD2',
          width: 1,
          style: LineStyle.Dashed,
        },
      },
      rightPriceScale: {
        borderColor: '#27272A',
      },
      timeScale: {
        borderColor: '#27272A',
        timeVisible: true,
      },
    })

    chartRef.current = chart

    // 데이터 변환 (timestamp로)
    const chartData = data.map((point) => ({
      time: Math.floor(new Date(point.date).getTime() / 1000) as UTCTimestamp,
      value: point.value,
    })).sort((a, b) => a.time - b.time)

    // Area Series 생성 (자산 곡선)
    const areaSeries = chart.addSeries(AreaSeries, {
      lineColor: '#10B981',
      topColor: 'rgba(16, 185, 129, 0.4)',
      bottomColor: 'rgba(16, 185, 129, 0.0)',
      lineWidth: 2,
      priceFormat: {
        type: 'price',
        precision: 2,
        minMove: 0.01,
      },
    })

    areaSeries.setData(chartData)

    // 초기 자본 기준선 추가
    const baselineSeries = chart.addSeries(LineSeries, {
      color: '#71717A',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      priceFormat: {
        type: 'price',
        precision: 2,
        minMove: 0.01,
      },
    })

    baselineSeries.setData(
      chartData.map((point) => ({
        time: point.time,
        value: initialCapital,
      }))
    )

    // 차트 자동 스케일
    chart.timeScale().fitContent()

    // 반응형 처리
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        })
      }
    }

    window.addEventListener('resize', handleResize)

    // 정리
    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
    }
  }, [data, initialCapital])

  return (
    <div className="relative">
      <div ref={chartContainerRef} className="w-full" />

      {/* Legend */}
      <div className="absolute top-3 left-3 flex items-center gap-4 px-3 py-2 bg-black/40 backdrop-blur-sm rounded border border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-emerald-500 rounded-sm" />
          <span className="text-xs text-zinc-300">자산 곡선</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-[1px] bg-zinc-400 border-dashed" />
          <span className="text-xs text-zinc-400">초기 자본</span>
        </div>
      </div>
    </div>
  )
}

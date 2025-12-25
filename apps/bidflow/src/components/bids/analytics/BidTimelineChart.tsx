/**
 * Bid Timeline Chart
 * 입찰 공고 일별 추이 차트
 */

'use client';

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { ArrowTrendingUpIcon } from '@heroicons/react/24/outline';

interface BidTimelineChartProps {
  data: Array<{ date: string; count: number }>;
  period: string;
}

export function BidTimelineChart({ data, period }: BidTimelineChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = echarts.init(chartRef.current, 'dark');

    const dates = data.map((item) => {
      const date = new Date(item.date);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    });
    const counts = data.map((item) => item.count);

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          label: {
            backgroundColor: '#3b82f6',
          },
        },
        backgroundColor: '#18181b',
        borderColor: 'rgba(255,255,255,0.06)',
        textStyle: {
          color: '#fff',
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '10%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: dates,
        axisLine: {
          lineStyle: {
            color: 'rgba(255,255,255,0.12)',
          },
        },
        axisLabel: {
          color: '#a1a1aa',
        },
      },
      yAxis: {
        type: 'value',
        axisLine: {
          show: false,
        },
        axisTick: {
          show: false,
        },
        splitLine: {
          lineStyle: {
            color: 'rgba(255,255,255,0.06)',
          },
        },
        axisLabel: {
          color: '#a1a1aa',
        },
      },
      series: [
        {
          name: '입찰 공고',
          type: 'line',
          smooth: true,
          data: counts,
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0.05)' },
            ]),
          },
          lineStyle: {
            color: '#3b82f6',
            width: 2,
          },
          itemStyle: {
            color: '#3b82f6',
          },
          emphasis: {
            focus: 'series',
            itemStyle: {
              color: '#60a5fa',
              borderColor: '#fff',
              borderWidth: 2,
            },
          },
        },
      ],
    };

    chart.setOption(option);

    const handleResize = () => {
      chart.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
    };
  }, [data]);

  const total = data.reduce((sum, item) => sum + item.count, 0);
  const avg = data.length > 0 ? Math.round(total / data.length) : 0;

  const periodLabel = {
    '7d': '최근 7일',
    '30d': '최근 30일',
    '90d': '최근 90일',
    all: '전체',
  }[period] || period;

  return (
    <div className="bg-[#111113] border border-white/[0.06] rounded-lg overflow-hidden">
      {/* 헤더 */}
      <div className="px-6 py-4 border-b border-white/[0.06]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ArrowTrendingUpIcon className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="text-base font-medium text-white">일별 추이</h3>
              <p className="text-xs text-zinc-400 mt-0.5">{periodLabel}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-white">{total.toLocaleString()}</p>
            <p className="text-xs text-zinc-400 mt-0.5">
              일평균 {avg.toLocaleString()}개
            </p>
          </div>
        </div>
      </div>

      {/* 차트 */}
      <div ref={chartRef} className="w-full h-[300px]" />
    </div>
  );
}

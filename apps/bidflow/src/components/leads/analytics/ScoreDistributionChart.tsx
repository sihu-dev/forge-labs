/**
 * Score Distribution Chart
 * 리드 스코어 분포 차트
 */

'use client';

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { ChartBarSquareIcon } from '@heroicons/react/24/outline';

interface ScoreDistributionChartProps {
  data: Record<string, number>;
}

export function ScoreDistributionChart({ data }: ScoreDistributionChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = echarts.init(chartRef.current, 'dark');

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
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
        data: Object.keys(data),
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
          name: '리드 수',
          type: 'bar',
          data: Object.values(data),
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#3b82f6' },
              { offset: 1, color: '#1d4ed8' },
            ]),
            borderRadius: [4, 4, 0, 0],
          },
          emphasis: {
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#60a5fa' },
                { offset: 1, color: '#3b82f6' },
              ]),
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

  const total = Object.values(data).reduce((sum, count) => sum + count, 0);

  return (
    <div className="bg-[#111113] border border-white/[0.06] rounded-lg overflow-hidden">
      {/* 헤더 */}
      <div className="px-6 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <ChartBarSquareIcon className="w-5 h-5 text-blue-400" />
          <div>
            <h3 className="text-base font-medium text-white">스코어 분포</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              총 {total.toLocaleString()}개 리드
            </p>
          </div>
        </div>
      </div>

      {/* 차트 */}
      <div ref={chartRef} className="w-full h-[300px]" />
    </div>
  );
}

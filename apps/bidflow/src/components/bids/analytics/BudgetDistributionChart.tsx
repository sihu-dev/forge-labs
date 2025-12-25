/**
 * Budget Distribution Chart
 * 예산 규모별 분포 차트
 */

'use client';

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { BanknotesIcon } from '@heroicons/react/24/outline';

interface BudgetDistributionChartProps {
  data: Record<string, number>;
}

export function BudgetDistributionChart({ data }: BudgetDistributionChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = echarts.init(chartRef.current, 'dark');

    const categories = Object.keys(data);
    const values = Object.values(data);

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
        data: categories,
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
          name: '공고 수',
          type: 'bar',
          data: values,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#10b981' },
              { offset: 1, color: '#059669' },
            ]),
            borderRadius: [4, 4, 0, 0],
          },
          emphasis: {
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#34d399' },
                { offset: 1, color: '#10b981' },
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
          <BanknotesIcon className="w-5 h-5 text-emerald-400" />
          <div>
            <h3 className="text-base font-medium text-white">예산 규모 분포</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              총 {total.toLocaleString()}개 공고
            </p>
          </div>
        </div>
      </div>

      {/* 차트 */}
      <div ref={chartRef} className="w-full h-[300px]" />
    </div>
  );
}

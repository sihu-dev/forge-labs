/**
 * Bid Source Chart
 * 입찰 출처별 분포 차트
 */

'use client';

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { GlobeAltIcon } from '@heroicons/react/24/outline';

interface BidSourceChartProps {
  data: Record<string, number>;
}

export function BidSourceChart({ data }: BidSourceChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = echarts.init(chartRef.current, 'dark');

    const sourceLabels: Record<string, string> = {
      g2b: '나라장터',
      ungm: 'UNGM',
      dgmarket: 'DG Market',
      manual: '수동 추가',
    };

    const sourceColors: Record<string, string> = {
      g2b: '#3b82f6',
      ungm: '#a855f7',
      dgmarket: '#10b981',
      manual: '#f59e0b',
    };

    const chartData = Object.entries(data).map(([source, count]) => ({
      name: sourceLabels[source] || source,
      value: count,
      itemStyle: {
        color: sourceColors[source] || '#71717a',
      },
    }));

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)',
        backgroundColor: '#18181b',
        borderColor: 'rgba(255,255,255,0.06)',
        textStyle: {
          color: '#fff',
        },
      },
      series: [
        {
          name: '출처',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          label: {
            show: true,
            position: 'outside',
            formatter: '{b}\n{c}개',
            color: '#fff',
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 16,
              fontWeight: 'bold',
            },
          },
          labelLine: {
            show: true,
            lineStyle: {
              color: 'rgba(255,255,255,0.3)',
            },
          },
          data: chartData,
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
          <GlobeAltIcon className="w-5 h-5 text-purple-400" />
          <div>
            <h3 className="text-base font-medium text-white">출처별 분포</h3>
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

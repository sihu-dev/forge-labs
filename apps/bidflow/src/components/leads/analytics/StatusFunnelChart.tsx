/**
 * Status Funnel Chart
 * 리드 상태 분포 차트 (Funnel)
 */

'use client';

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { FunnelIcon } from '@heroicons/react/24/outline';

interface StatusFunnelChartProps {
  data: Record<string, number>;
}

export function StatusFunnelChart({ data }: StatusFunnelChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = echarts.init(chartRef.current, 'dark');

    const statusLabels: Record<string, string> = {
      new: '신규',
      contacted: '접촉',
      qualified: '적격',
      converted: '전환',
      lost: '손실',
    };

    const statusColors: Record<string, string> = {
      new: '#3b82f6',
      contacted: '#a855f7',
      qualified: '#10b981',
      converted: '#f59e0b',
      lost: '#ef4444',
    };

    // Funnel 데이터 준비 (new → contacted → qualified → converted 순서)
    const funnelOrder = ['new', 'contacted', 'qualified', 'converted'];
    const funnelData = funnelOrder
      .filter((status) => data[status])
      .map((status) => ({
        name: statusLabels[status],
        value: data[status],
        itemStyle: {
          color: statusColors[status],
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
          name: '리드 상태',
          type: 'funnel',
          left: '10%',
          top: '10%',
          bottom: '10%',
          width: '80%',
          min: 0,
          max: 100,
          minSize: '0%',
          maxSize: '100%',
          sort: 'descending',
          gap: 2,
          label: {
            show: true,
            position: 'inside',
            formatter: '{b}\n{c}',
            color: '#fff',
            fontSize: 14,
          },
          labelLine: {
            length: 10,
            lineStyle: {
              width: 1,
              type: 'solid',
            },
          },
          itemStyle: {
            borderColor: '#111113',
            borderWidth: 2,
          },
          emphasis: {
            label: {
              fontSize: 16,
            },
          },
          data: funnelData,
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
          <FunnelIcon className="w-5 h-5 text-purple-400" />
          <div>
            <h3 className="text-base font-medium text-white">상태 분포</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              총 {total.toLocaleString()}개 리드
            </p>
          </div>
        </div>
      </div>

      {/* 차트 */}
      <div ref={chartRef} className="w-full h-[300px]" />

      {/* 범례 */}
      <div className="px-6 py-4 border-t border-white/[0.06]">
        <div className="flex flex-wrap gap-4">
          {Object.entries(data).map(([status, count]) => {
            const label =
              {
                new: '신규',
                contacted: '접촉',
                qualified: '적격',
                converted: '전환',
                lost: '손실',
              }[status] || status;

            const color =
              {
                new: 'bg-blue-500',
                contacted: 'bg-purple-500',
                qualified: 'bg-emerald-500',
                converted: 'bg-amber-500',
                lost: 'bg-red-500',
              }[status] || 'bg-zinc-500';

            return (
              <div key={status} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${color}`} />
                <span className="text-xs text-zinc-400">
                  {label}: <span className="text-white font-medium">{count}</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

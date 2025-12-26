/**
 * Bid Source Chart - Recharts Version
 * 입찰 출처별 분포 차트
 * Bundle size: ~20KB (was ~100KB with ECharts)
 */

'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { GlobeAltIcon } from '@heroicons/react/24/outline';

interface BidSourceChartProps {
  data: Record<string, number>;
}

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

export function BidSourceChart({ data }: BidSourceChartProps) {
  const total = Object.values(data).reduce((sum, count) => sum + count, 0);

  const chartData = Object.entries(data).map(([source, count]) => ({
    name: sourceLabels[source] || source,
    value: count,
    color: sourceColors[source] || '#71717a',
  }));

  return (
    <div className="bg-[#111113] border border-white/[0.06] rounded-lg overflow-hidden">
      {/* Header */}
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

      {/* Chart */}
      <div className="w-full h-[300px] p-4">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              label={({ name, value }) => `${name}\n${value}개`}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#18181b',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '8px',
                color: '#fff',
              }}
              formatter={(value: number, name: string) => [
                `${value}개 (${((value / total) * 100).toFixed(1)}%)`,
                name,
              ]}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              wrapperStyle={{
                color: '#fff',
                fontSize: '12px',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

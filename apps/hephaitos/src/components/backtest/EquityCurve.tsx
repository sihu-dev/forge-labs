/**
 * HEPHAITOS - Equity Curve Chart Component
 * L3 (Tissues) - 백테스트 수익 곡선 차트
 *
 * Recharts 기반 수익률 시각화
 */

'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
} from 'recharts';
import { cn } from '@/lib/utils';

/**
 * 수익 곡선 데이터 포인트
 */
export interface EquityDataPoint {
  /** 날짜 (ISO string 또는 timestamp) */
  date: string;
  /** 자산 가치 */
  equity: number;
  /** 수익률 (%) */
  returnPercent: number;
  /** 낙폭 (%) */
  drawdown: number;
  /** 벤치마크 수익률 (선택) */
  benchmark?: number;
}

/**
 * EquityCurve Props
 */
export interface EquityCurveProps {
  /** 수익 곡선 데이터 */
  data: EquityDataPoint[];
  /** 초기 자본 */
  initialCapital?: number;
  /** 벤치마크 표시 여부 */
  showBenchmark?: boolean;
  /** 낙폭 영역 표시 여부 */
  showDrawdown?: boolean;
  /** 차트 높이 */
  height?: number;
  /** 클래스명 */
  className?: string;
}

/**
 * 날짜 포맷팅
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

/**
 * 금액 포맷팅
 */
function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toFixed(0);
}

/**
 * 퍼센트 포맷팅
 */
function formatPercent(value: number): string {
  const prefix = value >= 0 ? '+' : '';
  return `${prefix}${value.toFixed(2)}%`;
}

/**
 * 커스텀 툴팁
 */
interface TooltipPayload {
  value: number;
  name: string;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const equity = payload.find((p) => p.name === 'equity')?.value ?? 0;
  const returnPercent = payload.find((p) => p.name === 'returnPercent')?.value ?? 0;
  const drawdown = payload.find((p) => p.name === 'drawdown')?.value ?? 0;
  const benchmark = payload.find((p) => p.name === 'benchmark')?.value;

  return (
    <div className="bg-gray-1 border border-gray-6 rounded-lg p-3 shadow-lg">
      <p className="text-xs text-gray-10 mb-2">{label}</p>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs text-gray-11">자산</span>
          <span className="text-sm font-medium">${formatCurrency(equity)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs text-gray-11">수익률</span>
          <span
            className={cn(
              'text-sm font-medium',
              returnPercent >= 0 ? 'text-green-400' : 'text-red-400'
            )}
          >
            {formatPercent(returnPercent)}
          </span>
        </div>
        {drawdown < 0 && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-gray-11">낙폭</span>
            <span className="text-sm font-medium text-red-400">
              {formatPercent(drawdown)}
            </span>
          </div>
        )}
        {benchmark !== undefined && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-gray-11">벤치마크</span>
            <span
              className={cn(
                'text-sm font-medium',
                benchmark >= 0 ? 'text-blue-400' : 'text-red-400'
              )}
            >
              {formatPercent(benchmark)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Equity Curve Component
 *
 * 백테스트 결과의 수익 곡선을 시각화
 * - 자산 가치 추이
 * - 수익률 표시
 * - 낙폭 영역 표시 (선택)
 * - 벤치마크 비교 (선택)
 */
export function EquityCurve({
  data,
  initialCapital = 10000,
  showBenchmark = false,
  showDrawdown = true,
  height = 400,
  className,
}: EquityCurveProps) {
  // 최소/최대값 계산
  const { minEquity, maxEquity, minReturn, maxReturn } = useMemo(() => {
    const equities = data.map((d) => d.equity);
    const returns = data.map((d) => d.returnPercent);
    const benchmarks = data.filter((d) => d.benchmark !== undefined).map((d) => d.benchmark!);

    const allReturns = [...returns, ...benchmarks];

    return {
      minEquity: Math.min(...equities),
      maxEquity: Math.max(...equities),
      minReturn: Math.min(...allReturns, 0),
      maxReturn: Math.max(...allReturns, 0),
    };
  }, [data]);

  // 데이터가 없을 때
  if (data.length === 0) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-gray-2 rounded-xl border border-gray-6',
          className
        )}
        style={{ height }}
      >
        <p className="text-gray-10">데이터가 없습니다</p>
      </div>
    );
  }

  // 최종 수익률
  const finalReturn = data[data.length - 1]?.returnPercent ?? 0;
  const isPositive = finalReturn >= 0;

  return (
    <div className={cn('rounded-xl bg-gray-2 border border-gray-6 p-4', className)}>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-gray-11">수익 곡선</h3>
          <p
            className={cn(
              'text-2xl font-bold mt-1',
              isPositive ? 'text-green-400' : 'text-red-400'
            )}
          >
            {formatPercent(finalReturn)}
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-green-500 rounded" />
            <span className="text-gray-11">전략</span>
          </div>
          {showBenchmark && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-blue-500 rounded" />
              <span className="text-gray-11">벤치마크</span>
            </div>
          )}
          {showDrawdown && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-red-500/20 rounded" />
              <span className="text-gray-11">낙폭</span>
            </div>
          )}
        </div>
      </div>

      {/* 차트 */}
      <ResponsiveContainer width="100%" height={height - 80}>
        <ComposedChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.05)"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            stroke="#6b7280"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            yAxisId="return"
            tickFormatter={(v) => `${v}%`}
            stroke="#6b7280"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            domain={[minReturn - 5, maxReturn + 5]}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            yAxisId="return"
            y={0}
            stroke="rgba(255,255,255,0.2)"
            strokeDasharray="3 3"
          />

          {/* 낙폭 영역 */}
          {showDrawdown && (
            <Area
              yAxisId="return"
              type="monotone"
              dataKey="drawdown"
              fill="rgba(239, 68, 68, 0.1)"
              stroke="none"
            />
          )}

          {/* 벤치마크 */}
          {showBenchmark && (
            <Line
              yAxisId="return"
              type="monotone"
              dataKey="benchmark"
              stroke="#3b82f6"
              strokeWidth={1.5}
              dot={false}
              strokeDasharray="5 5"
            />
          )}

          {/* 수익률 곡선 */}
          <Line
            yAxisId="return"
            type="monotone"
            dataKey="returnPercent"
            stroke={isPositive ? '#22c55e' : '#ef4444'}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: isPositive ? '#22c55e' : '#ef4444' }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export default EquityCurve;

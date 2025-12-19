/**
 * HEPHAITOS - Backtest Result Charts
 * L3 (Tissues) - 백테스트 결과 시각화 컴포넌트
 *
 * 에쿼티 커브, 드로다운, 월별 수익률 차트
 *
 * QRY-H-4-006
 */

'use client';

import * as React from 'react';
import { useMemo } from 'react';
import { Card, Tabs, TabsList, TabsTrigger, TabsContent } from '@forge/ui';
import { cn } from '@/lib/utils';
import type { HephaitosTypes } from '@forge/types';

type IBacktestResult = HephaitosTypes.IBacktestResult;
type IEquityPoint = HephaitosTypes.IEquityPoint;
type IMonthlyReturn = HephaitosTypes.IMonthlyReturn;

/**
 * 간단한 SVG 라인 차트
 */
interface LineChartProps {
  data: { x: number; y: number }[];
  width?: number;
  height?: number;
  color?: string;
  fillColor?: string;
  showGrid?: boolean;
  formatY?: (value: number) => string;
  formatX?: (value: number) => string;
}

const LineChart: React.FC<LineChartProps> = ({
  data,
  width = 600,
  height = 300,
  color = '#3B82F6',
  fillColor,
  showGrid = true,
  formatY = (v) => v.toLocaleString(),
}) => {
  const padding = { top: 20, right: 20, bottom: 30, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const { minY, maxY, path, areaPath } = useMemo(() => {
    if (data.length === 0) {
      return { minY: 0, maxY: 100, path: '', areaPath: '' };
    }

    const yValues = data.map((d) => d.y);
    const minY = Math.min(...yValues);
    const maxY = Math.max(...yValues);
    const range = maxY - minY || 1;

    const scaleX = (x: number) =>
      padding.left + (x / (data.length - 1 || 1)) * chartWidth;
    const scaleY = (y: number) =>
      padding.top + chartHeight - ((y - minY) / range) * chartHeight;

    const pathData = data
      .map((d, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(i)} ${scaleY(d.y)}`)
      .join(' ');

    const areaPathData = fillColor
      ? `${pathData} L ${scaleX(data.length - 1)} ${padding.top + chartHeight} L ${padding.left} ${padding.top + chartHeight} Z`
      : '';

    return { minY, maxY, path: pathData, areaPath: areaPathData };
  }, [data, chartWidth, chartHeight, padding, fillColor]);

  // 그리드 라인
  const gridLines = useMemo(() => {
    const lines: { y: number; label: string }[] = [];
    const steps = 5;
    const range = maxY - minY || 1;

    for (let i = 0; i <= steps; i++) {
      const value = minY + (range / steps) * i;
      const y =
        padding.top + chartHeight - ((value - minY) / range) * chartHeight;
      lines.push({ y, label: formatY(value) });
    }

    return lines;
  }, [minY, maxY, chartHeight, padding, formatY]);

  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-gray-10"
        style={{ width, height }}
      >
        데이터 없음
      </div>
    );
  }

  return (
    <svg width={width} height={height} className="overflow-visible">
      {/* 그리드 */}
      {showGrid &&
        gridLines.map((line, i) => (
          <g key={i}>
            <line
              x1={padding.left}
              x2={width - padding.right}
              y1={line.y}
              y2={line.y}
              stroke="currentColor"
              strokeOpacity={0.1}
            />
            <text
              x={padding.left - 8}
              y={line.y}
              textAnchor="end"
              dominantBaseline="middle"
              className="text-xs fill-gray-10"
            >
              {line.label}
            </text>
          </g>
        ))}

      {/* 영역 채우기 */}
      {fillColor && (
        <path d={areaPath} fill={fillColor} opacity={0.2} />
      )}

      {/* 라인 */}
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

/**
 * 바 차트 (월별 수익률)
 */
interface BarChartProps {
  data: { label: string; value: number }[];
  width?: number;
  height?: number;
  positiveColor?: string;
  negativeColor?: string;
}

const BarChart: React.FC<BarChartProps> = ({
  data,
  width = 600,
  height = 200,
  positiveColor = '#22C55E',
  negativeColor = '#EF4444',
}) => {
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const { maxAbs, zeroY, barWidth, bars } = useMemo(() => {
    if (data.length === 0) {
      return { maxAbs: 10, zeroY: height / 2, barWidth: 20, bars: [] };
    }

    const values = data.map((d) => d.value);
    const maxAbs = Math.max(Math.abs(Math.min(...values)), Math.abs(Math.max(...values)), 1);
    const zeroY = padding.top + chartHeight / 2;
    const barWidth = Math.min(40, chartWidth / data.length - 4);

    const bars = data.map((d, i) => {
      const x = padding.left + (i / data.length) * chartWidth + barWidth / 2;
      const barHeight = (Math.abs(d.value) / maxAbs) * (chartHeight / 2);
      const y = d.value >= 0 ? zeroY - barHeight : zeroY;

      return {
        x,
        y,
        width: barWidth,
        height: barHeight,
        value: d.value,
        label: d.label,
        color: d.value >= 0 ? positiveColor : negativeColor,
      };
    });

    return { maxAbs, zeroY, barWidth, bars };
  }, [data, chartWidth, chartHeight, padding, positiveColor, negativeColor, height]);

  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-gray-10"
        style={{ width, height }}
      >
        데이터 없음
      </div>
    );
  }

  return (
    <svg width={width} height={height}>
      {/* 제로 라인 */}
      <line
        x1={padding.left}
        x2={width - padding.right}
        y1={zeroY}
        y2={zeroY}
        stroke="currentColor"
        strokeOpacity={0.3}
      />

      {/* 바 */}
      {bars.map((bar, i) => (
        <g key={i}>
          <rect
            x={bar.x - bar.width / 2}
            y={bar.y}
            width={bar.width}
            height={bar.height}
            fill={bar.color}
            rx={2}
          />
          <text
            x={bar.x}
            y={height - padding.bottom + 15}
            textAnchor="middle"
            className="text-xs fill-gray-10"
          >
            {bar.label}
          </text>
        </g>
      ))}

      {/* Y축 라벨 */}
      <text
        x={padding.left - 10}
        y={padding.top}
        textAnchor="end"
        className="text-xs fill-gray-10"
      >
        +{maxAbs.toFixed(1)}%
      </text>
      <text
        x={padding.left - 10}
        y={height - padding.bottom}
        textAnchor="end"
        className="text-xs fill-gray-10"
      >
        -{maxAbs.toFixed(1)}%
      </text>
    </svg>
  );
};

/**
 * 메트릭 카드
 */
interface MetricCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: 'up' | 'down' | 'neutral';
  color?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subValue,
  trend,
  color,
}) => {
  const trendColors = {
    up: 'text-green-500',
    down: 'text-red-500',
    neutral: 'text-gray-10',
  };

  return (
    <div className="p-4 rounded-lg bg-gray-2 border border-gray-6">
      <p className="text-xs text-gray-10 mb-1">{label}</p>
      <p
        className={cn(
          'text-2xl font-bold tabular-nums',
          color || (trend ? trendColors[trend] : 'text-gray-12')
        )}
      >
        {value}
      </p>
      {subValue && <p className="text-xs text-gray-10 mt-1">{subValue}</p>}
    </div>
  );
};

/**
 * BacktestResultCharts Props
 */
export interface BacktestResultChartsProps {
  result: IBacktestResult;
  className?: string;
}

/**
 * Backtest Result Charts Component
 *
 * 백테스트 결과 시각화
 * - 에쿼티 커브
 * - 드로다운 차트
 * - 월별 수익률 차트
 * - 핵심 지표 카드
 */
export const BacktestResultCharts: React.FC<BacktestResultChartsProps> = ({
  result,
  className,
}) => {
  // 에쿼티 커브 데이터
  const equityData = useMemo(
    () =>
      result.equityCurve.map((point, i) => ({
        x: i,
        y: point.equity,
      })),
    [result.equityCurve]
  );

  // 드로다운 데이터
  const drawdownData = useMemo(
    () =>
      result.equityCurve.map((point, i) => ({
        x: i,
        y: -point.drawdown, // 음수로 표시
      })),
    [result.equityCurve]
  );

  // 월별 수익률 데이터
  const monthlyData = useMemo(
    () =>
      result.monthlyReturns.map((mr) => ({
        label: `${mr.month}월`,
        value: mr.return,
      })),
    [result.monthlyReturns]
  );

  const { metrics } = result;

  // 수익률 색상 결정
  const returnColor =
    metrics.totalReturn > 0
      ? 'text-green-500'
      : metrics.totalReturn < 0
        ? 'text-red-500'
        : 'text-gray-12';

  return (
    <div className={cn('space-y-6', className)}>
      {/* 핵심 지표 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="총 수익률"
          value={`${metrics.totalReturn >= 0 ? '+' : ''}${metrics.totalReturn.toFixed(2)}%`}
          subValue={`$${result.initialCapital.toLocaleString()} → $${result.finalCapital.toLocaleString()}`}
          trend={metrics.totalReturn > 0 ? 'up' : metrics.totalReturn < 0 ? 'down' : 'neutral'}
        />
        <MetricCard
          label="샤프 비율"
          value={metrics.sharpeRatio.toFixed(2)}
          subValue="리스크 대비 수익"
          trend={metrics.sharpeRatio > 1 ? 'up' : metrics.sharpeRatio < 0 ? 'down' : 'neutral'}
        />
        <MetricCard
          label="최대 낙폭"
          value={`${metrics.maxDrawdown.toFixed(2)}%`}
          subValue={`${metrics.maxDrawdownDuration}일 지속`}
          trend="down"
          color="text-red-500"
        />
        <MetricCard
          label="승률"
          value={`${metrics.winRate.toFixed(1)}%`}
          subValue={`${metrics.totalTrades}건 거래`}
          trend={metrics.winRate > 50 ? 'up' : 'neutral'}
        />
      </div>

      {/* 차트 탭 */}
      <Card className="p-4">
        <Tabs defaultValue="equity">
          <TabsList className="mb-4">
            <TabsTrigger value="equity">자산 곡선</TabsTrigger>
            <TabsTrigger value="drawdown">드로다운</TabsTrigger>
            <TabsTrigger value="monthly">월별 수익</TabsTrigger>
          </TabsList>

          <TabsContent value="equity">
            <div className="h-[300px]">
              <LineChart
                data={equityData}
                width={800}
                height={300}
                color="#3B82F6"
                fillColor="#3B82F6"
                formatY={(v) => `$${(v / 1000).toFixed(1)}k`}
              />
            </div>
          </TabsContent>

          <TabsContent value="drawdown">
            <div className="h-[300px]">
              <LineChart
                data={drawdownData}
                width={800}
                height={300}
                color="#EF4444"
                fillColor="#EF4444"
                formatY={(v) => `${v.toFixed(1)}%`}
              />
            </div>
          </TabsContent>

          <TabsContent value="monthly">
            <div className="h-[200px]">
              <BarChart data={monthlyData} width={800} height={200} />
            </div>
          </TabsContent>
        </Tabs>
      </Card>

      {/* 상세 지표 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="연환산 수익률"
          value={`${metrics.annualizedReturn >= 0 ? '+' : ''}${metrics.annualizedReturn.toFixed(2)}%`}
          trend={metrics.annualizedReturn > 0 ? 'up' : 'down'}
        />
        <MetricCard
          label="소르티노 비율"
          value={metrics.sortinoRatio.toFixed(2)}
        />
        <MetricCard
          label="손익비"
          value={metrics.profitFactor.toFixed(2)}
          trend={metrics.profitFactor > 1 ? 'up' : 'down'}
        />
        <MetricCard
          label="기대값"
          value={`$${metrics.expectancy.toFixed(2)}`}
          trend={metrics.expectancy > 0 ? 'up' : 'down'}
        />
      </div>

      {/* 거래 통계 */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold text-gray-12 mb-4">거래 통계</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-10">평균 이익</p>
            <p className="text-green-500 font-medium">
              ${metrics.avgWin.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-gray-10">평균 손실</p>
            <p className="text-red-500 font-medium">
              ${metrics.avgLoss.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-gray-10">최대 이익</p>
            <p className="text-green-500 font-medium">
              ${metrics.maxWin.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-gray-10">최대 손실</p>
            <p className="text-red-500 font-medium">
              ${metrics.maxLoss.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-gray-10">연속 승리</p>
            <p className="text-gray-12 font-medium">
              {metrics.maxConsecutiveWins}회
            </p>
          </div>
          <div>
            <p className="text-gray-10">연속 패배</p>
            <p className="text-gray-12 font-medium">
              {metrics.maxConsecutiveLosses}회
            </p>
          </div>
          <div>
            <p className="text-gray-10">평균 보유 기간</p>
            <p className="text-gray-12 font-medium">
              {metrics.avgHoldingPeriod.toFixed(1)}일
            </p>
          </div>
          <div>
            <p className="text-gray-10">손익 표준편차</p>
            <p className="text-gray-12 font-medium">
              ${metrics.pnlStdDev.toFixed(2)}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default BacktestResultCharts;

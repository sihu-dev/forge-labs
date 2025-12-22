/**
 * HEPHAITOS - Metrics Grid Component
 * L3 (Tissues) - 백테스트 성과 지표 그리드
 *
 * 22개 핵심 성과 지표를 카테고리별로 표시
 */

'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { HephaitosTypes } from '@forge/types';

type IPerformanceMetrics = HephaitosTypes.IPerformanceMetrics;

/**
 * 지표 표시 형식
 */
type MetricFormat = 'percent' | 'number' | 'currency' | 'ratio' | 'days';

/**
 * 지표 정의
 */
interface MetricDefinition {
  key: keyof IPerformanceMetrics;
  label: string;
  format: MetricFormat;
  goodDirection?: 'up' | 'down' | 'neutral';
  threshold?: { good: number; bad: number };
  description?: string;
}

/**
 * 지표 카테고리
 */
interface MetricCategory {
  id: string;
  label: string;
  icon: string;
  metrics: MetricDefinition[];
}

/**
 * 지표 카테고리 정의
 */
const METRIC_CATEGORIES: MetricCategory[] = [
  {
    id: 'returns',
    label: '수익률',
    icon: '📈',
    metrics: [
      {
        key: 'totalReturn',
        label: '총 수익률',
        format: 'percent',
        goodDirection: 'up',
        threshold: { good: 20, bad: 0 },
      },
      {
        key: 'annualizedReturn',
        label: '연환산 수익률',
        format: 'percent',
        goodDirection: 'up',
        threshold: { good: 15, bad: 0 },
      },
      {
        key: 'monthlyReturn',
        label: '월평균 수익률',
        format: 'percent',
        goodDirection: 'up',
        threshold: { good: 2, bad: 0 },
      },
    ],
  },
  {
    id: 'risk',
    label: '위험 지표',
    icon: '⚠️',
    metrics: [
      {
        key: 'sharpeRatio',
        label: '샤프 지수',
        format: 'ratio',
        goodDirection: 'up',
        threshold: { good: 1.5, bad: 0.5 },
        description: '위험 대비 수익',
      },
      {
        key: 'sortinoRatio',
        label: '소르티노 지수',
        format: 'ratio',
        goodDirection: 'up',
        threshold: { good: 2, bad: 1 },
        description: '하락 위험 대비 수익',
      },
      {
        key: 'calmarRatio',
        label: '칼마 지수',
        format: 'ratio',
        goodDirection: 'up',
        threshold: { good: 1, bad: 0.3 },
        description: 'MDD 대비 수익',
      },
    ],
  },
  {
    id: 'drawdown',
    label: '낙폭',
    icon: '📉',
    metrics: [
      {
        key: 'maxDrawdown',
        label: '최대 낙폭 (MDD)',
        format: 'percent',
        goodDirection: 'down',
        threshold: { good: -10, bad: -25 },
      },
      {
        key: 'avgDrawdown',
        label: '평균 낙폭',
        format: 'percent',
        goodDirection: 'down',
        threshold: { good: -5, bad: -15 },
      },
      {
        key: 'maxDrawdownDuration',
        label: '최대 낙폭 기간',
        format: 'days',
        goodDirection: 'down',
        threshold: { good: 30, bad: 90 },
      },
    ],
  },
  {
    id: 'trades',
    label: '거래 통계',
    icon: '🔄',
    metrics: [
      {
        key: 'totalTrades',
        label: '총 거래 수',
        format: 'number',
        goodDirection: 'neutral',
      },
      {
        key: 'winRate',
        label: '승률',
        format: 'percent',
        goodDirection: 'up',
        threshold: { good: 55, bad: 45 },
      },
      {
        key: 'profitFactor',
        label: '손익비',
        format: 'ratio',
        goodDirection: 'up',
        threshold: { good: 1.5, bad: 1 },
        description: '총이익 / 총손실',
      },
    ],
  },
  {
    id: 'pnl',
    label: '손익',
    icon: '💰',
    metrics: [
      {
        key: 'avgWin',
        label: '평균 수익',
        format: 'percent',
        goodDirection: 'up',
      },
      {
        key: 'avgLoss',
        label: '평균 손실',
        format: 'percent',
        goodDirection: 'down',
      },
      {
        key: 'maxWin',
        label: '최대 수익',
        format: 'percent',
        goodDirection: 'up',
      },
      {
        key: 'maxLoss',
        label: '최대 손실',
        format: 'percent',
        goodDirection: 'down',
      },
    ],
  },
  {
    id: 'streaks',
    label: '연속 거래',
    icon: '🔥',
    metrics: [
      {
        key: 'maxConsecutiveWins',
        label: '최대 연승',
        format: 'number',
        goodDirection: 'up',
      },
      {
        key: 'maxConsecutiveLosses',
        label: '최대 연패',
        format: 'number',
        goodDirection: 'down',
        threshold: { good: 3, bad: 7 },
      },
    ],
  },
  {
    id: 'other',
    label: '기타',
    icon: '📊',
    metrics: [
      {
        key: 'avgHoldingPeriod',
        label: '평균 보유 기간',
        format: 'days',
        goodDirection: 'neutral',
      },
      {
        key: 'avgTradeReturn',
        label: '평균 거래 수익',
        format: 'percent',
        goodDirection: 'up',
      },
      {
        key: 'expectancy',
        label: '기대값',
        format: 'currency',
        goodDirection: 'up',
        description: '거래당 기대 수익',
      },
    ],
  },
];

/**
 * 값 포맷팅
 */
function formatValue(value: number | undefined, format: MetricFormat): string {
  if (value === undefined || value === null || isNaN(value)) return '-';

  switch (format) {
    case 'percent':
      return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
    case 'number':
      return value.toLocaleString();
    case 'currency':
      return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    case 'ratio':
      return value.toFixed(2);
    case 'days':
      return `${Math.round(value)}일`;
    default:
      return String(value);
  }
}

/**
 * 지표 상태 평가
 */
function evaluateMetric(
  value: number | undefined,
  def: MetricDefinition
): 'good' | 'bad' | 'neutral' {
  if (value === undefined || !def.threshold) return 'neutral';

  const { good, bad } = def.threshold;

  if (def.goodDirection === 'up') {
    if (value >= good) return 'good';
    if (value <= bad) return 'bad';
  } else if (def.goodDirection === 'down') {
    // 낙폭 등 음수가 작을수록 좋음
    if (value >= good) return 'good';
    if (value <= bad) return 'bad';
  }

  return 'neutral';
}

/**
 * MetricsGrid Props
 */
export interface MetricsGridProps {
  /** 성과 지표 데이터 */
  metrics: Partial<IPerformanceMetrics>;
  /** 컴팩트 모드 (주요 지표만 표시) */
  compact?: boolean;
  /** 특정 카테고리만 표시 */
  categories?: string[];
  /** 클래스명 */
  className?: string;
}

/**
 * 단일 지표 카드
 */
interface MetricCardProps {
  definition: MetricDefinition;
  value: number | undefined;
}

function MetricCard({ definition, value }: MetricCardProps) {
  const status = evaluateMetric(value, definition);
  const formattedValue = formatValue(value, definition.format);

  const statusColors = {
    good: 'text-green-400',
    bad: 'text-red-400',
    neutral: 'text-gray-12',
  };

  const statusBg = {
    good: 'bg-green-500/10',
    bad: 'bg-red-500/10',
    neutral: 'bg-gray-3',
  };

  return (
    <div className={cn('p-4 rounded-xl', statusBg[status])}>
      <div className="flex items-start justify-between mb-1">
        <p className="text-sm text-gray-10">{definition.label}</p>
        {status !== 'neutral' && (
          <span
            className={cn(
              'text-xs px-1.5 py-0.5 rounded',
              status === 'good' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            )}
          >
            {status === 'good' ? '양호' : '주의'}
          </span>
        )}
      </div>
      <p className={cn('text-2xl font-bold', statusColors[status])}>
        {formattedValue}
      </p>
      {definition.description && (
        <p className="text-xs text-gray-11 mt-1">{definition.description}</p>
      )}
    </div>
  );
}

/**
 * Metrics Grid Component
 *
 * 백테스트 성과 지표를 카테고리별 그리드로 표시
 * - 7개 카테고리, 22개 지표
 * - 지표별 상태 평가 (양호/주의)
 * - 컴팩트 모드 지원
 */
export function MetricsGrid({
  metrics,
  compact = false,
  categories: visibleCategories,
  className,
}: MetricsGridProps) {
  // 표시할 카테고리 필터링
  const displayCategories = useMemo(() => {
    if (compact) {
      // 컴팩트 모드: 주요 카테고리만
      return METRIC_CATEGORIES.filter((cat) =>
        ['returns', 'risk', 'trades'].includes(cat.id)
      );
    }
    if (visibleCategories) {
      return METRIC_CATEGORIES.filter((cat) =>
        visibleCategories.includes(cat.id)
      );
    }
    return METRIC_CATEGORIES;
  }, [compact, visibleCategories]);

  // 요약 통계
  const summary = useMemo(() => {
    const totalReturn = metrics.totalReturn ?? 0;
    const sharpe = metrics.sharpeRatio ?? 0;
    const mdd = metrics.maxDrawdown ?? 0;
    const winRate = metrics.winRate ?? 0;

    let score = 0;
    if (totalReturn > 0) score += 25;
    if (sharpe > 1) score += 25;
    if (mdd > -15) score += 25;
    if (winRate > 50) score += 25;

    return {
      totalReturn,
      sharpe,
      mdd,
      winRate,
      score,
      grade: score >= 75 ? 'A' : score >= 50 ? 'B' : score >= 25 ? 'C' : 'D',
    };
  }, [metrics]);

  return (
    <div className={cn('space-y-6', className)}>
      {/* 종합 점수 */}
      <div className="flex items-center gap-6 p-4 rounded-xl bg-gray-2 border border-gray-6">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-3">
          <span className="text-3xl font-bold">{summary.grade}</span>
        </div>
        <div className="flex-1 grid grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-10">총 수익률</p>
            <p
              className={cn(
                'text-lg font-semibold',
                summary.totalReturn >= 0 ? 'text-green-400' : 'text-red-400'
              )}
            >
              {formatValue(summary.totalReturn, 'percent')}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-10">샤프 지수</p>
            <p className="text-lg font-semibold">
              {formatValue(summary.sharpe, 'ratio')}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-10">MDD</p>
            <p className="text-lg font-semibold text-red-400">
              {formatValue(summary.mdd, 'percent')}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-10">승률</p>
            <p className="text-lg font-semibold">
              {formatValue(summary.winRate, 'percent')}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-10">종합 점수</p>
          <p className="text-2xl font-bold">{summary.score}점</p>
        </div>
      </div>

      {/* 카테고리별 지표 */}
      {displayCategories.map((category) => (
        <div key={category.id}>
          <div className="flex items-center gap-2 mb-3">
            <span>{category.icon}</span>
            <h3 className="text-sm font-semibold text-gray-11">
              {category.label}
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {category.metrics.map((def) => (
              <MetricCard
                key={def.key}
                definition={def}
                value={metrics[def.key] as number | undefined}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default MetricsGrid;

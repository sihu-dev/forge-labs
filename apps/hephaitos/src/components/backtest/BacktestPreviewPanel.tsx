/**
 * HEPHAITOS - Backtest Preview Panel
 * L3 (Tissues) - 백테스트 미리보기 패널
 *
 * StrategyBuilder 내에서 빠른 백테스트 결과 미리보기
 *
 * QRY-H-4-007
 */

'use client';

import * as React from 'react';
import { useState, useCallback } from 'react';
import {
  Button,
  Card,
  Progress,
  Separator,
  ScrollArea,
} from '@forge/ui';
import { cn } from '@/lib/utils';
import type { HephaitosTypes } from '@forge/types';
import type { Strategy, BacktestPreview, Signal } from '../builder/types';
import { convertStrategy, validateStrategyOnly } from '../builder/strategy-converter';

type IBacktestResult = HephaitosTypes.IBacktestResult;
type IPerformanceMetrics = HephaitosTypes.IPerformanceMetrics;
type BacktestStatus = HephaitosTypes.BacktestStatus;

/**
 * 간단한 미리보기 지표
 */
interface QuickMetrics {
  totalReturn: number;
  winRate: number;
  sharpeRatio: number;
  maxDrawdown: number;
  totalTrades: number;
}

/**
 * BacktestPreviewPanel Props
 */
export interface BacktestPreviewPanelProps {
  /** 현재 전략 */
  strategy: Strategy;
  /** 백테스트 실행 콜백 */
  onRunBacktest?: (strategy: Strategy) => Promise<IBacktestResult>;
  /** 결과 상세보기 콜백 */
  onViewDetails?: (result: IBacktestResult) => void;
  /** 클래스명 */
  className?: string;
}

/**
 * 지표 바
 */
interface MetricBarProps {
  label: string;
  value: number;
  max?: number;
  format?: (v: number) => string;
  color?: 'green' | 'red' | 'blue' | 'yellow';
  showSign?: boolean;
}

const MetricBar: React.FC<MetricBarProps> = ({
  label,
  value,
  max = 100,
  format = (v) => `${v.toFixed(1)}%`,
  color = 'blue',
  showSign = false,
}) => {
  const percentage = Math.min(Math.abs(value) / max * 100, 100);
  const colors = {
    green: 'bg-green-500',
    red: 'bg-red-500',
    blue: 'bg-blue-500',
    yellow: 'bg-yellow-500',
  };

  const displayValue = showSign && value > 0 ? `+${format(value)}` : format(value);

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-10">{label}</span>
        <span className={cn(
          'font-medium tabular-nums',
          value > 0 && showSign ? 'text-green-500' : value < 0 && showSign ? 'text-red-500' : 'text-gray-12'
        )}>
          {displayValue}
        </span>
      </div>
      <div className="h-1.5 bg-gray-3 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-300', colors[color])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

/**
 * 신호 표시
 */
interface SignalDisplayProps {
  signal: Signal;
}

const SignalDisplay: React.FC<SignalDisplayProps> = ({ signal }) => {
  const typeConfig = {
    buy: { icon: '🟢', label: '매수', color: 'text-green-500' },
    sell: { icon: '🔴', label: '매도', color: 'text-red-500' },
    hold: { icon: '🟡', label: '홀드', color: 'text-yellow-500' },
  };

  const config = typeConfig[signal.type];

  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-2">
      <span>{config.icon}</span>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium', config.color)}>{config.label}</p>
        <p className="text-xs text-gray-10 truncate">
          ${signal.price.toLocaleString()}
        </p>
      </div>
      <span className="text-xs text-gray-10">
        {new Date(signal.timestamp).toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </span>
    </div>
  );
};

/**
 * Backtest Preview Panel Component
 *
 * 전략 빌더 내 미리보기 패널
 * - 전략 유효성 검사
 * - 빠른 백테스트 실행
 * - 핵심 지표 표시
 * - 최근 신호 표시
 */
export const BacktestPreviewPanel: React.FC<BacktestPreviewPanelProps> = ({
  strategy,
  onRunBacktest,
  onViewDetails,
  className,
}) => {
  const [status, setStatus] = useState<BacktestStatus>('pending');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<IBacktestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 전략 검증
  const validation = React.useMemo(
    () => validateStrategyOnly(strategy),
    [strategy]
  );

  // 백테스트 실행
  const handleRunBacktest = useCallback(async () => {
    if (!onRunBacktest) return;

    setStatus('running');
    setProgress(0);
    setError(null);

    // 진행률 시뮬레이션
    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.min(prev + Math.random() * 20, 90));
    }, 500);

    try {
      const backtestResult = await onRunBacktest(strategy);
      clearInterval(progressInterval);
      setProgress(100);
      setResult(backtestResult);
      setStatus('completed');
    } catch (err) {
      clearInterval(progressInterval);
      setError(err instanceof Error ? err.message : '백테스트 실행 실패');
      setStatus('failed');
    }
  }, [strategy, onRunBacktest]);

  // 결과 상세보기
  const handleViewDetails = useCallback(() => {
    if (result && onViewDetails) {
      onViewDetails(result);
    }
  }, [result, onViewDetails]);

  // 미리보기 메트릭스 (결과 또는 기본값)
  const metrics: QuickMetrics = result?.metrics
    ? {
        totalReturn: result.metrics.totalReturn,
        winRate: result.metrics.winRate,
        sharpeRatio: result.metrics.sharpeRatio,
        maxDrawdown: result.metrics.maxDrawdown,
        totalTrades: result.metrics.totalTrades,
      }
    : {
        totalReturn: 0,
        winRate: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        totalTrades: 0,
      };

  return (
    <Card className={cn('flex flex-col', className)}>
      {/* 헤더 */}
      <div className="p-4 border-b border-gray-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-12">백테스트 미리보기</h3>
          {status === 'completed' && (
            <span className="text-xs text-green-500 bg-green-500/10 px-2 py-0.5 rounded">
              완료
            </span>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1" size="full">
        <div className="p-4 space-y-4">
          {/* 전략 검증 상태 */}
          <div className="p-3 rounded-lg bg-gray-2">
            <div className="flex items-center gap-2 mb-2">
              <span>{validation.valid ? '✅' : '⚠️'}</span>
              <span className="text-sm font-medium text-gray-12">
                전략 상태
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-10">지표</span>
                <span className="text-gray-12">{validation.stats.indicatorCount}개</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-10">조건</span>
                <span className="text-gray-12">{validation.stats.conditionCount}개</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-10">액션</span>
                <span className="text-gray-12">{validation.stats.actionCount}개</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-10">연결</span>
                <span className="text-gray-12">{validation.stats.connectionCount}개</span>
              </div>
            </div>

            {/* 검증 오류/경고 */}
            {validation.errors.length > 0 && (
              <div className="mt-2 text-xs text-red-500">
                {validation.errors.map((err, i) => (
                  <p key={i}>• {err}</p>
                ))}
              </div>
            )}
            {validation.warnings.length > 0 && (
              <div className="mt-2 text-xs text-yellow-500">
                {validation.warnings.map((warn, i) => (
                  <p key={i}>• {warn}</p>
                ))}
              </div>
            )}
          </div>

          {/* 진행 상태 */}
          {status === 'running' && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-10">백테스트 실행 중...</span>
                <span className="text-gray-12">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-1.5" />
            </div>
          )}

          {/* 에러 표시 */}
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}

          <Separator />

          {/* 핵심 지표 */}
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-gray-10 uppercase tracking-wider">
              핵심 지표
            </h4>

            <MetricBar
              label="총 수익률"
              value={metrics.totalReturn}
              max={50}
              format={(v) => `${v.toFixed(2)}%`}
              color={metrics.totalReturn > 0 ? 'green' : 'red'}
              showSign
            />

            <MetricBar
              label="승률"
              value={metrics.winRate}
              max={100}
              format={(v) => `${v.toFixed(1)}%`}
              color={metrics.winRate >= 50 ? 'green' : 'yellow'}
            />

            <MetricBar
              label="샤프 비율"
              value={metrics.sharpeRatio}
              max={3}
              format={(v) => v.toFixed(2)}
              color={metrics.sharpeRatio >= 1 ? 'green' : 'blue'}
            />

            <MetricBar
              label="최대 낙폭"
              value={metrics.maxDrawdown}
              max={30}
              format={(v) => `${v.toFixed(2)}%`}
              color="red"
            />
          </div>

          {/* 거래 요약 */}
          {result && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-gray-10 uppercase tracking-wider">
                  거래 요약
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="p-2 rounded bg-gray-2">
                    <p className="text-xs text-gray-10">총 거래</p>
                    <p className="font-medium text-gray-12">
                      {metrics.totalTrades}회
                    </p>
                  </div>
                  <div className="p-2 rounded bg-gray-2">
                    <p className="text-xs text-gray-10">손익비</p>
                    <p className="font-medium text-gray-12">
                      {result.metrics.profitFactor.toFixed(2)}
                    </p>
                  </div>
                  <div className="p-2 rounded bg-gray-2">
                    <p className="text-xs text-gray-10">평균 이익</p>
                    <p className="font-medium text-green-500">
                      ${result.metrics.avgWin.toFixed(2)}
                    </p>
                  </div>
                  <div className="p-2 rounded bg-gray-2">
                    <p className="text-xs text-gray-10">평균 손실</p>
                    <p className="font-medium text-red-500">
                      ${result.metrics.avgLoss.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* 최근 신호 (mock) */}
          {result && result.trades.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-gray-10 uppercase tracking-wider">
                  최근 신호
                </h4>
                <div className="space-y-2">
                  {result.trades.slice(-3).map((trade, i) => (
                    <SignalDisplay
                      key={i}
                      signal={{
                        timestamp: trade.exitTrade?.executedAt || trade.entryTrade?.executedAt || '',
                        type: trade.side === 'buy' ? 'buy' : 'sell',
                        price: trade.entryPrice,
                      }}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </ScrollArea>

      {/* 액션 버튼 */}
      <div className="p-3 border-t border-gray-6 space-y-2">
        <Button
          className="w-full"
          disabled={!validation.valid || status === 'running'}
          onClick={handleRunBacktest}
        >
          {status === 'running' ? '실행 중...' : '백테스트 실행'}
        </Button>

        {result && (
          <Button
            variant="outline"
            className="w-full"
            onClick={handleViewDetails}
          >
            상세 결과 보기
          </Button>
        )}
      </div>
    </Card>
  );
};

export default BacktestPreviewPanel;

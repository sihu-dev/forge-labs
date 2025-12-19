/**
 * HEPHAITOS - Backtest Page
 * 백테스트 목록 및 결과 페이지
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';

interface BacktestResult {
  id: string;
  strategyId: string;
  strategyName: string;
  symbol: string;
  timeframe: string;
  startDate: string;
  endDate: string;
  status: 'running' | 'completed' | 'failed';
  metrics?: {
    totalReturn: number;
    winRate: number;
    maxDrawdown: number;
    sharpeRatio: number;
    totalTrades: number;
  };
  createdAt: string;
}

// 임시 데이터
const mockResults: BacktestResult[] = [
  {
    id: '1',
    strategyId: '1',
    strategyName: 'RSI 역추세 전략',
    symbol: 'BTC/USDT',
    timeframe: '1h',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    status: 'completed',
    metrics: {
      totalReturn: 42.5,
      winRate: 58.3,
      maxDrawdown: -12.4,
      sharpeRatio: 1.82,
      totalTrades: 156,
    },
    createdAt: '2025-01-18 14:30',
  },
  {
    id: '2',
    strategyId: '2',
    strategyName: 'MACD 골든크로스',
    symbol: 'ETH/USDT',
    timeframe: '4h',
    startDate: '2024-06-01',
    endDate: '2024-12-31',
    status: 'completed',
    metrics: {
      totalReturn: 28.7,
      winRate: 52.1,
      maxDrawdown: -18.6,
      sharpeRatio: 1.24,
      totalTrades: 48,
    },
    createdAt: '2025-01-17 09:15',
  },
  {
    id: '3',
    strategyId: '3',
    strategyName: '볼린저밴드 브레이크아웃',
    symbol: 'BTC/USDT',
    timeframe: '1d',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    status: 'running',
    createdAt: '2025-01-18 16:45',
  },
];

export default function BacktestPage() {
  const [selectedResult, setSelectedResult] = useState<BacktestResult | null>(null);

  const formatPercent = (value: number) => {
    const prefix = value >= 0 ? '+' : '';
    return `${prefix}${value.toFixed(1)}%`;
  };

  const getStatusBadge = (status: BacktestResult['status']) => {
    const styles = {
      running: 'bg-blue-500/20 text-blue-400',
      completed: 'bg-green-500/20 text-green-400',
      failed: 'bg-red-500/20 text-red-400',
    };
    const labels = {
      running: '실행 중',
      completed: '완료',
      failed: '실패',
    };
    return (
      <span className={`px-2 py-0.5 text-xs rounded-full ${styles[status]}`}>{labels[status]}</span>
    );
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">백테스트</h1>
          <p className="text-gray-11 mt-1">전략 성과를 과거 데이터로 시뮬레이션합니다</p>
        </div>
        <Link
          href="/dashboard/strategies"
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl font-medium transition-colors"
        >
          <span>+</span>
          <span>새 백테스트</span>
        </Link>
      </div>

      {/* 결과 목록 */}
      <div className="rounded-xl bg-gray-2 border border-gray-6 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-6 text-left">
              <th className="px-5 py-3 text-sm font-medium text-gray-10">전략</th>
              <th className="px-5 py-3 text-sm font-medium text-gray-10">심볼</th>
              <th className="px-5 py-3 text-sm font-medium text-gray-10">기간</th>
              <th className="px-5 py-3 text-sm font-medium text-gray-10">수익률</th>
              <th className="px-5 py-3 text-sm font-medium text-gray-10">승률</th>
              <th className="px-5 py-3 text-sm font-medium text-gray-10">MDD</th>
              <th className="px-5 py-3 text-sm font-medium text-gray-10">상태</th>
              <th className="px-5 py-3 text-sm font-medium text-gray-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-6">
            {mockResults.map((result) => (
              <tr
                key={result.id}
                onClick={() => setSelectedResult(result)}
                className="hover:bg-gray-3 cursor-pointer transition-colors"
              >
                <td className="px-5 py-4">
                  <p className="font-medium">{result.strategyName}</p>
                  <p className="text-xs text-gray-10">{result.createdAt}</p>
                </td>
                <td className="px-5 py-4 text-sm">{result.symbol}</td>
                <td className="px-5 py-4 text-sm text-gray-11">
                  {result.startDate} ~ {result.endDate}
                </td>
                <td className="px-5 py-4">
                  {result.metrics ? (
                    <span
                      className={`font-medium ${
                        result.metrics.totalReturn >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {formatPercent(result.metrics.totalReturn)}
                    </span>
                  ) : (
                    <span className="text-gray-10">-</span>
                  )}
                </td>
                <td className="px-5 py-4 text-sm">
                  {result.metrics ? `${result.metrics.winRate.toFixed(1)}%` : '-'}
                </td>
                <td className="px-5 py-4">
                  {result.metrics ? (
                    <span className="text-red-400">
                      {result.metrics.maxDrawdown.toFixed(1)}%
                    </span>
                  ) : (
                    <span className="text-gray-10">-</span>
                  )}
                </td>
                <td className="px-5 py-4">{getStatusBadge(result.status)}</td>
                <td className="px-5 py-4">
                  <button className="p-1.5 text-gray-10 hover:text-gray-12 rounded-lg hover:bg-gray-4 transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 상세 결과 패널 */}
      {selectedResult && selectedResult.metrics && (
        <div className="rounded-xl bg-gray-2 border border-gray-6 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold">{selectedResult.strategyName}</h2>
              <p className="text-sm text-gray-10">
                {selectedResult.symbol} · {selectedResult.timeframe} · {selectedResult.startDate} ~{' '}
                {selectedResult.endDate}
              </p>
            </div>
            <button
              onClick={() => setSelectedResult(null)}
              className="p-2 text-gray-10 hover:text-gray-12 hover:bg-gray-4 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* 지표 그리드 */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-gray-3">
              <p className="text-sm text-gray-10 mb-1">총 수익률</p>
              <p
                className={`text-2xl font-bold ${
                  selectedResult.metrics.totalReturn >= 0 ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {formatPercent(selectedResult.metrics.totalReturn)}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-gray-3">
              <p className="text-sm text-gray-10 mb-1">승률</p>
              <p className="text-2xl font-bold">{selectedResult.metrics.winRate.toFixed(1)}%</p>
            </div>
            <div className="p-4 rounded-xl bg-gray-3">
              <p className="text-sm text-gray-10 mb-1">최대 낙폭</p>
              <p className="text-2xl font-bold text-red-400">
                {selectedResult.metrics.maxDrawdown.toFixed(1)}%
              </p>
            </div>
            <div className="p-4 rounded-xl bg-gray-3">
              <p className="text-sm text-gray-10 mb-1">샤프 지수</p>
              <p className="text-2xl font-bold">{selectedResult.metrics.sharpeRatio.toFixed(2)}</p>
            </div>
            <div className="p-4 rounded-xl bg-gray-3">
              <p className="text-sm text-gray-10 mb-1">총 거래</p>
              <p className="text-2xl font-bold">{selectedResult.metrics.totalTrades}회</p>
            </div>
          </div>

          {/* 차트 플레이스홀더 */}
          <div className="aspect-[2/1] rounded-xl bg-gray-3 flex items-center justify-center">
            <p className="text-gray-10">수익 곡선 차트</p>
          </div>
        </div>
      )}
    </div>
  );
}

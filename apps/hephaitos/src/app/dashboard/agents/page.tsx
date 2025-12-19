/**
 * HEPHAITOS - Agents Page
 * 에이전트 관리 페이지
 *
 * QRY-H-6-004
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/providers/AuthProvider';

interface Agent {
  id: string;
  name: string;
  strategyName: string;
  exchange: string;
  status: 'running' | 'stopped' | 'error';
  pnl: number;
  pnlPercent: number;
  trades: number;
  lastActive: string;
}

const mockAgents: Agent[] = [
  {
    id: '1',
    name: 'RSI 역추세 봇',
    strategyName: 'RSI 역추세 전략',
    exchange: 'Binance',
    status: 'running',
    pnl: 1250000,
    pnlPercent: 12.5,
    trades: 47,
    lastActive: '방금 전',
  },
  {
    id: '2',
    name: 'MACD 크로스 봇',
    strategyName: 'MACD 골든크로스',
    exchange: 'Upbit',
    status: 'stopped',
    pnl: -50000,
    pnlPercent: -0.5,
    trades: 23,
    lastActive: '2시간 전',
  },
];

export default function AgentsPage() {
  const { profile } = useAuth();
  const [agents, setAgents] = useState<Agent[]>(mockAgents);

  const getStatusBadge = (status: Agent['status']) => {
    switch (status) {
      case 'running':
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 text-xs rounded-full bg-green-500/20 text-green-400">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            실행 중
          </span>
        );
      case 'stopped':
        return (
          <span className="px-2 py-0.5 text-xs rounded-full bg-gray-6 text-gray-11">
            정지됨
          </span>
        );
      case 'error':
        return (
          <span className="px-2 py-0.5 text-xs rounded-full bg-red-500/20 text-red-400">
            오류
          </span>
        );
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">에이전트</h1>
          <p className="text-gray-11 mt-1">자동 매매 에이전트를 관리하세요</p>
        </div>
        <Link
          href="/dashboard/strategies"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl font-medium transition-colors"
        >
          + 새 에이전트
        </Link>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-gray-2 border border-gray-6">
          <p className="text-sm text-gray-10 mb-1">총 에이전트</p>
          <p className="text-3xl font-bold">{agents.length}</p>
        </div>
        <div className="p-5 rounded-xl bg-gray-2 border border-gray-6">
          <p className="text-sm text-gray-10 mb-1">실행 중</p>
          <p className="text-3xl font-bold text-green-400">
            {agents.filter((a) => a.status === 'running').length}
          </p>
        </div>
        <div className="p-5 rounded-xl bg-gray-2 border border-gray-6">
          <p className="text-sm text-gray-10 mb-1">총 손익</p>
          <p className={`text-3xl font-bold ${agents.reduce((sum, a) => sum + a.pnl, 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatCurrency(agents.reduce((sum, a) => sum + a.pnl, 0))}
          </p>
        </div>
        <div className="p-5 rounded-xl bg-gray-2 border border-gray-6">
          <p className="text-sm text-gray-10 mb-1">총 거래 수</p>
          <p className="text-3xl font-bold">{agents.reduce((sum, a) => sum + a.trades, 0)}</p>
        </div>
      </div>

      {/* 에이전트 목록 */}
      <div className="rounded-xl bg-gray-2 border border-gray-6 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-6">
          <h2 className="font-semibold">에이전트 목록</h2>
        </div>

        {agents.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <div className="text-4xl mb-4">🤖</div>
            <p className="text-gray-10 mb-4">아직 에이전트가 없습니다</p>
            <Link
              href="/dashboard/strategies"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm transition-colors"
            >
              전략으로 에이전트 만들기
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-6">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="px-5 py-4 hover:bg-gray-3 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gray-5 flex items-center justify-center text-xl">
                      🤖
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{agent.name}</p>
                        {getStatusBadge(agent.status)}
                      </div>
                      <p className="text-sm text-gray-10 mt-0.5">
                        {agent.strategyName} · {agent.exchange}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8 text-sm">
                    <div className="text-right">
                      <p className="text-gray-10">손익</p>
                      <p className={agent.pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                        {formatCurrency(agent.pnl)} ({agent.pnlPercent > 0 ? '+' : ''}{agent.pnlPercent}%)
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-10">거래 수</p>
                      <p className="font-medium">{agent.trades}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-10">마지막 활동</p>
                      <p className="text-gray-11">{agent.lastActive}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {agent.status === 'running' ? (
                        <button className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm transition-colors">
                          정지
                        </button>
                      ) : (
                        <button className="px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg text-sm transition-colors">
                          시작
                        </button>
                      )}
                      <button className="p-1.5 text-gray-10 hover:text-gray-12 hover:bg-gray-4 rounded-lg transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 안내 */}
      <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
        <div className="flex items-start gap-3">
          <span className="text-yellow-500">⚠️</span>
          <div>
            <p className="text-sm font-medium text-yellow-500">실거래 주의사항</p>
            <p className="text-sm text-yellow-500/80 mt-1">
              에이전트는 실제 자산을 거래합니다. 충분한 백테스트와 소액 테스트 후 사용하세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

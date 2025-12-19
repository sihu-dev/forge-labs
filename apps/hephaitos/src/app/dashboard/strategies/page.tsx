/**
 * HEPHAITOS - Strategies List Page
 * 전략 목록 페이지
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Strategy {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'tested' | 'running' | 'paused';
  createdAt: string;
  updatedAt: string;
  backtestCount: number;
}

// 임시 데이터
const mockStrategies: Strategy[] = [
  {
    id: '1',
    name: 'RSI 역추세 전략',
    description: 'RSI가 30 이하일 때 매수, 70 이상일 때 매도',
    status: 'draft',
    createdAt: '2025-01-15',
    updatedAt: '2025-01-18',
    backtestCount: 3,
  },
  {
    id: '2',
    name: 'MACD 골든크로스',
    description: 'MACD 라인이 시그널 라인을 상향 돌파할 때 매수',
    status: 'tested',
    createdAt: '2025-01-10',
    updatedAt: '2025-01-17',
    backtestCount: 8,
  },
  {
    id: '3',
    name: '볼린저밴드 브레이크아웃',
    description: '가격이 하단 밴드를 터치하면 매수, 상단 밴드 터치 시 매도',
    status: 'running',
    createdAt: '2025-01-05',
    updatedAt: '2025-01-16',
    backtestCount: 15,
  },
];

export default function StrategiesPage() {
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredStrategies = mockStrategies.filter((s) => {
    if (filter !== 'all' && s.status !== filter) return false;
    if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const getStatusBadge = (status: Strategy['status']) => {
    const styles = {
      draft: 'bg-gray-6 text-gray-11',
      tested: 'bg-blue-500/20 text-blue-400',
      running: 'bg-green-500/20 text-green-400',
      paused: 'bg-yellow-500/20 text-yellow-400',
    };
    const labels = {
      draft: '초안',
      tested: '테스트됨',
      running: '실행 중',
      paused: '일시정지',
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
          <h1 className="text-2xl font-bold">내 전략</h1>
          <p className="text-gray-11 mt-1">생성하고 관리하는 모든 트레이딩 전략</p>
        </div>
        <Link
          href="/dashboard/strategies/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl font-medium transition-colors"
        >
          <span className="text-lg">+</span>
          <span>새 전략</span>
        </Link>
      </div>

      {/* 필터 & 검색 */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 p-1 rounded-xl bg-gray-2 border border-gray-6">
          {['all', 'draft', 'tested', 'running'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                filter === f ? 'bg-gray-5 text-gray-12' : 'text-gray-11 hover:text-gray-12'
              }`}
            >
              {f === 'all' && '전체'}
              {f === 'draft' && '초안'}
              {f === 'tested' && '테스트됨'}
              {f === 'running' && '실행 중'}
            </button>
          ))}
        </div>
        <div className="flex-1">
          <input
            type="text"
            placeholder="전략 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full max-w-xs px-4 py-2 bg-gray-2 border border-gray-6 rounded-xl text-gray-12 placeholder:text-gray-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* 전략 목록 */}
      <div className="grid gap-4">
        {filteredStrategies.map((strategy) => (
          <Link
            key={strategy.id}
            href={`/dashboard/strategies/${strategy.id}`}
            className="group flex items-center justify-between p-5 rounded-xl bg-gray-2 border border-gray-6 hover:border-gray-8 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gray-5 flex items-center justify-center text-2xl">
                🧩
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold group-hover:text-blue-500 transition-colors">
                    {strategy.name}
                  </h3>
                  {getStatusBadge(strategy.status)}
                </div>
                <p className="text-sm text-gray-10 mt-0.5">{strategy.description}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-10">
                  <span>수정일: {strategy.updatedAt}</span>
                  <span>백테스트: {strategy.backtestCount}회</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  // 백테스트 실행
                }}
                className="px-3 py-1.5 text-sm bg-gray-4 hover:bg-gray-5 rounded-lg transition-colors"
              >
                백테스트
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  // 더보기 메뉴
                }}
                className="p-1.5 text-gray-10 hover:text-gray-12 rounded-lg hover:bg-gray-4 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>
            </div>
          </Link>
        ))}
      </div>

      {/* 빈 상태 */}
      {filteredStrategies.length === 0 && (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📭</div>
          <h3 className="text-lg font-semibold mb-2">
            {searchQuery ? '검색 결과가 없습니다' : '전략이 없습니다'}
          </h3>
          <p className="text-gray-10 mb-6">
            {searchQuery ? '다른 검색어로 시도해 보세요' : '첫 번째 전략을 만들어 보세요'}
          </p>
          {!searchQuery && (
            <Link
              href="/dashboard/strategies/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <span>+</span>
              <span>새 전략 만들기</span>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

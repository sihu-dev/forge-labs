/**
 * HEPHAITOS - Dashboard Main Page
 * 대시보드 메인 페이지
 */

'use client';

import Link from 'next/link';
import { useAuth } from '@/providers/AuthProvider';

export default function DashboardPage() {
  const { user, profile } = useAuth();

  const quickActions = [
    {
      title: '새 전략 만들기',
      description: '블록을 조합해 나만의 전략을 만드세요',
      href: '/dashboard/strategies/new',
      icon: '🧩',
      color: 'bg-blue-500/10 text-blue-500',
    },
    {
      title: '백테스트 실행',
      description: '전략의 과거 성과를 시뮬레이션하세요',
      href: '/dashboard/backtest',
      icon: '📊',
      color: 'bg-purple-500/10 text-purple-500',
    },
    {
      title: '거래소 연결',
      description: 'API 키로 거래소를 연결하세요',
      href: '/dashboard/exchanges',
      icon: '🔗',
      color: 'bg-green-500/10 text-green-500',
    },
    {
      title: '크레딧 충전',
      description: '에이전트 실행에 필요한 크레딧을 충전하세요',
      href: '/dashboard/credits',
      icon: '💳',
      color: 'bg-orange-500/10 text-orange-500',
    },
  ];

  const recentStrategies = [
    {
      id: '1',
      name: 'RSI 역추세 전략',
      lastModified: '2시간 전',
      status: 'draft',
    },
    {
      id: '2',
      name: 'MACD 골든크로스',
      lastModified: '1일 전',
      status: 'tested',
    },
    {
      id: '3',
      name: '볼린저밴드 브레이크아웃',
      lastModified: '3일 전',
      status: 'running',
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return (
          <span className="px-2 py-0.5 text-xs rounded-full bg-gray-6 text-gray-11">초안</span>
        );
      case 'tested':
        return (
          <span className="px-2 py-0.5 text-xs rounded-full bg-blue-500/20 text-blue-400">
            테스트됨
          </span>
        );
      case 'running':
        return (
          <span className="px-2 py-0.5 text-xs rounded-full bg-green-500/20 text-green-400">
            실행 중
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* 환영 메시지 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            안녕하세요, {profile?.name || user?.email?.split('@')[0]}님
          </h1>
          <p className="text-gray-11 mt-1">오늘도 좋은 전략을 만들어 보세요</p>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-gray-2 border border-gray-6">
          <span className="text-yellow-500">💰</span>
          <div>
            <p className="text-xs text-gray-10">보유 크레딧</p>
            <p className="text-lg font-bold">{profile?.credits ?? 100}</p>
          </div>
        </div>
      </div>

      {/* 빠른 액션 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="group p-5 rounded-xl bg-gray-2 border border-gray-6 hover:border-gray-8 transition-all"
          >
            <div
              className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center text-xl mb-3`}
            >
              {action.icon}
            </div>
            <h3 className="font-semibold group-hover:text-blue-500 transition-colors">
              {action.title}
            </h3>
            <p className="text-sm text-gray-10 mt-1">{action.description}</p>
          </Link>
        ))}
      </div>

      {/* 최근 전략 */}
      <div className="rounded-xl bg-gray-2 border border-gray-6">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-6">
          <h2 className="font-semibold">최근 전략</h2>
          <Link
            href="/dashboard/strategies"
            className="text-sm text-blue-500 hover:text-blue-400"
          >
            전체 보기
          </Link>
        </div>
        <div className="divide-y divide-gray-6">
          {recentStrategies.map((strategy) => (
            <Link
              key={strategy.id}
              href={`/dashboard/strategies/${strategy.id}`}
              className="flex items-center justify-between px-5 py-4 hover:bg-gray-3 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-5 flex items-center justify-center text-sm">
                  🧩
                </div>
                <div>
                  <p className="font-medium">{strategy.name}</p>
                  <p className="text-sm text-gray-10">{strategy.lastModified}</p>
                </div>
              </div>
              {getStatusBadge(strategy.status)}
            </Link>
          ))}
        </div>
        {recentStrategies.length === 0 && (
          <div className="px-5 py-12 text-center">
            <p className="text-gray-10 mb-4">아직 전략이 없습니다</p>
            <Link
              href="/dashboard/strategies/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm transition-colors"
            >
              <span>+</span>
              <span>첫 전략 만들기</span>
            </Link>
          </div>
        )}
      </div>

      {/* 통계 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-gray-2 border border-gray-6">
          <p className="text-sm text-gray-10 mb-1">총 전략</p>
          <p className="text-3xl font-bold">3</p>
        </div>
        <div className="p-5 rounded-xl bg-gray-2 border border-gray-6">
          <p className="text-sm text-gray-10 mb-1">백테스트 실행</p>
          <p className="text-3xl font-bold">12</p>
        </div>
        <div className="p-5 rounded-xl bg-gray-2 border border-gray-6">
          <p className="text-sm text-gray-10 mb-1">실행 중 에이전트</p>
          <p className="text-3xl font-bold">1</p>
        </div>
      </div>
    </div>
  );
}

/**
 * BIDFLOW 대시보드 - Supabase 100% 벤치마킹
 * 미니멀 전문 디자인, 인공적 요소 최소화
 */

'use client';

import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useState, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { Bid } from '@/components/spreadsheet/SpreadsheetView';
import { SAMPLE_BIDS, calculateBidStats } from '@/lib/data/sample-bids';

// Handsontable 동적 로드
const ClientSpreadsheet = dynamic(
  () => import('@/components/spreadsheet/ClientSpreadsheet'),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
          <p className="text-sm text-slate-500">로딩 중</p>
        </div>
      </div>
    )
  }
);

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const isDemo = searchParams?.get('demo') === 'true';
  const [showBanner, setShowBanner] = useState(true);
  const [bids, setBids] = useState<Bid[]>(SAMPLE_BIDS);
  const [isLoading, setIsLoading] = useState(false);

  // Memoize stats calculation to avoid recalculating on every render
  const stats = useMemo(() => calculateBidStats(bids), [bids]);

  // Bid 수정 API 호출
  const handleBidUpdate = useCallback(async (id: string, updates: Partial<Bid>) => {
    try {
      const response = await fetch(`/api/v1/bids/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update bid');
      }

      // 로컬 상태 업데이트
      setBids(prev => prev.map(bid =>
        bid.id === id ? { ...bid, ...updates } : bid
      ));
    } catch (error) {
      console.error('Bid update failed:', error);
      throw error;
    }
  }, []);

  // 새로고침 API 호출
  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/v1/bids');
      if (!response.ok) {
        throw new Error('Failed to fetch bids');
      }
      const data = await response.json();
      if (data.data) {
        setBids(data.data);
      }
    } catch (error) {
      console.error('Refresh failed:', error);
      // 데모 모드에서는 샘플 데이터 유지
      if (isDemo) {
        setBids(SAMPLE_BIDS);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isDemo]);

  return (
    <main className="h-screen flex flex-col bg-slate-50">
      {/* 데모 모드 배너 - 미니멀 */}
      {isDemo && showBanner && (
        <div className="bg-slate-900 text-slate-300 px-6 py-2 text-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span>Demo Mode</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400">{SAMPLE_BIDS.length} records</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/signup" className="text-white font-medium hover:underline">
              Get Started
            </Link>
            <button onClick={() => setShowBanner(false)} className="text-slate-500 hover:text-white">
              ×
            </button>
          </div>
        </div>
      )}

      {/* 헤더 - 반응형 */}
      <header className="bg-white border-b border-slate-200 px-4 md:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4 md:gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-slate-900 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">B</span>
            </div>
            <span className="text-base font-semibold text-slate-900 hidden sm:inline">BIDFLOW</span>
          </Link>

          {/* 데스크톱 네비게이션 */}
          <nav className="hidden md:flex items-center gap-1">
            <Link href="/dashboard" className="px-3 py-1.5 text-sm font-medium text-slate-900 bg-slate-100 rounded">
              Bids
            </Link>
            <a href="#" className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 rounded hover:bg-slate-100">
              Pipeline
            </a>
            <a href="#" className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 rounded hover:bg-slate-100">
              Analytics
            </a>
            <Link href="/docs" className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 rounded hover:bg-slate-100">
              Docs
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          {isDemo ? (
            <Link
              href="/signup"
              className="px-3 md:px-4 py-1.5 text-sm font-medium text-white bg-slate-900 rounded hover:bg-slate-800"
            >
              Sign up
            </Link>
          ) : (
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
              <span className="text-xs font-medium text-slate-600">U</span>
            </div>
          )}
        </div>
      </header>

      {/* 통계 바 - 반응형 */}
      <div className="bg-white border-b border-slate-200 px-4 md:px-6 py-3 overflow-x-auto">
        <div className="flex items-center gap-4 md:gap-6 min-w-max md:min-w-0">
          {/* 메트릭 그리드 - 모바일에서 핵심만 */}
          <div className="flex items-center gap-3 md:gap-6">
            <Metric label="Total" value={stats.total} />
            <div className="w-px h-8 bg-slate-200" />
            <Metric label="New" value={stats.new} highlight={stats.new > 0} />
            <Metric label="Review" value={stats.reviewing} className="hidden sm:flex" />
            <Metric label="Prepare" value={stats.preparing} className="hidden sm:flex" />
            <div className="w-px h-8 bg-slate-200 hidden md:block" />
            <Metric label="Urgent" value={stats.urgent} warning={stats.urgent > 0} />
            <Metric label="High Match" value={stats.highMatch} success className="hidden lg:flex" />
            <div className="w-px h-8 bg-slate-200 hidden lg:block" />
            <Metric label="Won" value={stats.won} success className="hidden md:flex" />
            <Metric label="Lost" value={stats.lost} className="hidden md:flex" />
          </div>

          {/* 총 추정가 */}
          <div className="ml-auto flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-slate-500 hidden sm:inline">Est. Total</span>
            <span className="text-base md:text-lg font-mono font-semibold text-slate-900">
              ₩{(stats.totalAmount / 100000000).toFixed(1)}B
            </span>
          </div>
        </div>
      </div>

      {/* 스프레드시트 */}
      <div className="flex-1 overflow-hidden relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
          </div>
        )}
        <ClientSpreadsheet
          initialData={bids}
          onBidUpdate={handleBidUpdate}
          onRefresh={handleRefresh}
        />
      </div>
    </main>
  );
}

// 미니멀 메트릭 컴포넌트
function Metric({
  label,
  value,
  highlight,
  warning,
  success,
  className
}: {
  label: string;
  value: number;
  highlight?: boolean;
  warning?: boolean;
  success?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col", className)}>
      <span className="text-xs text-slate-500 uppercase tracking-wider">{label}</span>
      <span className={cn(
        'text-lg md:text-xl font-semibold font-mono',
        warning ? 'text-neutral-700' :
        success ? 'text-neutral-800' :
        highlight ? 'text-neutral-700' :
        'text-slate-900'
      )}>
        {value}
      </span>
    </div>
  );
}

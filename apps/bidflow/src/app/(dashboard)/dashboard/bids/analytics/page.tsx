/**
 * Bid Analytics Dashboard
 * 입찰 공고 분석 대시보드
 */

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { BidSourceChart } from '@/components/bids/analytics/BidSourceChart';
import { BidTimelineChart } from '@/components/bids/analytics/BidTimelineChart';
import { BudgetDistributionChart } from '@/components/bids/analytics/BudgetDistributionChart';
import { MatchingPerformance } from '@/components/bids/analytics/MatchingPerformance';
import type { Bid } from '@/lib/types/database.types';

interface SearchParams {
  period?: string;
}

export default async function BidAnalyticsPage(props: {
  searchParams: Promise<SearchParams>;
}) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();

  // 인증 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/auth/signin');
  }

  const period = searchParams.period || '30d';

  // 기간 필터
  let dateFilter: Date | null = null;
  if (period === '7d') {
    dateFilter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  } else if (period === '30d') {
    dateFilter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  } else if (period === '90d') {
    dateFilter = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  }

  // 기본 쿼리
  let query = supabase.from('bids').select('*').eq('user_id', user.id);

  if (dateFilter) {
    query = query.gte('created_at', dateFilter.toISOString());
  }

  const { data } = await query;
  const bids = data as Bid[] | null;

  // 통계 계산
  const stats = {
    totalBids: bids?.length || 0,
    matchedBids: bids?.filter((b) => b.matched).length || 0,
    avgMatchScore:
      bids && bids.length > 0
        ? Math.round(
            bids.reduce((sum, b) => sum + (b.match_score || 0), 0) / bids.length
          )
        : 0,
    totalLeads: bids?.reduce((sum, b) => sum + (b.leads_generated || 0), 0) || 0,
    bySource: {} as Record<string, number>,
    byStatus: {} as Record<string, number>,
    timeline: [] as Array<{ date: string; count: number }>,
    budgetRanges: {
      '0-10M': 0,
      '10M-50M': 0,
      '50M-100M': 0,
      '100M-500M': 0,
      '500M+': 0,
    },
  };

  // 출처별 집계
  bids?.forEach((bid) => {
    stats.bySource[bid.source] = (stats.bySource[bid.source] || 0) + 1;
    stats.byStatus[bid.status] = (stats.byStatus[bid.status] || 0) + 1;

    // 예산 범위
    if (bid.budget) {
      const budget = bid.budget;
      if (budget < 10000000) stats.budgetRanges['0-10M']++;
      else if (budget < 50000000) stats.budgetRanges['10M-50M']++;
      else if (budget < 100000000) stats.budgetRanges['50M-100M']++;
      else if (budget < 500000000) stats.budgetRanges['100M-500M']++;
      else stats.budgetRanges['500M+']++;
    }
  });

  // 일별 타임라인
  const timelineMap = new Map<string, number>();
  bids?.forEach((bid) => {
    const date = new Date(bid.created_at).toISOString().split('T')[0];
    timelineMap.set(date, (timelineMap.get(date) || 0) + 1);
  });

  stats.timeline = Array.from(timelineMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="min-h-screen bg-black p-6">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/bids"
              className="text-zinc-400 hover:text-white transition-colors"
            >
              입찰 공고
            </Link>
            <span className="text-zinc-600">/</span>
            <h1 className="text-2xl font-bold text-white">분석</h1>
          </div>

          {/* 기간 선택 */}
          <div className="flex items-center gap-2">
            <ChartBarIcon className="w-5 h-5 text-zinc-500" />
            <select
              defaultValue={period}
              onChange={(e) => {
                window.location.href = `/dashboard/bids/analytics?period=${e.target.value}`;
              }}
              className="h-10 px-3 bg-white/[0.04] border border-white/[0.06] rounded text-sm text-white focus:outline-none focus:border-white/[0.12] transition-colors"
            >
              <option value="7d">최근 7일</option>
              <option value="30d">최근 30일</option>
              <option value="90d">최근 90일</option>
              <option value="all">전체</option>
            </select>
          </div>
        </div>
        <p className="text-sm text-zinc-400">
          입찰 공고 데이터 분석 및 성과 지표
        </p>
      </div>

      {/* 요약 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#111113] border border-blue-500/20 rounded-lg p-6">
          <p className="text-sm text-zinc-400 mb-2">총 공고 수</p>
          <p className="text-3xl font-bold text-blue-400">
            {stats.totalBids.toLocaleString()}
          </p>
        </div>
        <div className="bg-[#111113] border border-emerald-500/20 rounded-lg p-6">
          <p className="text-sm text-zinc-400 mb-2">매칭률</p>
          <p className="text-3xl font-bold text-emerald-400">
            {stats.totalBids > 0
              ? Math.round((stats.matchedBids / stats.totalBids) * 100)
              : 0}
            %
          </p>
        </div>
        <div className="bg-[#111113] border border-purple-500/20 rounded-lg p-6">
          <p className="text-sm text-zinc-400 mb-2">평균 스코어</p>
          <p className="text-3xl font-bold text-purple-400">{stats.avgMatchScore}</p>
        </div>
        <div className="bg-[#111113] border border-amber-500/20 rounded-lg p-6">
          <p className="text-sm text-zinc-400 mb-2">생성된 리드</p>
          <p className="text-3xl font-bold text-amber-400">
            {stats.totalLeads.toLocaleString()}
          </p>
        </div>
      </div>

      {/* 차트 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 일별 추이 */}
        <BidTimelineChart data={stats.timeline} period={period} />

        {/* 출처별 분포 */}
        <BidSourceChart data={stats.bySource} />

        {/* 예산 분포 */}
        <BudgetDistributionChart data={stats.budgetRanges} />

        {/* 매칭 성과 */}
        <MatchingPerformance
          matched={stats.matchedBids}
          total={stats.totalBids}
          avgScore={stats.avgMatchScore}
        />
      </div>
    </div>
  );
}

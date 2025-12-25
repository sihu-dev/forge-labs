/**
 * Lead Analytics Dashboard
 * 리드 분석 및 통계 시각화
 */

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ScoreDistributionChart } from '@/components/leads/analytics/ScoreDistributionChart';
import { StatusFunnelChart } from '@/components/leads/analytics/StatusFunnelChart';
import { TrendsChart } from '@/components/leads/analytics/TrendsChart';
import { TopOrganizations } from '@/components/leads/analytics/TopOrganizations';
import { ConversionMetrics } from '@/components/leads/analytics/ConversionMetrics';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

interface SearchParams {
  period?: string;
}

export default async function LeadAnalyticsPage(props: {
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

  // 통계 데이터 가져오기
  const period = searchParams.period || '7d';
  const statsResponse = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/api/v1/leads/stats?period=${period}`,
    {
      headers: {
        Cookie: `sb-access-token=${(await supabase.auth.getSession()).data.session?.access_token}`,
      },
      cache: 'no-store',
    }
  );

  const statsData = await statsResponse.json();
  const stats = statsData.success ? statsData.data : null;

  return (
    <div className="min-h-screen bg-black p-6">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/leads"
              className="text-zinc-400 hover:text-white transition-colors"
            >
              리드
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
                window.location.href = `/dashboard/leads/analytics?period=${e.target.value}`;
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
          리드 데이터 분석 및 성과 지표 시각화
        </p>
      </div>

      {stats ? (
        <div className="space-y-6">
          {/* 전환율 지표 */}
          <ConversionMetrics data={stats.conversionRate} />

          {/* 차트 그리드 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 일별 추이 */}
            <TrendsChart data={stats.trends} period={period} />

            {/* 스코어 분포 */}
            <ScoreDistributionChart data={stats.scoreDistribution} />

            {/* 상태별 분포 */}
            <StatusFunnelChart data={stats.statusDistribution} />

            {/* 상위 조직 */}
            <TopOrganizations data={stats.topOrganizations} />
          </div>
        </div>
      ) : (
        <div className="bg-[#111113] border border-white/[0.06] rounded-lg p-12 text-center">
          <ChartBarIcon className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">
            분석 데이터를 불러올 수 없습니다
          </h3>
          <p className="text-sm text-zinc-400">
            데이터를 다시 불러오거나 관리자에게 문의하세요
          </p>
        </div>
      )}
    </div>
  );
}

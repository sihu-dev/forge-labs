/**
 * Bid Dashboard Page
 * 입찰 공고 대시보드
 */

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { BidStats } from '@/components/bids/BidStats';
import { BidList } from '@/components/bids/BidList';
import { BidFilters } from '@/components/bids/BidFilters';
import { PlusIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

interface SearchParams {
  status?: string;
  matched?: string;
  source?: string;
  search?: string;
  minScore?: string;
}

export default async function BidsPage(props: {
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

  // 쿼리 빌더
  let query = supabase
    .from('bids')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // 필터 적용
  if (searchParams.status && searchParams.status !== 'all') {
    query = query.eq('status', searchParams.status);
  }

  if (searchParams.matched === 'true') {
    query = query.eq('matched', true);
  }

  if (searchParams.source && searchParams.source !== 'all') {
    query = query.eq('source', searchParams.source);
  }

  if (searchParams.search) {
    query = query.or(
      `title.ilike.%${searchParams.search}%,organization.ilike.%${searchParams.search}%,description.ilike.%${searchParams.search}%`
    );
  }

  if (searchParams.minScore) {
    query = query.gte('match_score', parseInt(searchParams.minScore));
  }

  // 데이터 조회
  const { data: bids, error } = await query.limit(100);

  if (error) {
    console.error('Failed to fetch bids:', error);
  }

  // 통계 조회
  const { data: stats } = await supabase
    .from('bid_stats')
    .select('*')
    .eq('user_id', user.id)
    .single();

  return (
    <div className="min-h-screen bg-black p-6">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-white">입찰 공고</h1>

          <div className="flex items-center gap-3">
            {/* 크롤링 실행 버튼 */}
            <button
              onClick={() => {
                // TODO: Implement crawl trigger
                alert('크롤링을 시작합니다...');
              }}
              className="h-10 px-4 bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] text-white rounded text-sm font-medium transition-colors flex items-center gap-2"
            >
              <ArrowPathIcon className="w-4 h-4" />
              크롤링 실행
            </button>

            {/* Analytics 링크 */}
            <Link
              href="/dashboard/bids/analytics"
              className="h-10 px-4 bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] text-white rounded text-sm font-medium transition-colors"
            >
              분석
            </Link>

            {/* Keywords 링크 */}
            <Link
              href="/dashboard/bids/keywords"
              className="h-10 px-4 bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] text-white rounded text-sm font-medium transition-colors"
            >
              키워드 관리
            </Link>

            {/* 수동 추가 버튼 */}
            <Link
              href="/dashboard/bids/new"
              className="h-10 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm font-medium transition-colors flex items-center gap-2"
            >
              <PlusIcon className="w-4 h-4" />
              수동 추가
            </Link>
          </div>
        </div>
        <p className="text-sm text-zinc-400">
          입찰 공고를 자동으로 수집하고 키워드 매칭으로 우선순위를 파악하세요
        </p>
      </div>

      {/* 통계 */}
      {stats && <BidStats stats={stats} />}

      {/* 필터 */}
      <div className="mb-6">
        <BidFilters
          currentStatus={searchParams.status}
          currentMatched={searchParams.matched}
          currentSource={searchParams.source}
          currentSearch={searchParams.search}
          currentMinScore={searchParams.minScore}
        />
      </div>

      {/* 입찰 목록 */}
      <BidList bids={bids || []} />
    </div>
  );
}

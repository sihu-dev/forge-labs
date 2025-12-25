/**
 * Lead Dashboard Page
 * /dashboard/leads
 */

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { LeadList } from '@/components/leads/LeadList';
import { LeadStats } from '@/components/leads/LeadStats';
import { LeadFilters } from '@/components/leads/LeadFilters';

export const dynamic = 'force-dynamic';

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; minScore?: string; search?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  // 인증 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // 통계 조회
  const { data: stats } = await supabase
    .from('lead_stats')
    .select('*')
    .eq('user_id', user.id)
    .single();

  // 리드 조회 (필터 적용)
  let query = supabase
    .from('leads')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (params.status) {
    query = query.eq('status', params.status);
  }

  if (params.minScore) {
    query = query.gte('score', parseInt(params.minScore));
  }

  if (params.search) {
    query = query.or(
      `name.ilike.%${params.search}%,email.ilike.%${params.search}%,organization.ilike.%${params.search}%`
    );
  }

  const { data: leads, error } = await query;

  return (
    <div className="min-h-screen bg-[#0A0A0B] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">리드 관리</h1>
            <p className="text-sm text-zinc-400 mt-1">
              입찰 공고에서 발견한 잠재 고객 목록
            </p>
          </div>

          <button className="h-10 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm font-medium transition-colors">
            + 리드 추가
          </button>
        </div>

        {/* 통계 카드 */}
        <Suspense fallback={<div>Loading stats...</div>}>
          <LeadStats stats={stats} />
        </Suspense>

        {/* 필터 */}
        <LeadFilters />

        {/* 리드 목록 */}
        <Suspense fallback={<div>Loading leads...</div>}>
          <LeadList leads={leads || []} />
        </Suspense>
      </div>
    </div>
  );
}

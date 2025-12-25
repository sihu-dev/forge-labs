/**
 * Lead Detail Page
 * 개별 리드 상세 페이지
 */

import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { LeadDetailView } from '@/components/leads/LeadDetailView';

interface LeadDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function LeadDetailPage({ params }: LeadDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // 인증 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/auth/signin');
  }

  // 리드 조회
  const { data: lead, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !lead) {
    notFound();
  }

  // 활동 내역 조회
  const { data: activities } = await supabase
    .from('lead_activities')
    .select('*')
    .eq('lead_id', id)
    .order('created_at', { ascending: false })
    .limit(50);

  // 입찰 정보 조회 (있는 경우)
  let bid = null;
  if (lead && (lead as any).bid_id) {
    const { data: bidData } = await supabase
      .from('bids')
      .select('*')
      .eq('id', (lead as any).bid_id)
      .single();
    bid = bidData;
  }

  return (
    <LeadDetailView
      lead={lead}
      activities={activities || []}
      bid={bid}
      userId={user.id}
    />
  );
}

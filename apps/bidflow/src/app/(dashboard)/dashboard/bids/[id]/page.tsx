/**
 * Bid Detail Page
 * 입찰 공고 상세 페이지
 */

import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { BidDetailView } from '@/components/bids/BidDetailView';

interface BidDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function BidDetailPage({ params }: BidDetailPageProps) {
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

  // 입찰 조회
  const { data: bid, error } = await supabase
    .from('bids')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !bid) {
    notFound();
  }

  // 활동 내역 조회
  const { data: activities } = await supabase
    .from('bid_activities')
    .select('*')
    .eq('bid_id', id)
    .order('created_at', { ascending: false })
    .limit(50);

  // 생성된 리드 조회
  const { data: leads } = await supabase
    .from('leads')
    .select('id, name, email, score, status, created_at')
    .eq('bid_id', id)
    .order('created_at', { ascending: false })
    .limit(20);

  return (
    <BidDetailView
      bid={bid}
      activities={activities || []}
      leads={leads || []}
      userId={user.id}
    />
  );
}

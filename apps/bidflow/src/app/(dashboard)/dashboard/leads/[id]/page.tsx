/**
 * Lead Detail Page
 * 개별 리드 상세 페이지
 */

import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { LeadDetailView } from '@/components/leads/LeadDetailView';
import type { Lead, LeadActivity, Bid } from '@/lib/types/database.types';

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
  const { data: leadData, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  const lead = leadData as Lead | null;

  if (error || !lead) {
    notFound();
  }

  // 활동 내역 조회
  const { data: activitiesData } = await supabase
    .from('lead_activities')
    .select('*')
    .eq('lead_id', id)
    .order('created_at', { ascending: false })
    .limit(50);

  const activities = (activitiesData as LeadActivity[] | null) || [];

  // 입찰 정보 조회 (있는 경우)
  let bid: Bid | null = null;
  if (lead.bid_id) {
    const { data: bidData } = await supabase
      .from('bids')
      .select('*')
      .eq('id', lead.bid_id)
      .single();
    bid = bidData as Bid | null;
  }

  // Convert null values to undefined for component compatibility
  // Extract UI-specific fields from metadata if available
  const metadata = lead.metadata as { crm_id?: string; crm_synced_at?: string; deal_id?: string; signals?: any[] } | null;

  const leadForView = {
    id: lead.id,
    name: lead.name,
    email: lead.email,
    title: lead.title ?? undefined,
    phone: lead.phone ?? undefined,
    organization: lead.organization ?? undefined,
    organization_domain: lead.organization_domain ?? undefined,
    department: lead.department ?? undefined,
    score: lead.score,
    status: lead.status,
    verified: lead.verified,
    source: lead.source ?? undefined,
    sequence_id: lead.sequence_id ?? undefined,
    notes: lead.notes ?? undefined,
    metadata: lead.metadata ?? undefined,
    enriched_at: lead.enriched_at ?? undefined,
    created_at: lead.created_at,
    updated_at: lead.updated_at,
    // UI-specific fields derived from metadata
    crm_id: metadata?.crm_id,
    crm_synced_at: metadata?.crm_synced_at,
    deal_id: metadata?.deal_id,
    deal_created: metadata?.deal_id ? true : false,
    signals: metadata?.signals,
  };

  return (
    <LeadDetailView
      lead={leadForView}
      activities={activities}
      bid={bid}
      userId={user.id}
    />
  );
}

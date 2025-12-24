/**
 * Automation Metrics API
 * 자동화 대시보드 메트릭 조회
 */

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 병렬로 메트릭 조회
    const [leadsResult, campaignsResult, workflowsResult, crossSellResult] = await Promise.all([
      // 리드 통계
      supabase.rpc('get_lead_stats'),
      // 캠페인 통계
      supabase.rpc('get_campaign_stats'),
      // 워크플로우 통계
      supabase.rpc('get_workflow_stats'),
      // 크로스셀 통계
      supabase.rpc('get_cross_sell_stats'),
    ]);

    // 폴백: RPC가 없으면 직접 쿼리
    const metrics = {
      leads: leadsResult.data ?? {
        total: 0,
        new: 0,
        qualified: 0,
        contacted: 0,
        converted: 0,
      },
      campaigns: campaignsResult.data ?? {
        active: 0,
        emailsSent: 0,
        opened: 0,
        replied: 0,
        meetings: 0,
      },
      workflows: workflowsResult.data ?? {
        active: 0,
        totalRuns: 0,
        successRate: 0,
        lastRunAt: null,
      },
      crossSell: crossSellResult.data ?? {
        opportunities: 0,
        converted: 0,
        pendingReview: 0,
      },
    };

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Failed to fetch automation metrics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

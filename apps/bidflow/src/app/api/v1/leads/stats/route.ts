/**
 * @route GET /api/v1/leads/stats
 * @description Lead Statistics & Analytics API
 *
 * 리드 통계 및 분석 데이터 제공
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// ============================================================================
// GET Handler - 통계 조회
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || '7d'; // 7d, 30d, 90d, all

    // 기간 계산
    let startDate: Date | null = null;
    if (period !== 'all') {
      const days = parseInt(period);
      startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
    }

    // 1. 기본 통계
    const { data: stats } = await supabase
      .from('lead_stats')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // 2. 기간별 추이 (일별 생성된 리드 수)
    let trendsQuery = supabase
      .from('leads')
      .select('created_at, score, status')
      .eq('user_id', user.id);

    if (startDate) {
      trendsQuery = trendsQuery.gte('created_at', startDate.toISOString());
    }

    const { data: leadsForTrends } = await trendsQuery;

    // 일별 그룹핑
    const dailyTrends: Record<string, number> = {};
    leadsForTrends?.forEach((lead) => {
      const date = new Date(lead.created_at).toISOString().split('T')[0];
      dailyTrends[date] = (dailyTrends[date] || 0) + 1;
    });

    // 3. 스코어 분포
    const scoreDistribution = {
      '0-20': 0,
      '21-40': 0,
      '41-60': 0,
      '61-80': 0,
      '81-100': 0,
    };

    leadsForTrends?.forEach((lead) => {
      const score = lead.score || 0;
      if (score <= 20) scoreDistribution['0-20']++;
      else if (score <= 40) scoreDistribution['21-40']++;
      else if (score <= 60) scoreDistribution['41-60']++;
      else if (score <= 80) scoreDistribution['61-80']++;
      else scoreDistribution['81-100']++;
    });

    // 4. 상태별 분포
    const statusDistribution: Record<string, number> = {};
    leadsForTrends?.forEach((lead) => {
      const status = lead.status || 'unknown';
      statusDistribution[status] = (statusDistribution[status] || 0) + 1;
    });

    // 5. 상위 조직 (리드가 많은 순)
    const { data: topOrganizations } = await supabase
      .from('leads')
      .select('organization')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100);

    const orgCounts: Record<string, number> = {};
    topOrganizations?.forEach((lead) => {
      if (lead.organization) {
        orgCounts[lead.organization] = (orgCounts[lead.organization] || 0) + 1;
      }
    });

    const topOrgs = Object.entries(orgCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([org, count]) => ({ organization: org, count }));

    // 6. 전환율 분석
    const conversionRate = stats
      ? {
          leadToContacted:
            stats.total_leads > 0
              ? Math.round((stats.contacted_leads / stats.total_leads) * 100)
              : 0,
          contactedToQualified:
            stats.contacted_leads > 0
              ? Math.round((stats.qualified_leads / stats.contacted_leads) * 100)
              : 0,
          qualifiedToConverted:
            stats.qualified_leads > 0
              ? Math.round((stats.converted_leads / stats.qualified_leads) * 100)
              : 0,
          overall:
            stats.total_leads > 0
              ? Math.round((stats.converted_leads / stats.total_leads) * 100)
              : 0,
        }
      : null;

    // 응답
    return NextResponse.json({
      success: true,
      data: {
        summary: stats,
        trends: Object.entries(dailyTrends)
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => a.date.localeCompare(b.date)),
        scoreDistribution,
        statusDistribution,
        topOrganizations: topOrgs,
        conversionRate,
        period,
      },
    });
  } catch (error) {
    console.error('Lead stats error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get stats',
      },
      { status: 500 }
    );
  }
}

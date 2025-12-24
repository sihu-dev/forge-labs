'use client';

/**
 * AutomationDashboard - 자동화 현황 대시보드
 * 리드 파이프라인, 캠페인 성과, 워크플로우 상태 통합 뷰
 */

import { useState, useEffect } from 'react';

interface DashboardMetrics {
  leads: {
    total: number;
    new: number;
    qualified: number;
    contacted: number;
    converted: number;
  };
  campaigns: {
    active: number;
    emailsSent: number;
    opened: number;
    replied: number;
    meetings: number;
  };
  workflows: {
    active: number;
    totalRuns: number;
    successRate: number;
    lastRunAt: string | null;
  };
  crossSell: {
    opportunities: number;
    converted: number;
    pendingReview: number;
  };
}

const initialMetrics: DashboardMetrics = {
  leads: { total: 0, new: 0, qualified: 0, contacted: 0, converted: 0 },
  campaigns: { active: 0, emailsSent: 0, opened: 0, replied: 0, meetings: 0 },
  workflows: { active: 0, totalRuns: 0, successRate: 0, lastRunAt: null },
  crossSell: { opportunities: 0, converted: 0, pendingReview: 0 },
};

export function AutomationDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics>(initialMetrics);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardMetrics();
  }, []);

  async function fetchDashboardMetrics() {
    try {
      setIsLoading(true);
      // TODO: API 연결
      // const response = await fetch('/api/admin/automation/metrics');
      // const data = await response.json();
      // setMetrics(data);

      // 임시 데모 데이터
      setMetrics({
        leads: { total: 1247, new: 89, qualified: 234, contacted: 456, converted: 78 },
        campaigns: { active: 5, emailsSent: 3420, opened: 1890, replied: 234, meetings: 45 },
        workflows: { active: 8, totalRuns: 12450, successRate: 98.5, lastRunAt: new Date().toISOString() },
        crossSell: { opportunities: 156, converted: 23, pendingReview: 34 },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '데이터 로드 실패');
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-white/5 rounded w-1/4" />
          <div className="grid grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-white/5 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-red-400">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">자동화 대시보드</h1>
          <p className="text-white/60 mt-1">HEPHAITOS + BIDFLOW 통합 세일즈 자동화</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchDashboardMetrics}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-white/80 transition-colors"
          >
            새로고침
          </button>
          <a
            href="/admin/automation/workflows"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm text-white transition-colors"
          >
            워크플로우 관리
          </a>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-6">
        <MetricCard
          title="총 리드"
          value={metrics.leads.total.toLocaleString()}
          change="+12.5%"
          positive
          subValues={[
            { label: '신규', value: metrics.leads.new },
            { label: '검증됨', value: metrics.leads.qualified },
          ]}
        />
        <MetricCard
          title="활성 캠페인"
          value={metrics.campaigns.active.toString()}
          subValues={[
            { label: '발송', value: metrics.campaigns.emailsSent },
            { label: '오픈', value: metrics.campaigns.opened },
          ]}
        />
        <MetricCard
          title="워크플로우 성공률"
          value={`${metrics.workflows.successRate}%`}
          change="+2.3%"
          positive
          subValues={[
            { label: '활성', value: metrics.workflows.active },
            { label: '총 실행', value: metrics.workflows.totalRuns },
          ]}
        />
        <MetricCard
          title="크로스셀 기회"
          value={metrics.crossSell.opportunities.toString()}
          subValues={[
            { label: '전환', value: metrics.crossSell.converted },
            { label: '검토 대기', value: metrics.crossSell.pendingReview },
          ]}
        />
      </div>

      {/* Lead Pipeline */}
      <div className="bg-white/3 border border-white/10 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-6">리드 파이프라인</h2>
        <LeadPipeline leads={metrics.leads} />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-2 gap-6">
        {/* Campaign Performance */}
        <div className="bg-white/3 border border-white/10 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">캠페인 성과</h2>
          <CampaignPerformance campaigns={metrics.campaigns} />
        </div>

        {/* Recent Activities */}
        <div className="bg-white/3 border border-white/10 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">최근 활동</h2>
          <RecentActivities />
        </div>
      </div>

      {/* Cross-Sell Opportunities */}
      <div className="bg-white/3 border border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">크로스셀 기회</h2>
          <span className="text-sm text-white/60">HEPHAITOS ↔ BIDFLOW</span>
        </div>
        <CrossSellOpportunities />
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  change?: string;
  positive?: boolean;
  subValues: { label: string; value: number }[];
}

function MetricCard({ title, value, change, positive, subValues }: MetricCardProps) {
  return (
    <div className="bg-white/3 border border-white/10 rounded-xl p-5">
      <div className="flex items-start justify-between">
        <span className="text-sm text-white/60">{title}</span>
        {change && (
          <span className={`text-xs ${positive ? 'text-green-400' : 'text-red-400'}`}>
            {change}
          </span>
        )}
      </div>
      <div className="mt-2 text-3xl font-bold text-white">{value}</div>
      <div className="mt-3 flex gap-4">
        {subValues.map((sub) => (
          <div key={sub.label} className="text-xs">
            <span className="text-white/40">{sub.label}</span>
            <span className="text-white/80 ml-1">{sub.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LeadPipeline({ leads }: { leads: DashboardMetrics['leads'] }) {
  const stages = [
    { key: 'new', label: '신규', value: leads.new, color: 'bg-blue-500' },
    { key: 'qualified', label: '검증됨', value: leads.qualified, color: 'bg-purple-500' },
    { key: 'contacted', label: '연락됨', value: leads.contacted, color: 'bg-yellow-500' },
    { key: 'converted', label: '전환됨', value: leads.converted, color: 'bg-green-500' },
  ];

  const maxValue = Math.max(...stages.map((s) => s.value));

  return (
    <div className="space-y-4">
      {stages.map((stage) => (
        <div key={stage.key} className="flex items-center gap-4">
          <div className="w-20 text-sm text-white/60">{stage.label}</div>
          <div className="flex-1 bg-white/5 rounded-full h-8 overflow-hidden">
            <div
              className={`${stage.color} h-full rounded-full transition-all duration-500 flex items-center justify-end pr-3`}
              style={{ width: `${(stage.value / maxValue) * 100}%` }}
            >
              <span className="text-xs font-medium text-white">{stage.value}</span>
            </div>
          </div>
          <div className="w-16 text-right text-sm text-white/40">
            {((stage.value / leads.total) * 100).toFixed(1)}%
          </div>
        </div>
      ))}
    </div>
  );
}

function CampaignPerformance({ campaigns }: { campaigns: DashboardMetrics['campaigns'] }) {
  const metrics = [
    { label: '발송', value: campaigns.emailsSent, icon: '📧' },
    { label: '오픈', value: campaigns.opened, rate: ((campaigns.opened / campaigns.emailsSent) * 100).toFixed(1) },
    { label: '응답', value: campaigns.replied, rate: ((campaigns.replied / campaigns.emailsSent) * 100).toFixed(1) },
    { label: '미팅', value: campaigns.meetings, icon: '📅' },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {metrics.map((metric) => (
        <div key={metric.label} className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/60">{metric.label}</span>
            {metric.rate && <span className="text-xs text-green-400">{metric.rate}%</span>}
          </div>
          <div className="mt-1 text-2xl font-semibold text-white">
            {metric.value.toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}

function RecentActivities() {
  const activities = [
    { type: 'email_opened', lead: '김철수', company: '테크스타트업', time: '2분 전' },
    { type: 'lead_qualified', lead: '이영희', company: 'ABC제조', time: '15분 전' },
    { type: 'meeting_scheduled', lead: '박민수', company: '글로벌무역', time: '1시간 전' },
    { type: 'bid_matched', lead: '최지훈', company: 'K엔지니어링', time: '2시간 전' },
    { type: 'email_replied', lead: '정수진', company: '혁신솔루션', time: '3시간 전' },
  ];

  const activityIcons: Record<string, string> = {
    email_opened: '📬',
    lead_qualified: '✅',
    meeting_scheduled: '📅',
    bid_matched: '🎯',
    email_replied: '💬',
  };

  const activityLabels: Record<string, string> = {
    email_opened: '이메일 확인',
    lead_qualified: '리드 검증됨',
    meeting_scheduled: '미팅 예약',
    bid_matched: '입찰 매칭',
    email_replied: '이메일 응답',
  };

  return (
    <div className="space-y-3">
      {activities.map((activity, i) => (
        <div key={i} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
          <span className="text-lg">{activityIcons[activity.type]}</span>
          <div className="flex-1 min-w-0">
            <div className="text-sm text-white truncate">
              <span className="font-medium">{activity.lead}</span>
              <span className="text-white/40"> · {activity.company}</span>
            </div>
            <div className="text-xs text-white/40">{activityLabels[activity.type]}</div>
          </div>
          <span className="text-xs text-white/40">{activity.time}</span>
        </div>
      ))}
    </div>
  );
}

function CrossSellOpportunities() {
  const opportunities = [
    {
      source: 'BIDFLOW',
      target: 'HEPHAITOS',
      lead: '한국중공업',
      signal: '국제입찰 참여 → 트레이딩 교육 관심',
      score: 85,
      status: 'pending',
    },
    {
      source: 'HEPHAITOS',
      target: 'BIDFLOW',
      lead: '글로벌트레이딩',
      signal: '트레이딩 수강 → 해외조달 컨설팅 필요',
      score: 72,
      status: 'contacted',
    },
    {
      source: 'BIDFLOW',
      target: 'HEPHAITOS',
      lead: '스마트매뉴팩처',
      signal: 'KOICA 입찰 성공 → 금융 리터러시 관심',
      score: 68,
      status: 'pending',
    },
  ];

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400',
    contacted: 'bg-blue-500/20 text-blue-400',
    converted: 'bg-green-500/20 text-green-400',
  };

  const statusLabels: Record<string, string> = {
    pending: '검토 대기',
    contacted: '연락 완료',
    converted: '전환 완료',
  };

  return (
    <div className="space-y-3">
      {opportunities.map((opp, i) => (
        <div key={i} className="flex items-center gap-4 p-4 bg-white/5 rounded-lg">
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded">{opp.source}</span>
            <span className="text-white/40">→</span>
            <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded">{opp.target}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm text-white font-medium">{opp.lead}</div>
            <div className="text-xs text-white/40 truncate">{opp.signal}</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-center">
              <div className="text-lg font-bold text-white">{opp.score}</div>
              <div className="text-xs text-white/40">스코어</div>
            </div>
            <span className={`px-2 py-1 rounded text-xs ${statusColors[opp.status]}`}>
              {statusLabels[opp.status]}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

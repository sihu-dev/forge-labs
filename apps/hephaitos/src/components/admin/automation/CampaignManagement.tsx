'use client';

/**
 * CampaignManagement - 캠페인 관리 대시보드
 * 이메일, LinkedIn 멀티채널 캠페인 관리
 */

import { useState, useEffect } from 'react';

type CampaignType = 'email' | 'linkedin' | 'multi_channel' | 'event' | 'webinar' | 'content';
type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'cancelled';

interface Campaign {
  id: string;
  name: string;
  description?: string;
  type: CampaignType;
  status: CampaignStatus;
  startDate?: string;
  endDate?: string;
  targetSegments: string[];
  metrics: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    replied: number;
    leadsGenerated: number;
    meetingsBooked: number;
  };
  bidflowRelated: boolean;
  hephaitosRelated: boolean;
  createdAt: string;
}

interface Sequence {
  id: string;
  name: string;
  campaignId?: string;
  type: 'email' | 'linkedin' | 'multi_channel';
  status: 'draft' | 'active' | 'paused' | 'archived';
  stepsCount: number;
  enrolled: number;
  completed: number;
  replied: number;
}

const typeConfig: Record<CampaignType, { label: string; icon: string; color: string }> = {
  email: { label: '이메일', icon: '📧', color: 'bg-blue-500/20 text-blue-400' },
  linkedin: { label: 'LinkedIn', icon: '💼', color: 'bg-indigo-500/20 text-indigo-400' },
  multi_channel: { label: '멀티채널', icon: '📱', color: 'bg-purple-500/20 text-purple-400' },
  event: { label: '이벤트', icon: '🎪', color: 'bg-orange-500/20 text-orange-400' },
  webinar: { label: '웨비나', icon: '🎥', color: 'bg-red-500/20 text-red-400' },
  content: { label: '콘텐츠', icon: '📝', color: 'bg-green-500/20 text-green-400' },
};

const statusConfig: Record<CampaignStatus, { label: string; color: string }> = {
  draft: { label: '초안', color: 'bg-gray-500/20 text-gray-400' },
  scheduled: { label: '예약됨', color: 'bg-blue-500/20 text-blue-400' },
  active: { label: '진행중', color: 'bg-green-500/20 text-green-400' },
  paused: { label: '일시정지', color: 'bg-yellow-500/20 text-yellow-400' },
  completed: { label: '완료', color: 'bg-purple-500/20 text-purple-400' },
  cancelled: { label: '취소됨', color: 'bg-red-500/20 text-red-400' },
};

export function CampaignManagement() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'campaigns' | 'sequences'>('campaigns');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setIsLoading(true);
      // TODO: API 연결

      // 임시 데모 데이터
      setCampaigns([
        {
          id: '1',
          name: 'BIDFLOW 입찰 교육 캠페인',
          description: 'SME 대상 국제입찰 교육 프로그램 홍보',
          type: 'multi_channel',
          status: 'active',
          startDate: '2024-12-01',
          endDate: '2024-12-31',
          targetSegments: ['SME', '제조업', '수출기업'],
          metrics: {
            sent: 1250,
            delivered: 1198,
            opened: 678,
            clicked: 234,
            replied: 89,
            leadsGenerated: 45,
            meetingsBooked: 12,
          },
          bidflowRelated: true,
          hephaitosRelated: false,
          createdAt: '2024-11-25',
        },
        {
          id: '2',
          name: 'HEPHAITOS 트레이딩 마스터클래스',
          description: '유튜버 파트너십 기반 트레이딩 교육',
          type: 'email',
          status: 'active',
          startDate: '2024-12-10',
          targetSegments: ['개인투자자', '트레이더'],
          metrics: {
            sent: 850,
            delivered: 823,
            opened: 456,
            clicked: 178,
            replied: 67,
            leadsGenerated: 34,
            meetingsBooked: 8,
          },
          bidflowRelated: false,
          hephaitosRelated: true,
          createdAt: '2024-12-05',
        },
        {
          id: '3',
          name: '크로스셀 통합 캠페인',
          description: 'BIDFLOW→HEPHAITOS 크로스셀링',
          type: 'linkedin',
          status: 'scheduled',
          startDate: '2025-01-02',
          targetSegments: ['BIDFLOW 고객', '잠재 투자자'],
          metrics: {
            sent: 0,
            delivered: 0,
            opened: 0,
            clicked: 0,
            replied: 0,
            leadsGenerated: 0,
            meetingsBooked: 0,
          },
          bidflowRelated: true,
          hephaitosRelated: true,
          createdAt: '2024-12-20',
        },
      ]);

      setSequences([
        {
          id: '1',
          name: 'BIDFLOW 신규 리드 온보딩',
          campaignId: '1',
          type: 'email',
          status: 'active',
          stepsCount: 5,
          enrolled: 234,
          completed: 89,
          replied: 34,
        },
        {
          id: '2',
          name: 'HEPHAITOS 무료 체험 후속',
          campaignId: '2',
          type: 'multi_channel',
          status: 'active',
          stepsCount: 7,
          enrolled: 156,
          completed: 45,
          replied: 23,
        },
        {
          id: '3',
          name: '미팅 후 제안서 발송',
          type: 'email',
          status: 'active',
          stepsCount: 3,
          enrolled: 45,
          completed: 12,
          replied: 8,
        },
      ]);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">캠페인 관리</h1>
          <p className="text-white/60 mt-1">이메일, LinkedIn 멀티채널 캠페인</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm text-white transition-colors">
          + 새 캠페인
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-6">
        <SummaryCard
          label="활성 캠페인"
          value={campaigns.filter((c) => c.status === 'active').length}
          subLabel="진행중"
          trend="+2"
          positive
        />
        <SummaryCard
          label="총 발송"
          value={campaigns.reduce((sum, c) => sum + c.metrics.sent, 0).toLocaleString()}
          subLabel="이번 달"
        />
        <SummaryCard
          label="평균 오픈율"
          value={`${calculateAvgOpenRate(campaigns)}%`}
          subLabel="업계 평균 21%"
          positive
        />
        <SummaryCard
          label="미팅 예약"
          value={campaigns.reduce((sum, c) => sum + c.metrics.meetingsBooked, 0)}
          subLabel="이번 달"
        />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        <button
          onClick={() => setActiveTab('campaigns')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'campaigns'
              ? 'text-white border-blue-500'
              : 'text-white/60 border-transparent hover:text-white'
          }`}
        >
          캠페인 ({campaigns.length})
        </button>
        <button
          onClick={() => setActiveTab('sequences')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'sequences'
              ? 'text-white border-blue-500'
              : 'text-white/60 border-transparent hover:text-white'
          }`}
        >
          시퀀스 ({sequences.length})
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-white/5 rounded-xl" />
          ))}
        </div>
      ) : activeTab === 'campaigns' ? (
        <div className="space-y-4">
          {campaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {sequences.map((sequence) => (
            <SequenceCard key={sequence.id} sequence={sequence} />
          ))}
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  subLabel,
  trend,
  positive,
}: {
  label: string;
  value: string | number;
  subLabel: string;
  trend?: string;
  positive?: boolean;
}) {
  return (
    <div className="bg-white/3 border border-white/10 rounded-xl p-5">
      <div className="flex items-start justify-between">
        <span className="text-sm text-white/60">{label}</span>
        {trend && (
          <span className={`text-xs ${positive ? 'text-green-400' : 'text-red-400'}`}>
            {trend}
          </span>
        )}
      </div>
      <div className="mt-2 text-3xl font-bold text-white">{value}</div>
      <div className="mt-1 text-xs text-white/40">{subLabel}</div>
    </div>
  );
}

function CampaignCard({ campaign }: { campaign: Campaign }) {
  const openRate = campaign.metrics.sent > 0
    ? ((campaign.metrics.opened / campaign.metrics.sent) * 100).toFixed(1)
    : '0';
  const replyRate = campaign.metrics.sent > 0
    ? ((campaign.metrics.replied / campaign.metrics.sent) * 100).toFixed(1)
    : '0';

  return (
    <div className="bg-white/3 border border-white/10 rounded-xl p-6 hover:bg-white/5 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span className={`px-2 py-1 rounded text-xs ${typeConfig[campaign.type].color}`}>
              {typeConfig[campaign.type].icon} {typeConfig[campaign.type].label}
            </span>
            <span className={`px-2 py-1 rounded text-xs ${statusConfig[campaign.status].color}`}>
              {statusConfig[campaign.status].label}
            </span>
            {campaign.bidflowRelated && (
              <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded text-xs">BIDFLOW</span>
            )}
            {campaign.hephaitosRelated && (
              <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs">HEPHAITOS</span>
            )}
          </div>
          <h3 className="mt-3 text-lg font-semibold text-white">{campaign.name}</h3>
          {campaign.description && (
            <p className="mt-1 text-sm text-white/60">{campaign.description}</p>
          )}
          <div className="mt-3 flex items-center gap-4 text-xs text-white/40">
            {campaign.startDate && (
              <span>시작: {new Date(campaign.startDate).toLocaleDateString('ko-KR')}</span>
            )}
            {campaign.endDate && (
              <span>종료: {new Date(campaign.endDate).toLocaleDateString('ko-KR')}</span>
            )}
            <span>타겟: {campaign.targetSegments.join(', ')}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <EditIcon className="w-4 h-4 text-white/60" />
          </button>
          <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <MoreIcon className="w-4 h-4 text-white/60" />
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-6 gap-4">
        <MetricItem label="발송" value={campaign.metrics.sent} />
        <MetricItem label="오픈" value={campaign.metrics.opened} rate={`${openRate}%`} />
        <MetricItem label="클릭" value={campaign.metrics.clicked} />
        <MetricItem label="응답" value={campaign.metrics.replied} rate={`${replyRate}%`} />
        <MetricItem label="리드" value={campaign.metrics.leadsGenerated} />
        <MetricItem label="미팅" value={campaign.metrics.meetingsBooked} highlight />
      </div>
    </div>
  );
}

function SequenceCard({ sequence }: { sequence: Sequence }) {
  const completionRate = sequence.enrolled > 0
    ? ((sequence.completed / sequence.enrolled) * 100).toFixed(0)
    : '0';

  return (
    <div className="bg-white/3 border border-white/10 rounded-xl p-6 hover:bg-white/5 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
              {sequence.stepsCount}단계
            </span>
            <span className={`px-2 py-1 rounded text-xs ${
              sequence.status === 'active'
                ? 'bg-green-500/20 text-green-400'
                : sequence.status === 'paused'
                ? 'bg-yellow-500/20 text-yellow-400'
                : 'bg-gray-500/20 text-gray-400'
            }`}>
              {sequence.status === 'active' ? '활성' : sequence.status === 'paused' ? '일시정지' : '초안'}
            </span>
          </div>
          <h3 className="mt-3 text-lg font-semibold text-white">{sequence.name}</h3>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-white/80 transition-colors">
            편집
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-white/60">진행률</span>
          <span className="text-white">{completionRate}%</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full"
            style={{ width: `${completionRate}%` }}
          />
        </div>
        <div className="mt-3 flex gap-6 text-xs text-white/40">
          <span>등록: {sequence.enrolled}</span>
          <span>완료: {sequence.completed}</span>
          <span>응답: {sequence.replied}</span>
        </div>
      </div>
    </div>
  );
}

function MetricItem({
  label,
  value,
  rate,
  highlight,
}: {
  label: string;
  value: number;
  rate?: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <div className="text-xs text-white/40">{label}</div>
      <div className={`text-lg font-semibold ${highlight ? 'text-green-400' : 'text-white'}`}>
        {value.toLocaleString()}
      </div>
      {rate && <div className="text-xs text-blue-400">{rate}</div>}
    </div>
  );
}

function calculateAvgOpenRate(campaigns: Campaign[]): string {
  const activeCampaigns = campaigns.filter((c) => c.metrics.sent > 0);
  if (activeCampaigns.length === 0) return '0';
  const totalOpenRate = activeCampaigns.reduce(
    (sum, c) => sum + (c.metrics.opened / c.metrics.sent) * 100,
    0
  );
  return (totalOpenRate / activeCampaigns.length).toFixed(1);
}

function EditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function MoreIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="19" r="1" />
    </svg>
  );
}

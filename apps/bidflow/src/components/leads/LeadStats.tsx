/**
 * Lead Statistics Cards
 * 리드 통계 대시보드
 */

'use client';

import {
  UserGroupIcon,
  SparklesIcon,
  CheckCircleIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

interface LeadStatsProps {
  stats: {
    total_leads: number;
    new_leads: number;
    contacted_leads: number;
    qualified_leads: number;
    converted_leads: number;
    avg_score: number;
    high_score_leads: number;
    synced_leads: number;
    deals_created: number;
  } | null;
}

export function LeadStats({ stats }: LeadStatsProps) {
  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-[#111113] border border-white/[0.06] rounded-lg p-6 animate-pulse">
            <div className="h-4 bg-white/5 rounded w-24 mb-4"></div>
            <div className="h-8 bg-white/5 rounded w-16"></div>
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: '전체 리드',
      value: stats.total_leads,
      subtitle: `신규 ${stats.new_leads}개`,
      icon: UserGroupIcon,
      color: 'blue',
    },
    {
      title: '평균 스코어',
      value: Math.round(stats.avg_score || 0),
      subtitle: `고득점 ${stats.high_score_leads}개`,
      icon: SparklesIcon,
      color: 'purple',
    },
    {
      title: 'CRM 동기화',
      value: stats.synced_leads,
      subtitle: `${Math.round((stats.synced_leads / stats.total_leads) * 100) || 0}% 완료`,
      icon: CheckCircleIcon,
      color: 'emerald',
    },
    {
      title: '생성된 딜',
      value: stats.deals_created,
      subtitle: `전환율 ${Math.round((stats.deals_created / stats.total_leads) * 100) || 0}%`,
      icon: ChartBarIcon,
      color: 'amber',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className="bg-[#111113] border border-white/[0.06] rounded-lg p-6 hover:border-white/[0.12] transition-colors"
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`w-10 h-10 bg-${card.color}-500/10 rounded-lg flex items-center justify-center`}>
              <card.icon className={`w-5 h-5 text-${card.color}-400`} />
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-zinc-400">{card.title}</p>
            <p className="text-3xl font-bold text-white">{card.value}</p>
            <p className="text-xs text-zinc-500">{card.subtitle}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Bid Statistics Component
 * 입찰 공고 통계 카드
 */

'use client';

import {
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  SparklesIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

interface BidStatsProps {
  stats: {
    total_bids: number;
    active_bids: number;
    matched_bids: number;
    upcoming_bids: number;
    expired_bids: number;
    total_leads_generated: number;
    avg_match_score: number;
    new_this_week: number;
    new_this_month: number;
  };
}

export function BidStats({ stats }: BidStatsProps) {
  const cards = [
    {
      label: '전체 공고',
      value: stats.total_bids.toLocaleString(),
      subtitle: `이번 주 ${stats.new_this_week}개`,
      icon: DocumentTextIcon,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
    },
    {
      label: '활성 공고',
      value: stats.active_bids.toLocaleString(),
      subtitle: `마감 예정 ${stats.upcoming_bids}개`,
      icon: ClockIcon,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
    },
    {
      label: '매칭됨',
      value: stats.matched_bids.toLocaleString(),
      subtitle: `평균 스코어 ${Math.round(stats.avg_match_score)}`,
      icon: CheckCircleIcon,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
    },
    {
      label: '생성된 리드',
      value: stats.total_leads_generated.toLocaleString(),
      subtitle: `${stats.matched_bids > 0 ? Math.round((stats.total_leads_generated / stats.matched_bids) * 10) / 10 : 0}개/공고`,
      icon: UserGroupIcon,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.label}
            className={`bg-[#111113] border ${card.borderColor} rounded-lg p-6 hover:border-opacity-40 transition-all`}
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className={`w-12 h-12 ${card.bgColor} rounded-lg flex items-center justify-center border ${card.borderColor}`}
              >
                <Icon className={`w-6 h-6 ${card.color}`} />
              </div>
            </div>

            <h3 className="text-sm font-medium text-zinc-400 mb-2">
              {card.label}
            </h3>

            <p className="text-3xl font-bold text-white mb-1">{card.value}</p>

            <p className="text-xs text-zinc-500">{card.subtitle}</p>
          </div>
        );
      })}
    </div>
  );
}

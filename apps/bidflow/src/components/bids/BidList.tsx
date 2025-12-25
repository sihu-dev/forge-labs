/**
 * Bid List Component
 * 입찰 공고 목록 테이블
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  BuildingOfficeIcon,
  CalendarIcon,
  BanknotesIcon,
  CheckBadgeIcon,
  SparklesIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

interface Bid {
  id: string;
  title: string;
  organization: string;
  announcement_number?: string;
  budget?: number;
  currency?: string;
  deadline?: string;
  announcement_date?: string;
  category?: string;
  type?: string;
  status: string;
  matched: boolean;
  source: string;
  match_score: number;
  matched_keywords?: string[];
  leads_generated: number;
  created_at: string;
}

interface BidListProps {
  bids: Bid[];
}

export function BidList({ bids }: BidListProps) {
  const [selectedBids, setSelectedBids] = useState<string[]>([]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'expired':
        return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
      case 'awarded':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'cancelled':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      active: '활성',
      expired: '마감',
      awarded: '낙찰',
      cancelled: '취소',
    };
    return labels[status] || status;
  };

  const getSourceLabel = (source: string) => {
    const labels: Record<string, string> = {
      g2b: '나라장터',
      ungm: 'UNGM',
      dgmarket: 'DG Market',
      manual: '수동',
    };
    return labels[source] || source;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-blue-400';
    if (score >= 40) return 'text-amber-400';
    return 'text-zinc-400';
  };

  const isExpiringSoon = (deadline?: string) => {
    if (!deadline) return false;
    const daysUntilDeadline = Math.ceil(
      (new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilDeadline > 0 && daysUntilDeadline <= 7;
  };

  if (bids.length === 0) {
    return (
      <div className="bg-[#111113] border border-white/[0.06] rounded-lg p-12 text-center">
        <DocumentTextIcon className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">
          입찰 공고가 없습니다
        </h3>
        <p className="text-sm text-zinc-400 mb-6">
          크롤링을 실행하거나 수동으로 공고를 추가해보세요
        </p>
        <Link
          href="/dashboard/bids/new"
          className="inline-flex items-center gap-2 h-10 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm font-medium transition-colors"
        >
          수동 추가
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#111113] border border-white/[0.06] rounded-lg overflow-hidden">
      {/* 헤더 */}
      <div className="px-6 py-4 border-b border-white/[0.06]">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-medium text-white">
            전체 공고 ({bids.length})
          </h3>

          {selectedBids.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-400">
                {selectedBids.length}개 선택
              </span>
              <button className="h-8 px-3 border border-white/[0.06] hover:bg-white/[0.04] text-zinc-300 rounded text-xs transition-colors">
                리드 생성
              </button>
              <button className="h-8 px-3 border border-red-500/[0.2] hover:bg-red-500/[0.1] text-red-400 rounded text-xs transition-colors">
                삭제
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 테이블 */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-white/[0.12] bg-white/[0.04]"
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedBids(bids.map((b) => b.id));
                    } else {
                      setSelectedBids([]);
                    }
                  }}
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                공고
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                예산
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                마감일
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                매칭
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                리드
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                상태
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {bids.map((bid) => (
              <tr
                key={bid.id}
                className="hover:bg-white/[0.02] transition-colors"
              >
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-white/[0.12] bg-white/[0.04]"
                    checked={selectedBids.includes(bid.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedBids([...selectedBids, bid.id]);
                      } else {
                        setSelectedBids(
                          selectedBids.filter((id) => id !== bid.id)
                        );
                      }
                    }}
                  />
                </td>

                {/* 공고 */}
                <td className="px-6 py-4">
                  <Link href={`/dashboard/bids/${bid.id}`}>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-white truncate max-w-md">
                          {bid.title}
                        </p>
                        {bid.matched && (
                          <CheckBadgeIcon className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <BuildingOfficeIcon className="w-3 h-3 text-zinc-500" />
                          <span className="text-xs text-zinc-400">
                            {bid.organization}
                          </span>
                        </div>
                        {bid.announcement_number && (
                          <span className="text-xs text-zinc-500">
                            {bid.announcement_number}
                          </span>
                        )}
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs text-zinc-400 bg-white/[0.04]">
                          {getSourceLabel(bid.source)}
                        </span>
                      </div>
                    </div>
                  </Link>
                </td>

                {/* 예산 */}
                <td className="px-6 py-4">
                  {bid.budget ? (
                    <div className="flex items-center gap-1">
                      <BanknotesIcon className="w-4 h-4 text-zinc-500" />
                      <span className="text-sm text-white">
                        {bid.budget.toLocaleString()}
                      </span>
                      <span className="text-xs text-zinc-500">
                        {bid.currency || 'KRW'}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-zinc-500">미정</span>
                  )}
                </td>

                {/* 마감일 */}
                <td className="px-6 py-4">
                  {bid.deadline ? (
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        <CalendarIcon className="w-4 h-4 text-zinc-500" />
                        <span className="text-sm text-white">
                          {new Date(bid.deadline).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                      {isExpiringSoon(bid.deadline) && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20">
                          임박
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-zinc-500">미정</span>
                  )}
                </td>

                {/* 매칭 */}
                <td className="px-6 py-4">
                  {bid.matched ? (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex-1 max-w-[100px]">
                          <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full"
                              style={{ width: `${bid.match_score}%` }}
                            ></div>
                          </div>
                        </div>
                        <span
                          className={`text-sm font-medium ${getScoreColor(bid.match_score)}`}
                        >
                          {bid.match_score}
                        </span>
                      </div>
                      {bid.matched_keywords && bid.matched_keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {bid.matched_keywords.slice(0, 3).map((keyword) => (
                            <span
                              key={keyword}
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                            >
                              {keyword}
                            </span>
                          ))}
                          {bid.matched_keywords.length > 3 && (
                            <span className="text-xs text-zinc-500">
                              +{bid.matched_keywords.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-zinc-500">미매칭</span>
                  )}
                </td>

                {/* 리드 */}
                <td className="px-6 py-4">
                  {bid.leads_generated > 0 ? (
                    <div className="flex items-center gap-1">
                      <UserGroupIcon className="w-4 h-4 text-blue-400" />
                      <span className="text-sm font-medium text-blue-400">
                        {bid.leads_generated}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-zinc-500">0</span>
                  )}
                </td>

                {/* 상태 */}
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(bid.status)}`}
                  >
                    {getStatusLabel(bid.status)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DocumentTextIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
      />
    </svg>
  );
}

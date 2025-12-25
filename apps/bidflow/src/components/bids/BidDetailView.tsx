/**
 * Bid Detail View
 * 입찰 공고 상세 정보 표시
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  BanknotesIcon,
  DocumentTextIcon,
  CheckBadgeIcon,
  SparklesIcon,
  ClockIcon,
  UserGroupIcon,
  GlobeAltIcon,
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
  method?: string;
  status: string;
  matched: boolean;
  source: string;
  source_url?: string;
  description?: string;
  requirements?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  match_score: number;
  matched_keywords?: string[];
  leads_generated: number;
  metadata?: any;
  created_at: string;
}

interface Activity {
  id: string;
  type: string;
  description: string;
  metadata?: any;
  created_at: string;
}

interface Lead {
  id: string;
  name: string;
  email: string;
  score: number;
  status: string;
  created_at: string;
}

interface BidDetailViewProps {
  bid: Bid;
  activities: Activity[];
  leads: Lead[];
  userId: string;
}

export function BidDetailView({
  bid,
  activities,
  leads,
  userId,
}: BidDetailViewProps) {
  const [isGeneratingLeads, setIsGeneratingLeads] = useState(false);

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
      manual: '수동 추가',
    };
    return labels[source] || source;
  };

  const handleGenerateLeads = async () => {
    setIsGeneratingLeads(true);
    try {
      const response = await fetch('/api/v1/leads/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bidId: bid.id,
          organization: bid.organization,
        }),
      });

      if (response.ok) {
        window.location.reload();
      } else {
        alert('리드 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to generate leads:', error);
      alert('리드 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGeneratingLeads(false);
    }
  };

  return (
    <div className="min-h-screen bg-black p-6">
      {/* 헤더 */}
      <div className="mb-6">
        <Link
          href="/dashboard/bids"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-4"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          <span className="text-sm">입찰 목록으로</span>
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-white">{bid.title}</h1>
              {bid.matched && (
                <CheckBadgeIcon className="w-6 h-6 text-emerald-400" />
              )}
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(bid.status)}`}
              >
                {getStatusLabel(bid.status)}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <BuildingOfficeIcon className="w-4 h-4 text-zinc-500" />
                <span className="text-sm text-zinc-400">{bid.organization}</span>
              </div>
              {bid.announcement_number && (
                <span className="text-sm text-zinc-500">
                  {bid.announcement_number}
                </span>
              )}
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs text-zinc-400 bg-white/[0.04]">
                {getSourceLabel(bid.source)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {bid.matched && bid.status === 'active' && (
              <button
                onClick={handleGenerateLeads}
                disabled={isGeneratingLeads}
                className="h-10 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm font-medium transition-colors disabled:opacity-50"
              >
                {isGeneratingLeads ? '생성 중...' : '리드 생성'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 메인 정보 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 기본 정보 */}
          <div className="bg-[#111113] border border-white/[0.06] rounded-lg p-6">
            <h2 className="text-base font-medium text-white mb-4">기본 정보</h2>

            <div className="grid grid-cols-2 gap-4">
              {/* 예산 */}
              {bid.budget && (
                <div>
                  <p className="text-xs text-zinc-400 mb-1">예산</p>
                  <div className="flex items-center gap-2">
                    <BanknotesIcon className="w-5 h-5 text-zinc-500" />
                    <span className="text-sm text-white font-medium">
                      {bid.budget.toLocaleString()} {bid.currency || 'KRW'}
                    </span>
                  </div>
                </div>
              )}

              {/* 마감일 */}
              {bid.deadline && (
                <div>
                  <p className="text-xs text-zinc-400 mb-1">마감일</p>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-zinc-500" />
                    <span className="text-sm text-white">
                      {new Date(bid.deadline).toLocaleString('ko-KR')}
                    </span>
                  </div>
                </div>
              )}

              {/* 공고일 */}
              {bid.announcement_date && (
                <div>
                  <p className="text-xs text-zinc-400 mb-1">공고일</p>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-zinc-500" />
                    <span className="text-sm text-white">
                      {new Date(bid.announcement_date).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                </div>
              )}

              {/* 카테고리 */}
              {bid.category && (
                <div>
                  <p className="text-xs text-zinc-400 mb-1">카테고리</p>
                  <span className="text-sm text-white">{bid.category}</span>
                </div>
              )}

              {/* 입찰 방식 */}
              {bid.method && (
                <div>
                  <p className="text-xs text-zinc-400 mb-1">입찰 방식</p>
                  <span className="text-sm text-white">{bid.method}</span>
                </div>
              )}

              {/* 출처 URL */}
              {bid.source_url && (
                <div className="col-span-2">
                  <p className="text-xs text-zinc-400 mb-1">출처</p>
                  <a
                    href={bid.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-blue-400 hover:underline"
                  >
                    <GlobeAltIcon className="w-4 h-4" />
                    원본 공고 보기
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* 설명 */}
          {bid.description && (
            <div className="bg-[#111113] border border-white/[0.06] rounded-lg p-6">
              <h2 className="text-base font-medium text-white mb-4">공고 내용</h2>
              <p className="text-sm text-zinc-300 whitespace-pre-wrap">
                {bid.description}
              </p>
            </div>
          )}

          {/* 요구사항 */}
          {bid.requirements && (
            <div className="bg-[#111113] border border-white/[0.06] rounded-lg p-6">
              <h2 className="text-base font-medium text-white mb-4">요구사항</h2>
              <p className="text-sm text-zinc-300 whitespace-pre-wrap">
                {bid.requirements}
              </p>
            </div>
          )}

          {/* 생성된 리드 */}
          {leads.length > 0 && (
            <div className="bg-[#111113] border border-white/[0.06] rounded-lg">
              <div className="px-6 py-4 border-b border-white/[0.06]">
                <h2 className="text-base font-medium text-white">
                  생성된 리드 ({leads.length})
                </h2>
              </div>

              <div className="divide-y divide-white/[0.06]">
                {leads.map((lead) => (
                  <Link
                    key={lead.id}
                    href={`/dashboard/leads/${lead.id}`}
                    className="block px-6 py-4 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white mb-1">
                          {lead.name}
                        </p>
                        <p className="text-xs text-zinc-400">{lead.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-blue-400 mb-1">
                          스코어 {lead.score}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {new Date(lead.created_at).toLocaleDateString('ko-KR')}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 사이드바 */}
        <div className="space-y-6">
          {/* 매칭 정보 */}
          {bid.matched && (
            <div className="bg-[#111113] border border-white/[0.06] rounded-lg p-6">
              <h2 className="text-base font-medium text-white mb-4">매칭 정보</h2>

              <div className="mb-4">
                <p className="text-xs text-zinc-400 mb-2">매칭 스코어</p>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 h-2 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full"
                      style={{ width: `${bid.match_score}%` }}
                    />
                  </div>
                  <span className="text-lg font-bold text-emerald-400">
                    {bid.match_score}
                  </span>
                </div>
              </div>

              {bid.matched_keywords && bid.matched_keywords.length > 0 && (
                <div>
                  <p className="text-xs text-zinc-400 mb-3">매칭 키워드</p>
                  <div className="flex flex-wrap gap-2">
                    {bid.matched_keywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs text-emerald-400"
                      >
                        <SparklesIcon className="w-3.5 h-3.5" />
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 연락처 */}
          {(bid.contact_name || bid.contact_email || bid.contact_phone) && (
            <div className="bg-[#111113] border border-white/[0.06] rounded-lg p-6">
              <h2 className="text-base font-medium text-white mb-4">담당자</h2>
              <div className="space-y-3">
                {bid.contact_name && (
                  <div>
                    <p className="text-xs text-zinc-400 mb-1">이름</p>
                    <p className="text-sm text-white">{bid.contact_name}</p>
                  </div>
                )}
                {bid.contact_email && (
                  <div>
                    <p className="text-xs text-zinc-400 mb-1">이메일</p>
                    <a
                      href={`mailto:${bid.contact_email}`}
                      className="text-sm text-blue-400 hover:underline"
                    >
                      {bid.contact_email}
                    </a>
                  </div>
                )}
                {bid.contact_phone && (
                  <div>
                    <p className="text-xs text-zinc-400 mb-1">전화번호</p>
                    <a
                      href={`tel:${bid.contact_phone}`}
                      className="text-sm text-white"
                    >
                      {bid.contact_phone}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 통계 */}
          <div className="bg-[#111113] border border-white/[0.06] rounded-lg p-6">
            <h2 className="text-base font-medium text-white mb-4">통계</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">생성된 리드</span>
                <span className="text-sm font-medium text-white">
                  {bid.leads_generated}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">등록일</span>
                <span className="text-sm text-white">
                  {new Date(bid.created_at).toLocaleDateString('ko-KR')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

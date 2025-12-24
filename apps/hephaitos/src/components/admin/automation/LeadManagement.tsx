'use client';

/**
 * LeadManagement - 리드 관리 대시보드
 * 리드 목록, 필터링, 스코어링, 활동 추적
 */

import { useState, useEffect } from 'react';

type LeadStatus = 'new' | 'enriching' | 'enriched' | 'qualified' | 'contacted' | 'meeting' | 'proposal' | 'negotiation' | 'won' | 'lost' | 'disqualified';
type LeadTier = 'hot' | 'warm' | 'cold';
type LeadSource = 'bidflow' | 'hephaitos' | 'persana' | 'apollo' | 'linkedin' | 'website' | 'referral' | 'manual';

interface Lead {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  companyName: string;
  companyDomain?: string;
  title?: string;
  source: LeadSource;
  status: LeadStatus;
  tier: LeadTier;
  score: number;
  tags: string[];
  lastActivityAt?: string;
  createdAt: string;
}

const statusConfig: Record<LeadStatus, { label: string; color: string }> = {
  new: { label: '신규', color: 'bg-blue-500/20 text-blue-400' },
  enriching: { label: '강화중', color: 'bg-purple-500/20 text-purple-400' },
  enriched: { label: '강화됨', color: 'bg-indigo-500/20 text-indigo-400' },
  qualified: { label: '검증됨', color: 'bg-cyan-500/20 text-cyan-400' },
  contacted: { label: '연락됨', color: 'bg-yellow-500/20 text-yellow-400' },
  meeting: { label: '미팅', color: 'bg-orange-500/20 text-orange-400' },
  proposal: { label: '제안', color: 'bg-pink-500/20 text-pink-400' },
  negotiation: { label: '협상', color: 'bg-rose-500/20 text-rose-400' },
  won: { label: '성공', color: 'bg-green-500/20 text-green-400' },
  lost: { label: '실패', color: 'bg-red-500/20 text-red-400' },
  disqualified: { label: '부적합', color: 'bg-gray-500/20 text-gray-400' },
};

const tierConfig: Record<LeadTier, { label: string; color: string }> = {
  hot: { label: 'HOT', color: 'bg-red-500 text-white' },
  warm: { label: 'WARM', color: 'bg-orange-500 text-white' },
  cold: { label: 'COLD', color: 'bg-blue-500 text-white' },
};

const sourceConfig: Record<LeadSource, { label: string; icon: string }> = {
  bidflow: { label: 'BIDFLOW', icon: '🎯' },
  hephaitos: { label: 'HEPHAITOS', icon: '🔥' },
  persana: { label: 'Persana', icon: '🤖' },
  apollo: { label: 'Apollo', icon: '🚀' },
  linkedin: { label: 'LinkedIn', icon: '💼' },
  website: { label: '웹사이트', icon: '🌐' },
  referral: { label: '추천', icon: '🤝' },
  manual: { label: '수동', icon: '✏️' },
};

export function LeadManagement() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [filters, setFilters] = useState({
    status: 'all' as 'all' | LeadStatus,
    tier: 'all' as 'all' | LeadTier,
    source: 'all' as 'all' | LeadSource,
    search: '',
  });

  useEffect(() => {
    fetchLeads();
  }, [filters]);

  async function fetchLeads() {
    try {
      setIsLoading(true);
      // TODO: API 연결
      // const response = await fetch('/api/admin/automation/leads', { params: filters });
      // const data = await response.json();
      // setLeads(data);

      // 임시 데모 데이터
      setLeads([
        {
          id: '1',
          email: 'kim@techstartup.kr',
          firstName: '철수',
          lastName: '김',
          companyName: '테크스타트업',
          companyDomain: 'techstartup.kr',
          title: 'CEO',
          source: 'bidflow',
          status: 'qualified',
          tier: 'hot',
          score: 92,
          tags: ['SME', '제조업', 'KOICA'],
          lastActivityAt: new Date(Date.now() - 3600000).toISOString(),
          createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        },
        {
          id: '2',
          email: 'lee@abcmfg.com',
          firstName: '영희',
          lastName: '이',
          companyName: 'ABC제조',
          companyDomain: 'abcmfg.com',
          title: '해외영업팀장',
          source: 'hephaitos',
          status: 'contacted',
          tier: 'warm',
          score: 78,
          tags: ['중견기업', '수출업'],
          lastActivityAt: new Date(Date.now() - 7200000).toISOString(),
          createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
        },
        {
          id: '3',
          email: 'park@globaltrade.co.kr',
          firstName: '민수',
          lastName: '박',
          companyName: '글로벌무역',
          companyDomain: 'globaltrade.co.kr',
          title: '대표이사',
          source: 'apollo',
          status: 'meeting',
          tier: 'hot',
          score: 88,
          tags: ['무역', '중소기업'],
          lastActivityAt: new Date(Date.now() - 1800000).toISOString(),
          createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        },
        {
          id: '4',
          email: 'choi@kengineering.kr',
          firstName: '지훈',
          lastName: '최',
          companyName: 'K엔지니어링',
          companyDomain: 'kengineering.kr',
          title: '사업개발팀장',
          source: 'persana',
          status: 'new',
          tier: 'warm',
          score: 65,
          tags: ['엔지니어링', 'ODA'],
          lastActivityAt: undefined,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: '5',
          email: 'jung@innovsol.com',
          firstName: '수진',
          lastName: '정',
          companyName: '혁신솔루션',
          companyDomain: 'innovsol.com',
          title: 'COO',
          source: 'linkedin',
          status: 'proposal',
          tier: 'hot',
          score: 95,
          tags: ['IT', '스타트업', '시리즈A'],
          lastActivityAt: new Date(Date.now() - 900000).toISOString(),
          createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
        },
      ]);
    } catch (error) {
      console.error('Failed to fetch leads:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const filteredLeads = leads.filter((lead) => {
    if (filters.status !== 'all' && lead.status !== filters.status) return false;
    if (filters.tier !== 'all' && lead.tier !== filters.tier) return false;
    if (filters.source !== 'all' && lead.source !== filters.source) return false;
    if (filters.search) {
      const search = filters.search.toLowerCase();
      return (
        lead.email.toLowerCase().includes(search) ||
        lead.companyName.toLowerCase().includes(search) ||
        `${lead.firstName} ${lead.lastName}`.toLowerCase().includes(search)
      );
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">리드 관리</h1>
          <p className="text-white/60 mt-1">총 {leads.length}개의 리드</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-white/80 transition-colors">
            리드 가져오기
          </button>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm text-white transition-colors">
            + 리드 추가
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <input
          type="text"
          placeholder="검색..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-blue-500"
        />
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
          className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
        >
          <option value="all">모든 상태</option>
          {Object.entries(statusConfig).map(([key, config]) => (
            <option key={key} value={key}>{config.label}</option>
          ))}
        </select>
        <select
          value={filters.tier}
          onChange={(e) => setFilters({ ...filters, tier: e.target.value as any })}
          className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
        >
          <option value="all">모든 등급</option>
          {Object.entries(tierConfig).map(([key, config]) => (
            <option key={key} value={key}>{config.label}</option>
          ))}
        </select>
        <select
          value={filters.source}
          onChange={(e) => setFilters({ ...filters, source: e.target.value as any })}
          className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
        >
          <option value="all">모든 소스</option>
          {Object.entries(sourceConfig).map(([key, config]) => (
            <option key={key} value={key}>{config.label}</option>
          ))}
        </select>
      </div>

      {/* Lead Table */}
      <div className="bg-white/3 border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-white/5">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">리드</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">회사</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">소스</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">상태</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">등급</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">스코어</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">최근 활동</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-white/40">
                  로딩 중...
                </td>
              </tr>
            ) : filteredLeads.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-white/40">
                  리드가 없습니다
                </td>
              </tr>
            ) : (
              filteredLeads.map((lead) => (
                <tr
                  key={lead.id}
                  className="hover:bg-white/5 cursor-pointer transition-colors"
                  onClick={() => setSelectedLead(lead)}
                >
                  <td className="px-4 py-4">
                    <div>
                      <div className="text-sm font-medium text-white">
                        {lead.lastName}{lead.firstName}
                      </div>
                      <div className="text-xs text-white/40">{lead.email}</div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div>
                      <div className="text-sm text-white">{lead.companyName}</div>
                      <div className="text-xs text-white/40">{lead.title}</div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="flex items-center gap-1 text-sm text-white/80">
                      {sourceConfig[lead.source].icon} {sourceConfig[lead.source].label}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 rounded text-xs ${statusConfig[lead.status].color}`}>
                      {statusConfig[lead.status].label}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${tierConfig[lead.tier].color}`}>
                      {tierConfig[lead.tier].label}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            lead.score >= 80 ? 'bg-green-500' : lead.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${lead.score}%` }}
                        />
                      </div>
                      <span className="text-sm text-white">{lead.score}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-xs text-white/40">
                    {lead.lastActivityAt
                      ? formatRelativeTime(new Date(lead.lastActivityAt))
                      : '-'}
                  </td>
                  <td className="px-4 py-4">
                    <button className="p-1 hover:bg-white/10 rounded transition-colors">
                      <MoreIcon className="w-4 h-4 text-white/40" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Lead Detail Modal */}
      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
        />
      )}
    </div>
  );
}

function LeadDetailModal({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#1a1a1d] border border-white/10 rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <h2 className="text-lg font-semibold text-white">
              {lead.lastName}{lead.firstName}
            </h2>
            <p className="text-sm text-white/60">{lead.companyName} · {lead.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <CloseIcon className="w-5 h-5 text-white/60" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)] space-y-6">
          {/* Lead Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-white/40">이메일</label>
              <p className="text-sm text-white">{lead.email}</p>
            </div>
            <div>
              <label className="text-xs text-white/40">도메인</label>
              <p className="text-sm text-white">{lead.companyDomain || '-'}</p>
            </div>
            <div>
              <label className="text-xs text-white/40">소스</label>
              <p className="text-sm text-white flex items-center gap-1">
                {sourceConfig[lead.source].icon} {sourceConfig[lead.source].label}
              </p>
            </div>
            <div>
              <label className="text-xs text-white/40">생성일</label>
              <p className="text-sm text-white">{new Date(lead.createdAt).toLocaleDateString('ko-KR')}</p>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="text-xs text-white/40">태그</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {lead.tags.map((tag) => (
                <span key={tag} className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs text-white/80">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Score Breakdown */}
          <div>
            <label className="text-xs text-white/40">스코어 상세</label>
            <div className="mt-2 space-y-2">
              <ScoreBar label="구매력" value={28} max={30} />
              <ScoreBar label="적합도" value={25} max={30} />
              <ScoreBar label="긴급성" value={18} max={20} />
              <ScoreBar label="접근성" value={16} max={20} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-white/10">
            <button className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm text-white transition-colors">
              이메일 보내기
            </button>
            <button className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-white/80 transition-colors">
              시퀀스 추가
            </button>
            <button className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-white/80 transition-colors">
              데이터 강화
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScoreBar({ label, value, max }: { label: string; value: number; max: number }) {
  const percentage = (value / max) * 100;
  return (
    <div className="flex items-center gap-3">
      <span className="w-16 text-xs text-white/60">{label}</span>
      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="w-12 text-xs text-white/60 text-right">{value}/{max}</span>
    </div>
  );
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  return `${days}일 전`;
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

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

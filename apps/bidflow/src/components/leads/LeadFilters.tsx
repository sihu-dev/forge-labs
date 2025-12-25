/**
 * Lead Filters Component
 * 리드 필터링 UI
 */

'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { MagnifyingGlassIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';

export function LeadFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentStatus = searchParams.get('status') || 'all';
  const currentMinScore = searchParams.get('minScore') || '0';
  const currentSearch = searchParams.get('search') || '';

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value && value !== 'all' && value !== '0') {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    router.push(`/dashboard/leads?${params.toString()}`);
  };

  const statuses = [
    { value: 'all', label: '전체' },
    { value: 'new', label: '신규' },
    { value: 'contacted', label: '접촉' },
    { value: 'qualified', label: '적격' },
    { value: 'converted', label: '전환' },
    { value: 'lost', label: '손실' },
  ];

  const scoreRanges = [
    { value: '0', label: '전체 스코어' },
    { value: '40', label: '40점 이상' },
    { value: '60', label: '60점 이상' },
    { value: '80', label: '80점 이상' },
  ];

  return (
    <div className="bg-[#111113] border border-white/[0.06] rounded-lg p-4">
      <div className="flex items-center gap-4">
        {/* 검색 */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="이름, 이메일, 조직명 검색..."
              defaultValue={currentSearch}
              onChange={(e) => {
                const value = e.target.value;
                const timer = setTimeout(() => {
                  updateFilter('search', value);
                }, 500);
                return () => clearTimeout(timer);
              }}
              className="w-full h-10 pl-10 pr-4 bg-white/[0.04] border border-white/[0.06] rounded text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/[0.12] transition-colors"
            />
          </div>
        </div>

        {/* 상태 필터 */}
        <div className="flex items-center gap-2">
          <AdjustmentsHorizontalIcon className="w-4 h-4 text-zinc-500" />
          <select
            value={currentStatus}
            onChange={(e) => updateFilter('status', e.target.value)}
            className="h-10 px-3 bg-white/[0.04] border border-white/[0.06] rounded text-sm text-white focus:outline-none focus:border-white/[0.12] transition-colors"
          >
            {statuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        {/* 스코어 필터 */}
        <div className="flex items-center gap-2">
          <select
            value={currentMinScore}
            onChange={(e) => updateFilter('minScore', e.target.value)}
            className="h-10 px-3 bg-white/[0.04] border border-white/[0.06] rounded text-sm text-white focus:outline-none focus:border-white/[0.12] transition-colors"
          >
            {scoreRanges.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
        </div>

        {/* 초기화 */}
        {(currentStatus !== 'all' || currentMinScore !== '0' || currentSearch) && (
          <button
            onClick={() => router.push('/dashboard/leads')}
            className="h-10 px-4 border border-white/[0.06] hover:bg-white/[0.04] text-zinc-300 rounded text-sm transition-colors"
          >
            초기화
          </button>
        )}
      </div>
    </div>
  );
}

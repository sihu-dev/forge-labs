/**
 * Matching Performance
 * 매칭 성과 지표
 */

'use client';

import { SparklesIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface MatchingPerformanceProps {
  matched: number;
  total: number;
  avgScore: number;
}

export function MatchingPerformance({
  matched,
  total,
  avgScore,
}: MatchingPerformanceProps) {
  const matchRate = total > 0 ? Math.round((matched / total) * 100) : 0;
  const unmatched = total - matched;

  return (
    <div className="bg-[#111113] border border-white/[0.06] rounded-lg overflow-hidden">
      {/* 헤더 */}
      <div className="px-6 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <SparklesIcon className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="text-base font-medium text-white">매칭 성과</h3>
            <p className="text-xs text-zinc-400 mt-0.5">키워드 매칭 분석</p>
          </div>
        </div>
      </div>

      {/* 콘텐츠 */}
      <div className="p-6">
        {/* 매칭률 원형 진행률 */}
        <div className="flex items-center justify-center mb-8">
          <div className="relative w-48 h-48">
            {/* 배경 원 */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="96"
                cy="96"
                r="80"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="16"
                fill="none"
              />
              <circle
                cx="96"
                cy="96"
                r="80"
                stroke="url(#gradient)"
                strokeWidth="16"
                fill="none"
                strokeDasharray={`${(matchRate / 100) * 502.4} 502.4`}
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
            </svg>

            {/* 중앙 텍스트 */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-4xl font-bold text-white mb-1">{matchRate}%</p>
              <p className="text-sm text-zinc-400">매칭률</p>
            </div>
          </div>
        </div>

        {/* 통계 */}
        <div className="space-y-4">
          {/* 매칭됨 */}
          <div className="flex items-center justify-between p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center">
                <CheckCircleIcon className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-400">매칭됨</p>
                <p className="text-lg font-bold text-emerald-400">
                  {matched.toLocaleString()}개
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-zinc-500">평균 스코어</p>
              <p className="text-xl font-bold text-white">{avgScore}</p>
            </div>
          </div>

          {/* 미매칭 */}
          <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/[0.06] rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/[0.04] border border-white/[0.06] rounded-lg flex items-center justify-center">
                <XCircleIcon className="w-6 h-6 text-zinc-500" />
              </div>
              <div>
                <p className="text-sm text-zinc-400">미매칭</p>
                <p className="text-lg font-bold text-zinc-400">
                  {unmatched.toLocaleString()}개
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 개선 제안 */}
        {matchRate < 50 && (
          <div className="mt-6 p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg">
            <p className="text-xs text-amber-400 mb-2">💡 개선 제안</p>
            <p className="text-sm text-zinc-300">
              매칭률이 낮습니다. 키워드를 추가하여 더 많은 공고를 매칭해보세요.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

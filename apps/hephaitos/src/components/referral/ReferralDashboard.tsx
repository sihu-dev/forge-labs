/**
 * Referral Dashboard Component
 * 추천 현황 대시보드
 */

'use client';

import { useState, useEffect } from 'react';
import {
  ClipboardDocumentIcon,
  CheckIcon,
  UsersIcon,
  GiftIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';

interface ReferralStats {
  code: string;
  totalReferrals: number;
  successfulReferrals: number;
  totalRewardsEarned: number;
  currentMultiplier: number;
  nextThreshold?: {
    count: number;
    multiplier: number;
  };
}

export function ReferralDashboard() {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/referral/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch referral stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyCode = async () => {
    if (!stats) return;

    await navigator.clipboard.writeText(stats.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = stats
    ? `${window.location.origin}/signup?ref=${stats.code}`
    : '';

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-24 bg-white/[0.04] rounded-lg" />
        <div className="h-32 bg-white/[0.04] rounded-lg" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6 bg-white/[0.02] border border-white/[0.06] rounded-lg text-center">
        <p className="text-zinc-400">추천 정보를 불러올 수 없습니다</p>
      </div>
    );
  }

  const progressToNext = stats.nextThreshold
    ? (stats.successfulReferrals / stats.nextThreshold.count) * 100
    : 100;

  return (
    <div className="space-y-4">
      {/* Referral Code Card */}
      <div className="p-5 bg-gradient-to-br from-[#5E6AD2]/10 to-[#5E6AD2]/5 border border-[#5E6AD2]/20 rounded-lg">
        <p className="text-xs text-zinc-400 mb-2">내 추천 코드</p>
        <div className="flex items-center gap-3">
          <code className="text-2xl font-mono font-bold text-white tracking-wider">
            {stats.code}
          </code>
          <button
            onClick={copyCode}
            className="p-2 hover:bg-white/[0.06] rounded-lg transition-colors"
            title="복사"
          >
            {copied ? (
              <CheckIcon className="w-5 h-5 text-emerald-400" />
            ) : (
              <ClipboardDocumentIcon className="w-5 h-5 text-zinc-400" />
            )}
          </button>
        </div>
        <p className="mt-3 text-xs text-zinc-500">
          친구가 이 코드로 가입하면 서로 크레딧을 받습니다
        </p>

        {/* Share Link */}
        <div className="mt-4 p-3 bg-black/20 rounded-lg">
          <p className="text-xs text-zinc-500 mb-1">공유 링크</p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={shareLink}
              readOnly
              className="flex-1 bg-transparent text-xs text-zinc-300 outline-none"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(shareLink);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="text-xs text-[#7C8AEA] hover:text-[#9AA5EF] transition-colors"
            >
              복사
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-lg">
          <UsersIcon className="w-5 h-5 text-zinc-400 mb-2" />
          <p className="text-2xl font-bold text-white">{stats.successfulReferrals}</p>
          <p className="text-xs text-zinc-500">성공한 추천</p>
        </div>

        <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-lg">
          <GiftIcon className="w-5 h-5 text-emerald-400 mb-2" />
          <p className="text-2xl font-bold text-emerald-400">
            {stats.totalRewardsEarned.toLocaleString()}
          </p>
          <p className="text-xs text-zinc-500">획득 크레딧</p>
        </div>

        <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-lg">
          <ArrowTrendingUpIcon className="w-5 h-5 text-amber-400 mb-2" />
          <p className="text-2xl font-bold text-amber-400">x{stats.currentMultiplier}</p>
          <p className="text-xs text-zinc-500">보상 배율</p>
        </div>
      </div>

      {/* Progress to Next Tier */}
      {stats.nextThreshold && (
        <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-zinc-400">다음 보상 등급까지</p>
            <p className="text-xs text-zinc-500">
              {stats.successfulReferrals} / {stats.nextThreshold.count}명
            </p>
          </div>
          <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#5E6AD2] to-[#7C8AEA] transition-all"
              style={{ width: `${Math.min(progressToNext, 100)}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            {stats.nextThreshold.count - stats.successfulReferrals}명 더 추천하면
            <span className="text-amber-400 font-medium">
              {' '}x{stats.nextThreshold.multiplier} 배율
            </span>
            로 업그레이드!
          </p>
        </div>
      )}

      {/* How It Works */}
      <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-lg">
        <h4 className="text-sm font-medium text-white mb-3">추천 보상 안내</h4>
        <ul className="space-y-2 text-xs text-zinc-400">
          <li className="flex items-start gap-2">
            <span className="text-emerald-400">•</span>
            친구가 가입하면: 나 100크레딧, 친구 50크레딧
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-400">•</span>
            10명 추천 시: 보상 1.5배 (150크레딧/추천)
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-400">•</span>
            25명 추천 시: 보상 2배 (200크레딧/추천)
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-400">•</span>
            50명 추천 시: 보상 2.5배 (250크레딧/추천)
          </li>
        </ul>
      </div>
    </div>
  );
}

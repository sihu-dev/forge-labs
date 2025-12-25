/**
 * Manual Bid Creation Page
 * 수동 입찰 추가 페이지
 */

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { BidCreateForm } from '@/components/bids/BidCreateForm';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default async function NewBidPage() {
  const supabase = await createClient();

  // 인증 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/auth/signin');
  }

  return (
    <div className="min-h-screen bg-black p-6">
      {/* 헤더 */}
      <div className="mb-8">
        <Link
          href="/dashboard/bids"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-4"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          <span className="text-sm">입찰 목록으로</span>
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-white mb-2">입찰 공고 수동 추가</h1>
          <p className="text-sm text-zinc-400">
            크롤링되지 않은 입찰 공고를 수동으로 등록하세요
          </p>
        </div>
      </div>

      {/* 폼 */}
      <BidCreateForm userId={user.id} />
    </div>
  );
}

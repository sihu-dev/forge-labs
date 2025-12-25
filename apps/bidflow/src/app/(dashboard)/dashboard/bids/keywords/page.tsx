/**
 * Keyword Manager Page
 * 키워드 관리 페이지
 */

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { KeywordManager } from '@/components/bids/KeywordManager';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default async function KeywordsPage() {
  const supabase = await createClient();

  // 인증 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/auth/signin');
  }

  // 키워드 조회
  const { data: keywords, error } = await supabase
    .from('bid_keywords')
    .select('*')
    .eq('user_id', user.id)
    .order('priority', { ascending: false });

  if (error) {
    console.error('Failed to fetch keywords:', error);
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
          <h1 className="text-2xl font-bold text-white mb-2">키워드 관리</h1>
          <p className="text-sm text-zinc-400">
            입찰 공고 매칭을 위한 키워드를 관리하세요
          </p>
        </div>
      </div>

      {/* 키워드 관리자 */}
      <KeywordManager keywords={keywords || []} userId={user.id} />
    </div>
  );
}

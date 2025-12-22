/**
 * HEPHAITOS - Strategy Builder Page
 * No-Code 전략 빌더 페이지
 */

'use client';

import { Suspense, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { StrategyBuilder } from '@/components/builder';
import type { Strategy } from '@/components/builder';

function BuilderContent() {
  const router = useRouter();

  // 저장 핸들러
  const handleSave = useCallback((strategy: Strategy) => {
    // TODO: Supabase에 저장
    console.log('저장:', strategy);
    alert('전략이 저장되었습니다.');
  }, []);

  // 백테스트 실행 핸들러
  const handleRunBacktest = useCallback((strategy: Strategy) => {
    // TODO: 백테스트 페이지로 이동
    console.log('백테스트 실행:', strategy);
    router.push(`/dashboard/backtest?strategyId=${strategy.id}`);
  }, [router]);

  return (
    <div className="h-[calc(100vh-4rem)]">
      <StrategyBuilder
        onSave={handleSave}
        onRunBacktest={handleRunBacktest}
        className="h-full"
      />
    </div>
  );
}

export default function StrategyBuilderPage() {
  return (
    <Suspense
      fallback={
        <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <BuilderContent />
    </Suspense>
  );
}

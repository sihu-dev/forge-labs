/**
 * 견적서 목록 페이지
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';

// 데모 데이터
const demoQuotes = [
  {
    id: '1',
    documentNumber: 'Q-2024-0001',
    title: '웹사이트 리뉴얼 프로젝트',
    totalAmount: 4400000,
    validUntil: '2024-12-31',
    status: 'approved',
    client: { name: '(주)테크스타트' },
    createdAt: '2024-12-01',
  },
  {
    id: '2',
    documentNumber: 'Q-2024-0002',
    title: 'UI/UX 디자인 용역',
    totalAmount: 2200000,
    validUntil: '2024-12-20',
    status: 'sent',
    client: { name: '디자인랩' },
    createdAt: '2024-12-10',
  },
  {
    id: '3',
    documentNumber: 'Q-2024-0003',
    title: '모바일 앱 개발',
    totalAmount: 8800000,
    validUntil: '2024-12-25',
    status: 'draft',
    client: { name: '스마트솔루션' },
    createdAt: '2024-12-15',
  },
];

type StatusFilter = 'all' | 'draft' | 'sent' | 'approved' | 'rejected';

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: '초안', color: 'bg-gray-100 text-gray-600' },
  sent: { label: '발송됨', color: 'bg-blue-100 text-blue-700' },
  viewed: { label: '열람됨', color: 'bg-yellow-100 text-yellow-700' },
  approved: { label: '승인됨', color: 'bg-green-100 text-green-700' },
  rejected: { label: '거절됨', color: 'bg-red-100 text-red-700' },
};

export default function QuotesPage() {
  const [filter, setFilter] = useState<StatusFilter>('all');

  const filteredQuotes = demoQuotes.filter(
    (q) => filter === 'all' || q.status === filter
  );

  const formatCurrency = (amount: number) => new Intl.NumberFormat('ko-KR').format(amount);
  const formatDate = (date: string) => new Date(date).toLocaleDateString('ko-KR');

  // 통계
  const stats = {
    total: demoQuotes.length,
    totalAmount: demoQuotes.reduce((sum, q) => sum + q.totalAmount, 0),
    approved: demoQuotes.filter((q) => q.status === 'approved').length,
  };

  return (
    <div className="p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">견적서 관리</h1>
          <p className="text-gray-500 mt-1">총 {filteredQuotes.length}건</p>
        </div>
        <Link
          href="/dashboard/quotes/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + 새 견적서
        </Link>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">총 견적</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}건</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">총 견적액</p>
          <p className="text-2xl font-bold text-blue-600">₩{formatCurrency(stats.totalAmount)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">승인된 견적</p>
          <p className="text-2xl font-bold text-green-600">{stats.approved}건</p>
        </div>
      </div>

      {/* 필터 */}
      <div className="flex gap-2 mb-6">
        {(['all', 'draft', 'sent', 'approved', 'rejected'] as StatusFilter[]).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === s
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s === 'all' ? '전체' : statusConfig[s]?.label || s}
          </button>
        ))}
      </div>

      {/* 목록 */}
      {filteredQuotes.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <span className="text-4xl mb-4 block">📋</span>
          <p className="text-gray-500 mb-4">견적서가 없습니다</p>
          <Link
            href="/dashboard/quotes/new"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            첫 견적서 작성하기
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredQuotes.map((quote) => (
            <Link
              key={quote.id}
              href={`/dashboard/quotes/${quote.id}` as never}
              className="block bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm text-gray-500">{quote.documentNumber}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusConfig[quote.status]?.color || 'bg-gray-100'}`}>
                      {statusConfig[quote.status]?.label || quote.status}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{quote.title}</h3>
                  <p className="text-sm text-gray-500">{quote.client.name}</p>
                  <p className="text-sm text-gray-400 mt-2">
                    유효기간: {formatDate(quote.validUntil)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-gray-900">
                    ₩{formatCurrency(quote.totalAmount)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatDate(quote.createdAt)} 작성
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

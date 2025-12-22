/**
 * 계약서 목록 페이지
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';

// 임시 데모 데이터
const demoContracts = [
  {
    id: '1',
    documentNumber: 'C-2024-0001',
    title: '웹사이트 리뉴얼 계약서',
    projectName: '웹사이트 리뉴얼',
    status: 'approved',
    totalAmount: 4400000,
    startDate: '2024-12-01',
    endDate: '2024-12-31',
    client: { name: '(주)테크스타트' },
    signedAt: '2024-12-01T10:00:00Z',
  },
  {
    id: '2',
    documentNumber: 'C-2024-0002',
    title: 'UI/UX 디자인 계약서',
    projectName: 'UI/UX 디자인',
    status: 'sent',
    totalAmount: 2200000,
    startDate: '2024-12-15',
    endDate: '2025-01-15',
    client: { name: '디자인랩' },
  },
];

type StatusFilter = 'all' | 'draft' | 'sent' | 'approved' | 'completed';

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: '초안', color: 'bg-gray-100 text-gray-600' },
  sent: { label: '서명 대기', color: 'bg-yellow-100 text-yellow-700' },
  approved: { label: '체결됨', color: 'bg-green-100 text-green-700' },
  completed: { label: '완료', color: 'bg-blue-100 text-blue-700' },
  cancelled: { label: '취소', color: 'bg-red-100 text-red-700' },
};

export default function ContractsPage() {
  const [filter, setFilter] = useState<StatusFilter>('all');

  const filteredContracts = demoContracts.filter(
    (c) => filter === 'all' || c.status === filter
  );

  const formatCurrency = (amount: number) => new Intl.NumberFormat('ko-KR').format(amount);
  const formatDate = (date: string) => new Date(date).toLocaleDateString('ko-KR');

  return (
    <div className="p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">계약서 관리</h1>
          <p className="text-gray-500 mt-1">총 {filteredContracts.length}건</p>
        </div>
      </div>

      {/* 필터 */}
      <div className="flex gap-2 mb-6">
        {(['all', 'draft', 'sent', 'approved', 'completed'] as StatusFilter[]).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === s
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s === 'all' ? '전체' : statusConfig[s]?.label || s}
          </button>
        ))}
      </div>

      {/* 목록 */}
      {filteredContracts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <span className="text-4xl mb-4 block">📝</span>
          <p className="text-gray-500">계약서가 없습니다</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredContracts.map((contract) => (
            <Link
              key={contract.id}
              href={`/dashboard/contracts/${contract.id}` as never}
              className="block bg-white rounded-xl border border-gray-200 p-5 hover:border-purple-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm text-gray-500">{contract.documentNumber}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusConfig[contract.status]?.color || 'bg-gray-100'}`}>
                      {statusConfig[contract.status]?.label || contract.status}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{contract.projectName}</h3>
                  <p className="text-sm text-gray-500">{contract.client.name}</p>
                  <p className="text-sm text-gray-400 mt-2">
                    {formatDate(contract.startDate)} ~ {formatDate(contract.endDate)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-gray-900">
                    ₩{formatCurrency(contract.totalAmount)}
                  </p>
                  {contract.signedAt && (
                    <p className="text-sm text-green-600 mt-1">
                      {formatDate(contract.signedAt)} 체결
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

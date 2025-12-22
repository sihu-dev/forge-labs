/**
 * 세금계산서 목록 페이지
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';

// 데모 데이터
const demoTaxInvoices = [
  {
    id: '1',
    documentNumber: '20241201-12345678',
    title: '웹사이트 리뉴얼 - 계약금',
    totalAmount: 1320000,
    issueDate: '2024-12-01',
    ntsStatus: 'approved',
    ntsApprovalNumber: '2024120112345678',
    client: { name: '(주)테크스타트' },
  },
  {
    id: '2',
    documentNumber: '20241215-87654321',
    title: 'UI/UX 디자인',
    totalAmount: 2200000,
    issueDate: '2024-12-15',
    ntsStatus: 'pending',
    client: { name: '디자인랩' },
  },
];

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: '초안', color: 'bg-gray-100 text-gray-600' },
  pending: { label: '전송 대기', color: 'bg-yellow-100 text-yellow-700' },
  submitted: { label: '전송됨', color: 'bg-blue-100 text-blue-700' },
  approved: { label: '승인', color: 'bg-green-100 text-green-700' },
  rejected: { label: '반려', color: 'bg-red-100 text-red-700' },
};

export default function TaxInvoicesPage() {
  const [filter, setFilter] = useState<StatusFilter>('all');

  const filteredTaxInvoices = demoTaxInvoices.filter(
    (t) => filter === 'all' || t.ntsStatus === filter
  );

  const formatCurrency = (amount: number) => new Intl.NumberFormat('ko-KR').format(amount);
  const formatDate = (date: string) => new Date(date).toLocaleDateString('ko-KR');

  // 이번 달 합계
  const thisMonthTotal = demoTaxInvoices.reduce((sum, t) => sum + t.totalAmount, 0);

  return (
    <div className="p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">세금계산서</h1>
          <p className="text-gray-500 mt-1">총 {filteredTaxInvoices.length}건</p>
        </div>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">이번 달 발행액</p>
          <p className="text-2xl font-bold text-gray-900">₩{formatCurrency(thisMonthTotal)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">국세청 승인</p>
          <p className="text-2xl font-bold text-green-600">
            {demoTaxInvoices.filter((t) => t.ntsStatus === 'approved').length}건
          </p>
        </div>
      </div>

      {/* 필터 */}
      <div className="flex gap-2 mb-6">
        {(['all', 'pending', 'approved', 'rejected'] as StatusFilter[]).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === s
                ? 'bg-teal-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s === 'all' ? '전체' : statusConfig[s]?.label || s}
          </button>
        ))}
      </div>

      {/* 목록 */}
      {filteredTaxInvoices.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <span className="text-4xl mb-4 block">🧾</span>
          <p className="text-gray-500">세금계산서가 없습니다</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTaxInvoices.map((taxInvoice) => (
            <Link
              key={taxInvoice.id}
              href={`/dashboard/tax-invoices/${taxInvoice.id}` as never}
              className="block bg-white rounded-xl border border-gray-200 p-5 hover:border-teal-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm text-gray-500 font-mono">{taxInvoice.documentNumber}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusConfig[taxInvoice.ntsStatus]?.color || 'bg-gray-100'}`}>
                      {statusConfig[taxInvoice.ntsStatus]?.label || taxInvoice.ntsStatus}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{taxInvoice.title}</h3>
                  <p className="text-sm text-gray-500">{taxInvoice.client.name}</p>
                  <p className="text-sm text-gray-400 mt-2">
                    발행일: {formatDate(taxInvoice.issueDate)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-gray-900">
                    ₩{formatCurrency(taxInvoice.totalAmount)}
                  </p>
                  {taxInvoice.ntsApprovalNumber && (
                    <p className="text-xs text-green-600 mt-1 font-mono">
                      승인번호: {taxInvoice.ntsApprovalNumber}
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

/**
 * 인보이스 목록 페이지
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';

// 임시 데모 데이터
const demoInvoices = [
  {
    id: '1',
    documentNumber: 'I-2024-0001',
    title: '웹사이트 리뉴얼 - 계약금',
    totalAmount: 1320000,
    dueDate: '2024-12-01',
    paymentStatus: 'paid',
    paidAt: '2024-12-01T14:00:00Z',
    client: { name: '(주)테크스타트' },
  },
  {
    id: '2',
    documentNumber: 'I-2024-0002',
    title: '웹사이트 리뉴얼 - 잔금',
    totalAmount: 3080000,
    dueDate: '2024-12-31',
    paymentStatus: 'pending',
    client: { name: '(주)테크스타트' },
  },
  {
    id: '3',
    documentNumber: 'I-2024-0003',
    title: 'UI/UX 디자인 - 계약금',
    totalAmount: 660000,
    dueDate: '2024-12-15',
    paymentStatus: 'overdue',
    client: { name: '디자인랩' },
  },
];

type StatusFilter = 'all' | 'pending' | 'paid' | 'overdue';

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: '대기', color: 'bg-yellow-100 text-yellow-700' },
  paid: { label: '완료', color: 'bg-green-100 text-green-700' },
  partial: { label: '부분결제', color: 'bg-blue-100 text-blue-700' },
  overdue: { label: '연체', color: 'bg-red-100 text-red-700' },
};

export default function InvoicesPage() {
  const [filter, setFilter] = useState<StatusFilter>('all');

  const filteredInvoices = demoInvoices.filter(
    (i) => filter === 'all' || i.paymentStatus === filter
  );

  // 통계
  const stats = {
    total: demoInvoices.reduce((sum, i) => sum + i.totalAmount, 0),
    pending: demoInvoices
      .filter((i) => i.paymentStatus === 'pending')
      .reduce((sum, i) => sum + i.totalAmount, 0),
    overdue: demoInvoices
      .filter((i) => i.paymentStatus === 'overdue')
      .reduce((sum, i) => sum + i.totalAmount, 0),
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('ko-KR').format(amount);
  const formatDate = (date: string) => new Date(date).toLocaleDateString('ko-KR');

  const isOverdue = (dueDate: string, status: string) => {
    return status === 'pending' && new Date(dueDate) < new Date();
  };

  return (
    <div className="p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">인보이스 관리</h1>
          <p className="text-gray-500 mt-1">총 {filteredInvoices.length}건</p>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">총 청구액</p>
          <p className="text-2xl font-bold text-gray-900">₩{formatCurrency(stats.total)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">미수금</p>
          <p className="text-2xl font-bold text-yellow-600">₩{formatCurrency(stats.pending)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">연체</p>
          <p className="text-2xl font-bold text-red-600">₩{formatCurrency(stats.overdue)}</p>
        </div>
      </div>

      {/* 필터 */}
      <div className="flex gap-2 mb-6">
        {(['all', 'pending', 'paid', 'overdue'] as StatusFilter[]).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === s
                ? 'bg-orange-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s === 'all' ? '전체' : statusConfig[s]?.label || s}
          </button>
        ))}
      </div>

      {/* 목록 */}
      {filteredInvoices.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <span className="text-4xl mb-4 block">💳</span>
          <p className="text-gray-500">인보이스가 없습니다</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredInvoices.map((invoice) => {
            const overdue = isOverdue(invoice.dueDate, invoice.paymentStatus);
            const actualStatus = overdue ? 'overdue' : invoice.paymentStatus;

            return (
              <Link
                key={invoice.id}
                href={`/dashboard/invoices/${invoice.id}` as never}
                className="block bg-white rounded-xl border border-gray-200 p-5 hover:border-orange-300 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm text-gray-500">{invoice.documentNumber}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusConfig[actualStatus]?.color || 'bg-gray-100'}`}>
                        {statusConfig[actualStatus]?.label || actualStatus}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">{invoice.title}</h3>
                    <p className="text-sm text-gray-500">{invoice.client.name}</p>
                    <p className="text-sm text-gray-400 mt-2">
                      납부기한: {formatDate(invoice.dueDate)}
                      {overdue && <span className="text-red-500 ml-2">(연체)</span>}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-900">
                      ₩{formatCurrency(invoice.totalAmount)}
                    </p>
                    {invoice.paidAt && (
                      <p className="text-sm text-green-600 mt-1">
                        {formatDate(invoice.paidAt)} 결제
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

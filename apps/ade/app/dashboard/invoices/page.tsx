/**
 * 인보이스 목록 페이지
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Invoice {
  id: string;
  document_number: string;
  title: string;
  total_amount: number;
  due_date: string;
  payment_status: string;
  paid_at?: string;
  isOverdue: boolean;
  clients?: { name: string };
}

type StatusFilter = 'all' | 'pending' | 'paid' | 'overdue';

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: '대기', color: 'bg-yellow-100 text-yellow-700' },
  paid: { label: '완료', color: 'bg-green-100 text-green-700' },
  partial: { label: '부분결제', color: 'bg-blue-100 text-blue-700' },
  overdue: { label: '연체', color: 'bg-red-100 text-red-700' },
};

export default function InvoicesPage() {
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (filter !== 'all') params.set('paymentStatus', filter);

        const res = await fetch(`/api/invoices?${params}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || '인보이스 목록을 불러오지 못했습니다');
        }

        setInvoices(data.invoices || []);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch invoices:', err);
        setError(err instanceof Error ? err.message : '인보이스 목록을 불러오지 못했습니다');
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, [filter]);

  // 통계
  const stats = {
    total: invoices.reduce((sum, i) => sum + i.total_amount, 0),
    pending: invoices
      .filter((i) => i.payment_status === 'pending' && !i.isOverdue)
      .reduce((sum, i) => sum + i.total_amount, 0),
    overdue: invoices
      .filter((i) => i.isOverdue)
      .reduce((sum, i) => sum + i.total_amount, 0),
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('ko-KR').format(amount);
  const formatDate = (date: string) => new Date(date).toLocaleDateString('ko-KR');

  if (loading) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-orange-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">인보이스 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-xl border border-red-200 p-12 text-center">
          <span className="text-4xl mb-4 block">❌</span>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">인보이스 관리</h1>
          <p className="text-gray-500 mt-1">총 {invoices.length}건</p>
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
      {invoices.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <span className="text-4xl mb-4 block">💳</span>
          <p className="text-gray-500">인보이스가 없습니다</p>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map((invoice) => {
            const actualStatus = invoice.isOverdue ? 'overdue' : invoice.payment_status;

            return (
              <Link
                key={invoice.id}
                href={`/dashboard/invoices/${invoice.id}` as never}
                className="block bg-white rounded-xl border border-gray-200 p-5 hover:border-orange-300 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm text-gray-500">{invoice.document_number}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusConfig[actualStatus]?.color || 'bg-gray-100'}`}>
                        {statusConfig[actualStatus]?.label || actualStatus}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">{invoice.title}</h3>
                    <p className="text-sm text-gray-500">{invoice.clients?.name || '고객 미지정'}</p>
                    <p className="text-sm text-gray-400 mt-2">
                      납부기한: {formatDate(invoice.due_date)}
                      {invoice.isOverdue && <span className="text-red-500 ml-2">(연체)</span>}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-900">
                      ₩{formatCurrency(invoice.total_amount)}
                    </p>
                    {invoice.paid_at && (
                      <p className="text-sm text-green-600 mt-1">
                        {formatDate(invoice.paid_at)} 결제
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

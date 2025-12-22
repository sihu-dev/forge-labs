/**
 * 세금계산서 목록 페이지
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface TaxInvoice {
  id: string;
  document_number: string;
  title: string;
  total_amount: number;
  issue_date: string;
  nts_status: string;
  nts_approval_number?: string;
  clients?: { name: string };
}

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
  const [taxInvoices, setTaxInvoices] = useState<TaxInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ thisMonthTotal: 0, approvedCount: 0 });

  useEffect(() => {
    const fetchTaxInvoices = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (filter !== 'all') params.set('status', filter);

        const res = await fetch(`/api/tax-invoices?${params}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || '세금계산서 목록을 불러오지 못했습니다');
        }

        setTaxInvoices(data.taxInvoices || []);
        setStats(data.stats || { thisMonthTotal: 0, approvedCount: 0 });
        setError(null);
      } catch (err) {
        console.error('Failed to fetch tax invoices:', err);
        setError(err instanceof Error ? err.message : '세금계산서 목록을 불러오지 못했습니다');
      } finally {
        setLoading(false);
      }
    };
    fetchTaxInvoices();
  }, [filter]);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('ko-KR').format(amount);
  const formatDate = (date: string) => new Date(date).toLocaleDateString('ko-KR');

  if (loading) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">세금계산서 불러오는 중...</p>
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
          <h1 className="text-2xl font-bold text-gray-900">세금계산서</h1>
          <p className="text-gray-500 mt-1">총 {taxInvoices.length}건</p>
        </div>
        <Link
          href="/dashboard/tax-invoices/new"
          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
        >
          새 세금계산서
        </Link>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">이번 달 발행액</p>
          <p className="text-2xl font-bold text-gray-900">₩{formatCurrency(stats.thisMonthTotal)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">국세청 승인</p>
          <p className="text-2xl font-bold text-green-600">
            {stats.approvedCount}건
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
      {taxInvoices.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <span className="text-4xl mb-4 block">🧾</span>
          <p className="text-gray-500">세금계산서가 없습니다</p>
        </div>
      ) : (
        <div className="space-y-3">
          {taxInvoices.map((taxInvoice) => (
            <Link
              key={taxInvoice.id}
              href={`/dashboard/tax-invoices/${taxInvoice.id}` as never}
              className="block bg-white rounded-xl border border-gray-200 p-5 hover:border-teal-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm text-gray-500 font-mono">{taxInvoice.document_number}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusConfig[taxInvoice.nts_status]?.color || 'bg-gray-100'}`}>
                      {statusConfig[taxInvoice.nts_status]?.label || taxInvoice.nts_status}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{taxInvoice.title}</h3>
                  <p className="text-sm text-gray-500">{taxInvoice.clients?.name || '고객 미지정'}</p>
                  <p className="text-sm text-gray-400 mt-2">
                    발행일: {formatDate(taxInvoice.issue_date)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-gray-900">
                    ₩{formatCurrency(taxInvoice.total_amount)}
                  </p>
                  {taxInvoice.nts_approval_number && (
                    <p className="text-xs text-green-600 mt-1 font-mono">
                      승인번호: {taxInvoice.nts_approval_number}
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

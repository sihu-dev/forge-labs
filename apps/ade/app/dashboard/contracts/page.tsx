/**
 * 계약서 목록 페이지
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Contract {
  id: string;
  document_number: string;
  title: string;
  project_name: string;
  status: string;
  total_amount: number;
  start_date: string;
  end_date: string;
  signed_at?: string;
  clients?: { name: string };
}

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
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (filter !== 'all') params.set('status', filter);

        const res = await fetch(`/api/contracts?${params}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || '계약서 목록을 불러오지 못했습니다');
        }

        setContracts(data.contracts || []);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch contracts:', err);
        setError(err instanceof Error ? err.message : '계약서 목록을 불러오지 못했습니다');
      } finally {
        setLoading(false);
      }
    };
    fetchContracts();
  }, [filter]);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('ko-KR').format(amount);
  const formatDate = (date: string) => new Date(date).toLocaleDateString('ko-KR');

  if (loading) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">계약서 불러오는 중...</p>
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
          <h1 className="text-2xl font-bold text-gray-900">계약서 관리</h1>
          <p className="text-gray-500 mt-1">총 {contracts.length}건</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/quotes"
            className="px-4 py-2 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
            title="승인된 견적서에서 계약서를 생성합니다"
          >
            견적서에서 생성
          </Link>
          <Link
            href="/dashboard/contracts/new"
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            새 계약서
          </Link>
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
      {contracts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <span className="text-4xl mb-4 block">📝</span>
          <p className="text-gray-500">계약서가 없습니다</p>
        </div>
      ) : (
        <div className="space-y-3">
          {contracts.map((contract) => (
            <Link
              key={contract.id}
              href={`/dashboard/contracts/${contract.id}` as never}
              className="block bg-white rounded-xl border border-gray-200 p-5 hover:border-purple-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm text-gray-500">{contract.document_number}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusConfig[contract.status]?.color || 'bg-gray-100'}`}>
                      {statusConfig[contract.status]?.label || contract.status}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{contract.project_name || contract.title}</h3>
                  <p className="text-sm text-gray-500">{contract.clients?.name || '고객 미지정'}</p>
                  <p className="text-sm text-gray-400 mt-2">
                    {formatDate(contract.start_date)} ~ {formatDate(contract.end_date)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-gray-900">
                    ₩{formatCurrency(contract.total_amount)}
                  </p>
                  {contract.signed_at && (
                    <p className="text-sm text-green-600 mt-1">
                      {formatDate(contract.signed_at)} 체결
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

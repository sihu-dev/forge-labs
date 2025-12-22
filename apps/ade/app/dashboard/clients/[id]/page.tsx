/**
 * 고객 상세 페이지
 */

'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Client {
  id: string;
  type: 'business' | 'individual';
  name: string;
  business_number?: string;
  representative_name?: string;
  email: string;
  phone?: string;
  address?: string;
  business_type?: string;
  business_category?: string;
  notes?: string;
  created_at: string;
}

interface ClientStats {
  quotes: { count: number; total: number };
  contracts: { count: number; total: number };
  invoices: { count: number; total: number };
  totalRevenue: number;
}

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [stats, setStats] = useState<ClientStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // 고객 데이터 불러오기
  useEffect(() => {
    const fetchClient = async () => {
      try {
        const res = await fetch(`/api/clients/${resolvedParams.id}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || '고객 정보를 불러오지 못했습니다');
        }

        setClient(data.client);
        setStats(data.stats);
      } catch (err) {
        console.error('Failed to fetch client:', err);
        setError(err instanceof Error ? err.message : '고객 정보를 불러오지 못했습니다');
      } finally {
        setLoading(false);
      }
    };
    fetchClient();
  }, [resolvedParams.id]);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('ko-KR').format(amount);
  const formatDate = (date: string) => new Date(date).toLocaleDateString('ko-KR');

  const handleDelete = async () => {
    if (!confirm('정말 이 고객을 삭제하시겠습니까?')) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/clients/${resolvedParams.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '고객 삭제에 실패했습니다');
      }

      router.push('/dashboard/clients');
    } catch (err) {
      console.error('Failed to delete client:', err);
      alert(err instanceof Error ? err.message : '고객 삭제에 실패했습니다');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">고객 정보 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-white rounded-xl border border-red-200 p-12 text-center">
          <span className="text-4xl mb-4 block">❌</span>
          <p className="text-red-600 mb-4">{error || '고객을 찾을 수 없습니다'}</p>
          <Link
            href="/dashboard/clients"
            className="inline-block px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* 헤더 */}
      <div className="mb-6">
        <Link
          href="/dashboard/clients"
          className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-4"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          고객 목록
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold ${
              client.type === 'business' ? 'bg-blue-500' : 'bg-green-500'
            }`}>
              {client.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  client.type === 'business'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-green-100 text-green-700'
                }`}>
                  {client.type === 'business' ? '사업자' : '개인'}
                </span>
              </div>
              <p className="text-gray-500">{client.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/dashboard/quotes/new?clientId=${client.id}` as never}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              견적서 작성
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50"
            >
              {deleting ? '삭제 중...' : '삭제'}
            </button>
          </div>
        </div>
      </div>

      {/* 통계 */}
      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">견적서</p>
            <p className="text-2xl font-bold text-gray-900">{stats.quotes.count}건</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">계약서</p>
            <p className="text-2xl font-bold text-gray-900">{stats.contracts.count}건</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">인보이스</p>
            <p className="text-2xl font-bold text-gray-900">{stats.invoices.count}건</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">총 거래액</p>
            <p className="text-2xl font-bold text-blue-600">₩{formatCurrency(stats.totalRevenue)}</p>
          </div>
        </div>
      )}

      {/* 기본 정보 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">기본 정보</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            {client.business_number && (
              <div>
                <p className="text-sm text-gray-500">사업자등록번호</p>
                <p className="text-gray-900">{client.business_number}</p>
              </div>
            )}
            {client.representative_name && (
              <div>
                <p className="text-sm text-gray-500">대표자명</p>
                <p className="text-gray-900">{client.representative_name}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500">이메일</p>
              <p className="text-gray-900">{client.email}</p>
            </div>
            {client.phone && (
              <div>
                <p className="text-sm text-gray-500">전화번호</p>
                <p className="text-gray-900">{client.phone}</p>
              </div>
            )}
          </div>
          <div className="space-y-4">
            {client.address && (
              <div>
                <p className="text-sm text-gray-500">주소</p>
                <p className="text-gray-900">{client.address}</p>
              </div>
            )}
            {client.business_type && (
              <div>
                <p className="text-sm text-gray-500">업태</p>
                <p className="text-gray-900">{client.business_type}</p>
              </div>
            )}
            {client.business_category && (
              <div>
                <p className="text-sm text-gray-500">종목</p>
                <p className="text-gray-900">{client.business_category}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500">등록일</p>
              <p className="text-gray-900">{formatDate(client.created_at)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 메모 */}
      {client.notes && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">메모</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{client.notes}</p>
        </div>
      )}
    </div>
  );
}

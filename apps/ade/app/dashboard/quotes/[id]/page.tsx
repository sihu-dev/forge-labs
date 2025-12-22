/**
 * 견적서 상세 페이지
 */

'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface QuoteItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  unit: string;
}

interface Quote {
  id: string;
  document_number: string;
  status: string;
  title: string;
  items: QuoteItem[];
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  valid_until: string;
  payment_terms?: string;
  delivery_terms?: string;
  notes?: string;
  created_at: string;
  clients?: {
    name: string;
    business_number?: string;
    email: string;
  };
}

export default function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [creating, setCreating] = useState(false);

  // 견적서 데이터 불러오기
  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const res = await fetch(`/api/quotes/${resolvedParams.id}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || '견적서를 불러오지 못했습니다');
        }

        setQuote(data.quote);
      } catch (err) {
        console.error('Failed to fetch quote:', err);
        setError(err instanceof Error ? err.message : '견적서를 불러오지 못했습니다');
      } finally {
        setLoading(false);
      }
    };
    fetchQuote();
  }, [resolvedParams.id]);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('ko-KR').format(amount);
  const formatDate = (date: string) => new Date(date).toLocaleDateString('ko-KR');

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    draft: { label: '초안', color: 'text-gray-600', bg: 'bg-gray-100' },
    sent: { label: '발송됨', color: 'text-blue-700', bg: 'bg-blue-100' },
    viewed: { label: '열람됨', color: 'text-yellow-700', bg: 'bg-yellow-100' },
    approved: { label: '승인됨', color: 'text-green-700', bg: 'bg-green-100' },
    rejected: { label: '거절됨', color: 'text-red-700', bg: 'bg-red-100' },
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/p/quotes/${resolvedParams.id}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateContract = async () => {
    if (!quote) return;
    setCreating(true);

    try {
      const res = await fetch('/api/contracts/from-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quoteId: quote.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '계약서 생성에 실패했습니다');
      }

      // 계약서 상세 페이지로 이동
      router.push(`/dashboard/contracts/${data.contract.id}` as never);
    } catch (err) {
      console.error('Failed to create contract:', err);
      alert(err instanceof Error ? err.message : '계약서 생성에 실패했습니다');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">견적서 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-white rounded-xl border border-red-200 p-12 text-center">
          <span className="text-4xl mb-4 block">❌</span>
          <p className="text-red-600 mb-4">{error || '견적서를 찾을 수 없습니다'}</p>
          <Link
            href="/dashboard/quotes"
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
          href="/dashboard/quotes"
          className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-4"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          견적서 목록
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{quote.title}</h1>
              <span className={`text-sm px-3 py-1 rounded-full ${statusConfig[quote.status]?.bg} ${statusConfig[quote.status]?.color}`}>
                {statusConfig[quote.status]?.label}
              </span>
            </div>
            <p className="text-gray-500 mt-1">{quote.document_number}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCopyLink}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              {copied ? '복사됨!' : '링크 복사'}
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              PDF 저장
            </button>
            {quote.status === 'approved' && (
              <button
                onClick={handleCreateContract}
                disabled={creating}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {creating ? '생성 중...' : '계약서 생성'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 고객 정보 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">고객 정보</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <p className="font-medium text-gray-900">{quote.clients?.name || '고객 미지정'}</p>
            {quote.clients?.business_number && (
              <p className="text-sm text-gray-500">{quote.clients.business_number}</p>
            )}
            <p className="text-sm text-gray-500">{quote.clients?.email}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">유효기간</p>
            <p className="font-medium text-gray-900">{formatDate(quote.valid_until)}</p>
          </div>
        </div>
      </div>

      {/* 품목 및 금액 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">견적 내역</h2>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="py-3 text-left text-sm text-gray-500">품목</th>
              <th className="py-3 text-center text-sm text-gray-500 w-20">수량</th>
              <th className="py-3 text-right text-sm text-gray-500 w-32">단가</th>
              <th className="py-3 text-right text-sm text-gray-500 w-32">금액</th>
            </tr>
          </thead>
          <tbody>
            {quote.items?.map((item: QuoteItem) => (
              <tr key={item.id} className="border-b border-gray-100">
                <td className="py-3 text-gray-900">{item.name}</td>
                <td className="py-3 text-center text-gray-600">{item.quantity} {item.unit}</td>
                <td className="py-3 text-right text-gray-600">₩{formatCurrency(item.unitPrice)}</td>
                <td className="py-3 text-right font-medium">₩{formatCurrency(item.amount)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-200">
              <td colSpan={3} className="py-3 text-gray-600">공급가액</td>
              <td className="py-3 text-right">₩{formatCurrency(quote.subtotal)}</td>
            </tr>
            <tr>
              <td colSpan={3} className="py-2 text-gray-600">부가세 (10%)</td>
              <td className="py-2 text-right">₩{formatCurrency(quote.tax_amount)}</td>
            </tr>
            <tr className="border-t border-gray-200">
              <td colSpan={3} className="py-4 font-bold text-gray-900 text-lg">합계</td>
              <td className="py-4 text-right font-bold text-blue-600 text-2xl">
                ₩{formatCurrency(quote.total_amount)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* 조건 및 비고 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">계약 조건</h2>
        <div className="space-y-4">
          {quote.payment_terms && (
            <div>
              <p className="text-sm text-gray-500 mb-1">결제 조건</p>
              <p className="text-gray-900">{quote.payment_terms}</p>
            </div>
          )}
          {quote.delivery_terms && (
            <div>
              <p className="text-sm text-gray-500 mb-1">납품 조건</p>
              <p className="text-gray-900">{quote.delivery_terms}</p>
            </div>
          )}
          {quote.notes && (
            <div>
              <p className="text-sm text-gray-500 mb-1">비고</p>
              <p className="text-gray-900">{quote.notes}</p>
            </div>
          )}
          {!quote.payment_terms && !quote.delivery_terms && !quote.notes && (
            <p className="text-gray-400">등록된 조건이 없습니다</p>
          )}
        </div>
      </div>
    </div>
  );
}

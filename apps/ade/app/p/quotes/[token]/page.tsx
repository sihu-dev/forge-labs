/**
 * 견적서 공개 링크 페이지
 * 고객이 견적서를 열람하고 승인/거절할 수 있는 페이지
 */

'use client';

import { useState, useEffect, use } from 'react';

interface QuoteItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  unit: string;
}

interface QuoteData {
  id: string;
  documentNumber: string;
  title: string;
  status: string;
  items: QuoteItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  validUntil: string;
  paymentTerms: string | null;
  deliveryTerms: string | null;
  notes: string | null;
  createdAt: string;
  provider: {
    name: string;
    businessNumber: string | null;
    email: string;
    phone: string | null;
    address: string | null;
  };
  client: {
    name: string;
    email: string;
  };
}

export default function PublicQuotePage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = use(params);
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [responding, setResponding] = useState(false);
  const [responseType, setResponseType] = useState<'approve' | 'reject' | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const res = await fetch(`/api/public/quotes/${resolvedParams.token}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || '견적서를 불러오지 못했습니다');
        }

        setQuote(data.quote);
      } catch (err) {
        console.error('Failed to fetch public quote:', err);
        setError(err instanceof Error ? err.message : '견적서를 불러오지 못했습니다');
      } finally {
        setLoading(false);
      }
    };
    fetchQuote();
  }, [resolvedParams.token]);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('ko-KR').format(amount);
  const formatDate = (date: string) => new Date(date).toLocaleDateString('ko-KR');

  const handleResponse = async (type: 'approve' | 'reject') => {
    if (type === 'reject' && !rejectReason.trim()) {
      alert('거절 사유를 입력해주세요');
      return;
    }

    setResponding(true);
    try {
      const res = await fetch(`/api/public/quotes/${resolvedParams.token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: type,
          reason: type === 'reject' ? rejectReason : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '응답 처리에 실패했습니다');
      }

      setQuote((prev) => prev ? { ...prev, status: data.status } : null);
      setResponseType(null);
      setRejectReason('');
    } catch (err) {
      console.error('Response failed:', err);
      alert(err instanceof Error ? err.message : '응답 처리에 실패했습니다');
    } finally {
      setResponding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">견적서를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-6xl mb-4">📄</p>
          <p className="text-gray-500">{error || '견적서를 찾을 수 없습니다'}</p>
        </div>
      </div>
    );
  }

  const isExpired = new Date(quote.validUntil) < new Date();
  const canRespond = ['sent', 'viewed'].includes(quote.status) && !isExpired;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* 상태 배너 */}
        {quote.status === 'approved' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-center">
            <p className="text-green-800 font-medium">이 견적서는 승인되었습니다</p>
          </div>
        )}
        {quote.status === 'rejected' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-center">
            <p className="text-red-800 font-medium">이 견적서는 거절되었습니다</p>
          </div>
        )}
        {isExpired && ['sent', 'viewed'].includes(quote.status) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-center">
            <p className="text-yellow-800 font-medium">이 견적서는 유효기간이 만료되었습니다</p>
          </div>
        )}

        {/* 견적서 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* 헤더 */}
          <div className="bg-blue-600 text-white px-6 py-8">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-blue-200 text-sm mb-1">{quote.documentNumber}</p>
                <h1 className="text-2xl font-bold">{quote.title}</h1>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">₩{formatCurrency(quote.totalAmount)}</p>
                <p className="text-blue-200 text-sm mt-1">부가세 포함</p>
              </div>
            </div>
          </div>

          {/* 공급자/고객 정보 */}
          <div className="grid md:grid-cols-2 gap-6 p-6 border-b border-gray-200">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">공급자</p>
              <p className="font-semibold text-gray-900">{quote.provider.name}</p>
              {quote.provider.businessNumber && (
                <p className="text-sm text-gray-500">{quote.provider.businessNumber}</p>
              )}
              <p className="text-sm text-gray-500">{quote.provider.email}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">고객</p>
              <p className="font-semibold text-gray-900">{quote.client.name}</p>
              <p className="text-sm text-gray-500">{quote.client.email}</p>
            </div>
          </div>

          {/* 품목 */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900 mb-4">품목</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 border-b border-gray-200">
                    <th className="pb-3 font-medium">품목명</th>
                    <th className="pb-3 font-medium text-center">수량</th>
                    <th className="pb-3 font-medium text-right">단가</th>
                    <th className="pb-3 font-medium text-right">금액</th>
                  </tr>
                </thead>
                <tbody>
                  {quote.items.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100">
                      <td className="py-3 text-gray-900">{item.name}</td>
                      <td className="py-3 text-center text-gray-600">{item.quantity} {item.unit}</td>
                      <td className="py-3 text-right text-gray-600">₩{formatCurrency(item.unitPrice)}</td>
                      <td className="py-3 text-right font-medium text-gray-900">₩{formatCurrency(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 합계 */}
            <div className="mt-6 pt-4 border-t border-gray-200 space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>공급가액</span>
                <span>₩{formatCurrency(quote.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>부가세 (10%)</span>
                <span>₩{formatCurrency(quote.taxAmount)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200">
                <span>합계</span>
                <span className="text-blue-600">₩{formatCurrency(quote.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* 조건 */}
          <div className="p-6 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">유효기간</p>
                <p className="text-gray-900">{formatDate(quote.validUntil)}까지</p>
              </div>
              {quote.paymentTerms && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">결제 조건</p>
                  <p className="text-gray-900">{quote.paymentTerms}</p>
                </div>
              )}
            </div>
            {quote.deliveryTerms && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">납품 조건</p>
                <p className="text-gray-900">{quote.deliveryTerms}</p>
              </div>
            )}
            {quote.notes && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">비고</p>
                <p className="text-gray-900">{quote.notes}</p>
              </div>
            )}
          </div>

          {/* 응답 버튼 */}
          {canRespond && (
            <div className="p-6 bg-gray-50 border-t border-gray-200">
              {responseType === null ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleResponse('approve')}
                    disabled={responding}
                    className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {responding ? '처리 중...' : '승인하기'}
                  </button>
                  <button
                    onClick={() => setResponseType('reject')}
                    disabled={responding}
                    className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
                  >
                    거절하기
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="거절 사유를 입력해주세요..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => setResponseType(null)}
                      className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                    >
                      취소
                    </button>
                    <button
                      onClick={() => handleResponse('reject')}
                      disabled={responding}
                      className="flex-1 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      {responding ? '처리 중...' : '거절 확인'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 푸터 */}
        <p className="text-center text-sm text-gray-400 mt-6">
          Powered by ADE
        </p>
      </div>
    </div>
  );
}

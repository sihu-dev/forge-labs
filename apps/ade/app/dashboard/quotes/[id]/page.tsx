/**
 * 견적서 상세 페이지
 */

'use client';

import { useState, use } from 'react';
import Link from 'next/link';

// 데모 데이터
const demoQuote = {
  id: '1',
  documentNumber: 'Q-2024-0001',
  status: 'sent',
  title: '웹사이트 리뉴얼 프로젝트',
  items: [
    { id: '1', name: '기획/설계', quantity: 1, unitPrice: 500000, amount: 500000, unit: '식' },
    { id: '2', name: 'UI/UX 디자인', quantity: 1, unitPrice: 1500000, amount: 1500000, unit: '식' },
    { id: '3', name: '프론트엔드 개발', quantity: 1, unitPrice: 2000000, amount: 2000000, unit: '식' },
  ],
  subtotal: 4000000,
  taxAmount: 400000,
  totalAmount: 4400000,
  validUntil: '2024-12-31',
  paymentTerms: '계약금 30% 선급, 잔금 70% 완료 후',
  deliveryTerms: '최종 산출물 Google Drive 공유',
  notes: '수정 2회 포함, 추가 수정 별도 협의',
  client: {
    name: '(주)테크스타트',
    businessNumber: '123-45-67890',
    email: 'tech@start.com',
  },
  createdAt: '2024-12-01T09:00:00Z',
  publicToken: 'abc123xyz',
};

export default function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [quote] = useState(demoQuote);
  const [copied, setCopied] = useState(false);

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
    const link = `${window.location.origin}/p/quotes/${quote.publicToken}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateContract = () => {
    // TODO: 계약서 생성 API 호출
    console.log('Create contract from quote:', resolvedParams.id);
  };

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
            <p className="text-gray-500 mt-1">{quote.documentNumber}</p>
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
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                계약서 생성
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
            <p className="font-medium text-gray-900">{quote.client.name}</p>
            {quote.client.businessNumber && (
              <p className="text-sm text-gray-500">{quote.client.businessNumber}</p>
            )}
            <p className="text-sm text-gray-500">{quote.client.email}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">유효기간</p>
            <p className="font-medium text-gray-900">{formatDate(quote.validUntil)}</p>
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
            {quote.items.map((item) => (
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
              <td className="py-2 text-right">₩{formatCurrency(quote.taxAmount)}</td>
            </tr>
            <tr className="border-t border-gray-200">
              <td colSpan={3} className="py-4 font-bold text-gray-900 text-lg">합계</td>
              <td className="py-4 text-right font-bold text-blue-600 text-2xl">
                ₩{formatCurrency(quote.totalAmount)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* 조건 및 비고 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">계약 조건</h2>
        <div className="space-y-4">
          {quote.paymentTerms && (
            <div>
              <p className="text-sm text-gray-500 mb-1">결제 조건</p>
              <p className="text-gray-900">{quote.paymentTerms}</p>
            </div>
          )}
          {quote.deliveryTerms && (
            <div>
              <p className="text-sm text-gray-500 mb-1">납품 조건</p>
              <p className="text-gray-900">{quote.deliveryTerms}</p>
            </div>
          )}
          {quote.notes && (
            <div>
              <p className="text-sm text-gray-500 mb-1">비고</p>
              <p className="text-gray-900">{quote.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

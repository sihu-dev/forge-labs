/**
 * 세금계산서 상세 페이지
 */

'use client';

import { useState, use } from 'react';
import Link from 'next/link';

// 데모 데이터
const demoTaxInvoice = {
  id: '1',
  documentNumber: '20241201-12345678',
  status: 'approved',
  ntsStatus: 'approved',
  ntsApprovalNumber: '2024120112345678',
  ntsSubmittedAt: '2024-12-01T10:00:00Z',
  items: [
    { id: '1', date: '2024-12-01', name: '웹사이트 리뉴얼 - 계약금', quantity: 1, unitPrice: 1200000, supplyAmount: 1200000, taxAmount: 120000 },
  ],
  subtotal: 1200000,
  taxAmount: 120000,
  totalAmount: 1320000,
  issueDate: '2024-12-01',
  issueType: 'regular',
  provider: {
    businessNumber: '123-45-67890',
    name: '포지랩스',
    representativeName: '홍길동',
    address: '서울시 강남구 테헤란로 123',
    businessType: '서비스업',
    businessCategory: '소프트웨어 개발',
    email: 'contact@forgelabs.kr',
  },
  client: {
    businessNumber: '234-56-78901',
    name: '(주)테크스타트',
    representativeName: '김대표',
    address: '서울시 서초구 강남대로 456',
    businessType: '서비스업',
    businessCategory: 'IT 솔루션',
    email: 'tech@start.com',
  },
  invoiceId: 'inv1',
  invoiceNumber: 'I-2024-0001',
};

export default function TaxInvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [taxInvoice] = useState(demoTaxInvoice);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('ko-KR').format(amount);
  const formatDate = (date: string) => new Date(date).toLocaleDateString('ko-KR');

  const handleSubmitToNTS = async () => {
    // TODO: 국세청 전송 API 호출
    console.log('Submit to NTS:', resolvedParams.id);
  };

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    draft: { label: '초안', color: 'text-gray-600', bg: 'bg-gray-100' },
    pending: { label: '전송 대기', color: 'text-yellow-700', bg: 'bg-yellow-100' },
    submitted: { label: '전송됨', color: 'text-blue-700', bg: 'bg-blue-100' },
    approved: { label: '국세청 승인', color: 'text-green-700', bg: 'bg-green-100' },
    rejected: { label: '반려', color: 'text-red-700', bg: 'bg-red-100' },
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* 헤더 */}
      <div className="mb-6">
        <Link
          href="/dashboard/tax-invoices"
          className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-4"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          세금계산서 목록
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">세금계산서</h1>
              <span className={`text-sm px-3 py-1 rounded-full ${statusConfig[taxInvoice.ntsStatus]?.bg} ${statusConfig[taxInvoice.ntsStatus]?.color}`}>
                {statusConfig[taxInvoice.ntsStatus]?.label}
              </span>
            </div>
            <p className="text-gray-500 mt-1 font-mono">{taxInvoice.documentNumber}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              인쇄
            </button>
            {taxInvoice.ntsStatus === 'pending' && (
              <button
                onClick={handleSubmitToNTS}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
              >
                국세청 전송
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 승인 정보 */}
      {taxInvoice.ntsApprovalNumber && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-green-800">
            <span className="font-medium">국세청 승인번호:</span>{' '}
            <span className="font-mono">{taxInvoice.ntsApprovalNumber}</span>
          </p>
          <p className="text-green-600 text-sm mt-1">
            {formatDate(taxInvoice.ntsSubmittedAt!)} 승인
          </p>
        </div>
      )}

      {/* 세금계산서 본문 - 표준 양식 */}
      <div className="bg-white rounded-xl border-2 border-gray-300 overflow-hidden print:border-black">
        {/* 제목 */}
        <div className="bg-gray-100 text-center py-3 border-b-2 border-gray-300">
          <h2 className="text-xl font-bold text-gray-900">전 자 세 금 계 산 서</h2>
        </div>

        {/* 공급자/공급받는자 */}
        <div className="grid grid-cols-2 border-b-2 border-gray-300">
          {/* 공급자 */}
          <div className="border-r-2 border-gray-300">
            <div className="bg-blue-50 text-center py-2 border-b border-gray-300">
              <span className="font-semibold text-blue-800">공급자</span>
            </div>
            <div className="p-4 space-y-2 text-sm">
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500">등록번호</span>
                <span className="col-span-2 font-mono">{taxInvoice.provider.businessNumber}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500">상호</span>
                <span className="col-span-2 font-semibold">{taxInvoice.provider.name}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500">대표자</span>
                <span className="col-span-2">{taxInvoice.provider.representativeName}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500">주소</span>
                <span className="col-span-2 text-xs">{taxInvoice.provider.address}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500">업태</span>
                <span className="col-span-2">{taxInvoice.provider.businessType}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500">종목</span>
                <span className="col-span-2">{taxInvoice.provider.businessCategory}</span>
              </div>
            </div>
          </div>

          {/* 공급받는자 */}
          <div>
            <div className="bg-orange-50 text-center py-2 border-b border-gray-300">
              <span className="font-semibold text-orange-800">공급받는자</span>
            </div>
            <div className="p-4 space-y-2 text-sm">
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500">등록번호</span>
                <span className="col-span-2 font-mono">{taxInvoice.client.businessNumber}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500">상호</span>
                <span className="col-span-2 font-semibold">{taxInvoice.client.name}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500">대표자</span>
                <span className="col-span-2">{taxInvoice.client.representativeName}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500">주소</span>
                <span className="col-span-2 text-xs">{taxInvoice.client.address}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500">업태</span>
                <span className="col-span-2">{taxInvoice.client.businessType}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500">종목</span>
                <span className="col-span-2">{taxInvoice.client.businessCategory}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 품목 */}
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-300">
              <th className="py-2 px-3 text-center border-r border-gray-300 w-24">작성일자</th>
              <th className="py-2 px-3 text-left border-r border-gray-300">품목</th>
              <th className="py-2 px-3 text-center border-r border-gray-300 w-16">수량</th>
              <th className="py-2 px-3 text-right border-r border-gray-300 w-28">단가</th>
              <th className="py-2 px-3 text-right border-r border-gray-300 w-28">공급가액</th>
              <th className="py-2 px-3 text-right w-24">세액</th>
            </tr>
          </thead>
          <tbody>
            {taxInvoice.items.map((item) => (
              <tr key={item.id} className="border-b border-gray-200">
                <td className="py-2 px-3 text-center border-r border-gray-300">{item.date}</td>
                <td className="py-2 px-3 border-r border-gray-300">{item.name}</td>
                <td className="py-2 px-3 text-center border-r border-gray-300">{item.quantity}</td>
                <td className="py-2 px-3 text-right border-r border-gray-300">₩{formatCurrency(item.unitPrice)}</td>
                <td className="py-2 px-3 text-right border-r border-gray-300">₩{formatCurrency(item.supplyAmount)}</td>
                <td className="py-2 px-3 text-right">₩{formatCurrency(item.taxAmount)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 border-t-2 border-gray-300 font-semibold">
              <td colSpan={4} className="py-3 px-3 text-right border-r border-gray-300">합계</td>
              <td className="py-3 px-3 text-right border-r border-gray-300">₩{formatCurrency(taxInvoice.subtotal)}</td>
              <td className="py-3 px-3 text-right">₩{formatCurrency(taxInvoice.taxAmount)}</td>
            </tr>
            <tr className="bg-teal-50 font-bold text-lg">
              <td colSpan={5} className="py-4 px-3 text-right border-r border-gray-300">총 합계</td>
              <td className="py-4 px-3 text-right text-teal-700">₩{formatCurrency(taxInvoice.totalAmount)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* 관련 문서 */}
      {taxInvoice.invoiceId && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500 mb-1">관련 인보이스</p>
          <Link
            href={`/dashboard/invoices/${taxInvoice.invoiceId}` as never}
            className="text-orange-600 hover:underline"
          >
            {taxInvoice.invoiceNumber}
          </Link>
        </div>
      )}
    </div>
  );
}

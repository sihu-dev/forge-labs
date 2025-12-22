/**
 * 세금계산서 상세 페이지
 */

'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';

interface TaxInvoiceItem {
  id: string;
  date: string;
  name: string;
  quantity: number;
  unit_price: number;
  supply_amount: number;
  tax_amount: number;
}

interface TaxInvoice {
  id: string;
  document_number: string;
  status: string;
  nts_status: string;
  nts_approval_number?: string;
  nts_submitted_at?: string;
  items: TaxInvoiceItem[];
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  issue_date: string;
  issue_type: string;
  provider_info?: {
    business_number: string;
    name: string;
    representative_name: string;
    address: string;
    business_type: string;
    business_category: string;
    email: string;
  };
  provider?: {
    business_number: string;
    name: string;
    representative_name: string;
    address: string;
    business_type: string;
    business_category: string;
    email: string;
  };
  client?: {
    businessNumber: string;
    name: string;
    representativeName: string;
    address: string;
    businessType: string;
    businessCategory: string;
    email: string;
  };
  invoice_id?: string;
}

interface LinkedInvoice {
  id: string;
  document_number: string;
  title: string;
}

export default function TaxInvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [taxInvoice, setTaxInvoice] = useState<TaxInvoice | null>(null);
  const [linkedInvoice, setLinkedInvoice] = useState<LinkedInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchTaxInvoice = async () => {
      try {
        const res = await fetch(`/api/tax-invoices/${resolvedParams.id}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || '세금계산서를 불러오지 못했습니다');
        }

        setTaxInvoice(data.taxInvoice);
        setLinkedInvoice(data.invoice);
      } catch (err) {
        console.error('Failed to fetch tax invoice:', err);
        setError(err instanceof Error ? err.message : '세금계산서를 불러오지 못했습니다');
      } finally {
        setLoading(false);
      }
    };
    fetchTaxInvoice();
  }, [resolvedParams.id]);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('ko-KR').format(amount);
  const formatDate = (date: string) => new Date(date).toLocaleDateString('ko-KR');

  const handleSubmitToNTS = async () => {
    if (!taxInvoice) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/tax-invoices/${resolvedParams.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'submit_nts' }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '국세청 전송에 실패했습니다');
      }

      setTaxInvoice(data.taxInvoice);
      alert(data.message || '국세청 전송이 완료되었습니다');
    } catch (err) {
      console.error('NTS submission failed:', err);
      alert(err instanceof Error ? err.message : '국세청 전송에 실패했습니다');
    } finally {
      setSubmitting(false);
    }
  };

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    draft: { label: '초안', color: 'text-gray-600', bg: 'bg-gray-100' },
    pending: { label: '전송 대기', color: 'text-yellow-700', bg: 'bg-yellow-100' },
    submitted: { label: '전송됨', color: 'text-blue-700', bg: 'bg-blue-100' },
    approved: { label: '국세청 승인', color: 'text-green-700', bg: 'bg-green-100' },
    rejected: { label: '반려', color: 'text-red-700', bg: 'bg-red-100' },
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">세금계산서 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !taxInvoice) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-white rounded-xl border border-red-200 p-12 text-center">
          <span className="text-4xl mb-4 block">❌</span>
          <p className="text-red-600 mb-4">{error || '세금계산서를 찾을 수 없습니다'}</p>
          <Link
            href="/dashboard/tax-invoices"
            className="inline-block px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const provider = taxInvoice.provider || taxInvoice.provider_info;

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
              <span className={`text-sm px-3 py-1 rounded-full ${statusConfig[taxInvoice.nts_status]?.bg} ${statusConfig[taxInvoice.nts_status]?.color}`}>
                {statusConfig[taxInvoice.nts_status]?.label}
              </span>
            </div>
            <p className="text-gray-500 mt-1 font-mono">{taxInvoice.document_number}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              인쇄
            </button>
            {['draft', 'pending'].includes(taxInvoice.nts_status) && (
              <button
                onClick={handleSubmitToNTS}
                disabled={submitting}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
              >
                {submitting ? '전송 중...' : '국세청 전송'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 승인 정보 */}
      {taxInvoice.nts_approval_number && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-green-800">
            <span className="font-medium">국세청 승인번호:</span>{' '}
            <span className="font-mono">{taxInvoice.nts_approval_number}</span>
          </p>
          {taxInvoice.nts_submitted_at && (
            <p className="text-green-600 text-sm mt-1">
              {formatDate(taxInvoice.nts_submitted_at)} 승인
            </p>
          )}
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
                <span className="col-span-2 font-mono">{provider?.business_number || '-'}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500">상호</span>
                <span className="col-span-2 font-semibold">{provider?.name || '-'}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500">대표자</span>
                <span className="col-span-2">{provider?.representative_name || '-'}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500">주소</span>
                <span className="col-span-2 text-xs">{provider?.address || '-'}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500">업태</span>
                <span className="col-span-2">{provider?.business_type || '-'}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500">종목</span>
                <span className="col-span-2">{provider?.business_category || '-'}</span>
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
                <span className="col-span-2 font-mono">{taxInvoice.client?.businessNumber || '-'}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500">상호</span>
                <span className="col-span-2 font-semibold">{taxInvoice.client?.name || '-'}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500">대표자</span>
                <span className="col-span-2">{taxInvoice.client?.representativeName || '-'}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500">주소</span>
                <span className="col-span-2 text-xs">{taxInvoice.client?.address || '-'}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500">업태</span>
                <span className="col-span-2">{taxInvoice.client?.businessType || '-'}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500">종목</span>
                <span className="col-span-2">{taxInvoice.client?.businessCategory || '-'}</span>
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
            {taxInvoice.items?.map((item) => (
              <tr key={item.id} className="border-b border-gray-200">
                <td className="py-2 px-3 text-center border-r border-gray-300">{item.date}</td>
                <td className="py-2 px-3 border-r border-gray-300">{item.name}</td>
                <td className="py-2 px-3 text-center border-r border-gray-300">{item.quantity}</td>
                <td className="py-2 px-3 text-right border-r border-gray-300">₩{formatCurrency(item.unit_price)}</td>
                <td className="py-2 px-3 text-right border-r border-gray-300">₩{formatCurrency(item.supply_amount)}</td>
                <td className="py-2 px-3 text-right">₩{formatCurrency(item.tax_amount)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 border-t-2 border-gray-300 font-semibold">
              <td colSpan={4} className="py-3 px-3 text-right border-r border-gray-300">합계</td>
              <td className="py-3 px-3 text-right border-r border-gray-300">₩{formatCurrency(taxInvoice.subtotal)}</td>
              <td className="py-3 px-3 text-right">₩{formatCurrency(taxInvoice.tax_amount)}</td>
            </tr>
            <tr className="bg-teal-50 font-bold text-lg">
              <td colSpan={5} className="py-4 px-3 text-right border-r border-gray-300">총 합계</td>
              <td className="py-4 px-3 text-right text-teal-700">₩{formatCurrency(taxInvoice.total_amount)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* 관련 문서 */}
      {linkedInvoice && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500 mb-1">관련 인보이스</p>
          <Link
            href={`/dashboard/invoices/${linkedInvoice.id}` as never}
            className="text-orange-600 hover:underline"
          >
            {linkedInvoice.document_number} - {linkedInvoice.title}
          </Link>
        </div>
      )}
    </div>
  );
}

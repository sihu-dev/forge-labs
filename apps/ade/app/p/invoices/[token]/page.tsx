/**
 * 인보이스 공개 링크 페이지
 * 고객이 인보이스를 열람하고 결제 정보를 확인할 수 있는 페이지
 */

'use client';

import { useState, useEffect, use } from 'react';

interface InvoiceItem {
  id: string;
  name: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

interface InvoiceData {
  id: string;
  documentNumber: string;
  title: string;
  status: string;
  paymentStatus: string;
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  dueDate: string;
  paymentInfo: {
    bank_name: string;
    account_number: string;
    account_holder: string;
  } | null;
  notes: string | null;
  createdAt: string;
  isOverdue: boolean;
  provider: {
    name: string;
    businessNumber: string | null;
    email: string;
    phone: string | null;
    address: string | null;
    bankName: string | null;
    accountNumber: string | null;
    accountHolder: string | null;
  } | null;
  client: {
    name: string;
    email: string;
    businessNumber: string | null;
  };
}

export default function PublicInvoicePage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = use(params);
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await fetch(`/api/public/invoices/${resolvedParams.token}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || '인보이스를 불러오지 못했습니다');
        }

        setInvoice(data.invoice);
      } catch (err) {
        console.error('Failed to fetch public invoice:', err);
        setError(err instanceof Error ? err.message : '인보이스를 불러오지 못했습니다');
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [resolvedParams.token]);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('ko-KR').format(amount);
  const formatDate = (date: string) => new Date(date).toLocaleDateString('ko-KR');

  const handleCopyAccount = () => {
    const accountNumber = invoice?.paymentInfo?.account_number || invoice?.provider?.accountNumber;
    if (accountNumber) {
      navigator.clipboard.writeText(accountNumber.replace(/-/g, ''));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">인보이스를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-6xl mb-4">📄</p>
          <p className="text-gray-500">{error || '인보이스를 찾을 수 없습니다'}</p>
        </div>
      </div>
    );
  }

  const paymentInfo = invoice.paymentInfo || {
    bank_name: invoice.provider?.bankName || '',
    account_number: invoice.provider?.accountNumber || '',
    account_holder: invoice.provider?.accountHolder || '',
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* 상태 배너 */}
        {invoice.paymentStatus === 'paid' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-center">
            <p className="text-green-800 font-medium">이 인보이스는 결제 완료되었습니다</p>
          </div>
        )}
        {invoice.isOverdue && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-center">
            <p className="text-red-800 font-medium">납부기한이 지났습니다. 빠른 결제 부탁드립니다.</p>
          </div>
        )}

        {/* 인보이스 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* 헤더 */}
          <div className="bg-orange-600 text-white px-6 py-8">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-orange-200 text-sm mb-1">{invoice.documentNumber}</p>
                <h1 className="text-2xl font-bold">{invoice.title}</h1>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">₩{formatCurrency(invoice.totalAmount)}</p>
                <p className="text-orange-200 text-sm mt-1">부가세 포함</p>
              </div>
            </div>
          </div>

          {/* 당사자 정보 */}
          <div className="grid md:grid-cols-2 gap-6 p-6 border-b border-gray-200">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">공급자</p>
              <p className="font-semibold text-gray-900">{invoice.provider?.name || '-'}</p>
              {invoice.provider?.businessNumber && (
                <p className="text-sm text-gray-500">{invoice.provider.businessNumber}</p>
              )}
              <p className="text-sm text-gray-500">{invoice.provider?.email}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">고객</p>
              <p className="font-semibold text-gray-900">{invoice.client.name}</p>
              {invoice.client.businessNumber && (
                <p className="text-sm text-gray-500">{invoice.client.businessNumber}</p>
              )}
              <p className="text-sm text-gray-500">{invoice.client.email}</p>
            </div>
          </div>

          {/* 결제 정보 */}
          {invoice.paymentStatus !== 'paid' && paymentInfo.account_number && (
            <div className="p-6 border-b border-gray-200 bg-orange-50">
              <h2 className="font-semibold text-orange-800 mb-4">입금 정보</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">은행</span>
                  <span className="font-medium text-gray-900">{paymentInfo.bank_name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">계좌번호</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 font-mono">
                      {paymentInfo.account_number}
                    </span>
                    <button
                      onClick={handleCopyAccount}
                      className="px-2 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700"
                    >
                      {copied ? '복사됨!' : '복사'}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">예금주</span>
                  <span className="font-medium text-gray-900">{paymentInfo.account_holder}</span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-orange-200">
                  <span className="text-gray-600">납부기한</span>
                  <span className={`font-medium ${invoice.isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                    {formatDate(invoice.dueDate)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 청구 내역 */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900 mb-4">청구 내역</h2>
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b border-gray-200">
                  <th className="pb-3 font-medium">품목</th>
                  <th className="pb-3 font-medium text-center">수량</th>
                  <th className="pb-3 font-medium text-right">단가</th>
                  <th className="pb-3 font-medium text-right">금액</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100">
                    <td className="py-3 text-gray-900">{item.name}</td>
                    <td className="py-3 text-center text-gray-600">{item.quantity}</td>
                    <td className="py-3 text-right text-gray-600">₩{formatCurrency(item.unit_price)}</td>
                    <td className="py-3 text-right font-medium text-gray-900">
                      ₩{formatCurrency(item.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* 합계 */}
            <div className="mt-6 pt-4 border-t border-gray-200 space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>공급가액</span>
                <span>₩{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>부가세 (10%)</span>
                <span>₩{formatCurrency(invoice.taxAmount)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200">
                <span>합계</span>
                <span className="text-orange-600">₩{formatCurrency(invoice.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* 비고 */}
          {invoice.notes && (
            <div className="p-6">
              <h2 className="font-semibold text-gray-900 mb-2">비고</h2>
              <p className="text-gray-600">{invoice.notes}</p>
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

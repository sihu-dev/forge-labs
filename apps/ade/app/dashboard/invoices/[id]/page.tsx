/**
 * 인보이스 상세 페이지
 */

'use client';

import { useState, use } from 'react';
import Link from 'next/link';

// 데모 데이터
const demoInvoice = {
  id: '1',
  documentNumber: 'I-2024-0001',
  status: 'sent',
  title: '웹사이트 리뉴얼 - 계약금',
  items: [
    { id: '1', name: '웹사이트 리뉴얼 - 계약금 (30%)', quantity: 1, unitPrice: 1200000, amount: 1200000 },
  ],
  subtotal: 1200000,
  taxAmount: 120000,
  totalAmount: 1320000,
  dueDate: '2024-12-31',
  paymentStatus: 'pending',
  paymentInfo: {
    bankName: '신한은행',
    accountNumber: '110-123-456789',
    accountHolder: '포지랩스',
  },
  client: {
    name: '(주)테크스타트',
    businessNumber: '123-45-67890',
    email: 'tech@start.com',
  },
  contractId: 'c1',
  contractNumber: 'C-2024-0001',
  createdAt: '2024-12-01T09:00:00Z',
};

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [invoice] = useState(demoInvoice);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('ko-KR').format(amount);
  const formatDate = (date: string) => new Date(date).toLocaleDateString('ko-KR');

  const handleMarkPaid = async () => {
    // TODO: API 호출
    console.log('Mark as paid:', resolvedParams.id, paymentDate);
    setShowPaymentModal(false);
  };

  const handleCreateTaxInvoice = () => {
    // TODO: 세금계산서 발행 페이지로 이동
    console.log('Create tax invoice for:', resolvedParams.id);
  };

  const statusConfig: Record<string, { label: string; color: string }> = {
    draft: { label: '초안', color: 'bg-gray-100 text-gray-600' },
    sent: { label: '발송됨', color: 'bg-blue-100 text-blue-700' },
    viewed: { label: '열람됨', color: 'bg-yellow-100 text-yellow-700' },
  };

  const paymentStatusConfig: Record<string, { label: string; color: string }> = {
    pending: { label: '대기', color: 'bg-yellow-100 text-yellow-700' },
    paid: { label: '결제완료', color: 'bg-green-100 text-green-700' },
    overdue: { label: '연체', color: 'bg-red-100 text-red-700' },
  };

  const isOverdue = invoice.paymentStatus === 'pending' && new Date(invoice.dueDate) < new Date();
  const actualPaymentStatus = isOverdue ? 'overdue' : invoice.paymentStatus;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* 헤더 */}
      <div className="mb-6">
        <Link
          href="/dashboard/invoices"
          className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-4"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          인보이스 목록
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{invoice.title}</h1>
              <span className={`text-sm px-3 py-1 rounded-full ${paymentStatusConfig[actualPaymentStatus]?.color}`}>
                {paymentStatusConfig[actualPaymentStatus]?.label}
              </span>
            </div>
            <p className="text-gray-500 mt-1">{invoice.documentNumber}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              PDF 저장
            </button>
            {invoice.paymentStatus === 'pending' && (
              <button
                onClick={() => setShowPaymentModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                결제 확인
              </button>
            )}
            {invoice.paymentStatus === 'paid' && (
              <button
                onClick={handleCreateTaxInvoice}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                세금계산서 발행
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 연체 경고 */}
      {isOverdue && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800 font-medium">
            이 인보이스는 납부기한({formatDate(invoice.dueDate)})이 지났습니다.
          </p>
        </div>
      )}

      {/* 고객 및 결제 정보 */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">고객 정보</h2>
          <p className="font-medium text-gray-900">{invoice.client.name}</p>
          {invoice.client.businessNumber && (
            <p className="text-sm text-gray-500">{invoice.client.businessNumber}</p>
          )}
          <p className="text-sm text-gray-500">{invoice.client.email}</p>

          {invoice.contractId && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 mb-1">관련 계약서</p>
              <Link
                href={`/dashboard/contracts/${invoice.contractId}` as never}
                className="text-purple-600 hover:underline"
              >
                {invoice.contractNumber}
              </Link>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">결제 정보</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">은행</span>
              <span className="font-medium">{invoice.paymentInfo.bankName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">계좌번호</span>
              <span className="font-medium font-mono">{invoice.paymentInfo.accountNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">예금주</span>
              <span className="font-medium">{invoice.paymentInfo.accountHolder}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-200">
              <span className="text-gray-500">납부기한</span>
              <span className={`font-medium ${isOverdue ? 'text-red-600' : ''}`}>
                {formatDate(invoice.dueDate)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 품목 및 금액 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">청구 내역</h2>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="py-3 text-left text-sm text-gray-500">품목</th>
              <th className="py-3 text-center text-sm text-gray-500 w-24">수량</th>
              <th className="py-3 text-right text-sm text-gray-500 w-32">단가</th>
              <th className="py-3 text-right text-sm text-gray-500 w-32">금액</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item) => (
              <tr key={item.id} className="border-b border-gray-100">
                <td className="py-3 text-gray-900">{item.name}</td>
                <td className="py-3 text-center text-gray-600">{item.quantity}</td>
                <td className="py-3 text-right text-gray-600">₩{formatCurrency(item.unitPrice)}</td>
                <td className="py-3 text-right font-medium">₩{formatCurrency(item.amount)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-200">
              <td colSpan={3} className="py-3 text-gray-600">공급가액</td>
              <td className="py-3 text-right">₩{formatCurrency(invoice.subtotal)}</td>
            </tr>
            <tr>
              <td colSpan={3} className="py-2 text-gray-600">부가세 (10%)</td>
              <td className="py-2 text-right">₩{formatCurrency(invoice.taxAmount)}</td>
            </tr>
            <tr className="border-t border-gray-200">
              <td colSpan={3} className="py-4 font-bold text-gray-900 text-lg">합계</td>
              <td className="py-4 text-right font-bold text-orange-600 text-2xl">
                ₩{formatCurrency(invoice.totalAmount)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* 결제 확인 모달 */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-gray-900 mb-4">결제 확인</h2>
            <p className="text-gray-500 mb-4">입금 확인일을 선택하세요</p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                입금일
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="p-4 bg-green-50 rounded-lg mb-6">
              <p className="text-green-800">
                <span className="font-medium">₩{formatCurrency(invoice.totalAmount)}</span> 입금 확인
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleMarkPaid}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 인보이스 템플릿
 */

'use client';

import type { Invoice, DocumentTheme } from '../types';

interface InvoiceTemplateProps {
  data: Invoice;
  theme?: DocumentTheme;
  onPaymentConfirm?: () => void;
}

export function InvoiceTemplate({
  data,
  theme = { primaryColor: '#10B981' },
  onPaymentConfirm,
}: InvoiceTemplateProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const isPastDue = new Date(data.dueDate) < new Date();
  const isPaid = data.paymentStatus === 'paid';
  const remainingAmount = data.totalAmount - data.paidAmount;

  return (
    <div className="min-h-screen py-8 px-4 bg-gray-50">
      <div className="max-w-3xl mx-auto">
        <div
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
          style={{ borderTop: `4px solid ${theme.primaryColor}` }}
        >
          {/* 헤더 */}
          <div className="p-8 border-b border-gray-100">
            <div className="flex justify-between items-start">
              <div>
                <h1
                  className="text-3xl font-bold"
                  style={{ color: theme.primaryColor }}
                >
                  인보이스
                </h1>
                <p className="text-gray-500 mt-1">{data.documentNumber}</p>
              </div>
              <PaymentStatusBadge
                status={data.paymentStatus}
                isPastDue={isPastDue}
              />
            </div>

            {/* 제목 */}
            <h2 className="text-xl font-semibold text-gray-900 mt-6">
              {data.title}
            </h2>

            {/* 수신자 정보 */}
            <div className="mt-6">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">
                청구 대상
              </p>
              <p className="font-semibold text-gray-900">{data.client.name}</p>
              {data.client.businessNumber && (
                <p className="text-gray-500 text-sm">
                  사업자번호: {data.client.businessNumber}
                </p>
              )}
              {data.client.email && (
                <p className="text-gray-500 text-sm">{data.client.email}</p>
              )}
            </div>

            {/* 날짜 정보 */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                  발행일
                </p>
                <p className="text-gray-900">{formatDate(data.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                  결제 기한
                </p>
                <p className={isPastDue && !isPaid ? 'text-red-600 font-medium' : 'text-gray-900'}>
                  {formatDate(data.dueDate)}
                  {isPastDue && !isPaid && ' (기한 초과)'}
                </p>
              </div>
            </div>
          </div>

          {/* 품목 테이블 */}
          <div className="p-8">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="py-3 text-left text-xs text-gray-500 uppercase">품목</th>
                  <th className="py-3 text-center text-xs text-gray-500 uppercase w-20">수량</th>
                  <th className="py-3 text-right text-xs text-gray-500 uppercase w-28">단가</th>
                  <th className="py-3 text-right text-xs text-gray-500 uppercase w-32">금액</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100">
                    <td className="py-4">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      {item.description && (
                        <p className="text-sm text-gray-500">{item.description}</p>
                      )}
                    </td>
                    <td className="py-4 text-center text-gray-600">
                      {item.quantity} {item.unit || '개'}
                    </td>
                    <td className="py-4 text-right text-gray-600">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="py-4 text-right font-medium text-gray-900">
                      {formatCurrency(item.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* 합계 */}
            <div className="mt-8 flex justify-end">
              <div className="w-72">
                <div className="flex justify-between py-2 text-gray-600">
                  <span>공급가액</span>
                  <span>{formatCurrency(data.subtotal)}</span>
                </div>
                <div className="flex justify-between py-2 text-gray-600">
                  <span>부가세 (10%)</span>
                  <span>{formatCurrency(data.taxAmount)}</span>
                </div>
                <div className="flex justify-between py-2 text-gray-600 border-t">
                  <span>청구 총액</span>
                  <span className="font-medium">{formatCurrency(data.totalAmount)}</span>
                </div>
                {data.paidAmount > 0 && (
                  <div className="flex justify-between py-2 text-green-600">
                    <span>결제 완료</span>
                    <span>- {formatCurrency(data.paidAmount)}</span>
                  </div>
                )}
                <div
                  className="flex justify-between py-3 text-xl font-bold border-t-2 mt-2"
                  style={{
                    borderColor: theme.primaryColor,
                    color: isPaid ? '#22C55E' : theme.primaryColor
                  }}
                >
                  <span>{isPaid ? '결제 완료' : '결제 금액'}</span>
                  <span>{formatCurrency(remainingAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 결제 정보 */}
          {!isPaid && (
            <div className="px-8 pb-8">
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">
                  결제 정보
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">은행</span>
                    <span className="text-gray-900">{data.paymentInfo.bankName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">계좌번호</span>
                    <span className="text-gray-900 font-mono">
                      {data.paymentInfo.accountNumber}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">예금주</span>
                    <span className="text-gray-900">{data.paymentInfo.accountHolder}</span>
                  </div>
                </div>

                {onPaymentConfirm && (
                  <button
                    onClick={onPaymentConfirm}
                    className="w-full mt-6 py-3 rounded-lg font-medium text-white"
                    style={{ backgroundColor: theme.primaryColor }}
                  >
                    결제 완료 알림
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 비고 */}
          {data.notes && (
            <div className="px-8 pb-8">
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <p className="text-sm text-yellow-800">{data.notes}</p>
              </div>
            </div>
          )}

          {/* 푸터 */}
          <div className="px-8 py-6 bg-gray-50 text-center text-sm text-gray-500">
            본 인보이스는 ADE에서 생성되었습니다
          </div>
        </div>

        {/* PDF 저장 */}
        <div className="mt-6 text-center">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-gray-600 bg-white shadow hover:shadow-md"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            PDF로 저장
          </button>
        </div>
      </div>
    </div>
  );
}

function PaymentStatusBadge({
  status,
  isPastDue
}: {
  status: string;
  isPastDue: boolean;
}) {
  if (status === 'paid') {
    return (
      <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-600">
        결제 완료
      </span>
    );
  }

  if (isPastDue) {
    return (
      <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-600">
        연체
      </span>
    );
  }

  const configs: Record<string, { label: string; className: string }> = {
    pending: { label: '결제 대기', className: 'bg-yellow-100 text-yellow-600' },
    partial: { label: '부분 결제', className: 'bg-blue-100 text-blue-600' },
    overdue: { label: '연체', className: 'bg-red-100 text-red-600' },
  };

  const config = configs[status] || configs.pending;
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}

export default InvoiceTemplate;

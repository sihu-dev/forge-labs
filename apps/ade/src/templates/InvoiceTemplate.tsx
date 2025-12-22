/**
 * ADE - 인보이스 템플릿
 * 결제 가능한 인보이스 페이지
 */

import type { InvoiceData, Theme } from '../types';

interface InvoiceTemplateProps {
  data: InvoiceData;
  theme: Theme;
}

export function InvoiceTemplate({ data, theme }: InvoiceTemplateProps) {
  const {
    invoiceNumber,
    issueDate,
    dueDate,
    from,
    to,
    items,
    subtotal,
    tax,
    total,
    notes,
    paymentInfo,
  } = data;

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

  const isPastDue = new Date(dueDate) < new Date();

  return (
    <div
      className="min-h-screen py-8 px-4"
      style={{ backgroundColor: '#F9FAFB' }}
    >
      <div
        className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden"
        style={{
          borderTop: `4px solid ${theme.primaryColor}`,
        }}
      >
        {/* 헤더 */}
        <div className="p-8 border-b border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <h1
                className="text-3xl font-bold"
                style={{ color: theme.primaryColor }}
              >
                INVOICE
              </h1>
              <p className="text-gray-500 mt-1">#{invoiceNumber}</p>
            </div>
            <div className="text-right">
              <div
                className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  isPastDue
                    ? 'bg-red-100 text-red-600'
                    : 'bg-green-100 text-green-600'
                }`}
              >
                {isPastDue ? '기한 초과' : '결제 대기'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mt-8">
            {/* From */}
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">
                보내는 분
              </p>
              <p className="font-semibold text-gray-900">{from.name}</p>
              {from.company && (
                <p className="text-gray-600">{from.company}</p>
              )}
              {from.email && (
                <p className="text-gray-500 text-sm">{from.email}</p>
              )}
              {from.phone && (
                <p className="text-gray-500 text-sm">{from.phone}</p>
              )}
              {from.taxId && (
                <p className="text-gray-500 text-sm">
                  사업자번호: {from.taxId}
                </p>
              )}
            </div>

            {/* To */}
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">
                받는 분
              </p>
              <p className="font-semibold text-gray-900">{to.name}</p>
              {to.company && <p className="text-gray-600">{to.company}</p>}
              {to.email && (
                <p className="text-gray-500 text-sm">{to.email}</p>
              )}
              {to.phone && (
                <p className="text-gray-500 text-sm">{to.phone}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mt-6">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                발행일
              </p>
              <p className="text-gray-900">{formatDate(issueDate)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                결제 기한
              </p>
              <p className={isPastDue ? 'text-red-600 font-medium' : 'text-gray-900'}>
                {formatDate(dueDate)}
              </p>
            </div>
          </div>
        </div>

        {/* 항목 테이블 */}
        <div className="p-8">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 text-xs text-gray-400 uppercase tracking-wider">
                  항목
                </th>
                <th className="text-center py-3 text-xs text-gray-400 uppercase tracking-wider w-20">
                  수량
                </th>
                <th className="text-right py-3 text-xs text-gray-400 uppercase tracking-wider w-32">
                  단가
                </th>
                <th className="text-right py-3 text-xs text-gray-400 uppercase tracking-wider w-32">
                  금액
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-gray-100">
                  <td className="py-4 text-gray-900">{item.description}</td>
                  <td className="py-4 text-center text-gray-600">
                    {item.quantity}
                  </td>
                  <td className="py-4 text-right text-gray-600">
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td className="py-4 text-right text-gray-900 font-medium">
                    {formatCurrency(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 합계 */}
          <div className="mt-8 flex justify-end">
            <div className="w-64">
              <div className="flex justify-between py-2 text-gray-600">
                <span>소계</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {tax > 0 && (
                <div className="flex justify-between py-2 text-gray-600">
                  <span>부가세 (10%)</span>
                  <span>{formatCurrency(tax)}</span>
                </div>
              )}
              <div
                className="flex justify-between py-3 text-xl font-bold border-t-2 mt-2"
                style={{
                  borderColor: theme.primaryColor,
                  color: theme.primaryColor,
                }}
              >
                <span>총액</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 결제 정보 */}
        {paymentInfo && (
          <div className="px-8 pb-8">
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">
                결제 정보
              </h3>

              {paymentInfo.bankName && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">은행</span>
                    <span className="text-gray-900">{paymentInfo.bankName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">계좌번호</span>
                    <span className="text-gray-900 font-mono">
                      {paymentInfo.accountNumber}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">예금주</span>
                    <span className="text-gray-900">{paymentInfo.accountHolder}</span>
                  </div>
                </div>
              )}

              {/* 온라인 결제 버튼 */}
              {paymentInfo.enableOnlinePayment && (
                <div className="mt-6 space-y-3">
                  <button
                    className="w-full py-3 rounded-lg font-medium text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
                    style={{ backgroundColor: theme.primaryColor }}
                  >
                    카드로 결제하기
                  </button>
                  <button
                    className="w-full py-3 rounded-lg font-medium border-2 transition-transform hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      borderColor: theme.primaryColor,
                      color: theme.primaryColor,
                    }}
                  >
                    계좌이체로 결제하기
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 비고 */}
        {notes && (
          <div className="px-8 pb-8">
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <p className="text-sm text-yellow-800">{notes}</p>
            </div>
          </div>
        )}

        {/* 푸터 */}
        <div className="px-8 py-6 bg-gray-50 text-center text-sm text-gray-500">
          <p>본 인보이스는 ADE로 생성되었습니다</p>
          <p className="mt-1">문의: {from.email || from.phone}</p>
        </div>
      </div>
    </div>
  );
}

export default InvoiceTemplate;

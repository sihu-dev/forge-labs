/**
 * 견적서 템플릿
 */

'use client';

import type { Quote, DocumentTheme } from '../types';

interface QuoteTemplateProps {
  data: Quote;
  theme?: DocumentTheme;
  onApprove?: () => void;
  onReject?: () => void;
}

export function QuoteTemplate({
  data,
  theme = { primaryColor: '#3B82F6' },
  onApprove,
  onReject,
}: QuoteTemplateProps) {
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

  const isExpired = new Date(data.validUntil) < new Date();
  const canRespond = data.status === 'sent' && !isExpired;

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
                  견적서
                </h1>
                <p className="text-gray-500 mt-1">{data.documentNumber}</p>
              </div>
              <StatusBadge status={data.status} isExpired={isExpired} />
            </div>

            {/* 제목 */}
            <div
              className="mt-6 p-4 rounded-lg"
              style={{ backgroundColor: `${theme.primaryColor}08` }}
            >
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                프로젝트
              </p>
              <h2 className="text-xl font-semibold text-gray-900">
                {data.title}
              </h2>
            </div>

            {/* 수신자 정보 */}
            <div className="mt-6">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">
                수신
              </p>
              <p className="font-semibold text-gray-900">{data.client.name}</p>
              {data.client.representativeName && (
                <p className="text-gray-600">{data.client.representativeName} 귀하</p>
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
                  유효기간
                </p>
                <p className={isExpired ? 'text-red-600' : 'text-gray-900'}>
                  {formatDate(data.validUntil)}
                  {isExpired && ' (만료)'}
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
              <div className="w-64">
                <div className="flex justify-between py-2 text-gray-600">
                  <span>공급가액</span>
                  <span>{formatCurrency(data.subtotal)}</span>
                </div>
                <div className="flex justify-between py-2 text-gray-600">
                  <span>부가세 (10%)</span>
                  <span>{formatCurrency(data.taxAmount)}</span>
                </div>
                <div
                  className="flex justify-between py-3 text-xl font-bold border-t-2 mt-2"
                  style={{ borderColor: theme.primaryColor, color: theme.primaryColor }}
                >
                  <span>총 견적금액</span>
                  <span>{formatCurrency(data.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 조건 */}
          {(data.paymentTerms || data.deliveryTerms || data.notes) && (
            <div className="px-8 pb-8">
              <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                {data.paymentTerms && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase mb-1">결제 조건</p>
                    <p className="text-gray-700">{data.paymentTerms}</p>
                  </div>
                )}
                {data.deliveryTerms && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase mb-1">납품 조건</p>
                    <p className="text-gray-700">{data.deliveryTerms}</p>
                  </div>
                )}
                {data.notes && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase mb-1">비고</p>
                    <p className="text-gray-700">{data.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 승인/거절 버튼 */}
          {canRespond && (
            <div className="px-8 pb-8 flex gap-4">
              {onReject && (
                <button
                  onClick={onReject}
                  className="flex-1 py-3 rounded-lg font-medium border-2 border-gray-300 text-gray-600 hover:bg-gray-50"
                >
                  거절하기
                </button>
              )}
              {onApprove && (
                <button
                  onClick={onApprove}
                  className="flex-1 py-3 rounded-lg font-medium text-white"
                  style={{ backgroundColor: theme.primaryColor }}
                >
                  견적 승인하기
                </button>
              )}
            </div>
          )}

          {/* 푸터 */}
          <div className="px-8 py-6 bg-gray-50 text-center text-sm text-gray-500">
            본 견적서는 ADE에서 생성되었습니다
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

function StatusBadge({ status, isExpired }: { status: string; isExpired: boolean }) {
  if (isExpired && status === 'sent') {
    return (
      <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-600">
        만료됨
      </span>
    );
  }

  const configs: Record<string, { label: string; className: string }> = {
    draft: { label: '초안', className: 'bg-gray-100 text-gray-600' },
    sent: { label: '발송됨', className: 'bg-blue-100 text-blue-600' },
    viewed: { label: '열람됨', className: 'bg-purple-100 text-purple-600' },
    approved: { label: '승인됨', className: 'bg-green-100 text-green-600' },
    rejected: { label: '거절됨', className: 'bg-red-100 text-red-600' },
  };

  const config = configs[status] || configs.draft;
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}

export default QuoteTemplate;

/**
 * ADE - 견적서 템플릿
 * 승인 가능한 견적서 페이지
 */

import type { QuoteData, Theme } from '../types';

interface QuoteTemplateProps {
  data: QuoteData;
  theme: Theme;
}

export function QuoteTemplate({ data, theme }: QuoteTemplateProps) {
  const {
    quoteNumber,
    issueDate,
    validUntil,
    from,
    to,
    projectName,
    description,
    items,
    subtotal,
    tax,
    total,
    terms,
    timeline,
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

  const isExpired = new Date(validUntil) < new Date();

  return (
    <div
      className="min-h-screen py-8 px-4"
      style={{ backgroundColor: '#F9FAFB' }}
    >
      <div className="max-w-3xl mx-auto">
        {/* 메인 카드 */}
        <div
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
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
                  견적서
                </h1>
                <p className="text-gray-500 mt-1">#{quoteNumber}</p>
              </div>
              <div className="text-right">
                <div
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    isExpired
                      ? 'bg-gray-100 text-gray-600'
                      : 'bg-blue-100 text-blue-600'
                  }`}
                >
                  {isExpired ? '기한 만료' : '유효'}
                </div>
              </div>
            </div>

            {/* 프로젝트명 */}
            <div
              className="mt-6 p-4 rounded-lg"
              style={{ backgroundColor: `${theme.primaryColor}08` }}
            >
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                프로젝트
              </p>
              <h2
                className="text-xl font-semibold"
                style={{ color: theme.textColor }}
              >
                {projectName}
              </h2>
              {description && (
                <p className="text-gray-600 mt-2 text-sm">{description}</p>
              )}
            </div>

            {/* 발신/수신 정보 */}
            <div className="grid grid-cols-2 gap-8 mt-6">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">
                  발신
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
              </div>

              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">
                  수신
                </p>
                <p className="font-semibold text-gray-900">{to.name}</p>
                {to.company && <p className="text-gray-600">{to.company}</p>}
                {to.email && (
                  <p className="text-gray-500 text-sm">{to.email}</p>
                )}
              </div>
            </div>

            {/* 날짜 정보 */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                  발행일
                </p>
                <p className="text-gray-900">{formatDate(issueDate)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                  유효기간
                </p>
                <p className={isExpired ? 'text-gray-400' : 'text-gray-900'}>
                  {formatDate(validUntil)}
                </p>
              </div>
              {timeline && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                    예상 기간
                  </p>
                  <p className="text-gray-900">{timeline}</p>
                </div>
              )}
            </div>
          </div>

          {/* 견적 항목 */}
          <div className="p-8">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">
              견적 내역
            </h3>

            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      {item.category && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: `${theme.primaryColor}15`,
                            color: theme.primaryColor,
                          }}
                        >
                          {item.category}
                        </span>
                      )}
                      <h4 className="font-medium text-gray-900 mt-1">
                        {item.description}
                      </h4>
                      {item.details && (
                        <p className="text-sm text-gray-500 mt-1">
                          {item.details}
                        </p>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(item.amount)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 합계 */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex justify-end">
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
                    <span>총 견적금액</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 계약 조건 */}
          {terms && (
            <div className="px-8 pb-8">
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  계약 조건
                </h3>
                <p className="text-sm text-gray-600 whitespace-pre-line">
                  {terms}
                </p>
              </div>
            </div>
          )}

          {/* 액션 버튼 */}
          {!isExpired && (
            <div className="px-8 pb-8">
              <div className="flex gap-4">
                <button
                  className="flex-1 py-3 rounded-lg font-medium text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
                  style={{ backgroundColor: theme.primaryColor }}
                  onClick={() => {
                    // 승인 로직
                    alert('견적서가 승인되었습니다. 담당자에게 알림이 전송됩니다.');
                  }}
                >
                  견적 승인하기
                </button>
                <button
                  className="flex-1 py-3 rounded-lg font-medium border-2 transition-transform hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    borderColor: theme.primaryColor,
                    color: theme.primaryColor,
                  }}
                  onClick={() => {
                    // 문의 로직
                    window.location.href = `mailto:${from.email}?subject=견적서 문의: ${quoteNumber}`;
                  }}
                >
                  문의하기
                </button>
              </div>
            </div>
          )}

          {/* 푸터 */}
          <div className="px-8 py-6 bg-gray-50 text-center text-sm text-gray-500">
            <p>본 견적서는 ADE로 생성되었습니다</p>
            <p className="mt-1">
              문의: {from.email} | {from.phone}
            </p>
          </div>
        </div>

        {/* PDF 다운로드 버튼 */}
        <div className="mt-6 text-center">
          <button
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-gray-600 bg-white shadow hover:shadow-md transition-shadow"
            onClick={() => {
              // PDF 다운로드 로직
              window.print();
            }}
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

export default QuoteTemplate;

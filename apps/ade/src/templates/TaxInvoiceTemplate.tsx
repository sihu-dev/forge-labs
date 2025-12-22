/**
 * 세금계산서 템플릿
 * 국세청 표준 양식 기반
 */

'use client';

import type { TaxInvoice, DocumentTheme } from '../types';

interface TaxInvoiceTemplateProps {
  data: TaxInvoice;
  theme?: DocumentTheme;
}

export function TaxInvoiceTemplate({
  data,
  theme = { primaryColor: '#F59E0B' },
}: TaxInvoiceTemplateProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      year: date.getFullYear(),
      month: String(date.getMonth() + 1).padStart(2, '0'),
      day: String(date.getDate()).padStart(2, '0'),
    };
  };

  const issueDate = formatDate(data.issueDate);

  return (
    <div className="min-h-screen py-8 px-4 bg-gray-100">
      <div className="max-w-4xl mx-auto">
        {/* 세금계산서 양식 */}
        <div className="bg-white border-2 border-gray-800 shadow-xl">
          {/* 제목 */}
          <div className="text-center py-4 border-b-2 border-gray-800 bg-amber-50">
            <h1 className="text-2xl font-bold tracking-widest">
              전 자 세 금 계 산 서
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              (공급자 보관용)
            </p>
          </div>

          {/* 승인번호 및 날짜 */}
          <div className="flex border-b border-gray-400">
            <div className="flex-1 p-3 border-r border-gray-400">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-600">승인번호</span>
                <span className="font-mono text-sm">
                  {data.ntsSubmission?.approvalNumber || '발급 전'}
                </span>
              </div>
            </div>
            <div className="p-3">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-600">작성일자</span>
                <span className="font-mono">
                  {issueDate.year}년 {issueDate.month}월 {issueDate.day}일
                </span>
              </div>
            </div>
          </div>

          {/* 공급자 / 공급받는자 */}
          <div className="grid grid-cols-2 border-b border-gray-400">
            {/* 공급자 */}
            <div className="border-r border-gray-400">
              <div className="bg-blue-50 px-3 py-2 border-b border-gray-400 text-center font-medium">
                공급자
              </div>
              <div className="divide-y divide-gray-300">
                <InfoRow label="등록번호" value={formatBusinessNumber(data.provider.businessNumber)} />
                <InfoRow label="상호" value={data.provider.name} />
                <InfoRow label="대표자" value={data.provider.representativeName} />
                <InfoRow label="사업장" value={data.provider.address} />
                <div className="flex">
                  <InfoRow label="업태" value={data.provider.businessType} half />
                  <InfoRow label="종목" value={data.provider.businessCategory} half />
                </div>
                <InfoRow label="이메일" value={data.provider.email} />
              </div>
            </div>

            {/* 공급받는자 */}
            <div>
              <div className="bg-green-50 px-3 py-2 border-b border-gray-400 text-center font-medium">
                공급받는자
              </div>
              <div className="divide-y divide-gray-300">
                <InfoRow label="등록번호" value={formatBusinessNumber(data.client.businessNumber || '')} />
                <InfoRow label="상호" value={data.client.name} />
                <InfoRow label="대표자" value={data.client.representativeName || ''} />
                <InfoRow label="사업장" value={data.client.address || ''} />
                <div className="flex">
                  <InfoRow label="업태" value={data.client.businessType || ''} half />
                  <InfoRow label="종목" value={data.client.businessCategory || ''} half />
                </div>
                <InfoRow label="이메일" value={data.client.email} />
              </div>
            </div>
          </div>

          {/* 품목 테이블 */}
          <div className="border-b border-gray-400">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr className="divide-x divide-gray-400">
                  <th className="py-2 px-2 text-center font-medium w-12">월일</th>
                  <th className="py-2 px-2 text-center font-medium">품목</th>
                  <th className="py-2 px-2 text-center font-medium w-16">규격</th>
                  <th className="py-2 px-2 text-center font-medium w-12">수량</th>
                  <th className="py-2 px-2 text-center font-medium w-24">단가</th>
                  <th className="py-2 px-2 text-center font-medium w-28">공급가액</th>
                  <th className="py-2 px-2 text-center font-medium w-24">세액</th>
                  <th className="py-2 px-2 text-center font-medium w-16">비고</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-300">
                {data.items.map((item) => {
                  const itemDate = formatDate(item.date);
                  return (
                    <tr key={item.id} className="divide-x divide-gray-300">
                      <td className="py-2 px-2 text-center font-mono text-xs">
                        {itemDate.month}/{itemDate.day}
                      </td>
                      <td className="py-2 px-2">{item.name}</td>
                      <td className="py-2 px-2 text-center text-xs">
                        {item.specification || '-'}
                      </td>
                      <td className="py-2 px-2 text-center">{item.quantity}</td>
                      <td className="py-2 px-2 text-right font-mono">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="py-2 px-2 text-right font-mono">
                        {formatCurrency(item.supplyAmount)}
                      </td>
                      <td className="py-2 px-2 text-right font-mono">
                        {formatCurrency(item.taxAmount)}
                      </td>
                      <td className="py-2 px-2 text-center text-xs">
                        {item.notes || ''}
                      </td>
                    </tr>
                  );
                })}
                {/* 빈 행 채우기 (최소 4행) */}
                {Array.from({ length: Math.max(0, 4 - data.items.length) }).map((_, i) => (
                  <tr key={`empty-${i}`} className="divide-x divide-gray-300 h-8">
                    <td className="py-2 px-2"></td>
                    <td className="py-2 px-2"></td>
                    <td className="py-2 px-2"></td>
                    <td className="py-2 px-2"></td>
                    <td className="py-2 px-2"></td>
                    <td className="py-2 px-2"></td>
                    <td className="py-2 px-2"></td>
                    <td className="py-2 px-2"></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 합계 */}
          <div className="grid grid-cols-3 border-b border-gray-400">
            <div className="border-r border-gray-400 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">합계금액</span>
                <span className="text-lg font-bold" style={{ color: theme.primaryColor }}>
                  ₩ {formatCurrency(data.totalAmount)}
                </span>
              </div>
            </div>
            <div className="border-r border-gray-400 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">공급가액</span>
                <span className="font-mono">₩ {formatCurrency(data.subtotal)}</span>
              </div>
            </div>
            <div className="p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">세액</span>
                <span className="font-mono">₩ {formatCurrency(data.taxAmount)}</span>
              </div>
            </div>
          </div>

          {/* 금액 한글 표기 */}
          <div className="p-3 border-b border-gray-400 bg-gray-50">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">
                이 금액을 (영수 / 청구) 함
              </span>
            </div>
          </div>

          {/* 국세청 전송 상태 */}
          {data.ntsSubmission && (
            <div className="p-4 bg-amber-50 border-b border-gray-400">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <NtsStatusIcon status={data.ntsSubmission.status} />
                  <span className="text-sm font-medium">
                    {getNtsStatusLabel(data.ntsSubmission.status)}
                  </span>
                </div>
                {data.ntsSubmission.submittedAt && (
                  <span className="text-sm text-gray-500">
                    전송일: {new Date(data.ntsSubmission.submittedAt).toLocaleDateString('ko-KR')}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* 푸터 */}
          <div className="px-4 py-3 text-center text-xs text-gray-500">
            본 세금계산서는 ADE에서 생성되었습니다 | 전자세금계산서는 국세청 홈택스에서 조회 가능합니다
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="mt-6 flex justify-center gap-4">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-gray-600 bg-white shadow hover:shadow-md"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            인쇄
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  half = false,
}: {
  label: string;
  value: string;
  half?: boolean;
}) {
  return (
    <div className={`flex ${half ? 'flex-1 border-r border-gray-300 last:border-r-0' : ''}`}>
      <div className="w-16 px-2 py-1.5 bg-gray-50 text-xs font-medium text-gray-600 flex-shrink-0">
        {label}
      </div>
      <div className="flex-1 px-2 py-1.5 text-sm truncate">{value}</div>
    </div>
  );
}

function formatBusinessNumber(num: string): string {
  if (!num) return '';
  const cleaned = num.replace(/\D/g, '');
  if (cleaned.length !== 10) return num;
  return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5)}`;
}

function NtsStatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'approved':
      return (
        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      );
    case 'submitted':
      return (
        <svg className="w-5 h-5 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      );
    case 'rejected':
      return (
        <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      );
    default:
      return (
        <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
      );
  }
}

function getNtsStatusLabel(status: string): string {
  switch (status) {
    case 'approved':
      return '국세청 승인 완료';
    case 'submitted':
      return '국세청 전송 중';
    case 'rejected':
      return '국세청 반려';
    default:
      return '전송 대기';
  }
}

export default TaxInvoiceTemplate;

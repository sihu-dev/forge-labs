/**
 * 계약서 템플릿
 */

'use client';

import { useRef } from 'react';
import type { Contract, DocumentTheme } from '../types';

interface ContractTemplateProps {
  data: Contract;
  theme?: DocumentTheme;
  onSign?: (signatureImage: string) => void;
}

export function ContractTemplate({
  data,
  theme = { primaryColor: '#8B5CF6' },
  onSign,
}: ContractTemplateProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  const isSigned = !!data.signatures.client?.signedAt;
  const canSign = data.status === 'sent' && !isSigned;

  return (
    <div className="min-h-screen py-8 px-4 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
          style={{ borderTop: `4px solid ${theme.primaryColor}` }}
        >
          {/* 헤더 */}
          <div className="p-8 text-center border-b border-gray-100">
            <h1
              className="text-3xl font-bold"
              style={{ color: theme.primaryColor }}
            >
              용역 계약서
            </h1>
            <p className="text-gray-500 mt-2">{data.documentNumber}</p>
            <div className="mt-4">
              <StatusBadge status={data.status} isSigned={isSigned} />
            </div>
          </div>

          {/* 계약 개요 */}
          <div className="p-8 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {data.projectName}
            </h2>
            {data.projectDescription && (
              <p className="text-gray-600">{data.projectDescription}</p>
            )}

            <div className="grid grid-cols-2 gap-8 mt-6">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                  계약 기간
                </p>
                <p className="text-gray-900">
                  {formatDate(data.startDate)} ~ {formatDate(data.endDate)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                  계약 금액
                </p>
                <p className="text-xl font-bold" style={{ color: theme.primaryColor }}>
                  {formatCurrency(data.totalAmount)}
                </p>
              </div>
            </div>
          </div>

          {/* 당사자 정보 */}
          <div className="p-8 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">계약 당사자</h3>
            <div className="grid grid-cols-2 gap-8">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-400 uppercase mb-2">&quot;갑&quot; (수급인)</p>
                <p className="font-semibold text-gray-900">{data.client.name}</p>
                {data.client.representativeName && (
                  <p className="text-gray-600">대표: {data.client.representativeName}</p>
                )}
                {data.client.businessNumber && (
                  <p className="text-gray-500 text-sm">
                    사업자번호: {data.client.businessNumber}
                  </p>
                )}
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-400 uppercase mb-2">&quot;을&quot; (공급인)</p>
                <p className="font-semibold text-gray-900">발송자 정보</p>
                <p className="text-gray-500 text-sm">(사업자 설정에서 불러옴)</p>
              </div>
            </div>
          </div>

          {/* 품목 */}
          <div className="p-8 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">계약 내역</h3>
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="py-3 text-left text-xs text-gray-500 uppercase">항목</th>
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
                    <td className="py-4 text-right font-medium text-gray-900">
                      {formatCurrency(item.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-900">
                  <td className="py-4 font-bold text-gray-900">합계 (VAT 별도)</td>
                  <td className="py-4 text-right font-bold" style={{ color: theme.primaryColor }}>
                    {formatCurrency(data.subtotal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* 결제 일정 */}
          <div className="p-8 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">결제 일정</h3>
            <div className="space-y-3">
              {data.paymentSchedule.map((schedule) => (
                <div
                  key={schedule.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                      style={{ backgroundColor: theme.primaryColor }}
                    >
                      {schedule.percentage}%
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{schedule.name}</p>
                      <p className="text-sm text-gray-500">
                        {formatDate(schedule.dueDate)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(schedule.amount)}
                    </p>
                    <PaymentScheduleStatus status={schedule.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 계약 조항 */}
          <div className="p-8 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">계약 조항</h3>
            <div className="space-y-6">
              {data.clauses.map((clause) => (
                <div key={clause.id}>
                  <h4 className="font-medium text-gray-900 mb-2">
                    제{clause.order}조 ({clause.title})
                  </h4>
                  <p className="text-gray-600 pl-4 border-l-2 border-gray-200">
                    {clause.content}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 서명 영역 */}
          <div className="p-8 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">서명</h3>
            <div className="grid grid-cols-2 gap-8">
              {/* 공급자 서명 */}
              <div className="p-6 border-2 border-dashed border-gray-200 rounded-lg text-center">
                <p className="text-xs text-gray-400 uppercase mb-2">&quot;을&quot; 서명</p>
                {data.signatures.provider ? (
                  <div>
                    <p className="font-medium text-gray-900">
                      {data.signatures.provider.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDate(data.signatures.provider.signedAt)}
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-400">서명 대기</p>
                )}
              </div>

              {/* 고객 서명 */}
              <div className="p-6 border-2 border-dashed border-gray-200 rounded-lg text-center">
                <p className="text-xs text-gray-400 uppercase mb-2">&quot;갑&quot; 서명</p>
                {data.signatures.client ? (
                  <div>
                    <p className="font-medium text-gray-900">
                      {data.signatures.client.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDate(data.signatures.client.signedAt)}
                    </p>
                  </div>
                ) : canSign ? (
                  <div>
                    <canvas
                      ref={canvasRef}
                      width={300}
                      height={100}
                      className="border border-gray-300 rounded bg-white mx-auto"
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      위에 서명해 주세요
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-400">서명 대기</p>
                )}
              </div>
            </div>

            {canSign && onSign && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => {
                    const canvas = canvasRef.current;
                    if (canvas) {
                      const signatureImage = canvas.toDataURL();
                      onSign(signatureImage);
                    }
                  }}
                  className="px-8 py-3 rounded-lg font-medium text-white"
                  style={{ backgroundColor: theme.primaryColor }}
                >
                  계약서 서명하기
                </button>
              </div>
            )}
          </div>

          {/* 푸터 */}
          <div className="px-8 py-6 bg-gray-50 text-center text-sm text-gray-500">
            본 계약서는 ADE에서 생성되었습니다
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

function StatusBadge({ status, isSigned }: { status: string; isSigned: boolean }) {
  if (isSigned) {
    return (
      <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-600">
        서명 완료
      </span>
    );
  }

  const configs: Record<string, { label: string; className: string }> = {
    draft: { label: '초안', className: 'bg-gray-100 text-gray-600' },
    sent: { label: '서명 대기', className: 'bg-yellow-100 text-yellow-600' },
    approved: { label: '체결됨', className: 'bg-green-100 text-green-600' },
    rejected: { label: '거절됨', className: 'bg-red-100 text-red-600' },
    cancelled: { label: '취소됨', className: 'bg-gray-100 text-gray-600' },
  };

  const config = configs[status] || configs.draft;
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}

function PaymentScheduleStatus({ status }: { status: string }) {
  const configs: Record<string, { label: string; className: string }> = {
    pending: { label: '예정', className: 'text-gray-500' },
    paid: { label: '완료', className: 'text-green-600' },
    overdue: { label: '연체', className: 'text-red-600' },
  };

  const config = configs[status] || configs.pending;
  return <p className={`text-sm ${config.className}`}>{config.label}</p>;
}

export default ContractTemplate;

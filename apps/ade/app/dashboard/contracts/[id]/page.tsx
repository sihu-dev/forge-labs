/**
 * 계약서 상세/편집 페이지
 */

'use client';

import { useState, use } from 'react';
import Link from 'next/link';

// 데모 데이터
const demoContract = {
  id: '1',
  documentNumber: 'C-2024-0001',
  status: 'approved',
  title: '웹사이트 리뉴얼 계약서',
  projectName: '웹사이트 리뉴얼',
  projectDescription: '기존 웹사이트의 전면 리뉴얼 프로젝트',
  items: [
    { id: '1', name: '기획/설계', quantity: 1, unitPrice: 500000, amount: 500000 },
    { id: '2', name: 'UI/UX 디자인', quantity: 1, unitPrice: 1500000, amount: 1500000 },
    { id: '3', name: '프론트엔드 개발', quantity: 1, unitPrice: 2000000, amount: 2000000 },
  ],
  subtotal: 4000000,
  taxAmount: 400000,
  totalAmount: 4400000,
  startDate: '2024-12-01',
  endDate: '2024-12-31',
  paymentSchedule: [
    { id: 'ps1', name: '계약금', percentage: 30, amount: 1320000, dueDate: '2024-12-01', status: 'paid' },
    { id: 'ps2', name: '잔금', percentage: 70, amount: 3080000, dueDate: '2024-12-31', status: 'pending' },
  ],
  clauses: [
    { id: 'cl1', order: 1, title: '계약의 목적', content: '본 계약은 웹사이트 리뉴얼 프로젝트의 수행에 관한 사항을 정함을 목적으로 합니다.' },
    { id: 'cl2', order: 2, title: '계약 기간', content: '계약 기간은 계약 체결일로부터 프로젝트 완료일까지로 합니다.' },
    { id: 'cl3', order: 3, title: '대금 지급', content: '대금은 계약금과 잔금으로 나누어 지급하며, 세부 일정은 결제 일정에 따릅니다.' },
  ],
  client: {
    name: '(주)테크스타트',
    businessNumber: '123-45-67890',
    email: 'tech@start.com',
  },
  signedAt: '2024-12-01T10:00:00Z',
};

export default function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [contract] = useState(demoContract);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('ko-KR').format(amount);
  const formatDate = (date: string) => new Date(date).toLocaleDateString('ko-KR');

  const handleCreateInvoice = async () => {
    if (!selectedScheduleId) return;

    // TODO: API 호출
    console.log('Create invoice for schedule:', selectedScheduleId, 'contract:', resolvedParams.id);
    setShowInvoiceModal(false);
    setSelectedScheduleId(null);
  };

  const statusConfig: Record<string, { label: string; color: string }> = {
    draft: { label: '초안', color: 'bg-gray-100 text-gray-600' },
    sent: { label: '서명 대기', color: 'bg-yellow-100 text-yellow-700' },
    approved: { label: '체결됨', color: 'bg-green-100 text-green-700' },
    completed: { label: '완료', color: 'bg-blue-100 text-blue-700' },
  };

  const paymentStatusConfig: Record<string, { label: string; color: string }> = {
    pending: { label: '대기', color: 'text-gray-500' },
    invoiced: { label: '청구됨', color: 'text-blue-600' },
    paid: { label: '완료', color: 'text-green-600' },
    overdue: { label: '연체', color: 'text-red-600' },
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* 헤더 */}
      <div className="mb-6">
        <Link
          href="/dashboard/contracts"
          className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-4"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          계약서 목록
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{contract.projectName}</h1>
              <span className={`text-sm px-3 py-1 rounded-full ${statusConfig[contract.status]?.color}`}>
                {statusConfig[contract.status]?.label}
              </span>
            </div>
            <p className="text-gray-500 mt-1">{contract.documentNumber}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              PDF 저장
            </button>
            <button
              onClick={() => setShowInvoiceModal(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              인보이스 발행
            </button>
          </div>
        </div>
      </div>

      {/* 고객 정보 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">계약 당사자</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 uppercase mb-2">고객 (갑)</p>
            <p className="font-semibold text-gray-900">{contract.client.name}</p>
            {contract.client.businessNumber && (
              <p className="text-sm text-gray-500">{contract.client.businessNumber}</p>
            )}
            <p className="text-sm text-gray-500">{contract.client.email}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 uppercase mb-2">기간</p>
            <p className="font-semibold text-gray-900">
              {formatDate(contract.startDate)} ~ {formatDate(contract.endDate)}
            </p>
            {contract.signedAt && (
              <p className="text-sm text-green-600 mt-1">
                {formatDate(contract.signedAt)} 체결
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 품목 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">계약 내역</h2>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="py-3 text-left text-sm text-gray-500">품목</th>
              <th className="py-3 text-right text-sm text-gray-500 w-32">금액</th>
            </tr>
          </thead>
          <tbody>
            {contract.items.map((item) => (
              <tr key={item.id} className="border-b border-gray-100">
                <td className="py-3 text-gray-900">{item.name}</td>
                <td className="py-3 text-right font-medium">₩{formatCurrency(item.amount)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-200">
              <td className="py-3 text-gray-600">공급가액</td>
              <td className="py-3 text-right">₩{formatCurrency(contract.subtotal)}</td>
            </tr>
            <tr>
              <td className="py-2 text-gray-600">부가세</td>
              <td className="py-2 text-right">₩{formatCurrency(contract.taxAmount)}</td>
            </tr>
            <tr className="border-t border-gray-200">
              <td className="py-3 font-bold text-gray-900">합계</td>
              <td className="py-3 text-right font-bold text-purple-600 text-xl">
                ₩{formatCurrency(contract.totalAmount)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* 결제 일정 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">결제 일정</h2>
        <div className="space-y-3">
          {contract.paymentSchedule.map((schedule) => (
            <div
              key={schedule.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold">
                  {schedule.percentage}%
                </div>
                <div>
                  <p className="font-medium text-gray-900">{schedule.name}</p>
                  <p className="text-sm text-gray-500">{formatDate(schedule.dueDate)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">₩{formatCurrency(schedule.amount)}</p>
                <p className={`text-sm ${paymentStatusConfig[schedule.status]?.color}`}>
                  {paymentStatusConfig[schedule.status]?.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 계약 조항 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">계약 조항</h2>
        <div className="space-y-6">
          {contract.clauses.map((clause) => (
            <div key={clause.id}>
              <h3 className="font-medium text-gray-900 mb-2">
                제{clause.order}조 ({clause.title})
              </h3>
              <p className="text-gray-600 pl-4 border-l-2 border-gray-200">
                {clause.content}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 인보이스 발행 모달 */}
      {showInvoiceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-gray-900 mb-4">인보이스 발행</h2>
            <p className="text-gray-500 mb-4">발행할 결제 일정을 선택하세요</p>

            <div className="space-y-2 mb-6">
              {contract.paymentSchedule
                .filter((s) => s.status === 'pending')
                .map((schedule) => (
                  <label
                    key={schedule.id}
                    className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer ${
                      selectedScheduleId === schedule.id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="schedule"
                      value={schedule.id}
                      checked={selectedScheduleId === schedule.id}
                      onChange={() => setSelectedScheduleId(schedule.id)}
                      className="sr-only"
                    />
                    <span className="font-medium">{schedule.name} ({schedule.percentage}%)</span>
                    <span className="font-semibold">₩{formatCurrency(schedule.amount)}</span>
                  </label>
                ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowInvoiceModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleCreateInvoice}
                disabled={!selectedScheduleId}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                발행하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 계약서 상세/편집 페이지
 */

'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ContractItem {
  id: string;
  name: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

interface PaymentSchedule {
  id: string;
  name: string;
  percentage: number;
  amount: number;
  due_date: string;
  status: string;
}

interface ContractClause {
  id: string;
  order: number;
  title: string;
  content: string;
}

interface Contract {
  id: string;
  document_number: string;
  status: string;
  title: string;
  project_name: string;
  project_description?: string;
  items: ContractItem[];
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  start_date: string;
  end_date: string;
  payment_schedule?: PaymentSchedule[];
  clauses?: ContractClause[];
  signed_at?: string;
  clients?: {
    name: string;
    business_number?: string;
    email: string;
  };
}

interface LinkedInvoice {
  id: string;
  document_number: string;
  title: string;
  total_amount: number;
  payment_status: string;
}

export default function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [contract, setContract] = useState<Contract | null>(null);
  const [linkedInvoices, setLinkedInvoices] = useState<LinkedInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchContract = async () => {
      try {
        const res = await fetch(`/api/contracts/${resolvedParams.id}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || '계약서를 불러오지 못했습니다');
        }

        setContract(data.contract);
        setLinkedInvoices(data.invoices || []);
      } catch (err) {
        console.error('Failed to fetch contract:', err);
        setError(err instanceof Error ? err.message : '계약서를 불러오지 못했습니다');
      } finally {
        setLoading(false);
      }
    };
    fetchContract();
  }, [resolvedParams.id]);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('ko-KR').format(amount);
  const formatDate = (date: string) => new Date(date).toLocaleDateString('ko-KR');

  const handleCopyLink = () => {
    const link = `${window.location.origin}/p/contracts/${resolvedParams.id}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateInvoice = async () => {
    if (!selectedScheduleId || !contract) return;
    setCreating(true);

    try {
      const res = await fetch('/api/invoices/from-contract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractId: contract.id,
          scheduleId: selectedScheduleId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '인보이스 생성에 실패했습니다');
      }

      router.push(`/dashboard/invoices/${data.invoice.id}` as never);
    } catch (err) {
      console.error('Failed to create invoice:', err);
      alert(err instanceof Error ? err.message : '인보이스 생성에 실패했습니다');
    } finally {
      setCreating(false);
      setShowInvoiceModal(false);
      setSelectedScheduleId(null);
    }
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

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">계약서 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-white rounded-xl border border-red-200 p-12 text-center">
          <span className="text-4xl mb-4 block">❌</span>
          <p className="text-red-600 mb-4">{error || '계약서를 찾을 수 없습니다'}</p>
          <Link
            href="/dashboard/contracts"
            className="inline-block px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

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
              <h1 className="text-2xl font-bold text-gray-900">{contract.project_name || contract.title}</h1>
              <span className={`text-sm px-3 py-1 rounded-full ${statusConfig[contract.status]?.color}`}>
                {statusConfig[contract.status]?.label}
              </span>
            </div>
            <p className="text-gray-500 mt-1">{contract.document_number}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCopyLink}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              {copied ? '복사됨!' : '링크 복사'}
            </button>
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
            <p className="font-semibold text-gray-900">{contract.clients?.name || '고객 미지정'}</p>
            {contract.clients?.business_number && (
              <p className="text-sm text-gray-500">{contract.clients.business_number}</p>
            )}
            <p className="text-sm text-gray-500">{contract.clients?.email}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 uppercase mb-2">기간</p>
            <p className="font-semibold text-gray-900">
              {formatDate(contract.start_date)} ~ {formatDate(contract.end_date)}
            </p>
            {contract.signed_at && (
              <p className="text-sm text-green-600 mt-1">
                {formatDate(contract.signed_at)} 체결
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
              <td className="py-2 text-right">₩{formatCurrency(contract.tax_amount)}</td>
            </tr>
            <tr className="border-t border-gray-200">
              <td className="py-3 font-bold text-gray-900">합계</td>
              <td className="py-3 text-right font-bold text-purple-600 text-xl">
                ₩{formatCurrency(contract.total_amount)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* 결제 일정 */}
      {contract.payment_schedule && contract.payment_schedule.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">결제 일정</h2>
          <div className="space-y-3">
            {contract.payment_schedule.map((schedule) => (
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
                    <p className="text-sm text-gray-500">{formatDate(schedule.due_date)}</p>
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
      )}

      {/* 연결된 인보이스 */}
      {linkedInvoices.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">발행된 인보이스</h2>
          <div className="space-y-2">
            {linkedInvoices.map((inv) => (
              <Link
                key={inv.id}
                href={`/dashboard/invoices/${inv.id}` as never}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
              >
                <div>
                  <p className="font-medium text-gray-900">{inv.title}</p>
                  <p className="text-sm text-gray-500">{inv.document_number}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">₩{formatCurrency(inv.total_amount)}</p>
                  <p className={`text-sm ${paymentStatusConfig[inv.payment_status]?.color}`}>
                    {paymentStatusConfig[inv.payment_status]?.label}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 계약 조항 */}
      {contract.clauses && contract.clauses.length > 0 && (
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
      )}

      {/* 인보이스 발행 모달 */}
      {showInvoiceModal && contract.payment_schedule && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-gray-900 mb-4">인보이스 발행</h2>
            <p className="text-gray-500 mb-4">발행할 결제 일정을 선택하세요</p>

            <div className="space-y-2 mb-6">
              {contract.payment_schedule
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
                disabled={!selectedScheduleId || creating}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {creating ? '생성 중...' : '발행하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

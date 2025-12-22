/**
 * 인보이스 상세 페이지
 */

'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface InvoiceItem {
  id: string;
  name: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

interface Invoice {
  id: string;
  document_number: string;
  status: string;
  title: string;
  items: InvoiceItem[];
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  due_date: string;
  payment_status: string;
  paid_at?: string;
  payment_info?: {
    bank_name: string;
    account_number: string;
    account_holder: string;
  };
  clients?: {
    name: string;
    business_number?: string;
    email: string;
  };
  contract_id?: string;
  contracts?: {
    id: string;
    document_number: string;
  };
  isOverdue: boolean;
}

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [confirming, setConfirming] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await fetch(`/api/invoices/${resolvedParams.id}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || '인보이스를 불러오지 못했습니다');
        }

        setInvoice(data.invoice);
      } catch (err) {
        console.error('Failed to fetch invoice:', err);
        setError(err instanceof Error ? err.message : '인보이스를 불러오지 못했습니다');
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [resolvedParams.id]);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('ko-KR').format(amount);
  const formatDate = (date: string) => new Date(date).toLocaleDateString('ko-KR');

  const handleCopyLink = () => {
    const link = `${window.location.origin}/p/invoices/${resolvedParams.id}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMarkPaid = async () => {
    if (!invoice) return;
    setConfirming(true);

    try {
      const res = await fetch(`/api/invoices/${resolvedParams.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentStatus: 'paid',
          paidAmount: invoice.total_amount,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '결제 확인에 실패했습니다');
      }

      setInvoice({ ...invoice, payment_status: 'paid', paid_at: new Date().toISOString(), isOverdue: false });
      setShowPaymentModal(false);
    } catch (err) {
      console.error('Failed to mark as paid:', err);
      alert(err instanceof Error ? err.message : '결제 확인에 실패했습니다');
    } finally {
      setConfirming(false);
    }
  };

  const handleCreateTaxInvoice = () => {
    router.push(`/dashboard/tax-invoices/new?invoiceId=${resolvedParams.id}` as never);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-orange-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">인보이스 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-white rounded-xl border border-red-200 p-12 text-center">
          <span className="text-4xl mb-4 block">❌</span>
          <p className="text-red-600 mb-4">{error || '인보이스를 찾을 수 없습니다'}</p>
          <Link
            href="/dashboard/invoices"
            className="inline-block px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const actualPaymentStatus = invoice.isOverdue ? 'overdue' : invoice.payment_status;

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
            <p className="text-gray-500 mt-1">{invoice.document_number}</p>
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
            {invoice.payment_status === 'pending' && (
              <button
                onClick={() => setShowPaymentModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                결제 확인
              </button>
            )}
            {invoice.payment_status === 'paid' && (
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
      {invoice.isOverdue && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800 font-medium">
            이 인보이스는 납부기한({formatDate(invoice.due_date)})이 지났습니다.
          </p>
        </div>
      )}

      {/* 고객 및 결제 정보 */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">고객 정보</h2>
          <p className="font-medium text-gray-900">{invoice.clients?.name || '고객 미지정'}</p>
          {invoice.clients?.business_number && (
            <p className="text-sm text-gray-500">{invoice.clients.business_number}</p>
          )}
          <p className="text-sm text-gray-500">{invoice.clients?.email}</p>

          {invoice.contracts && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 mb-1">관련 계약서</p>
              <Link
                href={`/dashboard/contracts/${invoice.contracts.id}` as never}
                className="text-purple-600 hover:underline"
              >
                {invoice.contracts.document_number}
              </Link>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">결제 정보</h2>
          {invoice.payment_info ? (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">은행</span>
                <span className="font-medium">{invoice.payment_info.bank_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">계좌번호</span>
                <span className="font-medium font-mono">{invoice.payment_info.account_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">예금주</span>
                <span className="font-medium">{invoice.payment_info.account_holder}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200">
                <span className="text-gray-500">납부기한</span>
                <span className={`font-medium ${invoice.isOverdue ? 'text-red-600' : ''}`}>
                  {formatDate(invoice.due_date)}
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between pt-2">
                <span className="text-gray-500">납부기한</span>
                <span className={`font-medium ${invoice.isOverdue ? 'text-red-600' : ''}`}>
                  {formatDate(invoice.due_date)}
                </span>
              </div>
              <p className="text-sm text-gray-400">결제 정보가 설정되지 않았습니다</p>
            </div>
          )}
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
            {invoice.items?.map((item) => (
              <tr key={item.id} className="border-b border-gray-100">
                <td className="py-3 text-gray-900">{item.name}</td>
                <td className="py-3 text-center text-gray-600">{item.quantity}</td>
                <td className="py-3 text-right text-gray-600">₩{formatCurrency(item.unit_price)}</td>
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
              <td className="py-2 text-right">₩{formatCurrency(invoice.tax_amount)}</td>
            </tr>
            <tr className="border-t border-gray-200">
              <td colSpan={3} className="py-4 font-bold text-gray-900 text-lg">합계</td>
              <td className="py-4 text-right font-bold text-orange-600 text-2xl">
                ₩{formatCurrency(invoice.total_amount)}
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
                <span className="font-medium">₩{formatCurrency(invoice.total_amount)}</span> 입금 확인
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
                disabled={confirming}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {confirming ? '처리 중...' : '확인'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

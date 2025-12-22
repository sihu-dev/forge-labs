/**
 * 세금계산서 생성 페이지
 */

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface TaxInvoiceItem {
  id: string;
  date: string;
  name: string;
  quantity: number;
  unit_price: number;
  supply_amount: number;
  tax_amount: number;
}

interface Invoice {
  id: string;
  document_number: string;
  title: string;
  client_id?: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
  subtotal: number;
  total_amount: number;
  clients?: {
    id: string;
    name: string;
    business_number?: string;
    representative_name?: string;
    address?: string;
    business_type?: string;
    business_category?: string;
    email?: string;
  };
}

interface Client {
  id: string;
  name: string;
  business_number?: string;
  representative_name?: string;
  address?: string;
  business_type?: string;
  business_category?: string;
  email?: string;
}

function NewTaxInvoiceForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get('invoiceId');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 폼 데이터
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [issueType, setIssueType] = useState<'regular' | 'modified'>('regular');
  const [items, setItems] = useState<TaxInvoiceItem[]>([
    {
      id: `item-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      name: '',
      quantity: 1,
      unit_price: 0,
      supply_amount: 0,
      tax_amount: 0,
    },
  ]);

  // 인보이스에서 생성하는 경우 데이터 로드
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        // 고객 목록 로드
        const clientsRes = await fetch('/api/clients');
        if (clientsRes.ok) {
          const clientsData = await clientsRes.json();
          setClients(clientsData.clients || []);
        }

        // 인보이스에서 생성하는 경우
        if (invoiceId) {
          const invoiceRes = await fetch(`/api/invoices/${invoiceId}`);
          if (invoiceRes.ok) {
            const invoiceData = await invoiceRes.json();
            const invoice = invoiceData.invoice;
            setSelectedInvoice(invoice);
            setSelectedClientId(invoice.client_id || '');

            // 인보이스 항목을 세금계산서 항목으로 변환
            const taxItems = invoice.items.map((item: {
              id: string;
              name: string;
              quantity: number;
              unitPrice: number;
              amount: number;
            }) => ({
              id: item.id,
              date: issueDate,
              name: item.name,
              quantity: item.quantity,
              unit_price: item.unitPrice,
              supply_amount: item.amount,
              tax_amount: Math.round(item.amount * 0.1),
            }));
            setItems(taxItems);
          }
        }
      } catch (err) {
        console.error('Failed to load data:', err);
        setError('데이터를 불러오지 못했습니다');
      } finally {
        setLoading(false);
      }
    };
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId]);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('ko-KR').format(amount);

  // 항목 추가
  const addItem = () => {
    setItems([
      ...items,
      {
        id: `item-${Date.now()}`,
        date: issueDate,
        name: '',
        quantity: 1,
        unit_price: 0,
        supply_amount: 0,
        tax_amount: 0,
      },
    ]);
  };

  // 항목 삭제
  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  // 항목 업데이트
  const updateItem = (id: string, field: keyof TaxInvoiceItem, value: string | number) => {
    setItems(
      items.map((item) => {
        if (item.id !== id) return item;

        const updated = { ...item, [field]: value };

        // 금액 자동 계산
        if (field === 'quantity' || field === 'unit_price') {
          updated.supply_amount = updated.quantity * updated.unit_price;
          updated.tax_amount = Math.round(updated.supply_amount * 0.1);
        }

        return updated;
      })
    );
  };

  // 합계 계산
  const subtotal = items.reduce((sum, item) => sum + item.supply_amount, 0);
  const taxAmount = items.reduce((sum, item) => sum + item.tax_amount, 0);
  const totalAmount = subtotal + taxAmount;

  // 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedClientId && !selectedInvoice) {
      setError('고객을 선택해주세요');
      return;
    }

    if (items.some((item) => !item.name || item.supply_amount <= 0)) {
      setError('모든 품목의 이름과 금액을 입력해주세요');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/tax-invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: selectedInvoice?.id,
          clientId: selectedClientId,
          items: items.map((item) => ({
            ...item,
            date: item.date || issueDate,
          })),
          issueDate,
          issueType,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '세금계산서 생성에 실패했습니다');
      }

      router.push(`/dashboard/tax-invoices/${data.taxInvoice.id}`);
    } catch (err) {
      console.error('Failed to create tax invoice:', err);
      setError(err instanceof Error ? err.message : '세금계산서 생성에 실패했습니다');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedClient = clients.find((c) => c.id === selectedClientId) || selectedInvoice?.clients;

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">데이터 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* 헤더 */}
      <div className="mb-6">
        <Link
          href="/dashboard/tax-invoices"
          className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-4"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          세금계산서 목록
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">세금계산서 발행</h1>
        {selectedInvoice && (
          <p className="text-gray-500 mt-1">
            인보이스 {selectedInvoice.document_number}에서 발행
          </p>
        )}
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-700">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 발행 정보 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">발행 정보</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                작성일자 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                발행 유형
              </label>
              <select
                value={issueType}
                onChange={(e) => setIssueType(e.target.value as 'regular' | 'modified')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="regular">정발행</option>
                <option value="modified">수정발행</option>
              </select>
            </div>
          </div>
        </div>

        {/* 공급받는자 (고객) 선택 */}
        {!selectedInvoice && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              공급받는자 <span className="text-red-500">*</span>
            </h2>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="">고객 선택</option>
              {clients
                .filter((c) => c.business_number)
                .map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} ({client.business_number})
                  </option>
                ))}
            </select>
            {clients.filter((c) => c.business_number).length === 0 && (
              <p className="mt-2 text-sm text-amber-600">
                사업자등록번호가 등록된 고객이 없습니다. 고객 정보를 먼저 업데이트해주세요.
              </p>
            )}
          </div>
        )}

        {/* 선택된 고객 정보 표시 */}
        {selectedClient && (
          <div className="bg-orange-50 rounded-xl border border-orange-200 p-6">
            <h2 className="text-lg font-semibold text-orange-800 mb-4">공급받는자 정보</h2>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">상호</p>
                <p className="font-medium text-gray-900">{selectedClient.name}</p>
              </div>
              <div>
                <p className="text-gray-500">사업자등록번호</p>
                <p className="font-medium text-gray-900 font-mono">{selectedClient.business_number || '-'}</p>
              </div>
              <div>
                <p className="text-gray-500">대표자</p>
                <p className="font-medium text-gray-900">{selectedClient.representative_name || '-'}</p>
              </div>
              <div>
                <p className="text-gray-500">이메일</p>
                <p className="font-medium text-gray-900">{selectedClient.email || '-'}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-gray-500">주소</p>
                <p className="font-medium text-gray-900">{selectedClient.address || '-'}</p>
              </div>
            </div>
          </div>
        )}

        {/* 품목 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">품목</h2>
            <button
              type="button"
              onClick={addItem}
              className="px-3 py-1 text-sm text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg"
            >
              + 항목 추가
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-3 text-left font-medium text-gray-500 w-28">작성일</th>
                  <th className="py-3 text-left font-medium text-gray-500">품목</th>
                  <th className="py-3 text-center font-medium text-gray-500 w-20">수량</th>
                  <th className="py-3 text-right font-medium text-gray-500 w-28">단가</th>
                  <th className="py-3 text-right font-medium text-gray-500 w-28">공급가액</th>
                  <th className="py-3 text-right font-medium text-gray-500 w-24">세액</th>
                  <th className="py-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100">
                    <td className="py-2">
                      <input
                        type="date"
                        value={item.date}
                        onChange={(e) => updateItem(item.id, 'date', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </td>
                    <td className="py-2">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                        placeholder="품목명"
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                      />
                    </td>
                    <td className="py-2">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                        min={1}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-center"
                      />
                    </td>
                    <td className="py-2">
                      <input
                        type="number"
                        value={item.unit_price}
                        onChange={(e) => updateItem(item.id, 'unit_price', parseInt(e.target.value) || 0)}
                        min={0}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-right"
                      />
                    </td>
                    <td className="py-2 text-right font-medium">
                      ₩{formatCurrency(item.supply_amount)}
                    </td>
                    <td className="py-2 text-right text-gray-600">
                      ₩{formatCurrency(item.tax_amount)}
                    </td>
                    <td className="py-2">
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="text-red-400 hover:text-red-600"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200">
                  <td colSpan={4} className="py-3 text-right font-medium text-gray-600">공급가액 합계</td>
                  <td className="py-3 text-right font-semibold">₩{formatCurrency(subtotal)}</td>
                  <td colSpan={2}></td>
                </tr>
                <tr>
                  <td colSpan={4} className="py-2 text-right font-medium text-gray-600">세액 합계</td>
                  <td colSpan={2} className="py-2 text-right font-semibold">₩{formatCurrency(taxAmount)}</td>
                  <td></td>
                </tr>
                <tr className="border-t border-gray-200 bg-teal-50">
                  <td colSpan={4} className="py-4 text-right font-bold text-gray-900 text-lg">총 합계</td>
                  <td colSpan={2} className="py-4 text-right font-bold text-teal-600 text-2xl">
                    ₩{formatCurrency(totalAmount)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex justify-end gap-3">
          <Link
            href="/dashboard/tax-invoices"
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            취소
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? '발행 중...' : '세금계산서 발행'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NewTaxInvoicePage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 max-w-4xl mx-auto">
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-500">페이지 불러오는 중...</p>
          </div>
        </div>
      }
    >
      <NewTaxInvoiceForm />
    </Suspense>
  );
}

/**
 * 인보이스 작성 페이지
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Client {
  id: string;
  type: 'individual' | 'business';
  name: string;
  business_number?: string;
  email: string;
}

interface InvoiceItem {
  id: string;
  name: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

export default function NewInvoicePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 폼 데이터
  const [clientId, setClientId] = useState('');
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [notes, setNotes] = useState('');

  // 고객 목록
  const [clients, setClients] = useState<Client[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await fetch('/api/clients?limit=100');
        if (res.ok) {
          const data = await res.json();
          setClients(data.clients || []);
        }
      } catch (err) {
        console.error('Failed to fetch clients:', err);
      } finally {
        setClientsLoading(false);
      }
    };
    fetchClients();

    // 기본 납부기한: 14일 후
    const due = new Date();
    due.setDate(due.getDate() + 14);
    setDueDate(due.toISOString().split('T')[0]);
  }, []);

  const selectedClient = clients.find((c) => c.id === clientId);
  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 금액 계산
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = Math.round(subtotal * 0.1);
  const totalAmount = subtotal + taxAmount;

  // 품목 관리
  const addItem = useCallback(() => {
    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: '', quantity: 1, unit_price: 0, amount: 0 },
    ]);
  }, []);

  const updateItem = useCallback((id: string, updates: Partial<InvoiceItem>) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, ...updates };
        if ('quantity' in updates || 'unit_price' in updates) {
          updated.amount = updated.quantity * updated.unit_price;
        }
        return updated;
      })
    );
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // 폼 검증
  const nextStep = () => {
    if (step === 1 && !clientId) {
      alert('고객을 선택해주세요');
      return;
    }
    if (step === 2 && (!title || items.length === 0)) {
      alert('인보이스 제목과 최소 1개 이상의 품목이 필요합니다');
      return;
    }
    if (step === 2 && !dueDate) {
      alert('납부기한을 입력해주세요');
      return;
    }
    setStep((prev) => Math.min(prev + 1, 3));
  };

  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  // 제출
  const handleSubmit = async (isDraft = false) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        clientId,
        title,
        items,
        subtotal,
        taxAmount,
        totalAmount,
        dueDate,
        notes: notes || null,
        status: isDraft ? 'draft' : 'sent',
      };

      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '인보이스 생성에 실패했습니다');
      }

      router.push('/dashboard/invoices' as never);
    } catch (err) {
      console.error('Failed to create invoice:', err);
      setError(err instanceof Error ? err.message : '인보이스 생성에 실패했습니다');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('ko-KR').format(amount);

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
        <h1 className="text-2xl font-bold text-gray-900">인보이스 작성</h1>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <p className="text-red-700">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* 스텝 인디케이터 */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[
            { num: 1, label: '고객 선택' },
            { num: 2, label: '청구 내용' },
            { num: 3, label: '최종 확인' },
          ].map((s, i) => (
            <div key={s.num} className="flex items-center flex-1">
              <div className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                    step >= s.num ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {step > s.num ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    s.num
                  )}
                </div>
                <span className={`ml-2 text-sm font-medium ${step >= s.num ? 'text-gray-900' : 'text-gray-500'}`}>
                  {s.label}
                </span>
              </div>
              {i < 2 && <div className={`flex-1 h-0.5 mx-4 ${step > s.num ? 'bg-orange-600' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: 고객 선택 */}
      {step === 1 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">고객 선택</h2>
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="고객 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {clientsLoading ? (
              <div className="text-center py-8 text-gray-500">고객 목록 불러오는 중...</div>
            ) : filteredClients.length === 0 ? (
              <div className="text-center py-8 text-gray-500">등록된 고객이 없습니다</div>
            ) : (
              filteredClients.map((client) => (
                <label
                  key={client.id}
                  className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer ${
                    clientId === client.id ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="client"
                    value={client.id}
                    checked={clientId === client.id}
                    onChange={() => setClientId(client.id)}
                    className="sr-only"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{client.name}</p>
                    <p className="text-sm text-gray-500">{client.email}</p>
                  </div>
                </label>
              ))
            )}
          </div>
        </div>
      )}

      {/* Step 2: 청구 내용 */}
      {step === 2 && (
        <div className="space-y-6">
          {selectedClient && (
            <div className="bg-orange-50 rounded-lg p-4">
              <p className="font-medium text-gray-900">{selectedClient.name}</p>
              <p className="text-sm text-gray-500">{selectedClient.email}</p>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">인보이스 제목 *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="12월 웹사이트 개발비"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">납부기한 *</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg"
            />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">품목</h2>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-1 text-orange-600 hover:text-orange-700"
              >
                + 품목 추가
              </button>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-8 text-gray-500">품목을 추가해주세요</div>
            ) : (
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start gap-4">
                      <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-sm flex items-center justify-center">
                        {index + 1}
                      </span>
                      <div className="flex-1 grid grid-cols-12 gap-3">
                        <div className="col-span-5">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => updateItem(item.id, { name: e.target.value })}
                            placeholder="품목명"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, { quantity: parseInt(e.target.value) || 1 })}
                            min={1}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center"
                          />
                        </div>
                        <div className="col-span-3">
                          <input
                            type="text"
                            value={formatCurrency(item.unit_price)}
                            onChange={(e) => {
                              const value = parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0;
                              updateItem(item.id, { unit_price: value });
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-right"
                          />
                        </div>
                        <div className="col-span-2 flex items-center justify-end font-medium">
                          ₩{formatCurrency(item.amount)}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {items.length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-200 space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>공급가액</span>
                  <span>₩{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>부가세 (10%)</span>
                  <span>₩{formatCurrency(taxAmount)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t">
                  <span>합계</span>
                  <span className="text-orange-600">₩{formatCurrency(totalAmount)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 3: 최종 확인 */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{title}</p>
                <p className="text-sm text-gray-500">{selectedClient?.name}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-orange-600">₩{formatCurrency(totalAmount)}</p>
                <p className="text-sm text-gray-500">납부기한: {dueDate}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">청구 내역</h2>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-2 text-left text-sm text-gray-500">품목</th>
                  <th className="py-2 text-center text-sm text-gray-500 w-20">수량</th>
                  <th className="py-2 text-right text-sm text-gray-500 w-32">단가</th>
                  <th className="py-2 text-right text-sm text-gray-500 w-32">금액</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100">
                    <td className="py-2">{item.name}</td>
                    <td className="py-2 text-center">{item.quantity}</td>
                    <td className="py-2 text-right">₩{formatCurrency(item.unit_price)}</td>
                    <td className="py-2 text-right font-medium">₩{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">비고</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="추가 안내사항..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg"
            />
          </div>
        </div>
      )}

      {/* 하단 버튼 */}
      <div className="mt-8 flex justify-between">
        <div>
          {step > 1 && (
            <button
              type="button"
              onClick={prevStep}
              className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              이전
            </button>
          )}
        </div>
        <div className="flex gap-3">
          {step < 3 ? (
            <button
              type="button"
              onClick={nextStep}
              className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              다음
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => handleSubmit(true)}
                disabled={isSubmitting}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                초안 저장
              </button>
              <button
                type="button"
                onClick={() => handleSubmit(false)}
                disabled={isSubmitting}
                className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
              >
                {isSubmitting ? '처리 중...' : '발송하기'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

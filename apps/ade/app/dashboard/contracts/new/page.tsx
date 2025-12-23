/**
 * 계약서 작성 페이지
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

const defaultPaymentSchedules = [
  { name: '계약금', percentage: 30 },
  { name: '중도금', percentage: 40 },
  { name: '잔금', percentage: 30 },
];

export default function NewContractPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 폼 데이터
  const [clientId, setClientId] = useState('');
  const [title, setTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [items, setItems] = useState<ContractItem[]>([]);
  const [paymentSchedule, setPaymentSchedule] = useState<PaymentSchedule[]>([]);

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

  const updateItem = useCallback((id: string, updates: Partial<ContractItem>) => {
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

  // 결제 일정 생성
  const generatePaymentSchedule = useCallback(() => {
    if (!endDate || totalAmount === 0) return;

    const startD = new Date(startDate);
    const endD = new Date(endDate);
    const totalDays = Math.ceil((endD.getTime() - startD.getTime()) / (1000 * 60 * 60 * 24));

    const schedules = defaultPaymentSchedules.map((s, idx) => {
      const dueDate = new Date(startD);
      dueDate.setDate(dueDate.getDate() + Math.floor(totalDays * (idx / 2)));

      return {
        id: crypto.randomUUID(),
        name: s.name,
        percentage: s.percentage,
        amount: Math.round(totalAmount * s.percentage / 100),
        due_date: dueDate.toISOString().split('T')[0],
        status: 'pending',
      };
    });

    setPaymentSchedule(schedules);
  }, [startDate, endDate, totalAmount]);

  // 폼 검증
  const nextStep = () => {
    if (step === 1 && !clientId) {
      alert('고객을 선택해주세요');
      return;
    }
    if (step === 2 && (!title || items.length === 0)) {
      alert('계약 제목과 최소 1개 이상의 품목이 필요합니다');
      return;
    }
    if (step === 2 && !endDate) {
      alert('종료일을 입력해주세요');
      return;
    }
    if (step === 2) {
      generatePaymentSchedule();
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
        projectName: title,
        projectDescription: projectDescription || null,
        items,
        subtotal,
        taxAmount,
        totalAmount,
        startDate,
        endDate,
        paymentSchedule,
        status: isDraft ? 'draft' : 'sent',
      };

      const res = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '계약서 생성에 실패했습니다');
      }

      router.push('/dashboard/contracts' as never);
    } catch (err) {
      console.error('Failed to create contract:', err);
      setError(err instanceof Error ? err.message : '계약서 생성에 실패했습니다');
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
          href="/dashboard/contracts"
          className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-4"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          계약서 목록
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">계약서 작성</h1>
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
            { num: 2, label: '계약 내용' },
            { num: 3, label: '결제 일정' },
          ].map((s, i) => (
            <div key={s.num} className="flex items-center flex-1">
              <div className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                    step >= s.num ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-500'
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
              {i < 2 && <div className={`flex-1 h-0.5 mx-4 ${step > s.num ? 'bg-purple-600' : 'bg-gray-200'}`} />}
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
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
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
                    clientId === client.id ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
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

      {/* Step 2: 계약 내용 */}
      {step === 2 && (
        <div className="space-y-6">
          {selectedClient && (
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="font-medium text-gray-900">{selectedClient.name}</p>
              <p className="text-sm text-gray-500">{selectedClient.email}</p>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">계약 제목 *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="웹사이트 개발 계약"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">프로젝트 설명</label>
            <textarea
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              rows={3}
              placeholder="프로젝트 상세 내용..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">시작일 *</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">종료일 *</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">품목</h2>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-700"
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
                  <span className="text-purple-600">₩{formatCurrency(totalAmount)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 3: 결제 일정 */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{title}</p>
                <p className="text-sm text-gray-500">{selectedClient?.name}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-purple-600">₩{formatCurrency(totalAmount)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">결제 일정</h2>
            <div className="space-y-3">
              {paymentSchedule.map((schedule, idx) => (
                <div key={schedule.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold">
                      {schedule.percentage}%
                    </div>
                    <div>
                      <input
                        type="text"
                        value={schedule.name}
                        onChange={(e) => {
                          const updated = [...paymentSchedule];
                          updated[idx].name = e.target.value;
                          setPaymentSchedule(updated);
                        }}
                        className="font-medium text-gray-900 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-purple-500 focus:outline-none"
                      />
                      <input
                        type="date"
                        value={schedule.due_date}
                        onChange={(e) => {
                          const updated = [...paymentSchedule];
                          updated[idx].due_date = e.target.value;
                          setPaymentSchedule(updated);
                        }}
                        className="block text-sm text-gray-500 bg-transparent"
                      />
                    </div>
                  </div>
                  <p className="font-semibold text-gray-900">₩{formatCurrency(schedule.amount)}</p>
                </div>
              ))}
            </div>
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
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
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
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
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

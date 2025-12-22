/**
 * 견적서 작성 페이지 - 3단계 위자드
 */

'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  type QuoteFormData,
  type QuoteItemFormData,
  defaultQuoteFormData,
  defaultQuoteItem,
  calculateItemAmount,
  calculateQuoteTotals,
  calculateValidUntil,
  generateItemId,
} from '@/lib/validations/quote';

// 임시 고객 데이터
const demoClients = [
  { id: '1', type: 'business', name: '(주)테크스타트', businessNumber: '123-45-67890', email: 'tech@start.com' },
  { id: '2', type: 'business', name: '디자인랩', businessNumber: '456-78-90123', email: 'hello@designlab.kr' },
  { id: '3', type: 'individual', name: '김철수', email: 'kim@email.com' },
];

// 자주 쓰는 품목
const frequentItems = [
  { name: '기획/설계', unitPrice: 500000, unit: '식' },
  { name: 'UI/UX 디자인', unitPrice: 1500000, unit: '식' },
  { name: '프론트엔드 개발', unitPrice: 2000000, unit: '식' },
  { name: '백엔드 개발', unitPrice: 2000000, unit: '식' },
  { name: '유지보수 (월)', unitPrice: 300000, unit: '월' },
];

export default function NewQuotePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<QuoteFormData>(defaultQuoteFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 선택된 고객
  const selectedClient = demoClients.find((c) => c.id === formData.clientId);

  // 검색된 고객 목록
  const filteredClients = demoClients.filter((client) =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 금액 계산
  const totals = calculateQuoteTotals(formData.items);

  // Step 1: 고객 선택
  const handleClientSelect = (clientId: string) => {
    setFormData((prev) => ({ ...prev, clientId }));
  };

  // Step 2: 품목 추가
  const addItem = useCallback((preset?: { name: string; unitPrice: number; unit: string }) => {
    const newItem: QuoteItemFormData = {
      ...defaultQuoteItem,
      id: generateItemId(),
      name: preset?.name || '',
      unitPrice: preset?.unitPrice || 0,
      unit: preset?.unit || '개',
      quantity: 1,
      amount: preset?.unitPrice || 0,
    };
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
  }, []);

  const updateItem = useCallback((id: string, updates: Partial<QuoteItemFormData>) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, ...updates };
        // 금액 자동 계산
        if ('quantity' in updates || 'unitPrice' in updates) {
          updated.amount = calculateItemAmount(updated.quantity, updated.unitPrice);
        }
        return updated;
      }),
    }));
  }, []);

  const removeItem = useCallback((id: string) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id),
    }));
  }, []);

  // 다음 단계
  const nextStep = () => {
    if (step === 1 && !formData.clientId) {
      alert('고객을 선택해주세요');
      return;
    }
    if (step === 2 && (formData.items.length === 0 || !formData.title)) {
      alert('견적 제목과 최소 1개 이상의 품목이 필요합니다');
      return;
    }
    setStep((prev) => Math.min(prev + 1, 3));
  };

  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  // 제출
  const handleSubmit = async (isDraft = false) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        status: isDraft ? 'draft' : 'sent',
        validUntil: calculateValidUntil(formData.validDays),
        ...totals,
      };
      console.log('Quote payload:', payload);
      // TODO: API 연동
      router.push('/dashboard/quotes' as never);
    } catch (error) {
      console.error('Failed to create quote:', error);
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
          href="/dashboard"
          className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-4"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          대시보드
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">견적서 작성</h1>
      </div>

      {/* 스텝 인디케이터 */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[
            { num: 1, label: '고객 선택' },
            { num: 2, label: '견적 내용' },
            { num: 3, label: '조건 확인' },
          ].map((s, i) => (
            <div key={s.num} className="flex items-center flex-1">
              <div className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                    step >= s.num
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-500'
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
              {i < 2 && (
                <div className={`flex-1 h-0.5 mx-4 ${step > s.num ? 'bg-blue-600' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: 고객 선택 */}
      {step === 1 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">고객 선택</h2>

          {/* 검색 */}
          <div className="relative mb-4">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="고객 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* 고객 목록 */}
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {filteredClients.map((client) => (
              <label
                key={client.id}
                className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  formData.clientId === client.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="client"
                  value={client.id}
                  checked={formData.clientId === client.id}
                  onChange={() => handleClientSelect(client.id)}
                  className="sr-only"
                />
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                  client.type === 'business' ? 'bg-blue-500' : 'bg-green-500'
                }`}>
                  {client.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{client.name}</p>
                  <p className="text-sm text-gray-500">
                    {client.businessNumber && `${client.businessNumber} · `}
                    {client.email}
                  </p>
                </div>
                {formData.clientId === client.id && (
                  <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </label>
            ))}
          </div>

          {/* 새 고객 등록 링크 */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <Link
              href="/dashboard/clients/new"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              새 고객 등록
            </Link>
          </div>
        </div>
      )}

      {/* Step 2: 견적 내용 */}
      {step === 2 && (
        <div className="space-y-6">
          {/* 선택된 고객 표시 */}
          {selectedClient && (
            <div className="bg-blue-50 rounded-lg p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-medium">
                {selectedClient.name.charAt(0)}
              </div>
              <div>
                <p className="font-medium text-gray-900">{selectedClient.name}</p>
                <p className="text-sm text-gray-500">{selectedClient.email}</p>
              </div>
            </div>
          )}

          {/* 견적 제목 */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              견적 제목 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="웹사이트 리뉴얼 프로젝트"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* 품목 */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">품목</h2>
              <button
                type="button"
                onClick={() => addItem()}
                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                품목 추가
              </button>
            </div>

            {/* 자주 쓰는 품목 */}
            <div className="mb-4 flex flex-wrap gap-2">
              {frequentItems.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => addItem(item)}
                  className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                >
                  + {item.name}
                </button>
              ))}
            </div>

            {/* 품목 목록 */}
            {formData.items.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>품목을 추가해주세요</p>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.items.map((item, index) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start gap-4">
                      <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-sm flex items-center justify-center flex-shrink-0">
                        {index + 1}
                      </span>
                      <div className="flex-1 grid grid-cols-12 gap-3">
                        {/* 품목명 */}
                        <div className="col-span-12 md:col-span-5">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => updateItem(item.id, { name: e.target.value })}
                            placeholder="품목명"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        {/* 수량 */}
                        <div className="col-span-4 md:col-span-2">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, { quantity: parseInt(e.target.value) || 1 })}
                            min={1}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
                          />
                        </div>
                        {/* 단가 */}
                        <div className="col-span-8 md:col-span-3">
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₩</span>
                            <input
                              type="text"
                              value={formatCurrency(item.unitPrice)}
                              onChange={(e) => {
                                const value = parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0;
                                updateItem(item.id, { unitPrice: value });
                              }}
                              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
                            />
                          </div>
                        </div>
                        {/* 금액 */}
                        <div className="col-span-10 md:col-span-2 flex items-center justify-end font-medium text-gray-900">
                          ₩{formatCurrency(item.amount)}
                        </div>
                      </div>
                      {/* 삭제 */}
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

            {/* 합계 */}
            {formData.items.length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-200 space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>공급가액</span>
                  <span>₩{formatCurrency(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>부가세 (10%)</span>
                  <span>₩{formatCurrency(totals.taxAmount)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200">
                  <span>합계</span>
                  <span className="text-blue-600">₩{formatCurrency(totals.totalAmount)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 3: 조건 및 확인 */}
      {step === 3 && (
        <div className="space-y-6">
          {/* 요약 */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{formData.title}</p>
                <p className="text-sm text-gray-500">{selectedClient?.name}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">₩{formatCurrency(totals.totalAmount)}</p>
                <p className="text-sm text-gray-500">{formData.items.length}개 품목</p>
              </div>
            </div>
          </div>

          {/* 유효기간 */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">유효기간</h2>
            <div className="flex items-center gap-4">
              <select
                value={formData.validDays}
                onChange={(e) => setFormData((prev) => ({ ...prev, validDays: parseInt(e.target.value) }))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={7}>7일</option>
                <option value={14}>14일</option>
                <option value={30}>30일</option>
                <option value={60}>60일</option>
              </select>
              <span className="text-gray-500">
                ~ {calculateValidUntil(formData.validDays)}까지
              </span>
            </div>
          </div>

          {/* 결제 조건 */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">결제 조건</h2>
            <textarea
              value={formData.paymentTerms}
              onChange={(e) => setFormData((prev) => ({ ...prev, paymentTerms: e.target.value }))}
              rows={2}
              placeholder="예: 계약금 30% 선급, 잔금 70% 완료 후"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>

          {/* 납품 조건 */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">납품 조건</h2>
            <textarea
              value={formData.deliveryTerms}
              onChange={(e) => setFormData((prev) => ({ ...prev, deliveryTerms: e.target.value }))}
              rows={2}
              placeholder="예: 최종 산출물 Google Drive 공유"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>

          {/* 비고 */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">비고</h2>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              rows={3}
              placeholder="추가 안내사항..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
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
              className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              이전
            </button>
          )}
        </div>
        <div className="flex gap-3">
          {step < 3 ? (
            <button
              type="button"
              onClick={nextStep}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              다음
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => handleSubmit(true)}
                disabled={isSubmitting}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                초안 저장
              </button>
              <button
                type="button"
                onClick={() => handleSubmit(false)}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? '처리 중...' : '발송하기'}
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

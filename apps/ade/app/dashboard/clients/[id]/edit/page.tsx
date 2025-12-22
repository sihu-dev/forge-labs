/**
 * 고객 수정 페이지
 */

'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import {
  clientSchema,
  type ClientFormData,
  formatBusinessNumber,
  formatPhoneNumber,
} from '@/lib/validations/client';

export default function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      type: 'business',
      name: '',
      businessNumber: '',
      representativeName: '',
      email: '',
      phone: '',
      address: '',
      businessType: '',
      businessCategory: '',
      notes: '',
      tags: [],
    },
  });

  const clientType = watch('type');

  // 기존 데이터 불러오기
  useEffect(() => {
    const fetchClient = async () => {
      try {
        const res = await fetch(`/api/clients/${resolvedParams.id}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || '고객 정보를 불러오지 못했습니다');
        }

        // DB snake_case → form camelCase 변환
        const client = data.client;
        reset({
          type: client.type,
          name: client.name,
          businessNumber: client.business_number || '',
          representativeName: client.representative_name || '',
          email: client.email,
          phone: client.phone || '',
          address: client.address || '',
          businessType: client.business_type || '',
          businessCategory: client.business_category || '',
          notes: client.notes || '',
          tags: client.tags || [],
        });
      } catch (err) {
        console.error('Failed to fetch client:', err);
        setError(err instanceof Error ? err.message : '고객 정보를 불러오지 못했습니다');
      } finally {
        setLoading(false);
      }
    };
    fetchClient();
  }, [resolvedParams.id, reset]);

  const onSubmit = async (data: ClientFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/clients/${resolvedParams.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || '고객 수정에 실패했습니다');
      }

      // 성공 시 상세 페이지로 이동
      router.push(`/dashboard/clients/${resolvedParams.id}`);
    } catch (err) {
      console.error('Failed to update client:', err);
      setError(err instanceof Error ? err.message : '고객 수정에 실패했습니다');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 사업자등록번호 포맷팅
  const handleBusinessNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatBusinessNumber(e.target.value);
    setValue('businessNumber', formatted);
  };

  // 전화번호 포맷팅
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setValue('phone', formatted);
  };

  if (loading) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">고객 정보 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error && !loading) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-white rounded-xl border border-red-200 p-12 text-center">
          <span className="text-4xl mb-4 block">❌</span>
          <p className="text-red-600 mb-4">{error}</p>
          <Link
            href="/dashboard/clients"
            className="inline-block px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* 헤더 */}
      <div className="mb-6">
        <Link
          href={`/dashboard/clients/${resolvedParams.id}`}
          className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-4"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          고객 상세
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">고객 정보 수정</h1>
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

      {/* 폼 */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* 고객 유형 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">고객 유형</h2>
          <div className="flex gap-4">
            <label className={`flex-1 flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
              clientType === 'business'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}>
              <input
                type="radio"
                value="business"
                {...register('type')}
                className="sr-only"
              />
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                clientType === 'business' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">사업자</p>
                <p className="text-sm text-gray-500">법인/개인사업자</p>
              </div>
            </label>

            <label className={`flex-1 flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
              clientType === 'individual'
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}>
              <input
                type="radio"
                value="individual"
                {...register('type')}
                className="sr-only"
              />
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                clientType === 'individual' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">개인</p>
                <p className="text-sm text-gray-500">개인 고객</p>
              </div>
            </label>
          </div>
        </div>

        {/* 기본 정보 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">기본 정보</h2>
          <div className="space-y-4">
            {/* 상호/이름 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {clientType === 'business' ? '상호' : '이름'} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('name')}
                placeholder={clientType === 'business' ? '(주)회사명' : '홍길동'}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* 사업자등록번호 (사업자만) */}
            {clientType === 'business' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  사업자등록번호 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('businessNumber')}
                  onChange={handleBusinessNumberChange}
                  placeholder="000-00-00000"
                  maxLength={12}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.businessNumber ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.businessNumber && (
                  <p className="mt-1 text-sm text-red-500">{errors.businessNumber.message}</p>
                )}
              </div>
            )}

            {/* 대표자명 (사업자만) */}
            {clientType === 'business' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  대표자명
                </label>
                <input
                  type="text"
                  {...register('representativeName')}
                  placeholder="홍길동"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}

            {/* 이메일 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                이메일 <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                {...register('email')}
                placeholder="email@example.com"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* 전화번호 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                전화번호
              </label>
              <input
                type="tel"
                {...register('phone')}
                onChange={handlePhoneChange}
                placeholder="010-1234-5678"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.phone ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-500">{errors.phone.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* 추가 정보 (사업자만) */}
        {clientType === 'business' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              세금계산서 정보
              <span className="text-sm font-normal text-gray-500 ml-2">(선택)</span>
            </h2>
            <div className="space-y-4">
              {/* 주소 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  사업장 주소
                </label>
                <input
                  type="text"
                  {...register('address')}
                  placeholder="서울시 강남구 테헤란로 123"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* 업태/종목 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    업태
                  </label>
                  <input
                    type="text"
                    {...register('businessType')}
                    placeholder="서비스업"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    종목
                  </label>
                  <input
                    type="text"
                    {...register('businessCategory')}
                    placeholder="소프트웨어 개발"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 메모 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            메모
            <span className="text-sm font-normal text-gray-500 ml-2">(선택)</span>
          </h2>
          <textarea
            {...register('notes')}
            rows={4}
            placeholder="고객에 대한 메모를 입력하세요..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          />
        </div>

        {/* 버튼 */}
        <div className="flex justify-end gap-3">
          <Link
            href={`/dashboard/clients/${resolvedParams.id}`}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            취소
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '저장 중...' : '변경사항 저장'}
          </button>
        </div>
      </form>
    </div>
  );
}

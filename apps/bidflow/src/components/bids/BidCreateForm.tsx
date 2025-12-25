/**
 * Bid Create Form
 * 입찰 공고 생성 폼
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  DocumentTextIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';

interface BidCreateFormProps {
  userId: string;
}

export function BidCreateForm({ userId }: BidCreateFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    organization: '',
    announcement_number: '',
    budget: '',
    currency: 'KRW',
    deadline: '',
    announcement_date: '',
    category: '',
    type: 'goods',
    method: 'open',
    description: '',
    requirements: '',
    source_url: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.organization) {
      alert('제목과 발주기관은 필수 입력 항목입니다.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/v1/bids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          budget: formData.budget ? parseFloat(formData.budget) : null,
          deadline: formData.deadline || null,
          announcement_date: formData.announcement_date || null,
          source: 'manual',
        }),
      });

      if (response.ok) {
        const { data } = await response.json();
        router.push(`/dashboard/bids/${data.id}`);
      } else {
        const error = await response.json();
        alert(error.error || '입찰 공고 추가에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to create bid:', error);
      alert('입찰 공고 추가 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl">
      <div className="bg-[#111113] border border-white/[0.06] rounded-lg overflow-hidden">
        {/* 기본 정보 */}
        <div className="px-6 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <DocumentTextIcon className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-medium text-white">기본 정보</h2>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* 제목 */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              공고 제목 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="예: 2024년 유량계 구매 사업"
              className="w-full h-12 px-4 bg-white/[0.04] border border-white/[0.06] rounded text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white/[0.12] transition-colors"
            />
          </div>

          {/* 발주기관 */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              발주기관 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="organization"
              value={formData.organization}
              onChange={handleChange}
              required
              placeholder="예: 한국수자원공사"
              className="w-full h-12 px-4 bg-white/[0.04] border border-white/[0.06] rounded text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white/[0.12] transition-colors"
            />
          </div>

          {/* 공고번호 & 카테고리 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                공고번호
              </label>
              <input
                type="text"
                name="announcement_number"
                value={formData.announcement_number}
                onChange={handleChange}
                placeholder="예: 20240001234"
                className="w-full h-12 px-4 bg-white/[0.04] border border-white/[0.06] rounded text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white/[0.12] transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                카테고리
              </label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                placeholder="예: 계측기기"
                className="w-full h-12 px-4 bg-white/[0.04] border border-white/[0.06] rounded text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white/[0.12] transition-colors"
              />
            </div>
          </div>

          {/* 예산 & 통화 */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-white mb-2">
                예산
              </label>
              <input
                type="number"
                name="budget"
                value={formData.budget}
                onChange={handleChange}
                placeholder="0"
                className="w-full h-12 px-4 bg-white/[0.04] border border-white/[0.06] rounded text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white/[0.12] transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                통화
              </label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className="w-full h-12 px-4 bg-white/[0.04] border border-white/[0.06] rounded text-sm text-white focus:outline-none focus:border-white/[0.12] transition-colors"
              >
                <option value="KRW">KRW</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>

          {/* 공고일 & 마감일 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                공고일
              </label>
              <input
                type="datetime-local"
                name="announcement_date"
                value={formData.announcement_date}
                onChange={handleChange}
                className="w-full h-12 px-4 bg-white/[0.04] border border-white/[0.06] rounded text-sm text-white focus:outline-none focus:border-white/[0.12] transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                마감일
              </label>
              <input
                type="datetime-local"
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
                className="w-full h-12 px-4 bg-white/[0.04] border border-white/[0.06] rounded text-sm text-white focus:outline-none focus:border-white/[0.12] transition-colors"
              />
            </div>
          </div>

          {/* 입찰 유형 & 방식 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                입찰 유형
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full h-12 px-4 bg-white/[0.04] border border-white/[0.06] rounded text-sm text-white focus:outline-none focus:border-white/[0.12] transition-colors"
              >
                <option value="goods">물품</option>
                <option value="service">용역</option>
                <option value="construction">공사</option>
                <option value="foreign">해외입찰</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                입찰 방식
              </label>
              <select
                name="method"
                value={formData.method}
                onChange={handleChange}
                className="w-full h-12 px-4 bg-white/[0.04] border border-white/[0.06] rounded text-sm text-white focus:outline-none focus:border-white/[0.12] transition-colors"
              >
                <option value="open">공개경쟁</option>
                <option value="limited">제한경쟁</option>
                <option value="negotiation">수의계약</option>
              </select>
            </div>
          </div>

          {/* 공고 내용 */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              공고 내용
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={5}
              placeholder="입찰 공고의 주요 내용을 입력하세요"
              className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.06] rounded text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white/[0.12] transition-colors resize-none"
            />
          </div>

          {/* 요구사항 */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              요구사항
            </label>
            <textarea
              name="requirements"
              value={formData.requirements}
              onChange={handleChange}
              rows={5}
              placeholder="입찰 참가 요구사항을 입력하세요"
              className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.06] rounded text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white/[0.12] transition-colors resize-none"
            />
          </div>

          {/* 출처 URL */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              출처 URL
            </label>
            <input
              type="url"
              name="source_url"
              value={formData.source_url}
              onChange={handleChange}
              placeholder="https://example.com/bid/123"
              className="w-full h-12 px-4 bg-white/[0.04] border border-white/[0.06] rounded text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white/[0.12] transition-colors"
            />
          </div>
        </div>

        {/* 담당자 정보 */}
        <div className="px-6 py-4 border-t border-white/[0.06] border-b">
          <div className="flex items-center gap-3 mb-4">
            <BuildingOfficeIcon className="w-5 h-5 text-purple-400" />
            <h2 className="text-base font-medium text-white">담당자 정보</h2>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  담당자명
                </label>
                <input
                  type="text"
                  name="contact_name"
                  value={formData.contact_name}
                  onChange={handleChange}
                  placeholder="홍길동"
                  className="w-full h-12 px-4 bg-white/[0.04] border border-white/[0.06] rounded text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white/[0.12] transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  이메일
                </label>
                <input
                  type="email"
                  name="contact_email"
                  value={formData.contact_email}
                  onChange={handleChange}
                  placeholder="contact@example.com"
                  className="w-full h-12 px-4 bg-white/[0.04] border border-white/[0.06] rounded text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white/[0.12] transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  전화번호
                </label>
                <input
                  type="tel"
                  name="contact_phone"
                  value={formData.contact_phone}
                  onChange={handleChange}
                  placeholder="02-1234-5678"
                  className="w-full h-12 px-4 bg-white/[0.04] border border-white/[0.06] rounded text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white/[0.12] transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 제출 버튼 */}
        <div className="px-6 py-4 bg-white/[0.02]">
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-500">
              <span className="text-red-400">*</span> 필수 입력 항목
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="h-10 px-4 bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] text-white rounded text-sm font-medium transition-colors"
              >
                취소
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="h-10 px-6 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm font-medium transition-colors disabled:opacity-50"
              >
                {isSubmitting ? '추가 중...' : '입찰 공고 추가'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

/**
 * Keyword Manager Component
 * 키워드 관리 컴포넌트
 */

'use client';

import { useState } from 'react';
import {
  PlusIcon,
  TrashIcon,
  SparklesIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

interface Keyword {
  id: string;
  keyword: string;
  category?: string;
  priority: number;
  match_count: number;
  last_matched_at?: string;
  active: boolean;
  created_at: string;
}

interface KeywordManagerProps {
  keywords: Keyword[];
  userId: string;
}

export function KeywordManager({ keywords: initialKeywords, userId }: KeywordManagerProps) {
  const [keywords, setKeywords] = useState(initialKeywords);
  const [newKeyword, setNewKeyword] = useState('');
  const [newCategory, setNewCategory] = useState('product');
  const [newPriority, setNewPriority] = useState(5);
  const [isAdding, setIsAdding] = useState(false);

  const handleAddKeyword = async () => {
    if (!newKeyword.trim()) return;

    setIsAdding(true);
    try {
      const response = await fetch('/api/v1/bids/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: newKeyword.trim(),
          category: newCategory,
          priority: newPriority,
        }),
      });

      if (response.ok) {
        const { data } = await response.json();
        setKeywords([data, ...keywords]);
        setNewKeyword('');
        setNewCategory('product');
        setNewPriority(5);
      } else {
        alert('키워드 추가에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to add keyword:', error);
      alert('키워드 추가 중 오류가 발생했습니다.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteKeyword = async (id: string) => {
    if (!confirm('이 키워드를 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/v1/bids/keywords/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setKeywords(keywords.filter((k) => k.id !== id));
      } else {
        alert('키워드 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to delete keyword:', error);
      alert('키워드 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleToggleActive = async (id: string, active: boolean) => {
    try {
      const response = await fetch(`/api/v1/bids/keywords/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !active }),
      });

      if (response.ok) {
        setKeywords(
          keywords.map((k) => (k.id === id ? { ...k, active: !active } : k))
        );
      } else {
        alert('키워드 상태 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to toggle keyword:', error);
      alert('키워드 상태 변경 중 오류가 발생했습니다.');
    }
  };

  const getCategoryLabel = (category?: string) => {
    const labels: Record<string, string> = {
      product: '제품',
      service: '서비스',
      industry: '산업',
      location: '지역',
    };
    return labels[category || ''] || category || '기타';
  };

  const getCategoryColor = (category?: string) => {
    const colors: Record<string, string> = {
      product: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      service: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      industry: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      location: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    };
    return colors[category || ''] || 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
  };

  return (
    <div className="space-y-6">
      {/* 키워드 추가 */}
      <div className="bg-[#111113] border border-white/[0.06] rounded-lg p-6">
        <h2 className="text-base font-medium text-white mb-4">새 키워드 추가</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs text-zinc-400 mb-2">키워드</label>
            <input
              type="text"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddKeyword();
              }}
              placeholder="예: 유량계, 상하수도, 펌프"
              className="w-full h-10 px-4 bg-white/[0.04] border border-white/[0.06] rounded text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white/[0.12] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-2">카테고리</label>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="w-full h-10 px-3 bg-white/[0.04] border border-white/[0.06] rounded text-sm text-white focus:outline-none focus:border-white/[0.12] transition-colors"
            >
              <option value="product">제품</option>
              <option value="service">서비스</option>
              <option value="industry">산업</option>
              <option value="location">지역</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-2">
              우선순위 ({newPriority})
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={newPriority}
              onChange={(e) => setNewPriority(parseInt(e.target.value))}
              className="w-full h-10"
            />
          </div>
        </div>

        <button
          onClick={handleAddKeyword}
          disabled={isAdding || !newKeyword.trim()}
          className="mt-4 h-10 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <PlusIcon className="w-4 h-4" />
          {isAdding ? '추가 중...' : '키워드 추가'}
        </button>
      </div>

      {/* 키워드 목록 */}
      <div className="bg-[#111113] border border-white/[0.06] rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.06]">
          <h2 className="text-base font-medium text-white">
            키워드 목록 ({keywords.length})
          </h2>
        </div>

        {keywords.length === 0 ? (
          <div className="p-12 text-center">
            <SparklesIcon className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              키워드가 없습니다
            </h3>
            <p className="text-sm text-zinc-400">
              위에서 키워드를 추가하여 입찰 공고를 자동으로 매칭하세요
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {keywords.map((keyword) => (
              <div
                key={keyword.id}
                className="px-6 py-4 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <input
                        type="checkbox"
                        checked={keyword.active}
                        onChange={() => handleToggleActive(keyword.id, keyword.active)}
                        className="w-4 h-4 rounded border-white/[0.12] bg-white/[0.04]"
                      />
                      <h3
                        className={`text-base font-medium ${keyword.active ? 'text-white' : 'text-zinc-500'}`}
                      >
                        {keyword.keyword}
                      </h3>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getCategoryColor(keyword.category)}`}
                      >
                        {getCategoryLabel(keyword.category)}
                      </span>
                      {keyword.active && (
                        <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
                      )}
                    </div>

                    <div className="flex items-center gap-6 ml-7">
                      <div>
                        <p className="text-xs text-zinc-500">우선순위</p>
                        <div className="flex items-center gap-1 mt-1">
                          {Array.from({ length: 10 }).map((_, i) => (
                            <div
                              key={i}
                              className={`w-2 h-2 rounded-full ${i < keyword.priority ? 'bg-blue-400' : 'bg-white/[0.06]'}`}
                            />
                          ))}
                          <span className="ml-1 text-xs text-zinc-400">
                            {keyword.priority}/10
                          </span>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-zinc-500">매칭 횟수</p>
                        <p className="text-sm text-white mt-1">
                          {keyword.match_count.toLocaleString()}회
                        </p>
                      </div>

                      {keyword.last_matched_at && (
                        <div>
                          <p className="text-xs text-zinc-500">최근 매칭</p>
                          <p className="text-sm text-white mt-1">
                            {new Date(keyword.last_matched_at).toLocaleDateString('ko-KR')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteKeyword(keyword.id)}
                    className="h-8 w-8 flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded text-red-400 transition-colors"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

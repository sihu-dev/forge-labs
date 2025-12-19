/**
 * HEPHAITOS - New Strategy Page
 * 새 전략 생성 페이지 (No-Code Builder)
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewStrategyPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [step, setStep] = useState(1);

  const handleContinue = () => {
    if (step === 1 && name.trim()) {
      // 실제로는 전략을 생성하고 빌더로 이동
      router.push(`/dashboard/strategies/builder?name=${encodeURIComponent(name)}`);
    }
  };

  const templates = [
    {
      id: 'rsi-reversal',
      name: 'RSI 역추세',
      description: 'RSI 지표를 활용한 과매수/과매도 역추세 전략',
      difficulty: '초급',
      icon: '📉',
    },
    {
      id: 'macd-cross',
      name: 'MACD 크로스',
      description: 'MACD 라인과 시그널 라인의 교차를 활용한 추세 전략',
      difficulty: '중급',
      icon: '📈',
    },
    {
      id: 'bb-breakout',
      name: '볼린저밴드 브레이크아웃',
      description: '볼린저밴드 상하단 터치를 활용한 변동성 전략',
      difficulty: '중급',
      icon: '🎯',
    },
    {
      id: 'blank',
      name: '빈 캔버스',
      description: '처음부터 직접 만들기',
      difficulty: '-',
      icon: '✨',
    },
  ];

  return (
    <div className="max-w-3xl mx-auto py-8">
      {/* 뒤로가기 */}
      <Link
        href="/dashboard/strategies"
        className="inline-flex items-center gap-2 text-gray-11 hover:text-gray-12 mb-6 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span>전략 목록</span>
      </Link>

      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">새 전략 만들기</h1>
        <p className="text-gray-11 mt-1">블록을 조합해 나만의 트레이딩 전략을 만드세요</p>
      </div>

      {/* 스텝 인디케이터 */}
      <div className="flex items-center gap-4 mb-8">
        <div
          className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-500' : 'text-gray-10'}`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-5 text-gray-10'
            }`}
          >
            1
          </div>
          <span className="text-sm font-medium">기본 정보</span>
        </div>
        <div className="flex-1 h-px bg-gray-6" />
        <div
          className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-500' : 'text-gray-10'}`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-5 text-gray-10'
            }`}
          >
            2
          </div>
          <span className="text-sm font-medium">블록 빌드</span>
        </div>
        <div className="flex-1 h-px bg-gray-6" />
        <div
          className={`flex items-center gap-2 ${step >= 3 ? 'text-blue-500' : 'text-gray-10'}`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-5 text-gray-10'
            }`}
          >
            3
          </div>
          <span className="text-sm font-medium">백테스트</span>
        </div>
      </div>

      {/* 폼 */}
      <div className="space-y-6">
        {/* 전략 이름 */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-11 mb-2">
            전략 이름 <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: RSI 역추세 전략"
            className="w-full px-4 py-3 bg-gray-2 border border-gray-6 rounded-xl text-gray-12 placeholder:text-gray-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* 설명 */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-11 mb-2">
            설명 (선택)
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="전략에 대한 간단한 설명을 입력하세요"
            rows={3}
            className="w-full px-4 py-3 bg-gray-2 border border-gray-6 rounded-xl text-gray-12 placeholder:text-gray-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        {/* 템플릿 선택 */}
        <div>
          <label className="block text-sm font-medium text-gray-11 mb-3">템플릿으로 시작</label>
          <div className="grid grid-cols-2 gap-3">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => {
                  if (template.id === 'blank') {
                    setName(name || '새 전략');
                  } else {
                    setName(template.name);
                    setDescription(template.description);
                  }
                }}
                className="flex items-start gap-3 p-4 rounded-xl bg-gray-2 border border-gray-6 hover:border-blue-500 text-left transition-colors"
              >
                <div className="text-2xl">{template.icon}</div>
                <div>
                  <p className="font-medium">{template.name}</p>
                  <p className="text-sm text-gray-10 mt-0.5">{template.description}</p>
                  {template.difficulty !== '-' && (
                    <span className="inline-block mt-2 px-2 py-0.5 text-xs rounded-full bg-gray-5 text-gray-11">
                      {template.difficulty}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 버튼 */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-6">
        <Link
          href="/dashboard/strategies"
          className="px-4 py-2.5 text-gray-11 hover:text-gray-12 transition-colors"
        >
          취소
        </Link>
        <button
          onClick={handleContinue}
          disabled={!name.trim()}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-5 disabled:text-gray-10 rounded-xl font-medium transition-colors"
        >
          <span>빌더로 이동</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

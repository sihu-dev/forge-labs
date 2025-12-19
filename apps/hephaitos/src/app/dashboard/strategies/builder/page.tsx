/**
 * HEPHAITOS - Strategy Builder Page
 * No-Code 전략 빌더 페이지
 */

'use client';

import { useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

// 블록 타입
interface Block {
  id: string;
  type: string;
  category: 'indicator' | 'condition' | 'logic' | 'action' | 'risk';
  name: string;
  params: Record<string, number | string>;
  position: { x: number; y: number };
}

// 연결 타입
interface Connection {
  id: string;
  from: string;
  to: string;
}

// 블록 정의
const BLOCK_DEFINITIONS = {
  indicator: {
    label: '지표',
    color: '#3B82F6',
    blocks: [
      { type: 'RSI', name: 'RSI', defaultParams: { period: 14 } },
      { type: 'MACD', name: 'MACD', defaultParams: { fast: 12, slow: 26, signal: 9 } },
      { type: 'BB', name: '볼린저밴드', defaultParams: { period: 20, stdDev: 2 } },
      { type: 'SMA', name: '이동평균', defaultParams: { period: 20 } },
      { type: 'VOL', name: '거래량', defaultParams: { period: 20 } },
    ],
  },
  condition: {
    label: '조건',
    color: '#8B5CF6',
    blocks: [
      { type: 'GT', name: '크다 (>)', defaultParams: { threshold: 70 } },
      { type: 'LT', name: '작다 (<)', defaultParams: { threshold: 30 } },
      { type: 'CROSS_UP', name: '상향돌파', defaultParams: {} },
      { type: 'CROSS_DOWN', name: '하향돌파', defaultParams: {} },
    ],
  },
  logic: {
    label: '논리',
    color: '#EAB308',
    blocks: [
      { type: 'AND', name: 'AND', defaultParams: {} },
      { type: 'OR', name: 'OR', defaultParams: {} },
      { type: 'NOT', name: 'NOT', defaultParams: {} },
    ],
  },
  action: {
    label: '액션',
    color: '#22C55E',
    blocks: [
      { type: 'BUY', name: '매수', defaultParams: { percentage: 10 } },
      { type: 'SELL', name: '매도', defaultParams: { percentage: 100 } },
      { type: 'HOLD', name: '홀드', defaultParams: {} },
    ],
  },
  risk: {
    label: '리스크',
    color: '#F97316',
    blocks: [
      { type: 'STOP_LOSS', name: '손절', defaultParams: { percentage: 3 } },
      { type: 'TAKE_PROFIT', name: '익절', defaultParams: { percentage: 5 } },
    ],
  },
};

function BuilderContent() {
  const searchParams = useSearchParams();
  const strategyName = searchParams.get('name') || '새 전략';

  const [blocks, setBlocks] = useState<Block[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('indicator');

  // 블록 추가
  const addBlock = useCallback((category: string, blockDef: { type: string; name: string; defaultParams: Record<string, number | string> }) => {
    const newBlock: Block = {
      id: `block-${Date.now()}`,
      type: blockDef.type,
      category: category as Block['category'],
      name: blockDef.name,
      params: { ...blockDef.defaultParams },
      position: { x: 200 + blocks.length * 50, y: 200 + blocks.length * 30 },
    };
    setBlocks([...blocks, newBlock]);
  }, [blocks]);

  // 블록 삭제
  const deleteBlock = useCallback((id: string) => {
    setBlocks(blocks.filter((b) => b.id !== id));
    setConnections(connections.filter((c) => c.from !== id && c.to !== id));
    if (selectedBlock === id) setSelectedBlock(null);
  }, [blocks, connections, selectedBlock]);

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-6 bg-gray-2">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/strategies"
            className="p-2 text-gray-10 hover:text-gray-12 hover:bg-gray-4 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="font-semibold">{strategyName}</h1>
            <p className="text-xs text-gray-10">저장되지 않음</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 text-sm bg-gray-4 hover:bg-gray-5 rounded-lg transition-colors">
            저장
          </button>
          <button className="px-3 py-1.5 text-sm bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors">
            백테스트
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* 블록 팔레트 */}
        <div className="w-64 border-r border-gray-6 bg-gray-2 overflow-y-auto">
          {/* 카테고리 탭 */}
          <div className="flex flex-wrap gap-1 p-2 border-b border-gray-6">
            {Object.entries(BLOCK_DEFINITIONS).map(([key, def]) => (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  activeCategory === key
                    ? 'text-white'
                    : 'text-gray-10 hover:text-gray-12'
                }`}
                style={{
                  backgroundColor: activeCategory === key ? def.color : 'transparent',
                }}
              >
                {def.label}
              </button>
            ))}
          </div>

          {/* 블록 목록 */}
          <div className="p-2 space-y-1">
            {BLOCK_DEFINITIONS[activeCategory as keyof typeof BLOCK_DEFINITIONS]?.blocks.map(
              (blockDef) => (
                <button
                  key={blockDef.type}
                  onClick={() => addBlock(activeCategory, blockDef as { type: string; name: string; defaultParams: Record<string, number | string> })}
                  className="w-full flex items-center gap-2 p-2 rounded-lg bg-gray-3 hover:bg-gray-4 text-left transition-colors"
                >
                  <div
                    className="w-3 h-3 rounded-sm"
                    style={{
                      backgroundColor:
                        BLOCK_DEFINITIONS[activeCategory as keyof typeof BLOCK_DEFINITIONS]?.color,
                    }}
                  />
                  <span className="text-sm">{blockDef.name}</span>
                </button>
              )
            )}
          </div>
        </div>

        {/* 캔버스 */}
        <div className="flex-1 relative bg-gray-1 overflow-hidden">
          {/* 그리드 배경 */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(to right, var(--gray-3) 1px, transparent 1px),
                linear-gradient(to bottom, var(--gray-3) 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px',
            }}
          />

          {/* 블록들 */}
          {blocks.map((block) => (
            <div
              key={block.id}
              onClick={() => setSelectedBlock(block.id)}
              className={`absolute p-3 rounded-xl border-2 cursor-move select-none transition-shadow ${
                selectedBlock === block.id ? 'ring-2 ring-blue-500' : ''
              }`}
              style={{
                left: block.position.x,
                top: block.position.y,
                backgroundColor: 'var(--gray-2)',
                borderColor:
                  BLOCK_DEFINITIONS[block.category as keyof typeof BLOCK_DEFINITIONS]?.color,
              }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{
                    backgroundColor:
                      BLOCK_DEFINITIONS[block.category as keyof typeof BLOCK_DEFINITIONS]?.color,
                  }}
                />
                <span className="text-sm font-medium">{block.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteBlock(block.id);
                  }}
                  className="ml-2 p-0.5 text-gray-10 hover:text-red-400 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
              {Object.keys(block.params).length > 0 && (
                <div className="mt-2 text-xs text-gray-10">
                  {Object.entries(block.params).map(([key, value]) => (
                    <div key={key}>
                      {key}: {value}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* 빈 상태 */}
          {blocks.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-5xl mb-4">🧩</div>
                <p className="text-gray-10">왼쪽 패널에서 블록을 드래그하여 시작하세요</p>
              </div>
            </div>
          )}
        </div>

        {/* 속성 패널 */}
        {selectedBlock && (
          <div className="w-64 border-l border-gray-6 bg-gray-2 p-4">
            <h3 className="font-semibold mb-4">블록 속성</h3>
            {(() => {
              const block = blocks.find((b) => b.id === selectedBlock);
              if (!block) return null;
              return (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-10 mb-1">타입</p>
                    <p className="font-medium">{block.name}</p>
                  </div>
                  {Object.entries(block.params).map(([key, value]) => (
                    <div key={key}>
                      <label className="block text-sm text-gray-10 mb-1">{key}</label>
                      <input
                        type="number"
                        value={value}
                        onChange={(e) => {
                          setBlocks(
                            blocks.map((b) =>
                              b.id === selectedBlock
                                ? { ...b, params: { ...b.params, [key]: Number(e.target.value) } }
                                : b
                            )
                          );
                        }}
                        className="w-full px-3 py-2 bg-gray-3 border border-gray-6 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}

export default function StrategyBuilderPage() {
  return (
    <Suspense
      fallback={
        <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <BuilderContent />
    </Suspense>
  );
}

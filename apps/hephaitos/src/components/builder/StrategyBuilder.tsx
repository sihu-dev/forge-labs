/**
 * HEPHAITOS - Strategy Builder Component
 * L3 (Tissues) - No-Code Builder 메인 레이아웃
 *
 * BlockPalette + BuilderCanvas + SettingsPanel 통합
 *
 * QRY-H-4-004
 */

'use client';

import * as React from 'react';
import { useState, useCallback, useMemo } from 'react';
import { Button, Separator } from '@forge/ui';
import { cn } from '@/lib/utils';
import { BlockPalette } from './BlockPalette';
import { BuilderCanvas } from './BuilderCanvas';
import { SettingsPanel } from './SettingsPanel';
import { blockCategories } from './block-definitions';
import type { BlockDefinition, StrategyNode, StrategyEdge, Strategy } from './types';

/**
 * 블록 정의 맵
 */
const blockDefinitionsMap = new Map<string, BlockDefinition>(
  blockCategories.flatMap((cat) => cat.blocks.map((b) => [b.id, b]))
);

/**
 * 기본 전략 생성
 */
const createDefaultStrategy = (): Strategy => ({
  id: `strategy-${Date.now()}`,
  name: '새 전략',
  description: '',
  assetType: 'crypto',
  timeframe: '1h',
  positionSize: 10,
  nodes: [],
  edges: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

/**
 * StrategyBuilder Props
 */
export interface StrategyBuilderProps {
  /** 초기 전략 */
  initialStrategy?: Strategy;
  /** 저장 콜백 */
  onSave?: (strategy: Strategy) => void;
  /** 백테스트 실행 콜백 */
  onRunBacktest?: (strategy: Strategy) => void;
  /** 클래스명 */
  className?: string;
}

/**
 * Strategy Builder Component
 *
 * No-Code Builder 메인 컴포넌트
 * - 왼쪽: BlockPalette (블록 목록)
 * - 중앙: BuilderCanvas (캔버스)
 * - 오른쪽: SettingsPanel (설정)
 */
export const StrategyBuilder: React.FC<StrategyBuilderProps> = ({
  initialStrategy,
  onSave,
  onRunBacktest,
  className,
}) => {
  // 전략 상태
  const [strategy, setStrategy] = useState<Strategy>(
    initialStrategy || createDefaultStrategy()
  );
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // 선택된 노드
  const selectedNode = useMemo(
    () => strategy.nodes.find((n) => n.id === selectedNodeId) || null,
    [strategy.nodes, selectedNodeId]
  );

  // 노드 변경 핸들러
  const handleNodesChange = useCallback((nodes: StrategyNode[]) => {
    setStrategy((prev) => ({
      ...prev,
      nodes,
      updatedAt: new Date().toISOString(),
    }));
    setIsDirty(true);
  }, []);

  // 엣지 변경 핸들러
  const handleEdgesChange = useCallback((edges: StrategyEdge[]) => {
    setStrategy((prev) => ({
      ...prev,
      edges,
      updatedAt: new Date().toISOString(),
    }));
    setIsDirty(true);
  }, []);

  // 노드 선택 핸들러
  const handleNodeSelect = useCallback((nodeId: string | null) => {
    setSelectedNodeId(nodeId);
  }, []);

  // 파라미터 변경 핸들러
  const handleParamChange = useCallback(
    (nodeId: string, paramName: string, value: unknown) => {
      setStrategy((prev) => ({
        ...prev,
        nodes: prev.nodes.map((n) =>
          n.id === nodeId
            ? { ...n, params: { ...n.params, [paramName]: value } }
            : n
        ),
        updatedAt: new Date().toISOString(),
      }));
      setIsDirty(true);
    },
    []
  );

  // 노드 삭제 핸들러
  const handleNodeDelete = useCallback(
    (nodeId: string) => {
      setStrategy((prev) => ({
        ...prev,
        nodes: prev.nodes.filter((n) => n.id !== nodeId),
        edges: prev.edges.filter(
          (e) => e.source.nodeId !== nodeId && e.target.nodeId !== nodeId
        ),
        updatedAt: new Date().toISOString(),
      }));
      if (selectedNodeId === nodeId) {
        setSelectedNodeId(null);
      }
      setIsDirty(true);
    },
    [selectedNodeId]
  );

  // 노드 복제 핸들러
  const handleNodeDuplicate = useCallback(
    (nodeId: string) => {
      const node = strategy.nodes.find((n) => n.id === nodeId);
      if (!node) return;

      const newNode: StrategyNode = {
        ...node,
        id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        position: {
          x: node.position.x + 30,
          y: node.position.y + 30,
        },
      };

      setStrategy((prev) => ({
        ...prev,
        nodes: [...prev.nodes, newNode],
        updatedAt: new Date().toISOString(),
      }));
      setSelectedNodeId(newNode.id);
      setIsDirty(true);
    },
    [strategy.nodes]
  );

  // 저장 핸들러
  const handleSave = useCallback(() => {
    onSave?.(strategy);
    setIsDirty(false);
  }, [strategy, onSave]);

  // 백테스트 실행 핸들러
  const handleRunBacktest = useCallback(() => {
    onRunBacktest?.(strategy);
  }, [strategy, onRunBacktest]);

  // 전략 이름 변경 핸들러
  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setStrategy((prev) => ({
        ...prev,
        name: e.target.value,
        updatedAt: new Date().toISOString(),
      }));
      setIsDirty(true);
    },
    []
  );

  // 초기화 핸들러
  const handleClear = useCallback(() => {
    if (
      strategy.nodes.length > 0 &&
      !window.confirm('모든 블록이 삭제됩니다. 계속하시겠습니까?')
    ) {
      return;
    }
    setStrategy(createDefaultStrategy());
    setSelectedNodeId(null);
    setIsDirty(false);
  }, [strategy.nodes.length]);

  // 통계 계산
  const stats = useMemo(() => {
    const nodeCount = strategy.nodes.length;
    const edgeCount = strategy.edges.length;
    const hasAction = strategy.nodes.some((n) => {
      const blockDef = blockDefinitionsMap.get(n.blockId);
      return blockDef?.type === 'action';
    });
    const hasCondition = strategy.nodes.some((n) => {
      const blockDef = blockDefinitionsMap.get(n.blockId);
      return blockDef?.type === 'condition' || blockDef?.type === 'indicator';
    });

    return {
      nodeCount,
      edgeCount,
      isComplete: hasAction && hasCondition && edgeCount > 0,
    };
  }, [strategy.nodes, strategy.edges]);

  return (
    <div className={cn('flex flex-col h-full bg-gray-1', className)}>
      {/* 상단 툴바 */}
      <div className="flex-shrink-0 flex items-center gap-4 px-4 py-3 border-b border-gray-6 bg-gray-2">
        {/* 전략 이름 */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-xl">📊</span>
          <input
            type="text"
            value={strategy.name}
            onChange={handleNameChange}
            className={cn(
              'bg-transparent border-none outline-none text-lg font-semibold text-gray-12',
              'focus:outline-none focus:ring-0 w-full max-w-[300px]'
            )}
            placeholder="전략 이름"
          />
          {isDirty && (
            <span className="text-xs text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded">
              미저장
            </span>
          )}
        </div>

        {/* 통계 */}
        <div className="flex items-center gap-4 text-sm text-gray-10">
          <span>블록: {stats.nodeCount}</span>
          <span>연결: {stats.edgeCount}</span>
          {stats.isComplete ? (
            <span className="text-green-500">준비 완료</span>
          ) : (
            <span className="text-yellow-500">구성 필요</span>
          )}
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* 액션 버튼 */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleClear}>
            초기화
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={!isDirty}
          >
            저장
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleRunBacktest}
            disabled={!stats.isComplete}
          >
            백테스트 실행
          </Button>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 flex min-h-0">
        {/* 왼쪽: 블록 팔레트 */}
        <BlockPalette className="w-[280px] flex-shrink-0" />

        {/* 중앙: 캔버스 */}
        <BuilderCanvas
          nodes={strategy.nodes}
          edges={strategy.edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onNodeSelect={handleNodeSelect}
          selectedNodeId={selectedNodeId}
          className="flex-1"
        />

        {/* 오른쪽: 설정 패널 */}
        <SettingsPanel
          selectedNode={selectedNode}
          onParamChange={handleParamChange}
          onNodeDelete={handleNodeDelete}
          onNodeDuplicate={handleNodeDuplicate}
          className="w-[300px] flex-shrink-0"
        />
      </div>

      {/* 하단 상태바 */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 border-t border-gray-6 bg-gray-2 text-xs text-gray-10">
        <div className="flex items-center gap-4">
          <span>자산: {strategy.assetType}</span>
          <span>타임프레임: {strategy.timeframe}</span>
          <span>포지션 크기: {strategy.positionSize}%</span>
        </div>
        <div>
          마지막 수정: {new Date(strategy.updatedAt).toLocaleString('ko-KR')}
        </div>
      </div>
    </div>
  );
};

export default StrategyBuilder;

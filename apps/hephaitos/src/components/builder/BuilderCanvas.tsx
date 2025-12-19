/**
 * HEPHAITOS - Builder Canvas Component
 * L3 (Tissues) - No-Code Builder 캔버스
 *
 * 전략 블록을 배치하고 연결하는 메인 캔버스
 *
 * QRY-H-4-002
 */

'use client';

import * as React from 'react';
import {
  useState,
  useCallback,
  useRef,
  useMemo,
  useEffect,
} from 'react';
import { cn } from '@/lib/utils';
import { blockCategories } from './block-definitions';
import type {
  BlockDefinition,
  StrategyNode,
  StrategyEdge,
  CanvasState,
  BlockPort,
} from './types';

/**
 * 모든 블록 정의를 ID로 조회할 수 있는 맵
 */
const blockDefinitionsMap = new Map<string, BlockDefinition>(
  blockCategories.flatMap((cat) => cat.blocks.map((b) => [b.id, b]))
);

/**
 * 노드 렌더링 컴포넌트
 */
interface CanvasNodeProps {
  node: StrategyNode;
  blockDef: BlockDefinition;
  isSelected: boolean;
  onSelect: (nodeId: string) => void;
  onMove: (nodeId: string, position: { x: number; y: number }) => void;
  onPortClick: (nodeId: string, portId: string, isOutput: boolean) => void;
  isConnecting: boolean;
  connectingPortType: 'number' | 'boolean' | 'string' | null;
}

const CanvasNode: React.FC<CanvasNodeProps> = ({
  node,
  blockDef,
  isSelected,
  onSelect,
  onMove,
  onPortClick,
  isConnecting,
  connectingPortType,
}) => {
  const nodeRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('.port')) return;
      e.stopPropagation();
      onSelect(node.id);
      setIsDragging(true);
      const rect = nodeRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    },
    [node.id, onSelect]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const canvas = nodeRef.current?.closest('.builder-canvas');
      if (!canvas) return;
      const canvasRect = canvas.getBoundingClientRect();
      const newX = e.clientX - canvasRect.left - dragOffset.x;
      const newY = e.clientY - canvasRect.top - dragOffset.y;
      onMove(node.id, { x: Math.max(0, newX), y: Math.max(0, newY) });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, node.id, onMove]);

  const statusColors = {
    idle: 'bg-gray-400',
    running: 'bg-blue-500 animate-pulse',
    success: 'bg-green-500',
    error: 'bg-red-500',
  };

  return (
    <div
      ref={nodeRef}
      className={cn(
        'absolute rounded-lg shadow-lg bg-gray-1 border-2 min-w-[180px]',
        'select-none cursor-move transition-shadow duration-150',
        isSelected ? 'border-blue-500 shadow-blue-500/20' : 'border-gray-6',
        isDragging && 'shadow-xl z-50'
      )}
      style={{
        left: node.position.x,
        top: node.position.y,
        borderTopColor: blockDef.color,
        borderTopWidth: '3px',
      }}
      onMouseDown={handleMouseDown}
    >
      {/* 헤더 */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-6">
        <span className="text-lg">{blockDef.icon}</span>
        <span className="text-sm font-medium text-gray-12 flex-1 truncate">
          {blockDef.label}
        </span>
        <span className={cn('w-2 h-2 rounded-full', statusColors[node.status])} />
      </div>

      {/* 현재값 표시 */}
      {node.currentValue !== undefined && (
        <div className="px-3 py-1.5 text-xs text-gray-11 bg-gray-2 border-b border-gray-6">
          {typeof node.currentValue === 'boolean'
            ? node.currentValue
              ? 'TRUE'
              : 'FALSE'
            : node.currentValue.toFixed(2)}
        </div>
      )}

      {/* 에러 표시 */}
      {node.error && (
        <div className="px-3 py-1.5 text-xs text-red-500 bg-red-500/10 border-b border-gray-6">
          {node.error}
        </div>
      )}

      {/* 포트 영역 */}
      <div className="flex justify-between px-2 py-2">
        {/* 입력 포트 */}
        <div className="flex flex-col gap-1.5">
          {blockDef.inputs.map((port) => (
            <button
              key={port.id}
              className={cn(
                'port flex items-center gap-1.5 text-xs text-gray-11 hover:text-gray-12',
                'transition-colors',
                isConnecting &&
                  connectingPortType === port.type &&
                  'text-blue-500'
              )}
              onClick={() => onPortClick(node.id, port.id, false)}
            >
              <span
                className={cn(
                  'w-2.5 h-2.5 rounded-full border-2 border-current',
                  'hover:bg-current transition-colors'
                )}
              />
              <span>{port.label || port.name}</span>
            </button>
          ))}
        </div>

        {/* 출력 포트 */}
        <div className="flex flex-col gap-1.5 items-end">
          {blockDef.outputs.map((port) => (
            <button
              key={port.id}
              className={cn(
                'port flex items-center gap-1.5 text-xs text-gray-11 hover:text-gray-12',
                'transition-colors'
              )}
              onClick={() => onPortClick(node.id, port.id, true)}
            >
              <span>{port.label || port.name}</span>
              <span
                className={cn(
                  'w-2.5 h-2.5 rounded-full bg-current',
                  'hover:scale-125 transition-transform'
                )}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * 연결선 렌더링 컴포넌트
 */
interface ConnectionLineProps {
  edge: StrategyEdge;
  nodes: StrategyNode[];
  sourceBlockDef: BlockDefinition;
  targetBlockDef: BlockDefinition;
}

const ConnectionLine: React.FC<ConnectionLineProps> = ({
  edge,
  nodes,
  sourceBlockDef,
  targetBlockDef,
}) => {
  const sourceNode = nodes.find((n) => n.id === edge.source.nodeId);
  const targetNode = nodes.find((n) => n.id === edge.target.nodeId);

  if (!sourceNode || !targetNode) return null;

  // 포트 위치 계산 (노드 크기 기준)
  const nodeWidth = 180;
  const headerHeight = 44;
  const portHeight = 24;

  const sourcePortIndex = sourceBlockDef.outputs.findIndex(
    (p) => p.id === edge.source.portId
  );
  const targetPortIndex = targetBlockDef.inputs.findIndex(
    (p) => p.id === edge.target.portId
  );

  const startX = sourceNode.position.x + nodeWidth;
  const startY =
    sourceNode.position.y + headerHeight + portHeight * (sourcePortIndex + 0.5);
  const endX = targetNode.position.x;
  const endY =
    targetNode.position.y + headerHeight + portHeight * (targetPortIndex + 0.5);

  // 베지어 커브 제어점
  const controlOffset = Math.min(100, Math.abs(endX - startX) / 2);

  const path = `M ${startX} ${startY} C ${startX + controlOffset} ${startY}, ${endX - controlOffset} ${endY}, ${endX} ${endY}`;

  return (
    <path
      d={path}
      stroke="#6366f1"
      strokeWidth={2}
      fill="none"
      className="transition-colors hover:stroke-blue-400"
      style={{ filter: 'drop-shadow(0 0 2px rgba(99, 102, 241, 0.3))' }}
    />
  );
};

/**
 * BuilderCanvas Props
 */
export interface BuilderCanvasProps {
  nodes: StrategyNode[];
  edges: StrategyEdge[];
  onNodesChange: (nodes: StrategyNode[]) => void;
  onEdgesChange: (edges: StrategyEdge[]) => void;
  onNodeSelect: (nodeId: string | null) => void;
  selectedNodeId: string | null;
  className?: string;
}

/**
 * Builder Canvas Component
 *
 * No-Code Builder의 메인 캔버스
 * - 블록 드롭 영역
 * - 노드 배치 및 이동
 * - 연결선 렌더링
 * - 줌/팬 지원
 */
export const BuilderCanvas: React.FC<BuilderCanvasProps> = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onNodeSelect,
  selectedNodeId,
  className,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasState, setCanvasState] = useState<CanvasState>({
    zoom: 1,
    pan: { x: 0, y: 0 },
    selectedNodeId: null,
    isConnecting: false,
    connectingFrom: null,
  });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // 드래그 앤 드롭 핸들러
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const data = e.dataTransfer.getData('application/json');
      if (!data) return;

      try {
        const blockDef: BlockDefinition = JSON.parse(data);
        const canvasRect = canvasRef.current?.getBoundingClientRect();
        if (!canvasRect) return;

        const position = {
          x: (e.clientX - canvasRect.left - canvasState.pan.x) / canvasState.zoom,
          y: (e.clientY - canvasRect.top - canvasState.pan.y) / canvasState.zoom,
        };

        // 새 노드 생성
        const newNode: StrategyNode = {
          id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          blockId: blockDef.id,
          position,
          params: Object.fromEntries(
            blockDef.params.map((p) => [p.name, p.default])
          ),
          status: 'idle',
        };

        onNodesChange([...nodes, newNode]);
        onNodeSelect(newNode.id);
      } catch (error) {
        console.error('Failed to parse dropped block:', error);
      }
    },
    [nodes, onNodesChange, onNodeSelect, canvasState]
  );

  // 노드 이동 핸들러
  const handleNodeMove = useCallback(
    (nodeId: string, position: { x: number; y: number }) => {
      onNodesChange(
        nodes.map((n) => (n.id === nodeId ? { ...n, position } : n))
      );
    },
    [nodes, onNodesChange]
  );

  // 노드 선택 핸들러
  const handleNodeSelect = useCallback(
    (nodeId: string) => {
      onNodeSelect(nodeId);
    },
    [onNodeSelect]
  );

  // 포트 클릭 핸들러 (연결 시작/완료)
  const handlePortClick = useCallback(
    (nodeId: string, portId: string, isOutput: boolean) => {
      if (!canvasState.isConnecting) {
        // 연결 시작 (출력 포트에서만)
        if (isOutput) {
          setCanvasState((prev) => ({
            ...prev,
            isConnecting: true,
            connectingFrom: { nodeId, portId },
          }));
        }
      } else {
        // 연결 완료 (입력 포트에서만)
        if (!isOutput && canvasState.connectingFrom) {
          const sourceNodeId = canvasState.connectingFrom.nodeId;
          const sourcePortId = canvasState.connectingFrom.portId;

          // 자기 자신에게 연결 방지
          if (sourceNodeId !== nodeId) {
            const newEdge: StrategyEdge = {
              id: `edge-${Date.now()}`,
              source: { nodeId: sourceNodeId, portId: sourcePortId },
              target: { nodeId, portId },
            };
            onEdgesChange([...edges, newEdge]);
          }
        }

        // 연결 상태 초기화
        setCanvasState((prev) => ({
          ...prev,
          isConnecting: false,
          connectingFrom: null,
        }));
      }
    },
    [canvasState, edges, onEdgesChange]
  );

  // 캔버스 클릭 (선택 해제)
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === canvasRef.current || (e.target as HTMLElement).classList.contains('canvas-inner')) {
        onNodeSelect(null);
        setCanvasState((prev) => ({
          ...prev,
          isConnecting: false,
          connectingFrom: null,
        }));
      }
    },
    [onNodeSelect]
  );

  // 줌 핸들러
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setCanvasState((prev) => ({
      ...prev,
      zoom: Math.max(0.25, Math.min(2, prev.zoom * delta)),
    }));
  }, []);

  // 팬 핸들러
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  }, []);

  useEffect(() => {
    if (!isPanning) return;

    const handleMouseMove = (e: MouseEvent) => {
      setCanvasState((prev) => ({
        ...prev,
        pan: {
          x: prev.pan.x + (e.clientX - panStart.x),
          y: prev.pan.y + (e.clientY - panStart.y),
        },
      }));
      setPanStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => {
      setIsPanning(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isPanning, panStart]);

  // 연결 중일 때 포트 타입 확인
  const connectingPortType = useMemo(() => {
    if (!canvasState.connectingFrom) return null;
    const node = nodes.find((n) => n.id === canvasState.connectingFrom?.nodeId);
    if (!node) return null;
    const blockDef = blockDefinitionsMap.get(node.blockId);
    const port = blockDef?.outputs.find(
      (p) => p.id === canvasState.connectingFrom?.portId
    );
    return port?.type || null;
  }, [canvasState.connectingFrom, nodes]);

  // 줌 리셋
  const handleZoomReset = useCallback(() => {
    setCanvasState((prev) => ({ ...prev, zoom: 1, pan: { x: 0, y: 0 } }));
  }, []);

  // 노드 삭제 (Delete 키)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && selectedNodeId) {
        // 노드 삭제
        onNodesChange(nodes.filter((n) => n.id !== selectedNodeId));
        // 관련 연결 삭제
        onEdgesChange(
          edges.filter(
            (edge) =>
              edge.source.nodeId !== selectedNodeId &&
              edge.target.nodeId !== selectedNodeId
          )
        );
        onNodeSelect(null);
      }
      if (e.key === 'Escape') {
        setCanvasState((prev) => ({
          ...prev,
          isConnecting: false,
          connectingFrom: null,
        }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, nodes, edges, onNodesChange, onEdgesChange, onNodeSelect]);

  return (
    <div
      ref={canvasRef}
      className={cn(
        'builder-canvas relative flex-1 overflow-hidden',
        'bg-gray-2 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)]',
        'bg-[size:20px_20px]',
        isPanning && 'cursor-grabbing',
        className
      )}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleCanvasClick}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
    >
      {/* 캔버스 컨트롤 */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-gray-1 rounded-lg border border-gray-6 p-1">
        <button
          onClick={() =>
            setCanvasState((prev) => ({
              ...prev,
              zoom: Math.min(2, prev.zoom * 1.2),
            }))
          }
          className="p-2 hover:bg-gray-3 rounded text-gray-11 hover:text-gray-12 transition-colors"
        >
          +
        </button>
        <button
          onClick={handleZoomReset}
          className="px-2 py-1 text-xs text-gray-11 hover:text-gray-12 transition-colors min-w-[48px]"
        >
          {Math.round(canvasState.zoom * 100)}%
        </button>
        <button
          onClick={() =>
            setCanvasState((prev) => ({
              ...prev,
              zoom: Math.max(0.25, prev.zoom / 1.2),
            }))
          }
          className="p-2 hover:bg-gray-3 rounded text-gray-11 hover:text-gray-12 transition-colors"
        >
          -
        </button>
      </div>

      {/* 연결 중 안내 */}
      {canvasState.isConnecting && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2 bg-blue-500 text-white text-sm rounded-lg shadow-lg">
          입력 포트를 클릭하여 연결하세요 (ESC로 취소)
        </div>
      )}

      {/* 캔버스 내부 (줌/팬 적용) */}
      <div
        className="canvas-inner absolute inset-0"
        style={{
          transform: `translate(${canvasState.pan.x}px, ${canvasState.pan.y}px) scale(${canvasState.zoom})`,
          transformOrigin: '0 0',
        }}
      >
        {/* 연결선 SVG */}
        <svg className="absolute inset-0 pointer-events-none w-full h-full overflow-visible">
          {edges.map((edge) => {
            const sourceNode = nodes.find((n) => n.id === edge.source.nodeId);
            const targetNode = nodes.find((n) => n.id === edge.target.nodeId);
            if (!sourceNode || !targetNode) return null;

            const sourceBlockDef = blockDefinitionsMap.get(sourceNode.blockId);
            const targetBlockDef = blockDefinitionsMap.get(targetNode.blockId);
            if (!sourceBlockDef || !targetBlockDef) return null;

            return (
              <ConnectionLine
                key={edge.id}
                edge={edge}
                nodes={nodes}
                sourceBlockDef={sourceBlockDef}
                targetBlockDef={targetBlockDef}
              />
            );
          })}
        </svg>

        {/* 노드들 */}
        {nodes.map((node) => {
          const blockDef = blockDefinitionsMap.get(node.blockId);
          if (!blockDef) return null;

          return (
            <CanvasNode
              key={node.id}
              node={node}
              blockDef={blockDef}
              isSelected={node.id === selectedNodeId}
              onSelect={handleNodeSelect}
              onMove={handleNodeMove}
              onPortClick={handlePortClick}
              isConnecting={canvasState.isConnecting}
              connectingPortType={connectingPortType}
            />
          );
        })}
      </div>

      {/* 빈 상태 */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center text-gray-10">
            <p className="text-4xl mb-4">📦</p>
            <p className="text-lg font-medium mb-2">캔버스가 비어있습니다</p>
            <p className="text-sm">왼쪽 팔레트에서 블록을 드래그하여 시작하세요</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuilderCanvas;

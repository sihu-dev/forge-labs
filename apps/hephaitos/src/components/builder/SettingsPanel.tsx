/**
 * HEPHAITOS - Settings Panel Component
 * L3 (Tissues) - No-Code Builder 설정 패널
 *
 * 선택된 블록의 파라미터를 편집하는 우측 사이드바
 *
 * QRY-H-4-003
 */

'use client';

import * as React from 'react';
import { useCallback, useMemo } from 'react';
import {
  Input,
  Label,
  Switch,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Slider,
  Button,
  Separator,
  ScrollArea,
} from '@forge/ui';
import { cn } from '@/lib/utils';
import { blockCategories } from './block-definitions';
import type { BlockDefinition, StrategyNode, BlockParam } from './types';

/**
 * 블록 정의 맵
 */
const blockDefinitionsMap = new Map<string, BlockDefinition>(
  blockCategories.flatMap((cat) => cat.blocks.map((b) => [b.id, b]))
);

/**
 * 파라미터 필드 컴포넌트
 */
interface ParamFieldProps {
  param: BlockParam;
  value: unknown;
  onChange: (value: unknown) => void;
}

const ParamField: React.FC<ParamFieldProps> = ({ param, value, onChange }) => {
  switch (param.type) {
    case 'number':
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor={param.name} className="text-sm text-gray-11">
              {param.label}
            </Label>
            <span className="text-sm text-gray-10 tabular-nums">
              {value as number}
            </span>
          </div>
          {param.min !== undefined && param.max !== undefined ? (
            <Slider
              id={param.name}
              value={[value as number]}
              onValueChange={([v]) => onChange(v)}
              min={param.min}
              max={param.max}
              step={param.step || 1}
              className="w-full"
            />
          ) : (
            <Input
              id={param.name}
              type="number"
              value={value as number}
              onChange={(e) => onChange(Number(e.target.value))}
              min={param.min}
              max={param.max}
              step={param.step}
              className="h-9"
            />
          )}
        </div>
      );

    case 'select':
      return (
        <div className="space-y-2">
          <Label htmlFor={param.name} className="text-sm text-gray-11">
            {param.label}
          </Label>
          <Select
            value={value as string}
            onValueChange={(v) => onChange(v)}
          >
            <SelectTrigger id={param.name} className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {param.options?.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );

    case 'boolean':
      return (
        <div className="flex items-center justify-between">
          <Label htmlFor={param.name} className="text-sm text-gray-11">
            {param.label}
          </Label>
          <Switch
            id={param.name}
            checked={value as boolean}
            onCheckedChange={(v) => onChange(v)}
          />
        </div>
      );

    case 'text':
      return (
        <div className="space-y-2">
          <Label htmlFor={param.name} className="text-sm text-gray-11">
            {param.label}
          </Label>
          <Input
            id={param.name}
            type="text"
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
            className="h-9"
          />
        </div>
      );

    default:
      return null;
  }
};

/**
 * SettingsPanel Props
 */
export interface SettingsPanelProps {
  /** 선택된 노드 */
  selectedNode: StrategyNode | null;
  /** 파라미터 변경 콜백 */
  onParamChange: (nodeId: string, paramName: string, value: unknown) => void;
  /** 노드 삭제 콜백 */
  onNodeDelete: (nodeId: string) => void;
  /** 노드 복제 콜백 */
  onNodeDuplicate?: (nodeId: string) => void;
  /** 클래스명 */
  className?: string;
}

/**
 * Settings Panel Component
 *
 * 선택된 블록의 설정 패널
 * - 블록 정보 표시
 * - 파라미터 편집
 * - 포트 정보 표시
 * - 삭제/복제 액션
 */
export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  selectedNode,
  onParamChange,
  onNodeDelete,
  onNodeDuplicate,
  className,
}) => {
  // 블록 정의 조회
  const blockDef = useMemo(() => {
    if (!selectedNode) return null;
    return blockDefinitionsMap.get(selectedNode.blockId) || null;
  }, [selectedNode]);

  // 파라미터 변경 핸들러
  const handleParamChange = useCallback(
    (paramName: string, value: unknown) => {
      if (selectedNode) {
        onParamChange(selectedNode.id, paramName, value);
      }
    },
    [selectedNode, onParamChange]
  );

  // 삭제 핸들러
  const handleDelete = useCallback(() => {
    if (selectedNode) {
      onNodeDelete(selectedNode.id);
    }
  }, [selectedNode, onNodeDelete]);

  // 복제 핸들러
  const handleDuplicate = useCallback(() => {
    if (selectedNode && onNodeDuplicate) {
      onNodeDuplicate(selectedNode.id);
    }
  }, [selectedNode, onNodeDuplicate]);

  // 선택된 노드가 없을 때
  if (!selectedNode || !blockDef) {
    return (
      <div
        className={cn(
          'flex flex-col h-full bg-gray-1 border-l border-gray-6',
          className
        )}
      >
        <div className="flex-shrink-0 p-4 border-b border-gray-6">
          <h2 className="text-sm font-semibold text-gray-12">설정</h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center text-gray-10">
            <p className="text-3xl mb-3">⚙️</p>
            <p className="text-sm">블록을 선택하면</p>
            <p className="text-sm">설정이 표시됩니다</p>
          </div>
        </div>
      </div>
    );
  }

  const statusLabels = {
    idle: '대기 중',
    running: '실행 중',
    success: '성공',
    error: '오류',
  };

  const statusColors = {
    idle: 'bg-gray-500',
    running: 'bg-blue-500',
    success: 'bg-green-500',
    error: 'bg-red-500',
  };

  return (
    <div
      className={cn(
        'flex flex-col h-full bg-gray-1 border-l border-gray-6',
        className
      )}
    >
      {/* 헤더 */}
      <div className="flex-shrink-0 p-4 border-b border-gray-6">
        <div className="flex items-center gap-3">
          <span
            className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
            style={{ backgroundColor: `${blockDef.color}20`, color: blockDef.color }}
          >
            {blockDef.icon}
          </span>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-gray-12 truncate">
              {blockDef.label}
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={cn('w-1.5 h-1.5 rounded-full', statusColors[selectedNode.status])}
              />
              <span className="text-xs text-gray-10">
                {statusLabels[selectedNode.status]}
              </span>
            </div>
          </div>
        </div>
        {blockDef.description && (
          <p className="mt-3 text-xs text-gray-10">{blockDef.description}</p>
        )}
      </div>

      {/* 스크롤 영역 */}
      <ScrollArea className="flex-1" size="full">
        <div className="p-4 space-y-6">
          {/* 현재 값 표시 */}
          {selectedNode.currentValue !== undefined && (
            <div className="p-3 rounded-lg bg-gray-2 border border-gray-6">
              <p className="text-xs text-gray-10 mb-1">현재 값</p>
              <p className="text-lg font-mono font-semibold text-gray-12">
                {typeof selectedNode.currentValue === 'boolean'
                  ? selectedNode.currentValue
                    ? 'TRUE'
                    : 'FALSE'
                  : selectedNode.currentValue.toFixed(4)}
              </p>
            </div>
          )}

          {/* 에러 표시 */}
          {selectedNode.error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
              <p className="text-xs text-red-400 mb-1">오류</p>
              <p className="text-sm text-red-500">{selectedNode.error}</p>
            </div>
          )}

          {/* 파라미터 섹션 */}
          {blockDef.params.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-gray-10 uppercase tracking-wider mb-3">
                파라미터
              </h3>
              <div className="space-y-4">
                {blockDef.params.map((param) => (
                  <ParamField
                    key={param.name}
                    param={param}
                    value={selectedNode.params[param.name] ?? param.default}
                    onChange={(v) => handleParamChange(param.name, v)}
                  />
                ))}
              </div>
            </div>
          )}

          <Separator className="my-4" />

          {/* 포트 정보 */}
          <div>
            <h3 className="text-xs font-medium text-gray-10 uppercase tracking-wider mb-3">
              연결 포트
            </h3>

            {/* 입력 포트 */}
            {blockDef.inputs.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-gray-10 mb-2">입력</p>
                <div className="space-y-1.5">
                  {blockDef.inputs.map((port) => (
                    <div
                      key={port.id}
                      className="flex items-center gap-2 px-2 py-1.5 rounded bg-gray-2 text-sm"
                    >
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="flex-1 text-gray-11">
                        {port.label || port.name}
                      </span>
                      <span className="text-xs text-gray-10 bg-gray-3 px-1.5 py-0.5 rounded">
                        {port.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 출력 포트 */}
            {blockDef.outputs.length > 0 && (
              <div>
                <p className="text-xs text-gray-10 mb-2">출력</p>
                <div className="space-y-1.5">
                  {blockDef.outputs.map((port) => (
                    <div
                      key={port.id}
                      className="flex items-center gap-2 px-2 py-1.5 rounded bg-gray-2 text-sm"
                    >
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="flex-1 text-gray-11">
                        {port.label || port.name}
                      </span>
                      <span className="text-xs text-gray-10 bg-gray-3 px-1.5 py-0.5 rounded">
                        {port.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Separator className="my-4" />

          {/* 노드 정보 */}
          <div>
            <h3 className="text-xs font-medium text-gray-10 uppercase tracking-wider mb-3">
              노드 정보
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-10">ID</span>
                <span className="text-gray-11 font-mono">{selectedNode.id.slice(0, 12)}...</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-10">블록 타입</span>
                <span className="text-gray-11">{blockDef.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-10">위치</span>
                <span className="text-gray-11 font-mono">
                  ({Math.round(selectedNode.position.x)}, {Math.round(selectedNode.position.y)})
                </span>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* 푸터 - 액션 버튼 */}
      <div className="flex-shrink-0 p-3 border-t border-gray-6 bg-gray-2">
        <div className="flex gap-2">
          {onNodeDuplicate && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handleDuplicate}
            >
              복제
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-red-500 hover:text-red-400 hover:border-red-500/50"
            onClick={handleDelete}
          >
            삭제
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;

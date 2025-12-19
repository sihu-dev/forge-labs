/**
 * HEPHAITOS - Block Palette Component
 * L3 (Tissues) - No-Code Builder 블록 팔레트
 *
 * 드래그 가능한 블록들을 카테고리별로 표시하는 사이드바
 *
 * QRY-H-4-001
 */

'use client';

import * as React from 'react';
import { useState, useCallback, useMemo } from 'react';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  ScrollArea,
  Input,
} from '@forge/ui';
import { blockCategories } from './block-definitions';
import type { BlockDefinition } from './types';
import { cn } from '@/lib/utils';

/**
 * 드래그 가능한 블록 아이템
 */
interface DraggableBlockProps {
  block: BlockDefinition;
  onDragStart?: (block: BlockDefinition) => void;
}

const DraggableBlock: React.FC<DraggableBlockProps> = ({ block, onDragStart }) => {
  const handleDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      // 블록 데이터를 드래그 데이터로 설정
      e.dataTransfer.setData('application/json', JSON.stringify(block));
      e.dataTransfer.effectAllowed = 'copy';

      // 콜백 호출
      onDragStart?.(block);
    },
    [block, onDragStart]
  );

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className={cn(
        'group flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-grab',
        'border border-transparent',
        'bg-gray-2 hover:bg-gray-3',
        'hover:border-gray-6',
        'transition-all duration-150',
        'active:cursor-grabbing active:scale-[0.98]',
        'select-none'
      )}
      style={{
        borderLeftColor: block.color,
        borderLeftWidth: '3px',
      }}
    >
      {/* 블록 아이콘 */}
      <span className="text-lg flex-shrink-0">{block.icon}</span>

      {/* 블록 정보 */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-12 truncate">
          {block.label}
        </p>
        {block.description && (
          <p className="text-xs text-gray-11 truncate mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {block.description}
          </p>
        )}
      </div>

      {/* 포트 표시 (입력/출력 개수) */}
      <div className="flex items-center gap-1.5 text-xs text-gray-10 opacity-0 group-hover:opacity-100 transition-opacity">
        {block.inputs.length > 0 && (
          <span className="flex items-center gap-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            {block.inputs.length}
          </span>
        )}
        {block.outputs.length > 0 && (
          <span className="flex items-center gap-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            {block.outputs.length}
          </span>
        )}
      </div>
    </div>
  );
};

/**
 * 카테고리 헤더
 */
interface CategoryHeaderProps {
  icon: string;
  label: string;
  color: string;
  count: number;
}

const CategoryHeader: React.FC<CategoryHeaderProps> = ({
  icon,
  label,
  color,
  count,
}) => (
  <div className="flex items-center gap-2 w-full">
    <span
      className="w-6 h-6 rounded-md flex items-center justify-center text-sm"
      style={{ backgroundColor: `${color}20`, color }}
    >
      {icon}
    </span>
    <span className="flex-1 text-left font-medium">{label}</span>
    <span className="text-xs text-gray-10 bg-gray-3 px-2 py-0.5 rounded-full">
      {count}
    </span>
  </div>
);

/**
 * BlockPalette Props
 */
export interface BlockPaletteProps {
  /** 현재 드래그 중인 블록 콜백 */
  onDragStart?: (block: BlockDefinition) => void;
  /** 클래스명 */
  className?: string;
  /** 기본 펼쳐질 카테고리 */
  defaultExpanded?: string[];
}

/**
 * Block Palette Component
 *
 * No-Code Builder의 블록 팔레트
 * - 카테고리별 블록 표시 (지표, 조건, 논리, 액션, 리스크)
 * - 검색 기능
 * - 드래그 앤 드롭 지원
 */
export const BlockPalette: React.FC<BlockPaletteProps> = ({
  onDragStart,
  className,
  defaultExpanded = ['indicators'],
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>(defaultExpanded);

  // 검색된 블록 필터링
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) {
      return blockCategories;
    }

    const query = searchQuery.toLowerCase();
    return blockCategories
      .map((category) => ({
        ...category,
        blocks: category.blocks.filter(
          (block) =>
            block.label.toLowerCase().includes(query) ||
            block.description?.toLowerCase().includes(query) ||
            block.id.toLowerCase().includes(query)
        ),
      }))
      .filter((category) => category.blocks.length > 0);
  }, [searchQuery]);

  // 검색 시 자동으로 카테고리 펼치기
  React.useEffect(() => {
    if (searchQuery.trim()) {
      setExpandedCategories(filteredCategories.map((cat) => cat.id));
    }
  }, [searchQuery, filteredCategories]);

  // 총 블록 수
  const totalBlocks = useMemo(
    () => blockCategories.reduce((sum, cat) => sum + cat.blocks.length, 0),
    []
  );

  const filteredBlockCount = useMemo(
    () => filteredCategories.reduce((sum, cat) => sum + cat.blocks.length, 0),
    [filteredCategories]
  );

  return (
    <div
      className={cn(
        'flex flex-col h-full bg-gray-1 border-r border-gray-6',
        className
      )}
    >
      {/* 헤더 */}
      <div className="flex-shrink-0 p-4 border-b border-gray-6">
        <h2 className="text-sm font-semibold text-gray-12 mb-3">블록</h2>

        {/* 검색 입력 */}
        <div className="relative">
          <Input
            type="text"
            placeholder="블록 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 text-sm pl-9"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-10">
            🔍
          </span>
        </div>

        {/* 블록 카운트 */}
        <p className="text-xs text-gray-10 mt-2">
          {searchQuery
            ? `${filteredBlockCount}개 / ${totalBlocks}개 블록`
            : `${totalBlocks}개 블록`}
        </p>
      </div>

      {/* 블록 목록 */}
      <ScrollArea className="flex-1" size="full">
        <div className="p-2">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-8 text-gray-10 text-sm">
              검색 결과가 없습니다
            </div>
          ) : (
            <Accordion
              type="multiple"
              value={expandedCategories}
              onValueChange={setExpandedCategories}
              className="space-y-1"
            >
              {filteredCategories.map((category) => (
                <AccordionItem
                  key={category.id}
                  value={category.id}
                  className="border-none"
                >
                  <AccordionTrigger
                    className="px-2 py-2.5 hover:bg-gray-3 rounded-lg text-sm"
                    size="sm"
                  >
                    <CategoryHeader
                      icon={category.icon}
                      label={category.label}
                      color={category.color}
                      count={category.blocks.length}
                    />
                  </AccordionTrigger>
                  <AccordionContent className="pt-1 pb-2">
                    <div className="space-y-1 pl-1">
                      {category.blocks.map((block) => (
                        <DraggableBlock
                          key={block.id}
                          block={block}
                          onDragStart={onDragStart}
                        />
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      </ScrollArea>

      {/* 푸터 - 도움말 */}
      <div className="flex-shrink-0 p-3 border-t border-gray-6 bg-gray-2">
        <p className="text-xs text-gray-10 text-center">
          블록을 드래그하여 캔버스에 추가하세요
        </p>
      </div>
    </div>
  );
};

export default BlockPalette;

'use client'

/**
 * Strategy Presets Component
 * No-Code 빌더용 전략 프리셋 템플릿
 */

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  XMarkIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ShieldCheckIcon,
  BoltIcon,
  SparklesIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline'
import type { Node, Edge } from 'reactflow'

// ============================================
// Types
// ============================================

export interface StrategyPreset {
  id: string
  name: string
  description: string
  category: 'trend' | 'reversal' | 'breakout' | 'scalping' | 'risk'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  nodes: Node[]
  edges: Edge[]
  tags: string[]
}

interface StrategyPresetsProps {
  isOpen: boolean
  onClose: () => void
  onApply: (nodes: Node[], edges: Edge[], name: string) => void
}

// ============================================
// Preset Templates
// ============================================

export const STRATEGY_PRESETS: StrategyPreset[] = [
  // 1. 골든크로스 전략
  {
    id: 'golden-cross',
    name: '골든크로스',
    description: '50일 이평선이 200일 이평선을 상향 돌파할 때 매수, 하향 돌파 시 매도',
    category: 'trend',
    difficulty: 'beginner',
    tags: ['추세추종', '이동평균', '장기'],
    nodes: [
      {
        id: 'preset-trigger-1',
        type: 'trigger',
        position: { x: 100, y: 200 },
        data: {
          label: '시장 트리거',
          config: {
            type: 'price_cross',
            symbol: 'BTC/USDT',
            timeframe: '1d',
          },
        },
      },
      {
        id: 'preset-indicator-sma50',
        type: 'indicator',
        position: { x: 350, y: 100 },
        data: {
          label: 'SMA 50',
          config: {
            type: 'sma',
            period: 50,
            source: 'close',
          },
        },
      },
      {
        id: 'preset-indicator-sma200',
        type: 'indicator',
        position: { x: 350, y: 300 },
        data: {
          label: 'SMA 200',
          config: {
            type: 'sma',
            period: 200,
            source: 'close',
          },
        },
      },
      {
        id: 'preset-condition-1',
        type: 'condition',
        position: { x: 600, y: 200 },
        data: {
          label: '골든크로스 확인',
          config: {
            operator: 'and',
            conditions: [
              { left: 'SMA50', operator: 'cross_above', right: 'SMA200' },
            ],
          },
        },
      },
      {
        id: 'preset-action-buy',
        type: 'action',
        position: { x: 850, y: 200 },
        data: {
          label: '매수 주문',
          config: {
            type: 'buy',
            orderType: 'market',
            amount: 100,
            amountType: 'percent',
          },
        },
      },
      {
        id: 'preset-risk-1',
        type: 'risk',
        position: { x: 1100, y: 200 },
        data: {
          label: '리스크 관리',
          config: {
            stopLoss: 10,
            takeProfit: 30,
            maxDrawdown: 20,
          },
        },
      },
    ],
    edges: [
      { id: 'e-gc-1', source: 'preset-trigger-1', target: 'preset-condition-1' },
      { id: 'e-gc-2', source: 'preset-indicator-sma50', target: 'preset-condition-1' },
      { id: 'e-gc-3', source: 'preset-indicator-sma200', target: 'preset-condition-1' },
      { id: 'e-gc-4', source: 'preset-condition-1', target: 'preset-action-buy' },
      { id: 'e-gc-5', source: 'preset-action-buy', target: 'preset-risk-1' },
    ],
  },

  // 2. RSI 과매도 반등
  {
    id: 'rsi-oversold',
    name: 'RSI 과매도 반등',
    description: 'RSI가 30 이하에서 반등할 때 매수, 70 이상에서 매도',
    category: 'reversal',
    difficulty: 'beginner',
    tags: ['역추세', 'RSI', '단기'],
    nodes: [
      {
        id: 'preset-trigger-1',
        type: 'trigger',
        position: { x: 100, y: 200 },
        data: {
          label: '시장 트리거',
          config: {
            type: 'price_cross',
            symbol: 'BTC/USDT',
            timeframe: '4h',
          },
        },
      },
      {
        id: 'preset-indicator-rsi',
        type: 'indicator',
        position: { x: 350, y: 200 },
        data: {
          label: 'RSI (14)',
          config: {
            type: 'rsi',
            period: 14,
            source: 'close',
          },
        },
      },
      {
        id: 'preset-condition-1',
        type: 'condition',
        position: { x: 600, y: 200 },
        data: {
          label: 'RSI < 30 확인',
          config: {
            operator: 'and',
            conditions: [
              { left: 'RSI', operator: '<', right: 30 },
            ],
          },
        },
      },
      {
        id: 'preset-action-buy',
        type: 'action',
        position: { x: 850, y: 200 },
        data: {
          label: '매수 주문',
          config: {
            type: 'buy',
            orderType: 'market',
            amount: 50,
            amountType: 'percent',
          },
        },
      },
      {
        id: 'preset-risk-1',
        type: 'risk',
        position: { x: 1100, y: 200 },
        data: {
          label: '리스크 관리',
          config: {
            stopLoss: 5,
            takeProfit: 15,
            maxDrawdown: 10,
          },
        },
      },
    ],
    edges: [
      { id: 'e-rsi-1', source: 'preset-trigger-1', target: 'preset-condition-1' },
      { id: 'e-rsi-2', source: 'preset-indicator-rsi', target: 'preset-condition-1' },
      { id: 'e-rsi-3', source: 'preset-condition-1', target: 'preset-action-buy' },
      { id: 'e-rsi-4', source: 'preset-action-buy', target: 'preset-risk-1' },
    ],
  },

  // 3. 볼린저밴드 돌파
  {
    id: 'bollinger-breakout',
    name: '볼린저밴드 돌파',
    description: '가격이 상단 밴드를 돌파하면 매수, 중간선 이탈 시 청산',
    category: 'breakout',
    difficulty: 'intermediate',
    tags: ['돌파', '볼린저밴드', '변동성'],
    nodes: [
      {
        id: 'preset-trigger-1',
        type: 'trigger',
        position: { x: 100, y: 200 },
        data: {
          label: '시장 트리거',
          config: {
            type: 'price_cross',
            symbol: 'BTC/USDT',
            timeframe: '1h',
          },
        },
      },
      {
        id: 'preset-indicator-bb',
        type: 'indicator',
        position: { x: 350, y: 200 },
        data: {
          label: '볼린저밴드 (20,2)',
          config: {
            type: 'bollinger',
            period: 20,
            stdDev: 2,
          },
        },
      },
      {
        id: 'preset-condition-1',
        type: 'condition',
        position: { x: 600, y: 200 },
        data: {
          label: '상단 돌파 확인',
          config: {
            operator: 'and',
            conditions: [
              { left: 'Price', operator: 'cross_above', right: 'BB_Upper' },
            ],
          },
        },
      },
      {
        id: 'preset-action-buy',
        type: 'action',
        position: { x: 850, y: 200 },
        data: {
          label: '매수 주문',
          config: {
            type: 'buy',
            orderType: 'market',
            amount: 100,
            amountType: 'percent',
          },
        },
      },
      {
        id: 'preset-risk-1',
        type: 'risk',
        position: { x: 1100, y: 200 },
        data: {
          label: '리스크 관리',
          config: {
            stopLoss: 3,
            takeProfit: 10,
            trailingStop: 2,
          },
        },
      },
    ],
    edges: [
      { id: 'e-bb-1', source: 'preset-trigger-1', target: 'preset-condition-1' },
      { id: 'e-bb-2', source: 'preset-indicator-bb', target: 'preset-condition-1' },
      { id: 'e-bb-3', source: 'preset-condition-1', target: 'preset-action-buy' },
      { id: 'e-bb-4', source: 'preset-action-buy', target: 'preset-risk-1' },
    ],
  },

  // 4. MACD 크로스오버
  {
    id: 'macd-crossover',
    name: 'MACD 크로스오버',
    description: 'MACD 선이 시그널 선을 상향 돌파할 때 매수',
    category: 'trend',
    difficulty: 'intermediate',
    tags: ['추세', 'MACD', '모멘텀'],
    nodes: [
      {
        id: 'preset-trigger-1',
        type: 'trigger',
        position: { x: 100, y: 200 },
        data: {
          label: '시장 트리거',
          config: {
            type: 'price_cross',
            symbol: 'BTC/USDT',
            timeframe: '4h',
          },
        },
      },
      {
        id: 'preset-indicator-macd',
        type: 'indicator',
        position: { x: 350, y: 200 },
        data: {
          label: 'MACD (12,26,9)',
          config: {
            type: 'macd',
            fast: 12,
            slow: 26,
            signal: 9,
          },
        },
      },
      {
        id: 'preset-condition-1',
        type: 'condition',
        position: { x: 600, y: 200 },
        data: {
          label: 'MACD 골든크로스',
          config: {
            operator: 'and',
            conditions: [
              { left: 'MACD', operator: 'cross_above', right: 'Signal' },
            ],
          },
        },
      },
      {
        id: 'preset-action-buy',
        type: 'action',
        position: { x: 850, y: 200 },
        data: {
          label: '매수 주문',
          config: {
            type: 'buy',
            orderType: 'market',
            amount: 100,
            amountType: 'percent',
          },
        },
      },
      {
        id: 'preset-risk-1',
        type: 'risk',
        position: { x: 1100, y: 200 },
        data: {
          label: '리스크 관리',
          config: {
            stopLoss: 5,
            takeProfit: 15,
            maxDrawdown: 15,
          },
        },
      },
    ],
    edges: [
      { id: 'e-macd-1', source: 'preset-trigger-1', target: 'preset-condition-1' },
      { id: 'e-macd-2', source: 'preset-indicator-macd', target: 'preset-condition-1' },
      { id: 'e-macd-3', source: 'preset-condition-1', target: 'preset-action-buy' },
      { id: 'e-macd-4', source: 'preset-action-buy', target: 'preset-risk-1' },
    ],
  },

  // 5. EMA 스캘핑
  {
    id: 'ema-scalping',
    name: 'EMA 스캘핑',
    description: '9 EMA와 21 EMA 교차를 이용한 단타 전략',
    category: 'scalping',
    difficulty: 'advanced',
    tags: ['스캘핑', 'EMA', '단타'],
    nodes: [
      {
        id: 'preset-trigger-1',
        type: 'trigger',
        position: { x: 100, y: 200 },
        data: {
          label: '시장 트리거',
          config: {
            type: 'price_cross',
            symbol: 'BTC/USDT',
            timeframe: '5m',
          },
        },
      },
      {
        id: 'preset-indicator-ema9',
        type: 'indicator',
        position: { x: 350, y: 100 },
        data: {
          label: 'EMA 9',
          config: {
            type: 'ema',
            period: 9,
            source: 'close',
          },
        },
      },
      {
        id: 'preset-indicator-ema21',
        type: 'indicator',
        position: { x: 350, y: 300 },
        data: {
          label: 'EMA 21',
          config: {
            type: 'ema',
            period: 21,
            source: 'close',
          },
        },
      },
      {
        id: 'preset-indicator-rsi',
        type: 'indicator',
        position: { x: 350, y: 500 },
        data: {
          label: 'RSI 확인',
          config: {
            type: 'rsi',
            period: 7,
            source: 'close',
          },
        },
      },
      {
        id: 'preset-condition-1',
        type: 'condition',
        position: { x: 600, y: 200 },
        data: {
          label: 'EMA 교차 + RSI',
          config: {
            operator: 'and',
            conditions: [
              { left: 'EMA9', operator: 'cross_above', right: 'EMA21' },
              { left: 'RSI', operator: '<', right: 70 },
            ],
          },
        },
      },
      {
        id: 'preset-action-buy',
        type: 'action',
        position: { x: 850, y: 200 },
        data: {
          label: '매수 주문',
          config: {
            type: 'buy',
            orderType: 'market',
            amount: 100,
            amountType: 'percent',
          },
        },
      },
      {
        id: 'preset-risk-1',
        type: 'risk',
        position: { x: 1100, y: 200 },
        data: {
          label: '리스크 관리',
          config: {
            stopLoss: 1,
            takeProfit: 2,
            trailingStop: 0.5,
          },
        },
      },
    ],
    edges: [
      { id: 'e-ema-1', source: 'preset-trigger-1', target: 'preset-condition-1' },
      { id: 'e-ema-2', source: 'preset-indicator-ema9', target: 'preset-condition-1' },
      { id: 'e-ema-3', source: 'preset-indicator-ema21', target: 'preset-condition-1' },
      { id: 'e-ema-4', source: 'preset-indicator-rsi', target: 'preset-condition-1' },
      { id: 'e-ema-5', source: 'preset-condition-1', target: 'preset-action-buy' },
      { id: 'e-ema-6', source: 'preset-action-buy', target: 'preset-risk-1' },
    ],
  },

  // 6. 거래량 돌파
  {
    id: 'volume-breakout',
    name: '거래량 돌파',
    description: '평균 거래량 2배 이상 + 가격 상승 시 매수',
    category: 'breakout',
    difficulty: 'intermediate',
    tags: ['거래량', '돌파', '모멘텀'],
    nodes: [
      {
        id: 'preset-trigger-1',
        type: 'trigger',
        position: { x: 100, y: 200 },
        data: {
          label: '거래량 감지',
          config: {
            type: 'volume',
            symbol: 'BTC/USDT',
            timeframe: '1h',
          },
        },
      },
      {
        id: 'preset-indicator-vol',
        type: 'indicator',
        position: { x: 350, y: 150 },
        data: {
          label: '거래량',
          config: {
            type: 'volume',
          },
        },
      },
      {
        id: 'preset-indicator-sma',
        type: 'indicator',
        position: { x: 350, y: 350 },
        data: {
          label: 'SMA 20',
          config: {
            type: 'sma',
            period: 20,
            source: 'close',
          },
        },
      },
      {
        id: 'preset-condition-1',
        type: 'condition',
        position: { x: 600, y: 200 },
        data: {
          label: '거래량 2배 + 상승',
          config: {
            operator: 'and',
            conditions: [
              { left: 'Volume', operator: '>', right: 'Avg*2' },
              { left: 'Price', operator: '>', right: 'SMA20' },
            ],
          },
        },
      },
      {
        id: 'preset-action-buy',
        type: 'action',
        position: { x: 850, y: 200 },
        data: {
          label: '매수 주문',
          config: {
            type: 'buy',
            orderType: 'market',
            amount: 50,
            amountType: 'percent',
          },
        },
      },
      {
        id: 'preset-risk-1',
        type: 'risk',
        position: { x: 1100, y: 200 },
        data: {
          label: '리스크 관리',
          config: {
            stopLoss: 3,
            takeProfit: 8,
            maxDrawdown: 10,
          },
        },
      },
    ],
    edges: [
      { id: 'e-vol-1', source: 'preset-trigger-1', target: 'preset-condition-1' },
      { id: 'e-vol-2', source: 'preset-indicator-vol', target: 'preset-condition-1' },
      { id: 'e-vol-3', source: 'preset-indicator-sma', target: 'preset-condition-1' },
      { id: 'e-vol-4', source: 'preset-condition-1', target: 'preset-action-buy' },
      { id: 'e-vol-5', source: 'preset-action-buy', target: 'preset-risk-1' },
    ],
  },
]

// ============================================
// Category Config
// ============================================

const CATEGORY_CONFIG = {
  trend: {
    icon: ArrowTrendingUpIcon,
    label: '추세추종',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
  reversal: {
    icon: ArrowTrendingDownIcon,
    label: '역추세',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
  },
  breakout: {
    icon: BoltIcon,
    label: '돌파',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
  },
  scalping: {
    icon: ChartBarIcon,
    label: '스캘핑',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
  },
  risk: {
    icon: ShieldCheckIcon,
    label: '리스크',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
  },
}

const DIFFICULTY_CONFIG = {
  beginner: { label: '초급', color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  intermediate: { label: '중급', color: 'text-amber-400', bg: 'bg-amber-500/20' },
  advanced: { label: '고급', color: 'text-red-400', bg: 'bg-red-500/20' },
}

// ============================================
// Main Component
// ============================================

export function StrategyPresets({ isOpen, onClose, onApply }: StrategyPresetsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedPreset, setSelectedPreset] = useState<StrategyPreset | null>(null)

  const filteredPresets = selectedCategory
    ? STRATEGY_PRESETS.filter((p) => p.category === selectedCategory)
    : STRATEGY_PRESETS

  const handleApply = useCallback(() => {
    if (selectedPreset) {
      // Generate unique IDs to avoid conflicts
      const timestamp = Date.now()
      const newNodes = selectedPreset.nodes.map((node, idx) => ({
        ...node,
        id: `${node.id}-${timestamp}-${idx}`,
      }))

      // Update edge references
      const idMap = selectedPreset.nodes.reduce(
        (acc, node, idx) => {
          acc[node.id] = `${node.id}-${timestamp}-${idx}`
          return acc
        },
        {} as Record<string, string>
      )

      const newEdges = selectedPreset.edges.map((edge, idx) => ({
        ...edge,
        id: `${edge.id}-${timestamp}-${idx}`,
        source: idMap[edge.source],
        target: idMap[edge.target],
      }))

      onApply(newNodes, newEdges, selectedPreset.name)
      onClose()
    }
  }, [selectedPreset, onApply, onClose])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-4xl max-h-[80vh] mx-4 bg-[#0D0D0F] border border-white/[0.06] rounded-xl overflow-hidden shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-white/[0.06] flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 border border-primary/20 rounded-lg">
                  <SparklesIcon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-base font-medium text-white">전략 프리셋</h2>
                  <p className="text-xs text-zinc-400">검증된 전략 템플릿을 빠르게 적용</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-zinc-500 hover:text-white rounded-lg hover:bg-white/[0.05] transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Category Filters */}
            <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-3 py-1.5 text-xs rounded-lg whitespace-nowrap transition-colors ${
                  selectedCategory === null
                    ? 'bg-primary text-white'
                    : 'bg-white/[0.04] text-zinc-400 hover:text-white'
                }`}
              >
                전체
              </button>
              {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg whitespace-nowrap transition-colors ${
                    selectedCategory === key
                      ? `${config.bg} ${config.color} border ${config.border}`
                      : 'bg-white/[0.04] text-zinc-400 hover:text-white'
                  }`}
                >
                  <config.icon className="w-3.5 h-3.5" />
                  {config.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredPresets.map((preset) => {
                const categoryConfig = CATEGORY_CONFIG[preset.category]
                const difficultyConfig = DIFFICULTY_CONFIG[preset.difficulty]
                const isSelected = selectedPreset?.id === preset.id

                return (
                  <button
                    key={preset.id}
                    onClick={() => setSelectedPreset(preset)}
                    className={`p-4 text-left rounded-lg border transition-all ${
                      isSelected
                        ? 'bg-primary/10 border-primary/30'
                        : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded ${categoryConfig.bg}`}>
                          <categoryConfig.icon className={`w-4 h-4 ${categoryConfig.color}`} />
                        </div>
                        <h3 className="text-sm font-medium text-white">{preset.name}</h3>
                      </div>
                      <span className={`px-2 py-0.5 text-[10px] rounded ${difficultyConfig.bg} ${difficultyConfig.color}`}>
                        {difficultyConfig.label}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-zinc-400 mb-3 line-clamp-2">
                      {preset.description}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5">
                      {preset.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 text-[10px] bg-white/[0.04] text-zinc-500 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/[0.06]">
                      <span className="text-[10px] text-zinc-500">
                        {preset.nodes.length} 노드
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        {preset.edges.length} 연결
                      </span>
                      {isSelected && (
                        <span className="ml-auto text-[10px] text-primary flex items-center gap-1">
                          선택됨 <ChevronRightIcon className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.06] flex-shrink-0">
            <p className="text-xs text-zinc-500">
              {selectedPreset
                ? `"${selectedPreset.name}" 선택됨`
                : '프리셋을 선택하세요'}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleApply}
                disabled={!selectedPreset}
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/80 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
              >
                <SparklesIcon className="w-4 h-4" />
                적용하기
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default StrategyPresets

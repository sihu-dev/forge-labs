/**
 * HEPHAITOS - Block Definitions
 * Pre-defined blocks for the strategy builder
 */

import type { BlockDefinition, BlockCategoryConfig } from './types';

// Indicator Blocks
const indicatorBlocks: BlockDefinition[] = [
  {
    id: 'rsi',
    type: 'indicator',
    category: 'indicators',
    label: 'RSI',
    icon: '📈',
    color: '#3B82F6',
    inputs: [],
    outputs: [{ id: 'value', name: 'value', type: 'number', label: 'RSI 값' }],
    params: [
      { name: 'period', label: '기간', type: 'number', default: 14, min: 1, max: 100 },
      {
        name: 'source',
        label: '소스',
        type: 'select',
        default: 'close',
        options: [
          { value: 'close', label: '종가' },
          { value: 'open', label: '시가' },
          { value: 'high', label: '고가' },
          { value: 'low', label: '저가' },
        ],
      },
    ],
    description: '상대강도지수 (Relative Strength Index)',
  },
  {
    id: 'macd',
    type: 'indicator',
    category: 'indicators',
    label: 'MACD',
    icon: '📊',
    color: '#3B82F6',
    inputs: [],
    outputs: [
      { id: 'macd', name: 'macd', type: 'number', label: 'MACD' },
      { id: 'signal', name: 'signal', type: 'number', label: '시그널' },
      { id: 'histogram', name: 'histogram', type: 'number', label: '히스토그램' },
    ],
    params: [
      { name: 'fast', label: '빠른 기간', type: 'number', default: 12, min: 1, max: 50 },
      { name: 'slow', label: '느린 기간', type: 'number', default: 26, min: 1, max: 100 },
      { name: 'signal', label: '시그널 기간', type: 'number', default: 9, min: 1, max: 50 },
    ],
    description: 'Moving Average Convergence Divergence',
  },
  {
    id: 'bollinger',
    type: 'indicator',
    category: 'indicators',
    label: '볼린저밴드',
    icon: '📉',
    color: '#3B82F6',
    inputs: [],
    outputs: [
      { id: 'upper', name: 'upper', type: 'number', label: '상단밴드' },
      { id: 'middle', name: 'middle', type: 'number', label: '중심선' },
      { id: 'lower', name: 'lower', type: 'number', label: '하단밴드' },
    ],
    params: [
      { name: 'period', label: '기간', type: 'number', default: 20, min: 1, max: 100 },
      { name: 'stdDev', label: '표준편차', type: 'number', default: 2, min: 0.5, max: 5, step: 0.1 },
    ],
    description: '볼린저밴드 (상단/중심/하단)',
  },
  {
    id: 'ma',
    type: 'indicator',
    category: 'indicators',
    label: '이동평균',
    icon: '📏',
    color: '#3B82F6',
    inputs: [],
    outputs: [{ id: 'value', name: 'value', type: 'number', label: 'MA 값' }],
    params: [
      { name: 'period', label: '기간', type: 'number', default: 20, min: 1, max: 200 },
      {
        name: 'type',
        label: '종류',
        type: 'select',
        default: 'sma',
        options: [
          { value: 'sma', label: '단순 (SMA)' },
          { value: 'ema', label: '지수 (EMA)' },
          { value: 'wma', label: '가중 (WMA)' },
        ],
      },
    ],
    description: '이동평균선',
  },
  {
    id: 'volume',
    type: 'indicator',
    category: 'indicators',
    label: '거래량',
    icon: '🔊',
    color: '#3B82F6',
    inputs: [],
    outputs: [
      { id: 'current', name: 'current', type: 'number', label: '현재 거래량' },
      { id: 'average', name: 'average', type: 'number', label: '평균 거래량' },
    ],
    params: [
      { name: 'period', label: '평균 기간', type: 'number', default: 20, min: 1, max: 100 },
    ],
    description: '거래량 및 평균 거래량',
  },
];

// Condition Blocks
const conditionBlocks: BlockDefinition[] = [
  {
    id: 'greater',
    type: 'condition',
    category: 'conditions',
    label: '크다 (>)',
    icon: '⬆️',
    color: '#8B5CF6',
    inputs: [
      { id: 'a', name: 'a', type: 'number', label: '값 A' },
      { id: 'b', name: 'b', type: 'number', label: '값 B' },
    ],
    outputs: [{ id: 'result', name: 'result', type: 'boolean', label: '결과' }],
    params: [
      { name: 'threshold', label: '기준값 (B 대신)', type: 'number', default: 0 },
    ],
    description: 'A > B 조건 검사',
  },
  {
    id: 'less',
    type: 'condition',
    category: 'conditions',
    label: '작다 (<)',
    icon: '⬇️',
    color: '#8B5CF6',
    inputs: [
      { id: 'a', name: 'a', type: 'number', label: '값 A' },
      { id: 'b', name: 'b', type: 'number', label: '값 B' },
    ],
    outputs: [{ id: 'result', name: 'result', type: 'boolean', label: '결과' }],
    params: [
      { name: 'threshold', label: '기준값 (B 대신)', type: 'number', default: 0 },
    ],
    description: 'A < B 조건 검사',
  },
  {
    id: 'crossover',
    type: 'condition',
    category: 'conditions',
    label: '상향돌파',
    icon: '↗️',
    color: '#8B5CF6',
    inputs: [
      { id: 'a', name: 'a', type: 'number', label: '값 A' },
      { id: 'b', name: 'b', type: 'number', label: '값 B' },
    ],
    outputs: [{ id: 'result', name: 'result', type: 'boolean', label: '결과' }],
    params: [],
    description: 'A가 B를 상향 돌파할 때',
  },
  {
    id: 'crossunder',
    type: 'condition',
    category: 'conditions',
    label: '하향돌파',
    icon: '↘️',
    color: '#8B5CF6',
    inputs: [
      { id: 'a', name: 'a', type: 'number', label: '값 A' },
      { id: 'b', name: 'b', type: 'number', label: '값 B' },
    ],
    outputs: [{ id: 'result', name: 'result', type: 'boolean', label: '결과' }],
    params: [],
    description: 'A가 B를 하향 돌파할 때',
  },
];

// Logic Blocks
const logicBlocks: BlockDefinition[] = [
  {
    id: 'and',
    type: 'logic',
    category: 'logic',
    label: 'AND',
    icon: '➕',
    color: '#EAB308',
    inputs: [
      { id: 'a', name: 'a', type: 'boolean', label: '조건 A' },
      { id: 'b', name: 'b', type: 'boolean', label: '조건 B' },
    ],
    outputs: [{ id: 'result', name: 'result', type: 'boolean', label: '결과' }],
    params: [],
    description: '둘 다 참일 때',
  },
  {
    id: 'or',
    type: 'logic',
    category: 'logic',
    label: 'OR',
    icon: '➖',
    color: '#EAB308',
    inputs: [
      { id: 'a', name: 'a', type: 'boolean', label: '조건 A' },
      { id: 'b', name: 'b', type: 'boolean', label: '조건 B' },
    ],
    outputs: [{ id: 'result', name: 'result', type: 'boolean', label: '결과' }],
    params: [],
    description: '둘 중 하나가 참일 때',
  },
  {
    id: 'not',
    type: 'logic',
    category: 'logic',
    label: 'NOT',
    icon: '❌',
    color: '#EAB308',
    inputs: [{ id: 'a', name: 'a', type: 'boolean', label: '조건' }],
    outputs: [{ id: 'result', name: 'result', type: 'boolean', label: '결과' }],
    params: [],
    description: '조건을 반전',
  },
];

// Action Blocks
const actionBlocks: BlockDefinition[] = [
  {
    id: 'buy',
    type: 'action',
    category: 'actions',
    label: '매수',
    icon: '🟢',
    color: '#22C55E',
    inputs: [{ id: 'trigger', name: 'trigger', type: 'boolean', label: '조건' }],
    outputs: [],
    params: [
      { name: 'size', label: '포지션 크기 (%)', type: 'number', default: 10, min: 1, max: 100 },
      {
        name: 'orderType',
        label: '주문 유형',
        type: 'select',
        default: 'market',
        options: [
          { value: 'market', label: '시장가' },
          { value: 'limit', label: '지정가' },
        ],
      },
    ],
    description: '매수 주문 실행',
  },
  {
    id: 'sell',
    type: 'action',
    category: 'actions',
    label: '매도',
    icon: '🔴',
    color: '#EF4444',
    inputs: [{ id: 'trigger', name: 'trigger', type: 'boolean', label: '조건' }],
    outputs: [],
    params: [
      { name: 'size', label: '포지션 크기 (%)', type: 'number', default: 100, min: 1, max: 100 },
      {
        name: 'orderType',
        label: '주문 유형',
        type: 'select',
        default: 'market',
        options: [
          { value: 'market', label: '시장가' },
          { value: 'limit', label: '지정가' },
        ],
      },
    ],
    description: '매도 주문 실행',
  },
  {
    id: 'hold',
    type: 'action',
    category: 'actions',
    label: '홀드',
    icon: '🟡',
    color: '#F59E0B',
    inputs: [{ id: 'trigger', name: 'trigger', type: 'boolean', label: '조건' }],
    outputs: [],
    params: [],
    description: '포지션 유지',
  },
];

// Risk Blocks
const riskBlocks: BlockDefinition[] = [
  {
    id: 'stoploss',
    type: 'risk',
    category: 'risk',
    label: '손절',
    icon: '🛡️',
    color: '#F97316',
    inputs: [],
    outputs: [{ id: 'trigger', name: 'trigger', type: 'boolean', label: '트리거' }],
    params: [
      { name: 'percent', label: '손절 비율 (%)', type: 'number', default: 5, min: 0.1, max: 50, step: 0.1 },
      { name: 'trailing', label: '트레일링', type: 'boolean', default: false },
    ],
    description: '손절 설정',
  },
  {
    id: 'takeprofit',
    type: 'risk',
    category: 'risk',
    label: '익절',
    icon: '💰',
    color: '#F97316',
    inputs: [],
    outputs: [{ id: 'trigger', name: 'trigger', type: 'boolean', label: '트리거' }],
    params: [
      { name: 'percent', label: '익절 비율 (%)', type: 'number', default: 10, min: 0.1, max: 100, step: 0.1 },
      { name: 'partial', label: '부분 익절', type: 'boolean', default: false },
    ],
    description: '익절 설정',
  },
  {
    id: 'positionsize',
    type: 'risk',
    category: 'risk',
    label: '포지션 크기',
    icon: '📐',
    color: '#F97316',
    inputs: [],
    outputs: [{ id: 'size', name: 'size', type: 'number', label: '크기 (%)' }],
    params: [
      { name: 'method', label: '방식', type: 'select', default: 'fixed', options: [
        { value: 'fixed', label: '고정 비율' },
        { value: 'risk', label: '리스크 기반' },
        { value: 'kelly', label: '켈리 공식' },
      ]},
      { name: 'value', label: '값', type: 'number', default: 10, min: 1, max: 100 },
    ],
    description: '포지션 크기 계산',
  },
];

// Category Configurations
export const blockCategories: BlockCategoryConfig[] = [
  {
    id: 'indicators',
    label: '지표',
    icon: '📈',
    color: '#3B82F6',
    blocks: indicatorBlocks,
  },
  {
    id: 'conditions',
    label: '조건',
    icon: '⚖️',
    color: '#8B5CF6',
    blocks: conditionBlocks,
  },
  {
    id: 'logic',
    label: '논리',
    icon: '🔀',
    color: '#EAB308',
    blocks: logicBlocks,
  },
  {
    id: 'actions',
    label: '액션',
    icon: '🎯',
    color: '#22C55E',
    blocks: actionBlocks,
  },
  {
    id: 'risk',
    label: '리스크',
    icon: '🛡️',
    color: '#F97316',
    blocks: riskBlocks,
  },
];

// Get all blocks as flat array
export const allBlocks: BlockDefinition[] = blockCategories.flatMap((cat) => cat.blocks);

// Get block by ID
export const getBlockById = (id: string): BlockDefinition | undefined => {
  return allBlocks.find((block) => block.id === id);
};

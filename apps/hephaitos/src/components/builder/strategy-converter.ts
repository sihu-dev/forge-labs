/**
 * HEPHAITOS - Strategy to Backtest Converter
 * L3 (Tissues) - No-Code 전략 → 백테스트 설정 변환
 *
 * 빌더에서 생성된 전략을 백테스트 엔진이 실행할 수 있는 형태로 변환
 *
 * QRY-H-4-005
 */

import type { HephaitosTypes } from '@forge/types';
import { blockCategories } from './block-definitions';
import type { BlockDefinition, Strategy, StrategyNode, StrategyEdge } from './types';

type IBacktestConfig = HephaitosTypes.IBacktestConfig;
type IStrategy = HephaitosTypes.IStrategy;
type StrategyType = HephaitosTypes.StrategyType;
type Timeframe = HephaitosTypes.Timeframe;
type IndicatorType = HephaitosTypes.IndicatorType;

/**
 * 블록 정의 맵
 */
const blockDefinitionsMap = new Map<string, BlockDefinition>(
  blockCategories.flatMap((cat) => cat.blocks.map((b) => [b.id, b]))
);

/**
 * 블록 ID → 지표 타입 매핑
 */
const BLOCK_TO_INDICATOR: Record<string, IndicatorType> = {
  'indicator-rsi': 'rsi',
  'indicator-macd': 'macd',
  'indicator-bb': 'bollinger',
  'indicator-ma': 'sma',
  'indicator-volume': 'volume',
};

/**
 * 변환 결과
 */
export interface ConversionResult {
  success: boolean;
  config?: IBacktestConfig;
  strategy?: IStrategy;
  errors: string[];
  warnings: string[];
}

/**
 * 노드 그래프 분석 결과
 */
interface GraphAnalysis {
  /** 지표 노드들 */
  indicatorNodes: StrategyNode[];
  /** 조건 노드들 */
  conditionNodes: StrategyNode[];
  /** 논리 노드들 */
  logicNodes: StrategyNode[];
  /** 액션 노드들 */
  actionNodes: StrategyNode[];
  /** 리스크 노드들 */
  riskNodes: StrategyNode[];
  /** 매수 신호 체인 */
  buyChain: StrategyNode[];
  /** 매도 신호 체인 */
  sellChain: StrategyNode[];
}

/**
 * 전략 노드 그래프 분석
 */
function analyzeGraph(
  nodes: StrategyNode[],
  edges: StrategyEdge[]
): GraphAnalysis {
  const categorized: GraphAnalysis = {
    indicatorNodes: [],
    conditionNodes: [],
    logicNodes: [],
    actionNodes: [],
    riskNodes: [],
    buyChain: [],
    sellChain: [],
  };

  // 노드 분류
  for (const node of nodes) {
    const blockDef = blockDefinitionsMap.get(node.blockId);
    if (!blockDef) continue;

    switch (blockDef.type) {
      case 'indicator':
        categorized.indicatorNodes.push(node);
        break;
      case 'condition':
        categorized.conditionNodes.push(node);
        break;
      case 'logic':
        categorized.logicNodes.push(node);
        break;
      case 'action':
        categorized.actionNodes.push(node);
        break;
      case 'risk':
        categorized.riskNodes.push(node);
        break;
    }
  }

  // 연결 추적하여 매수/매도 체인 구성
  const buyAction = nodes.find((n) => n.blockId === 'action-buy');
  const sellAction = nodes.find((n) => n.blockId === 'action-sell');

  if (buyAction) {
    categorized.buyChain = traceBackwards(buyAction, nodes, edges);
  }
  if (sellAction) {
    categorized.sellChain = traceBackwards(sellAction, nodes, edges);
  }

  return categorized;
}

/**
 * 노드에서 역방향으로 연결된 모든 노드 추적
 */
function traceBackwards(
  targetNode: StrategyNode,
  nodes: StrategyNode[],
  edges: StrategyEdge[],
  visited: Set<string> = new Set()
): StrategyNode[] {
  if (visited.has(targetNode.id)) return [];
  visited.add(targetNode.id);

  const result: StrategyNode[] = [targetNode];

  // 이 노드로 들어오는 엣지 찾기
  const incomingEdges = edges.filter((e) => e.target.nodeId === targetNode.id);

  for (const edge of incomingEdges) {
    const sourceNode = nodes.find((n) => n.id === edge.source.nodeId);
    if (sourceNode) {
      result.push(...traceBackwards(sourceNode, nodes, edges, visited));
    }
  }

  return result;
}

/**
 * 지표 설정 추출
 */
function extractIndicatorConfig(node: StrategyNode): {
  type: IndicatorType;
  params: Record<string, number>;
} | null {
  const indicatorType = BLOCK_TO_INDICATOR[node.blockId];
  if (!indicatorType) return null;

  const params: Record<string, number> = {};

  switch (node.blockId) {
    case 'indicator-rsi':
      params.period = (node.params.period as number) || 14;
      break;
    case 'indicator-macd':
      params.fastPeriod = (node.params.fastPeriod as number) || 12;
      params.slowPeriod = (node.params.slowPeriod as number) || 26;
      params.signalPeriod = (node.params.signalPeriod as number) || 9;
      break;
    case 'indicator-bb':
      params.period = (node.params.period as number) || 20;
      params.stdDev = (node.params.stdDev as number) || 2;
      break;
    case 'indicator-ma':
      params.period = (node.params.period as number) || 20;
      break;
    case 'indicator-volume':
      params.period = (node.params.period as number) || 20;
      break;
  }

  return { type: indicatorType, params };
}

/**
 * 전략 타입 결정
 */
function determineStrategyType(analysis: GraphAnalysis): StrategyType {
  // 지표 기반 분석
  const hasMomentum = analysis.indicatorNodes.some((n) =>
    ['indicator-rsi', 'indicator-macd'].includes(n.blockId)
  );
  const hasTrend = analysis.indicatorNodes.some((n) =>
    ['indicator-ma', 'indicator-bb'].includes(n.blockId)
  );
  const hasVolume = analysis.indicatorNodes.some((n) =>
    n.blockId === 'indicator-volume'
  );

  if (hasMomentum && hasTrend) return 'trend_following';
  if (hasMomentum) return 'momentum';
  if (hasTrend) return 'trend_following';
  if (hasVolume) return 'breakout';

  return 'momentum';
}

/**
 * 리스크 설정 추출
 */
function extractRiskConfig(
  riskNodes: StrategyNode[]
): { stopLoss?: number; takeProfit?: number; positionSize?: number } {
  const config: { stopLoss?: number; takeProfit?: number; positionSize?: number } = {};

  for (const node of riskNodes) {
    switch (node.blockId) {
      case 'risk-stoploss':
        config.stopLoss = (node.params.percentage as number) || 5;
        break;
      case 'risk-takeprofit':
        config.takeProfit = (node.params.percentage as number) || 10;
        break;
      case 'risk-positionsize':
        config.positionSize = (node.params.percentage as number) || 10;
        break;
    }
  }

  return config;
}

/**
 * 전략 유효성 검증
 */
function validateStrategy(
  strategy: Strategy,
  analysis: GraphAnalysis
): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 필수 조건 검사
  if (analysis.indicatorNodes.length === 0) {
    errors.push('최소 1개 이상의 지표 블록이 필요합니다');
  }

  if (analysis.actionNodes.length === 0) {
    errors.push('최소 1개 이상의 액션 블록(매수/매도)이 필요합니다');
  }

  if (strategy.edges.length === 0) {
    errors.push('블록 간 연결이 필요합니다');
  }

  // 경고 조건 검사
  if (analysis.riskNodes.length === 0) {
    warnings.push('리스크 관리 블록(손절/익절)이 없습니다. 추가를 권장합니다.');
  }

  if (analysis.conditionNodes.length === 0) {
    warnings.push('조건 블록이 없습니다. 지표를 조건과 연결하세요.');
  }

  const hasBuy = analysis.actionNodes.some((n) => n.blockId === 'action-buy');
  const hasSell = analysis.actionNodes.some((n) => n.blockId === 'action-sell');

  if (!hasBuy) {
    warnings.push('매수 액션 블록이 없습니다');
  }
  if (!hasSell) {
    warnings.push('매도 액션 블록이 없습니다');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * 타임프레임 변환
 */
function convertTimeframe(tf: Strategy['timeframe']): Timeframe {
  const mapping: Record<string, Timeframe> = {
    '1m': '1m',
    '5m': '5m',
    '15m': '15m',
    '1h': '1h',
    '4h': '4h',
    '1d': '1d',
    '1w': '1w',
    '1M': '1M',
  };
  return mapping[tf] || '1d';
}

/**
 * 심볼 결정
 */
function determineSymbols(assetType: Strategy['assetType']): string[] {
  switch (assetType) {
    case 'crypto':
      return ['BTC/USDT'];
    case 'domestic_stock':
      return ['005930']; // 삼성전자
    case 'foreign_stock':
      return ['AAPL'];
    default:
      return ['BTC/USDT'];
  }
}

/**
 * No-Code 전략을 백테스트 설정으로 변환
 *
 * @param strategy - No-Code 빌더에서 생성된 전략
 * @param options - 변환 옵션
 * @returns 변환 결과 (백테스트 설정 + 검증 결과)
 */
export function convertStrategy(
  strategy: Strategy,
  options: {
    startDate?: string;
    endDate?: string;
    initialCapital?: number;
    feeRate?: number;
    slippage?: number;
  } = {}
): ConversionResult {
  // 그래프 분석
  const analysis = analyzeGraph(strategy.nodes, strategy.edges);

  // 유효성 검증
  const validation = validateStrategy(strategy, analysis);

  if (!validation.valid) {
    return {
      success: false,
      errors: validation.errors,
      warnings: validation.warnings,
    };
  }

  // 지표 설정 추출
  const indicators = analysis.indicatorNodes
    .map(extractIndicatorConfig)
    .filter((c): c is NonNullable<typeof c> => c !== null);

  // 리스크 설정 추출
  const riskConfig = extractRiskConfig(analysis.riskNodes);

  // 전략 타입 결정
  const strategyType = determineStrategyType(analysis);

  // 기본값 설정
  const now = new Date();
  const oneYearAgo = new Date(now);
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  // 백테스트 설정 생성
  const backtestConfig: IBacktestConfig = {
    id: `config-${Date.now()}`,
    strategyId: strategy.id,
    symbols: determineSymbols(strategy.assetType),
    timeframe: convertTimeframe(strategy.timeframe),
    startDate: options.startDate || oneYearAgo.toISOString(),
    endDate: options.endDate || now.toISOString(),
    initialCapital: options.initialCapital || 10000,
    currency: strategy.assetType === 'domestic_stock' ? 'KRW' : 'USD',
    feeRate: options.feeRate ?? 0.1,
    slippage: options.slippage ?? 0.05,
    useMargin: false,
  };

  // IStrategy 생성 (백테스트 엔진용)
  const engineStrategy: IStrategy = {
    id: strategy.id,
    name: strategy.name,
    description: strategy.description || '',
    type: strategyType,
    version: '1.0.0',
    timeframe: convertTimeframe(strategy.timeframe),
    symbols: determineSymbols(strategy.assetType),
    entryConditions: {
      logic: 'and',
      conditions: analysis.conditionNodes.map((node) => ({
        left: { type: 'rsi' as const, period: 14 },
        operator: node.blockId.includes('greater') ? 'gt' as const : 'lt' as const,
        right: (node.params.threshold as number) || 50,
      })),
    },
    exitConditions: {
      logic: 'or',
      conditions: [],
    },
    positionSizing: {
      type: 'fixed_percent',
      percent: riskConfig.positionSize || strategy.positionSize || 10,
    },
    riskManagement: {
      maxCapitalUsage: 20,
      dailyMaxLoss: 3,
      stopLossPercent: riskConfig.stopLoss,
      takeProfitPercent: riskConfig.takeProfit,
    },
    metadata: {
      createdAt: strategy.createdAt,
      updatedAt: strategy.updatedAt,
      tags: [strategyType],
    },
  };

  return {
    success: true,
    config: backtestConfig,
    strategy: engineStrategy,
    errors: [],
    warnings: validation.warnings,
  };
}

/**
 * 전략 검증만 수행 (변환 없이)
 */
export function validateStrategyOnly(strategy: Strategy): {
  valid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    indicatorCount: number;
    conditionCount: number;
    actionCount: number;
    riskCount: number;
    connectionCount: number;
  };
} {
  const analysis = analyzeGraph(strategy.nodes, strategy.edges);
  const validation = validateStrategy(strategy, analysis);

  return {
    ...validation,
    stats: {
      indicatorCount: analysis.indicatorNodes.length,
      conditionCount: analysis.conditionNodes.length,
      actionCount: analysis.actionNodes.length,
      riskCount: analysis.riskNodes.length,
      connectionCount: strategy.edges.length,
    },
  };
}

export default convertStrategy;

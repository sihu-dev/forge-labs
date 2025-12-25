/**
 * AI Strategy Node Graph Generation API
 * 자연어 → ReactFlow 노드 그래프 변환
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Node, Edge } from 'reactflow';

export const dynamic = 'force-dynamic';

// ============================================
// Types
// ============================================

interface GenerateRequest {
  prompt: string;
  symbol?: string;
  timeframe?: string;
}

interface GeneratedNodeGraph {
  name: string;
  description: string;
  nodes: Node[];
  edges: Edge[];
  confidence: number;
  suggestions: string[];
}

// ============================================
// Node Templates
// ============================================

const NODE_TEMPLATES = {
  indicator: {
    rsi: { type: 'indicator', label: 'RSI', params: { period: 14 } },
    sma: { type: 'indicator', label: 'SMA', params: { period: 20 } },
    ema: { type: 'indicator', label: 'EMA', params: { period: 12 } },
    macd: { type: 'indicator', label: 'MACD', params: { fast: 12, slow: 26, signal: 9 } },
    bollinger: { type: 'indicator', label: 'Bollinger', params: { period: 20, stdDev: 2 } },
    stochastic: { type: 'indicator', label: 'Stochastic', params: { k: 14, d: 3 } },
    atr: { type: 'indicator', label: 'ATR', params: { period: 14 } },
  },
  condition: {
    lessThan: { label: '<', operator: 'lt' },
    greaterThan: { label: '>', operator: 'gt' },
    crossAbove: { label: '상향돌파', operator: 'crosses_above' },
    crossBelow: { label: '하향돌파', operator: 'crosses_below' },
  },
  action: {
    buy: { label: '매수', type: 'buy' },
    sell: { label: '매도', type: 'sell' },
    hold: { label: '홀드', type: 'hold' },
  },
};

// ============================================
// Pattern Matching
// ============================================

interface ParsedPattern {
  indicators: Array<{ type: string; params?: Record<string, number> }>;
  conditions: Array<{ indicator: string; operator: string; value: number | string }>;
  actions: Array<{ type: string; trigger: string }>;
  riskParams?: { stopLoss?: number; takeProfit?: number };
}

function parsePrompt(prompt: string): ParsedPattern {
  const lower = prompt.toLowerCase();
  const result: ParsedPattern = {
    indicators: [],
    conditions: [],
    actions: [],
  };

  // Indicator Detection
  if (/rsi/i.test(lower)) {
    const periodMatch = lower.match(/rsi\s*\(?(\d+)\)?/i);
    result.indicators.push({
      type: 'rsi',
      params: { period: periodMatch ? parseInt(periodMatch[1]) : 14 },
    });
  }

  if (/sma|단순이평/i.test(lower)) {
    const periodMatch = lower.match(/sma\s*\(?(\d+)\)?/i) || lower.match(/(\d+)\s*일?\s*(?:이평|이동평균)/i);
    result.indicators.push({
      type: 'sma',
      params: { period: periodMatch ? parseInt(periodMatch[1]) : 20 },
    });
  }

  if (/ema|지수이평/i.test(lower)) {
    const periodMatch = lower.match(/ema\s*\(?(\d+)\)?/i);
    result.indicators.push({
      type: 'ema',
      params: { period: periodMatch ? parseInt(periodMatch[1]) : 12 },
    });
  }

  if (/macd/i.test(lower)) {
    result.indicators.push({ type: 'macd', params: { fast: 12, slow: 26, signal: 9 } });
  }

  if (/볼린저|bollinger/i.test(lower)) {
    result.indicators.push({ type: 'bollinger', params: { period: 20, stdDev: 2 } });
  }

  if (/스토캐스틱|stochastic/i.test(lower)) {
    result.indicators.push({ type: 'stochastic', params: { k: 14, d: 3 } });
  }

  if (/골든크로스|golden\s*cross/i.test(lower)) {
    if (result.indicators.length === 0) {
      result.indicators.push({ type: 'sma', params: { period: 50 } });
      result.indicators.push({ type: 'sma', params: { period: 200 } });
    }
    result.conditions.push({ indicator: 'sma_50', operator: 'crosses_above', value: 'sma_200' });
    result.actions.push({ type: 'buy', trigger: 'golden_cross' });
  }

  if (/데드크로스|dead\s*cross/i.test(lower)) {
    result.conditions.push({ indicator: 'sma_50', operator: 'crosses_below', value: 'sma_200' });
    result.actions.push({ type: 'sell', trigger: 'dead_cross' });
  }

  // Condition Detection (RSI specific)
  const rsiConditions = lower.match(/rsi\s*(?:가|이|가)?\s*(\d+)\s*(?:이하|아래|미만)/i);
  if (rsiConditions) {
    result.conditions.push({
      indicator: 'rsi',
      operator: 'lt',
      value: parseInt(rsiConditions[1]),
    });
  }

  const rsiConditionsAbove = lower.match(/rsi\s*(?:가|이|가)?\s*(\d+)\s*(?:이상|위|초과)/i);
  if (rsiConditionsAbove) {
    result.conditions.push({
      indicator: 'rsi',
      operator: 'gt',
      value: parseInt(rsiConditionsAbove[1]),
    });
  }

  // Action Detection
  if (/매수|사|buy|long/i.test(lower) && !result.actions.some(a => a.type === 'buy')) {
    result.actions.push({ type: 'buy', trigger: 'condition' });
  }

  if (/매도|팔|sell|short/i.test(lower) && !result.actions.some(a => a.type === 'sell')) {
    result.actions.push({ type: 'sell', trigger: 'condition' });
  }

  // Risk Parameters
  const stopLossMatch = lower.match(/손절\s*(\d+(?:\.\d+)?)\s*%?/i);
  const takeProfitMatch = lower.match(/익절\s*(\d+(?:\.\d+)?)\s*%?/i);

  if (stopLossMatch || takeProfitMatch) {
    result.riskParams = {
      stopLoss: stopLossMatch ? parseFloat(stopLossMatch[1]) : undefined,
      takeProfit: takeProfitMatch ? parseFloat(takeProfitMatch[1]) : undefined,
    };
  }

  return result;
}

// ============================================
// Node Graph Generation
// ============================================

function generateNodeGraph(parsed: ParsedPattern, symbol: string, timeframe: string): GeneratedNodeGraph {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  let nodeId = 0;
  let yPosition = 50;
  const xStart = 100;

  const getId = () => `node_${++nodeId}`;

  // 1. Start/Trigger Node
  const triggerId = getId();
  nodes.push({
    id: triggerId,
    type: 'trigger',
    position: { x: xStart, y: yPosition },
    data: { label: '시작', symbol, timeframe },
  });

  let lastNodeId = triggerId;
  yPosition += 120;

  // 2. Indicator Nodes
  const indicatorNodeIds: Record<string, string> = {};

  for (let i = 0; i < parsed.indicators.length; i++) {
    const indicator = parsed.indicators[i];
    const indId = getId();
    const template = NODE_TEMPLATES.indicator[indicator.type as keyof typeof NODE_TEMPLATES.indicator];

    if (template) {
      nodes.push({
        id: indId,
        type: 'indicator',
        position: { x: xStart + (i * 200), y: yPosition },
        data: {
          label: template.label,
          indicatorType: indicator.type,
          params: { ...template.params, ...indicator.params },
        },
      });

      edges.push({
        id: `e_${lastNodeId}_${indId}`,
        source: lastNodeId,
        target: indId,
        animated: true,
      });

      indicatorNodeIds[indicator.type] = indId;
      if (i === 0) lastNodeId = indId;
    }
  }

  yPosition += 120;

  // 3. Condition Nodes
  for (let i = 0; i < parsed.conditions.length; i++) {
    const condition = parsed.conditions[i];
    const condId = getId();

    const operatorLabel = condition.operator === 'lt' ? '<'
      : condition.operator === 'gt' ? '>'
      : condition.operator === 'crosses_above' ? '상향돌파'
      : condition.operator === 'crosses_below' ? '하향돌파'
      : '==';

    nodes.push({
      id: condId,
      type: 'condition',
      position: { x: xStart + (i * 220), y: yPosition },
      data: {
        label: `${condition.indicator.toUpperCase()} ${operatorLabel} ${condition.value}`,
        indicator: condition.indicator,
        operator: condition.operator,
        value: condition.value,
      },
    });

    const sourceId = indicatorNodeIds[condition.indicator.split('_')[0]] || lastNodeId;
    edges.push({ id: `e_${sourceId}_${condId}`, source: sourceId, target: condId });
    if (i === 0) lastNodeId = condId;
  }

  yPosition += 120;

  // 4. Action Nodes
  for (let i = 0; i < parsed.actions.length; i++) {
    const action = parsed.actions[i];
    const actionId = getId();
    const template = NODE_TEMPLATES.action[action.type as keyof typeof NODE_TEMPLATES.action];

    if (template) {
      nodes.push({
        id: actionId,
        type: 'action',
        position: { x: xStart + (i * 180), y: yPosition },
        data: { label: template.label, actionType: action.type, trigger: action.trigger },
      });

      edges.push({
        id: `e_${lastNodeId}_${actionId}`,
        source: lastNodeId,
        target: actionId,
        style: { stroke: action.type === 'buy' ? '#22C55E' : '#EF4444' },
      });

      lastNodeId = actionId;
    }
  }

  // 5. Risk Node
  if (parsed.riskParams && (parsed.riskParams.stopLoss || parsed.riskParams.takeProfit)) {
    yPosition += 120;
    const riskId = getId();

    nodes.push({
      id: riskId,
      type: 'risk',
      position: { x: xStart, y: yPosition },
      data: {
        label: '리스크 관리',
        stopLoss: parsed.riskParams.stopLoss || 5,
        takeProfit: parsed.riskParams.takeProfit || 10,
      },
    });

    edges.push({
      id: `e_${lastNodeId}_${riskId}`,
      source: lastNodeId,
      target: riskId,
      style: { stroke: '#F59E0B' },
    });
  }

  return {
    name: generateStrategyName(parsed),
    description: generateDescription(parsed, symbol, timeframe),
    nodes,
    edges,
    confidence: calculateConfidence(parsed),
    suggestions: generateSuggestions(parsed),
  };
}

function calculateConfidence(parsed: ParsedPattern): number {
  let confidence = 50;
  confidence += Math.min(parsed.indicators.length * 10, 20);
  confidence += Math.min(parsed.conditions.length * 10, 20);
  if (parsed.actions.some(a => a.type === 'buy') && parsed.actions.some(a => a.type === 'sell')) confidence += 10;
  if (parsed.riskParams?.stopLoss) confidence += 5;
  if (parsed.riskParams?.takeProfit) confidence += 5;
  return Math.min(confidence, 95);
}

function generateSuggestions(parsed: ParsedPattern): string[] {
  const suggestions: string[] = [];
  if (parsed.indicators.length === 1) suggestions.push('여러 지표를 조합하면 신호의 정확도를 높일 수 있습니다.');
  if (!parsed.riskParams?.stopLoss) suggestions.push('손절가를 설정하면 리스크 관리가 가능합니다.');
  if (!parsed.riskParams?.takeProfit) suggestions.push('익절가를 설정하면 수익 실현을 자동화할 수 있습니다.');
  suggestions.push('백테스트를 실행하여 전략 성과를 확인해보세요.');
  return suggestions.slice(0, 4);
}

function generateStrategyName(parsed: ParsedPattern): string {
  const parts: string[] = [];
  if (parsed.indicators.length > 0) parts.push(parsed.indicators[0].type.toUpperCase());
  if (parsed.conditions.some(c => c.operator === 'crosses_above')) parts.push('골든크로스');
  else if (parsed.conditions.some(c => c.operator === 'crosses_below')) parts.push('데드크로스');
  else if (parsed.actions.some(a => a.type === 'buy')) parts.push('매수');
  parts.push('전략');
  return parts.join(' ');
}

function generateDescription(parsed: ParsedPattern, symbol: string, timeframe: string): string {
  const indicatorNames = parsed.indicators.map(i => i.type.toUpperCase()).join(', ');
  const actionTypes = [...new Set(parsed.actions.map(a => a.type === 'buy' ? '매수' : '매도'))].join('/');
  return `${symbol} ${timeframe} 차트에서 ${indicatorNames || '기술적 지표'}를 활용한 ${actionTypes || '자동매매'} 전략`;
}

// ============================================
// API Handler
// ============================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: '로그인이 필요합니다' }, { status: 401 });
    }

    const body: GenerateRequest = await request.json();
    const { prompt, symbol = 'BTC/USDT', timeframe = '1h' } = body;

    if (!prompt || typeof prompt !== 'string' || prompt.length < 5) {
      return NextResponse.json({ success: false, error: '더 자세한 설명이 필요합니다' }, { status: 400 });
    }

    let parsed = parsePrompt(prompt);

    // Fallback if nothing parsed
    if (parsed.indicators.length === 0 && parsed.conditions.length === 0 && parsed.actions.length === 0) {
      parsed.indicators.push({ type: 'rsi', params: { period: 14 } });
      parsed.conditions.push({ indicator: 'rsi', operator: 'lt', value: 30 });
      parsed.actions.push({ type: 'buy', trigger: 'condition' });
      parsed.conditions.push({ indicator: 'rsi', operator: 'gt', value: 70 });
      parsed.actions.push({ type: 'sell', trigger: 'condition' });
    }

    const nodeGraph = generateNodeGraph(parsed, symbol, timeframe);

    await supabase.from('analytics_events').insert({
      user_id: user.id,
      event_type: 'ai_strategy_generated',
      metadata: { prompt, symbol, timeframe, nodesCount: nodeGraph.nodes.length, confidence: nodeGraph.confidence },
    }).catch(() => {});

    return NextResponse.json({ success: true, data: nodeGraph });
  } catch (error) {
    console.error('[AI Generate Strategy] Error:', error);
    return NextResponse.json({ success: false, error: '전략 생성 중 오류가 발생했습니다' }, { status: 500 });
  }
}

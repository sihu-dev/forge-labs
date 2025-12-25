// ============================================
// Node Graph Strategy Generation API
// POST: 자연어 → ReactFlow 노드/엣지 변환
// Claude AI로 No-Code 빌더용 전략 그래프 생성
// ============================================

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { withApiMiddleware, createApiResponse, validateRequestBody } from '@/lib/api/middleware'
import { safeLogger } from '@/lib/utils/safe-logger'
import { createClaudeClient } from '@/lib/ai/claude-client'
import { spendCredits, InsufficientCreditsError } from '@/lib/credits/spend-helper'
import { checkUserConsent, createConsentRequiredResponse } from '@/lib/compliance/consent-gate'
import { aiCircuit, withCircuitBreaker, createCircuitOpenResponse } from '@/lib/redis/circuit-breaker'
import { aiTieredLimiter, createTieredRateLimitResponse, type UserTier } from '@/lib/redis/rate-limiter'
import { ensureDisclaimer } from '@/lib/safety/safety-net-v2'

// ============================================
// Types
// ============================================

interface ReactFlowNode {
  id: string
  type: 'trigger' | 'indicator' | 'condition' | 'action' | 'risk'
  position: { x: number; y: number }
  data: {
    label: string
    config: Record<string, unknown>
  }
}

interface ReactFlowEdge {
  id: string
  source: string
  target: string
  type?: string
}

interface GeneratedNodeGraph {
  name: string
  description: string
  nodes: ReactFlowNode[]
  edges: ReactFlowEdge[]
  confidence: number
  suggestions: string[]
}

// ============================================
// Request Schema
// ============================================

const generateNodeGraphSchema = z.object({
  prompt: z.string().min(5, '최소 5자 이상 입력해주세요').max(1000, '최대 1000자까지 입력 가능합니다'),
  symbol: z.string().default('BTC/USDT'),
  timeframe: z.enum(['1m', '5m', '15m', '30m', '1h', '4h', '1d']).default('1h'),
})

// ============================================
// Claude Prompt for Node Graph Generation
// ============================================

const NODE_GRAPH_PROMPT = `당신은 No-Code 트레이딩 전략 빌더 전문가입니다.
사용자의 자연어 전략 설명을 ReactFlow 노드 그래프로 변환합니다.

## 노드 타입
1. **trigger**: 전략 시작 조건 (가격, 거래량, 시간 등)
2. **indicator**: 기술적 지표 (RSI, SMA, EMA, MACD, Bollinger, ATR, Volume, VWAP)
3. **condition**: 조건 판단 (비교 연산, AND/OR 논리)
4. **action**: 주문 실행 (매수/매도, 수량, 주문 타입)
5. **risk**: 리스크 관리 (손절/익절, 트레일링 스탑)

## 노드 구성 규칙
- 모든 전략은 trigger 노드로 시작
- 지표(indicator)는 조건(condition)에 연결
- 조건(condition)은 액션(action)에 연결
- 리스크(risk) 노드는 액션에 연결 가능
- 노드 ID는 고유해야 함 (예: trigger-1, indicator-rsi-1, condition-1, action-buy-1, risk-1)

## 위치 규칙 (x, y 좌표)
- 왼쪽에서 오른쪽으로 흐름
- x: 100 (trigger) → 350 (indicator) → 600 (condition) → 850 (action) → 1100 (risk)
- y: 200 기준, 여러 노드는 150px 간격으로 배치

## 응답 형식 (JSON만 응답)
{
  "name": "전략 이름",
  "description": "전략 설명 (1-2문장)",
  "nodes": [
    {
      "id": "trigger-1",
      "type": "trigger",
      "position": { "x": 100, "y": 200 },
      "data": {
        "label": "시장 트리거",
        "config": {
          "type": "price_cross",
          "symbol": "BTC/USDT",
          "condition": "cross_above",
          "value": 0
        }
      }
    }
  ],
  "edges": [
    { "id": "e-1", "source": "trigger-1", "target": "condition-1" }
  ],
  "confidence": 85,
  "suggestions": ["추가 개선 제안 1", "추가 개선 제안 2"]
}

## 지표별 config 예시
- RSI: { "type": "rsi", "period": 14, "source": "close" }
- SMA: { "type": "sma", "period": 20, "source": "close" }
- EMA: { "type": "ema", "period": 12, "source": "close" }
- MACD: { "type": "macd", "fast": 12, "slow": 26, "signal": 9 }
- Bollinger: { "type": "bollinger", "period": 20, "stdDev": 2 }
- Volume: { "type": "volume" }

## condition config 예시
- { "operator": "and", "conditions": [{ "left": "RSI", "operator": "<", "right": 30 }] }

## action config 예시
- 매수: { "type": "buy", "orderType": "market", "amount": 100, "amountType": "percent" }
- 매도: { "type": "sell", "orderType": "limit", "amount": 50, "amountType": "percent" }

## risk config 예시
- { "stopLoss": 5, "takeProfit": 10, "trailingStop": 2, "maxDrawdown": 20 }

반드시 유효한 JSON만 응답하세요. 설명 텍스트 없이 JSON 객체만 반환합니다.`

// ============================================
// Claude Node Graph Generation
// ============================================

async function generateNodeGraphWithClaude(
  prompt: string,
  symbol: string,
  timeframe: string
): Promise<GeneratedNodeGraph> {
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY
  if (!apiKey) throw new Error('Claude API key not configured')

  const client = createClaudeClient({ apiKey, temperature: 0.3 })

  const userPrompt = `
사용자 전략 설명: "${prompt}"
대상 심볼: ${symbol}
타임프레임: ${timeframe}

위 전략을 ReactFlow 노드 그래프로 변환해주세요.`

  const response = await client.chat(
    [{ role: 'user', content: userPrompt }],
    {
      systemPrompt: NODE_GRAPH_PROMPT,
      temperature: 0.3,
      maxTokens: 2048,
    }
  )

  try {
    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])

      // Validate and sanitize nodes
      const nodes = validateNodes(parsed.nodes || [])
      const edges = validateEdges(parsed.edges || [], nodes)

      return {
        name: parsed.name || `AI 생성 전략`,
        description: ensureDisclaimer(parsed.description || prompt.slice(0, 100), { short: true }),
        nodes,
        edges,
        confidence: Math.min(95, Math.max(50, parsed.confidence || 75)),
        suggestions: parsed.suggestions || ['백테스트를 통해 전략을 검증해보세요'],
      }
    }
  } catch (parseError) {
    safeLogger.error('[Generate Strategy] JSON parse error', { error: parseError })
  }

  // Fallback to rule-based generation
  return generateNodeGraphFallback(prompt, symbol, timeframe)
}

// ============================================
// Validation Helpers
// ============================================

function validateNodes(nodes: unknown[]): ReactFlowNode[] {
  const validTypes = ['trigger', 'indicator', 'condition', 'action', 'risk']
  const validatedNodes: ReactFlowNode[] = []

  for (const node of nodes) {
    if (typeof node !== 'object' || node === null) continue

    const n = node as Record<string, unknown>
    const type = n.type as string

    if (!validTypes.includes(type)) continue
    if (!n.id || typeof n.id !== 'string') continue

    const position = n.position as { x?: number; y?: number } | undefined
    const data = n.data as { label?: string; config?: Record<string, unknown> } | undefined

    validatedNodes.push({
      id: n.id,
      type: type as ReactFlowNode['type'],
      position: {
        x: typeof position?.x === 'number' ? position.x : 100,
        y: typeof position?.y === 'number' ? position.y : 200,
      },
      data: {
        label: typeof data?.label === 'string' ? data.label : type,
        config: typeof data?.config === 'object' && data.config !== null ? data.config : {},
      },
    })
  }

  return validatedNodes
}

function validateEdges(edges: unknown[], nodes: ReactFlowNode[]): ReactFlowEdge[] {
  const nodeIds = new Set(nodes.map(n => n.id))
  const validatedEdges: ReactFlowEdge[] = []

  for (const edge of edges) {
    if (typeof edge !== 'object' || edge === null) continue

    const e = edge as Record<string, unknown>
    const source = e.source as string
    const target = e.target as string

    if (!source || !target) continue
    if (!nodeIds.has(source) || !nodeIds.has(target)) continue

    validatedEdges.push({
      id: typeof e.id === 'string' ? e.id : `e-${source}-${target}`,
      source,
      target,
    })
  }

  return validatedEdges
}

// ============================================
// Fallback: Rule-based Node Generation
// ============================================

function generateNodeGraphFallback(
  prompt: string,
  symbol: string,
  timeframe: string
): GeneratedNodeGraph {
  const lowerPrompt = prompt.toLowerCase()
  const nodes: ReactFlowNode[] = []
  const edges: ReactFlowEdge[] = []
  let nodeIndex = 0

  // Parse indicators from prompt
  const hasRSI = lowerPrompt.includes('rsi')
  const hasMA = lowerPrompt.includes('이평') || lowerPrompt.includes('ma') || lowerPrompt.includes('이동평균')
  const hasMACD = lowerPrompt.includes('macd')
  const hasBollinger = lowerPrompt.includes('볼린저') || lowerPrompt.includes('bollinger')
  const hasVolume = lowerPrompt.includes('거래량') || lowerPrompt.includes('volume')

  // Parse actions from prompt
  const isBuy = lowerPrompt.includes('매수') || lowerPrompt.includes('buy') || lowerPrompt.includes('진입')
  const isSell = lowerPrompt.includes('매도') || lowerPrompt.includes('sell') || lowerPrompt.includes('청산')
  const hasStopLoss = lowerPrompt.includes('손절') || lowerPrompt.includes('stop')
  const hasTakeProfit = lowerPrompt.includes('익절') || lowerPrompt.includes('profit')

  // Extract numbers for thresholds
  const numbers = prompt.match(/\d+/g)?.map(Number) || []

  // 1. Trigger node
  nodes.push({
    id: 'trigger-1',
    type: 'trigger',
    position: { x: 100, y: 200 },
    data: {
      label: '시장 트리거',
      config: {
        type: 'price_cross',
        symbol,
        timeframe,
        condition: 'cross_above',
        value: 0,
      },
    },
  })

  // 2. Indicator nodes
  let indicatorY = 100
  const indicatorNodes: string[] = []

  if (hasRSI) {
    const rsiValue = numbers.find(n => n >= 10 && n <= 100) || 30
    nodes.push({
      id: `indicator-rsi-${++nodeIndex}`,
      type: 'indicator',
      position: { x: 350, y: indicatorY },
      data: {
        label: 'RSI',
        config: {
          type: 'rsi',
          period: 14,
          source: 'close',
          threshold: rsiValue,
        },
      },
    })
    indicatorNodes.push(`indicator-rsi-${nodeIndex}`)
    indicatorY += 150
  }

  if (hasMA || lowerPrompt.includes('골든') || lowerPrompt.includes('데드')) {
    nodes.push({
      id: `indicator-sma-${++nodeIndex}`,
      type: 'indicator',
      position: { x: 350, y: indicatorY },
      data: {
        label: 'SMA',
        config: {
          type: 'sma',
          period: numbers.find(n => n >= 5 && n <= 200) || 20,
          source: 'close',
        },
      },
    })
    indicatorNodes.push(`indicator-sma-${nodeIndex}`)
    indicatorY += 150
  }

  if (hasMACD) {
    nodes.push({
      id: `indicator-macd-${++nodeIndex}`,
      type: 'indicator',
      position: { x: 350, y: indicatorY },
      data: {
        label: 'MACD',
        config: {
          type: 'macd',
          fast: 12,
          slow: 26,
          signal: 9,
        },
      },
    })
    indicatorNodes.push(`indicator-macd-${nodeIndex}`)
    indicatorY += 150
  }

  if (hasBollinger) {
    nodes.push({
      id: `indicator-bollinger-${++nodeIndex}`,
      type: 'indicator',
      position: { x: 350, y: indicatorY },
      data: {
        label: '볼린저밴드',
        config: {
          type: 'bollinger',
          period: 20,
          stdDev: 2,
        },
      },
    })
    indicatorNodes.push(`indicator-bollinger-${nodeIndex}`)
    indicatorY += 150
  }

  if (hasVolume) {
    nodes.push({
      id: `indicator-volume-${++nodeIndex}`,
      type: 'indicator',
      position: { x: 350, y: indicatorY },
      data: {
        label: '거래량',
        config: {
          type: 'volume',
        },
      },
    })
    indicatorNodes.push(`indicator-volume-${nodeIndex}`)
  }

  // If no indicators detected, add RSI as default
  if (indicatorNodes.length === 0) {
    nodes.push({
      id: 'indicator-rsi-1',
      type: 'indicator',
      position: { x: 350, y: 200 },
      data: {
        label: 'RSI',
        config: {
          type: 'rsi',
          period: 14,
          source: 'close',
        },
      },
    })
    indicatorNodes.push('indicator-rsi-1')
  }

  // 3. Condition node
  const conditionId = 'condition-1'
  nodes.push({
    id: conditionId,
    type: 'condition',
    position: { x: 600, y: 200 },
    data: {
      label: '조건 체크',
      config: {
        operator: 'and',
        conditions: hasRSI
          ? [{ left: 'RSI', operator: lowerPrompt.includes('이하') || lowerPrompt.includes('below') ? '<' : '>', right: numbers.find(n => n >= 10 && n <= 100) || 30 }]
          : [],
      },
    },
  })

  // 4. Action node
  const actionId = 'action-1'
  nodes.push({
    id: actionId,
    type: 'action',
    position: { x: 850, y: 200 },
    data: {
      label: isBuy ? '매수 주문' : isSell ? '매도 주문' : '주문 실행',
      config: {
        type: isBuy ? 'buy' : isSell ? 'sell' : 'buy',
        orderType: 'market',
        amount: 100,
        amountType: 'percent',
      },
    },
  })

  // 5. Risk node (if mentioned)
  const riskId = 'risk-1'
  if (hasStopLoss || hasTakeProfit) {
    const stopLoss = numbers.find(n => n >= 1 && n <= 50) || 5
    const takeProfit = numbers.find(n => n > stopLoss && n <= 100) || stopLoss * 2

    nodes.push({
      id: riskId,
      type: 'risk',
      position: { x: 1100, y: 200 },
      data: {
        label: '리스크 관리',
        config: {
          stopLoss,
          takeProfit,
          maxDrawdown: 20,
        },
      },
    })
  }

  // Connect edges
  edges.push({ id: 'e-trigger', source: 'trigger-1', target: conditionId })

  for (const indId of indicatorNodes) {
    edges.push({ id: `e-${indId}`, source: indId, target: conditionId })
  }

  edges.push({ id: 'e-action', source: conditionId, target: actionId })

  if (hasStopLoss || hasTakeProfit) {
    edges.push({ id: 'e-risk', source: actionId, target: riskId })
  }

  // Generate suggestions
  const suggestions: string[] = []
  if (!hasRSI && !hasMACD) suggestions.push('RSI나 MACD 지표를 추가하면 더 정확한 신호를 받을 수 있습니다')
  if (!hasStopLoss) suggestions.push('손절 설정을 추가하여 리스크를 관리하세요')
  if (!hasTakeProfit) suggestions.push('익절 목표를 설정하면 수익을 실현할 수 있습니다')
  suggestions.push('백테스트를 통해 전략 성과를 검증해보세요')

  return {
    name: `AI 생성 전략 - ${new Date().toLocaleDateString('ko-KR')}`,
    description: ensureDisclaimer(prompt.slice(0, 100), { short: true }),
    nodes,
    edges,
    confidence: Math.min(85, 50 + indicatorNodes.length * 10 + (hasStopLoss ? 10 : 0)),
    suggestions: suggestions.slice(0, 3),
  }
}

// ============================================
// API Handler
// ============================================

export const POST = withApiMiddleware(
  async (request: NextRequest) => {
    // 1. 사용자 인증
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      safeLogger.warn('[Generate Strategy API] Unauthorized access attempt')
      return createApiResponse(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    const userId = user.id

    // 2. Consent Gate
    const consentResult = await checkUserConsent(userId, ['disclaimer', 'age_verification'])
    if (!consentResult.hasConsent) {
      return createConsentRequiredResponse(consentResult.missingConsents)
    }

    // 3. Circuit Breaker
    const circuitAllowed = await aiCircuit.isAllowed('claude-api')
    if (!circuitAllowed) {
      safeLogger.warn('[Generate Strategy API] Circuit breaker open')
      return createCircuitOpenResponse()
    }

    // 4. Tiered Rate Limit
    const userTier: UserTier = 'free'
    const rateLimitResult = await aiTieredLimiter.check(userId, userTier)
    if (!rateLimitResult.allowed) {
      return createTieredRateLimitResponse(rateLimitResult)
    }

    // 5. Validate request body
    const validation = await validateRequestBody(request, generateNodeGraphSchema)
    if ('error' in validation) return validation.error

    const { prompt, symbol, timeframe } = validation.data

    safeLogger.info('[Generate Strategy API] Generating node graph', {
      userId,
      promptLength: prompt.length,
      symbol,
      timeframe,
    })

    // 6. Spend credits (5 credits for node graph generation)
    try {
      await spendCredits({
        userId,
        feature: 'ai_node_graph',
        amount: 5,
        metadata: { prompt: prompt.slice(0, 50), symbol, timeframe },
      })
    } catch (error) {
      if (error instanceof InsufficientCreditsError) {
        return createApiResponse(
          {
            error: 'INSUFFICIENT_CREDITS',
            message: '크레딧이 부족합니다',
            required: error.required,
            current: error.current,
          },
          { status: 402 }
        )
      }
      throw error
    }

    // 7. Generate node graph
    let nodeGraph: GeneratedNodeGraph

    const useClaudeApi = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY

    if (useClaudeApi) {
      try {
        nodeGraph = await withCircuitBreaker(aiCircuit, 'claude-api', async () => {
          return generateNodeGraphWithClaude(prompt, symbol, timeframe)
        })
      } catch (claudeError) {
        if (claudeError instanceof Error && claudeError.message === 'CIRCUIT_OPEN') {
          return createCircuitOpenResponse()
        }
        safeLogger.warn('[Generate Strategy API] Claude failed, using fallback', { error: claudeError })
        nodeGraph = generateNodeGraphFallback(prompt, symbol, timeframe)
      }
    } else {
      // Simulate processing delay
      await new Promise((resolve) => setTimeout(resolve, 1000))
      nodeGraph = generateNodeGraphFallback(prompt, symbol, timeframe)
    }

    safeLogger.info('[Generate Strategy API] Node graph generated', {
      userId,
      nodeCount: nodeGraph.nodes.length,
      edgeCount: nodeGraph.edges.length,
      confidence: nodeGraph.confidence,
      usedClaude: !!useClaudeApi,
    })

    return createApiResponse({
      success: true,
      data: nodeGraph,
      usedClaude: !!useClaudeApi,
    })
  },
  {
    rateLimit: { category: 'ai' },
    errorHandler: { logErrors: true },
  }
)

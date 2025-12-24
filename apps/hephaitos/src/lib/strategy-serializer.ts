/**
 * Strategy Serializer
 *
 * No-Code 빌더의 노드 그래프를 백테스트 엔진이 실행할 수 있는
 * IStrategy 형식으로 변환하는 직렬화 시스템
 */

import type { Node, Edge } from 'reactflow'
import type {
  IStrategy,
  ICondition,
  IConditionGroup,
  IIndicatorConfig,
  ComparisonOperator,
  IndicatorType,
} from '@hephaitos/types'

/**
 * 노드 그래프 직렬화 결과
 */
export interface SerializationResult {
  success: boolean
  strategy?: IStrategy
  errors?: SerializationError[]
}

/**
 * 직렬화 에러
 */
export interface SerializationError {
  type: 'missing_node' | 'invalid_config' | 'unsupported_type'
  message: string
  nodeId?: string
}

/**
 * 노드 그래프를 IStrategy로 변환
 */
export function serializeStrategy(
  nodes: Node[],
  edges: Edge[],
  metadata: {
    name: string
    description?: string
    userId: string
  }
): SerializationResult {
  const errors: SerializationError[] = []

  try {
    // 1. Trigger 노드 찾기
    const triggerNode = nodes.find((n) => n.type === 'trigger')
    if (!triggerNode) {
      return {
        success: false,
        errors: [
          {
            type: 'missing_node',
            message: '트리거 노드가 필요합니다',
          },
        ],
      }
    }

    // 2. Action 노드들 찾기
    const actionNodes = nodes.filter((n) => n.type === 'action')
    if (actionNodes.length === 0) {
      return {
        success: false,
        errors: [
          {
            type: 'missing_node',
            message: '최소 1개의 액션 노드가 필요합니다',
          },
        ],
      }
    }

    // 3. Indicator 노드들 수집
    const indicatorNodes = nodes.filter((n) => n.type === 'indicator')

    // 4. Condition 노드들 수집
    const conditionNodes = nodes.filter((n) => n.type === 'condition')

    // 5. Risk 노드 찾기
    const riskNode = nodes.find((n) => n.type === 'risk')

    // 6. 진입 조건 생성 (Trigger + Indicators + Conditions)
    const entryCondition = buildEntryCondition(
      triggerNode,
      indicatorNodes,
      conditionNodes,
      edges
    )

    if (!entryCondition) {
      return {
        success: false,
        errors: [
          {
            type: 'invalid_config',
            message: '진입 조건을 생성할 수 없습니다',
          },
        ],
      }
    }

    // 7. 청산 조건 생성 (리스크 관리 포함)
    const exitCondition = buildExitCondition(riskNode, actionNodes, edges)

    // 8. IStrategy 객체 생성
    const strategy: IStrategy = {
      id: crypto.randomUUID(),
      name: metadata.name,
      description: metadata.description || '',
      type: 'custom',
      version: '1.0.0',

      // 시장 설정 (기본값, 나중에 UI에서 설정 가능)
      timeframe: '1h',
      symbols: [triggerNode.data?.config?.symbol || 'BTC/USDT'],

      // 진입/청산 조건
      entryConditions: entryCondition,
      exitConditions: exitCondition || entryCondition, // exitCondition이 없으면 진입 조건의 역으로 사용

      // 포지션 사이징 (액션 노드에서 추출)
      positionSizing: extractPositionSizing(actionNodes),

      // 리스크 관리 (리스크 노드에서 추출)
      riskManagement: extractRiskManagement(riskNode),

      // 메타데이터
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: metadata.userId,
        tags: ['노코드빌더'],
        // 노드 그래프 원본 보존 (나중에 다시 로드할 때 사용)
        nodeGraph: {
          nodes,
          edges,
        },
      } as any,
    }

    return {
      success: true,
      strategy,
    }
  } catch (error) {
    return {
      success: false,
      errors: [
        {
          type: 'invalid_config',
          message: error instanceof Error ? error.message : '알 수 없는 에러',
        },
      ],
    }
  }
}

/**
 * 진입 조건 생성
 */
function buildEntryCondition(
  triggerNode: Node,
  indicatorNodes: Node[],
  conditionNodes: Node[],
  edges: Edge[]
): IConditionGroup | null {
  const conditions: ICondition[] = []

  // Trigger 노드의 조건
  const triggerCondition = buildTriggerCondition(triggerNode)
  if (triggerCondition) {
    conditions.push(triggerCondition)
  }

  // Indicator 노드들의 조건
  for (const indicatorNode of indicatorNodes) {
    // 이 인디케이터에 연결된 조건 노드 찾기
    const connectedConditions = findConnectedConditions(
      indicatorNode,
      conditionNodes,
      edges
    )

    for (const condNode of connectedConditions) {
      const condition = buildIndicatorCondition(indicatorNode, condNode)
      if (condition) {
        conditions.push(condition)
      }
    }
  }

  // Condition 노드들 처리
  for (const condNode of conditionNodes) {
    // 조건 노드가 직접 액션에 연결되어 있는지 확인
    const isDirectlyConnectedToAction = edges.some(
      (e) => e.source === condNode.id &&
      conditionNodes.find((n) => n.id === e.target)?.type === 'action'
    )

    if (isDirectlyConnectedToAction) {
      // 이 조건의 입력 노드들 찾기
      const inputEdges = edges.filter((e) => e.target === condNode.id)
      // ... 복잡한 조건 처리 로직
    }
  }

  if (conditions.length === 0) {
    return null
  }

  // 모든 조건을 AND로 결합
  return {
    logic: 'and',
    conditions,
  }
}

/**
 * Trigger 노드를 ICondition으로 변환
 */
function buildTriggerCondition(triggerNode: Node): ICondition | null {
  const config = triggerNode.data?.config
  if (!config) return null

  const type = config.type as string

  switch (type) {
    case 'price_cross':
    case 'price_above':
    case 'price_below': {
      const operator = mapTriggerOperator(config.condition as string)
      return {
        left: {
          type: 'price',
          source: 'close',
        },
        operator,
        right: Number(config.value) || 0,
      }
    }

    case 'volume': {
      return {
        left: {
          type: 'volume',
        },
        operator: 'gt',
        right: Number(config.value) || 0,
      }
    }

    default:
      return null
  }
}

/**
 * Indicator 노드를 ICondition으로 변환
 */
function buildIndicatorCondition(
  indicatorNode: Node,
  conditionNode: Node
): ICondition | null {
  const indicatorConfig = indicatorNode.data?.config
  const conditionConfig = conditionNode.data?.config

  if (!indicatorConfig || !conditionConfig) return null

  const indicatorType = indicatorConfig.type as IndicatorType
  const period = Number(indicatorConfig.period) || 14
  const source = (indicatorConfig.source as 'close') || 'close'

  // 조건 노드에서 비교 연산자와 값 추출
  const conditions = conditionConfig.conditions as Array<{
    left: string
    operator: string
    right: number
  }>

  if (!conditions || conditions.length === 0) return null

  const firstCondition = conditions[0]
  const operator = mapConditionOperator(firstCondition.operator)

  return {
    left: {
      type: indicatorType,
      period,
      source,
    },
    operator,
    right: firstCondition.right,
  }
}

/**
 * 청산 조건 생성
 */
function buildExitCondition(
  riskNode: Node | undefined,
  actionNodes: Node[],
  edges: Edge[]
): IConditionGroup | null {
  // 기본 청산 조건 (진입 조건의 역)
  // 또는 리스크 노드에서 정의된 손절/익절 조건

  if (!riskNode) {
    return null // 청산 조건이 명시되지 않음
  }

  const config = riskNode.data?.config
  if (!config) return null

  const conditions: ICondition[] = []

  // 손절 조건
  if (config.stopLoss) {
    conditions.push({
      left: { type: 'price', source: 'close' },
      operator: 'lt',
      right: -Math.abs(Number(config.stopLoss)),
    })
  }

  // 익절 조건
  if (config.takeProfit) {
    conditions.push({
      left: { type: 'price', source: 'close' },
      operator: 'gt',
      right: Math.abs(Number(config.takeProfit)),
    })
  }

  if (conditions.length === 0) return null

  return {
    logic: 'or', // 손절 OR 익절
    conditions,
  }
}

/**
 * 포지션 사이징 추출
 */
function extractPositionSizing(actionNodes: Node[]) {
  // 첫 번째 매수 액션에서 포지션 사이징 추출
  const buyAction = actionNodes.find(
    (n) => n.data?.config?.type === 'buy'
  )

  if (!buyAction) {
    return {
      type: 'fixed_percent' as const,
      percent: 100,
    }
  }

  const config = buyAction.data.config
  const amount = Number(config.amount) || 100
  const amountType = config.amountType as string

  if (amountType === 'percent') {
    return {
      type: 'fixed_percent' as const,
      percent: amount,
    }
  } else {
    return {
      type: 'fixed_amount' as const,
      amount,
    }
  }
}

/**
 * 리스크 관리 추출
 */
function extractRiskManagement(riskNode: Node | undefined) {
  if (!riskNode) {
    return {
      maxDrawdownPercent: 20,
      maxLossPerTrade: 2,
    }
  }

  const config = riskNode.data?.config

  return {
    stopLoss: config?.stopLoss ? Number(config.stopLoss) : undefined,
    takeProfit: config?.takeProfit ? Number(config.takeProfit) : undefined,
    trailingStop: config?.trailingStop ? Number(config.trailingStop) : undefined,
    maxDrawdownPercent: config?.maxDrawdown ? Number(config.maxDrawdown) : 20,
    maxLossPerTrade: 2,
  }
}

/**
 * 연결된 조건 노드들 찾기
 */
function findConnectedConditions(
  sourceNode: Node,
  conditionNodes: Node[],
  edges: Edge[]
): Node[] {
  const connectedIds = edges
    .filter((e) => e.source === sourceNode.id)
    .map((e) => e.target)

  return conditionNodes.filter((n) => connectedIds.includes(n.id))
}

/**
 * Trigger 연산자 매핑
 */
function mapTriggerOperator(condition: string): ComparisonOperator {
  const mapping: Record<string, ComparisonOperator> = {
    cross_above: 'cross_above',
    cross_below: 'cross_below',
    above: 'gt',
    below: 'lt',
  }
  return mapping[condition] || 'gt'
}

/**
 * Condition 연산자 매핑
 */
function mapConditionOperator(operator: string): ComparisonOperator {
  const mapping: Record<string, ComparisonOperator> = {
    '>': 'gt',
    '>=': 'gte',
    '<': 'lt',
    '<=': 'lte',
    '=': 'eq',
    '!=': 'neq',
    '==': 'eq',
  }
  return mapping[operator] || 'gt'
}

/**
 * 노드 그래프에서 전략 재구성 (역직렬화)
 */
export function deserializeStrategy(strategy: IStrategy): {
  nodes: Node[]
  edges: Edge[]
} | null {
  // 전략의 metadata에 nodeGraph가 있으면 그대로 사용
  const nodeGraph = strategy.metadata?.nodeGraph as
    | { nodes: Node[]; edges: Edge[] }
    | undefined

  if (nodeGraph?.nodes && nodeGraph?.edges) {
    return nodeGraph
  }

  // nodeGraph가 없으면 전략 정의로부터 재구성
  // TODO: IStrategy → 노드 그래프 변환 로직
  return null
}

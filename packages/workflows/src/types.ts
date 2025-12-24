/**
 * n8n 워크플로우 타입 정의
 *
 * n8n JSON 형식과 호환되는 타입 시스템
 */

// 로컬 타입 정의
export type UUID = string;
export type Timestamp = string;

// ============================================
// n8n 워크플로우 구조
// ============================================

export interface IWorkflowDefinition {
  id: string;
  name: string;
  active: boolean;
  nodes: IWorkflowNode[];
  connections: IWorkflowConnections;
  settings?: IWorkflowSettings;
  staticData?: Record<string, unknown>;
  tags?: string[];
  meta?: IWorkflowMeta;
}

export interface IWorkflowNode {
  id: string;
  name: string;
  type: string;
  typeVersion: number;
  position: [number, number];
  parameters: Record<string, unknown>;
  credentials?: Record<string, INodeCredential>;
  disabled?: boolean;
  notes?: string;
  notesInFlow?: boolean;
  color?: string;
  webhookId?: string;
  continueOnFail?: boolean;
  alwaysOutputData?: boolean;
  executeOnce?: boolean;
  retryOnFail?: boolean;
  maxTries?: number;
  waitBetweenTries?: number;
}

export interface INodeCredential {
  id: string;
  name: string;
}

export interface IWorkflowConnections {
  [sourceName: string]: {
    [outputType: string]: Array<IConnection[]>;
  };
}

export interface IConnection {
  node: string;
  type: string;
  index: number;
}

export interface IWorkflowSettings {
  executionOrder?: 'v0' | 'v1';
  saveDataErrorExecution?: 'all' | 'none';
  saveDataSuccessExecution?: 'all' | 'none';
  saveExecutionProgress?: boolean;
  saveManualExecutions?: boolean;
  callerPolicy?: 'workflowsFromSameOwner' | 'workflowsFromAList' | 'any';
  errorWorkflow?: string;
  timezone?: string;
  executionTimeout?: number;
}

export interface IWorkflowMeta {
  templateCredsSetupCompleted?: boolean;
  instanceId?: string;
}

// ============================================
// 워크플로우 실행 컨텍스트
// ============================================

export interface IWorkflowExecution {
  id: UUID;
  workflow_id: string;
  mode: 'manual' | 'trigger' | 'webhook' | 'schedule';
  status: 'running' | 'success' | 'error' | 'waiting' | 'canceled';
  started_at: Timestamp;
  finished_at?: Timestamp;
  data?: IExecutionData;
  error?: string;
}

export interface IExecutionData {
  resultData?: {
    runData: Record<string, INodeExecutionData[]>;
    lastNodeExecuted?: string;
    error?: IExecutionError;
  };
  executionData?: {
    contextData: Record<string, unknown>;
    nodeExecutionStack: unknown[];
    waitingExecution: Record<string, unknown>;
    waitingExecutionSource: Record<string, unknown>;
  };
  startData?: {
    destinationNode?: string;
    runNodeFilter?: string[];
  };
}

export interface INodeExecutionData {
  startTime: number;
  executionTime: number;
  data: {
    main: unknown[][];
  };
  source: unknown[];
}

export interface IExecutionError {
  message: string;
  node?: string;
  timestamp?: number;
  description?: string;
  context?: Record<string, unknown>;
}

// ============================================
// 트리거 타입
// ============================================

export type TriggerType = 'webhook' | 'schedule' | 'event' | 'manual';

export interface IWorkflowTrigger {
  type: TriggerType;
  config: IWebhookTrigger | IScheduleTrigger | IEventTrigger | IManualTrigger;
}

export interface IWebhookTrigger {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  authentication?: 'none' | 'basicAuth' | 'headerAuth';
  responseMode?: 'onReceived' | 'lastNode' | 'responseNode';
}

export interface IScheduleTrigger {
  rule: string; // Cron expression
  timezone?: string;
}

export interface IEventTrigger {
  event: string;
  filter?: Record<string, unknown>;
}

export interface IManualTrigger {
  // No config needed
}

// ============================================
// 워크플로우 실행 결과
// ============================================

export interface IWorkflowResult {
  execution_id: UUID;
  workflow_id: string;
  status: 'success' | 'error';
  data?: unknown;
  error?: string;
  duration_ms: number;
  nodes_executed: number;
  timestamp: Timestamp;
}

// ============================================
// 워크플로우 템플릿
// ============================================

export interface IWorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: WorkflowCategory;
  tags: string[];
  nodes: Omit<IWorkflowNode, 'id'>[];
  connections: IWorkflowConnections;
  variables?: IWorkflowVariable[];
}

export type WorkflowCategory =
  | 'lead-management'
  | 'crm-integration'
  | 'sales-automation'
  | 'cross-sell'
  | 'data-enrichment'
  | 'notification'
  | 'reporting';

export interface IWorkflowVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  default?: unknown;
  required: boolean;
  description: string;
}

// ============================================
// 노드 타입 정의
// ============================================

export type NodeType =
  // Triggers
  | 'n8n-nodes-base.webhook'
  | 'n8n-nodes-base.cron'
  | 'n8n-nodes-base.manualTrigger'
  // Actions
  | 'n8n-nodes-base.httpRequest'
  | 'n8n-nodes-base.postgres'
  | 'n8n-nodes-base.supabase'
  | 'n8n-nodes-base.code'
  | 'n8n-nodes-base.function'
  | 'n8n-nodes-base.functionItem'
  | 'n8n-nodes-base.set'
  | 'n8n-nodes-base.merge'
  | 'n8n-nodes-base.if'
  | 'n8n-nodes-base.switch'
  | 'n8n-nodes-base.loop'
  // Integrations
  | 'n8n-nodes-base.openAi'
  | 'n8n-nodes-base.anthropic'
  | 'n8n-nodes-base.gmail'
  | 'n8n-nodes-base.slack'
  | 'n8n-nodes-base.discord'
  | 'n8n-nodes-base.hubspot'
  | 'n8n-nodes-base.salesforce'
  | 'n8n-nodes-base.notion'
  | 'n8n-nodes-base.airtable'
  | 'n8n-nodes-base.googleSheets'
  // Custom
  | '@forge/custom.leadEnrichment'
  | '@forge/custom.leadScoring'
  | '@forge/custom.crossSell';

// ============================================
// 워크플로우 이벤트
// ============================================

export interface IWorkflowEvent {
  type: WorkflowEventType;
  workflow_id: string;
  execution_id?: UUID;
  timestamp: Timestamp;
  payload?: Record<string, unknown>;
}

export type WorkflowEventType =
  | 'workflow.started'
  | 'workflow.completed'
  | 'workflow.failed'
  | 'workflow.canceled'
  | 'node.started'
  | 'node.completed'
  | 'node.failed';

/**
 * n8n Integration Types
 * API 문서: https://docs.n8n.io/api/
 */

export interface N8nConfig {
  apiKey: string;
  baseUrl: string; // n8n instance URL (e.g., https://your-n8n.app)
  timeout?: number;
  retryAttempts?: number;
}

export interface Workflow {
  id: string;
  name: string;
  active: boolean;
  nodes: WorkflowNode[];
  connections: Record<string, Connection[]>;
  settings?: WorkflowSettings;
  staticData?: unknown;
  tags?: Tag[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowNode {
  id: string;
  name: string;
  type: string;
  typeVersion: number;
  position: [number, number];
  parameters: Record<string, unknown>;
  credentials?: Record<string, string>;
  webhookId?: string;
}

export interface Connection {
  node: string;
  type: string;
  index: number;
}

export interface WorkflowSettings {
  executionOrder?: 'v0' | 'v1';
  saveManualExecutions?: boolean;
  saveExecutionProgress?: boolean;
  saveDataErrorExecution?: 'all' | 'none';
  saveDataSuccessExecution?: 'all' | 'none';
  executionTimeout?: number;
  timezone?: string;
}

export interface Tag {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Execution {
  id: string;
  finished: boolean;
  mode: 'integrated' | 'cli' | 'error' | 'internal' | 'manual' | 'retry' | 'trigger' | 'webhook';
  retryOf?: string;
  retrySuccessId?: string;
  startedAt: string;
  stoppedAt?: string;
  workflowId: string;
  workflowData?: Workflow;
  data?: ExecutionData;
  status?: 'success' | 'error' | 'waiting' | 'running' | 'canceled';
}

export interface ExecutionData {
  resultData: {
    runData: Record<string, ExecutionNodeData[]>;
    lastNodeExecuted?: string;
    error?: ExecutionError;
  };
  executionData?: {
    contextData: Record<string, unknown>;
    nodeExecutionStack: unknown[];
    waitingExecution: Record<string, unknown>;
    waitingExecutionSource: Record<string, unknown>;
  };
}

export interface ExecutionNodeData {
  startTime: number;
  executionTime: number;
  data: {
    main: unknown[][];
  };
  source?: unknown[];
}

export interface ExecutionError {
  message: string;
  node?: string;
  stack?: string;
  errorDetails?: string;
  httpCode?: string;
}

export interface TriggerWorkflowRequest {
  workflowId?: string;
  data?: Record<string, unknown>;
}

export interface WebhookResponse {
  success: boolean;
  executionId?: string;
  data?: unknown;
}

export interface N8nError {
  code: string;
  message: string;
  details?: unknown;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: N8nError;
  metadata?: {
    requestId: string;
    timestamp: string;
  };
}

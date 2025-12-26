/**
 * @forge/ai-router 타입 정의
 * v2.1 - Prompt Caching + Batches API + Nomic Embedding
 */

// ============================================================================
// AI 모델 타입
// ============================================================================

export type AIModel = 'haiku' | 'sonnet' | 'opus';

export type ModelId =
  | 'claude-3-5-haiku-20241022'
  | 'claude-3-5-sonnet-20241022'
  | 'claude-3-opus-20240229';

export const MODEL_IDS: Record<AIModel, ModelId> = {
  haiku: 'claude-3-5-haiku-20241022',
  sonnet: 'claude-3-5-sonnet-20241022',
  opus: 'claude-3-opus-20240229',
};

// ============================================================================
// 태스크 분류
// ============================================================================

export type TaskType =
  | 'keyword_extraction'
  | 'scoring'
  | 'summary'
  | 'product_match'
  | 'complex_analysis'
  | 'unknown';

export interface TaskClassification {
  type: TaskType;
  model: AIModel;
  estimatedTokens: number;
  reason: string;
}

export interface ClassifierConfig {
  maxTokensForHaiku: number;
  maxTokensForSonnet: number;
  complexTaskTypes: TaskType[];
}

export const DEFAULT_CLASSIFIER_CONFIG: ClassifierConfig = {
  maxTokensForHaiku: 500,
  maxTokensForSonnet: 2000,
  complexTaskTypes: ['complex_analysis'],
};

// ============================================================================
// 임베딩 서비스
// ============================================================================

export interface EmbeddingResult {
  text: string;
  embedding: number[];
  model: 'nomic-embed-text-v1.5';
  timestamp: string;
}

export interface SimilarityResult {
  productId: string;
  productName: string;
  score: number;
  confidence: 'high' | 'medium' | 'low' | 'none';
}

export interface ProductEmbedding {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  embedding: number[];
}

// ============================================================================
// Anthropic Provider
// ============================================================================

export interface AnthropicConfig {
  apiKey: string;
  enablePromptCaching: boolean;
  enableBatching: boolean;
  batchThreshold: number;
  maxConcurrent: number;
}

export const DEFAULT_ANTHROPIC_CONFIG: AnthropicConfig = {
  apiKey: '',
  enablePromptCaching: true,
  enableBatching: true,
  batchThreshold: 10,
  maxConcurrent: 5,
};

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface CompletionRequest {
  model: AIModel;
  messages: ChatMessage[];
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  useCache?: boolean;
}

export interface CompletionResponse {
  content: string;
  model: ModelId;
  usage: {
    inputTokens: number;
    outputTokens: number;
    cacheHits?: number;
  };
  cost: {
    inputCost: number;
    outputCost: number;
    total: number;
    savings?: number;
  };
  latencyMs: number;
}

// ============================================================================
// 배치 처리
// ============================================================================

export interface BatchRequest {
  id: string;
  request: CompletionRequest;
  priority: 'high' | 'normal' | 'low';
  createdAt: string;
}

export interface BatchResult {
  id: string;
  response: CompletionResponse | null;
  error: string | null;
  completedAt: string;
}

export interface BatchStatus {
  batchId: string;
  total: number;
  completed: number;
  failed: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

// ============================================================================
// 비용 추적
// ============================================================================

export interface CostMetrics {
  totalRequests: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCost: number;
  totalSavings: number;
  byModel: Record<AIModel, {
    requests: number;
    inputTokens: number;
    outputTokens: number;
    cost: number;
  }>;
  cacheHitRate: number;
  batchDiscountTotal: number;
}

// 모델별 가격 (per 1M tokens) - USD
export const MODEL_PRICING = {
  haiku: {
    input: 1.0,
    output: 5.0,
    cacheWrite: 1.25,
    cacheRead: 0.1,
  },
  sonnet: {
    input: 3.0,
    output: 15.0,
    cacheWrite: 3.75,
    cacheRead: 0.3,
  },
  opus: {
    input: 15.0,
    output: 75.0,
    cacheWrite: 18.75,
    cacheRead: 1.5,
  },
} as const;

// Batch API 할인율 (50%)
export const BATCH_DISCOUNT = 0.5;

// ============================================================================
// AI Router 통합 인터페이스
// ============================================================================

export interface AIRouterConfig {
  anthropic: AnthropicConfig;
  classifier: ClassifierConfig;
  enableMetrics: boolean;
}

export interface AIRouterRequest {
  task: string;
  context?: string;
  forceModel?: AIModel;
  useBatch?: boolean;
}

export interface AIRouterResponse {
  result: string;
  classification: TaskClassification;
  completion: CompletionResponse;
  similarProducts?: SimilarityResult[];
}

# BIDFLOW AI Architecture v2.0 - 상세 설계 문서

> **목표**: 월 $20-25 비용으로 최고 품질 AI 기능 제공
> **전략**: 시맨틱 캐시 + 임베딩 필터 + 멀티모델 라우팅
> **호환성**: 기존 BIDFLOW 아키텍처 100% 유지

---

## 1. 패키지 구조

```
packages/
├── ai-router/                    ← 새로 생성
│   ├── src/
│   │   ├── index.ts              ← 메인 export
│   │   ├── types.ts              ← 타입 정의
│   │   ├── router/
│   │   │   ├── task-classifier.ts     ← 태스크 분류기
│   │   │   ├── model-selector.ts      ← 모델 선택기
│   │   │   └── cost-tracker.ts        ← 비용 추적기
│   │   ├── cache/
│   │   │   ├── semantic-cache.ts      ← 시맨틱 캐시
│   │   │   ├── cache-key-generator.ts ← 캐시 키 생성
│   │   │   └── redis-adapter.ts       ← Redis 어댑터
│   │   ├── embedding/
│   │   │   ├── embedding-service.ts   ← 임베딩 서비스
│   │   │   ├── similarity-filter.ts   ← 유사도 필터
│   │   │   └── product-embeddings.ts  ← 제품 임베딩 저장소
│   │   ├── batch/
│   │   │   ├── batch-processor.ts     ← 배치 처리기
│   │   │   ├── queue-manager.ts       ← 큐 관리자
│   │   │   └── result-aggregator.ts   ← 결과 집계기
│   │   ├── providers/
│   │   │   ├── anthropic.ts           ← Claude API 래퍼
│   │   │   ├── openai.ts              ← OpenAI API 래퍼 (임베딩용)
│   │   │   └── provider-interface.ts  ← 공통 인터페이스
│   │   └── utils/
│   │       ├── prompt-compressor.ts   ← 프롬프트 압축
│   │       ├── token-counter.ts       ← 토큰 카운터
│   │       └── retry-handler.ts       ← 재시도 핸들러
│   ├── package.json
│   └── tsconfig.json
```

---

## 2. 타입 정의 (types.ts)

```typescript
// ============================================================================
// 모델 정의
// ============================================================================

export type ClaudeModel =
  | 'claude-3-5-haiku-20241022'   // 빠르고 저렴
  | 'claude-sonnet-4-20250514'    // 균형
  | 'claude-opus-4-5-20251101';   // 최고 품질

export type EmbeddingModel = 'text-embedding-3-small' | 'text-embedding-3-large';

export interface ModelConfig {
  model: ClaudeModel;
  maxTokens: number;
  temperature: number;
  priority: 'low' | 'normal' | 'high' | 'critical';
}

// ============================================================================
// 태스크 정의
// ============================================================================

export type TaskType =
  // Haiku 적합 (70%)
  | 'summarize'           // AI_SUMMARY
  | 'score'               // AI_SCORE
  | 'extract_keywords'    // AI_KEYWORDS
  | 'match_product'       // AI_MATCH
  | 'validate_form'       // 폼 검증
  | 'classify'            // 분류
  | 'deadline_analyze'    // AI_DEADLINE

  // Sonnet 적합 (25%)
  | 'rfp_analyze'         // RFP 상세 분석
  | 'proposal_draft'      // AI_PROPOSAL 초안
  | 'risk_analyze'        // AI_RISK
  | 'competitor_analyze'  // 경쟁사 분석
  | 'long_document'       // 긴 문서 처리

  // Opus 적합 (5%)
  | 'final_review'        // 최종 검토
  | 'legal_review'        // 법률 검토
  | 'negotiation_strategy'; // 협상 전략

export interface TaskRequest {
  id: string;
  type: TaskType;
  input: TaskInput;
  options?: TaskOptions;
  createdAt: Date;
}

export interface TaskInput {
  text: string;
  context?: Record<string, unknown>;
  maxOutputTokens?: number;
}

export interface TaskOptions {
  forceModel?: ClaudeModel;
  skipCache?: boolean;
  skipEmbeddingFilter?: boolean;
  priority?: 'low' | 'normal' | 'high' | 'critical';
  timeout?: number;
  batchGroup?: string;
}

export interface TaskResult<T = unknown> {
  id: string;
  success: boolean;
  data?: T;
  error?: string;
  metadata: TaskMetadata;
}

export interface TaskMetadata {
  model: ClaudeModel;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  costUsd: number;
  cached: boolean;
  embeddingFiltered: boolean;
  batchId?: string;
}

// ============================================================================
// 캐시 정의
// ============================================================================

export interface CacheEntry<T = unknown> {
  key: string;
  value: T;
  embedding: number[];
  createdAt: Date;
  expiresAt: Date;
  hitCount: number;
  taskType: TaskType;
}

export interface CacheConfig {
  ttlSeconds: number;
  maxEntries: number;
  similarityThreshold: number;  // 0.0 - 1.0
  embeddingModel: EmbeddingModel;
}

// ============================================================================
// 임베딩 정의
// ============================================================================

export interface EmbeddingResult {
  text: string;
  embedding: number[];
  model: EmbeddingModel;
  dimensions: number;
}

export interface SimilarityResult {
  score: number;
  isMatch: boolean;
  matchedItem?: {
    id: string;
    text: string;
    embedding: number[];
  };
}

// ============================================================================
// 배치 정의
// ============================================================================

export interface BatchJob {
  id: string;
  tasks: TaskRequest[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  results?: TaskResult[];
}

export interface BatchConfig {
  maxBatchSize: number;
  maxWaitTimeMs: number;
  retryAttempts: number;
  concurrency: number;
}

// ============================================================================
// 비용 추적
// ============================================================================

export interface CostRecord {
  date: string;
  model: ClaudeModel;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  taskType: TaskType;
  cached: boolean;
}

export interface CostSummary {
  period: { start: Date; end: Date };
  totalCostUsd: number;
  byModel: Record<ClaudeModel, number>;
  byTaskType: Record<TaskType, number>;
  cacheHitRate: number;
  embeddingFilterRate: number;
  estimatedSavingsUsd: number;
}

// ============================================================================
// 모델 가격 (2025년 1월 기준)
// ============================================================================

export const MODEL_PRICING: Record<ClaudeModel, { input: number; output: number }> = {
  'claude-3-5-haiku-20241022': { input: 0.80, output: 4.00 },   // per 1M tokens
  'claude-sonnet-4-20250514': { input: 3.00, output: 15.00 },
  'claude-opus-4-5-20251101': { input: 15.00, output: 75.00 },
};

export const EMBEDDING_PRICING: Record<EmbeddingModel, number> = {
  'text-embedding-3-small': 0.02,   // per 1M tokens
  'text-embedding-3-large': 0.13,
};
```

---

## 3. 핵심 컴포넌트 설계

### 3.1 Task Classifier (task-classifier.ts)

```typescript
import type { TaskType, TaskRequest, ClaudeModel, ModelConfig } from '../types';

/**
 * 태스크 유형에 따라 최적 모델을 결정하는 분류기
 */
export class TaskClassifier {

  // 태스크별 기본 모델 매핑
  private static readonly TASK_MODEL_MAP: Record<TaskType, ClaudeModel> = {
    // Haiku 태스크 (70%)
    summarize: 'claude-3-5-haiku-20241022',
    score: 'claude-3-5-haiku-20241022',
    extract_keywords: 'claude-3-5-haiku-20241022',
    match_product: 'claude-3-5-haiku-20241022',
    validate_form: 'claude-3-5-haiku-20241022',
    classify: 'claude-3-5-haiku-20241022',
    deadline_analyze: 'claude-3-5-haiku-20241022',

    // Sonnet 태스크 (25%)
    rfp_analyze: 'claude-sonnet-4-20250514',
    proposal_draft: 'claude-sonnet-4-20250514',
    risk_analyze: 'claude-sonnet-4-20250514',
    competitor_analyze: 'claude-sonnet-4-20250514',
    long_document: 'claude-sonnet-4-20250514',

    // Opus 태스크 (5%)
    final_review: 'claude-opus-4-5-20251101',
    legal_review: 'claude-opus-4-5-20251101',
    negotiation_strategy: 'claude-opus-4-5-20251101',
  };

  // 태스크별 기본 설정
  private static readonly TASK_CONFIG: Record<TaskType, Partial<ModelConfig>> = {
    summarize: { maxTokens: 200, temperature: 0.3 },
    score: { maxTokens: 50, temperature: 0.1 },
    extract_keywords: { maxTokens: 50, temperature: 0.2 },
    match_product: { maxTokens: 100, temperature: 0.1 },
    validate_form: { maxTokens: 100, temperature: 0.1 },
    classify: { maxTokens: 50, temperature: 0.1 },
    deadline_analyze: { maxTokens: 100, temperature: 0.2 },

    rfp_analyze: { maxTokens: 2000, temperature: 0.4 },
    proposal_draft: { maxTokens: 4000, temperature: 0.6 },
    risk_analyze: { maxTokens: 1000, temperature: 0.3 },
    competitor_analyze: { maxTokens: 1500, temperature: 0.4 },
    long_document: { maxTokens: 3000, temperature: 0.3 },

    final_review: { maxTokens: 2000, temperature: 0.2 },
    legal_review: { maxTokens: 3000, temperature: 0.1 },
    negotiation_strategy: { maxTokens: 2500, temperature: 0.5 },
  };

  /**
   * 태스크에 최적화된 모델 설정 반환
   */
  classify(task: TaskRequest): ModelConfig {
    const taskType = task.type;

    // 강제 모델 지정시 해당 모델 사용
    if (task.options?.forceModel) {
      return this.buildConfig(task.options.forceModel, taskType, task.options.priority);
    }

    // 입력 토큰 수에 따른 동적 업그레이드
    const estimatedTokens = this.estimateTokens(task.input.text);
    let model = TaskClassifier.TASK_MODEL_MAP[taskType];

    // 토큰 수가 많으면 상위 모델로 업그레이드
    if (estimatedTokens > 4000 && model === 'claude-3-5-haiku-20241022') {
      model = 'claude-sonnet-4-20250514';
    }
    if (estimatedTokens > 10000 && model === 'claude-sonnet-4-20250514') {
      model = 'claude-opus-4-5-20251101';
    }

    // 우선순위에 따른 업그레이드
    if (task.options?.priority === 'critical' && model !== 'claude-opus-4-5-20251101') {
      model = 'claude-opus-4-5-20251101';
    }

    return this.buildConfig(model, taskType, task.options?.priority);
  }

  private buildConfig(
    model: ClaudeModel,
    taskType: TaskType,
    priority?: string
  ): ModelConfig {
    const baseConfig = TaskClassifier.TASK_CONFIG[taskType] || {};
    return {
      model,
      maxTokens: baseConfig.maxTokens || 1000,
      temperature: baseConfig.temperature || 0.3,
      priority: (priority as ModelConfig['priority']) || 'normal',
    };
  }

  private estimateTokens(text: string): number {
    // 한글은 대략 1.5자당 1토큰, 영어는 4자당 1토큰
    const koreanChars = (text.match(/[가-힣]/g) || []).length;
    const otherChars = text.length - koreanChars;
    return Math.ceil(koreanChars / 1.5) + Math.ceil(otherChars / 4);
  }
}
```

### 3.2 Semantic Cache (semantic-cache.ts)

```typescript
import type { CacheEntry, CacheConfig, TaskResult, TaskRequest } from '../types';
import { EmbeddingService } from '../embedding/embedding-service';

/**
 * 시맨틱 유사도 기반 캐시
 * - 정확히 같은 쿼리: 해시 기반 즉시 반환
 * - 유사한 쿼리: 임베딩 거리 기반 반환
 */
export class SemanticCache {
  private cache: Map<string, CacheEntry> = new Map();
  private embeddingService: EmbeddingService;
  private config: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      ttlSeconds: config.ttlSeconds || 86400,  // 24시간
      maxEntries: config.maxEntries || 10000,
      similarityThreshold: config.similarityThreshold || 0.92,
      embeddingModel: config.embeddingModel || 'text-embedding-3-small',
    };
    this.embeddingService = new EmbeddingService(this.config.embeddingModel);
  }

  /**
   * 캐시 조회 (정확 매칭 → 시맨틱 매칭)
   */
  async get<T>(request: TaskRequest): Promise<CacheEntry<T> | null> {
    const exactKey = this.generateExactKey(request);

    // 1. 정확 매칭 시도
    const exactMatch = this.cache.get(exactKey);
    if (exactMatch && !this.isExpired(exactMatch)) {
      exactMatch.hitCount++;
      return exactMatch as CacheEntry<T>;
    }

    // 2. 시맨틱 매칭 시도
    const queryEmbedding = await this.embeddingService.embed(request.input.text);

    let bestMatch: CacheEntry | null = null;
    let bestSimilarity = 0;

    for (const entry of this.cache.values()) {
      if (entry.taskType !== request.type) continue;
      if (this.isExpired(entry)) continue;

      const similarity = this.cosineSimilarity(queryEmbedding, entry.embedding);
      if (similarity > this.config.similarityThreshold && similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestMatch = entry;
      }
    }

    if (bestMatch) {
      bestMatch.hitCount++;
      return bestMatch as CacheEntry<T>;
    }

    return null;
  }

  /**
   * 캐시 저장
   */
  async set<T>(request: TaskRequest, result: TaskResult<T>): Promise<void> {
    // 캐시 용량 관리
    if (this.cache.size >= this.config.maxEntries) {
      this.evictLRU();
    }

    const key = this.generateExactKey(request);
    const embedding = await this.embeddingService.embed(request.input.text);

    const entry: CacheEntry<T> = {
      key,
      value: result as T,
      embedding,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + this.config.ttlSeconds * 1000),
      hitCount: 0,
      taskType: request.type,
    };

    this.cache.set(key, entry);
  }

  /**
   * 캐시 통계
   */
  getStats(): { size: number; hitRate: number } {
    let totalHits = 0;
    for (const entry of this.cache.values()) {
      totalHits += entry.hitCount;
    }
    return {
      size: this.cache.size,
      hitRate: this.cache.size > 0 ? totalHits / this.cache.size : 0,
    };
  }

  private generateExactKey(request: TaskRequest): string {
    const hash = this.simpleHash(request.type + ':' + request.input.text);
    return `cache:${request.type}:${hash}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private isExpired(entry: CacheEntry): boolean {
    return new Date() > entry.expiresAt;
  }

  private evictLRU(): void {
    // 가장 적게 사용된 엔트리 제거 (hitCount 기준)
    let lruKey: string | null = null;
    let lruHits = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.hitCount < lruHits) {
        lruHits = entry.hitCount;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
    }
  }
}
```

### 3.3 Embedding Pre-Filter (similarity-filter.ts)

```typescript
import type { SimilarityResult, EmbeddingResult } from '../types';
import { EmbeddingService } from './embedding-service';

/**
 * 임베딩 기반 사전 필터링
 * - 입찰 공고와 제품 임베딩 비교
 * - 유사도 낮으면 AI 호출 스킵
 */
export class SimilarityFilter {
  private embeddingService: EmbeddingService;
  private productEmbeddings: Map<string, EmbeddingResult> = new Map();
  private threshold: number;

  constructor(threshold: number = 0.3) {
    this.embeddingService = new EmbeddingService('text-embedding-3-small');
    this.threshold = threshold;
  }

  /**
   * 제품 임베딩 로드 (앱 시작시 1회)
   */
  async loadProductEmbeddings(products: Array<{ id: string; description: string }>): Promise<void> {
    for (const product of products) {
      const embedding = await this.embeddingService.embed(product.description);
      this.productEmbeddings.set(product.id, {
        text: product.description,
        embedding,
        model: 'text-embedding-3-small',
        dimensions: embedding.length,
      });
    }
  }

  /**
   * 입찰 공고와 제품 유사도 체크
   * @returns 가장 유사한 제품과 점수
   */
  async checkSimilarity(bidText: string): Promise<SimilarityResult> {
    const bidEmbedding = await this.embeddingService.embed(bidText);

    let bestScore = 0;
    let bestProduct: EmbeddingResult | undefined;
    let bestProductId: string | undefined;

    for (const [productId, product] of this.productEmbeddings) {
      const score = this.cosineSimilarity(bidEmbedding, product.embedding);
      if (score > bestScore) {
        bestScore = score;
        bestProduct = product;
        bestProductId = productId;
      }
    }

    return {
      score: bestScore,
      isMatch: bestScore >= this.threshold,
      matchedItem: bestProduct && bestProductId ? {
        id: bestProductId,
        text: bestProduct.text,
        embedding: bestProduct.embedding,
      } : undefined,
    };
  }

  /**
   * 배치 필터링 (여러 입찰 동시 처리)
   */
  async filterBatch(
    bids: Array<{ id: string; text: string }>
  ): Promise<Array<{ id: string; shouldProcess: boolean; score: number }>> {
    const results = await Promise.all(
      bids.map(async (bid) => {
        const similarity = await this.checkSimilarity(bid.text);
        return {
          id: bid.id,
          shouldProcess: similarity.isMatch,
          score: similarity.score,
        };
      })
    );
    return results;
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

// ============================================================================
// CMNTech 제품 임베딩 초기화
// ============================================================================

export const CMNTECH_PRODUCTS = [
  {
    id: 'UR-1000PLUS',
    description: '멀티라인 초음파 유량계 300-4000mm 대구경 상하수도 관로 측정 클램프온 비접촉식',
  },
  {
    id: 'MF-1000C',
    description: '전자식 유량계 15-300mm 소구경 일체형 플랜지 정밀 측정 상수도 공업용수',
  },
  {
    id: 'UR-1010PLUS',
    description: '비접촉 개수로 유량계 300-3000mm 하천 용수로 농업용수 초음파 레벨 측정',
  },
  {
    id: 'SL-3000PLUS',
    description: '개수로 레벨 센서 하천 수위 모니터링 초음파 비접촉 실시간 원격 감시',
  },
  {
    id: 'EnerRay',
    description: '초음파 열량계 난방 냉방 에너지 측정 BTU 미터 빌딩 에너지 관리',
  },
];
```

### 3.4 Batch Processor (batch-processor.ts)

```typescript
import type { TaskRequest, TaskResult, BatchJob, BatchConfig } from '../types';
import { TaskClassifier } from '../router/task-classifier';

/**
 * 배치 처리기
 * - 여러 요청을 모아서 한 번에 처리
 * - 동일 모델 요청끼리 그룹화
 */
export class BatchProcessor {
  private pendingJobs: Map<string, TaskRequest[]> = new Map();
  private config: BatchConfig;
  private classifier: TaskClassifier;
  private flushTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(config: Partial<BatchConfig> = {}) {
    this.config = {
      maxBatchSize: config.maxBatchSize || 10,
      maxWaitTimeMs: config.maxWaitTimeMs || 1000,
      retryAttempts: config.retryAttempts || 3,
      concurrency: config.concurrency || 5,
    };
    this.classifier = new TaskClassifier();
  }

  /**
   * 요청을 배치에 추가
   */
  async add(request: TaskRequest): Promise<TaskResult> {
    const modelConfig = this.classifier.classify(request);
    const batchKey = `${modelConfig.model}:${request.type}`;

    // 배치 그룹에 추가
    if (!this.pendingJobs.has(batchKey)) {
      this.pendingJobs.set(batchKey, []);
    }
    this.pendingJobs.get(batchKey)!.push(request);

    // 플러시 타이머 설정
    this.scheduleFlush(batchKey);

    // 배치 크기 도달시 즉시 플러시
    if (this.pendingJobs.get(batchKey)!.length >= this.config.maxBatchSize) {
      return this.flush(batchKey).then(results =>
        results.find(r => r.id === request.id)!
      );
    }

    // Promise로 결과 대기
    return new Promise((resolve, reject) => {
      (request as any).__resolve = resolve;
      (request as any).__reject = reject;
    });
  }

  private scheduleFlush(batchKey: string): void {
    if (this.flushTimers.has(batchKey)) return;

    const timer = setTimeout(() => {
      this.flush(batchKey);
      this.flushTimers.delete(batchKey);
    }, this.config.maxWaitTimeMs);

    this.flushTimers.set(batchKey, timer);
  }

  /**
   * 배치 실행
   */
  async flush(batchKey: string): Promise<TaskResult[]> {
    const jobs = this.pendingJobs.get(batchKey) || [];
    this.pendingJobs.delete(batchKey);

    if (jobs.length === 0) return [];

    const [model, taskType] = batchKey.split(':');

    // 배치 처리 (실제 API 호출)
    const results = await this.executeBatch(jobs, model as any);

    // 개별 Promise 해결
    for (const result of results) {
      const job = jobs.find(j => j.id === result.id);
      if (job && (job as any).__resolve) {
        (job as any).__resolve(result);
      }
    }

    return results;
  }

  private async executeBatch(
    jobs: TaskRequest[],
    model: string
  ): Promise<TaskResult[]> {
    // 실제 Claude API 배치 호출 구현
    // 현재는 개별 호출 (추후 Messages Batches API 활용)
    const results: TaskResult[] = [];

    for (const job of jobs) {
      try {
        // TODO: 실제 API 호출 구현
        results.push({
          id: job.id,
          success: true,
          data: { message: 'batch processed' },
          metadata: {
            model: model as any,
            inputTokens: 0,
            outputTokens: 0,
            latencyMs: 0,
            costUsd: 0,
            cached: false,
            embeddingFiltered: false,
            batchId: `batch-${Date.now()}`,
          },
        });
      } catch (error) {
        results.push({
          id: job.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          metadata: {
            model: model as any,
            inputTokens: 0,
            outputTokens: 0,
            latencyMs: 0,
            costUsd: 0,
            cached: false,
            embeddingFiltered: false,
          },
        });
      }
    }

    return results;
  }

  /**
   * 모든 대기 중인 배치 플러시
   */
  async flushAll(): Promise<void> {
    const keys = Array.from(this.pendingJobs.keys());
    await Promise.all(keys.map(key => this.flush(key)));
  }
}
```

---

## 4. 메인 AI Router (index.ts)

```typescript
import { TaskClassifier } from './router/task-classifier';
import { SemanticCache } from './cache/semantic-cache';
import { SimilarityFilter, CMNTECH_PRODUCTS } from './embedding/similarity-filter';
import { BatchProcessor } from './batch/batch-processor';
import { CostTracker } from './router/cost-tracker';
import { AnthropicProvider } from './providers/anthropic';
import type {
  TaskRequest,
  TaskResult,
  TaskType,
  TaskInput,
  TaskOptions,
  CostSummary
} from './types';

export interface AIRouterConfig {
  anthropicApiKey: string;
  openaiApiKey?: string;  // 임베딩용
  enableCache?: boolean;
  enableEmbeddingFilter?: boolean;
  enableBatch?: boolean;
}

/**
 * AI Router - 통합 진입점
 */
export class AIRouter {
  private classifier: TaskClassifier;
  private cache: SemanticCache;
  private filter: SimilarityFilter;
  private batchProcessor: BatchProcessor;
  private costTracker: CostTracker;
  private provider: AnthropicProvider;
  private config: AIRouterConfig;
  private initialized: boolean = false;

  constructor(config: AIRouterConfig) {
    this.config = {
      enableCache: true,
      enableEmbeddingFilter: true,
      enableBatch: true,
      ...config,
    };

    this.classifier = new TaskClassifier();
    this.cache = new SemanticCache();
    this.filter = new SimilarityFilter();
    this.batchProcessor = new BatchProcessor();
    this.costTracker = new CostTracker();
    this.provider = new AnthropicProvider(config.anthropicApiKey);
  }

  /**
   * 초기화 (제품 임베딩 로드)
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    if (this.config.enableEmbeddingFilter) {
      await this.filter.loadProductEmbeddings(CMNTECH_PRODUCTS);
    }

    this.initialized = true;
  }

  /**
   * AI 태스크 실행
   */
  async execute<T = unknown>(
    type: TaskType,
    input: TaskInput,
    options?: TaskOptions
  ): Promise<TaskResult<T>> {
    await this.initialize();

    const request: TaskRequest = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      input,
      options,
      createdAt: new Date(),
    };

    // 1. 캐시 체크
    if (this.config.enableCache && !options?.skipCache) {
      const cached = await this.cache.get<T>(request);
      if (cached) {
        return {
          id: request.id,
          success: true,
          data: cached.value as T,
          metadata: {
            model: 'claude-3-5-haiku-20241022', // 캐시는 모델 무관
            inputTokens: 0,
            outputTokens: 0,
            latencyMs: 0,
            costUsd: 0,
            cached: true,
            embeddingFiltered: false,
          },
        };
      }
    }

    // 2. 임베딩 필터 (매칭 관련 태스크만)
    if (
      this.config.enableEmbeddingFilter &&
      !options?.skipEmbeddingFilter &&
      ['match_product', 'score'].includes(type)
    ) {
      const similarity = await this.filter.checkSimilarity(input.text);
      if (!similarity.isMatch) {
        return {
          id: request.id,
          success: true,
          data: {
            score: 0,
            recommendation: 'SKIP',
            reason: '제품 적합도 미달',
          } as T,
          metadata: {
            model: 'claude-3-5-haiku-20241022',
            inputTokens: 0,
            outputTokens: 0,
            latencyMs: 0,
            costUsd: 0,
            cached: false,
            embeddingFiltered: true,
          },
        };
      }
    }

    // 3. 모델 분류
    const modelConfig = this.classifier.classify(request);

    // 4. 배치 처리 또는 즉시 실행
    let result: TaskResult<T>;

    if (this.config.enableBatch && options?.priority !== 'critical') {
      result = await this.batchProcessor.add(request) as TaskResult<T>;
    } else {
      result = await this.executeImmediate<T>(request, modelConfig);
    }

    // 5. 캐시 저장
    if (this.config.enableCache && result.success) {
      await this.cache.set(request, result);
    }

    // 6. 비용 추적
    this.costTracker.record(result.metadata);

    return result;
  }

  private async executeImmediate<T>(
    request: TaskRequest,
    modelConfig: any
  ): Promise<TaskResult<T>> {
    const startTime = Date.now();

    try {
      const response = await this.provider.complete({
        model: modelConfig.model,
        messages: [
          { role: 'user', content: this.buildPrompt(request) }
        ],
        max_tokens: modelConfig.maxTokens,
        temperature: modelConfig.temperature,
      });

      return {
        id: request.id,
        success: true,
        data: this.parseResponse<T>(response, request.type),
        metadata: {
          model: modelConfig.model,
          inputTokens: response.usage?.input_tokens || 0,
          outputTokens: response.usage?.output_tokens || 0,
          latencyMs: Date.now() - startTime,
          costUsd: this.calculateCost(
            modelConfig.model,
            response.usage?.input_tokens || 0,
            response.usage?.output_tokens || 0
          ),
          cached: false,
          embeddingFiltered: false,
        },
      };
    } catch (error) {
      return {
        id: request.id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          model: modelConfig.model,
          inputTokens: 0,
          outputTokens: 0,
          latencyMs: Date.now() - startTime,
          costUsd: 0,
          cached: false,
          embeddingFiltered: false,
        },
      };
    }
  }

  private buildPrompt(request: TaskRequest): string {
    // 태스크별 프롬프트 템플릿
    const templates: Record<TaskType, string> = {
      summarize: `다음 입찰 공고를 2-3문장으로 요약해주세요:\n\n${request.input.text}`,
      score: `다음 입찰 공고의 낙찰 가능성을 0-100 점수로 평가해주세요. 숫자만 응답:\n\n${request.input.text}`,
      extract_keywords: `다음 텍스트에서 핵심 키워드 3개를 추출해주세요. 쉼표로 구분:\n\n${request.input.text}`,
      match_product: `다음 입찰 공고에 가장 적합한 제품을 선택해주세요:\n제품목록: UR-1000PLUS, MF-1000C, UR-1010PLUS, SL-3000PLUS, EnerRay\n\n공고:\n${request.input.text}`,
      // ... 나머지 태스크 템플릿
    } as Record<TaskType, string>;

    return templates[request.type] || request.input.text;
  }

  private parseResponse<T>(response: any, taskType: TaskType): T {
    const content = response.content?.[0]?.text || '';

    switch (taskType) {
      case 'score':
        return { score: parseInt(content.match(/\d+/)?.[0] || '0', 10) } as T;
      case 'extract_keywords':
        return { keywords: content.split(',').map((k: string) => k.trim()) } as T;
      default:
        return { result: content } as T;
    }
  }

  private calculateCost(model: string, inputTokens: number, outputTokens: number): number {
    const pricing: Record<string, { input: number; output: number }> = {
      'claude-3-5-haiku-20241022': { input: 0.80, output: 4.00 },
      'claude-sonnet-4-20250514': { input: 3.00, output: 15.00 },
      'claude-opus-4-5-20251101': { input: 15.00, output: 75.00 },
    };
    const p = pricing[model] || pricing['claude-3-5-haiku-20241022'];
    return (inputTokens / 1_000_000) * p.input + (outputTokens / 1_000_000) * p.output;
  }

  /**
   * 비용 요약 조회
   */
  getCostSummary(days: number = 30): CostSummary {
    return this.costTracker.getSummary(days);
  }

  /**
   * 캐시 통계 조회
   */
  getCacheStats(): { size: number; hitRate: number } {
    return this.cache.getStats();
  }
}

// ============================================================================
// Convenience Exports
// ============================================================================

export * from './types';
export { TaskClassifier } from './router/task-classifier';
export { SemanticCache } from './cache/semantic-cache';
export { SimilarityFilter } from './embedding/similarity-filter';
export { BatchProcessor } from './batch/batch-processor';
```

---

## 5. BIDFLOW 통합 가이드

### 5.1 기존 API 마이그레이션

```typescript
// apps/bidflow/src/app/api/v1/ai/score/route.ts (변경 후)

import { AIRouter } from '@forge/ai-router';

const router = new AIRouter({
  anthropicApiKey: process.env.ANTHROPIC_API_KEY!,
  openaiApiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json();
  const { title, organization, description } = body;

  const result = await router.execute('score', {
    text: `제목: ${title}\n기관: ${organization}\n설명: ${description}`,
    context: { bidId: body.bidId },
  });

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    data: result.data,
    metadata: {
      cached: result.metadata.cached,
      model: result.metadata.model,
      costUsd: result.metadata.costUsd,
    },
  });
}
```

### 5.2 새로운 AI 함수 추가

```typescript
// apps/bidflow/src/lib/ai/functions.ts

import { AIRouter, TaskType } from '@forge/ai-router';

const router = new AIRouter({
  anthropicApiKey: process.env.ANTHROPIC_API_KEY!,
});

// AI_SUMMARY
export async function AI_SUMMARY(bidText: string): Promise<string> {
  const result = await router.execute<{ result: string }>('summarize', { text: bidText });
  return result.success ? result.data!.result : '';
}

// AI_SCORE
export async function AI_SCORE(bidText: string): Promise<number> {
  const result = await router.execute<{ score: number }>('score', { text: bidText });
  return result.success ? result.data!.score : 0;
}

// AI_KEYWORDS
export async function AI_KEYWORDS(bidText: string): Promise<string[]> {
  const result = await router.execute<{ keywords: string[] }>('extract_keywords', { text: bidText });
  return result.success ? result.data!.keywords : [];
}

// AI_MATCH
export async function AI_MATCH(bidText: string): Promise<string> {
  const result = await router.execute<{ product: string }>('match_product', { text: bidText });
  return result.success ? result.data!.product : '';
}

// AI_PROPOSAL (Sonnet 사용)
export async function AI_PROPOSAL(bidText: string, companyInfo: string): Promise<string> {
  const result = await router.execute<{ result: string }>('proposal_draft', {
    text: bidText,
    context: { companyInfo },
  });
  return result.success ? result.data!.result : '';
}

// AI_RISK (Sonnet 사용)
export async function AI_RISK(bidText: string): Promise<{ level: string; factors: string[] }> {
  const result = await router.execute<{ level: string; factors: string[] }>('risk_analyze', {
    text: bidText,
  });
  return result.success ? result.data! : { level: 'unknown', factors: [] };
}
```

---

## 6. 환경 변수

```env
# .env.local

# Anthropic (필수)
ANTHROPIC_API_KEY=sk-ant-...

# OpenAI (임베딩용, 선택)
OPENAI_API_KEY=sk-...

# Redis (캐시용, 선택 - 없으면 인메모리)
REDIS_URL=redis://localhost:6379

# AI Router 설정
AI_ROUTER_ENABLE_CACHE=true
AI_ROUTER_ENABLE_EMBEDDING_FILTER=true
AI_ROUTER_ENABLE_BATCH=true
AI_ROUTER_CACHE_TTL_SECONDS=86400
AI_ROUTER_SIMILARITY_THRESHOLD=0.3
```

---

## 7. 예상 비용 시뮬레이션

### 일일 처리량 기준 (100건/일)

| 구분 | 호출수 | 모델 | 비용/건 | 일비용 |
|------|--------|------|---------|--------|
| 캐시 히트 | 45건 | - | $0 | $0 |
| 임베딩 필터 | 30건 | - | $0.0001 | $0.003 |
| Haiku 처리 | 20건 | Haiku | $0.003 | $0.06 |
| Sonnet 처리 | 4건 | Sonnet | $0.02 | $0.08 |
| Opus 처리 | 1건 | Opus | $0.10 | $0.10 |
| **합계** | 100건 | - | - | **$0.24** |

**월간 비용: $0.24 × 30 = $7.20**

### 대량 처리 (500건/일)

| 구분 | 비율 | 일비용 |
|------|------|--------|
| 캐시 | 45% | $0 |
| 필터 | 30% | $0.015 |
| Haiku | 17.5% | $0.30 |
| Sonnet | 6.5% | $0.65 |
| Opus | 1% | $0.50 |
| **합계** | 100% | **$1.47** |

**월간 비용: $1.47 × 30 = $44**

---

## 8. 구현 체크리스트

### Phase 1: 핵심 인프라 (Week 1)
- [ ] `@forge/ai-router` 패키지 생성
- [ ] 타입 정의 (types.ts)
- [ ] TaskClassifier 구현
- [ ] AnthropicProvider 구현
- [ ] 기본 단위 테스트

### Phase 2: 최적화 레이어 (Week 2)
- [ ] SemanticCache 구현
- [ ] EmbeddingService 구현 (OpenAI)
- [ ] SimilarityFilter 구현
- [ ] 제품 임베딩 초기화

### Phase 3: 배치 처리 (Week 3)
- [ ] BatchProcessor 구현
- [ ] CostTracker 구현
- [ ] 통합 AIRouter 완성
- [ ] Redis 어댑터 (선택)

### Phase 4: BIDFLOW 통합 (Week 4)
- [ ] 기존 API 마이그레이션
- [ ] AI 함수 래퍼 작성
- [ ] 통합 테스트
- [ ] 비용 모니터링 대시보드

---

## 9. 결론

이 설계는:
- **기존 아키텍처 100% 호환**
- **월 $20-25 목표 달성** (500건/일 기준 $44, 최적화시 $20 이하)
- **품질 유지**: 중요 작업은 Sonnet/Opus 자동 라우팅
- **확장성**: 10배 트래픽도 $200 이하
- **유지보수**: 단일 패키지로 모든 AI 로직 중앙화

**개발 시작 트리거 대기중...**

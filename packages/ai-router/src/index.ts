/**
 * @forge/ai-router
 *
 * AI 라우팅 시스템 - 멀티모델 라우팅 + Nomic 임베딩 + Anthropic 제공자
 *
 * v2.1 최적화:
 * - Prompt Caching: 시스템 프롬프트 90% 비용 절감
 * - Message Batches API: 대량 처리 50% 할인
 * - nomic-embed-text: 무료 오픈소스 임베딩 (71% 정확도)
 *
 * @example
 * ```typescript
 * import { AIRouter, getAnthropicProvider } from '@forge/ai-router';
 *
 * const router = new AIRouter({ apiKey: 'your-key' });
 * const result = await router.process({
 *   task: '키워드 추출',
 *   context: '초음파 유량계 입찰 공고...'
 * });
 * ```
 */

// Types
export * from './types.js';

// Router
export { TaskClassifier, getTaskClassifier } from './router/task-classifier.js';
export { CostTracker, getCostTracker } from './router/cost-tracker.js';

// Providers
export { AnthropicProvider, getAnthropicProvider } from './providers/anthropic.js';

// Embedding
export { NomicEmbeddingService, getNomicEmbeddingService } from './embedding/nomic-service.js';
export { SimilarityFilter, getSimilarityFilter } from './embedding/similarity-filter.js';
export {
  PRODUCT_DEFINITIONS,
  PIPE_SIZE_PATTERNS,
  PREFERRED_ORGANIZATIONS,
  STRONG_KEYWORDS,
  WEAK_KEYWORDS,
} from './embedding/product-embeddings.js';

// ============================================================================
// AIRouter - 통합 인터페이스
// ============================================================================

import type {
  AIRouterConfig,
  AIRouterRequest,
  AIRouterResponse,
  CompletionRequest,
} from './types.js';
import { DEFAULT_ANTHROPIC_CONFIG, DEFAULT_CLASSIFIER_CONFIG } from './types.js';
import { TaskClassifier } from './router/task-classifier.js';
import { AnthropicProvider } from './providers/anthropic.js';
import { SimilarityFilter } from './embedding/similarity-filter.js';
import { PRODUCT_DEFINITIONS } from './embedding/product-embeddings.js';

export class AIRouter {
  private classifier: TaskClassifier;
  private provider: AnthropicProvider;
  private similarityFilter: SimilarityFilter;
  private initialized = false;

  constructor(config: Partial<AIRouterConfig> = {}) {
    this.classifier = new TaskClassifier(config.classifier ?? DEFAULT_CLASSIFIER_CONFIG);
    this.provider = new AnthropicProvider({
      ...DEFAULT_ANTHROPIC_CONFIG,
      ...config.anthropic,
    });
    this.similarityFilter = new SimilarityFilter();
  }

  /**
   * 초기화 (제품 임베딩 로드)
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    await this.similarityFilter.loadProductEmbeddings(PRODUCT_DEFINITIONS);
    this.initialized = true;
  }

  /**
   * AI 요청 처리
   */
  async process(request: AIRouterRequest): Promise<AIRouterResponse> {
    // 초기화 확인
    if (!this.initialized) {
      await this.initialize();
    }

    // 태스크 분류
    const classification = this.classifier.classify(request.task, request.context);

    // 모델 선택 (강제 지정 또는 자동)
    const model = request.forceModel ?? classification.model;

    // 유사 제품 검색 (컨텍스트 있을 경우)
    let similarProducts;
    if (request.context) {
      similarProducts = await this.similarityFilter.findSimilarProducts(
        request.task,
        request.context
      );
    }

    // 시스템 프롬프트 구성
    const systemPrompt = this.buildSystemPrompt(classification.type, similarProducts);

    // 완성 요청
    const completionRequest: CompletionRequest = {
      model,
      messages: [
        {
          role: 'user',
          content: request.context
            ? `${request.task}\n\n컨텍스트:\n${request.context}`
            : request.task,
        },
      ],
      systemPrompt,
      useCache: true,
    };

    // 배치 또는 즉시 처리
    let completion;
    if (request.useBatch) {
      await this.provider.addToBatch(completionRequest);
      // 배치 결과는 별도 처리 필요
      completion = await this.provider.complete(completionRequest);
    } else {
      completion = await this.provider.complete(completionRequest);
    }

    return {
      result: completion.content,
      classification,
      completion,
      similarProducts,
    };
  }

  /**
   * 사전 필터링 (처리 여부 결정)
   */
  async shouldProcess(
    bidTitle: string,
    bidDescription?: string
  ): Promise<{ shouldProcess: boolean; score: number; reason: string }> {
    if (!this.initialized) {
      await this.initialize();
    }

    const result = await this.similarityFilter.shouldProcess(bidTitle, bidDescription);
    return {
      shouldProcess: result.shouldProcess,
      score: result.bestScore,
      reason: result.reason,
    };
  }

  /**
   * 시스템 프롬프트 구성
   */
  private buildSystemPrompt(
    taskType: string,
    similarProducts?: Array<{ productName: string; score: number }>
  ): string {
    let prompt = `당신은 BIDFLOW 입찰 분석 AI입니다.
태스크 유형: ${taskType}

역할:
- 입찰 공고를 분석하고 적합한 제품을 매칭합니다
- 정확하고 간결한 응답을 제공합니다
- 한국어로 응답합니다`;

    if (similarProducts && similarProducts.length > 0) {
      const productList = similarProducts
        .slice(0, 3)
        .map((p) => `- ${p.productName} (유사도: ${(p.score * 100).toFixed(0)}%)`)
        .join('\n');

      prompt += `\n\n관련 제품:\n${productList}`;
    }

    return prompt;
  }
}

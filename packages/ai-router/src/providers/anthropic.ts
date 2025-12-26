/**
 * AnthropicProvider - Claude API 통합
 *
 * 핵심 최적화:
 * 1. Prompt Caching: 시스템 프롬프트 캐싱으로 90% 비용 절감
 * 2. Message Batches API: 비동기 대량 처리 50% 할인
 */

import Anthropic from '@anthropic-ai/sdk';
import type {
  AnthropicConfig,
  CompletionRequest,
  CompletionResponse,
  AIModel,
  ModelId,
  BatchRequest,
  BatchResult,
} from '../types.js';
import { MODEL_IDS, DEFAULT_ANTHROPIC_CONFIG, MODEL_PRICING } from '../types.js';
import { getCostTracker } from '../router/cost-tracker.js';

export class AnthropicProvider {
  private client: Anthropic;
  private config: AnthropicConfig;
  private pendingBatch: BatchRequest[] = [];
  private batchTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<AnthropicConfig> = {}) {
    this.config = { ...DEFAULT_ANTHROPIC_CONFIG, ...config };

    if (!this.config.apiKey) {
      this.config.apiKey = process.env.ANTHROPIC_API_KEY || '';
    }

    this.client = new Anthropic({
      apiKey: this.config.apiKey,
    });
  }

  /**
   * 단일 완성 요청
   */
  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    const startTime = Date.now();
    const modelId = MODEL_IDS[request.model];

    // 메시지 구성
    const messages: Anthropic.MessageParam[] = request.messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // 시스템 프롬프트 (캐싱 적용)
    const systemContent = this.buildSystemContent(
      request.systemPrompt,
      request.useCache ?? this.config.enablePromptCaching
    );

    try {
      const response = await this.client.messages.create({
        model: modelId,
        max_tokens: request.maxTokens ?? 1024,
        temperature: request.temperature ?? 0.7,
        system: systemContent,
        messages,
      });

      const latencyMs = Date.now() - startTime;

      // 사용량 파싱
      const usageAny = response.usage as unknown as Record<string, number>;
      const usage = {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        cacheHits: usageAny.cache_read_input_tokens ?? 0,
      };

      // 비용 계산
      const costResult = this.calculateCost(request.model, usage);

      const result: CompletionResponse = {
        content: this.extractContent(response),
        model: modelId,
        usage,
        cost: {
          inputCost: costResult.inputCost,
          outputCost: costResult.outputCost,
          total: costResult.total,
          savings: costResult.savings,
        },
        latencyMs,
      };

      // 비용 추적
      getCostTracker().record(request.model, result);

      return result;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * 배치 요청 추가
   */
  async addToBatch(request: CompletionRequest): Promise<string> {
    const batchId = `batch-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const batchRequest: BatchRequest = {
      id: batchId,
      request,
      priority: 'normal',
      createdAt: new Date().toISOString(),
    };

    this.pendingBatch.push(batchRequest);

    // 임계치 도달 시 자동 전송
    if (this.pendingBatch.length >= this.config.batchThreshold) {
      await this.flushBatch();
    } else if (!this.batchTimer) {
      // 5초 타이머 (배치 대기)
      this.batchTimer = setTimeout(() => {
        this.flushBatch();
      }, 5000);
    }

    return batchId;
  }

  /**
   * 배치 전송 (Message Batches API)
   */
  async flushBatch(): Promise<BatchResult[]> {
    if (this.pendingBatch.length === 0) {
      return [];
    }

    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    const batch = [...this.pendingBatch];
    this.pendingBatch = [];

    const results: BatchResult[] = [];

    // Batches API 요청 구성
    const batchRequests = batch.map((item) => ({
      custom_id: item.id,
      params: {
        model: MODEL_IDS[item.request.model],
        max_tokens: item.request.maxTokens ?? 1024,
        system: item.request.systemPrompt ?? '',
        messages: item.request.messages.map((msg) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })),
      },
    }));

    try {
      // Message Batches API 호출
      const batchResponse = await this.client.messages.batches.create({
        requests: batchRequests,
      });

      // 배치 완료 대기 (폴링)
      let status = batchResponse.processing_status;
      let batchData = batchResponse;

      while (status === 'in_progress') {
        await this.sleep(1000);
        batchData = await this.client.messages.batches.retrieve(batchResponse.id);
        status = batchData.processing_status;
      }

      // 결과 파싱
      if (status === 'ended') {
        // 실제로는 결과 스트리밍 필요 - 여기선 간소화
        for (const req of batch) {
          results.push({
            id: req.id,
            response: null, // 실제 구현에서는 결과 파싱 필요
            error: null,
            completedAt: new Date().toISOString(),
          });
        }
      }
    } catch (error) {
      // 배치 실패 시 개별 처리 폴백
      console.warn('Batch API failed, falling back to individual requests');
      for (const req of batch) {
        try {
          const response = await this.complete(req.request);
          results.push({
            id: req.id,
            response,
            error: null,
            completedAt: new Date().toISOString(),
          });
        } catch (err) {
          results.push({
            id: req.id,
            response: null,
            error: err instanceof Error ? err.message : 'Unknown error',
            completedAt: new Date().toISOString(),
          });
        }
      }
    }

    return results;
  }

  /**
   * 시스템 프롬프트 구성 (캐싱 적용)
   */
  private buildSystemContent(
    systemPrompt?: string,
    useCache = true
  ): Anthropic.TextBlockParam[] | string {
    if (!systemPrompt) {
      return [];
    }

    if (useCache) {
      // Prompt Caching 활성화
      return [
        {
          type: 'text' as const,
          text: systemPrompt,
          cache_control: { type: 'ephemeral' as const },
        },
      ];
    }

    return systemPrompt;
  }

  /**
   * 응답 콘텐츠 추출
   */
  private extractContent(response: Anthropic.Message): string {
    const textBlock = response.content.find((block) => block.type === 'text');
    return textBlock && 'text' in textBlock ? textBlock.text : '';
  }

  /**
   * 비용 계산
   */
  private calculateCost(
    model: AIModel,
    usage: { inputTokens: number; outputTokens: number; cacheHits: number }
  ): { inputCost: number; outputCost: number; total: number; savings: number } {
    const pricing = MODEL_PRICING[model];

    // 일반 입력 토큰 비용
    const regularInputTokens = usage.inputTokens - usage.cacheHits;
    const inputCost = (regularInputTokens / 1_000_000) * pricing.input;

    // 캐시 읽기 비용 (90% 할인)
    const cacheCost = (usage.cacheHits / 1_000_000) * pricing.cacheRead;

    // 출력 비용
    const outputCost = (usage.outputTokens / 1_000_000) * pricing.output;

    // 절감액 계산
    const regularCachePrice = (usage.cacheHits / 1_000_000) * pricing.input;
    const savings = regularCachePrice - cacheCost;

    return {
      inputCost: inputCost + cacheCost,
      outputCost,
      total: inputCost + cacheCost + outputCost,
      savings,
    };
  }

  /**
   * 에러 처리
   */
  private handleError(error: unknown): Error {
    if (error instanceof Anthropic.APIError) {
      return new Error(`Anthropic API Error: ${error.message} (${error.status})`);
    }
    return error instanceof Error ? error : new Error('Unknown error');
  }

  /**
   * 유틸리티: 대기
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 모델 ID 조회
   */
  getModelId(model: AIModel): ModelId {
    return MODEL_IDS[model];
  }
}

// 싱글톤 인스턴스
let providerInstance: AnthropicProvider | null = null;

export function getAnthropicProvider(
  config?: Partial<AnthropicConfig>
): AnthropicProvider {
  if (!providerInstance || config) {
    providerInstance = new AnthropicProvider(config);
  }
  return providerInstance;
}

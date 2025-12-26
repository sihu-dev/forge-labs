/**
 * CostTracker - 비용 추적 및 최적화 모니터링
 */

import type { AIModel, CostMetrics, CompletionResponse } from '../types.js';
import { MODEL_PRICING, BATCH_DISCOUNT } from '../types.js';

export class CostTracker {
  private metrics: CostMetrics;

  constructor() {
    this.metrics = this.initMetrics();
  }

  private initMetrics(): CostMetrics {
    return {
      totalRequests: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCost: 0,
      totalSavings: 0,
      byModel: {
        haiku: { requests: 0, inputTokens: 0, outputTokens: 0, cost: 0 },
        sonnet: { requests: 0, inputTokens: 0, outputTokens: 0, cost: 0 },
        opus: { requests: 0, inputTokens: 0, outputTokens: 0, cost: 0 },
      },
      cacheHitRate: 0,
      batchDiscountTotal: 0,
    };
  }

  /**
   * 비용 계산 (1M 토큰 기준)
   */
  calculateCost(
    model: AIModel,
    inputTokens: number,
    outputTokens: number,
    options?: {
      cacheHits?: number;
      isBatch?: boolean;
    }
  ): { cost: number; savings: number } {
    const pricing = MODEL_PRICING[model];
    const cacheHits = options?.cacheHits ?? 0;
    const isBatch = options?.isBatch ?? false;

    // 기본 비용 계산
    const regularInputTokens = inputTokens - cacheHits;
    let inputCost = (regularInputTokens / 1_000_000) * pricing.input;
    let outputCost = (outputTokens / 1_000_000) * pricing.output;

    // 캐시 히트 비용 (90% 할인)
    const cacheCost = (cacheHits / 1_000_000) * pricing.cacheRead;
    inputCost += cacheCost;

    // 캐시로 인한 절감액
    const cacheRegularCost = (cacheHits / 1_000_000) * pricing.input;
    let savings = cacheRegularCost - cacheCost;

    // 배치 할인 (50%)
    if (isBatch) {
      const preBatchTotal = inputCost + outputCost;
      inputCost *= BATCH_DISCOUNT;
      outputCost *= BATCH_DISCOUNT;
      savings += preBatchTotal - (inputCost + outputCost);
    }

    return {
      cost: inputCost + outputCost,
      savings,
    };
  }

  /**
   * 응답 기록
   */
  record(model: AIModel, response: CompletionResponse, isBatch = false): void {
    this.metrics.totalRequests++;
    this.metrics.totalInputTokens += response.usage.inputTokens;
    this.metrics.totalOutputTokens += response.usage.outputTokens;
    this.metrics.totalCost += response.cost.total;
    this.metrics.totalSavings += response.cost.savings ?? 0;

    // 모델별 통계
    const modelStats = this.metrics.byModel[model];
    modelStats.requests++;
    modelStats.inputTokens += response.usage.inputTokens;
    modelStats.outputTokens += response.usage.outputTokens;
    modelStats.cost += response.cost.total;

    // 캐시 히트율 업데이트
    if (response.usage.cacheHits) {
      const totalCacheableTokens = this.metrics.totalInputTokens;
      const totalCacheHits = response.usage.cacheHits;
      this.metrics.cacheHitRate = totalCacheHits / totalCacheableTokens;
    }

    // 배치 할인 누적
    if (isBatch) {
      this.metrics.batchDiscountTotal += response.cost.savings ?? 0;
    }
  }

  /**
   * 현재 메트릭 조회
   */
  getMetrics(): CostMetrics {
    return { ...this.metrics };
  }

  /**
   * 메트릭 리셋
   */
  reset(): void {
    this.metrics = this.initMetrics();
  }

  /**
   * 요약 리포트 생성
   */
  getSummary(): string {
    const m = this.metrics;
    const modelBreakdown = Object.entries(m.byModel)
      .filter(([, stats]) => stats.requests > 0)
      .map(
        ([model, stats]) =>
          `  ${model}: ${stats.requests}건, $${stats.cost.toFixed(4)}`
      )
      .join('\n');

    return `
=== AI Router 비용 리포트 ===
총 요청: ${m.totalRequests}건
총 비용: $${m.totalCost.toFixed(4)}
총 절감: $${m.totalSavings.toFixed(4)} (${((m.totalSavings / (m.totalCost + m.totalSavings)) * 100).toFixed(1)}%)
캐시 히트율: ${(m.cacheHitRate * 100).toFixed(1)}%
배치 할인: $${m.batchDiscountTotal.toFixed(4)}

모델별:
${modelBreakdown}
`.trim();
  }
}

// 글로벌 인스턴스
let trackerInstance: CostTracker | null = null;

export function getCostTracker(): CostTracker {
  if (!trackerInstance) {
    trackerInstance = new CostTracker();
  }
  return trackerInstance;
}

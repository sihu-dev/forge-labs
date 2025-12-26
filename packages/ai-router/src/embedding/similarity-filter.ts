/**
 * SimilarityFilter - 임베딩 기반 유사도 필터링
 *
 * 입찰 공고와 제품 간 유사도를 계산하여
 * 관련 없는 공고를 사전 필터링
 */

import type { SimilarityResult, ProductEmbedding } from '../types.js';
import { getNomicEmbeddingService } from './nomic-service.js';

// 유사도 임계값
const SIMILARITY_THRESHOLDS = {
  high: 0.8,
  medium: 0.6,
  low: 0.4,
} as const;

export class SimilarityFilter {
  private productEmbeddings: ProductEmbedding[] = [];
  private embeddingService = getNomicEmbeddingService();

  constructor() {}

  /**
   * 제품 임베딩 로드/설정
   */
  async loadProductEmbeddings(products: Omit<ProductEmbedding, 'embedding'>[]): Promise<void> {
    const texts = products.map(
      (p) => `${p.name} ${p.description} ${p.keywords.join(' ')}`
    );

    const embeddings = await this.embeddingService.embedBatch(texts);

    this.productEmbeddings = products.map((product, i) => ({
      ...product,
      embedding: embeddings[i].embedding,
    }));
  }

  /**
   * 입찰 공고와 제품 매칭
   */
  async findSimilarProducts(
    bidTitle: string,
    bidDescription?: string,
    topK = 5
  ): Promise<SimilarityResult[]> {
    if (this.productEmbeddings.length === 0) {
      return [];
    }

    // 입찰 공고 텍스트 구성
    const bidText = bidDescription
      ? `${bidTitle} ${bidDescription}`
      : bidTitle;

    // 쿼리 임베딩 생성
    const queryEmbedding = await this.embeddingService.embedQuery(bidText);

    // 모든 제품과 유사도 계산
    const similarities: Array<{
      product: ProductEmbedding;
      score: number;
    }> = [];

    for (const product of this.productEmbeddings) {
      const score = this.cosineSimilarity(queryEmbedding, product.embedding);
      similarities.push({ product, score });
    }

    // 점수 순 정렬
    similarities.sort((a, b) => b.score - a.score);

    // 상위 K개 반환
    return similarities.slice(0, topK).map(({ product, score }) => ({
      productId: product.id,
      productName: product.name,
      score,
      confidence: this.scoreToConfidence(score),
    }));
  }

  /**
   * 사전 필터링 (관련 없는 공고 제외)
   */
  async shouldProcess(
    bidTitle: string,
    bidDescription?: string,
    minScore = 0.3
  ): Promise<{ shouldProcess: boolean; bestScore: number; reason: string }> {
    const results = await this.findSimilarProducts(bidTitle, bidDescription, 1);

    if (results.length === 0) {
      return {
        shouldProcess: false,
        bestScore: 0,
        reason: '제품 임베딩 없음',
      };
    }

    const bestScore = results[0].score;

    if (bestScore < minScore) {
      return {
        shouldProcess: false,
        bestScore,
        reason: `유사도 ${(bestScore * 100).toFixed(1)}% < 임계값 ${minScore * 100}%`,
      };
    }

    return {
      shouldProcess: true,
      bestScore,
      reason: `유사도 ${(bestScore * 100).toFixed(1)}% - ${results[0].productName}`,
    };
  }

  /**
   * 코사인 유사도 계산
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vector dimensions must match');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }

  /**
   * 점수를 신뢰도 레벨로 변환
   */
  private scoreToConfidence(score: number): SimilarityResult['confidence'] {
    if (score >= SIMILARITY_THRESHOLDS.high) return 'high';
    if (score >= SIMILARITY_THRESHOLDS.medium) return 'medium';
    if (score >= SIMILARITY_THRESHOLDS.low) return 'low';
    return 'none';
  }

  /**
   * 로드된 제품 수
   */
  getProductCount(): number {
    return this.productEmbeddings.length;
  }

  /**
   * 제품 임베딩 초기화
   */
  clearProducts(): void {
    this.productEmbeddings = [];
  }
}

// 싱글톤 인스턴스
let filterInstance: SimilarityFilter | null = null;

export function getSimilarityFilter(): SimilarityFilter {
  if (!filterInstance) {
    filterInstance = new SimilarityFilter();
  }
  return filterInstance;
}

/**
 * NomicEmbeddingService - 무료 오픈소스 임베딩
 *
 * nomic-embed-text-v1.5 사용:
 * - 정확도 71% (OpenAI 62.3%보다 높음)
 * - 완전 무료 (로컬 실행)
 * - @xenova/transformers로 Node.js에서 실행
 */

import type { EmbeddingResult } from '../types.js';

// 타입 정의 (xenova/transformers)
interface Pipeline {
  (texts: string[], options?: { pooling: string; normalize: boolean }): Promise<{
    tolist: () => number[][];
  }>;
}

let pipeline: Pipeline | null = null;
let isLoading = false;
let loadPromise: Promise<void> | null = null;

/**
 * 모델 로드 (lazy initialization)
 */
async function loadModel(): Promise<void> {
  if (pipeline) return;
  if (loadPromise) return loadPromise;

  isLoading = true;
  loadPromise = (async () => {
    try {
      // 동적 import (ESM)
      const { pipeline: createPipeline } = await import('@xenova/transformers');

      pipeline = (await createPipeline(
        'feature-extraction',
        'nomic-ai/nomic-embed-text-v1.5',
        { quantized: true } // 경량 버전 사용
      )) as Pipeline;
    } finally {
      isLoading = false;
    }
  })();

  return loadPromise;
}

export class NomicEmbeddingService {
  private cache: Map<string, number[]> = new Map();
  private maxCacheSize = 10000;

  constructor() {
    // 사전 로드 시작
    loadModel().catch(console.error);
  }

  /**
   * 텍스트 임베딩 생성
   */
  async embed(text: string): Promise<EmbeddingResult> {
    // 캐시 확인
    const cached = this.cache.get(text);
    if (cached) {
      return {
        text,
        embedding: cached,
        model: 'nomic-embed-text-v1.5',
        timestamp: new Date().toISOString(),
      };
    }

    // 모델 로드 확인
    await loadModel();

    if (!pipeline) {
      throw new Error('Embedding model not loaded');
    }

    // 검색 태스크 프리픽스 추가 (nomic 권장)
    const prefixedText = `search_document: ${text}`;

    // 임베딩 생성
    const output = await pipeline([prefixedText], {
      pooling: 'mean',
      normalize: true,
    });

    const embedding = output.tolist()[0];

    // 캐시 저장
    this.addToCache(text, embedding);

    return {
      text,
      embedding,
      model: 'nomic-embed-text-v1.5',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 배치 임베딩 생성
   */
  async embedBatch(texts: string[]): Promise<EmbeddingResult[]> {
    await loadModel();

    if (!pipeline) {
      throw new Error('Embedding model not loaded');
    }

    // 캐시된 것과 새로운 것 분리
    const results: EmbeddingResult[] = [];
    const uncachedTexts: string[] = [];
    const uncachedIndices: number[] = [];

    for (let i = 0; i < texts.length; i++) {
      const cached = this.cache.get(texts[i]);
      if (cached) {
        results[i] = {
          text: texts[i],
          embedding: cached,
          model: 'nomic-embed-text-v1.5',
          timestamp: new Date().toISOString(),
        };
      } else {
        uncachedTexts.push(`search_document: ${texts[i]}`);
        uncachedIndices.push(i);
      }
    }

    // 새로운 텍스트들 임베딩
    if (uncachedTexts.length > 0) {
      const output = await pipeline(uncachedTexts, {
        pooling: 'mean',
        normalize: true,
      });

      const embeddings = output.tolist();

      for (let j = 0; j < uncachedIndices.length; j++) {
        const idx = uncachedIndices[j];
        const embedding = embeddings[j];

        results[idx] = {
          text: texts[idx],
          embedding,
          model: 'nomic-embed-text-v1.5',
          timestamp: new Date().toISOString(),
        };

        // 캐시 저장
        this.addToCache(texts[idx], embedding);
      }
    }

    return results;
  }

  /**
   * 쿼리 임베딩 (검색용)
   */
  async embedQuery(query: string): Promise<number[]> {
    await loadModel();

    if (!pipeline) {
      throw new Error('Embedding model not loaded');
    }

    // 검색 쿼리 프리픽스
    const prefixedQuery = `search_query: ${query}`;

    const output = await pipeline([prefixedQuery], {
      pooling: 'mean',
      normalize: true,
    });

    return output.tolist()[0];
  }

  /**
   * 캐시 관리
   */
  private addToCache(text: string, embedding: number[]): void {
    // 캐시 크기 제한
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(text, embedding);
  }

  /**
   * 캐시 초기화
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * 캐시 상태
   */
  getCacheStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
    };
  }

  /**
   * 모델 로드 상태
   */
  isReady(): boolean {
    return pipeline !== null && !isLoading;
  }
}

// 싱글톤 인스턴스
let serviceInstance: NomicEmbeddingService | null = null;

export function getNomicEmbeddingService(): NomicEmbeddingService {
  if (!serviceInstance) {
    serviceInstance = new NomicEmbeddingService();
  }
  return serviceInstance;
}

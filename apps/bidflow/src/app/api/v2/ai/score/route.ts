/**
 * @route /api/v2/ai/score
 * @description AI 입찰 적합도 점수 API v2
 *
 * v2 개선사항:
 * - @forge/ai-router 통합
 * - Nomic 임베딩 기반 사전 필터링
 * - Claude 멀티모델 라우팅 (Haiku/Sonnet/Opus)
 * - Prompt Caching으로 87% 비용 절감
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  AIRouter,
  getSimilarityFilter,
  getCostTracker,
  type SimilarityResult,
} from '@forge/ai-router';

// ============================================================================
// 요청 스키마
// ============================================================================

const ScoreRequestSchema = z.object({
  title: z.string().min(1, '제목이 필요합니다'),
  organization: z.string().optional(),
  description: z.string().optional(),
  useAI: z.boolean().default(true), // AI 분석 사용 여부
});

// ============================================================================
// 타입 정의
// ============================================================================

interface ScoreResponseV2 {
  score: number;
  confidence: number;
  confidenceLevel: 'high' | 'medium' | 'low' | 'none';
  recommendation: string;
  recommendationCode: 'BID' | 'REVIEW' | 'SKIP';
  matchedProduct: {
    id: string;
    name: string;
    similarity: number;
  } | null;
  similarProducts: SimilarityResult[];
  aiAnalysis?: {
    summary: string;
    keywords: string[];
    risks: string[];
  };
  costInfo: {
    model: string;
    inputTokens: number;
    outputTokens: number;
    cost: number;
    savings: number;
  };
}

// ============================================================================
// AI Router 인스턴스 (싱글톤)
// ============================================================================

let aiRouter: AIRouter | null = null;

async function getAIRouter(): Promise<AIRouter> {
  if (!aiRouter) {
    aiRouter = new AIRouter({
      anthropic: {
        apiKey: process.env.ANTHROPIC_API_KEY || '',
        enablePromptCaching: true,
        enableBatching: false,
        batchThreshold: 10,
        maxConcurrent: 5,
      },
    });
    await aiRouter.initialize();
  }
  return aiRouter;
}

// ============================================================================
// 점수 기반 추천 결정
// ============================================================================

function getRecommendation(score: number): {
  code: 'BID' | 'REVIEW' | 'SKIP';
  message: string;
} {
  if (score >= 70) {
    return { code: 'BID', message: '입찰 참여 강력 권장' };
  } else if (score >= 40) {
    return { code: 'REVIEW', message: '검토 후 결정 권장' };
  } else {
    return { code: 'SKIP', message: '건너뛰기 권장' };
  }
}

// ============================================================================
// API 핸들러
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    const body = await request.json();

    // 입력 검증
    const parseResult = ScoreRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: parseResult.error.errors[0]?.message || '잘못된 요청 형식',
        },
        { status: 400 }
      );
    }

    const { title, organization, description, useAI } = parseResult.data;
    const fullText = `${title} ${organization || ''} ${description || ''}`.trim();

    // AI Router 초기화
    const router = await getAIRouter();

    // 1. 사전 필터링 (임베딩 기반)
    const filterResult = await router.shouldProcess(title, description);

    if (!filterResult.shouldProcess) {
      // 유사도 낮으면 빠른 SKIP 반환
      return NextResponse.json({
        success: true,
        data: {
          score: Math.round(filterResult.score * 100),
          confidence: filterResult.score,
          confidenceLevel: 'none',
          recommendation: '건너뛰기 권장 - 관련 제품 없음',
          recommendationCode: 'SKIP',
          matchedProduct: null,
          similarProducts: [],
          costInfo: {
            model: 'embedding-only',
            inputTokens: 0,
            outputTokens: 0,
            cost: 0,
            savings: 0,
          },
        } satisfies ScoreResponseV2,
        meta: {
          filtered: true,
          reason: filterResult.reason,
          latencyMs: Date.now() - startTime,
        },
      });
    }

    // 2. 유사 제품 검색
    const similarityFilter = getSimilarityFilter();
    const similarProducts = await similarityFilter.findSimilarProducts(
      title,
      description,
      5
    );

    const bestMatch = similarProducts[0];
    const score = Math.round((bestMatch?.score ?? 0) * 100);
    const recommendation = getRecommendation(score);

    // 3. AI 분석 (선택적)
    let aiAnalysis: ScoreResponseV2['aiAnalysis'];
    let costInfo: ScoreResponseV2['costInfo'] = {
      model: 'embedding-only',
      inputTokens: 0,
      outputTokens: 0,
      cost: 0,
      savings: 0,
    };

    if (useAI && score >= 30) {
      try {
        const aiResult = await router.process({
          task: '입찰 공고 분석: 요약, 키워드, 리스크 추출',
          context: fullText,
        });

        // AI 응답 파싱
        const content = aiResult.result;
        aiAnalysis = {
          summary: extractSection(content, '요약') || content.slice(0, 200),
          keywords: extractKeywords(content),
          risks: extractRisks(content),
        };

        costInfo = {
          model: aiResult.completion.model,
          inputTokens: aiResult.completion.usage.inputTokens,
          outputTokens: aiResult.completion.usage.outputTokens,
          cost: aiResult.completion.cost.total,
          savings: aiResult.completion.cost.savings ?? 0,
        };
      } catch (aiError) {
        console.warn('[AI Score v2] AI 분석 실패, 임베딩 결과만 반환:', aiError);
      }
    }

    // 응답 생성
    const response: ScoreResponseV2 = {
      score,
      confidence: bestMatch?.score ?? 0,
      confidenceLevel: bestMatch?.confidence ?? 'none',
      recommendation: recommendation.message,
      recommendationCode: recommendation.code,
      matchedProduct: bestMatch
        ? {
            id: bestMatch.productId,
            name: bestMatch.productName,
            similarity: bestMatch.score,
          }
        : null,
      similarProducts,
      aiAnalysis,
      costInfo,
    };

    return NextResponse.json({
      success: true,
      data: response,
      meta: {
        filtered: false,
        latencyMs: Date.now() - startTime,
        costSummary: getCostTracker().getSummary(),
      },
    });
  } catch (error) {
    console.error('[AI Score v2] 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '서버 오류',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// 헬퍼 함수
// ============================================================================

function extractSection(text: string, section: string): string | null {
  const regex = new RegExp(`${section}[:\\s]*([^\\n]+)`, 'i');
  const match = text.match(regex);
  return match ? match[1].trim() : null;
}

function extractKeywords(text: string): string[] {
  const regex = /키워드[:\s]*([^\n]+)/i;
  const match = text.match(regex);
  if (match) {
    return match[1]
      .split(/[,،、]/)
      .map((k) => k.trim())
      .filter(Boolean);
  }
  return [];
}

function extractRisks(text: string): string[] {
  const regex = /리스크[:\s]*([^\n]+)/i;
  const match = text.match(regex);
  if (match) {
    return match[1]
      .split(/[,،、]/)
      .map((r) => r.trim())
      .filter(Boolean);
  }
  return [];
}

// ============================================================================
// OPTIONS (CORS Preflight)
// ============================================================================

export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

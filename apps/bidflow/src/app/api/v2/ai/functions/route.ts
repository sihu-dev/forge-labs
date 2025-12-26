/**
 * @route /api/v2/ai/functions
 * @description AI 스마트 함수 통합 API
 *
 * 지원 함수:
 * - AI_SUMMARY: 입찰 공고 요약
 * - AI_SCORE: 적합도 점수
 * - AI_MATCH: 제품 매칭
 * - AI_KEYWORDS: 키워드 추출
 * - AI_DEADLINE: 마감일 분석
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  AIRouter,
  getSimilarityFilter,
  getTaskClassifier,
} from '@forge/ai-router';

// ============================================================================
// 요청 스키마
// ============================================================================

const FunctionRequestSchema = z.object({
  function: z.enum(['AI_SUMMARY', 'AI_SCORE', 'AI_MATCH', 'AI_KEYWORDS', 'AI_DEADLINE']),
  title: z.string().min(1),
  organization: z.string().optional(),
  description: z.string().optional(),
  deadline: z.string().optional(), // ISO date for AI_DEADLINE
});

type AIFunctionType = z.infer<typeof FunctionRequestSchema>['function'];

// ============================================================================
// AI Router 인스턴스
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
// 함수별 프롬프트
// ============================================================================

const FUNCTION_PROMPTS: Record<AIFunctionType, string> = {
  AI_SUMMARY: `다음 입찰 공고를 2-3문장으로 간결하게 요약해주세요.
요약에는 발주기관, 주요 품목, 핵심 요구사항을 포함하세요.
한국어로 응답하세요.`,

  AI_SCORE: `다음 입찰 공고의 낙찰 가능성을 0-100 점수로 평가해주세요.
형식: "점수: [숫자]"
그 다음 줄에 간단한 이유를 설명하세요.`,

  AI_MATCH: `다음 입찰 공고에 가장 적합한 제품을 추천해주세요.
초음파 유량계 제품군: UR-1000, UR-1000PLUS, UR-2000, UR-3000, UR-4000, EM-100, LEVEL-1000, PIPE-SENSOR
형식: "추천 제품: [제품명]"
그 다음 줄에 추천 이유를 설명하세요.`,

  AI_KEYWORDS: `다음 입찰 공고에서 핵심 키워드 3-5개를 추출해주세요.
형식: "키워드: 키워드1, 키워드2, 키워드3"
기술 용어, 제품 특성, 발주 조건 관련 키워드를 우선하세요.`,

  AI_DEADLINE: `다음 입찰 공고의 마감일을 분석하고 권장 액션을 제안해주세요.
형식:
"D-[일수]: [상태]"
"권장 액션: [액션 내용]"`,
};

// ============================================================================
// API 핸들러
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    const body = await request.json();

    // 입력 검증
    const parseResult = FunctionRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: parseResult.error.errors[0]?.message || '잘못된 요청 형식',
        },
        { status: 400 }
      );
    }

    const { function: funcName, title, organization, description, deadline } = parseResult.data;
    const context = buildContext(title, organization, description, deadline);

    // 함수별 처리
    let result: unknown;

    switch (funcName) {
      case 'AI_SCORE':
      case 'AI_MATCH': {
        // 임베딩 기반 빠른 처리
        const similarityFilter = getSimilarityFilter();
        const products = await similarityFilter.findSimilarProducts(title, description, 3);

        if (funcName === 'AI_SCORE') {
          const score = Math.round((products[0]?.score ?? 0) * 100);
          result = {
            value: score,
            display: `${score}`,
            confidence: products[0]?.confidence ?? 'none',
          };
        } else {
          result = {
            value: products[0]?.productName ?? '매칭 없음',
            display: products[0]?.productName ?? '매칭 없음',
            allMatches: products.map((p) => ({
              name: p.productName,
              score: Math.round(p.score * 100),
            })),
          };
        }
        break;
      }

      case 'AI_SUMMARY':
      case 'AI_KEYWORDS':
      case 'AI_DEADLINE': {
        // Claude API 사용
        const router = await getAIRouter();
        const classifier = getTaskClassifier();

        // 태스크 분류
        const classification = classifier.classify(funcName, context);

        const aiResult = await router.process({
          task: FUNCTION_PROMPTS[funcName],
          context,
          forceModel: classification.model,
        });

        result = {
          value: aiResult.result.trim(),
          display: formatDisplay(funcName, aiResult.result),
          model: aiResult.completion.model,
          cost: aiResult.completion.cost.total,
        };
        break;
      }
    }

    return NextResponse.json({
      success: true,
      function: funcName,
      data: result,
      meta: {
        latencyMs: Date.now() - startTime,
      },
    });
  } catch (error) {
    console.error('[AI Functions] 오류:', error);
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

function buildContext(
  title: string,
  organization?: string,
  description?: string,
  deadline?: string
): string {
  let context = `제목: ${title}`;
  if (organization) context += `\n발주기관: ${organization}`;
  if (description) context += `\n설명: ${description}`;
  if (deadline) context += `\n마감일: ${deadline}`;
  return context;
}

function formatDisplay(funcName: AIFunctionType, rawResult: string): string {
  switch (funcName) {
    case 'AI_SUMMARY':
      return rawResult.slice(0, 200);
    case 'AI_KEYWORDS': {
      const match = rawResult.match(/키워드[:\s]*(.+)/i);
      return match ? match[1].trim() : rawResult.slice(0, 50);
    }
    case 'AI_DEADLINE': {
      const match = rawResult.match(/D-\d+[:\s]*[^\n]+/);
      return match ? match[0] : rawResult.slice(0, 50);
    }
    default:
      return rawResult.slice(0, 100);
  }
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

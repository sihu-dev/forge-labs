/**
 * AI Formula Generation API Endpoint
 * POST /api/v1/ai/formula
 *
 * Generates Excel formulas from natural language requests
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, type AuthenticatedRequest } from '@/lib/security/auth-middleware';
import { withRateLimit } from '@/lib/security/rate-limiter';
import { AIGateway } from '@/lib/ai/gateway';

export const dynamic = 'force-dynamic';
export const maxDuration = 15;

async function handlePost(request: AuthenticatedRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { request: userRequest, columns, sampleData } = body;

    // Validate input
    if (!userRequest || typeof userRequest !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: '수식 요청이 필요합니다',
          },
        },
        { status: 400 }
      );
    }

    if (userRequest.length > 500) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'REQUEST_TOO_LONG',
            message: '요청이 너무 깁니다 (최대 500자)',
          },
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(columns) || columns.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_COLUMNS',
            message: '컬럼 정보가 필요합니다',
          },
        },
        { status: 400 }
      );
    }

    // Initialize AI Gateway
    const gateway = new AIGateway();

    // Process request (simple complexity for formula generation)
    const response = await gateway.process({
      task: 'formula',
      data: {
        request: userRequest,
        columns,
        sampleData: sampleData || [],
      },
      complexity: 'simple', // Use Haiku for cost efficiency
      userId: request.userId,
    });

    // Return success response
    return NextResponse.json({
      success: true,
      data: response.result,
      meta: {
        provider: response.provider,
        cached: response.cached,
        cost: response.cost,
        duration: response.duration,
      },
    });
  } catch (error: any) {
    console.error('AI Formula error:', error);

    if (error.message?.includes('한도')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'QUOTA_EXCEEDED',
            message: error.message,
          },
        },
        { status: 429 }
      );
    }

    if (error.message?.includes('보안상') || error.message?.includes('허용되지 않는')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'SECURITY_ERROR',
            message: error.message,
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'AI_ERROR',
          message: 'AI 수식 생성 중 오류가 발생했습니다',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        },
      },
      { status: 500 }
    );
  }
}

export const POST = withRateLimit(
  withAuth(handlePost, {
    requireAuth: true,
    allowedRoles: ['admin', 'user'],
  }),
  {
    type: 'ai',
  }
);

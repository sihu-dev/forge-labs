/**
 * AI Analysis API Endpoint
 * POST /api/v1/ai/analyze
 *
 * Analyzes bid data and returns insights, recommendations, and trends
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, type AuthenticatedRequest } from '@/lib/security/auth-middleware';
import { withRateLimit } from '@/lib/security/rate-limiter';
import { AIGateway } from '@/lib/ai/gateway';

export const dynamic = 'force-dynamic';
export const maxDuration = 30; // 30 seconds timeout

async function handlePost(request: AuthenticatedRequest) {
  try {
    const body = await request.json();
    const { data, complexity = 'medium' } = body;

    // Validate input
    if (!data || !Array.isArray(data)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: '입찰 데이터 배열이 필요합니다',
          },
        },
        { status: 400 }
      );
    }

    if (data.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'EMPTY_DATA',
            message: '분석할 데이터가 없습니다',
          },
        },
        { status: 400 }
      );
    }

    // Initialize AI Gateway
    const gateway = new AIGateway();

    // Process request
    const response = await gateway.process({
      task: 'analyze',
      data,
      complexity: complexity as any,
      userId: request.user.id,
      metadata: {
        sessionId: request.headers.get('x-session-id') || undefined,
      },
    });

    // Return success response
    return NextResponse.json({
      success: true,
      data: response.result,
      meta: {
        provider: response.provider,
        cached: response.cached,
        cost: response.cost,
        tokens: response.tokens,
        duration: response.duration,
      },
    });
  } catch (error: any) {
    console.error('AI Analysis error:', error);

    // Handle quota exceeded
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

    // Handle validation errors
    if (error.message?.includes('보안상') || error.message?.includes('너무 큽니다')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message,
          },
        },
        { status: 400 }
      );
    }

    // Generic error
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'AI_ERROR',
          message: 'AI 분석 중 오류가 발생했습니다',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        },
      },
      { status: 500 }
    );
  }
}

// Export with middleware
export const POST = withRateLimit(
  withAuth(handlePost, {
    requireAuth: true,
    allowedRoles: ['admin', 'user'],
  }),
  {
    type: 'ai',
    requests: 10, // 10 requests per minute
  }
);

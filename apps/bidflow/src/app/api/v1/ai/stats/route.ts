/**
 * AI Usage Statistics API Endpoint
 * GET /api/v1/ai/stats
 *
 * Returns user's AI usage statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, type AuthenticatedRequest } from '@/lib/security/auth-middleware';
import { AIGateway } from '@/lib/ai/gateway';

export const dynamic = 'force-dynamic';

async function handleGet(request: AuthenticatedRequest) {
  try {
    const gateway = new AIGateway();
    const stats = await gateway.getUsageStats(request.user.id);

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('AI Stats error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'STATS_ERROR',
          message: '통계 조회 중 오류가 발생했습니다',
        },
      },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGet, {
  requireAuth: true,
  allowedRoles: ['admin', 'user', 'viewer'],
});

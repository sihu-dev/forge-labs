/**
 * AI Bid Extraction API Endpoint
 * POST /api/v1/ai/extract-bid
 *
 * Extracts structured bid information from HTML/text
 * Used by Chrome Extension
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, type AuthenticatedRequest } from '@/lib/security/auth-middleware';
import { withRateLimit } from '@/lib/security/rate-limiter';
import { AIGateway } from '@/lib/ai/gateway';

export const dynamic = 'force-dynamic';
export const maxDuration = 20;

// Allowed domains for bid extraction
const ALLOWED_DOMAINS = [
  'g2b.go.kr',
  'ungm.org',
  'dgmarket.com',
  'ted.europa.eu',
  'sam.gov',
];

/**
 * Validate URL is from allowed bid source
 */
function isValidBidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);

    // Must be HTTPS
    if (parsed.protocol !== 'https:') {
      return false;
    }

    // Must be from allowed domain
    return ALLOWED_DOMAINS.some((domain) =>
      parsed.hostname.endsWith(domain)
    );
  } catch {
    return false;
  }
}

async function handlePost(request: AuthenticatedRequest) {
  try {
    const body = await request.json();
    const { url, html, text } = body;

    // Validate URL
    if (!url || !isValidBidUrl(url)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_URL',
            message: '허용되지 않은 URL입니다. 입찰 플랫폼 URL만 지원됩니다.',
            allowedDomains: ALLOWED_DOMAINS,
          },
        },
        { status: 400 }
      );
    }

    // Validate content
    if (!html && !text) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_CONTENT',
            message: 'HTML 또는 텍스트 내용이 필요합니다',
          },
        },
        { status: 400 }
      );
    }

    const content = html || text;

    if (content.length > 50000) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CONTENT_TOO_LARGE',
            message: '콘텐츠가 너무 큽니다 (최대 50KB)',
          },
        },
        { status: 400 }
      );
    }

    // Initialize AI Gateway
    const gateway = new AIGateway();

    // Process request
    const response = await gateway.process({
      task: 'extract',
      data: {
        url,
        html,
        text,
      },
      complexity: 'medium', // Use Sonnet for better extraction accuracy
      userId: request.user.id,
    });

    // Validate extracted data
    const { result } = response;

    if (!result.title || !result.organization) {
      console.warn('Incomplete bid extraction:', result);
    }

    // Return success response with extracted bid info
    return NextResponse.json({
      success: true,
      data: {
        ...result,
        source: 'chrome_extension',
        sourceUrl: url,
        extractedAt: new Date().toISOString(),
      },
      meta: {
        provider: response.provider,
        cached: response.cached,
        cost: response.cost,
        duration: response.duration,
      },
    });
  } catch (error: any) {
    console.error('AI Bid Extraction error:', error);

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

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'EXTRACTION_ERROR',
          message: '입찰 정보 추출 중 오류가 발생했습니다',
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
    requests: 15,
  }
);

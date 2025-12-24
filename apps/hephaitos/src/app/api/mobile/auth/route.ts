/**
 * Mobile Authentication API
 * Session management for mobile Claude app
 *
 * POST /api/mobile/auth/session - Create new session
 * POST /api/mobile/auth/refresh - Refresh session token
 * DELETE /api/mobile/auth/session - Delete session
 * GET /api/mobile/auth/pairing - Generate pairing code (QR code)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  createSession,
  validateToken,
  refreshToken,
  deleteSession,
  generatePairingCode,
  isValidPairingCode,
} from '@/lib/mobile/session-manager';

// ============================================
// Validation Schemas
// ============================================

const CreateSessionSchema = z.object({
  deviceId: z.string().min(1).max(100),
  deviceName: z.string().min(1).max(100),
  pairingCode: z.string().length(6).optional(),
  metadata: z
    .object({
      userAgent: z.string().optional(),
      platform: z.string().optional(),
      appVersion: z.string().optional(),
    })
    .optional(),
});

const RefreshTokenSchema = z.object({
  token: z.string().min(1),
});

const DeleteSessionSchema = z.object({
  token: z.string().min(1),
});

// ============================================
// Temporary pairing code store
// In production, use Redis with TTL
// ============================================

const pairingCodes = new Map<string, { code: string; createdAt: number }>();
const PAIRING_CODE_TTL = 5 * 60 * 1000; // 5 minutes

// ============================================
// POST /api/mobile/auth/session
// Create new session
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Check which operation
    const { pathname } = new URL(request.url);

    if (pathname.endsWith('/refresh')) {
      return handleRefresh(body);
    }

    // Default: create session
    const validationResult = CreateSessionSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request',
          details: validationResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { deviceId, deviceName, pairingCode, metadata } = validationResult.data;

    // If pairing code is provided, validate it
    if (pairingCode) {
      const storedPairing = pairingCodes.get(deviceId);
      if (!storedPairing) {
        return NextResponse.json(
          {
            success: false,
            error: 'Pairing code not found or expired',
          },
          { status: 400 }
        );
      }

      if (storedPairing.code !== pairingCode) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid pairing code',
          },
          { status: 400 }
        );
      }

      // Check if pairing code is expired
      if (Date.now() - storedPairing.createdAt > PAIRING_CODE_TTL) {
        pairingCodes.delete(deviceId);
        return NextResponse.json(
          {
            success: false,
            error: 'Pairing code expired',
          },
          { status: 400 }
        );
      }

      // Valid pairing code - remove it
      pairingCodes.delete(deviceId);
    }

    // Create session
    const sessionToken = createSession({
      deviceId,
      deviceName,
      metadata,
    });

    return NextResponse.json({
      success: true,
      data: sessionToken,
    });
  } catch (error) {
    console.error('[Mobile Auth API] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/mobile/auth/refresh
// Refresh session token
// ============================================

async function handleRefresh(body: any) {
  const validationResult = RefreshTokenSchema.safeParse(body);

  if (!validationResult.success) {
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid request',
        details: validationResult.error.flatten(),
      },
      { status: 400 }
    );
  }

  const { token } = validationResult.data;

  const newToken = refreshToken(token);

  if (!newToken) {
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid or expired token',
      },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    data: newToken,
  });
}

// ============================================
// DELETE /api/mobile/auth/session
// Delete session
// ============================================

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = DeleteSessionSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request',
          details: validationResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { token } = validationResult.data;

    // Validate token to get session
    const session = validateToken(token);
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid or expired token',
        },
        { status: 401 }
      );
    }

    // Delete session
    const deleted = deleteSession(session.sessionId);

    if (!deleted) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to delete session',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Session deleted successfully',
    });
  } catch (error) {
    console.error('[Mobile Auth API] Delete error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// ============================================
// GET /api/mobile/auth/pairing
// Generate pairing code for QR code
// ============================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('deviceId');

    if (!deviceId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing deviceId parameter',
        },
        { status: 400 }
      );
    }

    // Generate pairing code
    const code = generatePairingCode();

    // Store pairing code
    pairingCodes.set(deviceId, {
      code,
      createdAt: Date.now(),
    });

    // Clean up expired pairing codes
    cleanupExpiredPairingCodes();

    return NextResponse.json({
      success: true,
      data: {
        pairingCode: code,
        expiresIn: PAIRING_CODE_TTL / 1000, // seconds
        deviceId,
      },
    });
  } catch (error) {
    console.error('[Mobile Auth API] Pairing error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// ============================================
// OPTIONS - CORS preflight
// ============================================

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// ============================================
// Utilities
// ============================================

/**
 * Clean up expired pairing codes
 */
function cleanupExpiredPairingCodes() {
  const now = Date.now();

  for (const [deviceId, pairing] of pairingCodes.entries()) {
    if (now - pairing.createdAt > PAIRING_CODE_TTL) {
      pairingCodes.delete(deviceId);
    }
  }
}

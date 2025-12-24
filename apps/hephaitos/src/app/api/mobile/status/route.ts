/**
 * Mobile Status API
 * Lightweight status endpoint optimized for mobile Claude app
 *
 * GET /api/mobile/status
 * Returns: Current context, progress, next task, connection status
 *
 * Response size: < 2KB
 * Cache: 5s TTL
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

// ============================================
// Types
// ============================================

interface MobileStatusResponse {
  success: boolean;
  data: {
    // Current context
    project: 'HEPHAITOS' | 'BIDFLOW';
    mode: 'development' | 'production' | 'demo';

    // Progress
    completion: number; // 0-100
    currentTask: string;
    currentTaskProgress: number; // 0-100

    // Next action
    nextTask: string;
    nextTaskPriority: 'P0' | 'P1' | 'P2' | 'P3';

    // Connection
    connectionStatus: 'connected' | 'disconnected' | 'error';
    lastActivity: string; // ISO timestamp

    // Quick stats
    stats: {
      todayCommits: number;
      tasksCompleted: number;
      tasksRemaining: number;
      uptime: number; // seconds
    };

    // Available shortcuts (for quick reference)
    shortcuts: {
      key: string;
      description: string;
    }[];
  };
}

// ============================================
// In-memory cache (5 second TTL)
// ============================================

let statusCache: {
  data: MobileStatusResponse['data'] | null;
  timestamp: number;
} = {
  data: null,
  timestamp: 0,
};

const CACHE_TTL = 5000; // 5 seconds

// ============================================
// GET /api/mobile/status
// ============================================

export async function GET(request: NextRequest) {
  try {
    const now = Date.now();

    // Check cache
    if (statusCache.data && now - statusCache.timestamp < CACHE_TTL) {
      return NextResponse.json({
        success: true,
        data: statusCache.data,
        cached: true,
      }, {
        headers: {
          'Cache-Control': 'public, max-age=5, s-maxage=5',
        },
      });
    }

    // Detect device type from User-Agent
    const headersList = await headers();
    const userAgent = headersList.get('user-agent') || '';
    const isMobile = /mobile|android|iphone|ipad/i.test(userAgent);

    // Get current project (from query param or default to HEPHAITOS)
    const { searchParams } = new URL(request.url);
    const projectParam = searchParams.get('project');
    const project = (projectParam?.toUpperCase() === 'BIDFLOW' ? 'BIDFLOW' : 'HEPHAITOS') as 'HEPHAITOS' | 'BIDFLOW';

    // Build status data
    const statusData: MobileStatusResponse['data'] = {
      project,
      mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',

      // Progress (hardcoded for now - in production, query from project management system)
      completion: project === 'HEPHAITOS' ? 70 : 100,
      currentTask: project === 'HEPHAITOS'
        ? 'Mobile app integration - Phase 2'
        : 'Dashboard API integration complete',
      currentTaskProgress: project === 'HEPHAITOS' ? 60 : 100,

      // Next task
      nextTask: project === 'HEPHAITOS'
        ? 'WebSocket streaming endpoint'
        : 'PR review and merge',
      nextTaskPriority: project === 'HEPHAITOS' ? 'P0' : 'P1',

      // Connection
      connectionStatus: 'connected',
      lastActivity: new Date().toISOString(),

      // Stats
      stats: {
        todayCommits: 5, // In production, query from git log
        tasksCompleted: 9,
        tasksRemaining: project === 'HEPHAITOS' ? 7 : 0,
        uptime: process.uptime(),
      },

      // Shortcuts (mobile-optimized list)
      shortcuts: [
        { key: 'ㅅ (S)', description: 'Status check' },
        { key: 'ㅎ (H)', description: 'HEPHAITOS mode' },
        { key: 'ㅂ (B)', description: 'BIDFLOW mode' },
        { key: 'ㄱ (G)', description: 'Next task (ㄱㄱㄱ = 3 tasks)' },
        { key: 'ㅋ (K)', description: 'Commit & push' },
        { key: 'ㅊ (C)', description: 'Code review' },
        { key: 'ㅌ (T)', description: 'Run tests' },
        { key: 'ㅍ (P)', description: 'Deploy' },
      ],
    };

    // Update cache
    statusCache = {
      data: statusData,
      timestamp: now,
    };

    return NextResponse.json({
      success: true,
      data: statusData,
      cached: false,
      mobile: isMobile,
    }, {
      headers: {
        'Cache-Control': 'public, max-age=5, s-maxage=5',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('[Mobile Status API] Error:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    }, {
      status: 500,
      headers: {
        'Cache-Control': 'no-store',
      },
    });
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, User-Agent',
    },
  });
}

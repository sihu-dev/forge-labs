/**
 * Health Check Endpoint for BIDFLOW
 * Monitors: Supabase, System
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    database: 'healthy' | 'unhealthy' | 'unknown';
    system: 'healthy' | 'unhealthy' | 'unknown';
  };
  version?: string;
  uptime?: number;
}

export async function GET() {
  const startTime = Date.now();

  const checks: HealthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {
      database: 'unknown',
      system: 'healthy',
    },
    version: process.env.VERCEL_GIT_COMMIT_SHA || 'development',
    uptime: process.uptime ? Math.floor(process.uptime()) : undefined,
  };

  // Check Supabase Database
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('bids')
      .select('id')
      .limit(1);

    checks.checks.database = error ? 'unhealthy' : 'healthy';
  } catch (error) {
    console.error('Health check - Database error:', error);
    checks.checks.database = 'unhealthy';
  }

  // Determine overall status
  const allChecks = Object.values(checks.checks);
  const hasUnhealthy = allChecks.includes('unhealthy');
  const hasUnknown = allChecks.includes('unknown');

  if (hasUnhealthy) {
    checks.status = 'unhealthy';
  } else if (hasUnknown) {
    checks.status = 'degraded';
  } else {
    checks.status = 'healthy';
  }

  const responseTime = Date.now() - startTime;

  // Return appropriate HTTP status
  const httpStatus = checks.status === 'healthy' ? 200 : 503;

  return NextResponse.json(
    {
      ...checks,
      responseTime: `${responseTime}ms`,
    },
    {
      status: httpStatus,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json',
      },
    }
  );
}

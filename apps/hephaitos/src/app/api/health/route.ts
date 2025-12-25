/**
 * Health Check Endpoint for HEPHAITOS
 * Monitors: Supabase, Redis, System
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Redis } from '@upstash/redis';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    database: 'healthy' | 'unhealthy' | 'unknown';
    redis: 'healthy' | 'unhealthy' | 'unknown';
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
      redis: 'unknown',
      system: 'healthy',
    },
    version: process.env.VERCEL_GIT_COMMIT_SHA || 'development',
    uptime: process.uptime ? Math.floor(process.uptime()) : undefined,
  };

  // Check Supabase Database
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('strategies')
      .select('id')
      .limit(1);

    checks.checks.database = error ? 'unhealthy' : 'healthy';
  } catch (error) {
    console.error('Health check - Database error:', error);
    checks.checks.database = 'unhealthy';
  }

  // Check Redis
  try {
    if (
      process.env.UPSTASH_REDIS_REST_URL &&
      process.env.UPSTASH_REDIS_REST_TOKEN
    ) {
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });

      const response = await redis.ping();
      checks.checks.redis = response === 'PONG' ? 'healthy' : 'unhealthy';
    } else {
      // Redis is optional in development
      checks.checks.redis = 'healthy';
    }
  } catch (error) {
    console.error('Health check - Redis error:', error);
    checks.checks.redis = 'unhealthy';
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

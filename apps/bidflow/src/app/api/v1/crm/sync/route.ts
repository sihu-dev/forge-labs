/**
 * @route POST /api/v1/crm/sync
 * @description CRM 동기화 API
 *
 * Supabase leads → External CRM (Attio/HubSpot)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createCRMSyncService } from '@/lib/services/crm-sync-service';

// ============================================================================
// 요청 스키마
// ============================================================================

const SyncRequestSchema = z.object({
  // 동기화할 리드 IDs (없으면 모든 미동기화 리드)
  leadIds: z.array(z.string().uuid()).optional(),

  // CRM 프로바이더
  provider: z.enum(['attio', 'hubspot']).default('attio'),

  // 자동 동기화 (최근 N시간 이내 리드)
  autoSync: z.boolean().default(false),
  sinceHours: z.number().min(1).max(168).default(24), // 1시간 ~ 7일
});

// ============================================================================
// POST Handler - 동기화 실행
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    // 요청 검증
    const body = await request.json();
    const validationResult = SyncRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const params = validationResult.data;

    // CRM Sync Service 생성
    const crmService = createCRMSyncService(params.provider);
    await crmService.initialize();

    let result;

    if (params.autoSync) {
      // 자동 동기화: 최근 N시간 이내 리드
      const since = new Date(Date.now() - params.sinceHours * 60 * 60 * 1000);
      result = await crmService.autoSync(user.id, since);
    } else if (params.leadIds && params.leadIds.length > 0) {
      // 수동 동기화: 특정 리드들
      result = await crmService.syncBatch(params.leadIds, user.id);
    } else {
      // 수동 동기화: 모든 미동기화 리드
      result = await crmService.autoSync(user.id);
    }

    return NextResponse.json({
      success: result.success,
      data: {
        synced: result.synced,
        failed: result.failed,
        skipped: result.skipped,
        total: result.synced + result.failed + result.skipped,
        errors: result.errors,
      },
    });
  } catch (error) {
    console.error('CRM sync error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '동기화 중 오류가 발생했습니다',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET Handler - 동기화 상태 조회
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const provider = (searchParams.get('provider') || 'attio') as 'attio' | 'hubspot';

    // CRM Sync Service 생성
    const crmService = createCRMSyncService(provider);
    await crmService.initialize();

    // 동기화 상태 조회
    const status = await crmService.getSyncStatus(user.id);

    // Health check
    const healthy = await crmService.healthCheck();

    return NextResponse.json({
      success: true,
      data: {
        provider,
        healthy,
        ...status,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get sync status',
      },
      { status: 500 }
    );
  }
}

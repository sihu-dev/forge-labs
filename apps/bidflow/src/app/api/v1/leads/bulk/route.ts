/**
 * @route POST /api/v1/leads/bulk
 * @description Bulk Lead Operations API
 *
 * 대량 리드 작업 (상태 변경, CRM 동기화, 시퀀스 추가, 삭제)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createCRMSyncService } from '@/lib/services/crm-sync-service';
// Type assertions used below due to Supabase client type inference issues

// ============================================================================
// 요청 스키마
// ============================================================================

const BulkActionSchema = z.object({
  // 대상 리드 IDs
  leadIds: z.array(z.string().uuid()).min(1),

  // 작업 유형
  action: z.enum([
    'update_status',
    'crm_sync',
    'add_to_sequence',
    'delete',
    'enrich',
  ]),

  // 작업별 추가 파라미터
  params: z
    .object({
      status: z
        .enum(['new', 'contacted', 'qualified', 'converted', 'lost'])
        .optional(),
      sequenceId: z.string().optional(),
      provider: z.enum(['attio', 'hubspot']).optional(),
    })
    .optional(),
});

// ============================================================================
// POST Handler - 대량 작업 실행
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
    const validationResult = BulkActionSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const { leadIds, action, params } = validationResult.data;

    // 결과 추적
    const result = {
      success: true,
      processed: 0,
      failed: 0,
      errors: [] as Array<{ leadId: string; error: string }>,
    };

    // 작업 실행
    switch (action) {
      case 'update_status': {
        if (!params?.status) {
          return NextResponse.json(
            { error: 'status parameter is required' },
            { status: 400 }
          );
        }

        for (const leadId of leadIds) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error } = await (supabase.from('leads') as any)
              .update({
                status: params.status,
                updated_at: new Date().toISOString(),
              })
              .eq('id', leadId)
              .eq('user_id', user.id);

            if (error) throw error;

            // 활동 내역 추가
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabase.from('lead_activities') as any).insert({
              lead_id: leadId,
              type: 'status_changed',
              description: `상태 변경: ${params.status}`,
              metadata: { new_status: params.status, bulk: true },
            });

            result.processed++;
          } catch (error) {
            result.failed++;
            result.errors.push({
              leadId,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }
        break;
      }

      case 'crm_sync': {
        const provider = params?.provider || 'attio';

        try {
          const crmService = createCRMSyncService(provider);
          await crmService.initialize();

          const syncResult = await crmService.syncBatch(leadIds, user.id);

          result.processed = syncResult.synced;
          result.failed = syncResult.failed;
          result.errors = syncResult.errors;
        } catch (error) {
          result.success = false;
          result.failed = leadIds.length;
          result.errors.push({
            leadId: 'batch',
            error: error instanceof Error ? error.message : 'CRM sync failed',
          });
        }
        break;
      }

      case 'add_to_sequence': {
        if (!params?.sequenceId) {
          return NextResponse.json(
            { error: 'sequenceId parameter is required' },
            { status: 400 }
          );
        }

        for (const leadId of leadIds) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error } = await (supabase.from('leads') as any)
              .update({
                sequence_id: params.sequenceId,
                updated_at: new Date().toISOString(),
              })
              .eq('id', leadId)
              .eq('user_id', user.id);

            if (error) throw error;

            // 활동 내역 추가
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabase.from('lead_activities') as any).insert({
              lead_id: leadId,
              type: 'note_added',
              description: `시퀀스에 추가됨: ${params.sequenceId}`,
              metadata: { sequence_id: params.sequenceId },
            });

            result.processed++;
          } catch (error) {
            result.failed++;
            result.errors.push({
              leadId,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }
        break;
      }

      case 'enrich': {
        // 리드 재강화 (Apollo + Persana)
        for (const leadId of leadIds) {
          try {
            // 리드 정보 조회
            const { data: leadData } = await supabase
              .from('leads')
              .select('email, organization')
              .eq('id', leadId)
              .eq('user_id', user.id)
              .single();

            const lead = leadData as { email: string; organization: string | null } | null;

            if (!lead) {
              throw new Error('Lead not found');
            }

            // Enrich API 호출
            const enrichResponse = await fetch(
              `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/api/v1/leads/enrich`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Cookie: `sb-access-token=${
                    (await supabase.auth.getSession()).data.session?.access_token
                  }`,
                },
                body: JSON.stringify({
                  contacts: [
                    {
                      email: lead.email,
                      organization: lead.organization,
                    },
                  ],
                }),
              }
            );

            if (!enrichResponse.ok) {
              throw new Error('Enrichment failed');
            }

            result.processed++;
          } catch (error) {
            result.failed++;
            result.errors.push({
              leadId,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }
        break;
      }

      case 'delete': {
        for (const leadId of leadIds) {
          try {
            const { error } = await supabase
              .from('leads')
              .delete()
              .eq('id', leadId)
              .eq('user_id', user.id);

            if (error) throw error;

            result.processed++;
          } catch (error) {
            result.failed++;
            result.errors.push({
              leadId,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }
        break;
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    result.success = result.failed === 0;

    return NextResponse.json({
      success: result.success,
      data: result,
    });
  } catch (error) {
    console.error('Bulk action error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Bulk action failed',
      },
      { status: 500 }
    );
  }
}

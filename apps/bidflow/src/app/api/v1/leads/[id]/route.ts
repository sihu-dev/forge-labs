// @ts-nocheck
/**
 * @route GET/PATCH/DELETE /api/v1/leads/[id]
 * @description Individual Lead Management API
 *
 * 개별 리드 조회, 수정, 삭제
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

// ============================================================================
// 요청 스키마
// ============================================================================

const UpdateLeadSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  title: z.string().max(100).optional(),
  phone: z.string().max(50).optional(),
  organization: z.string().max(200).optional(),
  department: z.string().max(100).optional(),
  score: z.number().min(0).max(100).optional(),
  status: z
    .enum(['new', 'contacted', 'qualified', 'converted', 'lost'])
    .optional(),
  verified: z.boolean().optional(),
  notes: z.string().optional(),
});

// ============================================================================
// GET Handler - 개별 리드 조회
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    const { data: lead, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !lead) {
      return NextResponse.json({ error: '리드를 찾을 수 없습니다' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: lead,
    });
  } catch (error) {
    console.error('Lead get error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get lead',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH Handler - 리드 정보 수정
// ============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    // 요청 검증
    const body = await request.json();
    const validationResult = UpdateLeadSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const updates = validationResult.data;

    // 기존 리드 확인
    const { data: existingLead, error: fetchError } = await supabase
      .from('leads')
      .select('id, status')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingLead) {
      return NextResponse.json({ error: '리드를 찾을 수 없습니다' }, { status: 404 });
    }

    // 리드 업데이트
    const { data: updatedLead, error: updateError } = await supabase
      .from('leads')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // 상태 변경 시 활동 내역 추가
    if (updates.status && updates.status !== existingLead.status) {
      await supabase.from('lead_activities').insert({
        lead_id: params.id,
        type: 'status_changed',
        description: `상태 변경: ${existingLead.status} → ${updates.status}`,
        metadata: {
          old_status: existingLead.status,
          new_status: updates.status,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: updatedLead,
    });
  } catch (error) {
    console.error('Lead update error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update lead',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE Handler - 리드 삭제
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    // 리드 삭제
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: '리드가 삭제되었습니다',
    });
  } catch (error) {
    console.error('Lead delete error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete lead',
      },
      { status: 500 }
    );
  }
}

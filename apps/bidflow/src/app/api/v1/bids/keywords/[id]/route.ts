/**
 * @route PATCH/DELETE /api/v1/bids/keywords/[id]
 * @description Individual Keyword Management
 *
 * 개별 키워드 수정, 삭제
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

// ============================================================================
// 요청 스키마
// ============================================================================

const UpdateKeywordSchema = z.object({
  keyword: z.string().min(1).max(100).optional(),
  category: z.enum(['product', 'service', 'industry', 'location']).optional(),
  priority: z.number().min(1).max(10).optional(),
  active: z.boolean().optional(),
});

// ============================================================================
// PATCH Handler - 키워드 수정
// ============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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
    const validationResult = UpdateKeywordSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const updates = validationResult.data;

    // 키워드 업데이트
    const { data: updatedKeyword, error: updateError } = await supabase
      .from('bid_keywords')
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

    return NextResponse.json({
      success: true,
      data: updatedKeyword,
    });
  } catch (error) {
    console.error('Keyword update error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update keyword',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE Handler - 키워드 삭제
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    // 키워드 삭제
    const { error } = await supabase
      .from('bid_keywords')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: '키워드가 삭제되었습니다',
    });
  } catch (error) {
    console.error('Keyword delete error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete keyword',
      },
      { status: 500 }
    );
  }
}

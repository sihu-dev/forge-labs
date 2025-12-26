// @ts-nocheck
/**
 * @route GET/POST /api/v1/bids/keywords
 * @description Keywords Management API
 *
 * 키워드 관리 (목록 조회, 추가)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

// ============================================================================
// 요청 스키마
// ============================================================================

const CreateKeywordSchema = z.object({
  keyword: z.string().min(1).max(100),
  category: z.enum(['product', 'service', 'industry', 'location']).optional(),
  priority: z.number().min(1).max(10).default(5),
});

// ============================================================================
// GET Handler - 키워드 목록 조회
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

    const { data: keywords, error } = await supabase
      .from('bid_keywords')
      .select('*')
      .eq('user_id', user.id)
      .order('priority', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: keywords,
    });
  } catch (error) {
    console.error('Keywords get error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get keywords',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST Handler - 키워드 추가
// ============================================================================

export async function POST(request: NextRequest) {
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
    const validationResult = CreateKeywordSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const { keyword, category, priority } = validationResult.data;

    // 중복 확인
    const { data: existing } = await supabase
      .from('bid_keywords')
      .select('id')
      .eq('user_id', user.id)
      .eq('keyword', keyword)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: '이미 존재하는 키워드입니다' },
        { status: 400 }
      );
    }

    // 키워드 생성
    const { data: newKeyword, error: createError } = await supabase
      .from('bid_keywords')
      .insert({
        user_id: user.id,
        keyword,
        category,
        priority,
        active: true,
      })
      .select()
      .single();

    if (createError) {
      throw createError;
    }

    return NextResponse.json({
      success: true,
      data: newKeyword,
    });
  } catch (error) {
    console.error('Keyword create error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create keyword',
      },
      { status: 500 }
    );
  }
}

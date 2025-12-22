/**
 * 고객 API - 목록 조회 및 생성
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/types';

// GET /api/clients - 고객 목록 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    // 쿼리 파라미터
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || 'all';
    const sort = searchParams.get('sort') || 'recent';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // 기본 쿼리
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from('clients')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id);

    // 검색
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,business_number.ilike.%${search}%`);
    }

    // 타입 필터
    if (type !== 'all') {
      query = query.eq('type', type);
    }

    // 정렬
    switch (sort) {
      case 'name':
        query = query.order('name', { ascending: true });
        break;
      case 'revenue':
        // TODO: 매출 기준 정렬은 별도 집계 필요
        query = query.order('created_at', { ascending: false });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    // 페이지네이션
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: clients, error, count } = await query;

    if (error) {
      console.error('Failed to fetch clients:', error);
      return NextResponse.json(
        { error: '고객 목록을 불러오지 못했습니다' },
        { status: 500 }
      );
    }

    // TODO: 각 고객별 문서 수와 매출 집계 추가
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clientsWithStats = clients?.map((client: any) => ({
      ...client,
      stats: {
        documentCount: 0,
        totalRevenue: 0,
      },
    }));

    return NextResponse.json({
      clients: clientsWithStats,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Clients API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// POST /api/clients - 고객 생성
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // 데이터 변환 (camelCase -> snake_case)
    const clientData: Database['public']['Tables']['clients']['Insert'] = {
      user_id: user.id,
      type: body.type as 'individual' | 'business',
      name: body.name,
      business_number: body.businessNumber || null,
      representative_name: body.representativeName || null,
      email: body.email,
      phone: body.phone || null,
      address: body.address || null,
      business_type: body.businessType || null,
      business_category: body.businessCategory || null,
      notes: body.notes || null,
      tags: body.tags || [],
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: client, error } = await (supabase as any)
      .from('clients')
      .insert(clientData)
      .select()
      .single();

    if (error) {
      console.error('Failed to create client:', error);

      // 중복 이메일 에러 처리
      if (error.code === '23505') {
        return NextResponse.json(
          { error: '이미 등록된 이메일입니다' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: '고객 등록에 실패했습니다' },
        { status: 500 }
      );
    }

    return NextResponse.json({ client }, { status: 201 });
  } catch (error) {
    console.error('Create client error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

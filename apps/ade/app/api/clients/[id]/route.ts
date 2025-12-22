/**
 * 고객 API - 상세 조회, 수정, 삭제
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/clients/:id - 고객 상세 조회
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: client, error } = await (supabase as any)
      .from('clients')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: '고객을 찾을 수 없습니다' },
          { status: 404 }
        );
      }
      console.error('Failed to fetch client:', error);
      return NextResponse.json(
        { error: '고객 정보를 불러오지 못했습니다' },
        { status: 500 }
      );
    }

    // TODO: 문서 이력 및 통계 조회
    const stats = {
      quotes: { count: 0, total: 0 },
      contracts: { count: 0, total: 0 },
      invoices: { count: 0, total: 0 },
      totalRevenue: 0,
    };

    return NextResponse.json({
      client,
      stats,
    });
  } catch (error) {
    console.error('Get client error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// PUT /api/clients/:id - 고객 수정
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
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
    const updateData: Database['public']['Tables']['clients']['Update'] = {
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
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: '고객을 찾을 수 없습니다' },
          { status: 404 }
        );
      }
      console.error('Failed to update client:', error);
      return NextResponse.json(
        { error: '고객 수정에 실패했습니다' },
        { status: 500 }
      );
    }

    return NextResponse.json({ client });
  } catch (error) {
    console.error('Update client error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// DELETE /api/clients/:id - 고객 삭제
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    // TODO: 관련 문서가 있는 경우 삭제 불가 처리

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('clients')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Failed to delete client:', error);
      return NextResponse.json(
        { error: '고객 삭제에 실패했습니다' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete client error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

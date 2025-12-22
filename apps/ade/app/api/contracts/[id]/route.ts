/**
 * 계약서 API - 상세 조회
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/contracts/:id - 계약서 상세 조회
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: contract, error } = await (supabase as any)
      .from('contracts')
      .select('*, clients(*), quotes(*)')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: '계약서를 찾을 수 없습니다' }, { status: 404 });
      }
      console.error('Failed to fetch contract:', error);
      return NextResponse.json({ error: '계약서를 불러오지 못했습니다' }, { status: 500 });
    }

    // 연결된 인보이스 조회
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: invoices } = await (supabase as any)
      .from('invoices')
      .select('*')
      .eq('contract_id', id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    // 공개 토큰 조회 또는 생성
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let { data: publicToken } = await (supabase as any)
      .from('public_tokens')
      .select('token')
      .eq('document_id', id)
      .eq('document_type', 'contract')
      .eq('is_active', true)
      .single();

    if (!publicToken) {
      const newToken = crypto.randomUUID();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: createdToken } = await (supabase as any)
        .from('public_tokens')
        .insert({
          user_id: user.id,
          document_type: 'contract',
          document_id: id,
          token: newToken,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30일 후 만료
        })
        .select('token')
        .single();
      publicToken = createdToken;
    }

    return NextResponse.json({
      contract,
      invoices: invoices || [],
      publicToken: publicToken?.token || null,
    });
  } catch (error) {
    console.error('Get contract error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}

// PUT /api/contracts/:id - 계약서 수정
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    const body = await request.json();

    // 기존 계약서 확인
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (supabase as any)
      .from('contracts')
      .select('status')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: '계약서를 찾을 수 없습니다' }, { status: 404 });
    }

    // 체결된 계약은 수정 불가
    if (existing.status === 'approved' || existing.status === 'completed') {
      return NextResponse.json({ error: '체결된 계약서는 수정할 수 없습니다' }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (body.clientId) updateData.client_id = body.clientId;
    if (body.status) updateData.status = body.status;
    if (body.title) updateData.title = body.title;
    if (body.projectName) updateData.project_name = body.projectName;
    if (body.projectDescription) updateData.project_description = body.projectDescription;
    if (body.items) updateData.items = body.items;
    if (body.subtotal !== undefined) updateData.subtotal = body.subtotal;
    if (body.taxAmount !== undefined) updateData.tax_amount = body.taxAmount;
    if (body.totalAmount !== undefined) updateData.total_amount = body.totalAmount;
    if (body.startDate) updateData.start_date = body.startDate;
    if (body.endDate) updateData.end_date = body.endDate;
    if (body.paymentSchedule) updateData.payment_schedule = body.paymentSchedule;
    if (body.clauses) updateData.clauses = body.clauses;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: contract, error } = await (supabase as any)
      .from('contracts')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select('*, clients(*)')
      .single();

    if (error) {
      console.error('Failed to update contract:', error);
      return NextResponse.json({ error: '계약서 수정에 실패했습니다' }, { status: 500 });
    }

    // 이벤트 로그
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('document_events')
      .insert({
        user_id: user.id,
        document_type: 'contract',
        document_id: id,
        event_type: 'updated',
        description: '계약서 수정',
      });

    return NextResponse.json({ contract });
  } catch (error) {
    console.error('Update contract error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}

// DELETE /api/contracts/:id - 계약서 삭제
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    // 기존 계약서 확인
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (supabase as any)
      .from('contracts')
      .select('status, document_number')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: '계약서를 찾을 수 없습니다' }, { status: 404 });
    }

    // 체결된 계약은 삭제 불가
    if (existing.status === 'approved' || existing.status === 'completed') {
      return NextResponse.json({ error: '체결된 계약서는 삭제할 수 없습니다' }, { status: 400 });
    }

    // 연결된 인보이스 확인
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: invoices } = await (supabase as any)
      .from('invoices')
      .select('id')
      .eq('contract_id', id);

    if (invoices && invoices.length > 0) {
      return NextResponse.json({ error: '연결된 인보이스가 있어 삭제할 수 없습니다' }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('contracts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Failed to delete contract:', error);
      return NextResponse.json({ error: '계약서 삭제에 실패했습니다' }, { status: 500 });
    }

    // 이벤트 로그
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('document_events')
      .insert({
        user_id: user.id,
        document_type: 'contract',
        document_id: id,
        event_type: 'deleted',
        description: `계약서 ${existing.document_number} 삭제`,
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete contract error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}

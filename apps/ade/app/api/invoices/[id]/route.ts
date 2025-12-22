/**
 * 인보이스 API - 상세 조회
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/invoices/:id - 인보이스 상세 조회
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: invoice, error } = await (supabase as any)
      .from('invoices')
      .select('*, clients(*), contracts(*)')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: '인보이스를 찾을 수 없습니다' }, { status: 404 });
      }
      console.error('Failed to fetch invoice:', error);
      return NextResponse.json({ error: '인보이스를 불러오지 못했습니다' }, { status: 500 });
    }

    // 연체 여부 계산
    const isOverdue = invoice.payment_status !== 'paid' && new Date(invoice.due_date) < new Date();

    return NextResponse.json({
      invoice: {
        ...invoice,
        isOverdue,
      },
    });
  } catch (error) {
    console.error('Get invoice error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}

// PUT /api/invoices/:id - 인보이스 결제 확인
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    const body = await request.json();

    // 결제 확인 업데이트
    const updateData: Record<string, unknown> = {};

    if (body.paymentStatus) {
      updateData.payment_status = body.paymentStatus;
    }
    if (body.paidAmount !== undefined) {
      updateData.paid_amount = body.paidAmount;
    }
    if (body.paymentMethod) {
      updateData.payment_method = body.paymentMethod;
    }
    if (body.paymentStatus === 'paid') {
      updateData.paid_at = new Date().toISOString();
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: invoice, error } = await (supabase as any)
      .from('invoices')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select('*, clients(*)')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: '인보이스를 찾을 수 없습니다' }, { status: 404 });
      }
      console.error('Failed to update invoice:', error);
      return NextResponse.json({ error: '인보이스 수정에 실패했습니다' }, { status: 500 });
    }

    // 이벤트 로그
    if (body.paymentStatus === 'paid') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('document_events')
        .insert({
          user_id: user.id,
          document_type: 'invoice',
          document_id: id,
          event_type: 'paid',
          description: '결제 완료',
        });
    }

    return NextResponse.json({ invoice });
  } catch (error) {
    console.error('Update invoice error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}

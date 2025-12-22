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

    // 공개 토큰 조회 또는 생성
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let { data: publicToken } = await (supabase as any)
      .from('public_tokens')
      .select('token')
      .eq('document_id', id)
      .eq('document_type', 'invoice')
      .eq('is_active', true)
      .single();

    if (!publicToken) {
      const newToken = crypto.randomUUID();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: createdToken } = await (supabase as any)
        .from('public_tokens')
        .insert({
          user_id: user.id,
          document_type: 'invoice',
          document_id: id,
          token: newToken,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30일 후 만료
        })
        .select('token')
        .single();
      publicToken = createdToken;
    }

    return NextResponse.json({
      invoice: {
        ...invoice,
        isOverdue,
      },
      publicToken: publicToken?.token || null,
    });
  } catch (error) {
    console.error('Get invoice error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}

// PUT /api/invoices/:id - 인보이스 수정 및 결제 확인
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    const body = await request.json();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    // 결제 관련 필드
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

    // 일반 수정 필드
    if (body.clientId) updateData.client_id = body.clientId;
    if (body.status) updateData.status = body.status;
    if (body.title) updateData.title = body.title;
    if (body.items) updateData.items = body.items;
    if (body.subtotal !== undefined) updateData.subtotal = body.subtotal;
    if (body.taxAmount !== undefined) updateData.tax_amount = body.taxAmount;
    if (body.totalAmount !== undefined) updateData.total_amount = body.totalAmount;
    if (body.dueDate) updateData.due_date = body.dueDate;
    if (body.paymentInfo) updateData.payment_info = body.paymentInfo;
    if (body.notes) updateData.notes = body.notes;

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
    const eventType = body.paymentStatus === 'paid' ? 'paid' : 'updated';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('document_events')
      .insert({
        user_id: user.id,
        document_type: 'invoice',
        document_id: id,
        event_type: eventType,
        description: body.paymentStatus === 'paid' ? '결제 완료' : '인보이스 수정',
      });

    return NextResponse.json({ invoice });
  } catch (error) {
    console.error('Update invoice error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}

// DELETE /api/invoices/:id - 인보이스 삭제
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    // 기존 인보이스 확인
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (supabase as any)
      .from('invoices')
      .select('payment_status, document_number')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: '인보이스를 찾을 수 없습니다' }, { status: 404 });
    }

    // 결제된 인보이스는 삭제 불가
    if (existing.payment_status === 'paid') {
      return NextResponse.json({ error: '결제된 인보이스는 삭제할 수 없습니다' }, { status: 400 });
    }

    // 연결된 세금계산서 확인
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: taxInvoices } = await (supabase as any)
      .from('tax_invoices')
      .select('id')
      .eq('invoice_id', id);

    if (taxInvoices && taxInvoices.length > 0) {
      return NextResponse.json({ error: '연결된 세금계산서가 있어 삭제할 수 없습니다' }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('invoices')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Failed to delete invoice:', error);
      return NextResponse.json({ error: '인보이스 삭제에 실패했습니다' }, { status: 500 });
    }

    // 이벤트 로그
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('document_events')
      .insert({
        user_id: user.id,
        document_type: 'invoice',
        document_id: id,
        event_type: 'deleted',
        description: `인보이스 ${existing.document_number} 삭제`,
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete invoice error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}

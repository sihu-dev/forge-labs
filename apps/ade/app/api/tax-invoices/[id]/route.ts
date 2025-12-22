/**
 * 세금계산서 상세 API - 조회, 수정, 삭제
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/tax-invoices/:id - 상세 조회
export async function GET(request: NextRequest, { params }: RouteParams) {
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: taxInvoice, error } = await (supabase as any)
      .from('tax_invoices')
      .select('*, clients(*)')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !taxInvoice) {
      return NextResponse.json({ error: '세금계산서를 찾을 수 없습니다' }, { status: 404 });
    }

    // 관련 인보이스 정보 조회
    let invoice = null;
    if (taxInvoice.invoice_id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: invoiceData } = await (supabase as any)
        .from('invoices')
        .select('id, document_number, title')
        .eq('id', taxInvoice.invoice_id)
        .single();
      invoice = invoiceData;
    }

    // 고객 상세 정보 조회 (세금계산서용 사업자 정보)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: clientProfile } = await (supabase as any)
      .from('clients')
      .select('*')
      .eq('id', taxInvoice.client_id)
      .single();

    return NextResponse.json({
      taxInvoice: {
        ...taxInvoice,
        provider: taxInvoice.provider_info,
        client: clientProfile
          ? {
              businessNumber: clientProfile.business_number,
              name: clientProfile.name,
              representativeName: clientProfile.representative_name,
              address: clientProfile.address,
              businessType: clientProfile.business_type,
              businessCategory: clientProfile.business_category,
              email: clientProfile.email,
            }
          : null,
      },
      invoice,
    });
  } catch (error) {
    console.error('Tax invoice detail API error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}

// PUT /api/tax-invoices/:id - 수정 (국세청 전송 상태 업데이트 등)
export async function PUT(request: NextRequest, { params }: RouteParams) {
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

    const body = await request.json();

    // 기존 세금계산서 확인
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing, error: findError } = await (supabase as any)
      .from('tax_invoices')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (findError || !existing) {
      return NextResponse.json({ error: '세금계산서를 찾을 수 없습니다' }, { status: 404 });
    }

    // 이미 승인된 경우 수정 불가
    if (existing.nts_status === 'approved') {
      return NextResponse.json(
        { error: '승인된 세금계산서는 수정할 수 없습니다' },
        { status: 400 }
      );
    }

    // 업데이트 데이터 구성
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    // 국세청 전송 요청
    if (body.action === 'submit_nts') {
      updateData.nts_status = 'submitted';
      updateData.nts_submitted_at = new Date().toISOString();

      // TODO: 실제 국세청 API 연동 시 여기서 처리
      // 현재는 바로 승인 처리 (시뮬레이션)
      updateData.nts_status = 'approved';
      updateData.nts_approval_number = generateApprovalNumber();
    }

    // 기타 필드 업데이트
    if (body.title) updateData.title = body.title;
    if (body.items) {
      updateData.items = body.items;
      const subtotal = body.items.reduce(
        (sum: number, item: { supply_amount: number }) => sum + item.supply_amount,
        0
      );
      updateData.subtotal = subtotal;
      updateData.tax_amount = Math.round(subtotal * 0.1);
      updateData.total_amount = subtotal + updateData.tax_amount;
    }
    if (body.ntsStatus) updateData.nts_status = body.ntsStatus;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: taxInvoice, error } = await (supabase as any)
      .from('tax_invoices')
      .update(updateData)
      .eq('id', id)
      .select('*, clients(*)')
      .single();

    if (error) {
      console.error('Tax invoice update error:', error);
      return NextResponse.json({ error: '세금계산서 수정에 실패했습니다' }, { status: 500 });
    }

    // 이벤트 로그
    const eventType = body.action === 'submit_nts' ? 'nts_submitted' : 'updated';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('document_events')
      .insert({
        user_id: user.id,
        document_type: 'tax_invoice',
        document_id: id,
        event_type: eventType,
        description: body.action === 'submit_nts' ? '국세청 전송' : '세금계산서 수정',
      });

    return NextResponse.json({
      taxInvoice,
      message: body.action === 'submit_nts' ? '국세청 전송이 완료되었습니다' : '수정되었습니다',
    });
  } catch (error) {
    console.error('Tax invoice update API error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}

// DELETE /api/tax-invoices/:id - 삭제
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    // 기존 세금계산서 확인
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing, error: findError } = await (supabase as any)
      .from('tax_invoices')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (findError || !existing) {
      return NextResponse.json({ error: '세금계산서를 찾을 수 없습니다' }, { status: 404 });
    }

    // 승인된 세금계산서는 삭제 불가
    if (existing.nts_status === 'approved') {
      return NextResponse.json(
        { error: '국세청 승인된 세금계산서는 삭제할 수 없습니다' },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('tax_invoices')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Tax invoice deletion error:', error);
      return NextResponse.json({ error: '세금계산서 삭제에 실패했습니다' }, { status: 500 });
    }

    // 이벤트 로그
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('document_events')
      .insert({
        user_id: user.id,
        document_type: 'tax_invoice',
        document_id: id,
        event_type: 'deleted',
        description: `세금계산서 ${existing.document_number} 삭제`,
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Tax invoice deletion API error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}

// 국세청 승인번호 생성 (시뮬레이션)
function generateApprovalNumber(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomNum = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
  return `${dateStr}${randomNum}`;
}

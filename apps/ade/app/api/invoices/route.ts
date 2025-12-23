/**
 * 인보이스 API - 목록 조회, 생성
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/invoices - 인보이스 목록 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || 'all';
    const paymentStatus = searchParams.get('paymentStatus') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from('invoices')
      .select('*, clients(*)', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    if (paymentStatus !== 'all') {
      query = query.eq('payment_status', paymentStatus);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: invoices, error, count } = await query;

    if (error) {
      console.error('Failed to fetch invoices:', error);
      return NextResponse.json({ error: '인보이스 목록을 불러오지 못했습니다' }, { status: 500 });
    }

    // 연체 계산
    const now = new Date();
    const processedInvoices = invoices?.map((invoice: { due_date: string; payment_status: string }) => ({
      ...invoice,
      isOverdue: invoice.payment_status !== 'paid' && new Date(invoice.due_date) < now,
    }));

    return NextResponse.json({
      invoices: processedInvoices,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Invoices API error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}

// POST /api/invoices - 인보이스 생성
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    const body = await request.json();

    // 문서 번호 생성
    const today = new Date();
    const prefix = `INV-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count } = await (supabase as any)
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .like('document_number', `${prefix}%`);

    const documentNumber = `${prefix}-${String((count || 0) + 1).padStart(4, '0')}`;

    // 결제 정보 조회 (사업자 설정에서)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase as any)
      .from('business_profiles')
      .select('bank_name, bank_account, bank_holder')
      .eq('user_id', user.id)
      .single();

    const paymentInfo = profile && profile.bank_name ? {
      bank_name: profile.bank_name,
      account_number: profile.bank_account,
      account_holder: profile.bank_holder,
    } : null;

    // 인보이스 생성
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: invoice, error } = await (supabase as any)
      .from('invoices')
      .insert({
        user_id: user.id,
        client_id: body.clientId,
        contract_id: body.contractId || null,
        document_number: documentNumber,
        status: body.status || 'draft',
        title: body.title,
        items: body.items,
        subtotal: body.subtotal,
        tax_amount: body.taxAmount,
        total_amount: body.totalAmount,
        due_date: body.dueDate,
        payment_status: 'pending',
        payment_info: paymentInfo,
        notes: body.notes || null,
      })
      .select('*, clients(*)')
      .single();

    if (error) {
      console.error('Failed to create invoice:', error);
      return NextResponse.json({ error: '인보이스 생성에 실패했습니다' }, { status: 500 });
    }

    // 이벤트 로그
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('document_events')
      .insert({
        user_id: user.id,
        document_type: 'invoice',
        document_id: invoice.id,
        event_type: 'created',
        description: '인보이스 생성',
      });

    return NextResponse.json({ invoice }, { status: 201 });
  } catch (error) {
    console.error('Create invoice error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}

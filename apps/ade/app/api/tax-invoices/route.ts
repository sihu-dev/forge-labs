/**
 * 세금계산서 API - 목록 조회 및 생성
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/tax-invoices - 목록 조회
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from('tax_invoices')
      .select('*, clients(*)', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('nts_status', status);
    }

    const { data: taxInvoices, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      console.error('Tax invoices fetch error:', error);
      return NextResponse.json({ error: '세금계산서 목록을 불러오지 못했습니다' }, { status: 500 });
    }

    // 이번 달 통계 계산
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const thisMonthInvoices = taxInvoices?.filter(
      (t: { created_at: string }) => new Date(t.created_at) >= startOfMonth
    ) || [];

    const stats = {
      thisMonthTotal: thisMonthInvoices.reduce(
        (sum: number, t: { total_amount: number }) => sum + t.total_amount,
        0
      ),
      approvedCount: taxInvoices?.filter(
        (t: { nts_status: string }) => t.nts_status === 'approved'
      ).length || 0,
    };

    return NextResponse.json({
      taxInvoices: taxInvoices || [],
      stats,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Tax invoices API error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}

// POST /api/tax-invoices - 세금계산서 생성
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

    const body = await request.json();
    const { invoiceId, items, issueDate, issueType = 'regular' } = body;

    // 인보이스 ID가 있으면 해당 인보이스 정보 가져오기
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let invoice = null;
    if (invoiceId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: invoiceData } = await (supabase as any)
        .from('invoices')
        .select('*, clients(*)')
        .eq('id', invoiceId)
        .eq('user_id', user.id)
        .single();
      invoice = invoiceData;
    }

    // 사업자 프로필 조회
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase as any)
      .from('business_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: '사업자 정보가 등록되지 않았습니다' }, { status: 400 });
    }

    // 문서 번호 생성 (YYYYMMDD-XXXXXXXX)
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const randomNum = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
    const documentNumber = `${dateStr}-${randomNum}`;

    // 품목 및 금액 계산
    const taxInvoiceItems = items || invoice?.items || [];
    const subtotal = taxInvoiceItems.reduce(
      (sum: number, item: { supply_amount?: number; amount?: number }) =>
        sum + (item.supply_amount || item.amount || 0),
      0
    );
    const taxAmount = Math.round(subtotal * 0.1);
    const totalAmount = subtotal + taxAmount;

    // 세금계산서 데이터
    const taxInvoiceData = {
      user_id: user.id,
      client_id: invoice?.client_id || body.clientId,
      invoice_id: invoiceId || null,
      document_number: documentNumber,
      title: invoice?.title || body.title || '세금계산서',
      items: taxInvoiceItems.map((item: {
        id?: string;
        name: string;
        quantity: number;
        unit_price?: number;
        unitPrice?: number;
        supply_amount?: number;
        amount?: number;
      }, index: number) => ({
        id: item.id || `item-${index}`,
        date: issueDate || today.toISOString().slice(0, 10),
        name: item.name,
        quantity: item.quantity,
        unit_price: item.unit_price || item.unitPrice || 0,
        supply_amount: item.supply_amount || item.amount || 0,
        tax_amount: Math.round((item.supply_amount || item.amount || 0) * 0.1),
      })),
      subtotal,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      issue_date: issueDate || today.toISOString().slice(0, 10),
      issue_type: issueType,
      nts_status: 'draft',
      provider_info: {
        business_number: profile.business_number,
        name: profile.name,
        representative_name: profile.representative_name,
        address: profile.address,
        business_type: profile.business_type,
        business_category: profile.business_category,
        email: profile.email,
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: taxInvoice, error } = await (supabase as any)
      .from('tax_invoices')
      .insert(taxInvoiceData)
      .select('*, clients(*)')
      .single();

    if (error) {
      console.error('Tax invoice creation error:', error);
      return NextResponse.json({ error: '세금계산서 생성에 실패했습니다' }, { status: 500 });
    }

    // 이벤트 로그
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('document_events')
      .insert({
        user_id: user.id,
        document_type: 'tax_invoice',
        document_id: taxInvoice.id,
        event_type: 'created',
        description: invoiceId ? `인보이스 ${invoice?.document_number}에서 생성` : '직접 생성',
      });

    return NextResponse.json({ taxInvoice }, { status: 201 });
  } catch (error) {
    console.error('Tax invoice creation API error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}

/**
 * 인보이스 API - 목록 조회
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

/**
 * 계약서 API - 목록 조회, 생성
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/contracts - 계약서 목록 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from('contracts')
      .select('*, clients(*)', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: contracts, error, count } = await query;

    if (error) {
      console.error('Failed to fetch contracts:', error);
      return NextResponse.json({ error: '계약서 목록을 불러오지 못했습니다' }, { status: 500 });
    }

    return NextResponse.json({
      contracts,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Contracts API error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}

// POST /api/contracts - 계약서 생성
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
    const prefix = `CT-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count } = await (supabase as any)
      .from('contracts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .like('document_number', `${prefix}%`);

    const documentNumber = `${prefix}-${String((count || 0) + 1).padStart(4, '0')}`;

    // 계약서 생성
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: contract, error } = await (supabase as any)
      .from('contracts')
      .insert({
        user_id: user.id,
        client_id: body.clientId,
        document_number: documentNumber,
        status: body.status || 'draft',
        title: body.title,
        project_name: body.projectName || body.title,
        project_description: body.projectDescription || null,
        items: body.items,
        subtotal: body.subtotal,
        tax_amount: body.taxAmount,
        total_amount: body.totalAmount,
        start_date: body.startDate,
        end_date: body.endDate,
        payment_schedule: body.paymentSchedule || [],
        clauses: body.clauses || [],
      })
      .select('*, clients(*)')
      .single();

    if (error) {
      console.error('Failed to create contract:', error);
      return NextResponse.json({ error: '계약서 생성에 실패했습니다' }, { status: 500 });
    }

    // 이벤트 로그
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('document_events')
      .insert({
        user_id: user.id,
        document_type: 'contract',
        document_id: contract.id,
        event_type: 'created',
        description: '계약서 생성',
      });

    return NextResponse.json({ contract }, { status: 201 });
  } catch (error) {
    console.error('Create contract error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}

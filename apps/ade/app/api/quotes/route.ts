/**
 * 견적서 API - 목록 조회 및 생성
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/quotes - 견적서 목록 조회
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
      .from('quotes')
      .select('*, clients(*)', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: quotes, error, count } = await query;

    if (error) {
      console.error('Failed to fetch quotes:', error);
      return NextResponse.json({ error: '견적서 목록을 불러오지 못했습니다' }, { status: 500 });
    }

    return NextResponse.json({
      quotes,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Quotes API error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}

// POST /api/quotes - 견적서 생성
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    const body = await request.json();

    // 문서 번호 생성
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: docNumber } = await (supabase as any).rpc('generate_document_number', {
      p_user_id: user.id,
      p_prefix: 'Q',
      p_table_name: 'quotes',
    });

    const quoteData = {
      user_id: user.id,
      client_id: body.clientId,
      document_number: docNumber || `Q-${Date.now()}`,
      status: body.status || 'draft',
      title: body.title,
      items: body.items,
      subtotal: body.subtotal,
      tax_amount: body.taxAmount,
      total_amount: body.totalAmount,
      valid_until: body.validUntil,
      payment_terms: body.paymentTerms || null,
      delivery_terms: body.deliveryTerms || null,
      notes: body.notes || null,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: quote, error } = await (supabase as any)
      .from('quotes')
      .insert(quoteData)
      .select('*, clients(*)')
      .single();

    if (error) {
      console.error('Failed to create quote:', error);
      return NextResponse.json({ error: '견적서 생성에 실패했습니다' }, { status: 500 });
    }

    // 발송 상태면 sent_at 업데이트
    if (body.status === 'sent') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('quotes')
        .update({ sent_at: new Date().toISOString() })
        .eq('id', quote.id);
    }

    return NextResponse.json({ quote }, { status: 201 });
  } catch (error) {
    console.error('Create quote error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}

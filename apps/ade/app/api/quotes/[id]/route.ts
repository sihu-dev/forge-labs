/**
 * 견적서 API - 상세 조회, 수정, 삭제
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/quotes/:id - 견적서 상세 조회
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: quote, error } = await (supabase as any)
      .from('quotes')
      .select('*, clients(*)')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: '견적서를 찾을 수 없습니다' }, { status: 404 });
      }
      console.error('Failed to fetch quote:', error);
      return NextResponse.json({ error: '견적서를 불러오지 못했습니다' }, { status: 500 });
    }

    return NextResponse.json({ quote });
  } catch (error) {
    console.error('Get quote error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}

// PUT /api/quotes/:id - 견적서 수정
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    const body = await request.json();

    const updateData = {
      client_id: body.clientId,
      status: body.status,
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
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select('*, clients(*)')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: '견적서를 찾을 수 없습니다' }, { status: 404 });
      }
      console.error('Failed to update quote:', error);
      return NextResponse.json({ error: '견적서 수정에 실패했습니다' }, { status: 500 });
    }

    return NextResponse.json({ quote });
  } catch (error) {
    console.error('Update quote error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}

// DELETE /api/quotes/:id - 견적서 삭제
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('quotes')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Failed to delete quote:', error);
      return NextResponse.json({ error: '견적서 삭제에 실패했습니다' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete quote error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}

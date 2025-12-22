/**
 * 공개 견적서 API - 토큰으로 조회 및 응답
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ token: string }>;
}

// GET /api/public/quotes/:token - 견적서 조회 (인증 불필요)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params;
    const supabase = await createClient();

    // 토큰으로 공개 링크 조회
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: publicToken, error: tokenError } = await (supabase as any)
      .from('public_tokens')
      .select('*')
      .eq('token', token)
      .eq('document_type', 'quote')
      .eq('is_active', true)
      .single();

    if (tokenError || !publicToken) {
      return NextResponse.json({ error: '유효하지 않은 링크입니다' }, { status: 404 });
    }

    // 만료 확인
    if (publicToken.expires_at && new Date(publicToken.expires_at) < new Date()) {
      return NextResponse.json({ error: '만료된 링크입니다' }, { status: 410 });
    }

    // 견적서 조회
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: quote, error: quoteError } = await (supabase as any)
      .from('quotes')
      .select('*, clients(*)')
      .eq('id', publicToken.document_id)
      .single();

    if (quoteError || !quote) {
      return NextResponse.json({ error: '견적서를 찾을 수 없습니다' }, { status: 404 });
    }

    // 공급자 정보 조회
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: provider } = await (supabase as any)
      .from('business_profiles')
      .select('*')
      .eq('user_id', quote.user_id)
      .single();

    // viewed_at 업데이트 (첫 조회 시)
    if (!publicToken.viewed_at) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('public_tokens')
        .update({ viewed_at: new Date().toISOString() })
        .eq('id', publicToken.id);

      // 견적서 상태도 viewed로 업데이트 (sent 상태인 경우)
      if (quote.status === 'sent') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('quotes')
          .update({
            status: 'viewed',
            viewed_at: new Date().toISOString()
          })
          .eq('id', quote.id);
      }
    }

    return NextResponse.json({
      quote: {
        id: quote.id,
        documentNumber: quote.document_number,
        title: quote.title,
        status: quote.status,
        items: quote.items,
        subtotal: quote.subtotal,
        taxAmount: quote.tax_amount,
        totalAmount: quote.total_amount,
        validUntil: quote.valid_until,
        paymentTerms: quote.payment_terms,
        deliveryTerms: quote.delivery_terms,
        notes: quote.notes,
        createdAt: quote.created_at,
        provider: provider ? {
          name: provider.name,
          businessNumber: provider.business_number,
          email: provider.email,
          phone: provider.phone,
          address: provider.address,
        } : null,
        client: {
          name: quote.clients.name,
          email: quote.clients.email,
        },
      },
    });
  } catch (error) {
    console.error('Public quote API error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}

// POST /api/public/quotes/:token - 견적서 응답 (승인/거절)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params;
    const supabase = await createClient();
    const body = await request.json();

    const { action, reason } = body; // action: 'approve' | 'reject'

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: '유효하지 않은 요청입니다' }, { status: 400 });
    }

    // 토큰 검증
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: publicToken, error: tokenError } = await (supabase as any)
      .from('public_tokens')
      .select('*')
      .eq('token', token)
      .eq('document_type', 'quote')
      .eq('is_active', true)
      .single();

    if (tokenError || !publicToken) {
      return NextResponse.json({ error: '유효하지 않은 링크입니다' }, { status: 404 });
    }

    // 견적서 상태 확인
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: quote, error: quoteError } = await (supabase as any)
      .from('quotes')
      .select('*')
      .eq('id', publicToken.document_id)
      .single();

    if (quoteError || !quote) {
      return NextResponse.json({ error: '견적서를 찾을 수 없습니다' }, { status: 404 });
    }

    // 이미 응답한 견적서인지 확인
    if (['approved', 'rejected'].includes(quote.status)) {
      return NextResponse.json({ error: '이미 응답된 견적서입니다' }, { status: 400 });
    }

    // 유효기간 확인
    if (new Date(quote.valid_until) < new Date()) {
      return NextResponse.json({ error: '유효기간이 만료된 견적서입니다' }, { status: 400 });
    }

    // 상태 업데이트
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('quotes')
      .update({
        status: newStatus,
        approved_at: action === 'approve' ? new Date().toISOString() : null,
      })
      .eq('id', quote.id);

    // 이벤트 로그
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('document_events')
      .insert({
        user_id: quote.user_id,
        document_type: 'quote',
        document_id: quote.id,
        event_type: newStatus,
        description: action === 'reject' ? reason : null,
        metadata: { token },
      });

    // 토큰 비활성화
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('public_tokens')
      .update({ is_active: false })
      .eq('id', publicToken.id);

    return NextResponse.json({
      success: true,
      status: newStatus,
    });
  } catch (error) {
    console.error('Quote response error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}

/**
 * 공개 인보이스 API - 토큰으로 조회
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ token: string }>;
}

// GET /api/public/invoices/:token - 인보이스 조회 (인증 불필요)
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
      .eq('document_type', 'invoice')
      .eq('is_active', true)
      .single();

    if (tokenError || !publicToken) {
      return NextResponse.json({ error: '유효하지 않은 링크입니다' }, { status: 404 });
    }

    // 만료 확인
    if (publicToken.expires_at && new Date(publicToken.expires_at) < new Date()) {
      return NextResponse.json({ error: '만료된 링크입니다' }, { status: 410 });
    }

    // 인보이스 조회
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: invoice, error: invoiceError } = await (supabase as any)
      .from('invoices')
      .select('*, clients(*)')
      .eq('id', publicToken.document_id)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: '인보이스를 찾을 수 없습니다' }, { status: 404 });
    }

    // 공급자 정보 조회
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: provider } = await (supabase as any)
      .from('business_profiles')
      .select('*')
      .eq('user_id', invoice.user_id)
      .single();

    // viewed_at 업데이트 (첫 조회 시)
    if (!publicToken.viewed_at) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('public_tokens')
        .update({ viewed_at: new Date().toISOString() })
        .eq('id', publicToken.id);

      // 인보이스 상태도 viewed로 업데이트 (sent 상태인 경우)
      if (invoice.status === 'sent') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('invoices')
          .update({ status: 'viewed' })
          .eq('id', invoice.id);
      }
    }

    // 연체 여부 계산
    const isOverdue = invoice.payment_status !== 'paid' && new Date(invoice.due_date) < new Date();

    return NextResponse.json({
      invoice: {
        id: invoice.id,
        documentNumber: invoice.document_number,
        title: invoice.title,
        status: invoice.status,
        paymentStatus: invoice.payment_status,
        items: invoice.items,
        subtotal: invoice.subtotal,
        taxAmount: invoice.tax_amount,
        totalAmount: invoice.total_amount,
        dueDate: invoice.due_date,
        paymentInfo: invoice.payment_info,
        notes: invoice.notes,
        createdAt: invoice.created_at,
        isOverdue,
        provider: provider ? {
          name: provider.name,
          businessNumber: provider.business_number,
          email: provider.email,
          phone: provider.phone,
          address: provider.address,
          bankName: provider.bank_name,
          accountNumber: provider.account_number,
          accountHolder: provider.account_holder,
        } : null,
        client: {
          name: invoice.clients.name,
          email: invoice.clients.email,
          businessNumber: invoice.clients.business_number,
        },
      },
    });
  } catch (error) {
    console.error('Public invoice API error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}

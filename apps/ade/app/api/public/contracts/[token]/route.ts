/**
 * 공개 계약서 API - 토큰으로 조회 및 서명
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ token: string }>;
}

// GET /api/public/contracts/:token - 계약서 조회 (인증 불필요)
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
      .eq('document_type', 'contract')
      .eq('is_active', true)
      .single();

    if (tokenError || !publicToken) {
      return NextResponse.json({ error: '유효하지 않은 링크입니다' }, { status: 404 });
    }

    // 만료 확인
    if (publicToken.expires_at && new Date(publicToken.expires_at) < new Date()) {
      return NextResponse.json({ error: '만료된 링크입니다' }, { status: 410 });
    }

    // 계약서 조회
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: contract, error: contractError } = await (supabase as any)
      .from('contracts')
      .select('*, clients(*)')
      .eq('id', publicToken.document_id)
      .single();

    if (contractError || !contract) {
      return NextResponse.json({ error: '계약서를 찾을 수 없습니다' }, { status: 404 });
    }

    // 공급자 정보 조회
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: provider } = await (supabase as any)
      .from('business_profiles')
      .select('*')
      .eq('user_id', contract.user_id)
      .single();

    // viewed_at 업데이트 (첫 조회 시)
    if (!publicToken.viewed_at) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('public_tokens')
        .update({ viewed_at: new Date().toISOString() })
        .eq('id', publicToken.id);

      // 계약서 상태도 viewed로 업데이트 (sent 상태인 경우)
      if (contract.status === 'sent') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('contracts')
          .update({ status: 'viewed' })
          .eq('id', contract.id);
      }
    }

    return NextResponse.json({
      contract: {
        id: contract.id,
        documentNumber: contract.document_number,
        title: contract.title,
        status: contract.status,
        projectName: contract.project_name,
        projectDescription: contract.project_description,
        items: contract.items,
        subtotal: contract.subtotal,
        taxAmount: contract.tax_amount,
        totalAmount: contract.total_amount,
        startDate: contract.start_date,
        endDate: contract.end_date,
        paymentSchedule: contract.payment_schedule,
        clauses: contract.clauses,
        createdAt: contract.created_at,
        provider: provider ? {
          name: provider.name,
          businessNumber: provider.business_number,
          email: provider.email,
          phone: provider.phone,
          address: provider.address,
        } : null,
        client: {
          name: contract.clients.name,
          email: contract.clients.email,
          businessNumber: contract.clients.business_number,
        },
      },
    });
  } catch (error) {
    console.error('Public contract API error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}

// POST /api/public/contracts/:token - 계약서 서명
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params;
    const supabase = await createClient();
    const body = await request.json();

    const { action, signatureData, signerName } = body; // action: 'sign'

    if (action !== 'sign') {
      return NextResponse.json({ error: '유효하지 않은 요청입니다' }, { status: 400 });
    }

    // 토큰 검증
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: publicToken, error: tokenError } = await (supabase as any)
      .from('public_tokens')
      .select('*')
      .eq('token', token)
      .eq('document_type', 'contract')
      .eq('is_active', true)
      .single();

    if (tokenError || !publicToken) {
      return NextResponse.json({ error: '유효하지 않은 링크입니다' }, { status: 404 });
    }

    // 계약서 상태 확인
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: contract, error: contractError } = await (supabase as any)
      .from('contracts')
      .select('*')
      .eq('id', publicToken.document_id)
      .single();

    if (contractError || !contract) {
      return NextResponse.json({ error: '계약서를 찾을 수 없습니다' }, { status: 404 });
    }

    // 이미 서명된 계약서인지 확인
    if (['approved', 'completed'].includes(contract.status)) {
      return NextResponse.json({ error: '이미 서명된 계약서입니다' }, { status: 400 });
    }

    // 계약 체결
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('contracts')
      .update({
        status: 'approved',
        signed_at: new Date().toISOString(),
        client_signature: signatureData,
        client_signer_name: signerName,
      })
      .eq('id', contract.id);

    // 이벤트 로그
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('document_events')
      .insert({
        user_id: contract.user_id,
        document_type: 'contract',
        document_id: contract.id,
        event_type: 'signed',
        description: `${signerName}님이 서명함`,
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
      status: 'approved',
    });
  } catch (error) {
    console.error('Contract sign error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}

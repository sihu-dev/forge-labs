/**
 * 견적서 → 계약서 전환 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createContractFromQuote, generatePublicToken } from '@/lib/services/document-conversion';

// POST /api/contracts/from-quote - 견적서에서 계약서 생성
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    const { quoteId } = await request.json();

    if (!quoteId) {
      return NextResponse.json({ error: '견적서 ID가 필요합니다' }, { status: 400 });
    }

    // 견적서 조회
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: quote, error: quoteError } = await (supabase as any)
      .from('quotes')
      .select('*')
      .eq('id', quoteId)
      .eq('user_id', user.id)
      .single();

    if (quoteError || !quote) {
      return NextResponse.json({ error: '견적서를 찾을 수 없습니다' }, { status: 404 });
    }

    // 승인된 견적서만 계약서로 전환 가능
    if (quote.status !== 'approved') {
      return NextResponse.json({ error: '승인된 견적서만 계약서로 전환할 수 있습니다' }, { status: 400 });
    }

    // 이미 연결된 계약서가 있는지 확인
    if (quote.linked_contract_id) {
      return NextResponse.json({ error: '이미 계약서가 생성된 견적서입니다' }, { status: 400 });
    }

    // 문서 번호 생성
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: docNumber } = await (supabase as any).rpc('generate_document_number', {
      p_user_id: user.id,
      p_prefix: 'C',
      p_table_name: 'contracts',
    });

    // 계약서 데이터 생성
    const contractData = {
      ...createContractFromQuote({
        id: quote.id,
        clientId: quote.client_id,
        title: quote.title,
        items: quote.items,
        subtotal: quote.subtotal,
        taxAmount: quote.tax_amount,
        totalAmount: quote.total_amount,
      }),
      user_id: user.id,
      document_number: docNumber || `C-${Date.now()}`,
    };

    // 계약서 생성
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: contract, error: contractError } = await (supabase as any)
      .from('contracts')
      .insert(contractData)
      .select()
      .single();

    if (contractError) {
      console.error('Failed to create contract:', contractError);
      return NextResponse.json({ error: '계약서 생성에 실패했습니다' }, { status: 500 });
    }

    // 견적서에 계약서 연결
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('quotes')
      .update({ linked_contract_id: contract.id })
      .eq('id', quoteId);

    // 공개 토큰 생성
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('public_tokens')
      .insert({
        user_id: user.id,
        document_type: 'contract',
        document_id: contract.id,
        token: generatePublicToken(),
      });

    // 이벤트 로그
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('document_events')
      .insert({
        user_id: user.id,
        document_type: 'contract',
        document_id: contract.id,
        event_type: 'created',
        description: `견적서 ${quote.document_number}에서 생성`,
        metadata: { from_quote_id: quoteId },
      });

    return NextResponse.json({ contract }, { status: 201 });
  } catch (error) {
    console.error('Create contract from quote error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}

/**
 * 계약서 → 인보이스 전환 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createInvoiceFromContract, generatePublicToken } from '@/lib/services/document-conversion';

// POST /api/invoices/from-contract - 계약서에서 인보이스 생성
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    const { contractId, scheduleId } = await request.json();

    if (!contractId || !scheduleId) {
      return NextResponse.json({ error: '계약서 ID와 결제 일정 ID가 필요합니다' }, { status: 400 });
    }

    // 계약서 조회
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: contract, error: contractError } = await (supabase as any)
      .from('contracts')
      .select('*')
      .eq('id', contractId)
      .eq('user_id', user.id)
      .single();

    if (contractError || !contract) {
      return NextResponse.json({ error: '계약서를 찾을 수 없습니다' }, { status: 404 });
    }

    // 사업자 정보 조회 (결제 정보용)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase as any)
      .from('business_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const paymentInfo = {
      bankName: profile?.bank_name || '',
      accountNumber: profile?.account_number || '',
      accountHolder: profile?.account_holder || '',
    };

    // 문서 번호 생성
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: docNumber } = await (supabase as any).rpc('generate_document_number', {
      p_user_id: user.id,
      p_prefix: 'I',
      p_table_name: 'invoices',
    });

    // 인보이스 데이터 생성
    let invoiceData;
    try {
      invoiceData = {
        ...createInvoiceFromContract(
          {
            id: contract.id,
            clientId: contract.client_id,
            projectName: contract.project_name,
            paymentSchedule: contract.payment_schedule,
          },
          scheduleId,
          paymentInfo
        ),
        user_id: user.id,
        document_number: docNumber || `I-${Date.now()}`,
      };
    } catch (err) {
      return NextResponse.json({ error: (err as Error).message }, { status: 400 });
    }

    // 인보이스 생성
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: invoice, error: invoiceError } = await (supabase as any)
      .from('invoices')
      .insert(invoiceData)
      .select()
      .single();

    if (invoiceError) {
      console.error('Failed to create invoice:', invoiceError);
      return NextResponse.json({ error: '인보이스 생성에 실패했습니다' }, { status: 500 });
    }

    // 계약서 결제 일정 상태 업데이트
    const updatedSchedule = contract.payment_schedule.map((s: { id: string }) =>
      s.id === scheduleId ? { ...s, status: 'invoiced', invoiceId: invoice.id } : s
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('contracts')
      .update({ payment_schedule: updatedSchedule })
      .eq('id', contractId);

    // 공개 토큰 생성
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('public_tokens')
      .insert({
        user_id: user.id,
        document_type: 'invoice',
        document_id: invoice.id,
        token: generatePublicToken(),
      });

    // 이벤트 로그
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('document_events')
      .insert({
        user_id: user.id,
        document_type: 'invoice',
        document_id: invoice.id,
        event_type: 'created',
        description: `계약서 ${contract.document_number}에서 생성`,
        metadata: { from_contract_id: contractId, schedule_id: scheduleId },
      });

    return NextResponse.json({ invoice }, { status: 201 });
  } catch (error) {
    console.error('Create invoice from contract error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}

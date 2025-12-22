/**
 * 계약서 API - 상세 조회
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/contracts/:id - 계약서 상세 조회
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: contract, error } = await (supabase as any)
      .from('contracts')
      .select('*, clients(*), quotes(*)')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: '계약서를 찾을 수 없습니다' }, { status: 404 });
      }
      console.error('Failed to fetch contract:', error);
      return NextResponse.json({ error: '계약서를 불러오지 못했습니다' }, { status: 500 });
    }

    // 연결된 인보이스 조회
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: invoices } = await (supabase as any)
      .from('invoices')
      .select('*')
      .eq('contract_id', id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    return NextResponse.json({
      contract,
      invoices: invoices || [],
    });
  } catch (error) {
    console.error('Get contract error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}

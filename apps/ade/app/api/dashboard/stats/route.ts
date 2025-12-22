/**
 * 대시보드 통계 API
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    // 이번 달 범위
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // 병렬로 모든 통계 조회
    const [quotesResult, contractsResult, invoicesResult, taxInvoicesResult] = await Promise.all([
      // 이번 달 견적서
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any)
        .from('quotes')
        .select('id, status, total_amount, created_at')
        .eq('user_id', user.id)
        .gte('created_at', startOfMonth.toISOString())
        .lte('created_at', endOfMonth.toISOString()),

      // 이번 달 계약서
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any)
        .from('contracts')
        .select('id, status, total_amount, created_at')
        .eq('user_id', user.id)
        .gte('created_at', startOfMonth.toISOString())
        .lte('created_at', endOfMonth.toISOString()),

      // 이번 달 인보이스
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any)
        .from('invoices')
        .select('id, payment_status, total_amount, due_date, created_at')
        .eq('user_id', user.id)
        .gte('created_at', startOfMonth.toISOString())
        .lte('created_at', endOfMonth.toISOString()),

      // 이번 달 세금계산서
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any)
        .from('tax_invoices')
        .select('id, nts_status, total_amount, created_at')
        .eq('user_id', user.id)
        .gte('created_at', startOfMonth.toISOString())
        .lte('created_at', endOfMonth.toISOString()),
    ]);

    const quotes = quotesResult.data || [];
    const contracts = contractsResult.data || [];
    const invoices = invoicesResult.data || [];
    const taxInvoices = taxInvoicesResult.data || [];

    // 이번 달 매출 (결제 완료된 인보이스)
    const thisMonthRevenue = invoices
      .filter((inv: { payment_status: string }) => inv.payment_status === 'paid')
      .reduce((sum: number, inv: { total_amount: number }) => sum + inv.total_amount, 0);

    // 미결 항목 계산
    const quotesToApprove = quotes.filter(
      (q: { status: string }) => ['sent', 'viewed'].includes(q.status)
    ).length;

    const contractsToSign = contracts.filter(
      (c: { status: string }) => c.status === 'sent'
    ).length;

    const invoicesToPay = invoices.filter(
      (inv: { payment_status: string }) => inv.payment_status === 'pending'
    ).length;

    const overdueInvoices = invoices.filter(
      (inv: { payment_status: string; due_date: string }) =>
        inv.payment_status !== 'paid' && new Date(inv.due_date) < now
    ).length;

    // 최근 문서 조회 (모든 타입에서 최근 10개)
    const [recentQuotes, recentContracts, recentInvoices] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any)
        .from('quotes')
        .select('id, document_number, status, total_amount, created_at, clients(name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5),

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any)
        .from('contracts')
        .select('id, document_number, status, total_amount, created_at, clients(name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5),

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any)
        .from('invoices')
        .select('id, document_number, payment_status, total_amount, created_at, clients(name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

    // 최근 문서 합치고 정렬
    type RecentDoc = {
      id: string;
      type: 'quote' | 'contract' | 'invoice';
      document_number: string;
      status: string;
      total_amount: number;
      created_at: string;
      client_name: string;
    };

    const recentDocuments: RecentDoc[] = [
      ...(recentQuotes.data || []).map((q: { id: string; document_number: string; status: string; total_amount: number; created_at: string; clients?: { name: string } }) => ({
        id: q.id,
        type: 'quote' as const,
        document_number: q.document_number,
        status: q.status,
        total_amount: q.total_amount,
        created_at: q.created_at,
        client_name: q.clients?.name || '고객 미지정',
      })),
      ...(recentContracts.data || []).map((c: { id: string; document_number: string; status: string; total_amount: number; created_at: string; clients?: { name: string } }) => ({
        id: c.id,
        type: 'contract' as const,
        document_number: c.document_number,
        status: c.status,
        total_amount: c.total_amount,
        created_at: c.created_at,
        client_name: c.clients?.name || '고객 미지정',
      })),
      ...(recentInvoices.data || []).map((i: { id: string; document_number: string; payment_status: string; total_amount: number; created_at: string; clients?: { name: string } }) => ({
        id: i.id,
        type: 'invoice' as const,
        document_number: i.document_number,
        status: i.payment_status,
        total_amount: i.total_amount,
        created_at: i.created_at,
        client_name: i.clients?.name || '고객 미지정',
      })),
    ]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10);

    return NextResponse.json({
      thisMonth: {
        quotes: quotes.length,
        contracts: contracts.filter((c: { status: string }) => c.status === 'approved').length,
        invoices: invoices.length,
        taxInvoices: taxInvoices.length,
        revenue: thisMonthRevenue,
      },
      pending: {
        quotesToApprove,
        contractsToSign,
        invoicesToPay,
        overdueInvoices,
      },
      recentDocuments,
    });
  } catch (error) {
    console.error('Dashboard stats API error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}

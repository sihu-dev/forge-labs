/**
 * Workflows API
 * n8n 워크플로우 관리
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// n8n API 설정
const N8N_API_URL = process.env.N8N_API_URL || 'http://localhost:5678/api/v1';
const N8N_API_KEY = process.env.N8N_API_KEY;

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 쿼리 파라미터
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');

    // DB에서 워크플로우 메타데이터 조회
    let query = supabase.from('workflows').select('*');

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: workflows, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch workflows:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ workflows: workflows || [] });
  } catch (error) {
    console.error('Failed to fetch workflows:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, workflowId } = body;

    if (action === 'run') {
      // n8n 워크플로우 실행
      const { data: workflow } = await supabase
        .from('workflows')
        .select('n8n_workflow_id, webhook_url')
        .eq('id', workflowId)
        .single();

      if (!workflow) {
        return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
      }

      if (workflow.webhook_url) {
        // Webhook 트리거
        const response = await fetch(workflow.webhook_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ triggeredBy: user.id, timestamp: new Date().toISOString() }),
        });

        if (!response.ok) {
          throw new Error('Failed to trigger webhook');
        }
      } else if (N8N_API_KEY) {
        // n8n API 직접 호출
        const response = await fetch(`${N8N_API_URL}/workflows/${workflow.n8n_workflow_id}/execute`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-N8N-API-KEY': N8N_API_KEY,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to execute workflow');
        }
      }

      // 실행 기록 저장
      await supabase.from('workflow_executions').insert({
        workflow_id: workflowId,
        status: 'pending',
        started_at: new Date().toISOString(),
        triggered_by: user.id,
      });

      return NextResponse.json({ success: true, message: 'Workflow triggered' });
    }

    if (action === 'toggle') {
      // 워크플로우 상태 토글
      const { data: workflow } = await supabase
        .from('workflows')
        .select('status')
        .eq('id', workflowId)
        .single();

      if (!workflow) {
        return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
      }

      const newStatus = workflow.status === 'active' ? 'paused' : 'active';

      await supabase
        .from('workflows')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', workflowId);

      return NextResponse.json({ success: true, status: newStatus });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Failed to process workflow action:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

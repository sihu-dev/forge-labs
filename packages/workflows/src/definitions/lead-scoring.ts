/**
 * AI 기반 리드 스코어링 워크플로우
 *
 * 스케줄러 트리거 → 미평가 리드 조회 → AI 스코어링 → 업데이트
 */

import type { IWorkflowDefinition } from '../types.js';

export const leadScoringWorkflow: IWorkflowDefinition = {
  id: 'lead-scoring-v1',
  name: 'AI Lead Scoring',
  active: true,
  tags: ['bidflow', 'lead-management', 'ai', 'automation'],
  nodes: [
    // 1. 스케줄 트리거 (매 시간)
    {
      id: 'schedule-trigger',
      name: 'Schedule Trigger',
      type: 'n8n-nodes-base.cron',
      typeVersion: 1,
      position: [250, 300],
      parameters: {
        triggerTimes: {
          item: [
            {
              mode: 'everyHour',
            },
          ],
        },
      },
    },

    // 2. 미평가 리드 조회
    {
      id: 'fetch-unscored-leads',
      name: 'Fetch Unscored Leads',
      type: 'n8n-nodes-base.supabase',
      typeVersion: 1,
      position: [450, 300],
      credentials: {
        supabaseApi: {
          id: 'supabase-default',
          name: 'Supabase API',
        },
      },
      parameters: {
        operation: 'getAll',
        tableId: 'bidflow_leads',
        returnAll: false,
        limit: 50,
        filters: {
          conditions: [
            {
              keyName: 'score',
              condition: 'isNull',
            },
            {
              keyName: 'status',
              condition: 'equals',
              value: 'enriched',
            },
          ],
        },
        sort: [
          {
            keyName: 'created_at',
            direction: 'desc',
          },
        ],
      },
    },

    // 3. 리드 스코어링 (Claude)
    {
      id: 'score-leads',
      name: 'AI Lead Scoring',
      type: 'n8n-nodes-base.anthropic',
      typeVersion: 1,
      position: [650, 300],
      credentials: {
        anthropicApi: {
          id: 'anthropic-default',
          name: 'Anthropic API',
        },
      },
      parameters: {
        model: 'claude-3-5-haiku-20241022',
        systemPrompt: `You are a lead qualification expert for BIDFLOW (입찰 자동화 플랫폼).

Score leads from 0-100 based on:
1. Company Fit (0-30)
   - Industry relevance (건설, 제조, IT 서비스 = high)
   - Company size (중소기업 = high, 영세 = low)
   - Business model (B2B, B2B2C = high)

2. Buying Intent (0-30)
   - Website quality (있음 = +10)
   - Contact role (대표, 실무책임자 = high)
   - Inquiry detail (구체적 = high)

3. Financial Capacity (0-20)
   - Revenue estimate (high revenue = high score)
   - Growth stage (growth, mature = high)

4. Engagement Potential (0-20)
   - Response likelihood (메일, 전화 모두 있음 = high)
   - Technology adoption (tech stack 있음 = high)

Return JSON ONLY:
{
  "score": number (0-100),
  "tier": "S" | "A" | "B" | "C" | "D",
  "reasoning": string (3-5 bullet points),
  "recommended_actions": string[] (next steps),
  "red_flags": string[] (concerns if any),
  "estimated_close_probability": number (0-100)
}

Tier mapping:
- S: 90-100 (Ideal customer)
- A: 70-89 (Strong fit)
- B: 50-69 (Moderate fit)
- C: 30-49 (Low fit)
- D: 0-29 (Poor fit)`,
        messages: {
          values: [
            {
              role: 'user',
              content: `Score this lead:

Company: {{ $json.company_name }}
Industry: {{ $json.enrichment.industry_category }}
Size: {{ $json.enrichment.company_size }} ({{ $json.enrichment.estimated_employees || "unknown" }} employees)
Business Model: {{ $json.enrichment.business_model }}
Revenue: {{ $json.enrichment.annual_revenue_estimate || "unknown" }}
Growth Stage: {{ $json.enrichment.growth_stage }}
Target Market: {{ $json.enrichment.target_market }}
Technology: {{ $json.enrichment.technology_stack.join(", ") || "unknown" }}

Contact: {{ $json.contact_name || "Unknown" }} ({{ $json.contact_email }})
Phone: {{ $json.phone || "N/A" }}
Website: {{ $json.website || "N/A" }}
Source: {{ $json.source }}

Key Products: {{ $json.enrichment.key_products.join(", ") || "N/A" }}
Competitive Advantages: {{ $json.enrichment.competitive_advantages.join(", ") || "N/A" }}

Notes: {{ $json.notes || "None" }}`,
            },
          ],
        },
        options: {
          temperature: 0.2,
          maxTokens: 1000,
        },
      },
    },

    // 4. 스코어 파싱 및 병합
    {
      id: 'parse-score',
      name: 'Parse Score Data',
      type: 'n8n-nodes-base.code',
      typeVersion: 1,
      position: [850, 300],
      parameters: {
        jsCode: `
const lead = $('Fetch Unscored Leads').item.json;
const aiResponse = $input.item.json.content[0].text;

let scoreData;
try {
  const jsonMatch = aiResponse.match(/\\\{[\\s\\S]*\\\}/);
  scoreData = JSON.parse(jsonMatch ? jsonMatch[0] : aiResponse);
} catch (error) {
  console.error('Failed to parse AI response:', error);
  scoreData = {
    score: 50,
    tier: 'B',
    reasoning: 'Auto-scored due to parsing error',
    recommended_actions: [],
    red_flags: ['AI parsing failed'],
    estimated_close_probability: 50,
  };
}

// 점수 검증
const score = Math.max(0, Math.min(100, scoreData.score || 50));

return {
  id: lead.id,
  score: score,
  score_tier: scoreData.tier || 'B',
  score_reasoning: scoreData.reasoning || '',
  recommended_actions: scoreData.recommended_actions || [],
  red_flags: scoreData.red_flags || [],
  close_probability: scoreData.estimated_close_probability || 50,
  scored_at: new Date().toISOString(),
  status: 'scored',
};
        `,
      },
    },

    // 5. 데이터베이스 업데이트
    {
      id: 'update-lead-score',
      name: 'Update Lead Score',
      type: 'n8n-nodes-base.supabase',
      typeVersion: 1,
      position: [1050, 300],
      credentials: {
        supabaseApi: {
          id: 'supabase-default',
          name: 'Supabase API',
        },
      },
      parameters: {
        operation: 'update',
        tableId: 'bidflow_leads',
        filterType: 'manual',
        matchCase: 'all',
        conditions: {
          conditions: [
            {
              keyName: 'id',
              condition: 'equals',
              value: '={{ $json.id }}',
            },
          ],
        },
      },
    },

    // 6. 고득점 리드 알림 (Tier S, A)
    {
      id: 'filter-high-score',
      name: 'Filter High Score Leads',
      type: 'n8n-nodes-base.if',
      typeVersion: 1,
      position: [1250, 300],
      parameters: {
        conditions: {
          conditions: [
            {
              leftValue: '={{ $json.score_tier }}',
              operation: 'regex',
              rightValue: '^[SA]$',
            },
          ],
        },
      },
    },

    // 7. Slack 알림
    {
      id: 'notify-slack',
      name: 'Notify High-Value Lead',
      type: 'n8n-nodes-base.slack',
      typeVersion: 1,
      position: [1450, 200],
      credentials: {
        slackApi: {
          id: 'slack-default',
          name: 'Slack API',
        },
      },
      parameters: {
        channel: '#bidflow-leads',
        text: `🎯 고득점 리드 발견!

**Tier {{ $json.score_tier }}** (점수: {{ $json.score }}/100)
회사: {{ $('Fetch Unscored Leads').item.json.company_name }}
담당자: {{ $('Fetch Unscored Leads').item.json.contact_name }}
이메일: {{ $('Fetch Unscored Leads').item.json.contact_email }}
예상 계약 확률: {{ $json.close_probability }}%

**추천 액션:**
{{ $json.recommended_actions.join("\\n") }}

**주의사항:**
{{ $json.red_flags.join("\\n") || "없음" }}

상세보기: https://bidflow.forge-labs.io/leads/{{ $json.id }}`,
        attachments: [],
        otherOptions: {},
      },
    },
  ],

  connections: {
    'Schedule Trigger': {
      main: [[{ node: 'Fetch Unscored Leads', type: 'main', index: 0 }]],
    },
    'Fetch Unscored Leads': {
      main: [[{ node: 'AI Lead Scoring', type: 'main', index: 0 }]],
    },
    'AI Lead Scoring': {
      main: [[{ node: 'Parse Score Data', type: 'main', index: 0 }]],
    },
    'Parse Score Data': {
      main: [[{ node: 'Update Lead Score', type: 'main', index: 0 }]],
    },
    'Update Lead Score': {
      main: [[{ node: 'Filter High Score Leads', type: 'main', index: 0 }]],
    },
    'Filter High Score Leads': {
      main: [[{ node: 'Notify High-Value Lead', type: 'main', index: 0 }]],
    },
  },

  settings: {
    executionOrder: 'v1',
    saveDataErrorExecution: 'all',
    saveDataSuccessExecution: 'none',
    saveExecutionProgress: false,
    saveManualExecutions: false,
    timezone: 'Asia/Seoul',
    executionTimeout: 600,
  },
};

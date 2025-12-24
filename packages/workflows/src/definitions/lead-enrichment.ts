/**
 * 리드 데이터 강화 워크플로우
 *
 * 웹훅으로 리드 정보 수신 → AI 분석 → 데이터베이스 저장
 */

import type { IWorkflowDefinition } from '../types.js';

export const leadEnrichmentWorkflow: IWorkflowDefinition = {
  id: 'lead-enrichment-v1',
  name: 'Lead Data Enrichment',
  active: true,
  tags: ['bidflow', 'lead-management', 'ai'],
  nodes: [
    // 1. 웹훅 트리거
    {
      id: 'webhook-trigger',
      name: 'Webhook Trigger',
      type: 'n8n-nodes-base.webhook',
      typeVersion: 1,
      position: [250, 300],
      webhookId: 'lead-enrichment',
      parameters: {
        path: 'lead-enrichment',
        httpMethod: 'POST',
        responseMode: 'lastNode',
        options: {},
      },
    },

    // 2. 리드 데이터 검증
    {
      id: 'validate-lead',
      name: 'Validate Lead Data',
      type: 'n8n-nodes-base.code',
      typeVersion: 1,
      position: [450, 300],
      parameters: {
        jsCode: `
const lead = $input.item.json;

// 필수 필드 검증
const required = ['company_name', 'contact_email'];
const missing = required.filter(field => !lead[field]);

if (missing.length > 0) {
  throw new Error(\`Missing required fields: \${missing.join(', ')}\`);
}

// 이메일 형식 검증
const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
if (!emailRegex.test(lead.contact_email)) {
  throw new Error('Invalid email format');
}

// 정규화된 데이터 반환
return {
  company_name: lead.company_name.trim(),
  contact_email: lead.contact_email.toLowerCase().trim(),
  contact_name: lead.contact_name?.trim() || null,
  phone: lead.phone?.replace(/[^0-9+]/g, '') || null,
  website: lead.website?.trim() || null,
  industry: lead.industry || 'Unknown',
  source: lead.source || 'Direct',
  notes: lead.notes || '',
  received_at: new Date().toISOString(),
};
        `,
      },
    },

    // 3. 회사 정보 강화 (OpenAI)
    {
      id: 'enrich-company',
      name: 'Enrich Company Info',
      type: 'n8n-nodes-base.openAi',
      typeVersion: 1,
      position: [650, 300],
      credentials: {
        openAiApi: {
          id: 'openai-default',
          name: 'OpenAI API',
        },
      },
      parameters: {
        operation: 'message',
        model: 'gpt-4o-mini',
        messages: {
          values: [
            {
              role: 'system',
              content: `You are a business intelligence analyst. Extract and structure company information.

Return JSON only with this schema:
{
  "company_size": "startup" | "small" | "medium" | "large" | "enterprise",
  "estimated_employees": number (estimate),
  "industry_category": string (specific industry),
  "technology_stack": string[] (if website available),
  "business_model": "B2B" | "B2C" | "B2B2C" | "Unknown",
  "target_market": "domestic" | "global" | "unknown",
  "annual_revenue_estimate": string (range like "$1M-$5M"),
  "growth_stage": "seed" | "growth" | "mature" | "unknown",
  "key_products": string[] (main offerings),
  "competitive_advantages": string[] (unique strengths)
}`,
            },
            {
              role: 'user',
              content: `Analyze this company and return structured data:

Company: {{ $json.company_name }}
Website: {{ $json.website || "N/A" }}
Industry: {{ $json.industry }}
Contact: {{ $json.contact_name }} ({{ $json.contact_email }})
Notes: {{ $json.notes || "None" }}

Provide detailed intelligence based on available information.`,
            },
          ],
        },
        options: {
          temperature: 0.3,
          maxTokens: 1000,
        },
      },
    },

    // 4. AI 응답 파싱
    {
      id: 'parse-enrichment',
      name: 'Parse AI Response',
      type: 'n8n-nodes-base.code',
      typeVersion: 1,
      position: [850, 300],
      parameters: {
        jsCode: `
const lead = $('Validate Lead Data').item.json;
const aiResponse = $input.item.json.message.content;

let enrichedData;
try {
  // JSON 블록 추출
  const jsonMatch = aiResponse.match(/\\\{[\\s\\S]*\\\}/);
  enrichedData = JSON.parse(jsonMatch ? jsonMatch[0] : aiResponse);
} catch (error) {
  console.error('Failed to parse AI response:', error);
  enrichedData = {};
}

// 리드 데이터와 병합
return {
  ...lead,
  enrichment: {
    company_size: enrichedData.company_size || 'unknown',
    estimated_employees: enrichedData.estimated_employees || null,
    industry_category: enrichedData.industry_category || lead.industry,
    technology_stack: enrichedData.technology_stack || [],
    business_model: enrichedData.business_model || 'Unknown',
    target_market: enrichedData.target_market || 'unknown',
    annual_revenue_estimate: enrichedData.annual_revenue_estimate || null,
    growth_stage: enrichedData.growth_stage || 'unknown',
    key_products: enrichedData.key_products || [],
    competitive_advantages: enrichedData.competitive_advantages || [],
    enriched_at: new Date().toISOString(),
  },
  status: 'enriched',
};
        `,
      },
    },

    // 5. Supabase 저장
    {
      id: 'save-to-db',
      name: 'Save to Database',
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
        operation: 'insert',
        tableId: 'bidflow_leads',
        options: {
          upsert: true,
          onConflict: 'contact_email',
        },
      },
    },

    // 6. 성공 응답
    {
      id: 'success-response',
      name: 'Success Response',
      type: 'n8n-nodes-base.set',
      typeVersion: 1,
      position: [1250, 300],
      parameters: {
        values: {
          values: [
            {
              name: 'status',
              value: 'success',
            },
            {
              name: 'message',
              value: 'Lead enriched and saved successfully',
            },
            {
              name: 'lead_id',
              value: '={{ $json.id }}',
            },
            {
              name: 'company_name',
              value: '={{ $json.company_name }}',
            },
            {
              name: 'enrichment_data',
              value: '={{ $json.enrichment }}',
            },
          ],
        },
        options: {},
      },
    },
  ],

  connections: {
    'Webhook Trigger': {
      main: [[{ node: 'Validate Lead Data', type: 'main', index: 0 }]],
    },
    'Validate Lead Data': {
      main: [[{ node: 'Enrich Company Info', type: 'main', index: 0 }]],
    },
    'Enrich Company Info': {
      main: [[{ node: 'Parse AI Response', type: 'main', index: 0 }]],
    },
    'Parse AI Response': {
      main: [[{ node: 'Save to Database', type: 'main', index: 0 }]],
    },
    'Save to Database': {
      main: [[{ node: 'Success Response', type: 'main', index: 0 }]],
    },
  },

  settings: {
    executionOrder: 'v1',
    saveDataErrorExecution: 'all',
    saveDataSuccessExecution: 'all',
    saveExecutionProgress: true,
    saveManualExecutions: true,
    timezone: 'Asia/Seoul',
    executionTimeout: 300,
  },

  meta: {
    templateCredsSetupCompleted: true,
  },
};

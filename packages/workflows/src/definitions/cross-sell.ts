/**
 * BIDFLOW ↔ HEPHAITOS 크로스셀 워크플로우
 *
 * BIDFLOW 리드 → HEPHAITOS 온보딩 제안
 * HEPHAITOS 사용자 → BIDFLOW 추천
 */

import type { IWorkflowDefinition } from '../types.js';

export const crossSellWorkflow: IWorkflowDefinition = {
  id: 'cross-sell-v1',
  name: 'Cross-Sell: BIDFLOW ↔ HEPHAITOS',
  active: true,
  tags: ['bidflow', 'hephaitos', 'cross-sell', 'revenue'],
  nodes: [
    // 1. 스케줄 트리거 (매일 오후 3시)
    {
      id: 'daily-trigger',
      name: 'Daily 3PM Trigger',
      type: 'n8n-nodes-base.cron',
      typeVersion: 1,
      position: [250, 300],
      parameters: {
        triggerTimes: {
          item: [
            {
              mode: 'custom',
              cronExpression: '0 15 * * *',
            },
          ],
        },
      },
    },

    // 2. BIDFLOW → HEPHAITOS 후보 조회
    {
      id: 'fetch-bidflow-for-hephaitos',
      name: 'BIDFLOW → HEPHAITOS Candidates',
      type: 'n8n-nodes-base.supabase',
      typeVersion: 1,
      position: [450, 200],
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
              keyName: 'score_tier',
              condition: 'equals',
              value: 'A',
            },
            {
              keyName: 'status',
              condition: 'equals',
              value: 'customer',
            },
            {
              keyName: 'cross_sell_offered',
              condition: 'isNull',
            },
          ],
        },
      },
    },

    // 3. 크로스셀 적합성 분석
    {
      id: 'analyze-cross-sell-fit',
      name: 'Analyze Cross-Sell Fit',
      type: 'n8n-nodes-base.code',
      typeVersion: 1,
      position: [650, 200],
      parameters: {
        jsCode: `
const lead = $input.item.json;

// 크로스셀 점수 계산
let crossSellScore = 0;
const reasons = [];

// 1. 업종 적합성 (금융, 투자 관련)
const financeIndustries = ['금융', 'investment', 'trading', 'finance', '자산관리'];
if (financeIndustries.some(keyword =>
  lead.enrichment?.industry_category?.toLowerCase().includes(keyword.toLowerCase())
)) {
  crossSellScore += 30;
  reasons.push('금융/투자 관련 업종');
}

// 2. 기업 규모 (중형 이상)
if (['medium', 'large', 'enterprise'].includes(lead.enrichment?.company_size)) {
  crossSellScore += 25;
  reasons.push('중형 이상 기업 (투자 여력 높음)');
}

// 3. 기술 친화도
if (lead.enrichment?.technology_stack?.length > 3) {
  crossSellScore += 20;
  reasons.push('높은 기술 친화도');
}

// 4. 비즈니스 모델 (B2B, B2B2C)
if (['B2B', 'B2B2C'].includes(lead.enrichment?.business_model)) {
  crossSellScore += 15;
  reasons.push('B2B 비즈니스 모델');
}

// 5. 수익 규모
if (lead.enrichment?.annual_revenue_estimate?.includes('M') ||
    lead.enrichment?.annual_revenue_estimate?.includes('억')) {
  crossSellScore += 10;
  reasons.push('높은 연매출');
}

// 크로스셀 추천 여부
const recommendCrossSell = crossSellScore >= 50;

return {
  ...lead,
  cross_sell_score: crossSellScore,
  cross_sell_reasons: reasons,
  recommend_cross_sell: recommendCrossSell,
  target_product: 'HEPHAITOS',
  analyzed_at: new Date().toISOString(),
};
        `,
      },
    },

    // 4. 높은 점수만 필터링
    {
      id: 'filter-high-score',
      name: 'Filter High Cross-Sell Score',
      type: 'n8n-nodes-base.if',
      typeVersion: 1,
      position: [850, 200],
      parameters: {
        conditions: {
          conditions: [
            {
              leftValue: '={{ $json.recommend_cross_sell }}',
              operation: 'equal',
              rightValue: true,
            },
          ],
        },
      },
    },

    // 5. 크로스셀 이메일 생성
    {
      id: 'generate-cross-sell-email',
      name: 'Generate Cross-Sell Email',
      type: 'n8n-nodes-base.openAi',
      typeVersion: 1,
      position: [1050, 200],
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
              content: `You are a sales copywriter for FORGE LABS.
Write a personalized cross-sell email proposing HEPHAITOS to BIDFLOW customers.

HEPHAITOS: AI 트레이딩 플랫폼 (No-Code 전략 빌더, 백테스트, 실계좌 연동)
BIDFLOW: 입찰 자동화 플랫폼

Tone: Professional, consultative, benefit-focused
Length: 150-200 words
Format: Korean, plain text`,
            },
            {
              role: 'user',
              content: `Write cross-sell email for:

Company: {{ $json.company_name }}
Industry: {{ $json.enrichment.industry_category }}
Contact: {{ $json.contact_name }}
Current Product: BIDFLOW
Cross-Sell Reasons: {{ $json.cross_sell_reasons.join(", ") }}

Highlight:
1. Diversification opportunity (입찰 외 수익원 다각화)
2. AI automation synergy (BIDFLOW 자동화 + HEPHAITOS 트레이딩)
3. Special offer for existing customers (20% discount)`,
            },
          ],
        },
        options: {
          temperature: 0.7,
          maxTokens: 500,
        },
      },
    },

    // 6. 이메일 발송
    {
      id: 'send-cross-sell-email',
      name: 'Send Cross-Sell Email',
      type: 'n8n-nodes-base.gmail',
      typeVersion: 1,
      position: [1250, 200],
      credentials: {
        gmailOAuth2: {
          id: 'gmail-default',
          name: 'Gmail OAuth2',
        },
      },
      parameters: {
        operation: 'send',
        to: '={{ $("BIDFLOW → HEPHAITOS Candidates").item.json.contact_email }}',
        subject: 'BIDFLOW 고객님께 특별 제안: HEPHAITOS AI 트레이딩',
        message: '={{ $json.message.content }}',
        options: {
          bccList: 'sales@forge-labs.io',
        },
      },
    },

    // 7. 크로스셀 기록
    {
      id: 'log-cross-sell',
      name: 'Log Cross-Sell Offer',
      type: 'n8n-nodes-base.supabase',
      typeVersion: 1,
      position: [1450, 200],
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
        conditions: {
          conditions: [
            {
              keyName: 'id',
              condition: 'equals',
              value: '={{ $("BIDFLOW → HEPHAITOS Candidates").item.json.id }}',
            },
          ],
        },
        fieldsUi: {
          values: [
            {
              fieldName: 'cross_sell_offered',
              fieldValue: 'hephaitos',
            },
            {
              fieldName: 'cross_sell_score',
              fieldValue: '={{ $("Analyze Cross-Sell Fit").item.json.cross_sell_score }}',
            },
            {
              fieldName: 'cross_sell_offered_at',
              fieldValue: '={{ $now.toISO() }}',
            },
          ],
        },
      },
    },

    // 8. HEPHAITOS → BIDFLOW 후보 조회
    {
      id: 'fetch-hephaitos-for-bidflow',
      name: 'HEPHAITOS → BIDFLOW Candidates',
      type: 'n8n-nodes-base.supabase',
      typeVersion: 1,
      position: [450, 400],
      credentials: {
        supabaseApi: {
          id: 'supabase-default',
          name: 'Supabase API',
        },
      },
      parameters: {
        operation: 'getAll',
        tableId: 'hephaitos_users',
        returnAll: false,
        limit: 50,
        filters: {
          conditions: [
            {
              keyName: 'user_type',
              condition: 'equals',
              value: 'MENTOR',
            },
            {
              keyName: 'status',
              condition: 'equals',
              value: 'ACTIVE',
            },
            {
              keyName: 'cross_sell_offered',
              condition: 'isNull',
            },
          ],
        },
      },
    },

    // 9. 인앱 메시지 생성
    {
      id: 'create-in-app-message',
      name: 'Create In-App Message',
      type: 'n8n-nodes-base.code',
      typeVersion: 1,
      position: [650, 400],
      parameters: {
        jsCode: `
const user = $input.item.json;

return {
  user_id: user.id,
  message_type: 'cross_sell',
  title: '멘토님, BIDFLOW로 추가 수익 창출하세요',
  content: \`안녕하세요 \${user.display_name}님,

HEPHAITOS 멘토로 활동하시면서 입찰 관련 고민이 있으셨나요?

BIDFLOW는 공공입찰 자동화 플랫폼으로, 멘토님께 추가 수익 기회를 제공합니다:

✓ 나라장터/지자체 입찰 공고 자동 매칭
✓ AI 제안서 초안 작성
✓ 입찰 마감일 알림

HEPHAITOS 멘토 특별 혜택:
• 3개월 무료 체험
• 우선 고객 지원

관심 있으시면 [여기]를 클릭해 주세요.\`,
  cta_text: 'BIDFLOW 시작하기',
  cta_url: 'https://bidflow.forge-labs.io/signup?ref=hephaitos&mentor=' + user.id,
  priority: 'medium',
  expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
};
        `,
      },
    },

    // 10. 인앱 메시지 저장
    {
      id: 'save-in-app-message',
      name: 'Save In-App Message',
      type: 'n8n-nodes-base.supabase',
      typeVersion: 1,
      position: [850, 400],
      credentials: {
        supabaseApi: {
          id: 'supabase-default',
          name: 'Supabase API',
        },
      },
      parameters: {
        operation: 'insert',
        tableId: 'hephaitos_notifications',
      },
    },

    // 11. 크로스셀 기록 (HEPHAITOS)
    {
      id: 'log-cross-sell-hephaitos',
      name: 'Log Cross-Sell (HEPHAITOS)',
      type: 'n8n-nodes-base.supabase',
      typeVersion: 1,
      position: [1050, 400],
      credentials: {
        supabaseApi: {
          id: 'supabase-default',
          name: 'Supabase API',
        },
      },
      parameters: {
        operation: 'update',
        tableId: 'hephaitos_users',
        filterType: 'manual',
        conditions: {
          conditions: [
            {
              keyName: 'id',
              condition: 'equals',
              value: '={{ $("HEPHAITOS → BIDFLOW Candidates").item.json.id }}',
            },
          ],
        },
        fieldsUi: {
          values: [
            {
              fieldName: 'cross_sell_offered',
              fieldValue: 'bidflow',
            },
            {
              fieldName: 'cross_sell_offered_at',
              fieldValue: '={{ $now.toISO() }}',
            },
          ],
        },
      },
    },
  ],

  connections: {
    'Daily 3PM Trigger': {
      main: [
        [
          { node: 'BIDFLOW → HEPHAITOS Candidates', type: 'main', index: 0 },
          { node: 'HEPHAITOS → BIDFLOW Candidates', type: 'main', index: 0 },
        ],
      ],
    },
    'BIDFLOW → HEPHAITOS Candidates': {
      main: [[{ node: 'Analyze Cross-Sell Fit', type: 'main', index: 0 }]],
    },
    'Analyze Cross-Sell Fit': {
      main: [[{ node: 'Filter High Cross-Sell Score', type: 'main', index: 0 }]],
    },
    'Filter High Cross-Sell Score': {
      main: [[{ node: 'Generate Cross-Sell Email', type: 'main', index: 0 }]],
    },
    'Generate Cross-Sell Email': {
      main: [[{ node: 'Send Cross-Sell Email', type: 'main', index: 0 }]],
    },
    'Send Cross-Sell Email': {
      main: [[{ node: 'Log Cross-Sell Offer', type: 'main', index: 0 }]],
    },
    'HEPHAITOS → BIDFLOW Candidates': {
      main: [[{ node: 'Create In-App Message', type: 'main', index: 0 }]],
    },
    'Create In-App Message': {
      main: [[{ node: 'Save In-App Message', type: 'main', index: 0 }]],
    },
    'Save In-App Message': {
      main: [[{ node: 'Log Cross-Sell (HEPHAITOS)', type: 'main', index: 0 }]],
    },
  },

  settings: {
    executionOrder: 'v1',
    saveDataErrorExecution: 'all',
    saveDataSuccessExecution: 'none',
    saveExecutionProgress: false,
    saveManualExecutions: false,
    timezone: 'Asia/Seoul',
    executionTimeout: 900,
  },
};

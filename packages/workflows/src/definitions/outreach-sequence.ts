/**
 * 아웃바운드 시퀀스 자동화 워크플로우
 *
 * 스케줄 → 팔로우업 대상 조회 → 이메일/Slack 발송 → 상태 업데이트
 */

import type { IWorkflowDefinition } from '../types.js';

export const outreachSequenceWorkflow: IWorkflowDefinition = {
  id: 'outreach-sequence-v1',
  name: 'Outreach Sequence Automation',
  active: true,
  tags: ['bidflow', 'sales-automation', 'outreach'],
  nodes: [
    // 1. 스케줄 트리거 (매일 오전 9시)
    {
      id: 'daily-trigger',
      name: 'Daily 9AM Trigger',
      type: 'n8n-nodes-base.cron',
      typeVersion: 1,
      position: [250, 300],
      parameters: {
        triggerTimes: {
          item: [
            {
              mode: 'custom',
              cronExpression: '0 9 * * *',
            },
          ],
        },
      },
    },

    // 2. 팔로우업 대상 조회
    {
      id: 'fetch-followup-leads',
      name: 'Fetch Follow-up Leads',
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
        limit: 100,
        filters: {
          conditions: [
            {
              keyName: 'score_tier',
              condition: 'regex',
              value: '^[SAB]$',
            },
            {
              keyName: 'outreach_status',
              condition: 'equals',
              value: 'pending',
            },
            {
              keyName: 'last_contacted_at',
              condition: 'isNull',
            },
          ],
        },
        sort: [
          {
            keyName: 'score',
            direction: 'desc',
          },
        ],
      },
    },

    // 3. 시퀀스 단계 결정
    {
      id: 'determine-sequence',
      name: 'Determine Sequence Step',
      type: 'n8n-nodes-base.code',
      typeVersion: 1,
      position: [650, 300],
      parameters: {
        jsCode: `
const lead = $input.item.json;
const now = new Date();

// 최초 접촉인지 확인
const isFirstContact = !lead.last_contacted_at;

// 시퀀스 단계 결정
let step = 1;
let action = 'initial_email';
let delayDays = 0;

if (!isFirstContact) {
  const lastContact = new Date(lead.last_contacted_at);
  const daysSince = Math.floor((now - lastContact) / (1000 * 60 * 60 * 24));

  if (daysSince >= 7) {
    step = 3;
    action = 'final_followup';
  } else if (daysSince >= 3) {
    step = 2;
    action = 'second_followup';
  } else {
    // 너무 빨리 접촉하지 않음
    return null;
  }
} else {
  step = 1;
  action = 'initial_email';
}

// 이메일 템플릿 선택
const templates = {
  initial_email: {
    subject: \`\${lead.company_name}님, BIDFLOW로 입찰 자동화 하세요\`,
    body: \`안녕하세요 \${lead.contact_name || '담당자'}님,

BIDFLOW는 공공입찰/조달 프로세스를 자동화하는 AI 플랫폼입니다.

귀사(\${lead.company_name})와 같은 \${lead.enrichment?.industry_category || '업종'}에서
평균 60% 이상의 시간 절감 효과를 보고 있습니다.

주요 기능:
• 나라장터/지자체 입찰 공고 자동 매칭
• AI 기반 제안서 초안 작성
• 입찰 마감일 알림 및 관리

15분 데모 미팅으로 귀사에 맞는 활용법을 안내드리겠습니다.

편하신 시간 있으시면 회신 부탁드립니다.

감사합니다.
BIDFLOW 팀\`,
  },
  second_followup: {
    subject: \`Re: \${lead.company_name}님, BIDFLOW 데모 제안\`,
    body: \`안녕하세요 \${lead.contact_name || '담당자'}님,

지난주 안내드린 BIDFLOW 자동화 솔루션 관련하여
추가 정보 전달드립니다.

최근 유사 업종 고객사 성과:
• 월 평균 30개 입찰 기회 발굴
• 제안서 작성 시간 70% 단축
• 낙찰률 25% 향상

관심 있으시면 언제든 연락 주세요.

감사합니다.\`,
  },
  final_followup: {
    subject: \`마지막 안내: BIDFLOW 특별 혜택\`,
    body: \`안녕하세요 \${lead.contact_name || '담당자'}님,

마지막으로 연락드립니다.

이번 달 한정으로 초기 도입 고객사 대상
3개월 무료 체험 프로그램을 운영 중입니다.

관심 없으시면 더 이상 연락드리지 않겠습니다.

감사합니다.
BIDFLOW 팀\`,
  },
};

const template = templates[action];

return {
  ...lead,
  sequence_step: step,
  sequence_action: action,
  email_subject: template.subject,
  email_body: template.body,
  scheduled_at: now.toISOString(),
};
        `,
      },
    },

    // 4. 이메일 발송
    {
      id: 'send-email',
      name: 'Send Email',
      type: 'n8n-nodes-base.gmail',
      typeVersion: 1,
      position: [850, 300],
      credentials: {
        gmailOAuth2: {
          id: 'gmail-default',
          name: 'Gmail OAuth2',
        },
      },
      parameters: {
        operation: 'send',
        to: '={{ $json.contact_email }}',
        subject: '={{ $json.email_subject }}',
        message: '={{ $json.email_body }}',
        options: {
          ccList: '',
          bccList: 'sales@forge-labs.io',
        },
      },
    },

    // 5. 발송 기록 업데이트
    {
      id: 'update-outreach-status',
      name: 'Update Outreach Status',
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
        fieldsUi: {
          values: [
            {
              fieldName: 'outreach_status',
              fieldValue: 'contacted',
            },
            {
              fieldName: 'last_contacted_at',
              fieldValue: '={{ $json.scheduled_at }}',
            },
            {
              fieldName: 'sequence_step',
              fieldValue: '={{ $json.sequence_step }}',
            },
            {
              fieldName: 'sequence_action',
              fieldValue: '={{ $json.sequence_action }}',
            },
          ],
        },
      },
    },

    // 6. 발송 로그 저장
    {
      id: 'log-outreach',
      name: 'Log Outreach Activity',
      type: 'n8n-nodes-base.supabase',
      typeVersion: 1,
      position: [1250, 300],
      credentials: {
        supabaseApi: {
          id: 'supabase-default',
          name: 'Supabase API',
        },
      },
      parameters: {
        operation: 'insert',
        tableId: 'bidflow_outreach_log',
        fieldsUi: {
          values: [
            {
              fieldName: 'lead_id',
              fieldValue: '={{ $json.id }}',
            },
            {
              fieldName: 'action_type',
              fieldValue: 'email',
            },
            {
              fieldName: 'sequence_step',
              fieldValue: '={{ $json.sequence_step }}',
            },
            {
              fieldName: 'subject',
              fieldValue: '={{ $json.email_subject }}',
            },
            {
              fieldName: 'sent_at',
              fieldValue: '={{ $json.scheduled_at }}',
            },
            {
              fieldName: 'status',
              fieldValue: 'sent',
            },
          ],
        },
      },
    },
  ],

  connections: {
    'Daily 9AM Trigger': {
      main: [[{ node: 'Fetch Follow-up Leads', type: 'main', index: 0 }]],
    },
    'Fetch Follow-up Leads': {
      main: [[{ node: 'Determine Sequence Step', type: 'main', index: 0 }]],
    },
    'Determine Sequence Step': {
      main: [[{ node: 'Send Email', type: 'main', index: 0 }]],
    },
    'Send Email': {
      main: [[{ node: 'Update Outreach Status', type: 'main', index: 0 }]],
    },
    'Update Outreach Status': {
      main: [[{ node: 'Log Outreach Activity', type: 'main', index: 0 }]],
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

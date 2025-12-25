/**
 * Bid-to-Lead Automation Workflow
 * 입찰 공고 감지 → 담당자 검색 → 정보 강화 → CRM 저장 → 아웃리치 시작
 *
 * 이 워크플로우는 n8n에서 실행됩니다.
 */

export interface WorkflowConfig {
  triggers: {
    // 입찰 공고 크롤링 완료 시
    onBidCrawled: boolean;
    // 특정 키워드 매칭 시
    onKeywordMatch: boolean;
    // 수동 트리거
    manual: boolean;
  };

  enrichment: {
    // Apollo 사용 여부
    useApollo: boolean;
    // Persana 사용 여부
    usePersana: boolean;
    // 최대 담당자 수
    maxContacts: number;
    // 최소 스코어 (이 점수 이상만 저장)
    minScore: number;
  };

  crm: {
    // CRM 자동 동기화
    autoSync: boolean;
    // 프로바이더
    provider: 'attio' | 'hubspot';
    // 고득점 리드 자동 딜 생성
    autoCreateDeal: boolean;
    dealThreshold: number; // 예: 70점 이상
  };

  outreach: {
    // Apollo 시퀀스 자동 추가
    autoSequence: boolean;
    sequenceId?: string;
    // 이메일 자동 발송
    sendEmail: boolean;
  };
}

/**
 * n8n 워크플로우 JSON 정의
 */
export function generateN8nWorkflow(config: WorkflowConfig) {
  return {
    name: 'BIDFLOW: 입찰 → 리드 자동화',
    nodes: [
      // ========================================
      // Trigger: 입찰 공고 크롤링 완료
      // ========================================
      {
        parameters: {
          httpMethod: 'POST',
          path: 'bid-crawled',
          responseMode: 'onReceived',
          options: {},
        },
        name: 'Webhook: Bid Crawled',
        type: 'n8n-nodes-base.webhook',
        typeVersion: 1,
        position: [250, 300],
        webhookId: '{{WEBHOOK_ID}}',
      },

      // ========================================
      // Step 1: 키워드 매칭 확인
      // ========================================
      {
        parameters: {
          conditions: {
            string: [
              {
                value1: '={{$json["title"]}}',
                operation: 'contains',
                value2: '유량계',
              },
            ],
          },
        },
        name: 'Filter: Keyword Match',
        type: 'n8n-nodes-base.if',
        typeVersion: 1,
        position: [450, 300],
      },

      // ========================================
      // Step 2: Lead Enrichment API 호출
      // ========================================
      {
        parameters: {
          url: '={{$env.BIDFLOW_API_URL}}/api/v1/leads/enrich',
          authentication: 'predefinedCredentialType',
          nodeCredentialType: 'httpHeaderAuth',
          sendHeaders: true,
          headerParameters: {
            parameter: [
              {
                name: 'Authorization',
                value: '=Bearer {{$env.BIDFLOW_API_KEY}}',
              },
            ],
          },
          sendBody: true,
          bodyParameters: {
            parameter: [
              {
                name: 'bidId',
                value: '={{$json["id"]}}',
              },
              {
                name: 'saveToCRM',
                value: config.crm.autoSync,
              },
              {
                name: 'autoSequence',
                value: config.outreach.autoSequence,
              },
            ],
          },
          options: {},
        },
        name: 'HTTP: Enrich Lead',
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 3,
        position: [650, 300],
      },

      // ========================================
      // Step 3: 스코어 필터링
      // ========================================
      {
        parameters: {
          conditions: {
            number: [
              {
                value1: '={{$json["data"]["contacts"][0]["score"]}}',
                operation: 'largerEqual',
                value2: config.enrichment.minScore,
              },
            ],
          },
        },
        name: 'Filter: High Score',
        type: 'n8n-nodes-base.if',
        typeVersion: 1,
        position: [850, 300],
      },

      // ========================================
      // Step 4a: CRM 동기화
      // ========================================
      {
        parameters: {
          url: '={{$env.BIDFLOW_API_URL}}/api/v1/crm/sync',
          authentication: 'predefinedCredentialType',
          nodeCredentialType: 'httpHeaderAuth',
          sendHeaders: true,
          headerParameters: {
            parameter: [
              {
                name: 'Authorization',
                value: '=Bearer {{$env.BIDFLOW_API_KEY}}',
              },
            ],
          },
          sendBody: true,
          bodyParameters: {
            parameter: [
              {
                name: 'provider',
                value: config.crm.provider,
              },
              {
                name: 'leadIds',
                value: '=[{{$json["data"]["contacts"][0]["id"]}}]',
              },
            ],
          },
          options: {},
        },
        name: 'HTTP: Sync to CRM',
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 3,
        position: [1050, 200],
      },

      // ========================================
      // Step 4b: 딜 자동 생성 (고득점)
      // ========================================
      {
        parameters: {
          conditions: {
            number: [
              {
                value1: '={{$json["data"]["contacts"][0]["score"]}}',
                operation: 'largerEqual',
                value2: config.crm.dealThreshold,
              },
            ],
          },
        },
        name: 'Filter: Deal Threshold',
        type: 'n8n-nodes-base.if',
        typeVersion: 1,
        position: [1050, 400],
      },

      // ========================================
      // Step 5: 아웃리치 시퀀스 추가
      // ========================================
      {
        parameters: {
          url: '={{$env.BIDFLOW_API_URL}}/api/v1/apollo/sequence',
          authentication: 'predefinedCredentialType',
          nodeCredentialType: 'httpHeaderAuth',
          sendHeaders: true,
          headerParameters: {
            parameter: [
              {
                name: 'Authorization',
                value: '=Bearer {{$env.BIDFLOW_API_KEY}}',
              },
            ],
          },
          sendBody: true,
          bodyParameters: {
            parameter: [
              {
                name: 'contactId',
                value: '={{$json["data"]["contacts"][0]["id"]}}',
              },
              {
                name: 'sequenceId',
                value: config.outreach.sequenceId || '',
              },
            ],
          },
          options: {},
        },
        name: 'HTTP: Add to Sequence',
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 3,
        position: [1250, 300],
      },

      // ========================================
      // Step 6: Slack 알림
      // ========================================
      {
        parameters: {
          channel: '#bidflow-leads',
          text: `🎯 새 고득점 리드 발견!

조직: {{$json["data"]["organizationName"]}}
담당자: {{$json["data"]["contacts"][0]["name"]}}
직책: {{$json["data"]["contacts"][0]["title"]}}
스코어: {{$json["data"]["contacts"][0]["score"]}}점
이메일: {{$json["data"]["contacts"][0]["email"]}}

입찰: {{$json["title"]}}`,
          otherOptions: {},
        },
        name: 'Slack: Notify',
        type: 'n8n-nodes-base.slack',
        typeVersion: 1,
        position: [1450, 300],
        credentials: {
          slackApi: {
            id: '1',
            name: 'Slack account',
          },
        },
      },
    ],

    connections: {
      'Webhook: Bid Crawled': {
        main: [[{ node: 'Filter: Keyword Match', type: 'main', index: 0 }]],
      },
      'Filter: Keyword Match': {
        main: [[{ node: 'HTTP: Enrich Lead', type: 'main', index: 0 }]],
      },
      'HTTP: Enrich Lead': {
        main: [[{ node: 'Filter: High Score', type: 'main', index: 0 }]],
      },
      'Filter: High Score': {
        main: [
          [
            { node: 'HTTP: Sync to CRM', type: 'main', index: 0 },
            { node: 'Filter: Deal Threshold', type: 'main', index: 0 },
          ],
        ],
      },
      'HTTP: Sync to CRM': {
        main: [[{ node: 'HTTP: Add to Sequence', type: 'main', index: 0 }]],
      },
      'Filter: Deal Threshold': {
        main: [[{ node: 'HTTP: Add to Sequence', type: 'main', index: 0 }]],
      },
      'HTTP: Add to Sequence': {
        main: [[{ node: 'Slack: Notify', type: 'main', index: 0 }]],
      },
    },

    settings: {},
    staticData: null,
    tags: [],
    triggerCount: 0,
    updatedAt: new Date().toISOString(),
    versionId: '1',
  };
}

/**
 * 기본 워크플로우 설정
 */
export const DEFAULT_WORKFLOW_CONFIG: WorkflowConfig = {
  triggers: {
    onBidCrawled: true,
    onKeywordMatch: true,
    manual: true,
  },
  enrichment: {
    useApollo: true,
    usePersana: true,
    maxContacts: 5,
    minScore: 50,
  },
  crm: {
    autoSync: true,
    provider: 'attio',
    autoCreateDeal: true,
    dealThreshold: 70,
  },
  outreach: {
    autoSequence: false, // 처음엔 수동으로
    sendEmail: false,
  },
};

/**
 * CRM 양방향 동기화 워크플로우
 *
 * BIDFLOW ↔ HubSpot/Salesforce 데이터 동기화
 */

import type { IWorkflowDefinition } from '../types.js';

export const crmSyncWorkflow: IWorkflowDefinition = {
  id: 'crm-sync-v1',
  name: 'CRM Bidirectional Sync',
  active: true,
  tags: ['bidflow', 'crm-integration', 'automation'],
  nodes: [
    // 1. 스케줄 트리거 (15분마다)
    {
      id: 'sync-trigger',
      name: 'Every 15min Sync',
      type: 'n8n-nodes-base.cron',
      typeVersion: 1,
      position: [250, 300],
      parameters: {
        triggerTimes: {
          item: [
            {
              mode: 'custom',
              cronExpression: '*/15 * * * *',
            },
          ],
        },
      },
    },

    // 2. BIDFLOW 신규/업데이트 리드 조회
    {
      id: 'fetch-bidflow-leads',
      name: 'Fetch BIDFLOW Leads',
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
        limit: 100,
        filters: {
          conditions: [
            {
              keyName: 'crm_synced_at',
              condition: 'isNull',
            },
          ],
          combine: 'OR',
          conditions2: [
            {
              keyName: 'updated_at',
              condition: 'greaterThan',
              value: '={{ $now.minus({ minutes: 15 }).toISO() }}',
            },
          ],
        },
      },
    },

    // 3. HubSpot 포맷 변환
    {
      id: 'transform-to-hubspot',
      name: 'Transform to HubSpot',
      type: 'n8n-nodes-base.code',
      typeVersion: 1,
      position: [650, 200],
      parameters: {
        jsCode: `
const lead = $input.item.json;

// HubSpot Contact 포맷
return {
  properties: {
    email: lead.contact_email,
    firstname: lead.contact_name?.split(' ')[0] || '',
    lastname: lead.contact_name?.split(' ').slice(1).join(' ') || '',
    phone: lead.phone || '',
    company: lead.company_name,
    website: lead.website || '',
    industry: lead.enrichment?.industry_category || lead.industry,
    lifecyclestage: 'lead',
    hs_lead_status: lead.status === 'scored' ? 'QUALIFIED' : 'NEW',

    // Custom fields
    bidflow_lead_id: lead.id,
    bidflow_score: lead.score || 0,
    bidflow_tier: lead.score_tier || '',
    company_size: lead.enrichment?.company_size || '',
    estimated_employees: lead.enrichment?.estimated_employees || 0,
    annual_revenue_estimate: lead.enrichment?.annual_revenue_estimate || '',
    business_model: lead.enrichment?.business_model || '',
    lead_source: lead.source || 'BIDFLOW',

    // Timestamps
    createdate: lead.created_at,
    lastmodifieddate: lead.updated_at,
  },
  bidflow_id: lead.id,
};
        `,
      },
    },

    // 4. HubSpot Upsert
    {
      id: 'upsert-to-hubspot',
      name: 'Upsert to HubSpot',
      type: 'n8n-nodes-base.hubspot',
      typeVersion: 1,
      position: [850, 200],
      credentials: {
        hubspotApi: {
          id: 'hubspot-default',
          name: 'HubSpot API',
        },
      },
      parameters: {
        resource: 'contact',
        operation: 'upsert',
        email: '={{ $json.properties.email }}',
        additionalFields: {
          properties: '={{ $json.properties }}',
        },
      },
    },

    // 5. 동기화 상태 업데이트
    {
      id: 'update-sync-status',
      name: 'Update Sync Status',
      type: 'n8n-nodes-base.supabase',
      typeVersion: 1,
      position: [1050, 200],
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
              value: '={{ $json.bidflow_id }}',
            },
          ],
        },
        fieldsUi: {
          values: [
            {
              fieldName: 'crm_synced_at',
              fieldValue: '={{ $now.toISO() }}',
            },
            {
              fieldName: 'crm_contact_id',
              fieldValue: '={{ $json.id }}',
            },
            {
              fieldName: 'crm_type',
              fieldValue: 'hubspot',
            },
          ],
        },
      },
    },

    // 6. HubSpot 신규 Contact 조회 (역방향 동기화)
    {
      id: 'fetch-hubspot-contacts',
      name: 'Fetch HubSpot Contacts',
      type: 'n8n-nodes-base.hubspot',
      typeVersion: 1,
      position: [450, 400],
      credentials: {
        hubspotApi: {
          id: 'hubspot-default',
          name: 'HubSpot API',
        },
      },
      parameters: {
        resource: 'contact',
        operation: 'getAll',
        returnAll: false,
        limit: 100,
        filters: {
          filterGroups: [
            {
              filters: [
                {
                  propertyName: 'createdate',
                  operator: 'GTE',
                  value: '={{ $now.minus({ minutes: 15 }).toMillis() }}',
                },
                {
                  propertyName: 'bidflow_lead_id',
                  operator: 'NOT_HAS_PROPERTY',
                },
              ],
            },
          ],
        },
      },
    },

    // 7. BIDFLOW 포맷 변환
    {
      id: 'transform-to-bidflow',
      name: 'Transform to BIDFLOW',
      type: 'n8n-nodes-base.code',
      typeVersion: 1,
      position: [650, 400],
      parameters: {
        jsCode: `
const contact = $input.item.json.properties;

// BIDFLOW Lead 포맷
return {
  company_name: contact.company || 'Unknown',
  contact_email: contact.email,
  contact_name: \`\${contact.firstname || ''} \${contact.lastname || ''}\`.trim() || null,
  phone: contact.phone || null,
  website: contact.website || null,
  industry: contact.industry || 'Unknown',
  source: 'HubSpot CRM',
  notes: \`Imported from HubSpot (ID: \${$input.item.json.id})\`,

  crm_type: 'hubspot',
  crm_contact_id: $input.item.json.id,
  crm_synced_at: new Date().toISOString(),

  status: 'new',
  received_at: new Date().toISOString(),
};
        `,
      },
    },

    // 8. BIDFLOW 저장
    {
      id: 'save-to-bidflow',
      name: 'Save to BIDFLOW',
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
        tableId: 'bidflow_leads',
        options: {
          upsert: true,
          onConflict: 'contact_email',
        },
      },
    },
  ],

  connections: {
    'Every 15min Sync': {
      main: [
        [
          { node: 'Fetch BIDFLOW Leads', type: 'main', index: 0 },
          { node: 'Fetch HubSpot Contacts', type: 'main', index: 0 },
        ],
      ],
    },
    'Fetch BIDFLOW Leads': {
      main: [[{ node: 'Transform to HubSpot', type: 'main', index: 0 }]],
    },
    'Transform to HubSpot': {
      main: [[{ node: 'Upsert to HubSpot', type: 'main', index: 0 }]],
    },
    'Upsert to HubSpot': {
      main: [[{ node: 'Update Sync Status', type: 'main', index: 0 }]],
    },
    'Fetch HubSpot Contacts': {
      main: [[{ node: 'Transform to BIDFLOW', type: 'main', index: 0 }]],
    },
    'Transform to BIDFLOW': {
      main: [[{ node: 'Save to BIDFLOW', type: 'main', index: 0 }]],
    },
  },

  settings: {
    executionOrder: 'v1',
    saveDataErrorExecution: 'all',
    saveDataSuccessExecution: 'none',
    saveExecutionProgress: false,
    saveManualExecutions: false,
    timezone: 'Asia/Seoul',
    executionTimeout: 300,
  },
};

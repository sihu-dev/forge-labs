# @forge/workflows

n8n 워크플로우 정의 및 관리 시스템

## 개요

BIDFLOW 및 FORGE LABS 플랫폼 전반의 자동화 워크플로우를 정의하고 실행하는 패키지입니다. n8n JSON 형식과 호환되며, 이벤트 기반 실행을 지원합니다.

## 워크플로우 목록

### 1. Lead Enrichment (리드 데이터 강화)
- **트리거**: Webhook
- **기능**: 웹훅으로 수신한 리드 정보를 AI로 분석하여 강화
- **노드**:
  1. Webhook Trigger
  2. Validate Lead Data
  3. Enrich Company Info (OpenAI)
  4. Parse AI Response
  5. Save to Database (Supabase)
  6. Success Response
- **사용 사례**: 외부 시스템에서 리드 전송 → 자동 데이터 강화

### 2. Lead Scoring (AI 기반 리드 스코어링)
- **트리거**: Schedule (매 시간)
- **기능**: 미평가 리드를 AI로 스코어링 (0-100점, Tier S/A/B/C/D)
- **노드**:
  1. Schedule Trigger
  2. Fetch Unscored Leads
  3. AI Lead Scoring (Claude)
  4. Parse Score Data
  5. Update Lead Score
  6. Filter High Score Leads
  7. Notify High-Value Lead (Slack)
- **사용 사례**: 자동 리드 품질 평가 및 영업팀 알림

### 3. Outreach Sequence (아웃바운드 시퀀스)
- **트리거**: Schedule (매일 오전 9시)
- **기능**: 3단계 이메일 시퀀스 자동화
- **노드**:
  1. Daily Trigger
  2. Fetch Follow-up Leads
  3. Determine Sequence Step
  4. Send Email (Gmail)
  5. Update Outreach Status
  6. Log Outreach Activity
- **시퀀스**:
  - Step 1: 초기 소개 이메일
  - Step 2: 2차 팔로우업 (3일 후)
  - Step 3: 최종 제안 (7일 후)

### 4. CRM Sync (CRM 양방향 동기화)
- **트리거**: Schedule (15분마다)
- **기능**: BIDFLOW ↔ HubSpot 데이터 양방향 동기화
- **노드**:
  - **BIDFLOW → HubSpot**:
    1. Fetch BIDFLOW Leads
    2. Transform to HubSpot
    3. Upsert to HubSpot
    4. Update Sync Status
  - **HubSpot → BIDFLOW**:
    1. Fetch HubSpot Contacts
    2. Transform to BIDFLOW
    3. Save to BIDFLOW
- **사용 사례**: CRM 데이터 실시간 동기화

### 5. Cross-Sell (크로스셀 자동화)
- **트리거**: Schedule (매일 오후 3시)
- **기능**: BIDFLOW ↔ HEPHAITOS 간 크로스셀 제안
- **노드**:
  - **BIDFLOW → HEPHAITOS**:
    1. Fetch BIDFLOW Customers
    2. Analyze Cross-Sell Fit
    3. Filter High Score
    4. Generate Cross-Sell Email (AI)
    5. Send Email
    6. Log Offer
  - **HEPHAITOS → BIDFLOW**:
    1. Fetch HEPHAITOS Mentors
    2. Create In-App Message
    3. Save Notification
    4. Log Offer
- **사용 사례**: 기존 고객에게 다른 제품 추천

## 사용 방법

### 워크플로우 등록 및 실행

```typescript
import { WorkflowManager, ALL_WORKFLOWS } from '@forge/workflows';

// 매니저 생성
const manager = new WorkflowManager({
  maxConcurrentExecutions: 10,
  executionTimeout: 300000, // 5분
  retryAttempts: 3,
});

// 워크플로우 일괄 등록
manager.registerWorkflows(ALL_WORKFLOWS);

// 수동 실행
const result = await manager.executeWorkflow(
  'lead-enrichment-v1',
  'manual',
  {
    company_name: 'ABC Corp',
    contact_email: 'contact@abc.com',
  }
);

console.log(result);
// {
//   execution_id: 'exec_1234567890_abc',
//   workflow_id: 'lead-enrichment-v1',
//   status: 'success',
//   data: { ... },
//   duration_ms: 2340,
//   nodes_executed: 6,
//   timestamp: '2025-12-24T...'
// }
```

### 웹훅 트리거 설정

```typescript
import {
  validateWebhookPayload,
  createWebhookResponse,
  generateWebhookUrl,
} from '@forge/workflows';

// 웹훅 URL 생성
const url = generateWebhookUrl(
  'https://api.forge-labs.io',
  'lead-enrichment',
  'webhook-trigger'
);
// https://api.forge-labs.io/webhook/lead-enrichment/webhook-trigger

// 페이로드 검증
const validation = validateWebhookPayload(payload, {
  path: 'lead-enrichment',
  method: 'POST',
  authentication: 'headerAuth',
});

if (!validation.valid) {
  throw new Error(validation.error);
}

// 응답 생성
const response = createWebhookResponse(execution, {
  responseMode: 'lastNode',
});
```

### 스케줄 트리거 설정

```typescript
import {
  validateCronExpression,
  getNextExecutionTime,
  cronToHumanReadable,
  COMMON_CRON_PATTERNS,
} from '@forge/workflows';

// Cron 표현식 검증
const validation = validateCronExpression('0 9 * * *');
if (!validation.valid) {
  console.error(validation.error);
}

// 다음 실행 시간 계산
const nextRun = getNextExecutionTime('0 9 * * *', 'Asia/Seoul');
console.log('Next run:', nextRun);

// 사람이 읽을 수 있는 형식
console.log(cronToHumanReadable('0 9 * * *')); // "매일 오전 9시"

// 일반적인 패턴 사용
const everyHour = COMMON_CRON_PATTERNS.EVERY_HOUR; // "0 * * * *"
```

### 이벤트 트리거 설정

```typescript
import {
  publishEvent,
  matchEventPattern,
  applyEventFilter,
  COMMON_EVENTS,
} from '@forge/workflows';

// 이벤트 발행
await publishEvent({
  event: COMMON_EVENTS.LEAD_CREATED,
  source: 'bidflow-api',
  data: {
    lead_id: 'lead_123',
    company_name: 'ABC Corp',
    score_tier: 'A',
  },
  timestamp: new Date().toISOString(),
});

// 패턴 매칭
const matches = matchEventPattern('lead.created', 'lead.*'); // true

// 필터 적용
const shouldTrigger = applyEventFilter(
  {
    event: 'lead.scored',
    data: { score: 85, tier: 'A' },
  },
  {
    score: { $gte: 70 },
    tier: { $in: ['S', 'A'] },
  }
); // true
```

## 워크플로우 타입

### IWorkflowDefinition

```typescript
interface IWorkflowDefinition {
  id: string;
  name: string;
  active: boolean;
  nodes: IWorkflowNode[];
  connections: IWorkflowConnections;
  settings?: IWorkflowSettings;
  tags?: string[];
}
```

### IWorkflowNode

```typescript
interface IWorkflowNode {
  id: string;
  name: string;
  type: string; // 'n8n-nodes-base.webhook', 'n8n-nodes-base.openAi', etc.
  typeVersion: number;
  position: [number, number];
  parameters: Record<string, unknown>;
  credentials?: Record<string, INodeCredential>;
  disabled?: boolean;
}
```

### IWorkflowExecution

```typescript
interface IWorkflowExecution {
  id: UUID;
  workflow_id: string;
  mode: 'manual' | 'trigger' | 'webhook' | 'schedule';
  status: 'running' | 'success' | 'error' | 'waiting' | 'canceled';
  started_at: Timestamp;
  finished_at?: Timestamp;
  data?: IExecutionData;
  error?: string;
}
```

## 통계 및 모니터링

```typescript
// 워크플로우 통계
const stats = manager.getStats();
console.log(stats);
// {
//   total_workflows: 5,
//   active_workflows: 5,
//   total_executions: 234,
//   running_executions: 2,
//   success_rate: 98.5
// }

// 실행 이력 조회
const history = manager.getWorkflowExecutions('lead-enrichment-v1', 10);

// 특정 실행 조회
const execution = manager.getExecution('exec_1234567890_abc');

// 워크플로우 활성화/비활성화
manager.setWorkflowActive('lead-scoring-v1', false);
```

## 에러 핸들링

```typescript
try {
  const result = await manager.executeWorkflow('lead-enrichment-v1', 'manual', data);
} catch (error) {
  console.error('Workflow execution failed:', error);

  // 재시도
  if (result.status === 'error') {
    await manager.retryWorkflow(result.execution_id);
  }
}

// 실행 취소
await manager.cancelWorkflow(executionId);
```

## 개발 가이드

### 새 워크플로우 추가

1. `src/definitions/` 에 새 파일 생성
2. n8n 형식에 맞춰 워크플로우 정의
3. `src/definitions/index.ts` 에 export 추가
4. `ALL_WORKFLOWS` 배열에 추가

### 커스텀 노드 타입 추가

`src/types.ts` 의 `NodeType` 에 추가:

```typescript
export type NodeType =
  | 'n8n-nodes-base.webhook'
  | '@forge/custom.myCustomNode'; // 새 노드
```

## 의존성

- `@forge/types`: 기본 타입 정의
- `@forge/utils`: 유틸리티 함수

## 라이선스

MIT

---

**FORGE LABS** - Building the future of automation

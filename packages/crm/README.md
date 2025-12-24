# @forge/crm

CRM 추상화 레이어 - Attio & HubSpot 지원

## 개요

Strategy 패턴으로 설계된 CRM 프로바이더 추상화 레이어입니다. 현재 Attio를 지원하며, HubSpot은 스케일 시 구현 예정입니다.

## 아키텍처

### Nano-Factor L2 Cells

```
packages/crm/
├── src/
│   ├── interfaces/          # L2 인터페이스
│   │   ├── crm-provider.ts  # 공통 CRM 인터페이스
│   │   ├── lead-manager.ts  # 리드 관리 인터페이스
│   │   ├── deal-manager.ts  # 딜 관리 인터페이스
│   │   └── company-manager.ts # 회사 관리 인터페이스
│   ├── providers/
│   │   ├── attio/           # Attio 구현 (완료)
│   │   │   ├── lead-manager.ts
│   │   │   ├── deal-manager.ts
│   │   │   ├── company-manager.ts
│   │   │   ├── sync-service.ts
│   │   │   └── index.ts
│   │   └── hubspot/         # HubSpot 구현 (Stub)
│   │       ├── lead-manager.ts
│   │       ├── deal-manager.ts
│   │       ├── company-manager.ts
│   │       └── index.ts
│   ├── factory.ts           # CRM 팩토리 (Strategy 패턴)
│   └── index.ts
```

## 설치

```bash
pnpm add @forge/crm
```

## 사용법

### 1. 기본 사용

```typescript
import { CRMFactory } from '@forge/crm';

// CRM 프로바이더 생성
const crm = CRMFactory.create({
  provider: 'attio',
  apiKey: process.env.ATTIO_API_KEY!
});

// 초기화
await crm.initialize();

// 연결 테스트
const connected = await crm.testConnection();
console.log('Connected:', connected);
```

### 2. 환경변수 사용

```bash
# .env
ATTIO_API_KEY=your_api_key_here
```

```typescript
import { CRMFactory } from '@forge/crm';

// 환경변수에서 자동 로드
const crm = CRMFactory.createFromEnv('attio');
await crm.initialize();
```

### 3. 리드 관리

```typescript
// 리드 생성
const lead = await crm.leads.create({
  email: 'john@example.com',
  firstName: 'John',
  lastName: 'Doe',
  company: 'ACME Corp',
  jobTitle: 'CTO',
  source: 'website',
  tags: ['enterprise', 'hot-lead']
});

// 리드 조회
const leadById = await crm.leads.getById(lead.data!.id);
const leadByEmail = await crm.leads.getByEmail('john@example.com');

// 리드 업데이트
const updated = await crm.leads.update(lead.data!.id, {
  status: 'qualified',
  score: 85
});

// 리드 목록 조회 (필터링)
const leads = await crm.leads.list(
  {
    status: ['qualified', 'nurturing'],
    source: ['website'],
    scoreMin: 70
  },
  {
    limit: 50,
    offset: 0
  }
);

// 리드를 딜로 전환
const conversion = await crm.leads.convertToDeal(lead.data!.id, {
  title: 'HEPHAITOS Enterprise Deal',
  value: 10000000
});
```

### 4. 딜 관리

```typescript
// 딜 생성
const deal = await crm.deals.create({
  title: 'HEPHAITOS Enterprise',
  description: 'Enterprise trading platform subscription',
  stage: 'proposal',
  priority: 'high',
  value: 10000000,
  currency: 'KRW',
  probability: 70,
  expectedCloseDate: '2025-03-31',
  tags: ['enterprise', 'trading']
});

// 딜 스테이지 변경
await crm.deals.updateStage(deal.data!.id, 'negotiation');

// 딜 성공 처리
await crm.deals.markAsWon(deal.data!.id);

// 딜 통계 조회
const stats = await crm.deals.getStats({
  stage: ['proposal', 'negotiation']
});

console.log('Win Rate:', stats.data!.winRate);
console.log('Total Value:', stats.data!.totalValue);
```

### 5. 회사 관리

```typescript
// 회사 생성
const company = await crm.companies.create({
  name: 'ACME Corp',
  domain: 'acme.com',
  industry: 'technology',
  size: 'medium',
  website: 'https://acme.com',
  employeeCount: 150,
  annualRevenue: 5000000000,
  currency: 'KRW'
});

// 도메인으로 회사 조회
const companyByDomain = await crm.companies.getByDomain('acme.com');

// 회사 정보 자동 채우기 (enrichment)
const enriched = await crm.companies.enrichByDomain('acme.com');

// 회사의 딜 목록 조회
const deals = await crm.companies.getDeals(company.data!.id);
```

### 6. 동기화 (Attio만 지원)

```typescript
import { AttioProvider } from '@forge/crm';

const attio = new AttioProvider({
  provider: 'attio',
  apiKey: process.env.ATTIO_API_KEY!
});

await attio.initialize();

// 전체 데이터 동기화
const syncResult = await attio.sync.syncAll(['leads', 'deals', 'companies']);

console.log('Synced:', syncResult.data!.syncedRecords);
console.log('Failed:', syncResult.data!.failedRecords);

// 웹훅 설정
await attio.sync.setupWebhook('https://your-app.com/webhooks/attio', [
  'record.created',
  'record.updated',
  'record.deleted'
]);
```

## 인터페이스

### ICRMProvider

```typescript
interface ICRMProvider {
  readonly type: CRMProviderType;
  readonly leads: ILeadManager;
  readonly deals: IDealManager;
  readonly companies: ICompanyManager;
  testConnection(): Promise<boolean>;
  initialize(): Promise<void>;
  dispose(): Promise<void>;
}
```

### ILeadManager

- `create(data)` - 리드 생성
- `getById(id)` - 리드 조회
- `getByEmail(email)` - 이메일로 리드 조회
- `update(id, data)` - 리드 업데이트
- `delete(id)` - 리드 삭제
- `list(filter, pagination)` - 리드 목록 조회
- `updateStatus(id, status)` - 상태 변경
- `updateScore(id, score)` - 점수 업데이트
- `addTags(id, tags)` - 태그 추가
- `removeTags(id, tags)` - 태그 제거
- `convertToDeal(id, dealData)` - 딜로 전환

### IDealManager

- `create(data)` - 딜 생성
- `getById(id)` - 딜 조회
- `update(id, data)` - 딜 업데이트
- `delete(id)` - 딜 삭제
- `list(filter, pagination)` - 딜 목록 조회
- `updateStage(id, stage)` - 스테이지 변경
- `updatePriority(id, priority)` - 우선순위 변경
- `addTags(id, tags)` - 태그 추가
- `removeTags(id, tags)` - 태그 제거
- `getStats(filter)` - 통계 조회
- `markAsWon(id)` - 성공 처리
- `markAsLost(id, reason)` - 실패 처리

### ICompanyManager

- `create(data)` - 회사 생성
- `getById(id)` - 회사 조회
- `getByDomain(domain)` - 도메인으로 조회
- `update(id, data)` - 회사 업데이트
- `delete(id)` - 회사 삭제
- `list(filter, pagination)` - 회사 목록 조회
- `updateStatus(id, status)` - 상태 변경
- `addTags(id, tags)` - 태그 추가
- `removeTags(id, tags)` - 태그 제거
- `getContacts(id)` - 연락처 목록
- `getDeals(id)` - 딜 목록
- `enrichByDomain(domain)` - 자동 정보 채우기

## 타입

### LeadStatus

```typescript
type LeadStatus =
  | 'new'           // 신규
  | 'contacted'     // 접촉
  | 'qualified'     // 검증됨
  | 'unqualified'   // 부적격
  | 'nurturing'     // 육성중
  | 'converted'     // 전환됨
  | 'lost';         // 실패
```

### DealStage

```typescript
type DealStage =
  | 'lead'          // 리드
  | 'qualification' // 검증
  | 'proposal'      // 제안
  | 'negotiation'   // 협상
  | 'closed_won'    // 성공
  | 'closed_lost';  // 실패
```

### CompanyStatus

```typescript
type CompanyStatus =
  | 'active'        // 활성
  | 'prospect'      // 잠재고객
  | 'customer'      // 고객
  | 'churned'       // 이탈
  | 'inactive';     // 비활성
```

## 프로바이더 교체

Strategy 패턴으로 설계되어 프로바이더 교체가 간단합니다.

```typescript
// Attio 사용
const attioCRM = CRMFactory.create({
  provider: 'attio',
  apiKey: process.env.ATTIO_API_KEY!
});

// HubSpot으로 교체 (스케일 시)
const hubspotCRM = CRMFactory.create({
  provider: 'hubspot',
  apiKey: process.env.HUBSPOT_API_KEY!
});

// 동일한 인터페이스 사용
const lead = await attioCRM.leads.create({ ... });
const lead2 = await hubspotCRM.leads.create({ ... }); // 동일한 API
```

## 에러 처리

모든 메서드는 `ICRMResponse<T>` 타입을 반환합니다.

```typescript
const result = await crm.leads.create({
  email: 'test@example.com',
  source: 'website'
});

if (result.success) {
  console.log('Lead created:', result.data);
  console.log('Request ID:', result.metadata?.requestId);
} else {
  console.error('Error:', result.error?.code);
  console.error('Message:', result.error?.message);
  console.error('Details:', result.error?.details);
}
```

## 개발 로드맵

- [x] Attio 구현 완료
- [x] CRM 인터페이스 정의
- [x] Strategy 패턴 팩토리
- [x] 리드 관리
- [x] 딜 관리
- [x] 회사 관리
- [x] 동기화 서비스
- [ ] HubSpot 구현 (스케일 시)
- [ ] Salesforce 지원 (검토 중)

## 라이선스

MIT

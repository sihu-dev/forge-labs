# ADE 정산 자동화 - 전체 설계서

> **목표**: 프리랜서/1인 사업자 정산 자동화
> **핵심 플로우**: 견적서 → 계약서 → 인보이스 → 세금계산서

---

## 1. 고객 DB 설계

### 1.1 페이지 구조

```
/dashboard/clients           # 고객 목록
/dashboard/clients/new       # 고객 등록
/dashboard/clients/[id]      # 고객 상세
/dashboard/clients/[id]/edit # 고객 수정
```

### 1.2 고객 목록 UI

```
┌─────────────────────────────────────────────────────────────┐
│ 👥 고객 관리                              [+ 새 고객 등록]  │
├─────────────────────────────────────────────────────────────┤
│ 🔍 검색...                    [전체 ▼] [최근순 ▼]          │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ (주)테크스타트                    사업자 | 5건 | 15,000,000원│
│ │ 123-45-67890 | tech@start.com                           │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 김철수                           개인 | 2건 | 3,000,000원 │
│ │ kim@email.com | 010-1234-5678                           │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 고객 등록 폼

```typescript
interface ClientForm {
  // 기본 정보
  type: 'individual' | 'business';
  name: string;                    // 필수

  // 사업자 정보 (type === 'business')
  businessNumber?: string;         // 000-00-00000
  representativeName?: string;

  // 연락처
  email: string;                   // 필수
  phone?: string;

  // 주소
  address?: string;

  // 업태/종목 (세금계산서용)
  businessType?: string;
  businessCategory?: string;

  // 메모
  notes?: string;
  tags?: string[];
}
```

### 1.4 고객 상세 UI

```
┌─────────────────────────────────────────────────────────────┐
│ ← 뒤로                                      [수정] [삭제]   │
├─────────────────────────────────────────────────────────────┤
│ (주)테크스타트                                    [사업자]  │
│ 123-45-67890 | 대표: 홍길동                                 │
│ tech@start.com | 02-1234-5678                               │
├─────────────────────────────────────────────────────────────┤
│ 📊 거래 현황                                                │
│ ┌──────────┬──────────┬──────────┬──────────┐               │
│ │ 견적 5건 │ 계약 3건 │ 인보이스 │ 매출     │               │
│ │          │          │ 4건      │ 15,000,000│              │
│ └──────────┴──────────┴──────────┴──────────┘               │
├─────────────────────────────────────────────────────────────┤
│ 📄 문서 이력                                    [+ 새 문서] │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📋 Q-2024-0015 | 웹개발 견적 | 3,000,000원 | 발송됨     │ │
│ │ 📝 C-2024-0008 | 웹개발 계약 | 5,000,000원 | 체결       │ │
│ │ 💳 I-2024-0012 | 계약금 청구 | 1,500,000원 | 결제완료   │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. 견적서 폼 설계

### 2.1 페이지 구조

```
/dashboard/quotes             # 견적서 목록
/dashboard/quotes/new         # 견적서 작성
/dashboard/quotes/[id]        # 견적서 상세
/dashboard/quotes/[id]/edit   # 견적서 수정

/p/quotes/[id]               # 공개 견적서 (고객 열람용)
```

### 2.2 견적서 작성 UI (3단계)

```
Step 1: 고객 선택
┌─────────────────────────────────────────────────────────────┐
│ 📋 견적서 작성                              Step 1/3        │
├─────────────────────────────────────────────────────────────┤
│ 고객 선택                                                   │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🔍 고객 검색...                      [+ 새 고객 등록]   │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ ○ (주)테크스타트        123-45-67890                    │ │
│ │ ● 디자인랩              456-78-90123                    │ │
│ │ ○ 김철수                개인                            │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                [다음 →]     │
└─────────────────────────────────────────────────────────────┘

Step 2: 견적 내용
┌─────────────────────────────────────────────────────────────┐
│ 📋 견적서 작성                              Step 2/3        │
├─────────────────────────────────────────────────────────────┤
│ 견적 제목                                                   │
│ [ 웹사이트 리뉴얼 프로젝트                              ]   │
│                                                             │
│ 품목                                        [+ 품목 추가]   │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ 기획/설계                                             │   │
│ │ [기획 및 와이어프레임 작성      ] 수량[1] 단가[500,000]│   │
│ ├───────────────────────────────────────────────────────┤   │
│ │ 디자인                                                │   │
│ │ [메인 + 서브 5페이지 디자인     ] 수량[1] 단가[1,500,000]│ │
│ ├───────────────────────────────────────────────────────┤   │
│ │ 개발                                                  │   │
│ │ [프론트엔드 + 백엔드 개발       ] 수량[1] 단가[2,000,000]│ │
│ └───────────────────────────────────────────────────────┘   │
│                                                             │
│ 공급가액: 4,000,000원                                       │
│ 부가세 (10%): 400,000원                                     │
│ ─────────────────                                           │
│ 합계: 4,400,000원                                           │
│                                          [← 이전] [다음 →] │
└─────────────────────────────────────────────────────────────┘

Step 3: 조건 및 확인
┌─────────────────────────────────────────────────────────────┐
│ 📋 견적서 작성                              Step 3/3        │
├─────────────────────────────────────────────────────────────┤
│ 유효기간                                                    │
│ [ 2024-01-15 ] ~ [ 2024-01-29 ] (14일)                     │
│                                                             │
│ 결제 조건                                                   │
│ [ 계약금 30% 선급, 잔금 70% 완료 후                     ]   │
│                                                             │
│ 납품 조건                                                   │
│ [ 최종 산출물 Google Drive 공유                         ]   │
│                                                             │
│ 비고                                                        │
│ [ 수정 2회 포함, 추가 수정 별도 협의                    ]   │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📄 미리보기                                             │ │
│ │ [견적서 프리뷰 축소판]                                  │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│                            [← 이전] [초안 저장] [발송하기]  │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 품목 자동완성 (자주 쓰는 품목)

```typescript
interface FrequentItem {
  id: string;
  name: string;
  description?: string;
  defaultQuantity: number;
  defaultUnitPrice: number;
  unit: string;
  category?: string;
}

// 예시
const frequentItems: FrequentItem[] = [
  { id: '1', name: '기획/설계', defaultQuantity: 1, defaultUnitPrice: 500000, unit: '식' },
  { id: '2', name: 'UI/UX 디자인', defaultQuantity: 1, defaultUnitPrice: 1500000, unit: '식' },
  { id: '3', name: '프론트엔드 개발', defaultQuantity: 1, defaultUnitPrice: 2000000, unit: '식' },
  { id: '4', name: '백엔드 개발', defaultQuantity: 1, defaultUnitPrice: 2000000, unit: '식' },
  { id: '5', name: '유지보수 (월)', defaultQuantity: 1, defaultUnitPrice: 300000, unit: '월' },
];
```

---

## 3. 문서 흐름 설계

### 3.1 상태 전이도

```
견적서 (Quote)
  draft → sent → viewed → approved → (Contract 생성)
                       ↘ rejected

계약서 (Contract)
  draft → sent → (양측 서명) → approved → (Invoice 생성 가능)
             ↘ rejected

인보이스 (Invoice)
  draft → sent → viewed → paid → (TaxInvoice 생성 가능)
                      ↘ partial (부분 결제)
                      ↘ overdue (연체)

세금계산서 (TaxInvoice)
  draft → submitted → approved (국세청 승인)
                   ↘ rejected (반려)
```

### 3.2 자동 전환 UI

```
견적서 승인됨
┌─────────────────────────────────────────────────────────────┐
│ ✅ 견적서가 승인되었습니다!                                 │
│                                                             │
│ 다음 단계로 진행하세요:                                     │
│                                                             │
│ ┌────────────────────┐  ┌────────────────────┐              │
│ │ 📝 계약서 작성하기 │  │ 💳 바로 인보이스   │              │
│ │ (권장)             │  │ 발행하기           │              │
│ └────────────────────┘  └────────────────────┘              │
│                                                             │
│ 견적서 내용이 계약서/인보이스에 자동으로 채워집니다         │
└─────────────────────────────────────────────────────────────┘

인보이스 결제 완료
┌─────────────────────────────────────────────────────────────┐
│ ✅ 결제가 확인되었습니다!                                   │
│                                                             │
│ 입금액: ₩4,400,000                                          │
│ 입금일: 2024-01-20                                          │
│                                                             │
│ ┌────────────────────┐                                      │
│ │ 🧾 세금계산서 발행 │                                      │
│ └────────────────────┘                                      │
│                                                             │
│ 세금계산서 발행 후 국세청에 전송됩니다                      │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 문서 체인 연결 로직

```typescript
// 견적서 → 계약서 생성
function createContractFromQuote(quote: Quote): Partial<Contract> {
  return {
    quoteId: quote.id,
    clientId: quote.clientId,
    client: quote.client,
    title: `${quote.title} 계약서`,
    projectName: quote.title,
    items: quote.items,
    subtotal: quote.subtotal,
    taxAmount: quote.taxAmount,
    totalAmount: quote.totalAmount,
    // 기본 결제 일정 (계약금 30%, 잔금 70%)
    paymentSchedule: [
      { name: '계약금', percentage: 30, amount: quote.totalAmount * 0.3, status: 'pending' },
      { name: '잔금', percentage: 70, amount: quote.totalAmount * 0.7, status: 'pending' },
    ],
  };
}

// 계약서 → 인보이스 생성 (회차별)
function createInvoiceFromContract(
  contract: Contract,
  scheduleId: string
): Partial<Invoice> {
  const schedule = contract.paymentSchedule.find(s => s.id === scheduleId);
  return {
    contractId: contract.id,
    clientId: contract.clientId,
    client: contract.client,
    title: `${contract.projectName} - ${schedule.name}`,
    items: [{
      id: generateId(),
      name: `${contract.projectName} - ${schedule.name}`,
      quantity: 1,
      unitPrice: schedule.amount,
      amount: schedule.amount,
    }],
    subtotal: schedule.amount,
    taxAmount: schedule.amount * 0.1,
    totalAmount: schedule.amount * 1.1,
  };
}

// 인보이스 → 세금계산서 생성
function createTaxInvoiceFromInvoice(
  invoice: Invoice,
  businessProfile: BusinessProfile
): Partial<TaxInvoice> {
  return {
    invoiceId: invoice.id,
    provider: {
      businessNumber: businessProfile.businessNumber,
      name: businessProfile.name,
      representativeName: businessProfile.representativeName,
      address: businessProfile.address,
      businessType: businessProfile.businessType,
      businessCategory: businessProfile.businessCategory,
      email: businessProfile.email,
    },
    clientId: invoice.clientId,
    client: invoice.client,
    items: invoice.items.map(item => ({
      id: item.id,
      date: new Date().toISOString(),
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      supplyAmount: item.amount,
      taxAmount: item.amount * 0.1,
    })),
    subtotal: invoice.subtotal,
    taxAmount: invoice.taxAmount,
    totalAmount: invoice.totalAmount,
    issueDate: new Date().toISOString(),
    issueType: 'regular',
  };
}
```

---

## 4. Supabase 스키마 설계

### 4.1 테이블 구조

```sql
-- 사업자 프로필 (사용자별 1개)
CREATE TABLE business_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,

  business_number VARCHAR(12),          -- 000-00-00000
  name VARCHAR(100) NOT NULL,
  representative_name VARCHAR(50),
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  business_type VARCHAR(50),
  business_category VARCHAR(50),

  -- 결제 정보
  bank_name VARCHAR(50),
  account_number VARCHAR(50),
  account_holder VARCHAR(50),

  -- 문서 설정
  quote_prefix VARCHAR(10) DEFAULT 'Q',
  contract_prefix VARCHAR(10) DEFAULT 'C',
  invoice_prefix VARCHAR(10) DEFAULT 'I',
  default_valid_days INT DEFAULT 14,
  default_payment_days INT DEFAULT 30,
  default_tax_rate DECIMAL(5,2) DEFAULT 10,

  -- 브랜딩
  logo_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#3B82F6',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 고객
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,

  type VARCHAR(20) NOT NULL CHECK (type IN ('individual', 'business')),
  name VARCHAR(100) NOT NULL,
  business_number VARCHAR(12),
  representative_name VARCHAR(50),

  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  address TEXT,

  business_type VARCHAR(50),
  business_category VARCHAR(50),

  notes TEXT,
  tags TEXT[],

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, email)
);

-- 견적서
CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  client_id UUID REFERENCES clients NOT NULL,

  document_number VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'draft',

  title VARCHAR(200) NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',

  subtotal DECIMAL(15,2) NOT NULL,
  tax_amount DECIMAL(15,2) NOT NULL,
  total_amount DECIMAL(15,2) NOT NULL,

  valid_until DATE NOT NULL,
  payment_terms TEXT,
  delivery_terms TEXT,
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,

  linked_contract_id UUID REFERENCES contracts,

  UNIQUE(user_id, document_number)
);

-- 계약서
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  client_id UUID REFERENCES clients NOT NULL,
  quote_id UUID REFERENCES quotes,

  document_number VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'draft',

  title VARCHAR(200) NOT NULL,
  project_name VARCHAR(200) NOT NULL,
  project_description TEXT,

  items JSONB NOT NULL DEFAULT '[]',
  subtotal DECIMAL(15,2) NOT NULL,
  tax_amount DECIMAL(15,2) NOT NULL,
  total_amount DECIMAL(15,2) NOT NULL,

  start_date DATE NOT NULL,
  end_date DATE NOT NULL,

  payment_schedule JSONB NOT NULL DEFAULT '[]',
  clauses JSONB NOT NULL DEFAULT '[]',

  provider_signature JSONB,
  client_signature JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  signed_at TIMESTAMPTZ,

  UNIQUE(user_id, document_number)
);

-- 인보이스
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  client_id UUID REFERENCES clients NOT NULL,
  quote_id UUID REFERENCES quotes,
  contract_id UUID REFERENCES contracts,
  payment_schedule_id VARCHAR(50),

  document_number VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'draft',

  title VARCHAR(200) NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',

  subtotal DECIMAL(15,2) NOT NULL,
  tax_amount DECIMAL(15,2) NOT NULL,
  total_amount DECIMAL(15,2) NOT NULL,

  due_date DATE NOT NULL,
  payment_status VARCHAR(20) DEFAULT 'pending',
  payment_method VARCHAR(20),
  paid_amount DECIMAL(15,2) DEFAULT 0,
  paid_at TIMESTAMPTZ,

  payment_info JSONB NOT NULL,
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,

  linked_tax_invoice_id UUID REFERENCES tax_invoices,

  UNIQUE(user_id, document_number)
);

-- 세금계산서
CREATE TABLE tax_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  client_id UUID REFERENCES clients NOT NULL,
  invoice_id UUID REFERENCES invoices,

  document_number VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'draft',

  provider_info JSONB NOT NULL,

  items JSONB NOT NULL DEFAULT '[]',
  subtotal DECIMAL(15,2) NOT NULL,
  tax_amount DECIMAL(15,2) NOT NULL,
  total_amount DECIMAL(15,2) NOT NULL,

  issue_date DATE NOT NULL,
  issue_type VARCHAR(20) DEFAULT 'regular',

  nts_submitted_at TIMESTAMPTZ,
  nts_approval_number VARCHAR(50),
  nts_status VARCHAR(20) DEFAULT 'pending',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, document_number)
);

-- 자주 쓰는 품목
CREATE TABLE frequent_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,

  name VARCHAR(100) NOT NULL,
  description TEXT,
  default_quantity DECIMAL(10,2) DEFAULT 1,
  default_unit_price DECIMAL(15,2) NOT NULL,
  unit VARCHAR(20) DEFAULT '개',
  category VARCHAR(50),

  usage_count INT DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 문서 이벤트 로그
CREATE TABLE document_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,

  document_type VARCHAR(20) NOT NULL,
  document_id UUID NOT NULL,

  event_type VARCHAR(20) NOT NULL,
  description TEXT,
  metadata JSONB,

  occurred_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_clients_user ON clients(user_id);
CREATE INDEX idx_quotes_user ON quotes(user_id);
CREATE INDEX idx_quotes_client ON quotes(client_id);
CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_contracts_user ON contracts(user_id);
CREATE INDEX idx_invoices_user ON invoices(user_id);
CREATE INDEX idx_invoices_status ON invoices(payment_status);
CREATE INDEX idx_tax_invoices_user ON tax_invoices(user_id);
CREATE INDEX idx_document_events_user ON document_events(user_id);
CREATE INDEX idx_document_events_document ON document_events(document_type, document_id);

-- RLS 정책
ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE frequent_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_events ENABLE ROW LEVEL SECURITY;

-- 본인 데이터만 접근 가능
CREATE POLICY "Users can only access their own data" ON business_profiles
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own clients" ON clients
  FOR ALL USING (auth.uid() = user_id);

-- (나머지 테이블도 동일한 정책 적용)
```

### 4.2 문서 번호 자동 생성

```sql
-- 연도별 문서 번호 시퀀스
CREATE OR REPLACE FUNCTION generate_document_number(
  p_user_id UUID,
  p_prefix VARCHAR,
  p_year INT DEFAULT EXTRACT(YEAR FROM NOW())
)
RETURNS VARCHAR AS $$
DECLARE
  v_count INT;
  v_number VARCHAR;
BEGIN
  -- 해당 연도의 문서 수 조회
  SELECT COUNT(*) + 1 INTO v_count
  FROM (
    SELECT id FROM quotes WHERE user_id = p_user_id AND EXTRACT(YEAR FROM created_at) = p_year
    UNION ALL
    SELECT id FROM contracts WHERE user_id = p_user_id AND EXTRACT(YEAR FROM created_at) = p_year
    UNION ALL
    SELECT id FROM invoices WHERE user_id = p_user_id AND EXTRACT(YEAR FROM created_at) = p_year
  ) docs;

  v_number := p_prefix || '-' || p_year || '-' || LPAD(v_count::TEXT, 4, '0');

  RETURN v_number;
END;
$$ LANGUAGE plpgsql;
```

---

## 5. API 설계

### 5.1 엔드포인트 목록

```
# 고객
GET    /api/clients           # 목록 (검색, 페이지네이션)
POST   /api/clients           # 생성
GET    /api/clients/:id       # 상세
PUT    /api/clients/:id       # 수정
DELETE /api/clients/:id       # 삭제

# 견적서
GET    /api/quotes            # 목록
POST   /api/quotes            # 생성
GET    /api/quotes/:id        # 상세
PUT    /api/quotes/:id        # 수정
DELETE /api/quotes/:id        # 삭제
POST   /api/quotes/:id/send   # 발송
POST   /api/quotes/:id/approve # 승인 (공개 링크에서)
POST   /api/quotes/:id/reject  # 거절

# 계약서
GET    /api/contracts         # 목록
POST   /api/contracts         # 생성
POST   /api/contracts/from-quote/:quoteId  # 견적서에서 생성
GET    /api/contracts/:id     # 상세
PUT    /api/contracts/:id     # 수정
POST   /api/contracts/:id/sign # 서명

# 인보이스
GET    /api/invoices          # 목록
POST   /api/invoices          # 생성
POST   /api/invoices/from-contract/:contractId/:scheduleId  # 계약서에서 생성
GET    /api/invoices/:id      # 상세
PUT    /api/invoices/:id      # 수정
POST   /api/invoices/:id/mark-paid  # 결제 확인

# 세금계산서
GET    /api/tax-invoices      # 목록
POST   /api/tax-invoices      # 생성
POST   /api/tax-invoices/from-invoice/:invoiceId  # 인보이스에서 생성
GET    /api/tax-invoices/:id  # 상세
POST   /api/tax-invoices/:id/submit  # 국세청 전송

# 자주 쓰는 품목
GET    /api/frequent-items    # 목록
POST   /api/frequent-items    # 생성
DELETE /api/frequent-items/:id # 삭제

# 대시보드
GET    /api/dashboard/stats   # 통계
GET    /api/dashboard/recent  # 최근 문서

# 설정
GET    /api/settings/profile  # 사업자 정보 조회
PUT    /api/settings/profile  # 사업자 정보 수정
```

### 5.2 공개 링크 (토큰 기반)

```
/p/quotes/:token      # 견적서 열람 + 승인/거절
/p/contracts/:token   # 계약서 열람 + 서명
/p/invoices/:token    # 인보이스 열람 + 결제 확인
```

---

## 6. 하이브리드 병렬 구현 계획

### 6.1 의존성 그래프

```
                    ┌─────────────┐
                    │ 타입/스키마  │
                    └──────┬──────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
    ┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
    │  고객 CRUD  │ │ 견적서 폼   │ │ API 라우트  │
    └──────┬──────┘ └──────┬──────┘ └──────┬──────┘
           │               │               │
           └───────────────┼───────────────┘
                           │
                    ┌──────▼──────┐
                    │  문서 흐름   │
                    │  연결 로직   │
                    └─────────────┘
```

### 6.2 구현 순서

```
Phase 1 (병렬):
├── A. Supabase 스키마 생성
├── B. 고객 목록/등록 페이지
└── C. 견적서 작성 폼 (Step 1-2)

Phase 2 (병렬):
├── A. API 라우트 구현 (clients, quotes)
├── B. 견적서 작성 폼 (Step 3)
└── C. 공개 링크 페이지

Phase 3 (순차):
├── 문서 전환 로직 구현
├── 계약서/인보이스/세금계산서 폼
└── 전체 통합 테스트
```

---

## 7. 파일 구조

```
apps/ade/
├── app/
│   ├── api/
│   │   ├── clients/
│   │   │   ├── route.ts              # GET, POST
│   │   │   └── [id]/route.ts         # GET, PUT, DELETE
│   │   ├── quotes/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       ├── route.ts
│   │   │       ├── send/route.ts
│   │   │       └── approve/route.ts
│   │   ├── contracts/
│   │   ├── invoices/
│   │   ├── tax-invoices/
│   │   ├── frequent-items/
│   │   └── dashboard/
│   │
│   ├── dashboard/
│   │   ├── layout.tsx
│   │   ├── page.tsx                  # 대시보드 홈
│   │   ├── clients/
│   │   │   ├── page.tsx              # 목록
│   │   │   ├── new/page.tsx          # 등록
│   │   │   └── [id]/
│   │   │       ├── page.tsx          # 상세
│   │   │       └── edit/page.tsx     # 수정
│   │   ├── quotes/
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── contracts/
│   │   ├── invoices/
│   │   ├── tax-invoices/
│   │   └── settings/
│   │       └── page.tsx              # 사업자 정보
│   │
│   └── p/                            # 공개 링크
│       ├── quotes/[token]/page.tsx
│       ├── contracts/[token]/page.tsx
│       └── invoices/[token]/page.tsx
│
├── src/
│   ├── types/index.ts                # 타입 정의 (완료)
│   ├── templates/                    # 템플릿 컴포넌트 (완료)
│   ├── components/
│   │   ├── forms/
│   │   │   ├── ClientForm.tsx
│   │   │   ├── QuoteForm.tsx
│   │   │   ├── ItemInput.tsx
│   │   │   └── ClientSelect.tsx
│   │   └── ui/
│   │       ├── DocumentCard.tsx
│   │       ├── StatusBadge.tsx
│   │       └── AmountSummary.tsx
│   ├── lib/
│   │   ├── supabase.ts               # Supabase 클라이언트
│   │   ├── document-flow.ts          # 문서 전환 로직
│   │   └── utils.ts                  # 유틸리티
│   └── hooks/
│       ├── useClients.ts
│       ├── useQuotes.ts
│       └── useDocumentFlow.ts
│
└── supabase/
    └── migrations/
        └── 001_initial_schema.sql
```

---

## 완료 체크리스트

- [x] 타입 시스템 (types/index.ts)
- [x] 템플릿 4종 (QuoteTemplate, ContractTemplate, InvoiceTemplate, TaxInvoiceTemplate)
- [x] 대시보드 레이아웃
- [ ] Supabase 스키마
- [ ] 고객 CRUD
- [ ] 견적서 폼
- [ ] 문서 전환 로직
- [ ] API 라우트
- [ ] 공개 링크

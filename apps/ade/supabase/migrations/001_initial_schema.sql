-- ADE 정산 자동화 - 초기 스키마
-- 생성일: 2024

-- ===========================================
-- 1. 테이블 생성
-- ===========================================

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

-- 세금계산서 (먼저 생성 - 인보이스에서 참조)
CREATE TABLE tax_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  client_id UUID REFERENCES clients NOT NULL,
  invoice_id UUID, -- 나중에 FK 추가

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

-- 인보이스
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  client_id UUID REFERENCES clients NOT NULL,
  quote_id UUID, -- 나중에 FK 추가
  contract_id UUID, -- 나중에 FK 추가
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

-- 계약서
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  client_id UUID REFERENCES clients NOT NULL,
  quote_id UUID, -- 나중에 FK 추가

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

-- 공개 링크 토큰 (문서 열람용)
CREATE TABLE public_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,

  document_type VARCHAR(20) NOT NULL,
  document_id UUID NOT NULL,
  token VARCHAR(64) NOT NULL UNIQUE,

  expires_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- 2. 순환 참조 FK 추가
-- ===========================================

ALTER TABLE tax_invoices
  ADD CONSTRAINT fk_tax_invoices_invoice
  FOREIGN KEY (invoice_id) REFERENCES invoices(id);

ALTER TABLE invoices
  ADD CONSTRAINT fk_invoices_quote
  FOREIGN KEY (quote_id) REFERENCES quotes(id);

ALTER TABLE invoices
  ADD CONSTRAINT fk_invoices_contract
  FOREIGN KEY (contract_id) REFERENCES contracts(id);

ALTER TABLE contracts
  ADD CONSTRAINT fk_contracts_quote
  FOREIGN KEY (quote_id) REFERENCES quotes(id);

-- ===========================================
-- 3. 인덱스 생성
-- ===========================================

CREATE INDEX idx_clients_user ON clients(user_id);
CREATE INDEX idx_clients_name ON clients(name);

CREATE INDEX idx_quotes_user ON quotes(user_id);
CREATE INDEX idx_quotes_client ON quotes(client_id);
CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_quotes_created ON quotes(created_at DESC);

CREATE INDEX idx_contracts_user ON contracts(user_id);
CREATE INDEX idx_contracts_client ON contracts(client_id);
CREATE INDEX idx_contracts_status ON contracts(status);

CREATE INDEX idx_invoices_user ON invoices(user_id);
CREATE INDEX idx_invoices_client ON invoices(client_id);
CREATE INDEX idx_invoices_status ON invoices(payment_status);
CREATE INDEX idx_invoices_due ON invoices(due_date);

CREATE INDEX idx_tax_invoices_user ON tax_invoices(user_id);
CREATE INDEX idx_tax_invoices_status ON tax_invoices(nts_status);

CREATE INDEX idx_document_events_user ON document_events(user_id);
CREATE INDEX idx_document_events_document ON document_events(document_type, document_id);

CREATE INDEX idx_public_tokens_token ON public_tokens(token);
CREATE INDEX idx_public_tokens_document ON public_tokens(document_type, document_id);

-- ===========================================
-- 4. RLS 활성화
-- ===========================================

ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE frequent_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_tokens ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- 5. RLS 정책
-- ===========================================

-- 사업자 프로필
CREATE POLICY "business_profiles_select" ON business_profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "business_profiles_insert" ON business_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "business_profiles_update" ON business_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- 고객
CREATE POLICY "clients_select" ON clients
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "clients_insert" ON clients
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "clients_update" ON clients
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "clients_delete" ON clients
  FOR DELETE USING (auth.uid() = user_id);

-- 견적서
CREATE POLICY "quotes_select" ON quotes
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "quotes_insert" ON quotes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "quotes_update" ON quotes
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "quotes_delete" ON quotes
  FOR DELETE USING (auth.uid() = user_id);

-- 계약서
CREATE POLICY "contracts_select" ON contracts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "contracts_insert" ON contracts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "contracts_update" ON contracts
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "contracts_delete" ON contracts
  FOR DELETE USING (auth.uid() = user_id);

-- 인보이스
CREATE POLICY "invoices_select" ON invoices
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "invoices_insert" ON invoices
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "invoices_update" ON invoices
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "invoices_delete" ON invoices
  FOR DELETE USING (auth.uid() = user_id);

-- 세금계산서
CREATE POLICY "tax_invoices_select" ON tax_invoices
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "tax_invoices_insert" ON tax_invoices
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tax_invoices_update" ON tax_invoices
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "tax_invoices_delete" ON tax_invoices
  FOR DELETE USING (auth.uid() = user_id);

-- 자주 쓰는 품목
CREATE POLICY "frequent_items_select" ON frequent_items
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "frequent_items_insert" ON frequent_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "frequent_items_update" ON frequent_items
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "frequent_items_delete" ON frequent_items
  FOR DELETE USING (auth.uid() = user_id);

-- 문서 이벤트
CREATE POLICY "document_events_select" ON document_events
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "document_events_insert" ON document_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 공개 토큰
CREATE POLICY "public_tokens_select" ON public_tokens
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "public_tokens_insert" ON public_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "public_tokens_update" ON public_tokens
  FOR UPDATE USING (auth.uid() = user_id);

-- ===========================================
-- 6. 함수
-- ===========================================

-- 문서 번호 자동 생성
CREATE OR REPLACE FUNCTION generate_document_number(
  p_user_id UUID,
  p_prefix VARCHAR,
  p_table_name VARCHAR,
  p_year INT DEFAULT EXTRACT(YEAR FROM NOW())::INT
)
RETURNS VARCHAR AS $$
DECLARE
  v_count INT;
  v_number VARCHAR;
BEGIN
  -- 해당 연도의 문서 수 조회
  EXECUTE format(
    'SELECT COUNT(*) + 1 FROM %I WHERE user_id = $1 AND EXTRACT(YEAR FROM created_at) = $2',
    p_table_name
  ) INTO v_count USING p_user_id, p_year;

  v_number := p_prefix || '-' || p_year || '-' || LPAD(v_count::TEXT, 4, '0');

  RETURN v_number;
END;
$$ LANGUAGE plpgsql;

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 적용
CREATE TRIGGER tr_business_profiles_updated
  BEFORE UPDATE ON business_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_clients_updated
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_quotes_updated
  BEFORE UPDATE ON quotes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_contracts_updated
  BEFORE UPDATE ON contracts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_invoices_updated
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_tax_invoices_updated
  BEFORE UPDATE ON tax_invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_frequent_items_updated
  BEFORE UPDATE ON frequent_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ===========================================
-- 7. 초기 데이터 (선택적)
-- ===========================================

-- 기본 품목 템플릿은 사용자 등록 시 트리거로 생성하거나
-- 앱에서 기본값으로 제공

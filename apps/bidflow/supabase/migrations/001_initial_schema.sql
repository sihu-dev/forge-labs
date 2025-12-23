-- =====================================================
-- BIDFLOW 초기 데이터베이스 스키마
-- 생성일: 2025-12-23
-- 목적: 세일즈 자동화 시스템 핵심 테이블
-- =====================================================

-- Extension 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- 텍스트 검색 최적화
CREATE EXTENSION IF NOT EXISTS "vector"; -- 임베딩 검색용 (향후)

-- =====================================================
-- 1. BIDS 테이블 (입찰 정보)
-- =====================================================
CREATE TABLE bids (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- 기본 정보
    bid_number VARCHAR(100) UNIQUE NOT NULL, -- 입찰 공고번호
    title TEXT NOT NULL,
    description TEXT,
    organization VARCHAR(500) NOT NULL, -- 발주 기관

    -- 입찰 상세
    budget BIGINT, -- 예산 (원)
    deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    announcement_date TIMESTAMP WITH TIME ZONE,

    -- 분류
    category VARCHAR(100), -- 카테고리 (IT, 컨설팅 등)
    procurement_type VARCHAR(50), -- 조달 유형 (일반경쟁, 제한경쟁 등)

    -- 원본 데이터
    source VARCHAR(50) NOT NULL, -- 'g2b', 'ted', 'youtube'
    source_url TEXT NOT NULL,
    raw_data JSONB, -- 원본 JSON 데이터

    -- 처리 상태
    processing_status VARCHAR(20) DEFAULT 'pending',
    -- 'pending', 'analyzing', 'scored', 'approved', 'rejected', 'email_sent', 'responded'

    -- 타임스탬프
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- 인덱스
    CONSTRAINT valid_processing_status CHECK (
        processing_status IN ('pending', 'analyzing', 'scored', 'approved', 'rejected', 'email_sent', 'responded')
    )
);

-- 인덱스 생성
CREATE INDEX idx_bids_deadline ON bids(deadline);
CREATE INDEX idx_bids_processing_status ON bids(processing_status);
CREATE INDEX idx_bids_source ON bids(source);
CREATE INDEX idx_bids_created_at ON bids(created_at DESC);
CREATE INDEX idx_bids_title_trgm ON bids USING gin (title gin_trgm_ops); -- 텍스트 검색
CREATE INDEX idx_bids_organization ON bids(organization);

-- =====================================================
-- 2. BID_SCORES 테이블 (입찰 스코어링 결과)
-- =====================================================
CREATE TABLE bid_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bid_id UUID NOT NULL REFERENCES bids(id) ON DELETE CASCADE,

    -- 스코어 정보
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
    confidence DECIMAL(3, 2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    confidence_level VARCHAR(20) NOT NULL,
    -- 'low', 'medium', 'high', 'very_high'

    -- 분석 결과
    intent VARCHAR(50), -- 'purchase', 'maintenance', 'disposal', 'consulting', 'other'
    win_probability DECIMAL(3, 2) CHECK (win_probability >= 0 AND win_probability <= 1),
    estimated_profit BIGINT, -- 예상 수익 (원)

    -- 매칭 상세
    matched_keywords JSONB, -- [{ keyword: string, relevance: number }]
    matched_products JSONB, -- [{ product: string, match_score: number }]
    risk_factors JSONB, -- [{ factor: string, severity: string, description: string }]

    -- AI 분석 메타데이터
    recommendation TEXT,
    model_used VARCHAR(50), -- 'claude-sonnet-4.5', 'claude-opus-4.5'
    tokens_used INTEGER,
    analysis_duration_ms INTEGER,
    cache_hit BOOLEAN DEFAULT false,

    -- 타임스탬프
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT valid_confidence_level CHECK (
        confidence_level IN ('low', 'medium', 'high', 'very_high')
    ),
    CONSTRAINT valid_intent CHECK (
        intent IN ('purchase', 'maintenance', 'disposal', 'consulting', 'other')
    )
);

-- 인덱스
CREATE INDEX idx_bid_scores_bid_id ON bid_scores(bid_id);
CREATE INDEX idx_bid_scores_score ON bid_scores(score DESC);
CREATE INDEX idx_bid_scores_confidence ON bid_scores(confidence DESC);
CREATE INDEX idx_bid_scores_created_at ON bid_scores(created_at DESC);

-- =====================================================
-- 3. EMAILS 테이블 (발송된 이메일)
-- =====================================================
CREATE TABLE emails (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bid_id UUID NOT NULL REFERENCES bids(id) ON DELETE CASCADE,
    score_id UUID REFERENCES bid_scores(id) ON DELETE SET NULL,

    -- 이메일 정보
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255),
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    html_body TEXT,

    -- 개인화 레벨
    personalization_level INTEGER NOT NULL CHECK (personalization_level IN (1, 2, 3)),
    -- 1: 기본 템플릿, 2: 중간 개인화, 3: 초개인화

    -- A/B 테스트
    variant VARCHAR(10), -- 'A', 'B', 'C'
    test_group_id UUID, -- A/B 테스트 그룹 ID

    -- 발송 상태
    sent_at TIMESTAMP WITH TIME ZONE,
    delivery_status VARCHAR(20) DEFAULT 'pending',
    -- 'pending', 'sent', 'delivered', 'opened', 'clicked', 'responded', 'bounced', 'failed'

    -- 추적 정보
    opened_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    responded_at TIMESTAMP WITH TIME ZONE,
    response_text TEXT,

    -- AI 생성 메타데이터
    model_used VARCHAR(50),
    tokens_used INTEGER,
    generation_duration_ms INTEGER,

    -- Gmail MCP 메타데이터
    gmail_message_id VARCHAR(255),
    gmail_thread_id VARCHAR(255),

    -- 타임스탬프
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT valid_delivery_status CHECK (
        delivery_status IN ('pending', 'sent', 'delivered', 'opened', 'clicked', 'responded', 'bounced', 'failed')
    )
);

-- 인덱스
CREATE INDEX idx_emails_bid_id ON emails(bid_id);
CREATE INDEX idx_emails_recipient_email ON emails(recipient_email);
CREATE INDEX idx_emails_delivery_status ON emails(delivery_status);
CREATE INDEX idx_emails_sent_at ON emails(sent_at DESC);
CREATE INDEX idx_emails_test_group_id ON emails(test_group_id);

-- =====================================================
-- 4. APPROVALS 테이블 (승인 플로우)
-- =====================================================
CREATE TABLE approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bid_id UUID NOT NULL REFERENCES bids(id) ON DELETE CASCADE,
    score_id UUID REFERENCES bid_scores(id) ON DELETE SET NULL,

    -- 승인 요청 정보
    approval_type VARCHAR(20) NOT NULL, -- 'bid_match', 'email_send', 'high_value'
    requested_by VARCHAR(50) DEFAULT 'system',
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- 승인 상태
    status VARCHAR(20) DEFAULT 'pending',
    -- 'pending', 'approved', 'rejected', 'expired', 'auto_approved'

    -- 승인자 정보
    approver_id UUID, -- 사용자 ID (향후 auth.users 연결)
    approver_name VARCHAR(255),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,

    -- 알림 정보
    slack_message_ts VARCHAR(50), -- Slack 메시지 타임스탬프
    slack_channel VARCHAR(50),
    notification_sent BOOLEAN DEFAULT false,

    -- 만료 설정
    expires_at TIMESTAMP WITH TIME ZONE,

    -- 메타데이터
    metadata JSONB, -- 추가 컨텍스트 정보

    -- 타임스탬프
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT valid_approval_type CHECK (
        approval_type IN ('bid_match', 'email_send', 'high_value')
    ),
    CONSTRAINT valid_status CHECK (
        status IN ('pending', 'approved', 'rejected', 'expired', 'auto_approved')
    )
);

-- 인덱스
CREATE INDEX idx_approvals_bid_id ON approvals(bid_id);
CREATE INDEX idx_approvals_status ON approvals(status);
CREATE INDEX idx_approvals_requested_at ON approvals(requested_at DESC);
CREATE INDEX idx_approvals_expires_at ON approvals(expires_at);

-- =====================================================
-- 5. AB_TESTS 테이블 (A/B 테스트)
-- =====================================================
CREATE TABLE ab_tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- 테스트 정보
    name VARCHAR(255) NOT NULL,
    description TEXT,
    test_type VARCHAR(50) NOT NULL, -- 'email_subject', 'email_body', 'personalization_level'

    -- 변형 정보
    variants JSONB NOT NULL,
    -- [{ variant: 'A', config: {...}, weight: 0.5 }, { variant: 'B', ... }]

    -- 테스트 상태
    status VARCHAR(20) DEFAULT 'draft',
    -- 'draft', 'running', 'paused', 'completed', 'archived'

    -- Thompson Sampling 파라미터
    alpha_params JSONB, -- { 'A': 1.0, 'B': 1.0 }
    beta_params JSONB,  -- { 'A': 1.0, 'B': 1.0 }

    -- 성과 메트릭
    total_sent INTEGER DEFAULT 0,
    total_opened INTEGER DEFAULT 0,
    total_clicked INTEGER DEFAULT 0,
    total_responded INTEGER DEFAULT 0,

    -- 테스트 기간
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,

    -- 승자 결정
    winner_variant VARCHAR(10),
    winner_confidence DECIMAL(3, 2),

    -- 타임스탬프
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT valid_status CHECK (
        status IN ('draft', 'running', 'paused', 'completed', 'archived')
    )
);

-- 인덱스
CREATE INDEX idx_ab_tests_status ON ab_tests(status);
CREATE INDEX idx_ab_tests_started_at ON ab_tests(started_at DESC);

-- =====================================================
-- 6. PERFORMANCE_METRICS 테이블 (성능 메트릭)
-- =====================================================
CREATE TABLE performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- 메트릭 정보
    metric_type VARCHAR(50) NOT NULL,
    -- 'api_latency', 'matcher_accuracy', 'email_response_rate', 'cache_hit_rate', 'cost_per_bid'

    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(10, 4) NOT NULL,
    metric_unit VARCHAR(20), -- 'ms', 'percent', 'count', 'krw'

    -- 컨텍스트
    context JSONB, -- { bid_id: '...', model: 'sonnet', ... }

    -- 집계 정보
    aggregation_period VARCHAR(20), -- 'minute', 'hour', 'day'
    period_start TIMESTAMP WITH TIME ZONE,
    period_end TIMESTAMP WITH TIME ZONE,

    -- 타임스탬프
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_performance_metrics_type ON performance_metrics(metric_type);
CREATE INDEX idx_performance_metrics_created_at ON performance_metrics(created_at DESC);
CREATE INDEX idx_performance_metrics_period ON performance_metrics(period_start, period_end);

-- =====================================================
-- 7. SYSTEM_LOGS 테이블 (시스템 로그)
-- =====================================================
CREATE TABLE system_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- 로그 정보
    log_level VARCHAR(10) NOT NULL, -- 'debug', 'info', 'warn', 'error', 'fatal'
    log_source VARCHAR(50) NOT NULL, -- 'matcher', 'email_generator', 'crawler', 'api'
    message TEXT NOT NULL,

    -- 에러 정보
    error_code VARCHAR(50),
    error_stack TEXT,

    -- 컨텍스트
    context JSONB, -- 관련 데이터
    user_id UUID, -- 사용자 ID (있을 경우)

    -- 타임스탬프
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT valid_log_level CHECK (
        log_level IN ('debug', 'info', 'warn', 'error', 'fatal')
    )
);

-- 인덱스
CREATE INDEX idx_system_logs_level ON system_logs(log_level);
CREATE INDEX idx_system_logs_source ON system_logs(log_source);
CREATE INDEX idx_system_logs_created_at ON system_logs(created_at DESC);

-- =====================================================
-- 트리거: updated_at 자동 업데이트
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bids_updated_at
    BEFORE UPDATE ON bids
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bid_scores_updated_at
    BEFORE UPDATE ON bid_scores
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emails_updated_at
    BEFORE UPDATE ON emails
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_approvals_updated_at
    BEFORE UPDATE ON approvals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ab_tests_updated_at
    BEFORE UPDATE ON ab_tests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 완료
-- =====================================================
COMMENT ON TABLE bids IS '입찰 공고 정보';
COMMENT ON TABLE bid_scores IS 'Enhanced Matcher 스코어링 결과';
COMMENT ON TABLE emails IS '발송된 이메일 추적';
COMMENT ON TABLE approvals IS 'HumanLayer 승인 플로우';
COMMENT ON TABLE ab_tests IS 'Thompson Sampling A/B 테스트';
COMMENT ON TABLE performance_metrics IS '시스템 성능 메트릭';
COMMENT ON TABLE system_logs IS '시스템 로그';

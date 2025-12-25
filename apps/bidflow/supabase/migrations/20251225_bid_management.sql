/**
 * Bid Management Schema
 * 입찰 공고 관리 시스템
 */

-- ============================================================================
-- BIDS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 기본 정보
  title TEXT NOT NULL,
  organization TEXT NOT NULL,
  announcement_number TEXT,

  -- 입찰 상세
  budget DECIMAL(15,2),
  currency TEXT DEFAULT 'KRW',
  deadline TIMESTAMP WITH TIME ZONE,
  announcement_date TIMESTAMP WITH TIME ZONE,

  -- 분류
  category TEXT,
  type TEXT, -- 'goods', 'service', 'construction', 'foreign'
  method TEXT, -- 'open', 'limited', 'negotiation'

  -- 상태
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'expired', 'awarded', 'cancelled'
  matched BOOLEAN DEFAULT false, -- 키워드 매칭 여부

  -- 콘텐츠
  description TEXT,
  requirements TEXT,
  documents JSONB DEFAULT '[]'::jsonb,

  -- 출처
  source TEXT NOT NULL, -- 'g2b', 'ungm', 'dgmarket', 'manual'
  source_url TEXT,
  source_id TEXT,

  -- 연락처
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,

  -- 매칭 정보
  matched_keywords TEXT[] DEFAULT '{}',
  match_score INTEGER DEFAULT 0, -- 0-100

  -- 리드 생성
  leads_generated INTEGER DEFAULT 0,
  last_lead_generated_at TIMESTAMP WITH TIME ZONE,

  -- 메타데이터
  metadata JSONB DEFAULT '{}'::jsonb,

  -- 타임스탬프
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_bids_user_id ON bids(user_id);
CREATE INDEX IF NOT EXISTS idx_bids_status ON bids(status);
CREATE INDEX IF NOT EXISTS idx_bids_matched ON bids(matched);
CREATE INDEX IF NOT EXISTS idx_bids_deadline ON bids(deadline);
CREATE INDEX IF NOT EXISTS idx_bids_source ON bids(source);
CREATE INDEX IF NOT EXISTS idx_bids_created_at ON bids(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bids_match_score ON bids(match_score DESC);
CREATE INDEX IF NOT EXISTS idx_bids_matched_keywords ON bids USING GIN(matched_keywords);

-- ============================================================================
-- BID KEYWORDS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS bid_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 키워드 정보
  keyword TEXT NOT NULL,
  category TEXT, -- 'product', 'service', 'industry', 'location'
  priority INTEGER DEFAULT 5, -- 1-10

  -- 통계
  match_count INTEGER DEFAULT 0,
  last_matched_at TIMESTAMP WITH TIME ZONE,

  -- 상태
  active BOOLEAN DEFAULT true,

  -- 타임스탬프
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, keyword)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_bid_keywords_user_id ON bid_keywords(user_id);
CREATE INDEX IF NOT EXISTS idx_bid_keywords_active ON bid_keywords(active);
CREATE INDEX IF NOT EXISTS idx_bid_keywords_priority ON bid_keywords(priority DESC);

-- ============================================================================
-- BID SOURCES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS bid_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 출처 정보
  name TEXT NOT NULL, -- 'G2B', 'UNGM', 'DG Market'
  type TEXT NOT NULL, -- 'api', 'scraper', 'rss', 'manual'
  url TEXT,

  -- 설정
  enabled BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}'::jsonb, -- API keys, filters, etc.

  -- 크롤링 설정
  crawl_frequency TEXT DEFAULT 'daily', -- 'hourly', 'daily', 'weekly'
  last_crawled_at TIMESTAMP WITH TIME ZONE,
  next_crawl_at TIMESTAMP WITH TIME ZONE,

  -- 통계
  total_crawled INTEGER DEFAULT 0,
  total_matched INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2) DEFAULT 0,

  -- 오류 추적
  last_error TEXT,
  error_count INTEGER DEFAULT 0,

  -- 타임스탬프
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_bid_sources_user_id ON bid_sources(user_id);
CREATE INDEX IF NOT EXISTS idx_bid_sources_enabled ON bid_sources(enabled);
CREATE INDEX IF NOT EXISTS idx_bid_sources_next_crawl ON bid_sources(next_crawl_at);

-- ============================================================================
-- BID ACTIVITIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS bid_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bid_id UUID NOT NULL REFERENCES bids(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 활동 정보
  type TEXT NOT NULL, -- 'created', 'matched', 'lead_generated', 'status_changed', 'viewed'
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,

  -- 타임스탬프
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_bid_activities_bid_id ON bid_activities(bid_id);
CREATE INDEX IF NOT EXISTS idx_bid_activities_user_id ON bid_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_bid_activities_created_at ON bid_activities(created_at DESC);

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Bid Stats View
CREATE OR REPLACE VIEW bid_stats AS
SELECT
  user_id,
  COUNT(*) as total_bids,
  COUNT(*) FILTER (WHERE status = 'active') as active_bids,
  COUNT(*) FILTER (WHERE matched = true) as matched_bids,
  COUNT(*) FILTER (WHERE deadline > NOW()) as upcoming_bids,
  COUNT(*) FILTER (WHERE deadline < NOW() AND status = 'active') as expired_bids,
  SUM(leads_generated) as total_leads_generated,
  AVG(match_score) as avg_match_score,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as new_this_week,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as new_this_month
FROM bids
GROUP BY user_id;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Update bid match score
CREATE OR REPLACE FUNCTION update_bid_match_score()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate match score based on number and priority of matched keywords
  NEW.match_score := LEAST(100, array_length(NEW.matched_keywords, 1) * 10);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update timestamps
CREATE OR REPLACE FUNCTION update_bid_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Increment keyword match count
CREATE OR REPLACE FUNCTION increment_keyword_match_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.matched = true AND (OLD.matched = false OR OLD.matched IS NULL) THEN
    -- Update match counts for all matched keywords
    UPDATE bid_keywords
    SET
      match_count = match_count + 1,
      last_matched_at = NOW()
    WHERE
      user_id = NEW.user_id
      AND keyword = ANY(NEW.matched_keywords);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update match score
DROP TRIGGER IF EXISTS trigger_update_bid_match_score ON bids;
CREATE TRIGGER trigger_update_bid_match_score
  BEFORE INSERT OR UPDATE OF matched_keywords ON bids
  FOR EACH ROW
  EXECUTE FUNCTION update_bid_match_score();

-- Auto-update timestamps
DROP TRIGGER IF EXISTS trigger_update_bid_updated_at ON bids;
CREATE TRIGGER trigger_update_bid_updated_at
  BEFORE UPDATE ON bids
  FOR EACH ROW
  EXECUTE FUNCTION update_bid_updated_at();

DROP TRIGGER IF EXISTS trigger_update_keyword_updated_at ON bid_keywords;
CREATE TRIGGER trigger_update_keyword_updated_at
  BEFORE UPDATE ON bid_keywords
  FOR EACH ROW
  EXECUTE FUNCTION update_bid_updated_at();

DROP TRIGGER IF EXISTS trigger_update_source_updated_at ON bid_sources;
CREATE TRIGGER trigger_update_source_updated_at
  BEFORE UPDATE ON bid_sources
  FOR EACH ROW
  EXECUTE FUNCTION update_bid_updated_at();

-- Auto-increment keyword match count
DROP TRIGGER IF EXISTS trigger_increment_keyword_match ON bids;
CREATE TRIGGER trigger_increment_keyword_match
  AFTER INSERT OR UPDATE OF matched, matched_keywords ON bids
  FOR EACH ROW
  EXECUTE FUNCTION increment_keyword_match_count();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE bid_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE bid_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE bid_activities ENABLE ROW LEVEL SECURITY;

-- Bids policies
DROP POLICY IF EXISTS "Users can view own bids" ON bids;
CREATE POLICY "Users can view own bids"
  ON bids FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own bids" ON bids;
CREATE POLICY "Users can insert own bids"
  ON bids FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own bids" ON bids;
CREATE POLICY "Users can update own bids"
  ON bids FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own bids" ON bids;
CREATE POLICY "Users can delete own bids"
  ON bids FOR DELETE
  USING (auth.uid() = user_id);

-- Keywords policies
DROP POLICY IF EXISTS "Users can view own keywords" ON bid_keywords;
CREATE POLICY "Users can view own keywords"
  ON bid_keywords FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own keywords" ON bid_keywords;
CREATE POLICY "Users can insert own keywords"
  ON bid_keywords FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own keywords" ON bid_keywords;
CREATE POLICY "Users can update own keywords"
  ON bid_keywords FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own keywords" ON bid_keywords;
CREATE POLICY "Users can delete own keywords"
  ON bid_keywords FOR DELETE
  USING (auth.uid() = user_id);

-- Sources policies
DROP POLICY IF EXISTS "Users can view own sources" ON bid_sources;
CREATE POLICY "Users can view own sources"
  ON bid_sources FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own sources" ON bid_sources;
CREATE POLICY "Users can insert own sources"
  ON bid_sources FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own sources" ON bid_sources;
CREATE POLICY "Users can update own sources"
  ON bid_sources FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own sources" ON bid_sources;
CREATE POLICY "Users can delete own sources"
  ON bid_sources FOR DELETE
  USING (auth.uid() = user_id);

-- Activities policies
DROP POLICY IF EXISTS "Users can view own activities" ON bid_activities;
CREATE POLICY "Users can view own activities"
  ON bid_activities FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own activities" ON bid_activities;
CREATE POLICY "Users can insert own activities"
  ON bid_activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- SAMPLE DATA (for development)
-- ============================================================================

-- Insert default keywords for new users
-- This would typically be done via application logic or signup flow

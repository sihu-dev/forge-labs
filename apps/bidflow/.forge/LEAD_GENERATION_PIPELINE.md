# BIDFLOW Lead Generation Pipeline

> **버전**: 1.0.0
> **작성일**: 2025-12-24
> **목적**: B2B Sales Automation for Korean Government Bids & Enterprise Clients

---

## Executive Summary

BIDFLOW의 리드 생성 파이프라인은 나라장터 입찰 공고와 기업 데이터를 결합하여 제조업 SME에게 최적화된 영업 기회를 자동으로 발굴하고 전달합니다.

### 핵심 목표
```yaml
1. 자동 리드 수집: 나라장터 + LinkedIn + 기업 DB
2. 데이터 강화: Clay.com 통합으로 90%+ 정보 완성도
3. 스마트 스코어링: ML 기반 우선순위 자동 배정
4. 실시간 트리거: 신규 입찰/자금 조달/임원 변경 시 즉시 알림
5. 다채널 아웃리치: 이메일/SMS/카카오톡 자동 발송
```

### ROI 예상
- **시간 절감**: 리드 발굴 3시간/일 → 10분/일 (-95%)
- **전환율 향상**: 5% → 15% (+200%)
- **파이프라인 가시성**: 실시간 대시보드
- **예상 연간 효과**: 신규 고객 30+ 획득 (₩50억+ 매출)

---

## 1. Lead Sources (리드 소스)

### 1.1 나라장터 (G2B) - Primary Source

```yaml
소스 ID: g2b_procurement
타입: Government Procurement
우선순위: P0 (최고)
갱신 주기: 매 1시간
월간 공고 수: ~50,000건
필터링 후: ~200건 (유량계 관련)
```

#### 수집 데이터
| 필드 | 설명 | 활용 |
|------|------|------|
| 공고번호 | 고유 ID | 중복 방지 |
| 발주기관 | K-water, 환경공단 등 | 리드 식별 |
| 담당자 | 이름, 부서, 연락처 | Direct Outreach |
| 예정가격 | 입찰 규모 | Lead Scoring |
| 기술 스펙 | 요구사항 문서 | 제품 매칭 |
| 입찰 이력 | 과거 낙찰자 | 경쟁 분석 |

#### API 엔드포인트
```typescript
// 나라장터 API (공식)
const G2B_API = {
  base: 'https://apis.data.go.kr/1230000/BidPublicInfoService04',
  endpoints: {
    bidList: '/getBidPblancListInfoThng01', // 공고 목록
    bidDetail: '/getBidPblancDetailInfoThng01', // 공고 상세
    organization: '/getOrganInfoListThng01', // 기관 정보
  },
  auth: 'API_KEY', // 공공데이터포털 발급
  rateLimit: '1000/day',
};
```

### 1.2 LinkedIn Sales Navigator

```yaml
소스 ID: linkedin_sales
타입: B2B Contact Discovery
우선순위: P1
갱신 주기: 매주
월간 리드 수: ~500명
```

#### 타겟 페르소나
```typescript
interface LinkedInTarget {
  // 직책
  titles: [
    '구매 담당자', '조달팀장',
    '설비 책임자', '공장장',
    'Procurement Manager', 'Plant Manager'
  ];

  // 산업
  industries: [
    '상하수도', '환경', '제조',
    '에너지', '건설', '플랜트'
  ];

  // 기업 규모
  companySize: '50-10000';

  // 지역
  location: ['서울', '경기', '부산', '울산', '전국'];
}
```

#### 수집 데이터
- Full Name, Job Title, Company
- Email (추정), Phone (추정)
- LinkedIn Profile URL
- Company Website
- Company Size, Revenue
- Recent Activity (게시물, 직무 변경)

### 1.3 Company Websites (기업 홈페이지)

```yaml
소스 ID: company_websites
타입: Direct Web Scraping
우선순위: P2
갱신 주기: 매월
월간 크롤링: ~200개 사이트
```

#### 타겟 기업 DB
```sql
-- 크롤링 대상 기업 (200개 사전 선정)
CREATE TABLE target_companies (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  website TEXT NOT NULL,
  industry TEXT,
  estimated_revenue BIGINT,
  employee_count INTEGER,
  procurement_page TEXT,      -- 구매 공고 페이지
  contact_page TEXT,           -- 연락처 페이지
  last_crawled_at TIMESTAMPTZ,
  crawl_status TEXT            -- active, pending, failed
);
```

#### 크롤링 타겟
| 페이지 | 추출 정보 | 활용 |
|--------|----------|------|
| `/procurement` | 구매 공고 | 신규 기회 |
| `/about` | 회사 소개, 사업 분야 | Firmographic Data |
| `/contact` | 담당자 정보 | Direct Contact |
| `/news` | 보도자료, 수주 소식 | Trigger Event |

### 1.4 Industry Databases (산업 DB)

```yaml
소스 ID: industry_db
타입: Paid/Public Databases
우선순위: P2
갱신 주기: 분기별
데이터 소스: NICE신용평가, 한국기업데이터, 산업통계
```

#### 활용 DB
| DB | 제공 정보 | 활용 목적 |
|----|----------|----------|
| **NICE신용평가** | 재무제표, 신용등급, 대표자 | 기업 신용도 |
| **한국기업데이터** | 매출, 종업원 수, 주요 제품 | Firmographic |
| **조달청 종합쇼핑몰** | 과거 입찰 이력, 낙찰률 | Buying Behavior |
| **특허청 KIPRIS** | 특허, 기술 현황 | 혁신도 분석 |

---

## 2. Data Enrichment Flow (데이터 강화)

### 2.1 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                   Lead Enrichment Pipeline                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Raw Lead]                                                     │
│  ┌────────────┐                                                 │
│  │ Company:   │                                                 │
│  │ K-water    │                                                 │
│  │ Contact:   │                                                 │
│  │ 김영수     │                                                 │
│  └─────┬──────┘                                                 │
│        │                                                         │
│        ▼                                                         │
│  ┌────────────────────────────────────────────┐                 │
│  │  Step 1: Company Enrichment (Clay.com)     │                 │
│  │  ────────────────────────────────────────  │                 │
│  │  • Company Domain Discovery                │                 │
│  │  • Employee Count                          │                 │
│  │  • Revenue Estimation                      │                 │
│  │  • Industry Classification                 │                 │
│  │  • Funding History                         │                 │
│  └─────────────────┬──────────────────────────┘                 │
│                    │                                             │
│                    ▼                                             │
│  ┌────────────────────────────────────────────┐                 │
│  │  Step 2: Contact Enrichment                │                 │
│  │  ────────────────────────────────────────  │                 │
│  │  • LinkedIn Profile Extraction             │                 │
│  │  • Email Discovery (Hunter.io)             │                 │
│  │  • Phone Discovery (Apollo.io)             │                 │
│  │  • Email Verification (Clearbit)           │                 │
│  └─────────────────┬──────────────────────────┘                 │
│                    │                                             │
│                    ▼                                             │
│  ┌────────────────────────────────────────────┐                 │
│  │  Step 3: Behavioral Enrichment             │                 │
│  │  ────────────────────────────────────────  │                 │
│  │  • LinkedIn Activity Scraping              │                 │
│  │  • News Mentions (Google News API)         │                 │
│  │  • Competitor Activity                     │                 │
│  │  • Procurement History                     │                 │
│  └─────────────────┬──────────────────────────┘                 │
│                    │                                             │
│                    ▼                                             │
│  [Enriched Lead]                                                │
│  ┌────────────┐                                                 │
│  │ Company:   │ K-water 대전지사                                │
│  │ Domain:    │ kwater.or.kr                                    │
│  │ Size:      │ 1,500명                                         │
│  │ Revenue:   │ ₩8,000억                                        │
│  │ Contact:   │ 김영수 (과장)                                   │
│  │ Email:     │ ys.kim@kwater.or.kr ✅                          │
│  │ Phone:     │ 042-629-XXXX ✅                                 │
│  │ LinkedIn:  │ linkedin.com/in/ys-kim ✅                       │
│  │ History:   │ 5건 입찰 (3건 낙찰)                             │
│  │ Score:     │ 92/100 (HOT LEAD) 🔥                            │
│  └────────────┘                                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Clay.com Integration

```typescript
// Clay.com API 연동
interface ClayEnrichmentRequest {
  company_name: string;
  company_domain?: string;
  contact_name?: string;
  enrichment_options: {
    company_data: boolean;      // 회사 정보
    contact_data: boolean;      // 담당자 정보
    email_discovery: boolean;   // 이메일 발굴
    phone_discovery: boolean;   // 전화번호 발굴
    linkedin_profile: boolean;  // LinkedIn 프로필
    funding_data: boolean;      // 자금 조달 이력
    news_mentions: boolean;     // 뉴스 멘션
  };
}

interface ClayEnrichmentResponse {
  company: {
    name: string;
    domain: string;
    industry: string;
    employee_count: number;
    estimated_revenue: number;
    location: {
      city: string;
      country: string;
      address: string;
    };
    social_profiles: {
      linkedin: string;
      facebook: string;
    };
    funding: {
      total_raised: number;
      last_round_date: string;
      investors: string[];
    };
  };
  contact: {
    full_name: string;
    job_title: string;
    email: string;              // 신뢰도 포함
    email_confidence: number;   // 0-100
    phone: string;
    phone_confidence: number;
    linkedin_url: string;
    recent_activity: string[];
  };
  enrichment_credits_used: number;
}
```

### 2.3 Email Verification Flow

```
1. Email Discovery (Hunter.io)
   ├─ Pattern Detection: firstname.lastname@company.com
   ├─ Confidence Score: 95%
   └─ Sources: 3 (LinkedIn, Company Website, Public Records)

2. Email Verification (Clearbit)
   ├─ SMTP Check: ✅ Valid
   ├─ MX Records: ✅ Configured
   ├─ Disposable: ❌ Not Disposable
   ├─ Role Email: ❌ Not Role (purchasing@...)
   └─ Deliverability: 98%

3. Email Enrichment (Clearbit Enrichment API)
   ├─ Person Data: Name, Title, Seniority
   ├─ Company Data: Revenue, Employees, Industry
   └─ Social Profiles: LinkedIn, Twitter

4. Final Verification (SendGrid Email Validation API)
   ├─ Syntax: ✅
   ├─ Domain: ✅
   ├─ Mailbox: ✅
   └─ Risk Score: 2/100 (Low Risk)
```

---

## 3. Lead Scoring Model (리드 스코어링)

### 3.1 Scoring Framework (100점 만점)

```
┌─────────────────────────────────────────────────────────────────┐
│                  Lead Scoring Model (100 points)                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Firmographic Score (40 points)                           │  │
│  │  ══════════════════════════════════════════════════════  │  │
│  │                                                           │  │
│  │  • Budget (15pts)         • Employee Count (10pts)       │  │
│  │  • Industry Fit (10pts)   • Location (5pts)              │  │
│  │                                                           │  │
│  │  [K-water]                                               │  │
│  │  Budget: ₩185M (15/15) + Size: 1,500명 (10/10)          │  │
│  │  Industry: 상수도 (10/10) + Location: 대전 (5/5)        │  │
│  │  ═══════════════════════════════════════════════════════  │  │
│  │  Total: 40/40 ⭐⭐⭐⭐⭐                                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Behavioral Score (30 points)                             │  │
│  │  ══════════════════════════════════════════════════════  │  │
│  │                                                           │  │
│  │  • Past Purchases (15pts) • Engagement (10pts)           │  │
│  │  • Timeline Fit (5pts)                                   │  │
│  │                                                           │  │
│  │  [K-water]                                               │  │
│  │  History: 5건 입찰 (15/15) + 3개월 내 (5/5)             │  │
│  │  Engagement: 없음 (0/10)                                 │  │
│  │  ═══════════════════════════════════════════════════════  │  │
│  │  Total: 20/30 ⭐⭐⭐                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Contact Quality Score (20 points)                        │  │
│  │  ══════════════════════════════════════════════════════  │  │
│  │                                                           │  │
│  │  • Email Verified (10pts) • Phone Verified (5pts)        │  │
│  │  • Decision Maker (5pts)                                 │  │
│  │                                                           │  │
│  │  [김영수 과장]                                           │  │
│  │  Email: ✅ (10/10) + Phone: ✅ (5/5)                     │  │
│  │  Title: 과장 (3/5)                                       │  │
│  │  ═══════════════════════════════════════════════════════  │  │
│  │  Total: 18/20 ⭐⭐⭐⭐                                     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Intent Score (10 points) - ML Predicted                 │  │
│  │  ══════════════════════════════════════════════════════  │  │
│  │                                                           │  │
│  │  • Buying Signals (5pts)  • Urgency (5pts)               │  │
│  │                                                           │  │
│  │  [K-water 입찰]                                          │  │
│  │  Signal: 신규 입찰 공고 (5/5)                            │  │
│  │  Urgency: 마감 25일 (3/5)                                │  │
│  │  ═══════════════════════════════════════════════════════  │  │
│  │  Total: 8/10 ⭐⭐⭐⭐                                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  📊 FINAL SCORE: 86/100                                   │  │
│  │  🔥 GRADE: A+ (HOT LEAD)                                  │  │
│  │  🎯 PRIORITY: Immediate Outreach                          │  │
│  │  📈 CONVERSION PROBABILITY: 72%                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 ML-Based Qualification

```python
# Lead Scoring ML Model
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler

# 학습 데이터: 과거 1,000건 리드 (성공/실패)
features = [
    'budget',                   # 예산 규모
    'employee_count',           # 종업원 수
    'past_purchases',           # 과거 구매 횟수
    'days_to_deadline',         # 마감까지 일수
    'email_verified',           # 이메일 검증 여부
    'phone_verified',           # 전화번호 검증 여부
    'linkedin_connections',     # LinkedIn 연결 수
    'company_growth_rate',      # 기업 성장률
    'news_mentions_30d',        # 최근 30일 뉴스 멘션
    'competitor_activity'       # 경쟁사 활동 여부
]

# 모델 학습
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)  # y: 0=실패, 1=성공

# 실시간 예측
def predict_conversion_probability(lead_features):
    scaled_features = scaler.transform([lead_features])
    probability = model.predict_proba(scaled_features)[0][1]
    return probability  # 0.0 ~ 1.0
```

### 3.3 Priority Ranking Algorithm

```typescript
// 우선순위 결정 알고리즘
interface LeadPriority {
  score: number;              // 0-100
  grade: 'A+' | 'A' | 'B' | 'C' | 'D';
  priority: 'immediate' | 'high' | 'medium' | 'low';
  conversionProbability: number;  // ML 예측
  recommendedAction: string;
  sla: number;                // 대응 시간 (시간)
}

function calculateLeadPriority(lead: EnrichedLead): LeadPriority {
  const score =
    calculateFirmographicScore(lead) +
    calculateBehavioralScore(lead) +
    calculateContactQualityScore(lead) +
    calculateIntentScore(lead);

  const conversionProbability = mlModel.predict(lead);

  // Grade 결정
  let grade: LeadPriority['grade'];
  if (score >= 90) grade = 'A+';
  else if (score >= 80) grade = 'A';
  else if (score >= 70) grade = 'B';
  else if (score >= 60) grade = 'C';
  else grade = 'D';

  // Priority 결정
  let priority: LeadPriority['priority'];
  let sla: number;

  if (score >= 85 && conversionProbability > 0.7) {
    priority = 'immediate';
    sla = 2;  // 2시간 내 대응
  } else if (score >= 75) {
    priority = 'high';
    sla = 24;  // 1일 내 대응
  } else if (score >= 65) {
    priority = 'medium';
    sla = 72;  // 3일 내 대응
  } else {
    priority = 'low';
    sla = 168;  // 1주일 내 대응
  }

  return {
    score,
    grade,
    priority,
    conversionProbability,
    recommendedAction: generateRecommendedAction(lead, score),
    sla,
  };
}
```

---

## 4. Pipeline Stages (파이프라인 단계)

### 4.1 Stage Definition

```
┌─────────────────────────────────────────────────────────────────┐
│                      Lead Pipeline Flow                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [1] Raw Lead                                                   │
│  ┌────────────┐                                                 │
│  │ 신규 발견  │  Source: G2B, LinkedIn, Website                 │
│  │ 최소 정보  │  Data: Company Name, Contact Name (optional)    │
│  └─────┬──────┘  SLA: N/A                                       │
│        │         Automation: 자동 수집                           │
│        ▼                                                         │
│                                                                 │
│  [2] Enriched                                                   │
│  ┌────────────┐                                                 │
│  │ 데이터 강화│  Source: Clay.com, Hunter.io, Clearbit          │
│  │ 90%+ 완성  │  Data: Email, Phone, LinkedIn, Firmographics    │
│  └─────┬──────┘  SLA: 1시간 이내                                │
│        │         Automation: Clay.com API                        │
│        ▼                                                         │
│                                                                 │
│  [3] Qualified                                                  │
│  ┌────────────┐                                                 │
│  │ 스코어링   │  Score: 60+ (B+ 이상)                            │
│  │ 우선순위   │  Grade: A+, A, B                                │
│  └─────┬──────┘  SLA: 즉시                                       │
│        │         Automation: ML 모델 + 규칙 엔진                 │
│        ▼                                                         │
│                                                                 │
│  [4] Contacted                                                  │
│  ┌────────────┐                                                 │
│  │ 1차 접촉   │  Channel: Email, LinkedIn, Phone                │
│  │ 발송 완료  │  Content: 맞춤형 메시지 (A/B 테스트)            │
│  └─────┬──────┘  SLA: Grade별 (2시간~3일)                       │
│        │         Automation: n8n Workflow + Template             │
│        ▼                                                         │
│                                                                 │
│  [5] Engaged                                                    │
│  ┌────────────┐                                                 │
│  │ 응답 확인  │  Actions: Email 열람, 링크 클릭, 답장             │
│  │ 관심 표명  │  Score Boost: +10 points                        │
│  └─────┬──────┘  SLA: 4시간 내 후속 조치                         │
│        │         Automation: 자동 스코어 업데이트 + 알림          │
│        ▼                                                         │
│                                                                 │
│  [6] Opportunity                                                │
│  ┌────────────┐                                                 │
│  │ 상담 예약  │  Status: 데모 요청, 견적 요청, 미팅 일정 확정    │
│  │ CRM 연동   │  Handoff: 영업팀 배정                           │
│  └─────┬──────┘  SLA: 즉시 알림                                 │
│        │         Automation: CRM (HubSpot/Salesforce) Sync      │
│        ▼                                                         │
│                                                                 │
│  [7] Closed Won / Lost                                          │
│  ┌────────────┐                                                 │
│  │ 계약 성사  │  Won: 신규 고객 등록                            │
│  │ 또는 실패  │  Lost: 실패 사유 기록 → ML 학습                  │
│  └────────────┘  Automation: CRM 동기화 + 성과 리포트             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Stage Metrics (단계별 KPI)

| Stage | Conversion Rate | Avg Time | Bottleneck | Optimization |
|-------|----------------|----------|------------|--------------|
| Raw → Enriched | 95% | 1시간 | API Rate Limit | 배치 처리 |
| Enriched → Qualified | 40% | 즉시 | 낮은 Score | Score 임계값 조정 |
| Qualified → Contacted | 100% | 2-72시간 | 콘텐츠 작성 | 템플릿 자동화 |
| Contacted → Engaged | 25% | 3일 | 낮은 응답률 | A/B 테스트 |
| Engaged → Opportunity | 60% | 7일 | 후속 조치 지연 | 자동 리마인더 |
| Opportunity → Closed Won | 35% | 30일 | 영업 역량 | 세일즈 트레이닝 |

---

## 5. Automation Triggers (자동화 트리거)

### 5.1 Trigger Types

```typescript
// 트리거 정의
enum TriggerType {
  // 데이터 소스 트리거
  NEW_BID_PUBLISHED = 'new_bid_published',           // 신규 입찰 공고
  BID_UPDATED = 'bid_updated',                       // 공고 수정
  BID_DEADLINE_APPROACHING = 'bid_deadline_approaching', // 마감 임박

  // 기업 이벤트 트리거
  COMPANY_FUNDING_NEWS = 'company_funding_news',     // 자금 조달 뉴스
  COMPANY_EXPANSION = 'company_expansion',           // 사업 확장
  NEW_FACILITY_ANNOUNCED = 'new_facility_announced', // 신규 시설

  // 담당자 변경 트리거
  DECISION_MAKER_JOB_CHANGE = 'decision_maker_job_change', // 임원 이동
  NEW_PROCUREMENT_MANAGER = 'new_procurement_manager',     // 신임 구매 담당

  // 경쟁사 트리거
  COMPETITOR_WON_BID = 'competitor_won_bid',         // 경쟁사 낙찰
  COMPETITOR_PRODUCT_LAUNCH = 'competitor_product_launch', // 신제품 출시

  // 행동 기반 트리거
  EMAIL_OPENED = 'email_opened',                     // 이메일 열람
  LINK_CLICKED = 'link_clicked',                     // 링크 클릭
  FORM_SUBMITTED = 'form_submitted',                 // 폼 제출
  WEBSITE_VISITED = 'website_visited',               // 웹사이트 방문
}

interface Trigger {
  id: string;
  type: TriggerType;
  source: string;                 // g2b, linkedin, news, etc.
  timestamp: Date;
  data: Record<string, any>;
  priority: 1 | 2 | 3 | 4 | 5;    // 1=highest, 5=lowest
  actions: TriggerAction[];
}

interface TriggerAction {
  type: 'score_boost' | 'send_alert' | 'send_email' | 'create_task';
  config: Record<string, any>;
  delay?: number;                  // ms
}
```

### 5.2 Trigger Examples

#### 5.2.1 신규 입찰 공고 발행 → 자동 추출 및 알림

```yaml
Trigger: NEW_BID_PUBLISHED
Source: 나라장터 API
Condition:
  - 키워드 포함: "유량계" OR "초음파" OR "전자식"
  - 예정가격 >= ₩50,000,000
  - 마감일 <= 30일 이내

Actions:
  1. Extract Bid Details (즉시)
     - 공고 파싱
     - 발주기관 식별
     - 담당자 정보 추출

  2. Enrich Company Data (1분 이내)
     - Clay.com으로 기관 정보 강화
     - 과거 입찰 이력 조회
     - 담당자 연락처 발굴

  3. Calculate Score (즉시)
     - 175-point matching score
     - Lead scoring (0-100)
     - Priority 배정

  4. Send Alert (5분 이내)
     - Slack 알림: #sales-alerts 채널
     - Email 알림: sales@company.com
     - SMS 알림: 영업팀장 (Score 90+ 시만)

  5. Create Opportunity (자동)
     - CRM에 신규 Opportunity 생성
     - 담당 영업 자동 배정 (Round-robin)
     - Task 생성: "3일 내 초기 접촉"

Response Time: < 10분 (전체 프로세스)
```

#### 5.2.2 기업 자금 조달 뉴스 → 우선순위 상향

```yaml
Trigger: COMPANY_FUNDING_NEWS
Source: Google News API, Naver News
Condition:
  - 대상 기업 리스트 내 (200개 타겟 기업)
  - 키워드: "투자 유치", "Series A/B/C", "IPO", "증자"
  - 기사 발행 <= 7일 이내

Actions:
  1. Score Boost (+20 points)
     - Funding은 구매력 증가 신호
     - Priority 자동 상향 (Low → High)

  2. Update Lead Status
     - Stage: Qualified → Immediate Contact
     - Flag: "Recent Funding" 태그 추가

  3. Personalized Outreach (24시간 이내)
     - 템플릿: "congratulations_on_funding.html"
     - 맞춤 메시지: "[회사명]의 성공적인 투자 유치를 축하합니다..."
     - CTA: "성장에 필요한 설비 투자를 지원하겠습니다"

  4. Sales Alert
     - 영업팀에 즉시 알림
     - 추천 액션: "데모 제안 (확장 중인 시설에 적용)"

Response Time: < 24시간
```

#### 5.2.3 의사결정자 이직 → 재접촉 트리거

```yaml
Trigger: DECISION_MAKER_JOB_CHANGE
Source: LinkedIn Sales Navigator Webhook
Condition:
  - 과거 접촉 이력 있음 (Lost Opportunity)
  - 새 회사가 타겟 산업 (상하수도, 제조, 환경)
  - Job Title: "구매", "조달", "설비", "공장장" 포함

Actions:
  1. Update Contact Record
     - 새 회사 정보 업데이트
     - 새 이메일/전화번호 재발굴 (Clay.com)

  2. Re-engage Sequence (7일 후 시작)
     Day 0: LinkedIn 연결 요청 + 축하 메시지
     Day 3: Email 발송 (재소개 + 새 회사 맞춤 제안)
     Day 7: 전화 통화 시도
     Day 14: 데모 제안

  3. Create New Opportunity
     - 새 회사에 신규 Opportunity 생성
     - 기존 관계 활용 → Priority: High
     - Note: "Previous contact at [이전 회사]"

Response Time: Day 0 (즉시 LinkedIn), Day 3 (Email)
```

#### 5.2.4 이메일 열람 → 후속 조치

```yaml
Trigger: EMAIL_OPENED
Source: SendGrid Webhook
Condition:
  - Email 열람 횟수 >= 2회
  - 링크 클릭: Yes
  - 시간 간격 < 1시간 (높은 관심도)

Actions:
  1. Score Boost (+5 points)
     - Engagement Score 증가

  2. Real-time Alert (즉시)
     - Slack: "@영업담당자님, [담당자명]이 이메일을 2번 열람했습니다!"
     - 추천: "지금 전화하세요 (관심도 HIGH)"

  3. Auto Follow-up (4시간 후)
     - 추가 자료 발송 (제품 카탈로그, 레퍼런스 사례)
     - 템플릿: "follow_up_after_open.html"
     - Subject: "추가 정보가 필요하신가요?"

  4. Update Stage
     - Contacted → Engaged
     - Next Action: "통화 시도" (24시간 내)

Response Time: 즉시 알림, 4시간 후 자동 후속
```

---

## 6. n8n Workflow Design

### 6.1 Main Workflow: Lead Generation Pipeline

```json
{
  "name": "BIDFLOW - Lead Generation Pipeline",
  "nodes": [
    {
      "parameters": {
        "rule": {
          "interval": [
            {
              "field": "hours",
              "triggerAtHour": 9
            }
          ]
        }
      },
      "name": "Schedule Trigger",
      "type": "n8n-nodes-base.scheduleTrigger",
      "position": [240, 300]
    },
    {
      "parameters": {
        "url": "https://apis.data.go.kr/1230000/BidPublicInfoService04/getBidPblancListInfoThng01",
        "method": "GET",
        "queryParameters": {
          "parameters": [
            {
              "name": "ServiceKey",
              "value": "={{$env.G2B_API_KEY}}"
            },
            {
              "name": "inqryDiv",
              "value": "1"
            },
            {
              "name": "inqryBgnDt",
              "value": "={{$now.format('YYYYMMDD')}}"
            },
            {
              "name": "inqryEndDt",
              "value": "={{$now.format('YYYYMMDD')}}"
            },
            {
              "name": "bidNtceNm",
              "value": "유량계"
            }
          ]
        }
      },
      "name": "Fetch G2B Bids",
      "type": "n8n-nodes-base.httpRequest",
      "position": [440, 300]
    },
    {
      "parameters": {
        "functionCode": "// Parse XML response and filter bids\nconst items = [];\nconst xml = $input.all()[0].json;\n\n// XML parsing (simplified)\nconst bids = xml.response.body.items.item;\n\nfor (const bid of bids) {\n  // Filter: Budget >= 50M KRW\n  const budget = parseInt(bid.presmptPrce);\n  if (budget < 50000000) continue;\n\n  // Filter: Keywords\n  const keywords = ['유량계', '초음파', '전자식', '열량계'];\n  const hasKeyword = keywords.some(kw => \n    bid.bidNtceNm.includes(kw) || \n    bid.ntceKndNm.includes(kw)\n  );\n  if (!hasKeyword) continue;\n\n  items.push({\n    json: {\n      bidId: bid.bidNtceNo,\n      title: bid.bidNtceNm,\n      organization: bid.ntceInsttNm,\n      budget: budget,\n      deadline: bid.bidClseDt,\n      url: `https://www.g2b.go.kr:8101/ep/tbid/tbidDetail.do?bidno=${bid.bidNtceNo}`,\n      keywords: keywords.filter(kw => bid.bidNtceNm.includes(kw))\n    }\n  });\n}\n\nreturn items;"
      },
      "name": "Parse and Filter Bids",
      "type": "n8n-nodes-base.code",
      "position": [640, 300]
    },
    {
      "parameters": {
        "url": "https://api.clay.com/v1/enrichments",
        "method": "POST",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth",
        "headers": {
          "parameters": [
            {
              "name": "Authorization",
              "value": "Bearer ={{$env.CLAY_API_KEY}}"
            }
          ]
        },
        "body": {
          "parameters": [
            {
              "name": "company_name",
              "value": "={{$json.organization}}"
            },
            {
              "name": "enrichment_options",
              "value": "={\n  \"company_data\": true,\n  \"contact_data\": true,\n  \"email_discovery\": true\n}"
            }
          ]
        }
      },
      "name": "Enrich with Clay",
      "type": "n8n-nodes-base.httpRequest",
      "position": [840, 300]
    },
    {
      "parameters": {
        "functionCode": "// Calculate Lead Score\nconst bid = $input.item.json;\nconst enrichment = $input.item.json.enrichment;\n\nlet score = 0;\n\n// Firmographic Score (40pts)\nif (bid.budget >= 500000000) score += 15;\nelse if (bid.budget >= 100000000) score += 10;\nelse score += 5;\n\nif (enrichment.company.employee_count >= 1000) score += 10;\nelse if (enrichment.company.employee_count >= 100) score += 7;\nelse score += 3;\n\nconst targetIndustries = ['상하수도', '환경', '제조'];\nif (targetIndustries.some(ind => enrichment.company.industry.includes(ind))) {\n  score += 10;\n}\n\nscore += 5; // Location (assume all Korea)\n\n// Contact Quality Score (20pts)\nif (enrichment.contact.email && enrichment.contact.email_confidence > 80) {\n  score += 10;\n}\nif (enrichment.contact.phone) {\n  score += 5;\n}\nif (enrichment.contact.job_title.includes('담당') || enrichment.contact.job_title.includes('팀장')) {\n  score += 5;\n}\n\n// Intent Score (10pts)\nif (bid.keywords.length >= 3) score += 5;\nconst daysToDeadline = Math.floor((new Date(bid.deadline) - new Date()) / (1000 * 60 * 60 * 24));\nif (daysToDeadline <= 30 && daysToDeadline > 0) score += 5;\n\n// Determine Grade and Priority\nlet grade, priority;\nif (score >= 85) { grade = 'A+'; priority = 'immediate'; }\nelse if (score >= 75) { grade = 'A'; priority = 'high'; }\nelse if (score >= 65) { grade = 'B'; priority = 'medium'; }\nelse { grade = 'C'; priority = 'low'; }\n\nreturn {\n  json: {\n    ...bid,\n    enrichment,\n    lead_score: score,\n    grade,\n    priority,\n    stage: 'qualified'\n  }\n};"
      },
      "name": "Calculate Lead Score",
      "type": "n8n-nodes-base.code",
      "position": [1040, 300]
    },
    {
      "parameters": {
        "conditions": {
          "number": [
            {
              "value1": "={{$json.lead_score}}",
              "operation": "largerEqual",
              "value2": 65
            }
          ]
        }
      },
      "name": "Filter: Score >= 65",
      "type": "n8n-nodes-base.if",
      "position": [1240, 300]
    },
    {
      "parameters": {
        "operation": "insert",
        "table": "leads",
        "columns": "bid_id,title,organization,budget,deadline,url,enrichment_data,lead_score,grade,priority,stage",
        "values": "={{$json.bidId}},={{$json.title}},={{$json.organization}},={{$json.budget}},={{$json.deadline}},={{$json.url}},={{JSON.stringify($json.enrichment)}},={{$json.lead_score}},={{$json.grade}},={{$json.priority}},={{$json.stage}}"
      },
      "name": "Save to Supabase",
      "type": "n8n-nodes-base.postgres",
      "position": [1440, 300]
    },
    {
      "parameters": {
        "conditions": {
          "string": [
            {
              "value1": "={{$json.priority}}",
              "operation": "equals",
              "value2": "immediate"
            }
          ]
        }
      },
      "name": "If Priority = Immediate",
      "type": "n8n-nodes-base.if",
      "position": [1640, 300]
    },
    {
      "parameters": {
        "channel": "#sales-alerts",
        "text": "=🔥 **HOT LEAD** 🔥\\n\\n*Grade*: {{$json.grade}}\\n*Score*: {{$json.lead_score}}/100\\n*Organization*: {{$json.organization}}\\n*Budget*: ₩{{$json.budget.toLocaleString()}}\\n*Deadline*: {{$json.deadline}}\\n\\n*Contact*: {{$json.enrichment.contact.full_name}} ({{$json.enrichment.contact.job_title}})\\n*Email*: {{$json.enrichment.contact.email}}\\n*Phone*: {{$json.enrichment.contact.phone}}\\n\\n👉 [View Bid]({{$json.url}})",
        "attachments": []
      },
      "name": "Send Slack Alert",
      "type": "n8n-nodes-base.slack",
      "position": [1840, 200]
    },
    {
      "parameters": {
        "fromEmail": "sales@bidflow.io",
        "toEmail": "={{$json.enrichment.contact.email}}",
        "subject": "={{$json.organization}} 입찰 공고 관련 문의",
        "emailType": "html",
        "message": "=<html>\\n<body>\\n<p>안녕하세요, {{$json.enrichment.contact.full_name}} {{$json.enrichment.contact.job_title}}님,</p>\\n\\n<p>{{$json.organization}}에서 공고하신 <strong>{{$json.title}}</strong> 입찰 건을 확인하였습니다.</p>\\n\\n<p>저희 CMNTech는 국내 1위 유량계 제조사로, 다음과 같은 강점을 보유하고 있습니다:</p>\\n<ul>\\n<li>✅ K-water 외 200+ 공공기관 납품 실적</li>\\n<li>✅ 경쟁사 대비 30% 가격 경쟁력</li>\\n<li>✅ 24시간 A/S 지원</li>\\n</ul>\\n\\n<p>귀사의 요구사항에 최적화된 제안을 드리고자 합니다.</p>\\n\\n<p><a href=\\\"https://bidflow.io/demo?lead_id={{$json.bidId}}\\\">📅 무료 데모 신청하기</a></p>\\n\\n<p>감사합니다.<br/>\\nCMNTech 영업팀</p>\\n</body>\\n</html>"
      },
      "name": "Send Email",
      "type": "n8n-nodes-base.emailSend",
      "position": [1840, 400]
    }
  ],
  "connections": {
    "Schedule Trigger": {
      "main": [[{ "node": "Fetch G2B Bids", "type": "main", "index": 0 }]]
    },
    "Fetch G2B Bids": {
      "main": [[{ "node": "Parse and Filter Bids", "type": "main", "index": 0 }]]
    },
    "Parse and Filter Bids": {
      "main": [[{ "node": "Enrich with Clay", "type": "main", "index": 0 }]]
    },
    "Enrich with Clay": {
      "main": [[{ "node": "Calculate Lead Score", "type": "main", "index": 0 }]]
    },
    "Calculate Lead Score": {
      "main": [[{ "node": "Filter: Score >= 65", "type": "main", "index": 0 }]]
    },
    "Filter: Score >= 65": {
      "main": [
        [{ "node": "Save to Supabase", "type": "main", "index": 0 }],
        []
      ]
    },
    "Save to Supabase": {
      "main": [[{ "node": "If Priority = Immediate", "type": "main", "index": 0 }]]
    },
    "If Priority = Immediate": {
      "main": [
        [
          { "node": "Send Slack Alert", "type": "main", "index": 0 },
          { "node": "Send Email", "type": "main", "index": 0 }
        ],
        []
      ]
    }
  },
  "settings": {
    "executionOrder": "v1"
  }
}
```

### 6.2 Error Handling Workflow

```json
{
  "name": "BIDFLOW - Error Handler",
  "nodes": [
    {
      "parameters": {},
      "name": "Error Trigger",
      "type": "n8n-nodes-base.errorTrigger",
      "position": [240, 300]
    },
    {
      "parameters": {
        "functionCode": "const error = $input.item.json;\nconst workflow = error.workflow.name;\nconst node = error.node.name;\nconst message = error.error.message;\n\nreturn {\n  json: {\n    workflow,\n    node,\n    message,\n    timestamp: new Date().toISOString(),\n    severity: message.includes('rate limit') ? 'warning' : 'error'\n  }\n};"
      },
      "name": "Parse Error",
      "type": "n8n-nodes-base.code",
      "position": [440, 300]
    },
    {
      "parameters": {
        "channel": "#dev-alerts",
        "text": "=⚠️ **Workflow Error** ⚠️\\n\\n*Workflow*: {{$json.workflow}}\\n*Node*: {{$json.node}}\\n*Message*: {{$json.message}}\\n*Time*: {{$json.timestamp}}\\n*Severity*: {{$json.severity}}"
      },
      "name": "Send Slack Alert",
      "type": "n8n-nodes-base.slack",
      "position": [640, 300]
    },
    {
      "parameters": {
        "operation": "insert",
        "table": "error_logs",
        "columns": "workflow,node,message,timestamp,severity",
        "values": "={{$json.workflow}},={{$json.node}},={{$json.message}},={{$json.timestamp}},={{$json.severity}}"
      },
      "name": "Log to Database",
      "type": "n8n-nodes-base.postgres",
      "position": [840, 300]
    }
  ],
  "connections": {
    "Error Trigger": {
      "main": [[{ "node": "Parse Error", "type": "main", "index": 0 }]]
    },
    "Parse Error": {
      "main": [[
        { "node": "Send Slack Alert", "type": "main", "index": 0 },
        { "node": "Log to Database", "type": "main", "index": 0 }
      ]]
    }
  }
}
```

### 6.3 Rate Limiting Strategy

```typescript
// Rate Limiter for External APIs
interface RateLimitConfig {
  api: string;
  limit: number;           // requests
  window: number;          // seconds
  strategy: 'sliding' | 'fixed';
}

const rateLimits: RateLimitConfig[] = [
  { api: 'g2b', limit: 1000, window: 86400, strategy: 'fixed' },      // 1,000/day
  { api: 'clay', limit: 100, window: 3600, strategy: 'sliding' },     // 100/hour
  { api: 'hunter', limit: 500, window: 2592000, strategy: 'fixed' },  // 500/month
  { api: 'clearbit', limit: 2500, window: 2592000, strategy: 'fixed' },// 2,500/month
];

// Redis-based rate limiter
async function checkRateLimit(api: string): Promise<boolean> {
  const config = rateLimits.find(rl => rl.api === api);
  if (!config) return true;

  const key = `ratelimit:${api}:${Math.floor(Date.now() / (config.window * 1000))}`;
  const count = await redis.incr(key);

  if (count === 1) {
    await redis.expire(key, config.window);
  }

  return count <= config.limit;
}

// Retry with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;

      const delay = baseDelay * Math.pow(2, i);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
}
```

---

## 7. Implementation Roadmap

### Phase 1: MVP (4주)

**Week 1-2: Core Infrastructure**
- [x] Supabase 프로젝트 설정
- [ ] Lead 테이블 스키마 생성
- [ ] 나라장터 API 연동 (완료)
- [ ] n8n 인스턴스 셋업

**Week 3-4: Basic Pipeline**
- [ ] Lead 수집 워크플로우 (G2B only)
- [ ] Clay.com 연동
- [ ] Lead Scoring 알고리즘 (규칙 기반)
- [ ] Slack 알림 통합

### Phase 2: Enrichment (4주)

**Week 5-6: Data Enrichment**
- [ ] Hunter.io 이메일 발굴
- [ ] Clearbit 이메일 검증
- [ ] LinkedIn 프로필 추출
- [ ] 전화번호 발굴 (Apollo.io)

**Week 7-8: Advanced Scoring**
- [ ] ML 모델 학습 (과거 데이터)
- [ ] Conversion Probability 예측
- [ ] A/B 테스트 프레임워크

### Phase 3: Automation (4주)

**Week 9-10: Outreach Automation**
- [ ] 이메일 템플릿 엔진
- [ ] 다채널 발송 (Email, SMS, 카카오톡)
- [ ] 응답 트래킹
- [ ] 자동 후속 조치

**Week 11-12: CRM Integration**
- [ ] HubSpot/Salesforce 연동
- [ ] 양방향 동기화
- [ ] 성과 대시보드

### Phase 4: Intelligence (4주)

**Week 13-14: AI Features**
- [ ] GPT-4 기반 메시지 생성
- [ ] 최적 발송 시간 예측
- [ ] 이탈 예측 모델

**Week 15-16: Scaling**
- [ ] LinkedIn Sales Navigator 자동화
- [ ] 웹사이트 크롤링 (200개 기업)
- [ ] 산업 DB 통합

---

## 8. Success Metrics

### 8.1 Pipeline Health

| Metric | Current | Target (3개월) | Target (6개월) |
|--------|---------|---------------|---------------|
| **Leads/Month** | 0 | 500 | 1,500 |
| **Enrichment Rate** | N/A | 90% | 95% |
| **Score >= 70 Rate** | N/A | 40% | 50% |
| **Email Deliverability** | N/A | 95% | 98% |
| **Response Rate** | N/A | 15% | 25% |
| **Conversion Rate** | N/A | 5% | 10% |

### 8.2 Business Impact

```yaml
Year 1 Projections:
  Leads Generated: 10,000
  Qualified Leads (70+): 4,000
  Responses: 1,000
  Opportunities: 600
  Closed Won: 60

  New Revenue: ₩50억 (Avg ₩83M per deal)
  Pipeline Value: ₩300억
  ROI: 15:1 (₩3억 투자 → ₩50억 매출)
```

---

## Appendix

### A. TypeScript Interfaces

See `/home/user/forge-labs/apps/bidflow/src/types/lead-generation.ts`

### B. n8n Workflows

See `/home/user/forge-labs/apps/bidflow/n8n-workflows/`

### C. Clay.com Templates

See `/home/user/forge-labs/apps/bidflow/.forge/CLAY_TEMPLATES.md`

### D. Email Templates

See `/home/user/forge-labs/apps/bidflow/src/templates/emails/`

---

*BIDFLOW Lead Generation Pipeline v1.0*
*2025-12-24*

# BIDFLOW - 입찰 자동화 시스템

> **🤖 AI 기반 국제입찰 자동화 + 세일즈 파이프라인**

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)
![License](https://img.shields.io/badge/license-MIT-green)

**⚠️ 모노레포 앱**: FORGE LABS 모노레포의 일부입니다. [Root README](../../README.md) 참조

---

## 🎯 핵심 기능

### 📊 입찰 관리 (Phase 3)
- **입찰 공고 자동 수집**: G2B, UNGM, DGMarket 크롤링
- **키워드 매칭**: 자동 입찰 분류 및 스코어링
- **Analytics 대시보드**: 입찰 트렌드, 출처별 분석, 예산 분포
- **수동 입찰 등록**: 직접 입찰 정보 입력 및 관리

### 👥 리드 관리 (Phase 2)
- **리드 대시보드**: 전체 리드 현황 및 필터링
- **리드 스코어링**: AI 기반 리드 품질 평가
- **리드 Analytics**: 전환율, 파이프라인 분석

### 🔗 CRM & 통합 (Phase 1)
- **Apollo.io**: Contact 검색 및 Email 검증
- **Persana AI**: Person/Company 데이터 강화
- **Attio/HubSpot**: CRM 연동 및 동기화
- **n8n**: 워크플로우 자동화

---

## 🚀 Quick Start

### Prerequisites

- Node.js 22+
- pnpm 9+
- Supabase 계정
- API 키: Apollo, Persana, Attio/HubSpot (선택)

### 빠른 시작 (모노레포)

```bash
# 1. Root에서 종속성 설치
cd ../../  # forge-labs root로 이동
pnpm install

# 2. 공유 패키지 빌드
pnpm build:packages

# 3. 환경 변수 설정
cp apps/bidflow/.env.example apps/bidflow/.env.local

# 4. 데이터베이스 마이그레이션
cd apps/bidflow
npx supabase link --project-ref your-project-id
npx supabase db push

# 5. BIDFLOW 개발 서버 실행
cd ../../
pnpm dev:bidflow
# → http://localhost:3010
```

**자세한 가이드**: [Root README](../../README.md) 및 [QUICKSTART.md](../../QUICKSTART.md) 참조

### Workspace 패키지 사용

BIDFLOW는 다음 공유 패키지를 사용합니다:

```json
{
  "dependencies": {
    "@forge/crm": "workspace:*",
    "@forge/integrations": "workspace:*",
    "@forge/types": "workspace:*",
    "@forge/ui": "workspace:*",
    "@forge/utils": "workspace:*",
    "@forge/workflows": "workspace:*"
  }
}
```

---

## 📦 구현된 기능

### Phase 3: Bid Management (완료 ✅)

#### Part 1: Core System
- **Database Schema** (`supabase/migrations/20251225_bid_management.sql`)
  - `bids` 테이블: 입찰 공고 정보
  - `bid_keywords` 테이블: 키워드 관리
  - `bid_sources` 테이블: 크롤링 소스 관리
  - `bid_activities` 테이블: 활동 로그
  - `bid_stats` 뷰: 집계 통계

- **Bid Dashboard** (`dashboard/bids/page.tsx`)
  - 입찰 목록 (필터링, 검색, 정렬)
  - 상태 관리 (검토, 승인, 거부, 완료)
  - 키워드 매칭 점수 표시
  - 리드 생성 추적

- **Core Components**
  - `BidList`: 입찰 목록 테이블
  - `BidFilters`: 고급 필터링 UI
  - `BidStats`: 통계 카드

#### Part 2: Analytics & Keywords
- **Analytics Dashboard** (`dashboard/bids/analytics/page.tsx`)
  - 입찰 통계 (총 건수, 매칭율, 평균 점수)
  - 출처별 분포 (G2B, UNGM, DGMarket)
  - 시간별 트렌드 차트
  - 예산 범위 분석

- **Keyword Manager** (`components/bids/KeywordManager.tsx`)
  - 키워드 CRUD 인터페이스
  - 카테고리별 분류 (product, tech, industry)
  - 우선순위 설정 (high, medium, low)
  - 자동 매칭 통계

- **API Endpoints**
  - `POST /api/v1/bids/keywords`: 키워드 생성
  - `GET /api/v1/bids/keywords`: 키워드 목록

#### Part 3: Manual Bid Creation
- **Bid Create Form** (`components/bids/BidCreateForm.tsx`)
  - 입찰 정보 입력 (제목, 기관, 공고번호)
  - 예산 및 날짜 설정
  - 입찰 유형/방식 선택
  - 설명 및 요구사항
  - 자동 키워드 매칭

### Phase 2: Lead Dashboard (완료 ✅)
- Lead 관리 대시보드
- Lead 스코어링 시스템
- Analytics 시각화

### Phase 1: CRM Integration (완료 ✅)
- Apollo.io 연동
- Persana AI 연동
- Attio/HubSpot CRM
- n8n 워크플로우

---

## 🗄️ Database Schema

### Bid Management (7개 테이블)

| 테이블 | 설명 | 주요 컬럼 |
|--------|------|-----------|
| **bids** | 입찰 공고 | title, org, budget, deadline, status, match_score |
| **bid_keywords** | 키워드 | keyword, category, priority, match_count |
| **bid_sources** | 크롤링 소스 | name, url, type, last_crawled |
| **bid_activities** | 활동 로그 | bid_id, action, user_id, metadata |
| **bid_stats** (View) | 집계 통계 | total, matched, avg_score, by_source |
| **leads** | 리드 정보 | company, contacts, score, status |
| **campaigns** | 캠페인 | name, type, status, metrics |

---

## 🛠️ 스크립트 (모노레포)

Root에서 실행:

```bash
# 개발
pnpm dev:bidflow            # BIDFLOW 개발 서버 시작

# 빌드
pnpm build:bidflow          # BIDFLOW 빌드
pnpm build:packages         # 공유 패키지 빌드

# 테스트
pnpm test --filter=bidflow-standalone      # 단위 테스트
pnpm typecheck:bidflow                     # 타입 체크

# 린트
pnpm lint --filter=bidflow-standalone      # ESLint 실행

# 배포
./deploy.sh bidflow                        # Vercel 배포
./scripts/test-health-checks.sh local      # Health Check 테스트
```

앱 디렉토리에서 직접 실행:

```bash
cd apps/bidflow

# 데이터베이스
npm run db:push            # Supabase 마이그레이션
npm run db:reset           # 데이터베이스 리셋

# 테스트
npm run test               # Vitest 단위 테스트
npm run test:e2e           # Playwright E2E 테스트
```

---

## 🏗️ 프로젝트 구조

```
apps/bidflow/
├── src/
│   ├── app/
│   │   ├── (dashboard)/
│   │   │   └── dashboard/
│   │   │       ├── bids/              # 입찰 관리
│   │   │       │   ├── page.tsx       # 입찰 목록
│   │   │       │   ├── analytics/     # 분석 대시보드
│   │   │       │   └── new/           # 수동 등록
│   │   │       ├── leads/             # 리드 관리
│   │   │       ├── campaigns/         # 캠페인 관리
│   │   │       └── workflows/         # 워크플로우
│   │   └── api/
│   │       ├── v1/
│   │       │   ├── bids/              # 입찰 API
│   │       │   │   └── keywords/      # 키워드 API
│   │       │   ├── leads/             # 리드 API
│   │       │   └── campaigns/         # 캠페인 API
│   │       └── health/                # Health Check
│   ├── components/
│   │   ├── bids/                      # 입찰 컴포넌트
│   │   │   ├── BidList.tsx
│   │   │   ├── BidFilters.tsx
│   │   │   ├── BidStats.tsx
│   │   │   ├── BidCreateForm.tsx
│   │   │   ├── KeywordManager.tsx
│   │   │   └── analytics/
│   │   ├── leads/                     # 리드 컴포넌트
│   │   ├── campaigns/                 # 캠페인 컴포넌트
│   │   └── ui/                        # 공통 UI
│   ├── lib/
│   │   ├── supabase/                  # Supabase 클라이언트
│   │   └── utils/                     # 유틸리티
│   └── types/                         # TypeScript 타입
├── supabase/
│   └── migrations/
│       ├── 20251225_bid_management.sql
│       └── ...
├── public/
├── package.json
└── README.md (이 파일)
```

---

## 🎨 UI/UX

### Design System
- **Framework**: Tailwind CSS 3.4
- **Components**: Radix UI + Custom
- **Icons**: Heroicons
- **Charts**: ECharts

### Key Features
- 반응형 디자인 (Mobile/Tablet/Desktop)
- 다크 모드 지원
- 인터랙티브 차트
- 실시간 업데이트

---

## 📈 예상 성과 (3개월)

| 지표 | 목표 |
|------|------|
| 월 처리 건수 | 1,000건 분석 |
| 승인율 | 8% (80건 승인) |
| 계약 전환율 | 12.5% (10건 계약) |
| 월 수익 | ₩4,000,000 |
| ROI (12개월) | 238% |

---

## 🔗 외부 API 연동

### Apollo.io
```typescript
import { apolloClient } from '@forge/integrations';

const result = await apolloClient.searchPeople({
  q_organization_domains: 'example.com',
  per_page: 10
});
```

### Persana AI
```typescript
import { persanaClient } from '@forge/integrations';

const enriched = await persanaClient.enrichPerson({
  email: 'contact@example.com'
});
```

### Attio CRM
```typescript
import { attioClient } from '@forge/crm';

await attioClient.createRecord('companies', {
  name: 'Example Corp',
  domain: 'example.com'
});
```

---

## 🏥 Health Check

**Endpoint**: `/api/health`

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-12-25T05:30:00.000Z",
  "checks": {
    "database": "healthy",
    "system": "healthy"
  },
  "version": "97d9d66",
  "uptime": 12345,
  "responseTime": "12ms"
}
```

**테스트**:
```bash
./scripts/test-health-checks.sh local
curl http://localhost:3010/api/health
```

---

## 🚀 배포

### Vercel 배포

```bash
# 자동 배포
./deploy.sh bidflow

# 수동 배포
cd apps/bidflow
vercel --prod
```

### 환경 변수

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Apollo.io
APOLLO_API_KEY=your_key

# Persana AI
PERSANA_API_KEY=your_key

# Attio CRM (선택)
ATTIO_API_KEY=your_key

# n8n Webhook
N8N_WEBHOOK_URL=your_webhook_url
```

---

## 📚 문서

- [Root README](../../README.md) - 모노레포 전체 가이드
- [PRODUCTION_DEPLOYMENT.md](../../PRODUCTION_DEPLOYMENT.md) - 배포 가이드
- [MONOREPO_OPTIMIZATION.md](../../MONOREPO_OPTIMIZATION.md) - 최적화 가이드
- [MONITORING.md](../../MONITORING.md) - 모니터링 가이드

---

## 📄 License

MIT License

---

**Made with Claude Sonnet 4.5 via Claude Code**

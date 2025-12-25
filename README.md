# FORGE LABS

> 나노인자 기반 AI 플랫폼 통합 모노레포
>
> ```
> ┌─────────────────────────────────────────────────────────────────┐
> │                         FORGE LABS                               │
> │                                                                   │
> │     🔥 HEPHAITOS        │        📊 BIDFLOW                      │
> │     AI Trading Engine   │     Sales Automation                   │
> │          B2C            │           B2B                          │
> │                                                                   │
> └─────────────────────────────────────────────────────────────────┘
> ```
>
> ---

## 🚀 모노레포 최적화 완료

- ✅ **중복 제거**: -385KB (103 files)
- ✅ **빌드 속도**: 30-80% 향상 (Remote caching)
- ✅ **Workspace 구조**: 통합된 패키지 관리
- ✅ **프로덕션 준비**: 배포 자동화 + Health Check

**자세한 내용**: [MONOREPO_OPTIMIZATION.md](./MONOREPO_OPTIMIZATION.md)

---

## 나노인자 계층 구조

| Level | 이름 | 설명 | 디렉토리 |
|-------|------|------|----------|
| L0 | Atoms | 타입, 상수, 설정 | `packages/@forge/types` |
| L1 | Molecules | 유틸 함수, 검증기 | `packages/@forge/utils` |
| L2 | Cells | 서비스, 리포지토리 | `packages/@forge/core` |
| L3 | Tissues | 에이전트, 모듈 | `apps/*/agents` |
| L4 | Organs | API, 비즈니스 레이어 | `apps/*/api` |
| L5 | System | 전체 앱 | `apps/*` |

### 의존성 규칙
```
L5 → L4 → L3 → L2 → L1 → L0
(상위 레벨은 하위 레벨만 참조 가능)
```

---

## 프로젝트 구조

```
forge-labs/
├── .forge/                 # FORGE 설계 시스템
├── packages/               # 공유 패키지 (Workspace)
│   ├── types/             # @forge/types (L0)
│   ├── utils/             # @forge/utils (L1)
│   ├── core/              # @forge/core (L2)
│   ├── ui/                # @forge/ui (UI 컴포넌트)
│   ├── crm/               # @forge/crm (CRM 통합)
│   ├── integrations/      # @forge/integrations (외부 API)
│   ├── workflows/         # @forge/workflows (자동화)
│   ├── tsconfig/          # @forge/tsconfig (공유 TS 설정)
│   └── eslint-config/     # @forge/eslint-config (공유 ESLint)
├── apps/                   # 앱
│   ├── hephaitos/         # 트레이딩 AI 에이전트 (포트 3000)
│   └── bidflow/           # 세일즈 자동화 시스템 (포트 3010)
├── scripts/                # 자동화 스크립트
│   ├── deploy.sh          # 배포 자동화
│   └── test-health-checks.sh  # Health Check 테스트
├── package.json            # Root workspace
├── turbo.json              # Turborepo 설정 (최적화됨)
├── .npmrc                  # pnpm 최적화 설정
├── PRODUCTION_DEPLOYMENT.md  # 배포 가이드
├── MONOREPO_OPTIMIZATION.md  # 최적화 가이드
├── QUICKSTART.md           # 빠른 시작
└── MONITORING.md           # 모니터링 가이드
```

---

## 빠른 시작

### 1. 설치

```bash
git clone https://github.com/sihu-dev/forge-labs.git
cd forge-labs
pnpm install
```

### 2. 환경 변수 설정

```bash
# HEPHAITOS
cp apps/hephaitos/.env.example apps/hephaitos/.env.local

# BIDFLOW
cp apps/bidflow/.env.example apps/bidflow/.env.local
```

### 3. 패키지 빌드

```bash
# 공유 패키지 먼저 빌드
pnpm build:packages
```

### 4. 개발 서버 실행

```bash
# 모든 앱 동시 실행
pnpm dev

# 특정 앱만 실행
pnpm dev:hephaitos  # → http://localhost:3000
pnpm dev:bidflow    # → http://localhost:3010
```

### 5. 빌드 & 배포

```bash
# 전체 빌드
pnpm build

# 전체 배포 (Vercel)
./deploy.sh both
```

**자세한 가이드**: `QUICKSTART.md` 참조

---

## 앱 상세

### 🔥 HEPHAITOS (B2C)
**트레이딩 AI 에이전트 엔진**

- 포트폴리오 동기화 (다중 거래소)
- 전략 백테스팅
- 뉴스 알림 분석
- 실시간 시세 모니터링
- 크레딧 기반 가격 모델

**README**: [apps/hephaitos/README.md](./apps/hephaitos/README.md)

### 📊 BIDFLOW (B2B)
**세일즈 자동화 시스템**

- 입찰 공고 자동 분석 (G2B, UNGM, DGMarket)
- 리드 관리 & 스코어링
- 자동 이메일 시퀀스
- CRM 통합 (Apollo, Persana, Attio, HubSpot)
- 분석 대시보드 & Keyword Matching

**README**: [apps/bidflow/README.md](./apps/bidflow/README.md)

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| 언어 | TypeScript 5.7 (strict mode) |
| 런타임 | Node.js 22 LTS |
| 프레임워크 | Next.js 15 |
| 데이터베이스 | Supabase (PostgreSQL) |
| 모노레포 | Turborepo + pnpm (최적화됨) |
| AI | Anthropic Claude 4 |
| 테스트 | Vitest |
| 배포 | Vercel |
| 모니터링 | Sentry, Vercel Analytics |

---

## 스크립트

### 기본 명령어

| 명령어 | 설명 |
|--------|------|
| `pnpm dev` | 모든 앱 개발 서버 실행 |
| `pnpm build` | 전체 프로덕션 빌드 |
| `pnpm test` | 전체 테스트 실행 |
| `pnpm lint` | 전체 린트 검사 |
| `pnpm typecheck` | 전체 타입 체크 |
| `pnpm format` | 코드 포맷팅 |
| `pnpm clean` | 빌드 캐시 정리 |

### 앱별 명령어

| 명령어 | 설명 |
|--------|------|
| `pnpm dev:hephaitos` | HEPHAITOS만 실행 (포트 3000) |
| `pnpm dev:bidflow` | BIDFLOW만 실행 (포트 3010) |
| `pnpm build:hephaitos` | HEPHAITOS만 빌드 |
| `pnpm build:bidflow` | BIDFLOW만 빌드 |
| `pnpm build:packages` | 공유 패키지만 빌드 |
| `pnpm typecheck:hephaitos` | HEPHAITOS만 타입 체크 |
| `pnpm typecheck:bidflow` | BIDFLOW만 타입 체크 |

### 검증 & 유틸리티

| 명령어 | 설명 |
|--------|------|
| `pnpm check` | 전체 검증 (typecheck + lint + test) |
| `pnpm check:packages` | 패키지만 검증 |
| `pnpm lint:fix` | 린트 자동 수정 |
| `pnpm format:check` | 포맷 검사 |
| `pnpm clean:cache` | Turbo 캐시만 정리 |
| `pnpm deps:check` | 오래된 패키지 확인 |
| `pnpm deps:update` | 패키지 최신화 |
| `pnpm graph` | 빌드 그래프 시각화 |

### 배포 & 모니터링

| 명령어 | 설명 |
|--------|------|
| `./deploy.sh both` | 전체 배포 (HEPHAITOS + BIDFLOW) |
| `./deploy.sh hephaitos` | HEPHAITOS만 배포 |
| `./deploy.sh bidflow` | BIDFLOW만 배포 |
| `./scripts/test-health-checks.sh local` | 로컬 Health Check 테스트 |
| `./scripts/test-health-checks.sh production` | 프로덕션 Health Check 테스트 |

---

## 📚 문서

- [QUICKSTART.md](./QUICKSTART.md) - 15분 빠른 시작 가이드
- [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md) - 프로덕션 배포 가이드
- [MONOREPO_OPTIMIZATION.md](./MONOREPO_OPTIMIZATION.md) - 모노레포 최적화 상세
- [MONITORING.md](./MONITORING.md) - 모니터링 & SLA 가이드
- [CLAUDE.md](./CLAUDE.md) - Claude Code 통합 가이드

---

## 🏥 Health Check 엔드포인트

모든 앱에 프로덕션 Health Check 엔드포인트 구현:

- **HEPHAITOS**: `/api/health` - Database, Redis, System 체크
- **BIDFLOW**: `/api/health` - Database, System 체크

**테스트**:
```bash
./scripts/test-health-checks.sh local
```

---

## 라이선스

MIT License

---

**FORGE LABS** - 나노인자 기반 체계적 AI 플랫폼 개발

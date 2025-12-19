# FORGE LABS

> 나노인자 기반 AI 플랫폼 통합 모노레포

```
┌─────────────────────────────────────────────────────────────────┐
│                         FORGE LABS                              │
│                                                                 │
│   🔥 HEPHAITOS    │   📊 FOLIO      │   🌱 DRYON              │
│   AI Agent Engine │   SMB AI SaaS   │   Industrial IoT AI     │
│   B2C             │   B2B           │   B2G                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

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
├── .forge/                    # FORGE 설계 시스템
│   ├── MASTER_PROMPT.md       # 마스터 프롬프트
│   ├── prompts/               # 쿼리 프롬프트
│   │   ├── 001-feature-analysis.md
│   │   ├── 002-architecture-design.md
│   │   ├── 003-implementation.md
│   │   └── 004-verification.md
│   ├── query/                 # 쿼리 실행 시스템
│   ├── memory/                # 설계 결정 메모리
│   ├── state/                 # 현재 쿼리 상태
│   └── specs/                 # 기능 명세서
│
├── packages/                  # 공유 패키지
│   ├── types/                 # @forge/types (L0)
│   ├── utils/                 # @forge/utils (L1)
│   ├── crawler/               # @forge/crawler (L2)
│   ├── llm-extract/           # @forge/llm-extract (L2)
│   ├── excel-export/          # @forge/excel-export (L2)
│   ├── supabase/              # @forge/supabase (L2)
│   └── core/                  # @forge/core (L3)
│
├── apps/                      # 앱
│   ├── hephaitos/             # 트레이딩 AI 에이전트
│   ├── folio/                 # 소상공인 AI SaaS
│   └── dryon/                 # 산업 IoT AI
│
├── package.json
├── turbo.json
└── pnpm-workspace.yaml
```

---

## 빠른 시작

### 1. 설치

```bash
# 저장소 클론
git clone https://github.com/forge-labs/forge-labs.git
cd forge-labs

# 의존성 설치
pnpm install

# 환경 변수 설정
cp .env.example .env
# .env 파일 편집하여 API 키 설정
```

### 2. 개발 서버 실행

```bash
# 모든 앱 동시 실행
pnpm dev

# 특정 앱만 실행
pnpm dev --filter=hephaitos
pnpm dev --filter=folio
pnpm dev --filter=dryon
```

### 3. 빌드

```bash
# 전체 빌드
pnpm build

# 특정 패키지만 빌드
pnpm build --filter=@forge/types
```

---

## FORGE 쿼리 시스템

나노인자 기반 체계적 개발을 위한 쿼리 시스템입니다.

### 워크플로우

```
FEATURE REQUEST → ANALYSIS → DESIGN → IMPLEMENT → VERIFY
```

### 쿼리 명령어

```bash
# 1. 새 기능 분석
/forge feature portfolio-sync --app hephaitos --priority P1

# 2. 아키텍처 설계
/forge design ExchangeService --level 2 --parent portfolio-sync

# 3. 구현
/forge implement ExchangeService --spec specs/portfolio-sync.yaml

# 4. 검증
/forge verify ExchangeService --files "src/services/*"
```

### 쿼리 출력물

| 쿼리 | 출력 파일 |
|------|----------|
| feature | `.forge/specs/{feature}.yaml` |
| design | `.forge/specs/arch/{module}.md` |
| implement | `src/**/*.ts` |
| verify | `.forge/reports/{component}-verification.yaml` |

---

## 앱 상세

### 🔥 HEPHAITOS (B2C)

**트레이딩 AI 에이전트 엔진**

- 포트폴리오 동기화 (다중 거래소)
- 전략 백테스팅
- 뉴스 알림 분석
- 실시간 시세 모니터링

### 📊 FOLIO (B2B)

**소상공인 AI SaaS**

- 경쟁사 모니터링
- 매출 예측
- 카드 매출 분석
- 가격 최적화 추천

### 🌱 DRYON (B2G)

**산업 IoT AI**

- 센서 데이터 크롤링 (Modbus, OPC-UA, MQTT)
- 공정 최적화 추천
- 에너지 효율 분석
- 자동 리포트 생성

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| **언어** | TypeScript 5.x (strict mode) |
| **런타임** | Node.js 22 LTS |
| **프레임워크** | Next.js 15 |
| **데이터베이스** | Supabase (PostgreSQL) |
| **모노레포** | Turborepo + pnpm |
| **AI** | OpenAI GPT-4o, Anthropic Claude |
| **테스트** | Vitest |

---

## 스크립트

| 명령어 | 설명 |
|--------|------|
| `pnpm dev` | 개발 서버 실행 |
| `pnpm build` | 프로덕션 빌드 |
| `pnpm test` | 테스트 실행 |
| `pnpm lint` | 린트 검사 |
| `pnpm typecheck` | 타입 체크 |
| `pnpm format` | 코드 포맷팅 |
| `pnpm clean` | 빌드 캐시 정리 |

---

## 라이선스

MIT License

---

*FORGE LABS - 나노인자 기반 체계적 AI 플랫폼 개발*

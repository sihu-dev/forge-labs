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
>
> ## 나노인자 계층 구조
>
> | Level | 이름 | 설명 | 디렉토리 |
> |-------|------|------|----------|
> | L0 | Atoms | 타입, 상수, 설정 | `packages/@forge/types` |
> | L1 | Molecules | 유틸 함수, 검증기 | `packages/@forge/utils` |
> | L2 | Cells | 서비스, 리포지토리 | `packages/@forge/core` |
> | L3 | Tissues | 에이전트, 모듈 | `apps/*/agents` |
> | L4 | Organs | API, 비즈니스 레이어 | `apps/*/api` |
> | L5 | System | 전체 앱 | `apps/*` |
>
> ### 의존성 규칙
> ```
> L5 → L4 → L3 → L2 → L1 → L0
> (상위 레벨은 하위 레벨만 참조 가능)
> ```
>
> ---
>
> ## 프로젝트 구조
>
> ```
> forge-labs/
> ├── .forge/                 # FORGE 설계 시스템
> ├── packages/               # 공유 패키지
> │   ├── types/             # @forge/types (L0)
> │   ├── utils/             # @forge/utils (L1)
> │   ├── core/              # @forge/core (L2)
> │   └── ui/                # @forge/ui
> ├── apps/                   # 앱
> │   ├── hephaitos/         # 트레이딩 AI 에이전트
> │   └── bidflow/           # 세일즈 자동화 시스템
> ├── package.json
> ├── turbo.json
> └── pnpm-workspace.yaml
> ```
>
> ---
>
> ## 빠른 시작
>
> ### 1. 설치
>
> ```bash
> git clone https://github.com/sihu-dev/forge-labs.git
> cd forge-labs
> pnpm install
> cp .env.example .env
> ```
>
> ### 2. 개발 서버 실행
>
> ```bash
> # 모든 앱 동시 실행
> pnpm dev
>
> # 특정 앱만 실행
> pnpm dev --filter=hephaitos
> pnpm dev --filter=bidflow
> ```
>
> ### 3. 빌드
>
> ```bash
> pnpm build
> ```
>
> ---
>
> ## 앱 상세
>
> ### 🔥 HEPHAITOS (B2C)
> 트레이딩 AI 에이전트 엔진
> - 포트폴리오 동기화 (다중 거래소)
> - - 전략 백테스팅
>   - - 뉴스 알림 분석
>     - - 실시간 시세 모니터링
>      
>       - ### 📊 BIDFLOW (B2B)
>       - 세일즈 자동화 시스템
>       - - 리드 관리
>         - - 자동 이메일 시퀀스
>           - - CRM 통합
>             - - 분석 대시보드
>              
>               - ---
>
> ## 기술 스택
>
> | 영역 | 기술 |
> |------|------|
> | 언어 | TypeScript 5.x (strict mode) |
> | 런타임 | Node.js 22 LTS |
> | 프레임워크 | Next.js 15 |
> | 데이터베이스 | Supabase (PostgreSQL) |
> | 모노레포 | Turborepo + pnpm |
> | AI | OpenAI GPT-4o, Anthropic Claude |
> | 테스트 | Vitest |
>
> ---
>
> ## 스크립트
>
> | 명령어 | 설명 |
> |--------|------|
> | `pnpm dev` | 개발 서버 실행 |
> | `pnpm build` | 프로덕션 빌드 |
> | `pnpm test` | 테스트 실행 |
> | `pnpm lint` | 린트 검사 |
> | `pnpm typecheck` | 타입 체크 |
> | `pnpm format` | 코드 포맷팅 |
> | `pnpm clean` | 빌드 캐시 정리 |
>
> ---
>
> ## 라이선스
>
> MIT License
>
> ---
>
> **FORGE LABS** - 나노인자 기반 체계적 AI 플랫폼 개발

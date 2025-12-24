# FORGE LABS 모노레포 총괄 시스템 v5.0

> **핵심 프로젝트**: HEPHAITOS (트레이딩 교육) + BIDFLOW (입찰 자동화)
> **원격 제어**: 모바일 Claude 앱 → Claude Code 연동
> **아키텍처**: Turborepo 모노레포 + Nano-Factor 계층

---

## 빠른 시작 (모바일용 단축 명령)

| 명령 | 동작 |
|------|------|
| `ㅅ` | 전체 상태 확인 |
| `ㅎ` | HEPHAITOS 개발 |
| `ㅂ` | BIDFLOW 개발 |
| `ㄱ` | 다음 태스크 실행 |
| `ㅋ` | 커밋 & 푸시 |
| `ㅊ` | 코드 리뷰 |
| `ㅌ` | 테스트 실행 |
| `ㅍ` | 배포 |

---

## 프로젝트 구조

```
forge-labs/
├── apps/
│   ├── hephaitos/      ← 트레이딩 교육 플랫폼 (포트 3000)
│   └── bidflow/        ← 입찰 자동화 시스템 (포트 3010)
│
├── packages/           ← 공유 패키지
│   ├── types/          ← L0: 타입 정의
│   ├── utils/          ← L1: 유틸리티
│   ├── core/           ← L2: 비즈니스 로직
│   ├── ui/             ← L2: UI 컴포넌트
│   ├── crm/            ← CRM 통합 (Attio, HubSpot)
│   ├── integrations/   ← 외부 API (Apollo, Persana, n8n)
│   └── workflows/      ← 자동화 워크플로우
│
├── supabase/           ← DB 마이그레이션
└── .claude/commands/   ← Claude Code 스킬
```

---

## 두 프로젝트 개요

### HEPHAITOS (트레이딩 교육)
| 항목 | 내용 |
|------|------|
| 목적 | B2B2C 트레이딩 교육 플랫폼 |
| 대상 | 유튜버(멘토) → 수강생(멘티) |
| 핵심기능 | No-Code 전략 빌더, 백테스트, 실계좌 연동 |
| 수익모델 | 수강료 70:30, 크레딧 30:70, 브로커 CPA 50:50 |
| 기술스택 | Next.js 14, Supabase, Binance/Upbit API |

### BIDFLOW (입찰 자동화)
| 항목 | 내용 |
|------|------|
| 목적 | 국제입찰 자동화 + 세일즈 자동화 |
| 대상 | 중소기업, 무역회사 |
| 핵심기능 | 입찰공고 크롤링, 리드 스코어링, 아웃리치 자동화 |
| 수익모델 | SaaS 구독, 컨설팅, 성공 수수료 |
| 기술스택 | Next.js 14, Supabase, n8n, Apollo/Persana |

### 크로스셀 연동
```
BIDFLOW 고객 → HEPHAITOS 금융교육 추천
HEPHAITOS 수강생 → BIDFLOW 해외조달 추천
```

---

## Nano-Factor 계층

| 계층 | 위치 | 역할 | 예시 |
|------|------|------|------|
| L0 | packages/types/ | 타입 정의 | IStrategy, ILead |
| L1 | packages/utils/ | 유틸리티 | backtest-calc, lead-scoring |
| L2 | packages/core/ | 비즈니스 로직 | ExchangeService, CRMProvider |
| L2 | packages/ui/ | UI 컴포넌트 | Button, DataTable |
| L3 | apps/*/src/ | 애플리케이션 | 페이지, API 라우트 |

---

## 개발 워크플로우

### 1. 상태 확인
```
ㅅ (또는 /status)
```

### 2. 프로젝트 선택
```
ㅎ → HEPHAITOS 컨텍스트
ㅂ → BIDFLOW 컨텍스트
```

### 3. 태스크 실행
```
ㄱ → 자동으로 다음 우선순위 태스크 실행
ㄱㄱㄱ → 3개 연속 실행
```

### 4. 커밋 & 푸시
```
ㅋ → 변경사항 커밋 & 푸시
```

---

## 주요 명령어 상세

### 상태 (ㅅ)
```markdown
## FORGE LABS 상태

### HEPHAITOS
- 진행률: ████████░░ 80%
- 다음: No-Code 빌더 완성

### BIDFLOW
- 진행률: ██████░░░░ 60%
- 다음: 리드 스코어링 API

### 공유 패키지
- types: ✅ 완료
- utils: ✅ 완료
- core: 🔄 진행중
- ui: ✅ 완료
```

### HEPHAITOS (ㅎ)
```
ㅎ 빌더 → No-Code 빌더 작업
ㅎ 백테스트 → 백테스트 엔진 작업
ㅎ 거래소 → 거래소 연동 작업
ㅎ 멘토 → 멘토/멘티 시스템 작업
```

### BIDFLOW (ㅂ)
```
ㅂ 리드 → 리드 관리 작업
ㅂ 캠페인 → 캠페인 관리 작업
ㅂ 워크플로우 → n8n 워크플로우 작업
ㅂ 입찰 → 입찰 크롤링 작업
```

---

## Claude Code 스킬 (14개)

| 스킬 | 명령어 | 설명 |
|------|--------|------|
| forge-master | /forge-master | 메인 오케스트레이터 |
| status | /status | 전체 상태 확인 |
| hephaitos | /hephaitos | HEPHAITOS 개발 모드 |
| bidflow | /bidflow | BIDFLOW 개발 모드 |
| init | /init | 환경 초기화 |
| bootstrap | /bootstrap | 원스톱 초기화 |
| next | /next | 다음 태스크 |
| monitor | /monitor | 관제 대시보드 |
| design | /design | 디자인 벤치마킹 |
| start | /start | 세션 시작 |
| db-schema | /db-schema | DB 스키마 설계 |
| business-plan | /business-plan | 사업계획서 |
| fullstack-init | /fullstack-init | 풀스택 초기화 |
| vscode-setup | /vscode-setup | VS Code 설정 |

---

## 핵심 원칙

### DO ✅
1. **UX 사용자 친화성** - 직관적 UI, 최소 단계
2. **사업 본질 정렬** - 비즈니스 목표 직결 기능만
3. **기술 효율성** - 최신 오픈소스 우선
4. **자동화 우선** - API 자동 발급
5. **프로덕션 품질** - 오류 제로 목표

### DON'T ❌
- 아이콘 남발
- 커스텀 폰트 (오픈소스만)
- 딱딱한 카피
- 수동 작업 요청
- 레거시 기술

---

## 기술 스택

### 공통
- **프레임워크**: Next.js 14 (App Router)
- **언어**: TypeScript
- **DB**: Supabase (PostgreSQL)
- **인증**: Supabase Auth
- **스타일**: Tailwind CSS
- **빌드**: Turborepo

### HEPHAITOS 전용
- 거래소 API: Binance, Upbit, KIS
- 차트: TradingView Lightweight Charts
- 상태관리: Zustand

### BIDFLOW 전용
- 자동화: n8n
- 리드 강화: Apollo, Persana
- CRM: Attio, HubSpot
- 이메일: Resend

---

## 현재 진행 상태

### HEPHAITOS
- ✅ 타입 시스템 (8개 파일)
- ✅ 유틸리티 (backtest-calc, signal-detector 등)
- ✅ 코어 서비스 (ExchangeService, PriceDataService)
- ✅ UI 컴포넌트 (30개)
- 🔄 No-Code 빌더 (블록 정의 완료)
- ⏳ 백테스트 엔진 연결
- ⏳ 실계좌 연동

### BIDFLOW
- ✅ 자동화 대시보드
- ✅ 리드 관리 UI
- ✅ 캠페인 관리 UI
- ✅ 워크플로우 관리 UI
- ✅ CRM 패키지 (Attio, HubSpot)
- ✅ Integrations 패키지 (Apollo, Persana, n8n)
- 🔄 API 연결
- ⏳ n8n 워크플로우 실제 배포

### 공유 패키지
- ✅ packages/types
- ✅ packages/utils
- ✅ packages/core
- ✅ packages/ui
- ✅ packages/crm
- ✅ packages/integrations
- ✅ packages/workflows

---

## Git 워크플로우

### 브랜치 전략
```
main ← 프로덕션
  └── feat/hephaitos-* ← HEPHAITOS 기능
  └── feat/bidflow-* ← BIDFLOW 기능
  └── fix/* ← 버그 수정
```

### 커밋 컨벤션
```
feat: 새 기능
fix: 버그 수정
chore: 설정/정리
docs: 문서
refactor: 리팩토링
```

### 자동 커밋 (ㅋ)
```bash
# 자동 감지하여 적절한 커밋 메시지 생성
# 푸시까지 자동 실행
```

---

## 배포

### Vercel (권장)
```
apps/hephaitos → hephaitos.vercel.app
apps/bidflow → bidflow.vercel.app
```

### 환경변수
```env
# 공통
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# HEPHAITOS
BINANCE_API_KEY=
UPBIT_API_KEY=

# BIDFLOW
APOLLO_API_KEY=
PERSANA_API_KEY=
N8N_WEBHOOK_URL=
ATTIO_API_KEY=
```

---

## 문서

### 핵심 문서 (3개)
```
.forge/
├── BUSINESS_PLAN.md      ← 사업계획서
├── DEVELOPMENT_PLAN.md   ← 개발계획서
└── HEPHAITOS_ARCHITECTURE.md ← 아키텍처
```

### API 문서
- Supabase Dashboard 자동 생성
- OpenAPI 스펙 (추후)

---

## 모바일 Claude 앱 사용법

### 1. 연결
모바일 Claude 앱에서 Claude Code 세션에 연결

### 2. 단축 명령 사용
```
ㅅ → 상태 확인
ㅎ 빌더 → HEPHAITOS 빌더 작업
ㅂ 리드 → BIDFLOW 리드 작업
ㄱ → 다음 태스크
ㅋ → 커밋 & 푸시
```

### 3. 자연어 지시
```
"HEPHAITOS에 새로운 인디케이터 추가해줘"
"BIDFLOW 리드 스코어링 알고리즘 개선해"
"두 프로젝트 공통으로 사용할 차트 컴포넌트 만들어"
```

---

## 지원

- GitHub Issues: https://github.com/sihu-dev/forge-labs/issues
- 문서: 이 파일 및 .forge/ 디렉토리

---

*FORGE LABS Monorepo v5.0*
*Mobile Claude App + Claude Code Integration*
*Last Updated: 2024-12-24*

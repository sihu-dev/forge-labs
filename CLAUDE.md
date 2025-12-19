# FORGE LABS 마스터 가이드

> **통합 플랫폼**: HEPHAITOS, DRYON, FOLIO, ADE, BIDFLOW (5개)
> **아키텍처**: 나노팩터 계층 (L0→L1→L2→L3)
> **개발 방식**: 참조 개발 (기존 프로젝트 자산 활용)

---

## 세션 시작

```
/forge-master
```

---

## 개발 가이드

### 핵심 원칙

1. **UX 사용자 친화성** - 직관적 UI, 불필요한 단계 최소화
2. **사업 본질 정렬** - 비즈니스 목표와 직결된 기능만 구현
3. **기술 효율성** - 최신 오픈소스 우선
4. **동적 설계** - 지속 최적화, 정적 설계 금지
5. **자동화 우선** - API 자동 발급, 수동 작업 요청 금지
6. **프로덕션 품질** - 반복 개선으로 오류 제로 목표
7. **트렌디 UX** - 명확한 메시지, 불필요한 아이콘/폰트 금지

### 금지 사항

- 아이콘 남발
- 커스텀 폰트 (인기 오픈소스만 사용)
- 딱딱한/형식적 카피
- 수동 작업 요청
- 레거시/비효율 기술

---

## 아키텍처

### Nano-Factor Hierarchy

| 계층 | 파일 경로 | 설명 |
| --- | --- | --- |
| L0 (Atoms) | packages/types/ | 기본 타입 정의 |
| L1 (Molecules) | packages/utils/ | 유틸리티 함수 |
| L2 (Cells) | packages/core/, packages/ui/ | 비즈니스 로직, UI 컴포넌트 |
| L3 (Tissues) | apps/{app}/src/ | 애플리케이션 레이어 |

### 5개 앱

| 앱 | 목적 | 위치 | 포트 |
| --- | --- | --- | --- |
| HEPHAITOS | 트레이딩 엔진 | apps/hephaitos/ | 3000 |
| DRYON | 기후 AI 시스템 | apps/dryon/ | 3001 |
| FOLIO | 포트폴리오 관리 | apps/folio/ | 3002 |
| ADE | AI 코드 생성 | apps/ade/ | 3003 |
| BIDFLOW | 입찰 자동화 | apps/bidflow/ | 3010 |

---

## 개발 워크플로우

### 마스터 프롬프트 실행

```bash
/project:forge-master
```

### 쿼리 패턴

| 입력 | 동작 |
|------|------|
| `ㄱ` | 다음 쿼리 1개 구현 |
| `ㄱㄱㄱ` | 다음 3개 순차 구현 |
| `QRY-XXX` | 특정 쿼리 구현 |
| `QRY-N~M 병렬` | 범위 병렬 구현 |
| `상태` | 현재 진행 상태 |
| `검수` | 전체 코드 리뷰 |
| `관제` | 관제 대시보드 |

---

## Claude Code 커맨드 (7개)

```
.claude/commands/
├── forge-master.md  ← /project:forge-master (메인 오케스트레이터)
├── init.md          ← /project:init (환경 검증)
├── status.md        ← /project:status (상태 확인)
├── next.md          ← /project:next (다음 쿼리 구현)
├── bootstrap.md     ← /project:bootstrap (원스톱 초기화)
├── design.md        ← /project:design (디자인 벤치마킹)
└── monitor.md       ← /project:monitor (개발 관제)
```

### 플러그인 스킬

| 스킬 | 용도 |
|------|------|
| `/ai-pair-programming:pair` | AI 페어 프로그래밍 |
| `/ai-pair-programming:review` | AI 코드 리뷰 |
| `/ai-pair-programming:fix` | 버그 자동 수정 |
| `/spec-kit:specify` | 기능 명세 작성 |
| `/spec-kit:implement` | 구현 실행 |
| `/commit-commands:commit` | Git 커밋 |
| `/code-review:code-review` | PR 코드 리뷰 |

### 병렬 에이전트

| 타입 | 용도 |
|------|------|
| `Explore` | 코드베이스 탐색 |
| `Plan` | 아키텍처 설계 |
| `feature-dev:code-architect` | 기능 아키텍처 |
| `ai-pair-programming:bug-hunter` | 버그 탐지 |
| `ai-pair-programming:performance-expert` | 성능 최적화 |

---

## 상태

- ✅ 환경 설정 완료
- ✅ Turborepo LSP 비활성화
- ✅ VS Code 확장 최적화 (111개)
- ✅ 자동화 검증 스크립트 구현
- ✅ 종합 아키텍처 문서 완성

---

## 핵심 문서 (3개)

```
.forge/
├── BUSINESS_PLAN.md         ← 사업계획서 (B2B2C, 수익 모델, GTM)
├── DEVELOPMENT_PLAN.md      ← 개발계획서 (기술 스택, MVP 로드맵)
├── HEPHAITOS_ARCHITECTURE.md ← 종합 아키텍처 (엔진, 타입, UX)
└── archive/                 ← 참조용 아카이브 (17개 문서)
```

---

## 코드베이스 구조

### 에이전트 - L3 Tissues (9개)

| 앱 | 에이전트 | 역할 |
|---|---------|------|
| HEPHAITOS | BacktestAgent | 백테스트 시뮬레이션 |
| | OrderExecutorAgent | 주문 실행/리스크 관리 |
| | PortfolioSyncAgent | 멀티 거래소 동기화 |
| FOLIO | CompetitorMonitorAgent | 경쟁사 모니터링 |
| | InventoryOptimizerAgent | 재고 최적화 |
| | SalesForecastAgent | 매출 예측 |
| DRYON | AlarmManagerAgent | 알림 관리 |
| | EnergyMonitorAgent | 에너지 모니터링 |
| | SensorOptimizerAgent | 센서 최적화 |

### 타입 시스템 (packages/types/src/hephaitos/) - 8개 파일

| 파일 | 핵심 타입 |
|-----|---------|
| strategy.ts | StrategyType(7), Timeframe(9), IndicatorType(9), IStrategy(22 fields) |
| backtest.ts | IBacktestConfig, IPerformanceMetrics(22 metrics) |
| order.ts | ExecutionMode, IRiskConfig, IOrderRequest |
| exchange.ts | ExchangeType(5), EXCHANGE_CONFIGS |
| credentials.ts | IExchangeCredentials, IEncryptedCredentials |
| asset.ts | IAsset, IAssetBalance, IAssetBreakdown |
| portfolio.ts | SyncStatus, IPortfolio, IPortfolioSummary, IPortfolioSnapshot |
| trade.ts | OrderSide, OrderType, OrderStatus, IOrder, ITrade, IPosition, IOHLCV |

### 유틸리티 (packages/utils/src/) - L1 Molecules (14개)

| 파일 | 역할 |
|-----|------|
| backtest-calc.ts | 22개 성과 지표 (샤프, MDD, 승률) |
| signal-detector.ts | 기술적 지표 (SMA, RSI, MACD, BB) |
| validation.ts | API 키 검증 (거래소별 패턴) |
| balance.ts | 잔고 정규화 (Binance, Upbit) |
| currency.ts | 통화 변환 |
| pnl.ts | 손익 계산 |
| order-calc.ts | 주문 계산 |
| geo.ts | 지리 연산 (FOLIO) |
| reward.ts | 리워드 계산 (FOLIO) |
| time-series.ts | 시계열 분석 |
| forecast-calc.ts | 예측 계산 (FOLIO) |
| alarm-eval.ts | 알림 평가 (DRYON) |
| inventory-calc.ts | 재고 계산 (FOLIO) |
| energy-calc.ts | 에너지 계산 (DRYON) |

### 코어 서비스 (packages/core/src/) - L2 Cells

#### 서비스 (4개)
| 서비스 | 파일 | 라인 | 역할 |
|-------|------|-----|------|
| ExchangeServiceFactory | services/exchange-service.ts | 402 | 거래소 API 통합 (Binance, Upbit) |
| PriceDataService | services/price-data-service.ts | 241 | 과거 가격/OHLCV 데이터 |
| SalesDataService | services/sales-data-service.ts | - | 매출 데이터 서비스 |
| PlaceCrawlerService | services/place-crawler-service.ts | - | 장소 크롤링 서비스 |

#### 리포지토리 (10개)
| 리포지토리 | 파일 | 라인 | 역할 |
|-----------|------|-----|------|
| PortfolioRepository | repositories/portfolio-repository.ts | 322 | 포트폴리오 CRUD + 스냅샷 |
| StrategyRepository | repositories/strategy-repository.ts | 241 | 전략 CRUD + 복제 |
| BacktestResultRepository | repositories/backtest-result-repository.ts | - | 백테스트 결과 저장 |
| OrderRepository | repositories/order-repository.ts | - | 주문 이력 저장 |
| ForecastRepository | repositories/forecast-repository.ts | - | 예측 데이터 저장 |
| AlarmRepository | repositories/alarm-repository.ts | - | 알림 설정 저장 |
| CompetitorRepository | repositories/competitor-repository.ts | - | 경쟁사 분석 데이터 |
| EnergyRepository | repositories/energy-repository.ts | - | DRYON 에너지 데이터 |
| InventoryRepository | repositories/inventory-repository.ts | - | 재고 관리 데이터 |
| FeedbackRepository | repositories/feedback-repository.ts | - | 피드백 저장 |

### UI 컴포넌트 (packages/ui/src/) - L2 Cells (30개)

| 유형 | 컴포넌트 |
|------|---------|
| Atoms (24) | Button, Input, Badge, Alert, Avatar, Skeleton, Separator, Label, Switch, Card, Tabs, Popover, Dialog, DropdownMenu, Checkbox, Tooltip, Toast, Textarea, Progress, RadioGroup, Accordion, Slider, ScrollArea, Select |
| Fragments (5) | PageHeader, EmptyState, FilterBar, DataTable, MetricCard |
| Lib (1) | theme-context |

---

## MVP 개발 로드맵

> **상세**: `.forge/DEVELOPMENT_PLAN.md` 참조

| Phase | 기간 | 주요 산출물 |
|-------|------|------------|
| Phase 1: Core | W1-4 | No-Code 빌더 + 백테스트 + Auth |
| Phase 2: 확장 | W5-8 | 실계좌 연결 + 멘토/멘티 시스템 |
| Phase 3: 고도화 | W9-12 | 라이브 세션 + 리포트 자동화 |

### 현재 진행

- ✅ 타입 시스템 완성 (8개 파일)
- ✅ L1 유틸리티 완성 (14개 파일)
- ✅ L2 코어 서비스 완성 (14개 파일)
- ✅ L3 에이전트 완성 (3개 파일)
- 🔄 No-Code 빌더 UI (타입/블록 정의 완료)

---

## 블록 카테고리 (No-Code 빌더) - 17개 블록

> **파일**: `apps/hephaitos/src/components/builder/block-definitions.ts` (396 lines)

| 카테고리 | 블록 (5개) | 색상 | 파라미터 |
|----------|-----------|------|---------|
| 지표 | RSI | #3B82F6 | period(14), source |
| | MACD | | fast(12), slow(26), signal(9) |
| | 볼린저밴드 | | period(20), stdDev(2) |
| | 이동평균 | | period(20), type(SMA/EMA) |
| | 거래량 | | period(20) |
| 조건 (4개) | 크다(>), 작다(<) | #8B5CF6 | threshold |
| | 상향돌파, 하향돌파 | | threshold |
| 논리 (3개) | AND, OR, NOT | #EAB308 | - |
| 액션 (3개) | 매수 🟢 | #22C55E | percentage(10) |
| | 매도 🔴 | #EF4444 | percentage(100) |
| | 홀드 🟡 | #EAB308 | - |
| 리스크 (2개) | 손절, 익절 | #F97316 | percentage |

---

## BYOK API 키 연결 시스템

### 브로커/거래소 인증 매트릭스

| 플랫폼 | 인증 방식 | 개인 사용 | UX 점수 | 권장 |
|--------|----------|----------|---------|------|
| **KIS (한투)** | Token 기반 | ✅ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ 한국 주식 |
| **Alpaca** | OAuth 2.0 | ✅ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ 미국 주식 |
| **Binance** | HMAC-SHA256 | ✅ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ 글로벌 코인 |
| **Upbit** | JWT | ✅ | ⭐⭐⭐ | ⭐⭐⭐⭐ 한국 코인 |
| **Kraken** | API Key + 2FA | ✅ | ⭐⭐⭐⭐ | ⭐⭐⭐ 글로벌 코인 |
| 키움증권 | OCX (Windows) | ✅ | ⭐ | ❌ 웹 불가 |

### BYOK 지원 방식

| 방식 | 설명 | 구현 우선순위 |
|------|------|--------------|
| OAuth 2.0 | 1-Click 연결 (Alpaca, Coinbase) | P0 |
| Key Vault | 암호화 로컬 저장 (AES-256-GCM) | P0 |
| QR 연결 | 모바일→PC 키 전송 (ECDH) | P2 |
| 생체인증 | WebAuthn 잠금해제 | P2 |

---

## 비즈니스 모델 요약

> **상세**: `.forge/BUSINESS_PLAN.md` 참조

### B2B2C 구조
```
HEPHAITOS → 유튜버(B2B) → 수강생(B2C)
```

### 수익 분배
| 수익원 | 유튜버 | 플랫폼 |
|--------|--------|--------|
| 수강료 | 70% | 30% |
| 크레딧 | 30% | 70% |
| 브로커 CPA | 50% | 50% |

### 목표
- Year 1: 20개 채널, 4.8억
- Year 2: 100개 채널, 104억

---

## 멘토/멘티 상태 머신

### 멘티 상태
```
VISITOR → FREE → ENROLLED → GRADUATE → BUILDER → LIVE_TRADER
   │         │        │          │          │          │
  가입      무료    강의구매    수료     에이전트   실계좌
```

### 멘토 상태
```
VISITOR → MEMBER → PENDING → MENTOR
   │         │         │        ├── BASIC (무료)
  가입      일반     심사중    ├── PREMIUM (유료)
                              └── SUSPENDED (정지)
```

### 수익 분배
- 수강료: 멘토 70% / 플랫폼 30%
- 크레딧: 멘토 30% / 플랫폼 70%
- 브로커 CPA: 50% / 50%

---

## 협업 빌드 시나리오 (6가지)

| 시나리오 | 멘토 참여도 | 대상 | 핵심 기능 |
|---------|-----------|------|----------|
| A. 완전 가이드 | 100% | 초급 | 실시간 따라하기, 단계별 검증 |
| B. 부분 가이드 | 50% | 중급 | 막힘 시 호출, 포인트 가이드 |
| C. 리뷰 전용 | 20% | 중급 | 비동기 리뷰, 피드백 |
| D. 자유 빌드 | 0% | 고급 | 완전 자율 |
| E. 라이브 코딩 | 80% | 혼합 | YouTube Live 연동 |
| F. 그룹 빌드 | 60% | 혼합 | 5-10명 워크숍 |

---

## 백테스트 결과 핵심 지표

| 지표 | 의미 | 양호 기준 |
|-----|------|----------|
| 총수익률 | 투자금 대비 수익 | 벤치마크 초과 |
| 승률 | 수익 거래 비율 | 60% 이상 |
| MDD | 최대 낙폭 | -10% 이내 |
| 샤프지수 | 위험 대비 수익 | 1.0 이상 |

---

## 실계좌 안전장치

| 항목 | 기본값 | 설명 |
|------|-------|------|
| 일일 손실 한도 | 3% | 초과 시 자동 중지 |
| 연속 손실 한도 | 3회 | 연속 손실 시 중지 |
| 포지션 최대 | 20% | 단일 종목 최대 비중 |
| 비상 정지 | 있음 | 원클릭 전체 청산 |

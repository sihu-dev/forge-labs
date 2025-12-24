---
name: hephaitos
description: HEPHAITOS 크레딧 기반 트레이딩 플랫폼 전문가 모드 (project)
---

# HEPHAITOS 개발 모드
# 사용법: /hephaitos 또는 ㅎ

## 빠른 명령 (모바일용)

| 명령 | 동작 |
|------|------|
| `ㅎ` | HEPHAITOS 상태 |
| `ㅎ 빌더` | No-Code 빌더 작업 |
| `ㅎ 백테스트` | 백테스트 엔진 작업 |
| `ㅎ 거래소` | 거래소 연동 작업 |
| `ㅎ 멘토` | 멘토/멘티 시스템 |
| `ㅎ UI` | UI 컴포넌트 작업 |
| `ㅎ API` | API 라우트 작업 |

---

## 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 목적 | B2B2C 트레이딩 교육 플랫폼 |
| 대상 | 유튜버(멘토) → 수강생(멘티) |
| 수익모델 | 수강료 70:30, 크레딧 30:70, 브로커 CPA 50:50 |
| 포트 | 3000 |

---

## 코드 구조

```
apps/hephaitos/src/
├── app/                   # Next.js App Router
│   ├── (auth)/            # 인증 페이지
│   ├── (dashboard)/       # 대시보드
│   ├── admin/             # 어드민
│   └── api/               # API 라우트
├── components/
│   ├── builder/           # No-Code 전략 빌더
│   ├── backtest/          # 백테스트 결과
│   ├── dashboard/         # 대시보드
│   └── admin/             # 어드민 컴포넌트
└── lib/                   # 유틸리티

packages/types/src/hephaitos/   # 8개 타입 파일
packages/utils/src/             # 유틸리티
packages/core/src/              # 서비스 + 리포지토리
```

---

## 핵심 기능

### 1. No-Code 전략 빌더
- 17개 블록 (지표, 조건, 논리, 액션, 리스크)
- 드래그앤드롭 캔버스
- 실시간 검증
- 파일: `components/builder/`

### 2. 백테스트 엔진
- 22개 성과 지표 (샤프, MDD, 승률 등)
- 초보자 가이드 모드
- 벤치마크 비교
- 파일: `packages/utils/src/backtest-calc.ts`

### 3. 멘토/멘티 시스템
- B2B2C 구조 (유튜버 → 수강생)
- 협업 빌드 6가지 시나리오
- 수익 분배 (70/30)
- 파일: `packages/types/src/hephaitos/`

### 4. BYOK API 연결
- Alpaca (미국 주식) - OAuth 2.0
- Binance (글로벌 코인) - HMAC-SHA256
- Upbit (한국 코인) - JWT
- KIS 한투 (한국 주식) - Token
- 파일: `packages/core/src/services/exchange-service.ts`

---

## 현재 진행 상태

### 완료 ✅
- 타입 시스템 (8개 파일)
- 유틸리티 (backtest-calc, signal-detector 등)
- 코어 서비스 (ExchangeService, PriceDataService)
- UI 컴포넌트 (30개)
- 블록 정의 (17개 블록)

### 진행중 🔄
- No-Code 빌더 캔버스
- 백테스트 엔진 연결

### 대기 ⏳
- 실계좌 연동
- 멘토/멘티 매칭
- 라이브 세션

---

## 핵심 문서

```
.forge/
├── HEPHAITOS_ARCHITECTURE.md  ← 종합 아키텍처
├── BUSINESS_PLAN.md           ← 사업 계획서
└── DEVELOPMENT_PLAN.md        ← 개발 계획서
```

---

## 작업 영역별 가이드

### 빌더 (ㅎ 빌더)
1. `apps/hephaitos/src/components/builder/` 확인
2. `block-definitions.ts` - 블록 정의
3. 캔버스 드래그앤드롭 구현
4. 전략 저장/불러오기

### 백테스트 (ㅎ 백테스트)
1. `packages/utils/src/backtest-calc.ts` 확인
2. `packages/core/src/services/price-data-service.ts`
3. 성과 지표 계산 연결
4. 결과 시각화

### 거래소 (ㅎ 거래소)
1. `packages/core/src/services/exchange-service.ts`
2. API 키 암호화 저장
3. 잔고 조회
4. 주문 실행

### 멘토 (ㅎ 멘토)
1. 멘토 등록 플로우
2. 강의 생성
3. 수강생 관리
4. 수익 정산

---

## 다음 액션

`ㅎ 빌더` 입력 시 No-Code 빌더 캔버스 구현 시작

---

*HEPHAITOS Dev Mode v2.0*

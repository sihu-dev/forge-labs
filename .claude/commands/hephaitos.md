---
name: hephaitos
description: HEPHAITOS 크레딧 기반 트레이딩 플랫폼 전문가 모드
---

# HEPHAITOS 개발 모드

## 핵심 문서

1. `.forge/HEPHAITOS_ARCHITECTURE.md` - 종합 아키텍처
2. `.forge/BUSINESS_PLAN.md` - 사업 계획서
3. `.forge/DEVELOPMENT_PLAN.md` - 개발 계획서

## 코드 구조

```
apps/hephaitos/src/
├── app/                   # Next.js App Router
├── components/
│   ├── builder/           # No-Code 전략 빌더
│   ├── backtest/          # 백테스트 결과
│   └── dashboard/         # 대시보드
└── lib/                   # 유틸리티

packages/
├── types/src/hephaitos/   # 8개 타입 파일
├── utils/src/             # 14개 유틸리티
└── core/src/              # 서비스 + 리포지토리
```

## 핵심 기능

### 1. No-Code 전략 빌더
- 17개 블록 (지표, 조건, 논리, 액션, 리스크)
- 드래그앤드롭 캔버스
- 실시간 검증

### 2. 백테스트 엔진
- 22개 성과 지표
- 초보자 가이드 모드
- 벤치마크 비교

### 3. 멘토/멘티 시스템
- B2B2C 구조 (유튜버 → 수강생)
- 협업 빌드 6가지 시나리오
- 수익 분배 (70/30)

### 4. BYOK 연결
- Alpaca (미국 주식)
- Binance (글로벌 코인)
- KIS 한투 (한국 주식)

## 커맨드

- `/hephaitos` - 이 모드 활성화
- `/forge-master` - 전체 오케스트레이터
- `/status` - 상태 확인

---

위 문서들을 읽고 개발을 진행하세요.

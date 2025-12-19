---
name: bidflow
description: BIDFLOW 입찰 자동화 시스템 개발 모드
---

# BIDFLOW 개발 모드

## 현재 상태

BIDFLOW는 제조업 SME를 위한 입찰 자동화 시스템입니다.

## 핵심 문서

1. `.forge/BID_AUTOMATION_SPEC.md` - 기능 명세
2. `.forge/TECH_ARCHITECTURE.md` - 기술 아키텍처
3. `.forge/UI_DESIGN_SPEC.md` - UI 설계
4. `.forge/BID_DATA_SOURCES.md` - 데이터 소스 (45+)
5. `.forge/PRODUCT_CATALOG_CMENTECH.md` - 씨엠엔텍 제품
6. `.forge/PHASE_1_2_COMPLETION_REPORT.md` - 개선 리포트

## 코드 구조

```
apps/bidflow/src/
├── app/
│   └── api/v1/           # API v1 버저닝
├── lib/
│   ├── security/         # 보안 (인증, Rate Limit, CSRF)
│   ├── validation/       # Zod 스키마
│   ├── domain/           # DDD Lite (Repository, Use Cases)
│   └── clients/          # 외부 API (TED, 나라장터)
└── components/           # UI 컴포넌트
```

## 다음 작업

1. `pnpm install` - 의존성 설치
2. `supabase db push` - DB 마이그레이션
3. `.env` 설정 - Upstash, CSRF_SECRET
4. `pnpm dev` - 개발 서버 시작

## 커맨드

- `/bidflow` - 이 모드 활성화
- `/status` - 전체 상태 확인
- `/next` - 다음 작업 실행

---

위 문서들을 읽고 현재 상태를 파악한 후 작업을 진행하세요.

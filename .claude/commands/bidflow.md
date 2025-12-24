---
name: bidflow
description: BIDFLOW 입찰 자동화 시스템 개발 모드 (project)
---

# BIDFLOW 개발 모드
# 사용법: /bidflow 또는 ㅂ

## 빠른 명령 (모바일용)

| 명령 | 동작 |
|------|------|
| `ㅂ` | BIDFLOW 상태 |
| `ㅂ 리드` | 리드 관리 작업 |
| `ㅂ 캠페인` | 캠페인 관리 작업 |
| `ㅂ 워크플로우` | n8n 워크플로우 작업 |
| `ㅂ 입찰` | 입찰 크롤링 작업 |
| `ㅂ CRM` | CRM 연동 작업 |
| `ㅂ API` | API 라우트 작업 |

---

## 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 목적 | 국제입찰 자동화 + 세일즈 자동화 |
| 대상 | 중소기업, 무역회사, 제조업체 |
| 수익모델 | SaaS 구독, 컨설팅, 성공 수수료 |
| 포트 | 3010 |

---

## 코드 구조

```
apps/bidflow/src/
├── app/
│   ├── (dashboard)/       # 대시보드
│   ├── admin/             # 어드민
│   │   └── automation/    # 자동화 대시보드
│   └── api/               # API 라우트
│       └── admin/automation/  # 자동화 API
├── components/
│   └── admin/automation/  # 자동화 컴포넌트
└── lib/                   # 유틸리티

packages/crm/              # CRM 통합 (Attio, HubSpot)
packages/integrations/     # 외부 API (Apollo, Persana, n8n)
packages/workflows/        # 자동화 워크플로우
packages/types/src/automation/  # 자동화 타입
packages/types/src/crm/         # CRM 타입
```

---

## 핵심 기능

### 1. 리드 관리
- 리드 파이프라인 (신규→검증→연락→전환)
- AI 스코어링 (구매력, 적합도, 긴급성)
- 태그 및 세그먼트
- 파일: `components/admin/automation/LeadManagement.tsx`

### 2. 캠페인 관리
- 이메일, LinkedIn 멀티채널
- 시퀀스 자동화
- A/B 테스트
- 파일: `components/admin/automation/CampaignManagement.tsx`

### 3. 워크플로우 자동화
- n8n 연동
- 리드 강화 (Apollo, Persana)
- CRM 동기화
- 파일: `packages/workflows/`

### 4. 입찰 크롤링
- 나라장터, KOICA, TED, UNGM
- 키워드 매칭
- 알림 자동화
- 파일: `apps/bidflow/src/lib/clients/`

### 5. 크로스셀 연동
- BIDFLOW 고객 → HEPHAITOS 추천
- 파일: `components/admin/automation/AutomationDashboard.tsx`

---

## 현재 진행 상태

### 완료 ✅
- 자동화 대시보드 UI
- 리드 관리 UI (필터, 테이블, 상세)
- 캠페인 관리 UI (시퀀스 포함)
- 워크플로우 관리 UI
- CRM 패키지 (Attio, HubSpot)
- Integrations 패키지 (Apollo, Persana, n8n)
- Workflows 패키지
- Supabase 마이그레이션

### 진행중 🔄
- API 엔드포인트 연결
- 실제 데이터 연동

### 대기 ⏳
- n8n 워크플로우 실제 배포
- 입찰 크롤러 구현
- 이메일 발송 연동

---

## 외부 연동

### CRM (packages/crm/)
- **Attio**: 현대적 CRM (권장)
- **HubSpot**: 엔터프라이즈 CRM

### 리드 강화 (packages/integrations/)
- **Apollo**: B2B 리드 데이터베이스
- **Persana**: AI 리드 스코어링

### 자동화 (packages/integrations/)
- **n8n**: 워크플로우 자동화
- **Resend**: 이메일 발송

---

## 작업 영역별 가이드

### 리드 (ㅂ 리드)
1. `apps/hephaitos/src/components/admin/automation/LeadManagement.tsx`
2. `apps/hephaitos/src/app/api/admin/automation/leads/route.ts`
3. 스코어링 알고리즘 개선
4. 필터/검색 고도화

### 캠페인 (ㅂ 캠페인)
1. `components/admin/automation/CampaignManagement.tsx`
2. `apps/hephaitos/src/app/api/admin/automation/campaigns/route.ts`
3. 시퀀스 빌더
4. 템플릿 관리

### 워크플로우 (ㅂ 워크플로우)
1. `packages/workflows/src/definitions/`
2. `packages/integrations/src/n8n/`
3. n8n 웹훅 연결
4. 실행 모니터링

### 입찰 (ㅂ 입찰)
1. 입찰공고 크롤러 구현
2. 키워드 매칭 알고리즘
3. 알림 시스템
4. 데이터소스 추가

### CRM (ㅂ CRM)
1. `packages/crm/src/providers/`
2. 리드 동기화
3. 딜 파이프라인
4. 활동 추적

---

## 다음 액션

`ㅂ 리드` 입력 시 리드 API 연결 작업 시작

---

*BIDFLOW Dev Mode v2.0*

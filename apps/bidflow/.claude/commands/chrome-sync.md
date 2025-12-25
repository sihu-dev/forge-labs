# Chrome Claude 컨텍스트 동기화

> **용도**: Chrome Claude에서 BIDFLOW 프로젝트 작업 시 컨텍스트 동기화
> **호출**: `/chrome-sync` 또는 Chrome Claude에서 직접 복사/붙여넣기

---

## 프로젝트 컨텍스트

```yaml
프로젝트: BIDFLOW 입찰 자동화 시스템
리포지토리: sihu2/forge-labs
앱 경로: apps/bidflow
기술 스택:
  - Frontend: Next.js 15 (App Router)
  - Backend: Supabase (PostgreSQL + Auth + Edge Functions)
  - Styling: TailwindCSS + 모노크롬 디자인 시스템
  - Testing: Vitest + Playwright
  - 패키지 관리: pnpm (모노레포)
포트: 3010
```

---

## Chrome Claude 가능 작업

### 1. 브라우저 기반 작업
- [ ] **UI/UX 검토**: 실제 화면 캡처 후 분석
- [ ] **Lighthouse 분석**: 성능/접근성 점수 확인
- [ ] **반응형 테스트**: 다양한 뷰포트에서 레이아웃 확인
- [ ] **콘솔 오류 수집**: DevTools 오류 로그 분석

### 2. 외부 서비스 연동 확인
- [ ] **Supabase Dashboard**: 테이블 구조, RLS 정책 확인
- [ ] **Vercel Dashboard**: 배포 상태, 환경 변수 확인
- [ ] **GitHub**: PR, 이슈, 액션 상태 확인

### 3. API 테스트
- [ ] **REST Client**: API 엔드포인트 테스트
- [ ] **GraphQL Playground**: 쿼리 테스트 (해당 시)

---

## Claude Code 연동 포인트

### Chrome에서 발견한 이슈 → Claude Code로 전달

```markdown
## 🔴 Chrome에서 발견한 이슈

### 이슈 유형: [UI/성능/오류/보안]
### 발견 위치: [URL 또는 컴포넌트]
### 스크린샷: [필요 시 첨부]

### 상세 내용:
[Chrome Claude가 분석한 내용]

### 수정 제안:
[Chrome Claude의 수정 제안]

---
**Claude Code 액션**:
- [ ] 해당 파일 수정
- [ ] 테스트 추가
- [ ] 빌드 확인
```

---

## 워크플로우 예시

### 예시 1: UI 버그 리포트

**Chrome Claude 발견:**
```
페이지: /dashboard/bids
문제: 테이블 헤더가 스크롤 시 고정되지 않음
영향: 긴 목록에서 사용성 저하
```

**Claude Code 수정:**
```typescript
// src/components/bids/BidTable.tsx
<thead className="sticky top-0 bg-white z-10">
```

### 예시 2: 성능 이슈 발견

**Chrome Claude 분석:**
```
Lighthouse 성능: 45/100
LCP: 4.2초 (목표: 2.5초 이하)
원인: 이미지 최적화 부재, 번들 크기
```

**Claude Code 수정:**
```bash
# Next.js Image 최적화 적용
# 번들 분석 및 코드 스플리팅
```

---

## 현재 프로젝트 상태

### 완료된 기능 ✅
- 입찰 목록/상세 페이지
- 리드 관리 CRUD
- CRM 연동 (Attio, HubSpot)
- 보안 미들웨어 (인증, Rate Limit, CSRF)

### 진행 중 🔄
- 대시보드 API 연결
- 스프레드시트 필터/정렬
- 알림 시스템

### 다음 작업 📋
- 키워드 필터링
- 카카오 알림톡 연동
- E2E 테스트 작성

---

## 빠른 링크

| 서비스 | URL |
|--------|-----|
| 개발 서버 | http://localhost:3010 |
| Supabase | https://supabase.com/dashboard |
| Vercel | https://vercel.com/dashboard |
| GitHub | https://github.com/sihu2/forge-labs |

---

## Chrome Claude → Claude Code 명령어

Chrome Claude에서 분석 후 Claude Code에 전달할 때 사용:

```
/fix-ui [컴포넌트명] - UI 수정
/perf-optimize - 성능 최적화
/add-test [기능명] - 테스트 추가
/deploy-check - 배포 전 검증
```

---

*마지막 동기화: $CURRENT_DATE*
*동기화 주기: 작업 시작 시 항상 실행 권장*

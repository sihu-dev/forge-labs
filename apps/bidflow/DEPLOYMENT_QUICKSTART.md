# BIDFLOW 배포 빠른 시작 가이드

## 🚀 1분 만에 Supabase 연결하기

### Step 1: VS Code 터미널 열기
`Ctrl + ~` 또는 상단 메뉴 **Terminal → New Terminal**

### Step 2: 명령어 복사/붙여넣기

```bash
# 1. bidflow 디렉토리로 이동
cd apps/bidflow

# 2. Supabase 로그인 (브라우저 자동 열림)
npx supabase login

# 3. 프로젝트 목록 확인
npx supabase projects list

# 4. 프로젝트 연결 (YOUR_PROJECT_ID를 실제 ID로 교체)
npx supabase link --project-ref YOUR_PROJECT_ID

# 5. 마이그레이션 푸시 🎉
npx supabase db push
```

### Step 3: 완료!
- Supabase Studio에서 테이블 확인: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/editor

---

## 🔧 로컬 개발 환경 (선택)

Docker가 설치되어 있다면:

```bash
cd apps/bidflow

# 로컬 Supabase 시작
npx supabase start

# Studio URL: http://localhost:54323
# API URL: http://localhost:54321
# DB URL: postgresql://postgres:postgres@localhost:54322/postgres
```

---

## 📦 생성된 테이블 (7개)

1. **bids** - 입찰 공고 정보
2. **bid_scores** - Enhanced Matcher 스코어링 결과
3. **emails** - 이메일 발송 및 추적
4. **approvals** - HumanLayer 승인 플로우
5. **ab_tests** - Thompson Sampling A/B 테스트
6. **performance_metrics** - 시스템 성능 메트릭
7. **system_logs** - 시스템 로그

---

## ⚡ 다음 단계

```bash
# 환경 변수 설정
cp .env.example .env.local

# .env.local 파일 편집:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY
# - ANTHROPIC_API_KEY

# 개발 서버 실행
pnpm dev
```

브라우저에서 http://localhost:3010 접속

---

## 🆘 트러블슈팅

### "npx: command not found"
- Node.js가 설치되지 않았습니다
- https://nodejs.org 에서 LTS 버전 설치

### "Docker is not running"
- 로컬 개발만 해당
- Docker Desktop 설치 또는 프로덕션 Supabase 사용

### "Failed to link project"
- `npx supabase login` 먼저 실행
- 프로젝트 ID가 올바른지 확인

---

**생성일**: 2025-12-23
**마이그레이션 파일**: `supabase/migrations/001_initial_schema.sql`

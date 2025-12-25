# BIDFLOW 배포 및 런칭 가이드

**버전**: 1.0
**최종 업데이트**: 2025-12-25
**대상**: DevOps, 개발자, PM

---

## 📋 목차

1. [사전 준비사항](#사전-준비사항)
2. [환경 설정](#환경-설정)
3. [데이터베이스 설정](#데이터베이스-설정)
4. [Vercel 배포](#vercel-배포)
5. [Chrome Extension 배포](#chrome-extension-배포)
6. [모니터링 설정](#모니터링-설정)
7. [배포 후 체크리스트](#배포-후-체크리스트)
8. [롤백 절차](#롤백-절차)

---

## 사전 준비사항

### 필수 계정

- [x] GitHub 계정 (소스 코드)
- [ ] Vercel 계정 (앱 배포)
- [ ] Supabase 계정 (데이터베이스)
- [ ] Anthropic 계정 (Claude API)
- [ ] Upstash 계정 (Redis)
- [ ] Sentry 계정 (모니터링 - 선택)

### 필수 도구

```bash
node >= 20.0.0
pnpm >= 8.0.0
git >= 2.40.0
```

### 비용 예상 (월간)

| 서비스 | 플랜 | 비용 |
|--------|------|------|
| Vercel | Pro | $20 |
| Supabase | Pro | $25 |
| Upstash Redis | Pay-as-you-go | ~$5 |
| Anthropic Claude | Pay-as-you-go | ~$30 (사용량 기반) |
| Sentry | Team (선택) | $26 |
| **총계** | | **$80-106/월** |

---

## 환경 설정

### 1. Supabase 프로젝트 생성

#### 1.1 새 프로젝트 생성

```bash
# Supabase 대시보드에서:
1. https://supabase.com/dashboard
2. "New Project" 클릭
3. 프로젝트 이름: "bidflow-production"
4. Database 비밀번호 생성 (안전한 곳에 저장!)
5. 리전 선택: "Northeast Asia (Seoul)"
6. 플랜 선택: "Pro" (프로덕션용)
```

#### 1.2 API 키 복사

```bash
# Settings > API 에서 복사:
- Project URL: https://xxx.supabase.co
- anon/public key: eyJhbGc...
- service_role key: eyJhbGc... (주의: 절대 클라이언트에 노출 금지!)
```

#### 1.3 데이터베이스 마이그레이션

```bash
# 로컬에서:
cd /home/user/forge-labs/apps/bidflow

# Supabase CLI 로그인
npx supabase login

# 프로젝트 연결
npx supabase link --project-ref <your-project-ref>

# 마이그레이션 실행
npx supabase db push

# RLS(Row Level Security) 정책 확인
# Supabase Dashboard > Authentication > Policies 에서 확인
```

#### 1.4 Authentication 설정

```sql
-- Email/Password 인증 활성화
-- Supabase Dashboard > Authentication > Settings

1. Email Auth: ✅ 활성화
2. Confirm email: ✅ 활성화 (프로덕션 권장)
3. Email templates: 커스터마이징 (선택)
4. SMTP 설정: 커스텀 이메일 서버 (선택)
```

### 2. Anthropic Claude API

#### 2.1 API 키 발급

```bash
1. https://console.anthropic.com/
2. "API Keys" 메뉴
3. "Create Key" 클릭
4. 이름: "BIDFLOW Production"
5. 키 복사: sk-ant-api03-...
```

#### 2.2 사용량 제한 설정

```bash
# Anthropic Console > Settings > Usage Limits
- Monthly Limit: $100 (초기 설정)
- 알림 설정: 80% 사용 시 이메일 알림
```

### 3. Upstash Redis

#### 3.1 Redis 데이터베이스 생성

```bash
1. https://console.upstash.com/
2. "Create Database" 클릭
3. Name: "bidflow-cache"
4. Region: "Asia Pacific (Seoul)"
5. Type: "Regional" (프로덕션용)
```

#### 3.2 연결 정보 복사

```bash
# REST API 탭에서:
- UPSTASH_REDIS_REST_URL: https://xxx.upstash.io
- UPSTASH_REDIS_REST_TOKEN: AXX...
```

### 4. 환경변수 정리

`.env.production` 파일 생성:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# AI
ANTHROPIC_API_KEY=sk-ant-api03-...

# Redis
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXX...

# App
NEXT_PUBLIC_APP_URL=https://bidflow.vercel.app
NODE_ENV=production

# 선택 (Sentry)
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

---

## Vercel 배포

### 1. Vercel 프로젝트 생성

#### 1.1 GitHub 연동

```bash
1. https://vercel.com/new
2. "Import Git Repository" 선택
3. GitHub 계정 연결
4. "sihu-dev/forge-labs" 레포지토리 선택
5. Root Directory: "apps/bidflow"
6. Framework Preset: "Next.js"
```

#### 1.2 빌드 설정

```bash
Build Command: cd ../.. && pnpm build --filter bidflow-standalone
Output Directory: .next
Install Command: cd ../.. && pnpm install
```

또는 `vercel.json` 파일 사용:

```json
{
  "buildCommand": "cd ../.. && pnpm build --filter bidflow-standalone",
  "devCommand": "cd ../.. && pnpm dev --filter bidflow-standalone",
  "installCommand": "cd ../.. && pnpm install",
  "framework": "nextjs",
  "outputDirectory": ".next"
}
```

#### 1.3 환경변수 설정

```bash
# Vercel Dashboard > Settings > Environment Variables

각 환경변수를 Production, Preview, Development에 추가:

NEXT_PUBLIC_SUPABASE_URL        ✅ Production ✅ Preview ✅ Development
NEXT_PUBLIC_SUPABASE_ANON_KEY   ✅ Production ✅ Preview ✅ Development
SUPABASE_SERVICE_ROLE_KEY       ✅ Production ❌ Preview ❌ Development
ANTHROPIC_API_KEY               ✅ Production ❌ Preview ❌ Development
UPSTASH_REDIS_REST_URL          ✅ Production ✅ Preview ✅ Development
UPSTASH_REDIS_REST_TOKEN        ✅ Production ❌ Preview ❌ Development
NEXT_PUBLIC_APP_URL             ✅ Production ✅ Preview ✅ Development
NODE_ENV                        production   preview   development
```

**주의**: 민감한 키(SERVICE_ROLE, API_KEY)는 Production에만 추가!

### 2. 도메인 설정

#### 2.1 커스텀 도메인 추가 (선택)

```bash
# Vercel Dashboard > Settings > Domains

1. "Add Domain" 클릭
2. 도메인 입력: bidflow.app (또는 원하는 도메인)
3. DNS 레코드 설정:
   - Type: CNAME
   - Name: @
   - Value: cname.vercel-dns.com
```

#### 2.2 SSL 인증서

```bash
# Vercel이 자동으로 Let's Encrypt SSL 발급
# 5-10분 소요, 상태는 Dashboard에서 확인
```

### 3. 배포 실행

#### 3.1 자동 배포

```bash
# main 브랜치에 푸시하면 자동 배포
git checkout main
git merge claude/session-resume-setup-4D6km
git push origin main

# Vercel이 자동으로:
1. 빌드 시작
2. 테스트 실행 (설정 시)
3. 프로덕션 배포
4. DNS 업데이트
```

#### 3.2 수동 배포 (CLI)

```bash
# Vercel CLI 설치
npm i -g vercel

# 프로젝트 디렉토리에서
cd /home/user/forge-labs/apps/bidflow

# 로그인
vercel login

# 프로덕션 배포
vercel --prod

# 배포 URL 확인
# https://bidflow.vercel.app
```

### 4. 배포 확인

```bash
# 1. 헬스체크
curl https://bidflow.vercel.app/api/health

# 2. 로그 확인
vercel logs <deployment-url>

# 3. 성능 확인
# Vercel Dashboard > Analytics

# 4. 기능 테스트
# 브라우저에서 https://bidflow.vercel.app 접속
```

---

## Chrome Extension 배포

### 1. 준비 작업

#### 1.1 아이콘 생성

```bash
# 필요한 아이콘 크기:
apps/bidflow/chrome-extension/icons/
├── icon16.png   (16x16)
├── icon48.png   (48x48)
└── icon128.png  (128x128)

# 디자인 가이드:
- BIDFLOW 브랜드 컬러 (#3b82f6, #8b5cf6)
- 번개 심볼 포함
- 투명 배경
- PNG 포맷
```

#### 1.2 manifest.json 업데이트

```json
{
  "name": "BIDFLOW Bid Extractor",
  "version": "2.0.0",
  "description": "AI-powered bid information extraction for BIDFLOW",
  // ... 나머지 설정
}
```

#### 1.3 프로덕션 API URL 설정

```javascript
// apps/bidflow/chrome-extension/scripts/background.js
const API_BASE_URL = 'https://bidflow.vercel.app'; // ← 프로덕션 URL로 변경
```

### 2. Chrome Web Store 등록

#### 2.1 개발자 계정 등록

```bash
1. https://chrome.google.com/webstore/devconsole
2. Google 계정으로 로그인
3. 개발자 등록비 $5 결제 (1회)
```

#### 2.2 확장 프로그램 패키징

```bash
# chrome-extension 디렉토리를 ZIP으로 압축
cd /home/user/forge-labs/apps/bidflow
zip -r bidflow-extension-v2.0.0.zip chrome-extension/ \
  -x "*.md" -x "*.git*" -x "*node_modules*"
```

#### 2.3 스토어 등록

```bash
1. Chrome Web Store Developer Dashboard
2. "New Item" 클릭
3. ZIP 파일 업로드
4. 스토어 등록 정보 입력:

제목: BIDFLOW Bid Extractor
요약: AI로 입찰 정보를 자동 추출하는 Chrome 확장 프로그램
설명: (chrome-extension/README.md 내용 활용)
카테고리: Productivity
언어: 한국어, 영어
스크린샷: 5장 (1280x800 또는 640x400)
  - 확장 프로그램 팝업
  - 입찰 페이지에서 추출 버튼
  - 추출 결과 알림
  - 설정 화면
  - BIDFLOW 대시보드 연동
아이콘: icon128.png
프로모션 이미지: 440x280 (선택)
```

#### 2.4 개인정보 처리방침

```markdown
# BIDFLOW Chrome Extension 개인정보 처리방침

## 수집하는 정보
- 입찰 웹사이트 HTML (처리 후 삭제)
- BIDFLOW 계정 인증 토큰 (암호화 저장)

## 사용 목적
- 입찰 정보 자동 추출
- BIDFLOW 계정과 데이터 동기화

## 데이터 저장
- 로컬 스토리지: 인증 토큰만 저장
- 서버 전송: HTTPS로 암호화 전송
- 제3자 공유: 없음

## 문의
support@bidflow.app
```

#### 2.5 심사 제출

```bash
1. "Submit for Review" 클릭
2. 심사 기간: 1-3일
3. 승인 후 자동으로 스토어에 공개
```

### 3. 로컬 테스트 (배포 전)

```bash
1. Chrome 열기
2. chrome://extensions/ 접속
3. "개발자 모드" 활성화
4. "압축해제된 확장 프로그램을 로드합니다"
5. chrome-extension 폴더 선택
6. 나라장터 등 입찰 사이트에서 테스트
7. 모든 기능 정상 작동 확인
```

---

## 모니터링 설정

### 1. Sentry (에러 트래킹)

#### 1.1 Sentry 프로젝트 생성

```bash
1. https://sentry.io/signup/
2. "Create Project" 클릭
3. Platform: "Next.js"
4. Project name: "bidflow-production"
```

#### 1.2 Next.js 통합

```bash
cd /home/user/forge-labs/apps/bidflow

# Sentry 설치
pnpm add @sentry/nextjs

# Sentry Wizard 실행
npx @sentry/wizard@latest -i nextjs

# .env에 추가
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

#### 1.3 설정 파일

`sentry.client.config.ts`:
```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
  enabled: process.env.NODE_ENV === 'production',
});
```

`sentry.server.config.ts`:
```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
});
```

### 2. Vercel Analytics

```bash
# Vercel Dashboard > Analytics 탭에서 활성화
# 추가 설정 불필요 (자동 수집)

확인 가능한 지표:
- 페이지 방문 수
- Unique Visitors
- Core Web Vitals (LCP, FID, CLS)
- 지역별 트래픽
```

### 3. 로그 모니터링

```bash
# Vercel 로그
vercel logs --follow

# Supabase 로그
# Supabase Dashboard > Logs Explorer

# 주요 모니터링 항목:
- API 에러율 (< 1% 목표)
- 평균 응답 시간 (< 200ms 목표)
- AI 할당량 사용률
- Database 연결 수
```

---

## 배포 후 체크리스트

### 즉시 확인 (배포 후 5분)

- [ ] 웹사이트 접속 가능 (https://bidflow.vercel.app)
- [ ] 회원가입/로그인 작동
- [ ] 대시보드 로딩
- [ ] API 응답 정상 (Network 탭 확인)
- [ ] SSL 인증서 적용 (자물쇠 아이콘)
- [ ] Console 에러 없음

### 기능 테스트 (배포 후 30분)

- [ ] **인증 플로우**
  - [ ] 회원가입
  - [ ] 이메일 인증
  - [ ] 로그인
  - [ ] 비밀번호 찾기

- [ ] **입찰 관리**
  - [ ] 입찰 검색
  - [ ] 입찰 상세보기
  - [ ] 입찰 필터링
  - [ ] 키워드 알림 설정

- [ ] **AI 기능**
  - [ ] 입찰 분석 (analyze)
  - [ ] Excel 수식 생성 (formula)
  - [ ] 비용 추적 확인

- [ ] **Chrome Extension**
  - [ ] 확장 프로그램 설치
  - [ ] 나라장터에서 추출 테스트
  - [ ] BIDFLOW 계정 연동
  - [ ] 통계 확인

### 성능 테스트 (배포 후 1시간)

```bash
# Lighthouse 점수
npx lighthouse https://bidflow.vercel.app --view

목표:
- Performance: > 90
- Accessibility: > 95
- Best Practices: > 95
- SEO: > 90

# API 부하 테스트 (선택)
npx artillery quick \
  --count 10 \
  --num 100 \
  https://bidflow.vercel.app/api/v1/bids
```

### 모니터링 설정 (배포 후 2시간)

- [ ] Sentry 이벤트 수신 확인
- [ ] Vercel Analytics 데이터 수집 시작
- [ ] 알림 설정:
  - [ ] 에러율 > 5% → 이메일 알림
  - [ ] API 응답 시간 > 500ms → Slack 알림
  - [ ] AI 할당량 > 80% → 이메일 알림

---

## 롤백 절차

### Vercel 롤백 (긴급)

```bash
# 방법 1: Vercel Dashboard
1. Deployments 탭
2. 이전 성공한 배포 선택
3. "Promote to Production" 클릭
4. 즉시 롤백 완료 (< 1분)

# 방법 2: CLI
vercel rollback <deployment-url>
```

### 데이터베이스 롤백

```bash
# Supabase는 자동 백업 제공
1. Supabase Dashboard > Database > Backups
2. 롤백할 시점 선택
3. "Restore" 클릭

# 또는 SQL로 수동 롤백
psql $DATABASE_URL -f backup-2025-12-25.sql
```

### Chrome Extension 롤백

```bash
# 이전 버전 ZIP 다시 업로드
1. Chrome Web Store Developer Dashboard
2. "Upload Updated Package"
3. 이전 버전 ZIP 선택
4. 심사 제출 (긴급 심사 요청 가능)
```

---

## 런칭 체크리스트

### 소프트 런칭 (베타, D-Day)

- [ ] 베타 테스터 10-20명 모집
- [ ] 피드백 수집 채널 오픈 (Discord, Slack, 이메일)
- [ ] 모니터링 24시간 집중 관찰
- [ ] 긴급 버그 수정 대기

### 공식 런칭 (D+7)

- [ ] 프레스 릴리스 배포
- [ ] Product Hunt 등록
- [ ] SNS 마케팅 시작
- [ ] 블로그 포스팅
- [ ] 유튜브 튜토리얼
- [ ] Google Ads 캠페인 (선택)

### 런칭 후 모니터링 (D+30)

- [ ] 일별 활성 사용자 (DAU) 추적
- [ ] 주요 기능 사용률 분석
- [ ] 고객 문의 응대 (<24시간 목표)
- [ ] 버그 우선순위 관리
- [ ] 기능 개선 로드맵 업데이트

---

## 긴급 연락처

| 역할 | 이름 | 연락처 |
|------|------|--------|
| 개발 리드 | - | - |
| DevOps | - | - |
| PM | - | - |
| 고객 지원 | - | support@bidflow.app |

---

## 체크리스트 요약

### Phase 1: 사전 준비 (1일)
- [ ] 모든 계정 생성
- [ ] 환경변수 설정
- [ ] 비용 예산 승인

### Phase 2: 배포 (1일)
- [ ] Supabase 마이그레이션
- [ ] Vercel 배포
- [ ] 도메인 연결
- [ ] SSL 인증서 확인

### Phase 3: 확장 프로그램 (2일)
- [ ] 아이콘 디자인
- [ ] Chrome Web Store 등록
- [ ] 심사 제출

### Phase 4: 모니터링 (1일)
- [ ] Sentry 설정
- [ ] 알림 규칙 설정
- [ ] 대시보드 구성

### Phase 5: 런칭 (D-Day)
- [ ] 소프트 런칭 (베타)
- [ ] 모니터링 집중
- [ ] 피드백 수집

### Phase 6: 공식 런칭 (D+7)
- [ ] 마케팅 캠페인 시작
- [ ] 프레스 릴리스
- [ ] 성능 최적화

---

**총 소요 시간**: 약 5-7일
**권장 런칭 일정**: 2025-12-30 (소프트) → 2026-01-06 (공식)

---

**문서 버전**: 1.0
**최종 검토**: 2025-12-25
**작성자**: Claude AI

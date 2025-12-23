# 🤖 Hyein Agent - 정부지원사업 자동화 마스터 패키지

[![CI](https://github.com/saucefirstteam/hyein-agent/actions/workflows/ci.yml/badge.svg)](https://github.com/saucefirstteam/hyein-agent/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> AI 기반 정부지원사업 공고 자동 수집 → 적합도 분석 → 사업계획서 자동 생성 시스템

## 🎯 주요 기능

- ✅ **자동 공고 수집**: **51개 소스** 분석 완료 (정부 34개 + 민간 17개)
  - **정부 기관 (9개 크롤러 구현)**:
    - API: Bizinfo, K-Startup
    - Cheerio: KISED, SBA, CCEI(17개), Finance(3개), Technopark(5개)
    - Puppeteer: NIPA (동적 페이지)
    - Naver Search API
  - **민간 플랫폼 (9개 크롤러 구현)**:
    - Phase 1: SparkLabs, Kakao Ventures, Tumblbug
    - Phase 2: Naver D2SF, Primer, Wadiz, Fast Track Asia, BonAngels, Company K Partners
- 🤖 **AI 적합도 분석**: OpenAI GPT-4o 기반 맞춤 분석
  - 1-10점 점수 평가
  - 추천도: 강력추천/추천/검토필요/부적합
  - 매칭 이유 및 우려사항 분석
  - 핵심 평가기준 및 준비 팁 제공
  - 우선순위 자동 설정 (HIGH/MEDIUM/LOW)
- 📧 **알림 시스템**: 새로운 공고 자동 알림
  - Slack: Block Kit 구조화된 메시지
  - Email: HTML 형식 상세 정보
  - 점수 기반 필터링 (기본 7점 이상)
- 📊 **Google Services 연동**: 자동 데이터 관리
  - Google Sheets: 공고 데이터 자동 기록
  - Google Calendar: 마감일 자동 등록 (우선순위별 리마인더)
  - 중복 체크 및 자동 동기화
- 📋 **자동 분석 및 저장**: JSON 형식 결과 저장
- 🔄 **병렬 수집**: 동시 5개 소스 수집으로 빠른 처리 (35-60초)

## 📦 시스템 아키텍처

```
[매일 오전 8시]
    ↓
[공고 수집 - 34개 소스]
├─ 정부기관 (API)
│  ├─ 기업마당 (Bizinfo)
│  ├─ K-Startup
│  ├─ 중소벤처기업부 (SMBA)
│  └─ 소상공인24 (SEMAS24)
├─ 정부기관 (크롤링)
│  ├─ 창업진흥원 (KISED)
│  ├─ NIPA (정보통신산업진흥원)
│  └─ 중소벤처기업진흥공단
├─ 금융기관
│  ├─ 기술보증기금 (KODIT)
│  ├─ 신용보증기금 (KOREG)
│  └─ IBK기업은행 (KIBO)
├─ 지자체
│  ├─ 서울산업진흥원
│  ├─ 경기도창업지원센터
│  ├─ 부산창조경제혁신센터
│  ├─ 전국 창조경제혁신센터 17개
│  └─ 마루180
├─ 특화 플랫폼
│  ├─ TIPS
│  ├─ K-Global
│  ├─ K-PUSH
│  └─ K-DATA
├─ 네이버 생태계
│  ├─ 네이버 검색 API (실시간 뉴스/블로그)
│  ├─ 네이버 사장님 (창업지원 5개 카테고리)
│  ├─ D2 Startup Factory
│  ├─ 네이버 D2 (개발자 지원)
│  ├─ 네이버 Connect (CSR)
│  └─ 네이버 CLOVA AI
└─ 민간/액셀러레이터
   ├─ 프라이머
   ├─ 매쉬업엔젤스
   ├─ SparkLabs Korea
   └─ TheVC
    ↓
[Claude AI 분석]
├─ 적합도 점수 (1-10점)
├─ 평가기준 파싱
├─ 핵심 키워드 추출
└─ 추천 전략
    ↓
[자동 저장/알림]
├─ 📊 Google Sheets (공고 데이터 기록)
├─ 📅 Google Calendar (마감일 등록)
├─ 💬 Slack (실시간 알림)
└─ 📧 Email (상세 알림)
```

## 🚀 빠른 시작

### 요구사항

- Node.js 20+
- npm 10+
- TypeScript 5.7+

### 설치

```bash
# 저장소 클론
git clone https://github.com/saucefirstteam/hyein-agent.git
cd hyein-agent

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일을 열어 API 키 등을 설정
```

### 환경 변수 설정

`.env` 파일에 다음 값들을 설정하세요:

```env
# 필수: OpenAI API (AI 분석용)
OPENAI_API_KEY=sk-proj-xxxxx

# 선택: 정부 공공 API (실제 크롤링 시 필요)
BIZINFO_API_KEY=your_bizinfo_key
KSTARTUP_API_KEY=your_kstartup_key

# 선택: 네이버 검색 API
NAVER_CLIENT_ID=your_naver_client_id
NAVER_CLIENT_SECRET=your_naver_client_secret
```

### 실행

```bash
# 1. 공고 수집만 실행 (개발 모드: Mock 데이터)
npm run collect:only

# 2. AI 분석만 실행 (수집된 공고 분석)
npm run analyze

# 3. Slack/Email 알림 발송
npm run notify

# 4. Google Sheets/Calendar 동기화
npm run google

# 5. 전체 파이프라인 실행 (수집 → 분석 → 알림 → Google 동기화)
npm run pipeline

# 6. 프로덕션 모드로 실제 크롤링 (NODE_ENV=production 설정 필요)
NODE_ENV=production npm run collect:only

# 7. 프로덕션 빌드
npm run build
npm start
```

### 내 사업 정보 설정

`config/my-business.json` 파일을 편집하여 본인의 사업 정보를 입력하세요:

```json
{
  "serviceName": "ZZIK (찍)",
  "item": "AI 기반 위치기반 여행 경로 추천 서비스",
  "field": "AI/LBS/관광테크",
  "stage": "초기 단계 (MVP 개발 중)",
  "team": "2인 팀 (개발자 2명)",
  "techStack": "Next.js, React, TypeScript, Python, FastAPI, PostgreSQL, OpenAI API",
  "additionalInfo": {
    "targetMarket": "국내 여행객 (20-30대)",
    "uniqueValue": "AI가 사용자 취향을 분석하여 개인 맞춤형 여행 경로 자동 생성",
    "currentProgress": "MVP 개발 80% 완료"
  }
}
```

## 🐳 Docker 실행

```bash
# Docker Compose로 실행
docker-compose up -d

# 로그 확인
docker-compose logs -f hyein-agent

# 중지
docker-compose down
```

## 📝 사용 가이드

### 1. API 키 발급

#### Anthropic (Claude API)
1. [Anthropic Console](https://console.anthropic.com/) 접속
2. API Keys 메뉴에서 새 키 생성

#### 공공데이터포털
1. [공공데이터포털](https://www.data.go.kr/) 회원가입
2. 다음 API 신청:
   - [기업마당 지원사업 정보](https://www.data.go.kr/data/15078873/openapi.do)
   - [K-Startup 사업공고](https://www.data.go.kr/data/15125364/openapi.do)

#### 네이버 검색 API
1. [네이버 개발자 센터](https://developers.naver.com/) 접속
2. 애플리케이션 등록
   - 애플리케이션 이름: Hyein Agent
   - 사용 API: 검색 (뉴스 + 블로그)
3. **⚠️ 중요**: 비로그인 오픈 API 서비스 환경 설정
   - **WEB 설정** 추가 필수
   - 서비스 URL: `http://localhost:3000`
4. Client ID & Secret 복사
5. 상세 설정 가이드: [NAVER_API_GUIDE.md](docs/NAVER_API_GUIDE.md)

#### Google Services
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. OAuth 2.0 클라이언트 ID 생성 (애플리케이션 타입: 데스크톱 앱)
3. Sheets API, Calendar API 활성화
4. credentials.json 다운로드 및 프로젝트 루트에 저장
5. OAuth 인증 실행:
   ```bash
   # 설정 진단
   npm run oauth:check

   # OAuth 인증
   npm run oauth:google
   ```
6. Refresh Token을 .env에 추가
7. 상세 설정 가이드:
   - [GOOGLE_SERVICES_GUIDE.md](docs/GOOGLE_SERVICES_GUIDE.md)
   - [GOOGLE_OAUTH_SETUP.md](docs/GOOGLE_OAUTH_SETUP.md) (403 에러 해결)

#### Slack Webhook
1. Slack 워크스페이스에서 앱 추가
2. Incoming Webhooks 활성화
3. Webhook URL 복사
4. 상세 설정 가이드: [NOTIFICATION_GUIDE.md](docs/NOTIFICATION_GUIDE.md)

### 2. Google Sheets 설정

1. 새 Google Sheets 생성
2. Spreadsheet ID 확인 (URL에서 추출)
3. OAuth로 인증한 계정에 편집 권한 부여
4. 스크립트 실행시 자동으로 헤더 생성됨

### 3. 스케줄러 설정

Cron 표현식으로 실행 시간 커스터마이징:

```env
# 매일 오전 8시 (기본값)
SCHEDULER_CRON=0 8 * * *

# 평일 오전 9시
SCHEDULER_CRON=0 9 * * 1-5

# 매주 월요일 오전 10시
SCHEDULER_CRON=0 10 * * 1
```

## 🛠️ 개발

### 프로젝트 구조

```
hyein-agent/
├── src/
│   ├── agents/          # AI 에이전트
│   │   └── claude-agent.ts
│   ├── services/        # 비즈니스 로직
│   │   ├── collectors/  # 공고 수집기
│   │   ├── integrations/# 외부 연동
│   │   └── analyzer.ts  # 분석 엔진
│   ├── config/          # 설정 관리
│   ├── types/           # 타입 정의
│   ├── utils/           # 유틸리티
│   ├── scheduler.ts     # 스케줄러
│   └── index.ts         # 메인 엔트리
├── tests/               # 테스트
├── docs/                # 문서
└── ...
```

### 스크립트

```bash
# 개발
npm run dev              # 개발 서버 (hot reload)

# 빌드
npm run build            # TypeScript 컴파일

# 테스트
npm test                 # Jest 테스트 실행
npm run test:watch       # Watch 모드

# 코드 품질
npm run lint             # ESLint 검사
npm run lint:fix         # ESLint 자동 수정
npm run format           # Prettier 포맷팅
npm run typecheck        # 타입 체크

# Docker
npm run docker:build     # Docker 이미지 빌드
npm run docker:run       # Docker 컨테이너 실행
```

## 🧪 테스트

```bash
# 전체 테스트
npm test

# 커버리지 포함
npm test -- --coverage

# 특정 파일
npm test -- collectors
```

## 🔄 CI/CD

GitHub Actions를 통한 자동화:

- ✅ Lint & Type Check
- ✅ Unit Tests
- ✅ Build Verification
- ✅ Docker Image Build & Push (main 브랜치)

## 📊 모니터링

### 로그 확인

```bash
# 로컬
tail -f logs/app.log

# Docker
docker-compose logs -f hyein-agent
```

### Slack 알림

- ✅ 매일 분석 결과
- 🚨 시스템 오류
- 📈 워크플로우 상태

## 🎨 커스터마이징

### 내 사업 정보 변경

`.env` 파일에서 다음 값 수정:

```env
MY_SERVICE_NAME=Your Service Name
MY_SERVICE_ITEM=Your Item Description
MY_SERVICE_FIELD=Your Field
MY_SERVICE_STAGE=Your Stage
MY_SERVICE_TEAM=Your Team Size
MY_SERVICE_TECH_STACK=Your Tech Stack
```

### 필터링 키워드 추가

```env
FILTER_KEYWORDS=창업,스타트업,AI,SW,추가키워드1,추가키워드2
```

### 적합도 기준 변경

```env
# 7점 이상만 알림 (기본값)
MIN_SCORE_THRESHOLD=7

# 5점 이상으로 완화
MIN_SCORE_THRESHOLD=5
```

## 🐛 트러블슈팅

### K-Startup API 403 오류

- 공공데이터포털에서 API 활성화 상태 확인
- 승인까지 1-2일 소요

### Google OAuth 오류

- Refresh Token 재발급
- Scopes 확인: `https://www.googleapis.com/auth/spreadsheets`, `https://www.googleapis.com/auth/calendar`

### Claude API Rate Limit

- `.env`에서 `CLAUDE_RATE_LIMIT_PER_MINUTE` 조정
- 공고 수집 간격 증가

## 📈 성능 최적화

- ✅ 병렬 공고 수집 (p-queue)
- ✅ Rate Limiting (p-retry)
- ✅ Redis 캐싱 (선택사항)
- ✅ Docker 멀티 스테이지 빌드

## 🤝 기여

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

MIT License - 자유롭게 사용, 수정, 배포 가능합니다.

## 🔗 관련 링크

- [공공데이터포털](https://www.data.go.kr/)
- [K-Startup](https://www.k-startup.go.kr/)
- [Bizinfo](https://www.bizinfo.go.kr/)
- [Claude API Docs](https://docs.anthropic.com/)

## 📧 문의

SauceFirst Team - [GitHub](https://github.com/saucefirstteam)

Project Link: [https://github.com/saucefirstteam/hyein-agent](https://github.com/saucefirstteam/hyein-agent)

---

Made with ❤️ by SauceFirst Team

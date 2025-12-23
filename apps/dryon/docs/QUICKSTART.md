# 빠른 시작 가이드 (Quick Start)

## 5분 안에 시작하기

### 1단계: 프로젝트 클론 및 설치

```bash
# 저장소 클론
git clone https://github.com/saucefirstteam/hyein-agent.git
cd hyein-agent

# 의존성 설치
npm install
```

### 2단계: 환경 변수 설정

```bash
# .env 파일 생성
cp .env.example .env
```

`.env` 파일을 열고 최소한 다음 값들을 설정하세요:

```env
# Claude API (필수)
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx  # https://console.anthropic.com/에서 발급

# 공공데이터 API (필수)
BIZINFO_API_KEY=your_bizinfo_key       # https://www.data.go.kr/에서 발급
KSTARTUP_API_KEY=your_kstartup_key

# Slack (선택사항)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```

### 3단계: 실행

```bash
# 즉시 실행 (테스트)
npm start

# 또는 개발 모드 (hot reload)
npm run dev
```

## API 키 발급 방법

### Claude API (필수)

1. [Anthropic Console](https://console.anthropic.com/) 접속
2. 회원가입 / 로그인
3. "API Keys" 메뉴 클릭
4. "Create Key" 버튼 클릭
5. 생성된 키를 `.env`의 `ANTHROPIC_API_KEY`에 입력

**예상 소요 시간:** 5분

### 공공데이터포털 API (필수)

1. [공공데이터포털](https://www.data.go.kr/) 접속
2. 회원가입 / 로그인
3. 다음 API 신청:
   - [기업마당 지원사업 정보](https://www.data.go.kr/data/15078873/openapi.do)
   - [K-Startup 사업공고](https://www.data.go.kr/data/15125364/openapi.do)
4. 신청 후 승인 대기 (1-2일 소요)
5. 승인되면 발급된 키를 `.env`에 입력

**예상 소요 시간:** 신청 5분 + 승인 대기 1-2일

### Slack Webhook (선택사항)

1. Slack 워크스페이스 접속
2. [Slack Apps](https://api.slack.com/apps) 페이지로 이동
3. "Create New App" → "From scratch"
4. App 이름 및 워크스페이스 선택
5. "Incoming Webhooks" 활성화
6. "Add New Webhook to Workspace"
7. 알림을 받을 채널 선택
8. 생성된 Webhook URL을 `.env`에 입력

**예상 소요 시간:** 10분

## 첫 실행 확인

실행하면 다음과 같은 로그를 볼 수 있습니다:

```
[2025-12-09 08:00:00] INFO: 🚀 Hyein Agent 시작
[2025-12-09 08:00:01] INFO: 📡 공고 수집 시작...
[2025-12-09 08:00:05] INFO: ✅ 기업마당: 42건 수집
[2025-12-09 08:00:08] INFO: ✅ K-Startup: 28건 수집
[2025-12-09 08:00:10] INFO: 🤖 AI 분석 시작 (총 70건)
[2025-12-09 08:02:30] INFO: ✅ 분석 완료: 적합 공고 12건 발견
[2025-12-09 08:02:35] INFO: 📊 Google Sheets 저장 완료
[2025-12-09 08:02:36] INFO: 💬 Slack 알림 전송 완료
[2025-12-09 08:02:37] INFO: ✨ 모든 작업 완료!
```

## 결과 확인

### 1. 콘솔 로그

터미널에서 실시간으로 진행 상황을 확인할 수 있습니다.

### 2. Google Sheets (설정한 경우)

설정한 Google Sheets에서 분석 결과를 확인할 수 있습니다.

| 공고명 | 출처 | 적합도 | 평가기준 | 추천전략 | 링크 |
|--------|------|--------|----------|----------|------|
| 예비창업패키지 | Bizinfo | 8 | 혁신성, 기술성 | 기술 강조 | [링크] |

### 3. Slack 알림 (설정한 경우)

적합도 7점 이상 공고에 대한 알림을 받습니다.

```
🎯 새로운 적합 공고 발견! (적합도: 8/10)

📋 예비창업 패키지 지원사업
🏢 출처: 기업마당
📅 마감: 2025-12-31

💡 핵심 키워드: 창업, AI, SW
⭐ 추천 이유: ZZIK의 AI 기반 서비스와 높은 적합성

🔗 상세보기: https://...
```

## 스케줄러 설정

기본값은 **매일 오전 8시** 자동 실행입니다.

실행 시간을 변경하려면 `.env`를 수정하세요:

```env
# 매일 오전 9시
SCHEDULER_CRON=0 9 * * *

# 평일 오전 8시
SCHEDULER_CRON=0 8 * * 1-5

# 매주 월요일 오전 10시
SCHEDULER_CRON=0 10 * * 1
```

Cron 표현식 생성 도구: [crontab.guru](https://crontab.guru/)

## Docker로 실행

Docker를 선호한다면:

```bash
# Docker Compose 실행
docker-compose up -d

# 로그 확인
docker-compose logs -f hyein-agent

# 중지
docker-compose down
```

## 트러블슈팅

### API 키 오류

```
Error: Invalid API key
```

→ `.env` 파일의 API 키를 확인하세요.

### 공공 API 403 오류

```
Error: 403 Forbidden
```

→ 공공데이터포털에서 API 신청이 승인되었는지 확인하세요.

### Claude API Rate Limit

```
Error: Rate limit exceeded
```

→ `.env`의 `CLAUDE_RATE_LIMIT_PER_MINUTE` 값을 낮추세요.

## 다음 단계

✅ 기본 실행 완료!

이제 다음을 시도해보세요:

1. **내 사업 정보 커스터마이징**
   - `.env`의 `MY_SERVICE_*` 값 수정

2. **필터링 키워드 추가**
   - `.env`의 `FILTER_KEYWORDS` 수정

3. **Google Services 연동**
   - [배포 가이드](DEPLOYMENT.md) 참고

4. **사업계획서 자동 생성**
   - 적합 공고에 대해 자동으로 계획서 생성

## 도움말

- 📚 [전체 문서](../README.md)
- 🏗️ [아키텍처](ARCHITECTURE.md)
- 🚀 [배포 가이드](DEPLOYMENT.md)
- 🔌 [API 문서](API.md)
- 🤝 [기여 가이드](../CONTRIBUTING.md)

## 문의

- GitHub Issues: https://github.com/saucefirstteam/hyein-agent/issues
- Email: support@saucefirst.com

---

Happy Coding! 🚀

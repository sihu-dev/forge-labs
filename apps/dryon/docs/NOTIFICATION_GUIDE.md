# 📧 알림 시스템 가이드

## 개요

정부지원사업 자동화 시스템의 알림 기능을 통해 새로운 공고 발견 시 자동으로 이메일과 Slack으로 알림을 받을 수 있습니다.

## 지원 채널

### 1. 📧 Email (SMTP)
- Gmail, Outlook, 기타 SMTP 서버 지원
- HTML 형식의 상세한 공고 정보 제공
- 첨부파일 지원 (향후 추가 예정)

### 2. 💬 Slack
- Incoming Webhook을 통한 실시간 알림
- Block Kit을 활용한 구조화된 메시지
- 버튼 클릭으로 공고 상세보기

---

## 설정 방법

### 1. 환경변수 설정

`.env` 파일을 생성하고 다음 설정을 추가하세요:

#### Email 설정 (Gmail 예시)

```env
# Email 알림 활성화
EMAIL_ENABLED=true

# SMTP 서버 정보
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_SECURE=false

# Gmail 계정 정보
EMAIL_SMTP_USER=your-email@gmail.com
EMAIL_SMTP_PASSWORD=your-app-password

# 발신자/수신자
EMAIL_FROM=정부지원사업 알림 <your-email@gmail.com>
EMAIL_TO=recipient@example.com
```

**Gmail 앱 비밀번호 생성 방법:**
1. Google 계정 관리 페이지 접속: https://myaccount.google.com/
2. 보안 > 2단계 인증 활성화
3. 앱 비밀번호 생성: https://myaccount.google.com/apppasswords
4. "메일" 앱 선택 후 비밀번호 생성
5. 생성된 16자리 비밀번호를 `EMAIL_SMTP_PASSWORD`에 입력

#### Slack 설정

```env
# Slack 알림 활성화
SLACK_ENABLED=true

# Incoming Webhook URL
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# 알림을 받을 채널
SLACK_CHANNEL=#정부지원사업-알림
```

**Slack Incoming Webhook 생성 방법:**
1. Slack 워크스페이스 관리 페이지 접속
2. Apps > Incoming Webhooks 검색 및 설치
3. "Add to Slack" 클릭
4. 알림을 받을 채널 선택
5. Webhook URL 복사하여 `SLACK_WEBHOOK_URL`에 입력

#### 알림 임계값 설정

```env
# 적합도 점수 7점 이상만 알림 발송
MIN_SCORE_THRESHOLD=7
```

---

## 사용 방법

### 1. 알림 연결 테스트

```bash
# Email과 Slack 연결 테스트
npm run notify
```

이 명령어는 다음을 수행합니다:
- Email 및 Slack 연결 상태 확인
- 분석된 공고 데이터 로드 (data/analyzed-programs.json)
- 적합도 7점 이상 공고를 Email과 Slack으로 발송

### 2. 전체 파이프라인 실행

```bash
# 공고 수집 → 분석 → 알림 발송
npm run pipeline
```

실행 순서:
1. `npm run collect:only` - 공고 수집
2. `npm run analyze` - AI 분석
3. `npm run notify` - 알림 발송

### 3. 개별 실행

```bash
# 1단계: 공고 수집
npm run collect:only

# 2단계: AI 분석
npm run analyze

# 3단계: 알림 발송
npm run notify
```

---

## 알림 내용

### Email 알림 포함 정보

📧 **HTML 이메일 형식**
- 공고 제목 및 기관
- 적합도 점수 (X/10점)
- 추천도 (강력추천/추천/검토필요)
- 우선순위 (HIGH/MEDIUM/LOW)
- 마감일
- 예상 지원금
- 매칭 이유
- 준비 팁
- 주의사항
- 공고 상세보기 링크

### Slack 알림 포함 정보

💬 **Slack Block Kit 형식**
- 공고 요약 통계
- 각 공고별 상세 정보
- 이모지를 활용한 시각적 표현
- 클릭 가능한 공고 링크

---

## 고급 설정

### 프로그래밍 방식으로 사용

```typescript
import {
  NotificationManager,
  createNotificationConfigFromEnv,
} from './src/services/notifications/index.js';

// 환경변수에서 설정 로드
const config = createNotificationConfigFromEnv();
const notificationManager = new NotificationManager(config);

// 연결 테스트
const results = await notificationManager.testConnections();
console.log('Email:', results.email ? '✅' : '❌');
console.log('Slack:', results.slack ? '✅' : '❌');

// 알림 발송
await notificationManager.notifyNewPrograms(analyzedPrograms);

// 긴급 공고만 알림
await notificationManager.notifyUrgentPrograms(analyzedPrograms);

// 특정 점수 이상만 알림
await notificationManager.notifyByScore(analyzedPrograms, 8);
```

### 커스텀 필터링

```typescript
// HIGH 우선순위 + 강력추천만 알림
const urgentPrograms = analyzedPrograms.filter(
  (p) => p.analysis.priority === 'HIGH' &&
         p.analysis.recommendation === '강력추천'
);

await notificationManager.notifyNewPrograms(urgentPrograms);
```

---

## 문제 해결

### Email 발송 실패

**문제:** `Error: Invalid login`
**해결:**
- Gmail 앱 비밀번호가 올바른지 확인
- 2단계 인증이 활성화되어 있는지 확인
- `EMAIL_SMTP_USER`에 전체 이메일 주소 입력 확인

**문제:** `Connection timeout`
**해결:**
- SMTP 서버 주소와 포트 확인
- 방화벽이 SMTP 포트(587 또는 465)를 차단하는지 확인

### Slack 발송 실패

**문제:** `404 Not Found`
**해결:**
- Webhook URL이 올바른지 확인
- Webhook이 만료되지 않았는지 확인
- 채널 이름에 `#` 포함 확인

**문제:** `No program to notify`
**해결:**
- `analyzed-programs.json` 파일이 존재하는지 확인
- 적합도 점수가 임계값(기본 7점) 이상인 공고가 있는지 확인
- `MIN_SCORE_THRESHOLD` 값을 낮춰보기

---

## 알림 예시

### Email 알림 예시

```
🎯 새로운 정부지원사업 공고 4건 발견!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 분석 요약
• 전체 공고: 4개
• 추천 공고: 4개
• 긴급 (HIGH): 4개
• 분석 일시: 2025년 12월 10일

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. AI 스타트업 육성 지원사업

  🌟 강력추천 | 🔴 HIGH | ⭐ 10/10점

  기관: NIPA (정보통신산업진흥원)
  마감일: 2026년 1월 24일
  예상 지원금: 최대 5천만원

  ✅ 매칭 이유
  • AI 기술 활용 분야로 우리 사업과 완벽히 일치
  • 위치기반 AI 서비스(LBS) 분야가 핵심 지원 분야
  • 관광/여행 분야 적용으로 우리 서비스와 정확히 일치

  💡 준비 팁
  • AI 기반 경로 추천 알고리즘의 차별성을 명확히 제시
  • MVP 개발 현황과 베타 테스트 계획 구체화
  • 관광 산업 기여도 및 사회적 가치 강조

  [공고 상세보기 →]
```

### Slack 알림 예시

<img src="https://user-images.githubusercontent.com/placeholder-slack-notification.png" alt="Slack Notification Example" width="600">

---

## 스케줄러 통합

알림 시스템은 스케줄러와 함께 사용할 수 있습니다:

```env
# 매일 오전 8시에 자동 실행
SCHEDULER_CRON=0 8 * * *
SCHEDULER_TIMEZONE=Asia/Seoul
```

스케줄러가 다음을 자동으로 수행합니다:
1. 공고 수집 (collect)
2. AI 분석 (analyze)
3. 알림 발송 (notify)

---

## API 참고

### NotificationManager

#### `notifyNewPrograms(programs: AnalyzedProgram[]): Promise<void>`
적합도 점수가 임계값 이상인 공고를 Email과 Slack으로 알림

#### `notifyUrgentPrograms(programs: AnalyzedProgram[]): Promise<void>`
HIGH 우선순위 공고만 즉시 알림

#### `notifyByScore(programs: AnalyzedProgram[], minScore: number): Promise<void>`
특정 점수 이상 공고만 알림

#### `testConnections(): Promise<{ email: boolean; slack: boolean }>`
Email 및 Slack 연결 테스트

#### `sendDailySummary(totalCollected, analyzed, recommended): Promise<void>`
일일 요약 알림 발송

---

## 보안 주의사항

⚠️ **중요:**
- `.env` 파일을 절대 Git에 커밋하지 마세요
- `.env.example`을 참고하여 개인 `.env` 파일을 생성하세요
- Webhook URL과 비밀번호는 안전하게 보관하세요
- Gmail 앱 비밀번호는 일반 비밀번호와 다릅니다

---

## 추가 기능 (향후 개발 예정)

- [ ] Discord 알림 지원
- [ ] Microsoft Teams 알림 지원
- [ ] Telegram 봇 알림
- [ ] 카카오톡 알림톡
- [ ] 알림 템플릿 커스터마이징
- [ ] 첨부파일 (PDF 사업계획서) 자동 생성
- [ ] 알림 이력 저장 및 조회
- [ ] 알림 수신 거부 관리

---

## 문의

알림 시스템 관련 문의사항은 GitHub Issues로 등록해주세요.

**프로젝트:** Hyein Agent - 정부지원사업 자동화 시스템
**작성일:** 2025-12-10

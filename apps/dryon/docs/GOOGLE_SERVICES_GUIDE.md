# 📊 Google Services 연동 가이드

## 개요

정부지원사업 자동화 시스템의 Google Services 연동 기능을 통해 분석된 공고를 자동으로 Google Sheets에 기록하고, Google Calendar에 마감일을 등록할 수 있습니다.

## 지원 서비스

### 1. 📊 Google Sheets
- 분석된 공고를 스프레드시트에 자동 기록
- 적합도 점수, 추천도, 우선순위 등 상세 정보 저장
- 중복 체크 (공고ID 기준)
- 자동 헤더 생성

### 2. 📅 Google Calendar
- 공고 마감일을 캘린더 이벤트로 자동 등록
- 우선순위별 자동 리마인더 설정
  - HIGH: 2주 전, 1주 전, 3일 전, 1일 전
  - MEDIUM: 1주 전, 3일 전, 1일 전
  - LOW: 1주 전, 1일 전
- 우선순위별 색상 구분 (HIGH=빨강, MEDIUM=노랑, LOW=초록)
- 중복 체크 (제목 기준)

---

## 설정 방법

### 1. Google Cloud Console 설정

#### Step 1: 프로젝트 생성
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. 프로젝트 이름: "Hyein Agent" (또는 원하는 이름)

#### Step 2: API 활성화
1. "API 및 서비스" > "라이브러리" 메뉴로 이동
2. 다음 API 검색 및 활성화:
   - **Google Sheets API**
   - **Google Calendar API**

#### Step 3: OAuth 2.0 클라이언트 ID 생성
1. "API 및 서비스" > "사용자 인증 정보" 메뉴로 이동
2. "+ 사용자 인증 정보 만들기" > "OAuth 클라이언트 ID" 선택
3. 애플리케이션 유형: "웹 애플리케이션" 선택
4. 승인된 리디렉션 URI 추가:
   ```
   http://localhost:3000/oauth2callback
   ```
5. "만들기" 클릭
6. 생성된 **클라이언트 ID**와 **클라이언트 보안 비밀** 복사

#### Step 4: Refresh Token 생성

OAuth Playground를 사용하여 Refresh Token을 생성합니다:

1. [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/) 접속
2. 오른쪽 상단 톱니바퀴 아이콘 클릭
3. "Use your own OAuth credentials" 체크
4. OAuth Client ID와 OAuth Client Secret 입력
5. 왼쪽 "Step 1"에서 다음 API 선택:
   - `https://www.googleapis.com/auth/spreadsheets`
   - `https://www.googleapis.com/auth/calendar`
6. "Authorize APIs" 클릭
7. Google 계정으로 로그인 및 권한 승인
8. "Step 2"에서 "Exchange authorization code for tokens" 클릭
9. 생성된 **Refresh token** 복사

### 2. Google Sheets 준비

#### 새 스프레드시트 생성
1. [Google Sheets](https://sheets.google.com) 접속
2. 새 스프레드시트 생성
3. 이름: "정부지원사업 공고 관리" (또는 원하는 이름)
4. URL에서 **SPREADSHEET_ID** 복사:
   ```
   https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit
   ```

> **참고:** 시트 이름은 자동으로 "공고목록"으로 생성됩니다.
> 헤더도 자동으로 생성되므로 별도 작업이 필요 없습니다.

### 3. 환경변수 설정

`.env` 파일에 다음 설정을 추가하세요:

```env
# ==================================
# Google Services
# ==================================
GOOGLE_SHEETS_ENABLED=true
GOOGLE_CALENDAR_ENABLED=true

# OAuth 인증 정보
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/oauth2callback
GOOGLE_REFRESH_TOKEN=your_google_refresh_token

# Google Sheets 설정
GOOGLE_SPREADSHEET_ID=your_spreadsheet_id

# Google Calendar 설정
GOOGLE_CALENDAR_ID=primary

# 적합도 점수 임계값 (7점 이상만 동기화)
MIN_SCORE_THRESHOLD=7
```

---

## 사용 방법

### 1. Google Services 연결 테스트

```bash
# Google Sheets 및 Calendar 연결 테스트
npm run google
```

이 명령어는 다음을 수행합니다:
- Google Sheets 및 Calendar 연결 상태 확인
- 분석된 공고 데이터 로드 (data/analyzed-programs.json)
- 적합도 7점 이상 공고를 Sheets와 Calendar에 동기화

### 2. 전체 파이프라인 실행

```bash
# 공고 수집 → 분석 → 알림 → Google 동기화
npm run pipeline
```

실행 순서:
1. `npm run collect:only` - 공고 수집
2. `npm run analyze` - AI 분석
3. `npm run notify` - Slack/Email 알림 발송
4. `npm run google` - Google Sheets/Calendar 동기화

### 3. 개별 실행

```bash
# 1단계: 공고 수집
npm run collect:only

# 2단계: AI 분석
npm run analyze

# 3단계: Slack/Email 알림
npm run notify

# 4단계: Google 동기화
npm run google
```

---

## Google Sheets 데이터 구조

자동으로 생성되는 컬럼:

| 컬럼 | 설명 | 예시 |
|------|------|------|
| 분석일시 | 공고 분석 시각 | 2025-12-10 22:30:00 |
| 공고ID | 고유 식별자 | MOCK_001 |
| 공고명 | 공고 제목 | AI 스타트업 육성 지원사업 |
| 기관 | 주관 기관 | NIPA (정보통신산업진흥원) |
| 카테고리 | 사업 분류 | AI/SW |
| 대상 | 지원 대상 | AI 기반 서비스 개발 스타트업 |
| 마감일 | 접수 마감일 | 2026-01-24 |
| 적합도 점수 | AI 분석 점수 | 10 |
| 추천도 | 추천 등급 | 강력추천 |
| 우선순위 | 긴급도 | HIGH |
| 예상 지원금 | 지원 규모 | 최대 5천만원 |
| 매칭 이유 | 적합 사유 | AI 기술 활용 분야로 우리 사업과 완벽히 일치... |
| 준비 팁 | 사업계획서 작성 팁 | AI 기반 경로 추천 알고리즘의 차별성을 명확히 제시... |
| 주의사항 | 유의 사항 | 경쟁률이 높을 것으로 예상됨 |
| 공고 URL | 상세보기 링크 | https://www.nipa.kr/board/boardView.it |
| 비고 | 추가 메모 | [사업 개요] ... |

---

## Google Calendar 이벤트 구조

### 이벤트 제목
```
📌 {공고명}
```

### 이벤트 설명
```
🎯 정부지원사업 마감일 알림

📊 적합도: 10/10점 (강력추천)
🔴 우선순위: HIGH

🏢 기관: NIPA (정보통신산업진흥원)
📁 카테고리: AI/SW
👥 대상: AI 기반 서비스 개발 스타트업
💰 예상 지원금: 최대 5천만원

✅ 매칭 이유:
  • AI 기술 활용 분야로 우리 사업과 완벽히 일치
  • 위치기반 서비스(LBS) 분야가 핵심 지원 분야
  • 관광/여행 분야 적용으로 우리 서비스와 정확히 일치

💡 준비 팁:
  • AI 기반 경로 추천 알고리즘의 차별성을 명확히 제시
  • MVP 개발 현황과 베타 테스트 계획 구체화
  • 관광 산업 기여도 및 사회적 가치 강조

🔗 공고 상세보기: https://www.nipa.kr/board/boardView.it
```

### 리마인더 설정
- **HIGH 우선순위**: 14일 전, 7일 전, 3일 전, 1일 전
- **MEDIUM 우선순위**: 7일 전, 3일 전, 1일 전
- **LOW 우선순위**: 7일 전, 1일 전

### 색상 코딩
- 🔴 **HIGH**: 빨간색 (긴급)
- 🟡 **MEDIUM**: 노란색 (주의)
- 🟢 **LOW**: 초록색 (여유)

---

## 고급 설정

### 프로그래밍 방식으로 사용

```typescript
import {
  GoogleServicesManager,
  createGoogleServicesConfigFromEnv,
} from './src/services/google/index.js';

// 환경변수에서 설정 로드
const config = createGoogleServicesConfigFromEnv();
const googleManager = new GoogleServicesManager(config);

// 연결 테스트
const results = await googleManager.testConnections();
console.log('Google Sheets:', results.sheets ? '✅' : '❌');
console.log('Google Calendar:', results.calendar ? '✅' : '❌');

// 전체 동기화
await googleManager.syncPrograms(analyzedPrograms);

// 긴급 공고만 동기화 (HIGH 우선순위)
await googleManager.syncUrgentPrograms(analyzedPrograms);

// 특정 점수 이상만 동기화
await googleManager.syncByScore(analyzedPrograms, 8);

// Sheets만 동기화
await googleManager.syncToSheetsOnly(analyzedPrograms);

// Calendar만 동기화
await googleManager.syncToCalendarOnly(analyzedPrograms);
```

### 커스텀 필터링

```typescript
// HIGH 우선순위 + 강력추천만 동기화
const urgentPrograms = analyzedPrograms.filter(
  (p) => p.analysis.priority === 'HIGH' &&
         p.analysis.recommendation === '강력추천'
);

await googleManager.syncPrograms(urgentPrograms);
```

### Sheets만 사용 / Calendar만 사용

```env
# Sheets만 활성화
GOOGLE_SHEETS_ENABLED=true
GOOGLE_CALENDAR_ENABLED=false

# 또는 Calendar만 활성화
GOOGLE_SHEETS_ENABLED=false
GOOGLE_CALENDAR_ENABLED=true
```

---

## 문제 해결

### Google Sheets 동기화 실패

**문제:** `Error: The caller does not have permission`
**해결:**
- OAuth Playground에서 Refresh Token 생성 시 `spreadsheets` scope를 포함했는지 확인
- 스프레드시트를 생성한 계정과 OAuth 인증 계정이 동일한지 확인

**문제:** `Error: Unable to parse range: 공고목록`
**해결:**
- 자동으로 시트가 생성됩니다 (최초 1회)
- 수동으로 시트를 생성했다면 이름이 "공고목록"인지 확인

### Google Calendar 동기화 실패

**문제:** `Error: Calendar not found`
**해결:**
- `GOOGLE_CALENDAR_ID`가 `primary`로 설정되어 있는지 확인
- 또는 특정 캘린더 ID를 사용하려면 Google Calendar 설정에서 캘린더 ID 확인

**문제:** `Error: Insufficient Permission`
**해결:**
- OAuth Playground에서 Refresh Token 생성 시 `calendar` scope를 포함했는지 확인
- API 활성화 확인: Google Calendar API가 활성화되어 있는지 확인

### 중복 데이터 문제

**문제:** 같은 공고가 여러 번 추가됨
**해결:**
- `syncPrograms()` 대신 `syncNewProgramsOnly()`를 사용하면 자동으로 중복 체크됩니다
- Google Sheets: 공고ID 기준 중복 체크
- Google Calendar: 제목과 날짜 기준 중복 체크

---

## API 참고

### GoogleServicesManager

#### `syncPrograms(programs: AnalyzedProgram[]): Promise<void>`
적합도 점수가 임계값 이상인 공고를 Sheets와 Calendar에 동기화

#### `syncUrgentPrograms(programs: AnalyzedProgram[]): Promise<void>`
HIGH 우선순위 공고만 즉시 동기화

#### `syncByScore(programs: AnalyzedProgram[], minScore: number): Promise<void>`
특정 점수 이상 공고만 동기화

#### `testConnections(): Promise<{ sheets: boolean; calendar: boolean }>`
Google Sheets 및 Calendar 연결 테스트

#### `syncToSheetsOnly(programs: AnalyzedProgram[]): Promise<void>`
Google Sheets에만 동기화

#### `syncToCalendarOnly(programs: AnalyzedProgram[]): Promise<void>`
Google Calendar에만 동기화

---

## 스케줄러 통합

Google Services는 스케줄러와 함께 사용할 수 있습니다:

```env
# 매일 오전 8시에 자동 실행
SCHEDULER_CRON=0 8 * * *
SCHEDULER_TIMEZONE=Asia/Seoul
```

스케줄러가 다음을 자동으로 수행합니다:
1. 공고 수집 (collect)
2. AI 분석 (analyze)
3. Slack/Email 알림 (notify)
4. Google Sheets/Calendar 동기화 (google)

---

## 보안 주의사항

⚠️ **중요:**
- `.env` 파일을 절대 Git에 커밋하지 마세요
- `.env.example`을 참고하여 개인 `.env` 파일을 생성하세요
- OAuth 클라이언트 보안 비밀과 Refresh Token은 안전하게 보관하세요
- Refresh Token은 장기간 유효하므로 유출되지 않도록 주의하세요

---

## 추가 기능 (향후 개발 예정)

- [ ] Google Drive에 사업계획서 자동 저장
- [ ] Google Docs로 사업계획서 자동 생성
- [ ] Google Forms로 공고 신청서 자동 작성
- [ ] Gmail을 통한 공고 알림 메일 자동 전송
- [ ] Google Analytics 연동 (지원사업 신청 성공률 분석)

---

## 문의

Google Services 연동 관련 문의사항은 GitHub Issues로 등록해주세요.

**프로젝트:** Hyein Agent - 정부지원사업 자동화 시스템
**작성일:** 2025-12-10

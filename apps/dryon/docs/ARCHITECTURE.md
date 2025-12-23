# 시스템 아키텍처

## 개요

Hyein Agent는 정부지원사업 공고를 자동으로 수집, 분석하고 사업계획서를 생성하는 AI 기반 자동화 시스템입니다.

## 시스템 플로우

```
┌─────────────────┐
│  Scheduler      │  매일 오전 8시 자동 실행
│  (node-cron)    │
└────────┬────────┘
         │
         v
┌─────────────────────────────────────────┐
│         Collectors (공고 수집)            │
├─────────────────────────────────────────┤
│  • BizinfoCollector                     │
│    └─ 기업마당 API                       │
│  • KStartupCollector                    │
│    └─ K-Startup API                     │
│  • (확장 가능한 구조)                     │
└────────┬────────────────────────────────┘
         │
         v (Announcement[])
┌─────────────────────────────────────────┐
│      Analyzer (AI 분석 엔진)             │
├─────────────────────────────────────────┤
│  • ClaudeAgent                          │
│    └─ Claude Sonnet 4.5 API            │
│  • 적합도 점수 (1-10)                    │
│  • 평가기준 파싱                         │
│  • 핵심 키워드 추출                      │
│  • 추천 전략 생성                        │
└────────┬────────────────────────────────┘
         │
         v (AnalysisResult[])
┌─────────────────────────────────────────┐
│    Integrations (외부 서비스 연동)       │
├─────────────────────────────────────────┤
│  • GoogleSheetsIntegration              │
│    └─ 분석 결과 자동 저장                │
│  • GoogleCalendarIntegration            │
│    └─ 마감일 자동 등록                   │
│  • SlackNotifier                        │
│    └─ 적합 공고 실시간 알림              │
└─────────────────────────────────────────┘
```

## 디렉토리 구조

```
hyein-agent/
├── src/
│   ├── agents/              # AI 에이전트
│   │   └── claude-agent.ts  # Claude API 래퍼
│   │
│   ├── services/            # 비즈니스 로직
│   │   ├── collectors/      # 공고 수집기
│   │   │   ├── index.ts
│   │   │   ├── bizinfo-collector.ts
│   │   │   └── kstartup-collector.ts
│   │   │
│   │   ├── integrations/    # 외부 서비스 연동
│   │   │   ├── google-sheets.ts
│   │   │   ├── google-calendar.ts
│   │   │   └── slack-notifier.ts
│   │   │
│   │   └── analyzer.ts      # 분석 엔진
│   │
│   ├── config/              # 설정 관리
│   │   └── index.ts
│   │
│   ├── types/               # TypeScript 타입 정의
│   │   └── index.ts
│   │
│   ├── utils/               # 유틸리티
│   │   └── logger.ts        # Winston 로거
│   │
│   ├── scheduler.ts         # Cron 스케줄러
│   └── index.ts             # 메인 엔트리 포인트
│
├── tests/                   # 테스트
│   ├── agents/
│   ├── services/
│   └── ...
│
├── docs/                    # 문서
│   ├── API.md
│   ├── ARCHITECTURE.md
│   └── DEPLOYMENT.md
│
├── .github/                 # GitHub 설정
│   ├── workflows/
│   │   ├── ci.yml
│   │   └── deploy.yml
│   └── ISSUE_TEMPLATE/
│
└── ...
```

## 레이어 아키텍처

### 1. Presentation Layer (표현 계층)

**책임:** 스케줄링 및 워크플로우 관리

- `scheduler.ts`: Cron 작업 스케줄링
- `index.ts`: 메인 워크플로우 오케스트레이션

### 2. Service Layer (서비스 계층)

**책임:** 비즈니스 로직 처리

#### Collectors (수집기)

- **역할:** 외부 API에서 공고 데이터 수집
- **구현:**
  - `BizinfoCollector`: 기업마당 API
  - `KStartupCollector`: K-Startup API
- **특징:**
  - 공통 인터페이스 구현 (확장 용이)
  - 키워드 필터링
  - 에러 핸들링 및 재시도 로직

#### Analyzer (분석기)

- **역할:** 공고 적합도 분석
- **구현:** `analyzer.ts`
- **특징:**
  - Claude AI 기반 분석
  - 배치 처리 지원
  - Rate limiting

#### Integrations (통합)

- **역할:** 외부 서비스 연동
- **구현:**
  - `google-sheets.ts`: 결과 저장
  - `google-calendar.ts`: 일정 등록
  - `slack-notifier.ts`: 알림 전송

### 3. Agent Layer (에이전트 계층)

**책임:** AI 에이전트 관리

- `claude-agent.ts`: Claude API 래퍼
  - 적합도 분석
  - 사업계획서 생성
  - 프롬프트 엔지니어링

### 4. Infrastructure Layer (인프라 계층)

**책임:** 설정, 로깅, 유틸리티

- `config/`: 환경 변수 관리
- `utils/logger.ts`: Winston 로깅
- `types/`: TypeScript 타입 정의

## 데이터 플로우

### 1. 공고 수집

```typescript
// 1. Collectors가 API 호출
const bizinfoAnnouncements = await bizinfoCollector.collect(keywords);
const kstartupAnnouncements = await kstartupCollector.collect(keywords);

// 2. 결과 병합 및 중복 제거
const allAnnouncements = [...bizinfoAnnouncements, ...kstartupAnnouncements];
const uniqueAnnouncements = removeDuplicates(allAnnouncements);
```

### 2. AI 분석

```typescript
// 1. 각 공고를 Claude AI로 분석
const analyses = await analyzer.batchAnalyze(uniqueAnnouncements);

// 2. 적합도 점수로 필터링
const highScoreItems = analyses.filter(a => a.score >= 7);
```

### 3. 결과 저장 및 알림

```typescript
// 병렬로 외부 서비스 호출
await Promise.all([
  googleSheets.saveResults(announcements, analyses),
  googleCalendar.createEvents(highScoreItems),
  slackNotifier.sendNotification(highScoreItems)
]);
```

## 핵심 컴포넌트 상세

### ClaudeAgent

**목적:** Claude API와의 상호작용 추상화

**주요 기능:**
1. `analyzeAnnouncement()`: 공고 적합도 분석
2. `generateBusinessPlan()`: 사업계획서 생성

**프롬프트 구조:**
```typescript
{
  system: "당신은 정부지원사업 전문가입니다...",
  messages: [
    {
      role: "user",
      content: `
        다음 공고를 분석해주세요:
        제목: ${announcement.title}
        설명: ${announcement.description}

        우리 서비스 정보:
        - 이름: ZZIK
        - 분야: AI/SW, LBS
        - 단계: 예비창업자

        JSON 형식으로 응답:
        {
          "score": 1-10,
          "reasoning": "...",
          "keywords": [...],
          "evaluationCriteria": [...],
          "strategy": "..."
        }
      `
    }
  ]
}
```

### Analyzer

**목적:** 여러 공고를 효율적으로 분석

**주요 기능:**
1. `analyze()`: 단일 분석
2. `batchAnalyze()`: 배치 분석 (p-queue 사용)

**병렬 처리:**
```typescript
const queue = new PQueue({ concurrency: 5 });
const results = await Promise.all(
  announcements.map(a => queue.add(() => this.analyze(a)))
);
```

### Collectors

**목적:** 다양한 소스에서 공고 수집

**공통 인터페이스:**
```typescript
interface Collector {
  collect(keywords?: string[]): Promise<Announcement[]>;
}
```

**확장 방법:**
```typescript
class NewSourceCollector implements Collector {
  async collect(keywords?: string[]): Promise<Announcement[]> {
    // 구현
  }
}
```

## 에러 핸들링

### 1. API 호출 실패

```typescript
// p-retry로 자동 재시도
import pRetry from 'p-retry';

const result = await pRetry(
  () => apiCall(),
  {
    retries: 3,
    onFailedAttempt: error => {
      logger.warn(`Attempt ${error.attemptNumber} failed`);
    }
  }
);
```

### 2. Rate Limiting

```typescript
// p-queue로 동시 요청 제한
const queue = new PQueue({
  concurrency: 5,
  intervalCap: 50,
  interval: 60000 // 1분
});
```

### 3. 로깅

```typescript
// Winston으로 계층별 로깅
logger.error('API call failed', { error, context });
logger.warn('Rate limit approaching');
logger.info('Analysis completed', { score, id });
logger.debug('Raw API response', { data });
```

## 보안

### 1. 환경 변수 관리

- `.env` 파일로 비밀 정보 관리
- Git에 커밋하지 않음 (.gitignore)
- 프로덕션에서는 Secrets Manager 사용

### 2. API 키 보호

- 환경 변수로만 접근
- 로그에 노출 방지
- 정기적인 키 로테이션

## 성능 최적화

### 1. 병렬 처리

- 공고 수집: 소스별 병렬
- AI 분석: p-queue로 제어된 병렬
- 외부 서비스: Promise.all

### 2. 캐싱 (선택사항)

```typescript
// Redis로 API 응답 캐싱
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

const result = await apiCall();
await redis.setex(cacheKey, 3600, JSON.stringify(result));
```

### 3. Rate Limiting

- Claude API: 분당 50회
- 공공 API: 분당 100회
- 동시 요청: 5개

## 확장성

### 새로운 Collector 추가

1. `src/services/collectors/`에 파일 생성
2. `Collector` 인터페이스 구현
3. `src/services/collectors/index.ts`에 export 추가
4. `src/index.ts`에서 사용

### 새로운 Integration 추가

1. `src/services/integrations/`에 파일 생성
2. 메서드 구현
3. `src/index.ts`의 워크플로우에 추가

## 모니터링

### 1. 로그 레벨

- `error`: 시스템 오류
- `warn`: 경고 (재시도, rate limit 등)
- `info`: 주요 이벤트
- `debug`: 상세 정보

### 2. Slack 알림

- 매일 분석 완료 알림
- 고득점 공고 실시간 알림
- 시스템 오류 알림

### 3. 메트릭

- 수집된 공고 수
- 분석 완료 수
- 평균 적합도 점수
- API 호출 횟수

## 테스트 전략

### 1. Unit Tests

- 각 Collector 테스트
- Analyzer 로직 테스트
- Agent 프롬프트 테스트

### 2. Integration Tests

- API 호출 테스트
- 워크플로우 전체 테스트

### 3. E2E Tests

- 실제 환경에서 전체 플로우 테스트

---

## 참고 자료

- [API 문서](API.md)
- [배포 가이드](DEPLOYMENT.md)
- [기여 가이드](../CONTRIBUTING.md)

# API 문서

## Claude Agent API

### ClaudeAgent

Claude API를 사용하여 공고를 분석하고 사업계획서를 생성하는 에이전트입니다.

#### Constructor

```typescript
const agent = new ClaudeAgent();
```

#### Methods

##### analyzeAnnouncement

공고의 적합도를 분석합니다.

```typescript
async analyzeAnnouncement(announcement: Announcement): Promise<AnalysisResult>
```

**Parameters:**
- `announcement`: 분석할 공고 정보

**Returns:**
```typescript
{
  score: number;           // 1-10점 적합도 점수
  reasoning: string;       // 점수 산정 이유
  keywords: string[];      // 핵심 키워드
  evaluationCriteria: string[]; // 평가 기준
  strategy: string;        // 추천 전략
}
```

**Example:**
```typescript
const result = await agent.analyzeAnnouncement({
  id: 'biz-001',
  title: '예비창업 패키지 지원사업',
  source: 'bizinfo',
  url: 'https://example.com',
  description: 'AI 기반 창업 지원',
  deadline: new Date('2025-12-31'),
  collectedAt: new Date()
});

console.log(result.score); // 8
```

##### generateBusinessPlan

사업계획서를 자동 생성합니다.

```typescript
async generateBusinessPlan(
  announcement: Announcement,
  analysis: AnalysisResult
): Promise<string>
```

**Parameters:**
- `announcement`: 공고 정보
- `analysis`: 분석 결과

**Returns:** 생성된 사업계획서 (Markdown 형식)

**Example:**
```typescript
const plan = await agent.generateBusinessPlan(announcement, analysis);
console.log(plan);
```

---

## Collectors API

### BizinfoCollector

기업마당(Bizinfo) 공고를 수집합니다.

#### Methods

##### collect

```typescript
async collect(keywords?: string[]): Promise<Announcement[]>
```

**Parameters:**
- `keywords` (optional): 필터링할 키워드 배열

**Returns:** 수집된 공고 배열

**Example:**
```typescript
const collector = new BizinfoCollector();
const announcements = await collector.collect(['창업', 'AI']);
```

### KStartupCollector

K-Startup 공고를 수집합니다.

#### Methods

##### collect

```typescript
async collect(keywords?: string[]): Promise<Announcement[]>
```

**Parameters:**
- `keywords` (optional): 필터링할 키워드 배열

**Returns:** 수집된 공고 배열

**Example:**
```typescript
const collector = new KStartupCollector();
const announcements = await collector.collect();
```

---

## Analyzer API

### Analyzer

여러 공고를 일괄 분석합니다.

#### Methods

##### analyze

단일 공고를 분석합니다.

```typescript
async analyze(announcement: Announcement): Promise<AnalysisResult>
```

##### batchAnalyze

여러 공고를 병렬로 분석합니다.

```typescript
async batchAnalyze(announcements: Announcement[]): Promise<AnalysisResult[]>
```

**Example:**
```typescript
const analyzer = new Analyzer();
const results = await analyzer.batchAnalyze(announcements);
```

---

## Integration APIs

### GoogleSheetsIntegration

Google Sheets에 분석 결과를 저장합니다.

#### Methods

##### saveResults

```typescript
async saveResults(
  announcements: Announcement[],
  analyses: AnalysisResult[]
): Promise<void>
```

**Example:**
```typescript
const sheets = new GoogleSheetsIntegration();
await sheets.saveResults(announcements, analyses);
```

### GoogleCalendarIntegration

Google Calendar에 마감일을 등록합니다.

#### Methods

##### createEvents

```typescript
async createEvents(announcements: Announcement[]): Promise<void>
```

**Example:**
```typescript
const calendar = new GoogleCalendarIntegration();
await calendar.createEvents(highScoreAnnouncements);
```

### SlackNotifier

Slack으로 알림을 전송합니다.

#### Methods

##### sendNotification

```typescript
async sendNotification(
  announcements: Announcement[],
  analyses: AnalysisResult[]
): Promise<void>
```

**Example:**
```typescript
const slack = new SlackNotifier();
await slack.sendNotification(announcements, analyses);
```

---

## Types

### Announcement

```typescript
interface Announcement {
  id: string;
  title: string;
  source: 'bizinfo' | 'k-startup';
  url: string;
  description?: string;
  deadline?: Date;
  agency?: string;
  budget?: string;
  targetAudience?: string;
  collectedAt: Date;
}
```

### AnalysisResult

```typescript
interface AnalysisResult {
  score: number;
  reasoning: string;
  keywords: string[];
  evaluationCriteria: string[];
  strategy: string;
}
```

---

## Environment Variables

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `ANTHROPIC_API_KEY` | Claude API 키 | `sk-ant-api03-xxxxx` |
| `BIZINFO_API_KEY` | 기업마당 API 키 | `your_key` |
| `KSTARTUP_API_KEY` | K-Startup API 키 | `your_key` |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `CLAUDE_MODEL` | Claude 모델 | `claude-sonnet-4-20250514` |
| `CLAUDE_MAX_TOKENS` | 최대 토큰 수 | `4096` |
| `MIN_SCORE_THRESHOLD` | 최소 점수 기준 | `7` |

---

## Error Handling

모든 API는 에러 발생시 명확한 메시지와 함께 예외를 throw합니다.

```typescript
try {
  const results = await analyzer.analyze(announcement);
} catch (error) {
  if (error instanceof ApiError) {
    console.error('API Error:', error.message);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

---

## Rate Limiting

API 호출은 자동으로 rate limit이 적용됩니다:

- Claude API: 분당 50회
- 공공 API: 분당 100회

Rate limit 초과시 자동으로 재시도합니다.

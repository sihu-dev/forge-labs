# 🤖 AI 분석 가이드

## 개요

이 가이드는 OpenAI GPT-4o를 사용하여 수집된 정부 및 민간 지원사업 공고를 자동으로 분석하는 방법을 설명합니다.

## 🎯 분석 항목

AI는 다음 항목을 자동으로 분석합니다:

### 1. **적합도 점수** (1-10점)
- 10점: 완벽하게 적합, 즉시 지원 권장
- 8-9점: 매우 적합, 우선 검토 권장
- 6-7점: 적합, 검토 가치 있음
- 4-5점: 부분 적합, 조건부 검토
- 1-3점: 부적합, 지원 비권장

### 2. **추천도**
- `강력추천`: 점수 8점 이상, 즉시 지원 준비
- `추천`: 점수 6-7점, 우선 검토
- `검토필요`: 점수 4-5점, 신중한 검토
- `부적합`: 점수 3점 이하, 지원 불필요

### 3. **우선순위**
- `HIGH`: 마감 임박 + 높은 적합도
- `MEDIUM`: 적합하지만 시간 여유 있음
- `LOW`: 참고용 또는 낮은 적합도

### 4. **매칭 이유** (matchReasons)
- 왜 이 공고가 적합한지 구체적인 이유
- 예: "AI/LBS 분야가 공고의 중점 지원 분야와 정확히 일치"

### 5. **우려사항** (concerns)
- 지원 시 주의해야 할 점
- 예: "마감일까지 2주밖에 남지 않음", "경쟁률이 높을 것으로 예상"

### 6. **핵심 평가기준** (keyEvaluationCriteria)
- 공고에서 중요하게 평가하는 항목
- 예: "기술 혁신성 (30%)", "팀 역량 (20%)"

### 7. **준비 팁** (preparationTips)
- 지원 시 준비해야 할 사항
- 예: "AI 모델의 차별성 강조 필요", "관광 데이터 활용 사례 준비"

### 8. **예상 지원금** (estimatedBudget)
- 공고에서 언급된 지원 규모
- 예: "최대 1억원", "5천만원 ~ 1.5억원"

## 🚀 사용 방법

### 1. 환경 설정

`.env` 파일에 OpenAI API 키 설정:

```env
OPENAI_API_KEY=sk-proj-your-api-key-here
```

OpenAI API 키는 [OpenAI Platform](https://platform.openai.com/api-keys)에서 발급받을 수 있습니다.

### 2. 사업 정보 설정

`config/my-business.json` 파일을 편집하여 본인의 사업 정보를 입력:

```json
{
  "serviceName": "내 서비스명",
  "item": "서비스 설명",
  "field": "사업 분야 (예: AI/LBS/관광테크)",
  "stage": "사업 단계 (예: 예비창업, 초기, 성장기)",
  "team": "팀 구성 (예: 2인 팀)",
  "techStack": "기술 스택 (예: Next.js, Python, AI/ML)",
  "additionalInfo": {
    "targetMarket": "목표 시장",
    "uniqueValue": "핵심 가치 제안",
    "currentProgress": "현재 진행 상황"
  }
}
```

### 3. 분석 실행

```bash
# 공고 수집 + AI 분석 한 번에
npm run collect:analyze

# 또는 단계별 실행
npm run collect:only  # 1. 공고 수집
npm run analyze       # 2. AI 분석
```

### 4. 결과 확인

분석 결과는 `data/analyzed-programs.json` 파일에 저장됩니다:

```json
{
  "analyzedAt": "2025-12-10T12:00:00.000Z",
  "totalCount": 5,
  "highPriority": 2,
  "recommended": 3,
  "programs": [
    {
      "id": "MOCK_001",
      "title": "2025년 초기창업패키지 지원사업",
      "organization": "중소벤처기업부",
      "category": "창업지원",
      "deadline": "2026-01-08T17:52:04.202Z",
      "analysis": {
        "score": 9,
        "recommendation": "강력추천",
        "priority": "HIGH",
        "matchReasons": [
          "초기 스타트업 대상으로 우리 단계와 정확히 일치",
          "AI/LBS 분야가 공고의 혁신기술 분야에 포함",
          "최대 1억원 지원으로 현재 자금 수요에 적합"
        ],
        "concerns": [
          "경쟁률이 높을 것으로 예상됨",
          "사업화 계획의 구체성이 중요한 평가 요소"
        ],
        "keyEvaluationCriteria": [
          "기술혁신성 (30점)",
          "사업성 (30점)",
          "팀역량 (20점)",
          "사회적 가치 (20점)"
        ],
        "preparationTips": [
          "AI 기반 경로 추천 알고리즘의 차별성 강조",
          "관광 산업 기여도 및 사회적 가치 부각",
          "팀의 기술 역량 및 경험 상세히 기술",
          "구체적인 사업화 계획 및 수익 모델 제시"
        ],
        "estimatedBudget": "최대 1억원 (1년)"
      },
      "analyzedAt": "2025-12-10T12:00:00.000Z"
    }
  ]
}
```

## 📊 분석 결과 활용

### 1. 우선순위별 필터링

```typescript
import { ProgramAnalyzer } from './src/services/ai/analyzer.js';

// 강력추천 + 추천만 필터링
const topPrograms = ProgramAnalyzer.filterAndSort(analyzedPrograms, {
  minScore: 6,
  recommendations: ['강력추천', '추천'],
});

// HIGH 우선순위만
const urgentPrograms = ProgramAnalyzer.filterAndSort(analyzedPrograms, {
  priorities: ['HIGH'],
});
```

### 2. 콘솔 요약 확인

분석 완료 후 자동으로 요약이 출력됩니다:

```
============================================================
📊 분석 결과 요약
============================================================

[추천도별 분포]
  🌟 강력추천: 2개
  ⭐ 추천: 1개
  🔍 검토필요: 2개
  ❌ 부적합: 0개

[우선순위별 분포]
  🔴 HIGH: 2개
  🟡 MEDIUM: 2개
  🟢 LOW: 1개

[TOP 3 추천 공고]

  1. 2025년 초기창업패키지 지원사업
     기관: 중소벤처기업부
     점수: 9/10 (강력추천)
     우선순위: HIGH
     매칭 이유: 초기 스타트업 대상으로 우리 단계와 정확히 일치
     마감일: 2026. 1. 8.

  2. AI 스타트업 육성 지원사업
     기관: NIPA (정보통신산업진흥원)
     점수: 8/10 (강력추천)
     우선순위: HIGH
     매칭 이유: AI 기반 서비스 개발이 공고의 핵심 지원 분야
     마감일: 2026. 1. 23.

============================================================
✅ 분석 완료! analyzed-programs.json 파일을 확인하세요.
============================================================
```

## 🔧 고급 설정

### Rate Limiting

OpenAI API는 분당 요청 제한이 있습니다:
- Free tier: 3 RPM (분당 요청)
- Paid tier: 더 높은 제한

분석 중 자동으로 1초 지연이 적용되어 Rate Limiting을 방지합니다.

### 모델 선택

기본적으로 `gpt-4o` 모델을 사용하지만, `src/services/ai/analyzer.ts`에서 변경 가능:

```typescript
const response = await this.openai.chat.completions.create({
  model: 'gpt-4o',  // 또는 'gpt-4', 'gpt-3.5-turbo'
  temperature: 0.3, // 0.0-1.0 (낮을수록 일관적)
  // ...
});
```

### Temperature 조정

- `0.0-0.3`: 일관적이고 정확한 분석 (권장)
- `0.4-0.7`: 균형잡힌 분석
- `0.8-1.0`: 창의적이지만 불안정한 분석

## 💡 분석 품질 향상 팁

### 1. 사업 정보 상세히 작성
- `additionalInfo`에 가능한 많은 정보 포함
- 경쟁 우위, 현재 진행 상황, 자금 수요 등

### 2. 기술 스택 구체적으로
- 단순히 "AI" 대신 "OpenAI GPT-4, TensorFlow, scikit-learn"
- 프레임워크 버전까지 명시하면 더 정확

### 3. 사업 단계 정확히
- "예비창업자" vs "법인 설립 3년 이내"
- 공고마다 요구사항이 다르므로 정확한 표현 중요

## 🐛 문제 해결

### OpenAI API 에러

```
Error: OpenAI API returned empty response
```
**해결**: API 키 확인, 크레딧 잔액 확인

### Rate Limit 초과

```
Error: Rate limit exceeded
```
**해결**: 분석 대상 공고 수 줄이기, 또는 유료 플랜 사용

### 분석 실패 시 기본값

AI 분석이 실패하면 자동으로 기본 분석 결과 반환:
```json
{
  "score": 5,
  "recommendation": "검토필요",
  "matchReasons": ["자동 분석 실패로 수동 검토가 필요합니다."],
  "priority": "MEDIUM"
}
```

## 📚 참고 자료

- [OpenAI API 문서](https://platform.openai.com/docs)
- [GPT-4o 모델 정보](https://platform.openai.com/docs/models/gpt-4o)
- [Rate Limits](https://platform.openai.com/docs/guides/rate-limits)

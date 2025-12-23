# 🤖 Claude Code 분석 프롬프트

## 사용법

1. `npm run collect:only` 실행하여 공고 수집
2. 아래 프롬프트를 Claude Code에 붙여넣기
3. 결과를 `analyzed-programs.json`으로 저장 요청

---

## 📋 분석 프롬프트

```
data/collected-programs.json 파일을 읽고 분석해줘.

[내 사업 정보]
- 서비스명: ZZIK / zzikmap
- 아이템: GPS 기반 위치 인증 플랫폼 / 인터랙티브 여행 경로 지도
- 분야: AI/SW, 위치기반서비스(LBS), 관광테크
- 창업단계: 예비창업자
- 팀 구성: 1인
- 기술스택: Next.js, Supabase, Mapbox, Gemini Vision API

[분석 요청]
각 공고에 대해 다음 형식으로 JSON 분석 결과를 만들어줘:

{
  "analyzedAt": "ISO timestamp",
  "results": [
    {
      "programId": "공고 ID",
      "title": "공고 제목",
      "score": 1-10 (적합도 점수),
      "recommendation": "강력추천" | "추천" | "검토필요" | "부적합",
      "priority": "HIGH" | "MEDIUM" | "LOW",
      "matchReasons": ["적합한 이유 1", "적합한 이유 2", ...],
      "concerns": ["우려사항 1", "우려사항 2", ...],
      "keyEvaluationCriteria": ["평가기준 1", "평가기준 2", ...],
      "preparationTips": ["준비팁 1", "준비팁 2", ...],
      "estimatedBudget": "예상 지원금액",
      "applicationStrategy": "신청 전략 요약"
    },
    ...
  ]
}

분석 결과를 data/analyzed-programs.json 파일로 저장해줘.
```

---

## 🎯 고급 분석 프롬프트 (Chain of Thought)

```
data/collected-programs.json을 읽고 단계별 심층 분석을 해줘.

[1단계: 초기 필터링]
- 키워드 매칭 (AI, SW, 관광, 위치기반, 예비창업)
- 대상 요건 확인
- 마감일 체크

[2단계: 적합도 분석]
각 공고를 다음 관점에서 분석:
1. 기술 적합성 (LBS, AI, Next.js와의 연관성)
2. 사업 단계 적합성 (예비창업자 지원 여부)
3. 지원금액 대비 효과
4. 경쟁 강도 예측
5. 준비 난이도

[3단계: 우선순위 결정]
- 마감일 임박도
- 지원금액
- 합격 가능성
- 전략적 가치

[4단계: 실행 계획]
각 추천 공고별 구체적 준비 항목과 타임라인 제시

결과를 data/analyzed-programs-detailed.json으로 저장해줘.
```

---

## 💡 실시간 모니터링 프롬프트

```
data/analyzed-programs.json을 읽고 실시간 대시보드 요약을 만들어줘:

📊 오늘의 현황
- 신규 공고: X건
- 강력추천: X건
- 마감 임박 (7일 이내): X건

🔥 긴급 처리 필요
[마감일 순으로 정렬된 상위 3건]

💎 최고 추천 공고
[점수 순 상위 3건, 이유 포함]

⚠️ 주의사항
[전체적인 트렌드와 준비 포인트]

이 요약을 data/dashboard-summary.md 파일로 저장해줘.
```

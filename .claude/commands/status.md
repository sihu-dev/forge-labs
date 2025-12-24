# FORGE LABS 상태 확인
# 사용법: /status 또는 ㅅ

## 실행 시 출력

다음 정보를 간결하게 보고:

### 1. 전체 요약
```markdown
## FORGE LABS 상태

📊 전체 진행률: 70%
🔥 HEPHAITOS: 80% | 🎯 BIDFLOW: 60%
📦 공유 패키지: 7/7 완료
🔄 마지막 커밋: {시간} 전
```

### 2. HEPHAITOS 상태
```markdown
### HEPHAITOS (트레이딩 교육)
진행률: ████████░░ 80%

✅ 완료:
- 타입 시스템 (8개)
- 유틸리티 (backtest-calc 등)
- 코어 서비스 (ExchangeService)
- UI 컴포넌트 (30개)

🔄 진행중:
- No-Code 빌더

⏳ 대기:
- 백테스트 엔진 연결
- 실계좌 연동
```

### 3. BIDFLOW 상태
```markdown
### BIDFLOW (입찰 자동화)
진행률: ██████░░░░ 60%

✅ 완료:
- 자동화 대시보드
- 리드/캠페인/워크플로우 UI
- CRM 패키지
- Integrations 패키지

🔄 진행중:
- API 연결

⏳ 대기:
- n8n 워크플로우 배포
- 입찰 크롤러
```

### 4. 다음 액션
```markdown
## 다음 액션

추천: `ㅎ 빌더` (HEPHAITOS No-Code 빌더 완성)

명령어:
- ㅎ {영역} → HEPHAITOS 작업
- ㅂ {영역} → BIDFLOW 작업
- ㄱ → 자동 다음 태스크
- ㅋ → 커밋 & 푸시
```

## 확인 항목

1. `git status` - 변경사항 확인
2. `apps/` - 앱별 파일 수
3. `packages/` - 패키지 상태
4. 마지막 커밋 시간

## 출력 형식

모바일에서 읽기 쉽게:
- 이모지 최소화 (핵심만)
- 진행바 시각화
- 한글 간결하게
- 다음 액션 명확하게

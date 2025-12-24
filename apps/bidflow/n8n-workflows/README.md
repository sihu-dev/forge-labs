# BIDFLOW n8n 워크플로우

## 설치 및 설정

### 1. n8n 설치 (Docker)
```bash
docker run -d \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

### 2. 환경변수 설정
n8n 설정에서 다음 환경변수 추가:
```
G2B_API_KEY=your_g2b_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
ANTHROPIC_API_KEY=your_anthropic_api_key (옵션)
```

### 3. 워크플로우 가져오기
1. n8n 대시보드 접속: http://localhost:5678
2. Settings → Import from File
3. `01-lead-generation-pipeline.json` 선택
4. Activate 클릭

## 워크플로우 목록

### 01. Lead Generation Pipeline
- **트리거**: 매 1시간
- **기능**: 나라장터 입찰 공고 수집 → 필터링 → Supabase 저장
- **키워드**: 유량계, 초음파, 전자식, 열량계
- **최소 예산**: 5,000만원

### 파이프라인 흐름
```
Schedule Trigger (1h)
    ↓
Fetch G2B Bids (공공데이터포털 API)
    ↓
Parse and Filter (JS 코드)
    ↓
Upsert to Supabase (leads 테이블)
    ↓
AI Score Enrichment (Claude API) [옵션]
    ↓
Slack Notification [옵션]
```

## API 키 발급

### G2B (공공데이터포털)
1. https://www.data.go.kr 접속
2. 회원가입 후 로그인
3. "나라장터 입찰정보" API 검색
4. 활용신청 → 인증키 발급

### Supabase
1. 프로젝트 대시보드 → Settings → API
2. `anon` public key 복사

## 커스터마이징

### 키워드 변경
`Parse and Filter Bids` 노드에서:
```javascript
const keywords = ['유량계', '초음파', '전자식', '열량계'];
```

### 최소 예산 변경
```javascript
const minBudget = 50000000; // 50M KRW → 원하는 금액으로 변경
```

### 스케줄 변경
`Schedule Trigger` 노드에서 간격 조정

# BIDFLOW - 세일즈 자동화 시스템

> **Claude Max 20x 기반 완전 자동화 세일즈/마케팅 파이프라인**

입찰 공고를 자동으로 분석하고, 이메일을 생성하여 발송하는 AI 기반 세일즈 자동화 시스템입니다.

---

## 🚀 빠른 시작

### 1. 환경 변수 설정
\`\`\`bash
cp .env.example .env.local
\`\`\`

### 2. 데이터베이스 마이그레이션
\`\`\`bash
npx supabase link --project-ref your-project-id
npx supabase db push
\`\`\`

### 3. 개발 서버 실행
\`\`\`bash
pnpm dev
\`\`\`

자세한 내용: [DEPLOYMENT_QUICKSTART.md](./DEPLOYMENT_QUICKSTART.md)

---

## 🗄️ 데이터베이스 스키마 (7개 테이블)

| 테이블 | 설명 |
|--------|------|
| **bids** | 입찰 공고 정보 |
| **bid_scores** | Enhanced Matcher 결과 |
| **emails** | 이메일 발송/추적 |
| **approvals** | 승인 플로우 |
| **ab_tests** | A/B 테스트 |
| **performance_metrics** | 성능 메트릭 |
| **system_logs** | 시스템 로그 |

---

## 📈 예상 성과 (3개월)

- **월 수익**: 400만원
- **처리 건수**: 월 1,000건 분석 → 80건 승인 → 10건 계약
- **Prompt Caching**: 90% 비용 절감
- **ROI**: 238% (12개월)

---

**Made with Claude Sonnet 4.5 via Claude Code**

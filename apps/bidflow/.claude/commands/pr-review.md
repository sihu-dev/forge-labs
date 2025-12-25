# GitHub PR 리뷰 자동화

> **용도**: Chrome Claude에서 GitHub PR 페이지 열었을 때 자동 리뷰
> **호출**: `/pr-review [PR번호]` 또는 PR 페이지에서 자동 트리거

---

## PR 리뷰 체크리스트

### 1. 코드 품질 (30점)

- [ ] **타입 안전성** (10점)
  - TypeScript strict mode 준수
  - `any` 타입 최소화
  - 적절한 타입 정의

- [ ] **코드 스타일** (10점)
  - ESLint 규칙 준수
  - Prettier 포맷팅
  - 일관된 네이밍 컨벤션

- [ ] **코드 구조** (10점)
  - 단일 책임 원칙
  - DRY 원칙
  - 적절한 추상화 수준

### 2. 보안 (25점)

- [ ] **인증/인가** (10점)
  - API 엔드포인트 보호
  - 적절한 권한 검사
  - JWT/세션 처리

- [ ] **입력 검증** (10점)
  - Zod 스키마 검증
  - SQL Injection 방지
  - XSS 방지

- [ ] **민감 정보** (5점)
  - API 키 노출 여부
  - .env 파일 커밋 여부
  - 로깅에 민감 정보 포함 여부

### 3. 성능 (20점)

- [ ] **번들 크기** (5점)
  - 불필요한 의존성
  - Tree shaking 가능 여부

- [ ] **렌더링 최적화** (10점)
  - 불필요한 리렌더링
  - useMemo/useCallback 적절한 사용
  - 이미지 최적화

- [ ] **데이터 페칭** (5점)
  - 캐싱 전략
  - 중복 요청 방지
  - 적절한 페이지네이션

### 4. 테스트 (15점)

- [ ] **테스트 커버리지** (10점)
  - 새 기능에 대한 테스트
  - 엣지 케이스 커버
  - 통합 테스트

- [ ] **테스트 품질** (5점)
  - 명확한 테스트 설명
  - 독립적인 테스트
  - 모킹 적절성

### 5. 문서화 (10점)

- [ ] **코드 주석** (5점)
  - 복잡한 로직 설명
  - JSDoc 사용

- [ ] **변경 사항 문서** (5점)
  - PR 설명 충분
  - CHANGELOG 업데이트

---

## Chrome Claude PR 리뷰 워크플로우

### Step 1: PR 정보 수집

Chrome Claude가 GitHub PR 페이지에서 수집할 정보:

```markdown
## PR 정보

**PR 번호**: #123
**제목**: feat: 입찰 알림 기능 추가
**작성자**: @developer
**브랜치**: feat/bid-notifications → main

**변경 파일 수**: 12
**추가된 라인**: +450
**삭제된 라인**: -120

**라벨**: enhancement, frontend
**리뷰어**: @reviewer1, @reviewer2
```

### Step 2: 변경 파일 분석

```markdown
## 변경 파일 목록

### 신규 파일
- `src/components/notifications/NotificationBell.tsx`
- `src/hooks/useNotifications.ts`
- `src/app/api/notifications/route.ts`

### 수정 파일
- `src/components/layout/Header.tsx` (+15, -2)
- `src/lib/supabase/types.ts` (+45, -0)

### 삭제 파일
- 없음
```

### Step 3: 리뷰 생성

```markdown
## 🔍 PR 리뷰 결과

### 총점: 85/100

### 상세 점수
| 카테고리 | 점수 | 이슈 |
|----------|------|------|
| 코드 품질 | 28/30 | 일부 any 타입 사용 |
| 보안 | 25/25 | ✅ 이슈 없음 |
| 성능 | 18/20 | 리렌더링 최적화 필요 |
| 테스트 | 10/15 | 테스트 커버리지 부족 |
| 문서화 | 4/10 | JSDoc 미작성 |

### 🔴 필수 수정 사항
1. `NotificationBell.tsx:45` - 무한 리렌더링 위험
   ```typescript
   // Before
   useEffect(() => {
     fetchNotifications();
   }); // 의존성 배열 누락

   // After
   useEffect(() => {
     fetchNotifications();
   }, []); // 빈 배열 추가
   ```

### 🟡 권장 수정 사항
1. `useNotifications.ts:23` - useMemo 사용 권장
2. 테스트 파일 추가 필요

### 🟢 Good Points
- 컴포넌트 분리 잘됨
- API 엔드포인트 보안 적절
- 타입 정의 명확
```

---

## Claude Code 연동

### PR 리뷰 후 자동 수정

Chrome Claude 리뷰 결과를 Claude Code에 전달:

```bash
# Claude Code에서 실행
/fix-pr 123  # PR #123의 리뷰 이슈 자동 수정
```

### 수정 후 재리뷰

```bash
# 수정 커밋 후
git add .
git commit -m "fix: PR 리뷰 피드백 반영"
git push

# Chrome Claude에서 재리뷰 트리거
/pr-review 123 --re-review
```

---

## 자동화 스크립트

### PR 체크 스크립트

```bash
#!/bin/bash
# scripts/pr-check.sh

echo "🔍 PR 사전 검사 시작..."

# TypeScript 체크
echo "1. TypeScript 검사..."
pnpm typecheck

# ESLint 검사
echo "2. ESLint 검사..."
pnpm lint

# 테스트 실행
echo "3. 테스트 실행..."
pnpm test --run

# 빌드 테스트
echo "4. 빌드 테스트..."
pnpm build

echo "✅ 모든 검사 통과!"
```

---

## PR 리뷰 템플릿

Chrome Claude가 생성할 GitHub 리뷰 코멘트:

```markdown
## 🤖 자동 리뷰 결과

### 요약
- **총점**: 85/100
- **상태**: Approved with suggestions

### 체크리스트
- [x] TypeScript 컴파일 성공
- [x] ESLint 검사 통과
- [x] 보안 이슈 없음
- [ ] 테스트 커버리지 80% 이상
- [ ] 성능 최적화 필요

### 상세 피드백
[리뷰 내용...]

---
*이 리뷰는 Chrome Claude + Claude Code에 의해 자동 생성되었습니다.*
```

---

## GitHub Actions 연동

```yaml
# .github/workflows/pr-review.yml
name: Auto PR Review
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run checks
        run: |
          pnpm install
          pnpm typecheck
          pnpm lint
          pnpm test --run

      - name: Generate review
        run: pnpm run generate-pr-review

      - name: Post comment
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const review = fs.readFileSync('pr-review.md', 'utf8');
            github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              body: review
            });
```

---

*마지막 업데이트: 2025-12-25*

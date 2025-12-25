# 브라우저 테스트 자동화

> **용도**: Chrome Claude와 연동한 브라우저 테스트 자동화
> **호출**: `/browser-test [테스트유형] [대상]`

---

## 테스트 유형

### 1. Visual Regression (시각적 회귀 테스트)
```bash
# Playwright 스크린샷 비교
npx playwright test --update-snapshots
```

### 2. E2E 테스트
```bash
# 전체 E2E 실행
pnpm test:e2e

# 특정 테스트만 실행
pnpm test:e2e -- --grep "login"
```

### 3. 접근성 테스트
```bash
# axe-core 기반 접근성 검사
pnpm test:a11y
```

### 4. 성능 테스트
```bash
# Lighthouse CI
pnpm lighthouse
```

---

## Chrome Claude 연동 테스트

### 수동 테스트 체크리스트

Chrome Claude가 브라우저에서 직접 확인할 항목:

#### 페이지별 체크리스트

**대시보드 (/dashboard)**
- [ ] 로딩 상태 표시
- [ ] 통계 카드 렌더링
- [ ] 차트 데이터 로드
- [ ] 반응형 레이아웃 (모바일/태블릿/데스크톱)

**입찰 목록 (/dashboard/bids)**
- [ ] 테이블 렌더링
- [ ] 페이지네이션 동작
- [ ] 필터/정렬 기능
- [ ] 검색 기능

**리드 관리 (/dashboard/leads)**
- [ ] 리드 목록 표시
- [ ] 리드 상세 모달
- [ ] CRM 동기화 상태
- [ ] 스코어 표시

---

## 테스트 시나리오

### 시나리오 1: 사용자 인증 플로우

```gherkin
Feature: 사용자 인증
  Scenario: 로그인 성공
    Given 사용자가 로그인 페이지에 있음
    When 유효한 이메일/비밀번호 입력
    Then 대시보드로 리다이렉트

  Scenario: 로그인 실패
    Given 사용자가 로그인 페이지에 있음
    When 잘못된 비밀번호 입력
    Then 에러 메시지 표시
```

### 시나리오 2: 입찰 검색

```gherkin
Feature: 입찰 검색
  Scenario: 키워드 검색
    Given 사용자가 입찰 목록 페이지에 있음
    When "유량계" 키워드 입력
    Then 관련 입찰 목록 필터링

  Scenario: 필터 조합
    Given 사용자가 입찰 목록 페이지에 있음
    When 상태=진행중, 금액>1억 필터 적용
    Then 조건에 맞는 입찰만 표시
```

---

## Playwright 테스트 구조

```
tests/
├── e2e/
│   ├── auth/
│   │   ├── login.spec.ts
│   │   └── logout.spec.ts
│   ├── bids/
│   │   ├── list.spec.ts
│   │   ├── detail.spec.ts
│   │   └── search.spec.ts
│   └── leads/
│       ├── crud.spec.ts
│       └── crm-sync.spec.ts
├── visual/
│   ├── dashboard.spec.ts
│   └── components.spec.ts
└── a11y/
    └── accessibility.spec.ts
```

---

## 테스트 명령어

### 개발 중 테스트
```bash
# 특정 파일 테스트 (watch 모드)
pnpm test -- --watch src/components/Button.test.tsx

# UI 테스트 (Storybook)
pnpm storybook
```

### CI/CD 테스트
```bash
# 전체 테스트 스위트
pnpm test:ci

# 커버리지 리포트
pnpm test:coverage
```

---

## Chrome Claude 테스트 리포트 형식

Chrome Claude가 수동 테스트 후 작성할 리포트:

```markdown
## 🧪 브라우저 테스트 리포트

### 테스트 일시: YYYY-MM-DD HH:MM
### 테스트 환경: Chrome XX.X / macOS XX.X

### 테스트 결과 요약
| 항목 | 결과 | 비고 |
|------|------|------|
| 대시보드 로딩 | ✅ Pass | 2.1초 |
| 입찰 목록 | ⚠️ Warning | 스크롤 시 깜빡임 |
| 리드 상세 | ✅ Pass | - |
| 모바일 반응형 | ❌ Fail | 네비게이션 겹침 |

### 발견된 이슈
1. **[Critical]** 모바일에서 네비게이션 메뉴 겹침
   - 재현: iPhone 12 뷰포트
   - 스크린샷: [첨부]

2. **[Minor]** 테이블 스크롤 시 헤더 깜빡임
   - 재현: 100개 이상 행에서 빠른 스크롤

### Claude Code 수정 요청
- [ ] 모바일 네비게이션 z-index 수정
- [ ] 테이블 virtualization 검토
```

---

## 자동화 워크플로우

### GitHub Actions 연동

```yaml
# .github/workflows/browser-test.yml
name: Browser Tests
on:
  pull_request:
    branches: [main]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install dependencies
        run: pnpm install
      - name: Run E2E tests
        run: pnpm test:e2e
      - name: Upload screenshots
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
```

---

*마지막 업데이트: 2025-12-25*

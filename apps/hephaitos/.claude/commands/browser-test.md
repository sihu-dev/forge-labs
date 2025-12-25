# HEPHAITOS 브라우저 테스트 가이드

## 테스트 유형

### 1. 스모크 테스트 (빠른 확인)
```
체크리스트:
- [ ] 홈페이지 로딩
- [ ] 대시보드 접근
- [ ] 전략 빌더 렌더링
- [ ] 인증 페이지 표시
```

### 2. 기능 테스트

#### 전략 빌더
```
테스트 시나리오:
1. /dashboard/strategy-builder 접속
2. 블록 팔레트 확인
3. 블록 드래그 테스트
4. 연결선 생성 테스트
5. 저장 버튼 동작
```

#### 대시보드
```
테스트 시나리오:
1. /dashboard 접속
2. 포트폴리오 카드 표시
3. 전략 목록 로딩
4. 필터/정렬 동작
5. 상세 페이지 이동
```

#### 인증
```
테스트 시나리오:
1. /auth/login 접속
2. 폼 유효성 검사
3. 에러 메시지 표시
4. 소셜 로그인 버튼
5. 회원가입 링크
```

### 3. 반응형 테스트

| 뷰포트 | 너비 | 확인 사항 |
|--------|------|----------|
| Mobile | 375px | 햄버거 메뉴, 터치 영역 |
| Tablet | 768px | 2열 그리드 |
| Desktop | 1280px | 전체 레이아웃 |

## 오류 리포트 형식

Chrome Claude → Claude Code 전달 시:

```markdown
## 오류 리포트

### 위치
- URL: /dashboard/strategy-builder
- 컴포넌트: BlockPalette

### 증상
- 블록을 드래그할 때 캔버스에 드롭되지 않음

### 재현 단계
1. 전략 빌더 페이지 접속
2. 좌측 팔레트에서 "RSI" 블록 선택
3. 캔버스로 드래그
4. 마우스 놓음 → 블록 사라짐

### 예상 동작
- 블록이 캔버스에 배치되어야 함

### 스크린샷
[첨부]
```

## 자동화 테스트 (Playwright)

```typescript
// e2e/strategy-builder.spec.ts
import { test, expect } from '@playwright/test';

test('전략 빌더 블록 추가', async ({ page }) => {
  await page.goto('/dashboard/strategy-builder');

  // 블록 팔레트 확인
  await expect(page.locator('[data-testid="block-palette"]')).toBeVisible();

  // 블록 드래그 테스트
  const block = page.locator('[data-block-type="rsi"]');
  const canvas = page.locator('[data-testid="strategy-canvas"]');

  await block.dragTo(canvas);

  // 블록 추가 확인
  await expect(canvas.locator('[data-block-type="rsi"]')).toBeVisible();
});
```

## 디버그 팁

### 콘솔 에러 확인
```
Chrome DevTools > Console 탭
- React 에러
- API 호출 실패
- 타입 에러
```

### 네트워크 탭
```
Chrome DevTools > Network 탭
- API 응답 상태
- 로딩 시간
- 실패한 요청
```

### Performance
```
Chrome DevTools > Performance 탭
- 초기 로딩 시간
- 렌더링 지연
- 메모리 사용량
```

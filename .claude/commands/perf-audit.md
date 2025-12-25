# Performance Audit - Lighthouse 기반 성능 최적화

Chrome Lighthouse 결과를 기반으로 웹 성능을 최적화합니다.

## 입력 형식
```
$ARGUMENTS (Lighthouse 점수 또는 개선 영역)
```

## 성능 지표 목표

| 지표 | 목표 | 설명 |
|------|------|------|
| LCP | < 2.5s | Largest Contentful Paint |
| FID | < 100ms | First Input Delay |
| CLS | < 0.1 | Cumulative Layout Shift |
| TTI | < 3.8s | Time to Interactive |
| TBT | < 200ms | Total Blocking Time |

## 최적화 체크리스트

### 1. 이미지 최적화
- [ ] next/image 컴포넌트 사용
- [ ] WebP/AVIF 포맷 적용
- [ ] 적절한 sizes 속성 설정
- [ ] lazy loading 적용

### 2. 코드 분할
- [ ] dynamic import 활용
- [ ] route-based splitting
- [ ] 큰 라이브러리 분리

### 3. 번들 최적화
- [ ] tree shaking 확인
- [ ] 불필요한 의존성 제거
- [ ] 번들 분석 (pnpm analyze)

### 4. 렌더링 최적화
- [ ] React.memo 활용
- [ ] useMemo/useCallback 적절히 사용
- [ ] 가상화 (virtualization) 적용

### 5. 네트워크 최적화
- [ ] API 응답 캐싱
- [ ] prefetch/preload 활용
- [ ] CDN 활용

## 실행 명령

```bash
# 번들 분석
pnpm --filter hephaitos analyze

# Lighthouse CI
npx lighthouse-ci autorun

# 빌드 사이즈 확인
pnpm build && du -sh apps/*/. next
```

## 자동 수정 영역

1. **이미지**: `<img>` → `<Image>` 자동 변환
2. **Import**: static → dynamic import 변환
3. **메모이제이션**: 비용 높은 연산에 useMemo 추가

---
*📊 Core Web Vitals 최적화 자동화*

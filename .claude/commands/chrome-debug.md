# Chrome Debug - 브라우저 버그 즉시 수정

Chrome Claude에서 발견한 버그를 즉시 수정합니다.

## 입력 형식
```
$ARGUMENTS
```

## 실행 프로세스

### 1. 버그 분석
- 에러 메시지 또는 증상 파싱
- 관련 컴포넌트/파일 식별
- 재현 조건 확인

### 2. 파일 탐색
- 해당 컴포넌트 파일 찾기
- 관련 의존성 확인
- 스타일 파일 확인 (필요 시)

### 3. 버그 수정
- 원인 분석 및 수정 코드 작성
- TypeScript 타입 안전성 확보
- 사이드 이펙트 최소화

### 4. 테스트 추가
- Vitest 테스트 케이스 작성
- 엣지 케이스 커버
- 테스트 실행 및 확인

### 5. 빌드 확인
```bash
pnpm typecheck
pnpm build
pnpm test
```

## 예시

**입력**: "HEPHAITOS 차트 컴포넌트에서 데이터 없을 때 에러 발생"

**출력**:
1. `apps/hephaitos/src/components/Chart.tsx` 분석
2. null 체크 추가
3. 로딩/에러 상태 처리
4. 테스트 추가
5. 빌드 확인

---
*🔧 Chrome → Claude Code 실시간 버그 수정 파이프라인*

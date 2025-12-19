# FORGE LABS 초기화 명령
# 사용법: /project:init

## 환경 검증 및 상태 보고

이 명령은 FORGE LABS 프로젝트의 현재 상태를 검증하고 보고합니다.

### 실행할 작업:

1. **디렉토리 구조 확인**
   - apps/ 폴더 존재 여부
   - packages/ 폴더 존재 여부
   - .forge/ 폴더 존재 여부

2. **구현 현황 스캔**
   - 각 앱의 에이전트 파일 수 카운트
   - packages/types 내 도메인별 타입 파일 수
   - packages/utils 내 유틸리티 함수 수
   - packages/core 내 저장소 파일 수

3. **쿼리 매핑**
   - 완료된 QRY-XXX 식별
   - 다음 구현 대상 결정

4. **상태 보고서 생성**

---

## 검증 시작

다음 명령을 실행하여 상태를 확인합니다:

```
Glob: apps/*/src/agents/*.ts
Glob: packages/types/src/*/*.ts
Glob: packages/utils/src/*.ts
Glob: packages/core/src/repositories/*.ts
Read: .forge/QUERY_PIPELINE.md
```

검증 완료 후 상태 보고서를 출력합니다.

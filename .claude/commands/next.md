# 다음 쿼리 구현
# 사용법: /project:next 또는 "ㄱ"

## 자동 쿼리 구현 플로우

다음 미구현 쿼리를 자동으로 식별하고 구현합니다.

### 구현 순서

1. **QRY-010**: HEPHAITOS Risk Manager
   - 리스크 관리, VaR 계산, 드로다운 분석

2. **QRY-011**: FOLIO Promotion Optimizer
   - 프로모션 최적화, 할인율 계산, ROI 분석

3. **QRY-012**: DRYON Process Scheduler
   - 공정 스케줄링, 배치 최적화, 에너지 효율

### 각 쿼리 구현 단계

```
Step 1: .forge/specs/{feature}.yaml 스펙 작성
Step 2: packages/types/src/{app}/{feature}.ts L0 타입
Step 3: packages/utils/src/{feature}-calc.ts L1 유틸
Step 4: packages/core/src/repositories/{feature}-repository.ts L2 저장소
Step 5: apps/{app}/src/agents/{feature}-agent.ts L3 에이전트
Step 6: apps/{app}/src/index.ts export 추가
Step 7: 검수 및 완료 보고
```

### 실행

다음 쿼리 구현을 시작합니다...

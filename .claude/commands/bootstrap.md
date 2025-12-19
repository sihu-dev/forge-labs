# FORGE LABS 부트스트랩
# 사용법: /project:bootstrap
# 목적: 새 세션에서 전체 환경을 한 번에 설정

## 🚀 원스톱 초기화

이 명령은 다음을 자동으로 수행합니다:

### Phase 1: 환경 검증 (자동)
```
1. 프로젝트 구조 검증
2. 필수 파일 존재 확인
3. 패키지 의존성 확인
```

### Phase 2: 상태 스캔 (자동)
```
1. 구현된 에이전트 목록 수집
2. 완료된 쿼리 식별
3. 다음 쿼리 결정
```

### Phase 3: 세션 준비 (자동)
```
1. 컨텍스트 로드
2. 플러그인 활성화 확인
3. 자동화 설정 확인
```

---

## 실행 프로토콜

### Step 1: 디렉토리 스캔
```
Glob: apps/*/src/agents/*.ts → 에이전트 파일
Glob: packages/types/src/*/index.ts → 타입 모듈
Glob: packages/utils/src/*.ts → 유틸리티
Glob: packages/core/src/repositories/*.ts → 저장소
```

### Step 2: 상태 매핑
```
QRY-001: HEPHAITOS portfolio-sync ✅
QRY-002: FOLIO competitor-monitor ✅
QRY-003: DRYON sensor-optimizer ✅
QRY-004: HEPHAITOS backtest ✅
QRY-005: FOLIO sales-forecast ✅
QRY-006: DRYON alarm-manager ✅
QRY-007: HEPHAITOS order-executor ✅
QRY-008: FOLIO inventory-optimizer ✅
QRY-009: DRYON energy-monitor ✅
QRY-010: HEPHAITOS risk-manager ⏳
QRY-011: FOLIO promotion-optimizer ⏳
QRY-012: DRYON process-scheduler ⏳
```

### Step 3: 명령어 안내
```
┌────────────────────────────────────────────┐
│  FORGE LABS 세션 준비 완료                  │
├────────────────────────────────────────────┤
│  완료: 9개 쿼리                             │
│  대기: 6개 쿼리                             │
│  다음: QRY-010 (Risk Manager)              │
├────────────────────────────────────────────┤
│  명령어:                                    │
│  • ㄱ      → 다음 쿼리 구현                  │
│  • ㄱㄱㄱ   → 3개 쿼리 연속 구현              │
│  • 상태    → 현재 상태 표시                  │
│  • 검수    → 코드 리뷰 실행                  │
└────────────────────────────────────────────┘
```

---

## 자동 실행

부트스트랩을 시작합니다. 환경을 검증하고 세션을 준비합니다.

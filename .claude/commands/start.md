# FORGE LABS 세션 시작
# 사용법: /project:start

## 즉시 실행

다음 파일을 병렬로 읽고 컨텍스트를 구축합니다:

### Step 1: 핵심 문서 로드
```
Read: CLAUDE.md
Read: .forge/BUSINESS_PLAN.md
Read: .forge/DEVELOPMENT_PLAN.md
Read: .forge/HEPHAITOS_ARCHITECTURE.md
```

### Step 2: 코드베이스 스캔
```
Glob: packages/types/src/hephaitos/*.ts
Glob: packages/utils/src/*.ts
Glob: packages/core/src/**/*.ts
Glob: apps/hephaitos/src/**/*.ts
Glob: packages/ui/src/**/*.tsx
```

### Step 3: 상태 출력

```
┌─────────────────────────────────────────────────────────────────┐
│  🔥 FORGE LABS 세션 준비 완료                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📄 문서 로드:                                                   │
│  ├─ CLAUDE.md (마스터 가이드)                                   │
│  ├─ BUSINESS_PLAN.md (사업계획서)                               │
│  ├─ DEVELOPMENT_PLAN.md (개발계획서)                            │
│  └─ HEPHAITOS_ARCHITECTURE.md (아키텍처)                        │
│                                                                 │
│  📦 코드베이스:                                                  │
│  ├─ L0 Types: 8개                                               │
│  ├─ L1 Utils: 14개                                              │
│  ├─ L2 Core: 14개                                               │
│  ├─ L2 UI: 30개                                                 │
│  └─ L3 Agents: 9개                                              │
│                                                                 │
│  🎯 다음 작업:                                                   │
│  ├─ ㄱ → 다음 쿼리 구현                                          │
│  ├─ 상태 → 진행 현황                                            │
│  └─ 관제 → 대시보드                                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 명령어 요약

| 입력 | 동작 |
|------|------|
| `ㄱ` | 다음 쿼리 구현 |
| `ㄱㄱㄱ` | 3개 연속 구현 |
| `상태` | 진행 현황 |
| `관제` | 관제 대시보드 |
| `검수` | 전체 코드 리뷰 |
| `디자인` | UI 벤치마킹 |

---

*세션 초기화를 시작합니다...*

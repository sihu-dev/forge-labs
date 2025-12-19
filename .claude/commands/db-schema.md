---
name: db-schema
description: 데이터베이스 스키마 설계 - ERD, Prisma/SQLAlchemy 모델 생성
---

# 데이터베이스 스키마 설계

## Supabase PostgreSQL 템플릿

### 기본 구조

```sql
-- 1. 테이블 생성
CREATE TABLE IF NOT EXISTS {table_name} (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- columns...
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 인덱스 전략
CREATE INDEX IF NOT EXISTS idx_{table}_{column}
  ON {table_name} ({column});

-- 3. RLS 활성화
ALTER TABLE {table_name} ENABLE ROW LEVEL SECURITY;

-- 4. 정책 생성
CREATE POLICY "policy_name"
  ON {table_name} FOR {SELECT|INSERT|UPDATE|DELETE}
  USING (condition);

-- 5. 트리거 (updated_at 자동 갱신)
CREATE TRIGGER trigger_{table}_updated_at
  BEFORE UPDATE ON {table_name}
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### 인덱스 전략

| 유형 | 사용 시점 | 예시 |
|------|----------|------|
| B-Tree | 기본, 범위 검색 | `deadline`, `created_at` |
| GIN | 배열, JSONB, 풀텍스트 | `keywords[]`, `to_tsvector()` |
| 복합 | 다중 조건 조회 | `(deadline, status)` |
| 부분 | 조건부 인덱스 | `WHERE status = 'active'` |

## 실행

1. 테이블 요구사항 입력
2. ERD 다이어그램 생성
3. SQL 마이그레이션 생성
4. TypeScript 타입 생성

---

테이블 구조를 설명하면 스키마를 설계합니다.

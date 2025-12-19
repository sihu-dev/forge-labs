# FORGE LABS Supabase 초기화

> **프로젝트 ID**: `demwsktllidwsxahqyvd`
> **초기화 날짜**: 2025-12-19
> **버전**: 1.0.0

---

## ✅ 초기화 완료 항목

### 1. 프로젝트 설정
- ✅ Supabase CLI 초기화 (`supabase init`)
- ✅ Project ID 설정 (`demwsktllidwsxahqyvd`)
- ✅ 환경 변수 설정 (`.env`)
- ✅ VS Code 설정 업데이트

### 2. 초기 스키마 생성
- ✅ 마이그레이션 파일: `20251219000001_initial_schema.sql`
- ✅ 4개 앱 스키마 정의
- ✅ RLS (Row Level Security) 설정
- ✅ 인덱스 최적화
- ✅ 트리거 및 함수

---

## 📊 데이터베이스 구조

### 4개 앱별 테이블

#### 🔥 HEPHAITOS (트레이딩)
- `hephaitos_portfolios` - 포트폴리오
- `hephaitos_trades` - 거래 내역
- `hephaitos_strategies` - 트레이딩 전략
- `hephaitos_backtests` - 백테스트 결과

#### ⚡ DRYON (K-슬러지 IoT)
- `dryon_sensors` - IoT 센서
- `dryon_readings` - 센서 데이터
- `dryon_alarms` - 알람/경고
- `dryon_energy_logs` - 에너지 사용량

#### 🌱 FOLIO (소상공인)
- `folio_businesses` - 사업장 정보
- `folio_competitors` - 경쟁사 분석
- `folio_sales` - 매출 분석
- `folio_inventory` - 재고 관리

#### 🤖 ADE (AI 디자인)
- `ade_projects` - AI 프로젝트
- `ade_templates` - 디자인 템플릿
- `ade_generations` - AI 생성 로그

---

## 🚀 마이그레이션 적용

### 로컬 개발 환경 (선택)

```bash
# 로컬 Supabase 시작
npx supabase start

# 마이그레이션 적용
npx supabase db reset

# 상태 확인
npx supabase status
```

### 프로덕션 환경 (원격)

```bash
# 1. Supabase CLI 로그인
npx supabase login

# 2. 프로젝트 링크
npx supabase link --project-ref demwsktllidwsxahqyvd

# 3. 마이그레이션 푸시
npx supabase db push

# 또는 Dashboard에서 직접 실행:
# https://supabase.com/dashboard/project/demwsktllidwsxahqyvd/sql
```

**권장**: Dashboard SQL Editor에서 실행 (더 안전)

---

## 📖 Dashboard에서 마이그레이션 실행

### 방법 1: SQL Editor 사용 (추천)

```
1. Dashboard 접속
   https://supabase.com/dashboard/project/demwsktllidwsxahqyvd/sql

2. 새 쿼리 생성 (New query)

3. 마이그레이션 파일 내용 복사
   supabase/migrations/20251219000001_initial_schema.sql

4. 붙여넣기 후 "Run" 클릭

5. 성공 메시지 확인
```

### 방법 2: 마이그레이션 업로드

```
Dashboard → Database → Migrations 탭에서 파일 업로드
```

---

## 🔐 보안 설정

### Row Level Security (RLS)

모든 테이블에 RLS 활성화됨:
- ✅ 사용자는 자신의 데이터만 조회/수정 가능
- ✅ `auth.uid()`로 사용자 인증 확인
- ✅ 공개 템플릿은 모두에게 읽기 허용

### 정책 예시

```sql
-- 사용자는 자신의 포트폴리오만 조회
CREATE POLICY "Users can view own portfolios"
ON hephaitos_portfolios
FOR SELECT
USING (auth.uid() = user_id);
```

---

## 📝 타입 및 Enum

### 공통

- `user_role`: 'user', 'premium', 'admin'
- `subscription_status`: 'trial', 'active', 'cancelled', 'expired'

### HEPHAITOS

- `exchange_type`: 'binance', 'upbit', 'bithumb', 'coinone'
- `trade_type`: 'market', 'limit', 'stop_loss', 'stop_limit'
- `trade_status`: 'pending', 'executed', 'cancelled', 'failed'

### DRYON

- `sensor_type`: 'temperature', 'humidity', 'pressure', 'flow', 'level', 'energy'
- `alarm_severity`: 'info', 'warning', 'critical', 'emergency'

### FOLIO

- `business_category`: 'restaurant', 'cafe', 'retail', 'service', 'other'

### ADE

- `design_type`: 'landing_page', 'dashboard', 'component', 'layout', 'animation'
- `generation_status`: 'pending', 'processing', 'completed', 'failed'

---

## 🧪 테스트 쿼리

### 연결 테스트

```sql
-- 테이블 목록 확인
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 특정 앱 테이블 확인
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'hephaitos_%';
```

### 샘플 데이터 삽입 (테스트용)

```sql
-- HEPHAITOS 포트폴리오 생성
INSERT INTO hephaitos_portfolios (user_id, name, exchange, assets)
VALUES (auth.uid(), 'My Portfolio', 'binance', '[]');

-- DRYON 센서 생성
INSERT INTO dryon_sensors (user_id, device_id, name, type)
VALUES (auth.uid(), 'SENSOR001', 'Temperature Sensor', 'temperature');
```

---

## 📂 폴더 구조

```
supabase/
├── config.toml                          # Supabase 설정
├── migrations/
│   └── 20251219000001_initial_schema.sql  # 초기 스키마
├── seed.sql                             # 샘플 데이터 (선택)
└── README.md                            # 이 파일
```

---

## 🔄 다음 마이그레이션 생성

### 새 마이그레이션 파일 생성

```bash
# CLI로 생성
npx supabase migration new add_feature_name

# 또는 수동 생성
# supabase/migrations/20251219000002_add_feature.sql
```

### 마이그레이션 네이밍 규칙

```
YYYYMMDDHHmmss_descriptive_name.sql

예시:
20251219120000_add_user_profiles.sql
20251220000000_add_notifications.sql
```

---

## 🌐 유용한 링크

| 리소스 | URL |
|--------|-----|
| **Dashboard** | https://supabase.com/dashboard/project/demwsktllidwsxahqyvd |
| **SQL Editor** | https://supabase.com/dashboard/project/demwsktllidwsxahqyvd/sql |
| **Table Editor** | https://supabase.com/dashboard/project/demwsktllidwsxahqyvd/editor |
| **Database** | https://supabase.com/dashboard/project/demwsktllidwsxahqyvd/database/tables |
| **API Docs** | https://supabase.com/dashboard/project/demwsktllidwsxahqyvd/api |
| **Auth** | https://supabase.com/dashboard/project/demwsktllidwsxahqyvd/auth/users |

---

## ⚠️ 주의사항

### 프로덕션 배포 전

1. **마이그레이션 검토**
   - SQL 구문 오류 확인
   - 인덱스 최적화 확인
   - RLS 정책 검증

2. **백업**
   - Dashboard에서 백업 설정
   - 중요 데이터 스냅샷

3. **테스트**
   - 로컬 환경에서 먼저 테스트
   - 샘플 데이터로 검증

### 롤백

```sql
-- 특정 테이블 삭제 (주의!)
DROP TABLE IF EXISTS hephaitos_portfolios CASCADE;

-- 모든 FORGE 테이블 삭제 (매우 주의!)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
```

---

## 📚 추가 리소스

- [Supabase CLI 문서](https://supabase.com/docs/guides/cli)
- [PostgreSQL 문서](https://www.postgresql.org/docs/)
- [RLS 가이드](https://supabase.com/docs/guides/auth/row-level-security)
- [마이그레이션 가이드](https://supabase.com/docs/guides/database/migrations)

---

*FORGE LABS Supabase v1.0 - 4개 앱 통합 데이터베이스*
*초기화 완료: 2025-12-19*

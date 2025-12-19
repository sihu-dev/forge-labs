# ✅ Supabase 프로젝트 초기화 완료!

> **FORGE LABS v5.0 - 4개 앱 통합 데이터베이스**
> **초기화 날짜**: 2025-12-19

---

## 🎉 완료된 작업

### 1. Supabase CLI 초기화
- ✅ `npx supabase init` 실행
- ✅ Project ID 설정: `demwsktllidwsxahqyvd`
- ✅ `supabase/config.toml` 생성

### 2. 초기 스키마 생성
- ✅ **22개 테이블** 정의
  - 🔥 HEPHAITOS: 4개 (portfolios, trades, strategies, backtests)
  - ⚡ DRYON: 4개 (sensors, readings, alarms, energy_logs)
  - 🌱 FOLIO: 4개 (businesses, competitors, sales, inventory)
  - 🤖 ADE: 3개 (projects, templates, generations)
- ✅ **Row Level Security (RLS)** 설정
- ✅ **인덱스 최적화** (20+ 인덱스)
- ✅ **트리거 & 함수** (updated_at 자동 갱신)

### 3. 환경 변수 설정
- ✅ `.env` 파일 생성
- ✅ Supabase URL, ANON_KEY, SERVICE_ROLE_KEY 설정
- ✅ VS Code settings.json 업데이트

### 4. 가이드 문서 생성
- ✅ `supabase/README.md` - 전체 가이드
- ✅ `.vscode/SUPABASE_MIGRATION_GUIDE.md` - 마이그레이션 실행 가이드
- ✅ `tests/supabase-connection.test.ts` - 연결 테스트

---

## 🚀 다음 단계 (필수!)

### Step 1: 마이그레이션 적용

**마이그레이션 파일을 실행하여 테이블을 생성해야 합니다.**

#### 방법 A: Dashboard SQL Editor (권장)

```
1. 링크 접속
   https://supabase.com/dashboard/project/demwsktllidwsxahqyvd/sql

2. 파일 열기
   code supabase/migrations/20251219000001_initial_schema.sql

3. 내용 복사 (Ctrl+A → Ctrl+C)

4. SQL Editor에 붙여넣기 (Ctrl+V)

5. "Run" 버튼 클릭

6. 성공 메시지 확인
   ✅ "Success. No rows returned"
```

#### 방법 B: CLI

```bash
npx supabase login
npx supabase link --project-ref demwsktllidwsxahqyvd
npx supabase db push
```

---

### Step 2: VS Code Extension 로그인

```
1. VS Code 열기: code .

2. Ctrl+Shift+P

3. "Supabase: Sign In" 입력

4. 브라우저에서 로그인

5. "Authorize VSCode Extension" 클릭

6. VS Code로 복귀
```

---

### Step 3: 연결 확인

```bash
# 터미널에서
npx tsx tests/supabase-connection.test.ts

# VS Code에서
Ctrl+Shift+P → "Supabase: Show Database"
→ 22개 테이블이 보이면 성공!
```

---

## 📊 데이터베이스 구조

### HEPHAITOS (🔥 트레이딩)

```
hephaitos_portfolios
├── id (UUID, PK)
├── user_id (UUID, FK → auth.users)
├── name (TEXT)
├── exchange (exchange_type)
├── assets (JSONB)
└── ...

hephaitos_trades
hephaitos_strategies
hephaitos_backtests
```

### DRYON (⚡ K-슬러지 IoT)

```
dryon_sensors
├── id (UUID, PK)
├── user_id (UUID, FK → auth.users)
├── device_id (TEXT, UNIQUE)
├── type (sensor_type)
└── ...

dryon_readings
dryon_alarms
dryon_energy_logs
```

### FOLIO (🌱 소상공인)

```
folio_businesses
├── id (UUID, PK)
├── user_id (UUID, FK → auth.users)
├── name (TEXT)
├── category (business_category)
└── ...

folio_competitors
folio_sales
folio_inventory
```

### ADE (🤖 AI 디자인)

```
ade_projects
├── id (UUID, PK)
├── user_id (UUID, FK → auth.users)
├── type (design_type)
├── prompt (TEXT)
├── status (generation_status)
└── ...

ade_templates
ade_generations
```

---

## 🔐 보안 기능

### Row Level Security (RLS)

모든 테이블에 RLS 활성화:

```sql
-- 사용자는 자신의 데이터만 조회
CREATE POLICY "Users can view own portfolios"
ON hephaitos_portfolios
FOR SELECT
USING (auth.uid() = user_id);
```

### 정책 요약

- ✅ SELECT: 본인 데이터만 조회
- ✅ INSERT: 본인 user_id만 삽입
- ✅ UPDATE: 본인 데이터만 수정
- ✅ DELETE: 본인 데이터만 삭제

---

## 📁 파일 구조

```
forge-labs/
├── .env                               ✅ Supabase 키 설정
├── supabase/
│   ├── config.toml                   ✅ Supabase CLI 설정
│   ├── migrations/
│   │   └── 20251219000001_initial_schema.sql  ✅ 초기 스키마
│   └── README.md                     ✅ Supabase 가이드
├── .vscode/
│   ├── settings.json                 ✅ Project URL 추가
│   ├── SUPABASE_MIGRATION_GUIDE.md  ✅ 마이그레이션 가이드
│   └── ...
├── tests/
│   └── supabase-connection.test.ts  ✅ 연결 테스트
└── CLAUDE.md                         ✅ 업데이트 완료
```

---

## 🧪 테스트 쿼리

마이그레이션 적용 후 실행:

```sql
-- 테이블 목록 확인
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 결과: 22개 테이블

-- RLS 확인
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- 결과: 21개 테이블 RLS 활성화 (ade_templates 제외)
```

---

## 🔗 유용한 링크

| 리소스 | URL |
|--------|-----|
| **Dashboard** | https://supabase.com/dashboard/project/demwsktllidwsxahqyvd |
| **SQL Editor** | https://supabase.com/dashboard/project/demwsktllidwsxahqyvd/sql |
| **Table Editor** | https://supabase.com/dashboard/project/demwsktllidwsxahqyvd/editor |
| **Database** | https://supabase.com/dashboard/project/demwsktllidwsxahqyvd/database/tables |
| **API Docs** | https://supabase.com/dashboard/project/demwsktllidwsxahqyvd/api |
| **Auth** | https://supabase.com/dashboard/project/demwsktllidwsxahqyvd/auth/users |

---

## ⚠️ 중요 참고사항

### 마이그레이션 실행 전

- **백업 불필요**: 새 프로젝트이므로 백업 불필요
- **권한 확인**: Dashboard에서 실행하면 자동으로 권한 있음
- **실행 시간**: 약 10-30초 소요

### 마이그레이션 실행 후

1. **테이블 확인**: Dashboard → Database → Tables
2. **RLS 확인**: 각 테이블 Policies 탭 확인
3. **API 테스트**: API Docs에서 자동 생성된 엔드포인트 확인

---

## 💡 다음 작업

마이그레이션 적용 완료 후:

1. **샘플 데이터 삽입** (선택)
   - Dashboard → Table Editor에서 수동 삽입
   - 또는 SQL로 INSERT

2. **앱 코드 작성**
   - Supabase Client 초기화
   - CRUD 작업 구현

3. **인증 설정**
   - Dashboard → Authentication 설정
   - 이메일/소셜 로그인 설정

---

## 🎯 체크리스트

```markdown
초기화 완료:
- [x] Supabase CLI 초기화
- [x] 환경 변수 설정
- [x] 초기 스키마 파일 생성
- [x] 가이드 문서 작성

다음 단계 (필수):
- [ ] Dashboard SQL Editor에서 마이그레이션 실행
- [ ] 22개 테이블 생성 확인
- [ ] VS Code Extension 로그인
- [ ] 연결 테스트 성공
```

---

*FORGE LABS Supabase v1.0 - 4개 앱 통합 데이터베이스*
*초기화 완료: 2025-12-19*

**이제 Dashboard에서 마이그레이션을 실행하세요!**
https://supabase.com/dashboard/project/demwsktllidwsxahqyvd/sql

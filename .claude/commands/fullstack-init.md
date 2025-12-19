---
name: fullstack-init
description: 풀스택 프로젝트 초기화 - Next.js + Supabase 템플릿 생성
---

# 풀스택 프로젝트 초기화

## 새 앱 생성 템플릿

### 1. 디렉토리 구조 생성

```bash
mkdir -p apps/{APP_NAME}/src/{app,components,lib,hooks,types}
mkdir -p apps/{APP_NAME}/src/app/api/v1
mkdir -p apps/{APP_NAME}/src/lib/{security,validation,domain,clients}
mkdir -p apps/{APP_NAME}/supabase/migrations
```

### 2. 필수 파일

- `package.json` - 의존성
- `next.config.ts` - Next.js 설정
- `tsconfig.json` - TypeScript 설정
- `tailwind.config.ts` - Tailwind 설정
- `.env.example` - 환경 변수 템플릿

### 3. 보안 기본 설정

```typescript
// lib/security/index.ts
export * from './auth-middleware';
export * from './rate-limiter';
export * from './csrf';
```

### 4. 타입 패키지 연결

```typescript
// packages/types/src/{app}/index.ts
export type UUID = string & { readonly __brand: 'UUID' };
// ...
```

## 실행

1. 앱 이름 입력
2. 템플릿 파일 생성
3. 의존성 설치 (`pnpm install`)
4. Supabase 마이그레이션 (`supabase db push`)

---

새 앱 이름을 입력하면 위 구조로 초기화합니다.

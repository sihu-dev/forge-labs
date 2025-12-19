/**
 * HEPHAITOS - Environment Variables Type Definitions
 * TypeScript 환경변수 타입 안전성
 */

declare namespace NodeJS {
  interface ProcessEnv {
    // Node 환경
    NODE_ENV: 'development' | 'production' | 'test';

    // Supabase (Client-side)
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string;

    // Supabase (Server-side only)
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
    SUPABASE_PUBLISHABLE_KEY?: string;
    SUPABASE_SECRET_KEY?: string;

    // Vercel
    VERCEL_TOKEN?: string;

    // 한국투자증권 KIS
    KIS_APP_KEY?: string;
    KIS_APP_SECRET?: string;
    KIS_ACCOUNT_NO?: string;
    KIS_ACCOUNT_TYPE?: 'mock' | 'real';

    // 토스
    TOSS_CLIENT_ID?: string;
    TOSS_CLIENT_SECRET?: string;
    TOSS_OAUTH_BASE?: string;
    TOSS_API_BASE?: string;

    // 거래소
    BINANCE_API_KEY?: string;
    BINANCE_API_SECRET?: string;
    UPBIT_ACCESS_KEY?: string;
    UPBIT_SECRET_KEY?: string;
    BITHUMB_API_KEY?: string;
    BITHUMB_API_SECRET?: string;

    // LLM
    OPENAI_API_KEY?: string;
    ANTHROPIC_API_KEY?: string;

    // 포트
    HEPHAITOS_PORT?: string;

    // 로깅
    LOG_LEVEL?: 'debug' | 'info' | 'warn' | 'error';
  }
}

export {};

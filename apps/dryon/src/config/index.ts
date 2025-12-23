/**
 * 환경 변수 및 설정 관리
 */

import { config as dotenvConfig } from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import type { ServiceConfig, MyBusiness } from '../types/index.js';

// 현재 파일 경로에서 프로젝트 루트 찾기
const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
// dist/config/index.js 또는 src/config/index.ts에서 실행되므로 2단계 상위로 이동
const rootDir = path.resolve(dirname, '..', '..');

// 환경 변수 로드 (명시적 경로, override로 기존 값 덮어쓰기)
const envPath = path.join(rootDir, '.env');
dotenvConfig({ path: envPath, override: true });

/**
 * 환경 변수 가져오기 (필수)
 */
function getEnvRequired(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return value;
}

/**
 * 환경 변수 가져오기 (선택)
 */
function getEnvOptional(key: string, defaultValue: string = ''): string {
  return process.env[key] || defaultValue;
}

/**
 * 환경 변수 숫자로 가져오기
 */
function getEnvNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  return value ? parseInt(value, 10) : defaultValue;
}

/**
 * 환경 변수 불린으로 가져오기
 */
function getEnvBoolean(key: string, defaultValue: boolean = false): boolean {
  const value = process.env[key];
  return value ? value.toLowerCase() === 'true' : defaultValue;
}

/**
 * 내 사업 정보 설정
 */
const myBusiness: MyBusiness = {
  serviceName: getEnvOptional('MY_SERVICE_NAME', 'ZZIK / zzikmap'),
  item: getEnvOptional(
    'MY_SERVICE_ITEM',
    'GPS 기반 위치 인증 플랫폼 / 인터랙티브 여행 경로 지도'
  ),
  field: getEnvOptional(
    'MY_SERVICE_FIELD',
    'AI/SW, 위치기반서비스(LBS), 관광테크'
  ),
  stage: getEnvOptional('MY_SERVICE_STAGE', '예비창업자'),
  team: getEnvOptional('MY_SERVICE_TEAM', '1인'),
  techStack: getEnvOptional(
    'MY_SERVICE_TECH_STACK',
    'Next.js, Supabase, Mapbox, Gemini Vision API'
  ),
};

/**
 * 전체 서비스 설정
 */
export const config: ServiceConfig = {
  anthropic: {
    apiKey: getEnvRequired('ANTHROPIC_API_KEY'),
    model: getEnvOptional('CLAUDE_MODEL', 'claude-sonnet-4-20250514'),
    maxTokens: getEnvNumber('CLAUDE_MAX_TOKENS', 4096),
    temperature: parseFloat(getEnvOptional('CLAUDE_TEMPERATURE', '0.7')),
  },

  bizinfo: {
    apiKey: getEnvRequired('BIZINFO_API_KEY'),
    apiUrl: getEnvOptional(
      'BIZINFO_API_URL',
      'https://api.odcloud.kr/api/3034791/v1/uddi:fa09d13d-bce8-474e-b214-8008e79ec08f'
    ),
  },

  kstartup: {
    apiKey: getEnvRequired('KSTARTUP_API_KEY'),
    apiUrl: getEnvOptional(
      'KSTARTUP_API_URL',
      'https://api.odcloud.kr/api/15125364/v1/uddi'
    ),
  },

  google: {
    clientId: getEnvRequired('GOOGLE_CLIENT_ID'),
    clientSecret: getEnvRequired('GOOGLE_CLIENT_SECRET'),
    redirectUri: getEnvOptional(
      'GOOGLE_REDIRECT_URI',
      'http://localhost:3000/oauth2callback'
    ),
    refreshToken: getEnvRequired('GOOGLE_REFRESH_TOKEN'),
    spreadsheetId: getEnvRequired('GOOGLE_SPREADSHEET_ID'),
    calendarId: getEnvOptional('GOOGLE_CALENDAR_ID', 'primary'),
  },

  slack: {
    webhookUrl: getEnvRequired('SLACK_WEBHOOK_URL'),
    channel: getEnvOptional('SLACK_CHANNEL', '#정부지원사업-알림'),
  },

  scheduler: {
    cron: getEnvOptional('SCHEDULER_CRON', '0 8 * * *'),
    timezone: getEnvOptional('SCHEDULER_TIMEZONE', 'Asia/Seoul'),
    enabled: getEnvBoolean('SCHEDULER_ENABLED', true),
  },

  filterKeywords: getEnvOptional(
    'FILTER_KEYWORDS',
    '창업,스타트업,벤처,기술,혁신,R&D,청년,예비창업,AI,소프트웨어,초기창업,지원사업,중소기업,인공지능,SW,ICT,디지털,플랫폼,데이터'
  )
    .split(',')
    .map((k) => k.trim()),

  minScoreThreshold: getEnvNumber('MIN_SCORE_THRESHOLD', 7),

  myBusiness,

  apis: {
    kodit: {
      apiKey: getEnvOptional('KODIT_API_KEY'),
      url: getEnvOptional('KODIT_API_URL'),
    },
    koreg: {
      apiKey: getEnvOptional('KOREG_API_KEY'),
      url: getEnvOptional('KOREG_API_URL'),
    },
  },

  naver: {
    clientId: getEnvOptional('NAVER_CLIENT_ID'),
    clientSecret: getEnvOptional('NAVER_CLIENT_SECRET'),
  },

  redis: process.env.REDIS_HOST
    ? (() => {
        const password = getEnvOptional('REDIS_PASSWORD');
        return {
          host: getEnvOptional('REDIS_HOST', 'localhost'),
          port: getEnvNumber('REDIS_PORT', 6379),
          ...(password && { password }),
          db: getEnvNumber('REDIS_DB', 0),
        };
      })()
    : undefined,

  logger: {
    level: getEnvOptional('LOG_LEVEL', 'info'),
    filePath: getEnvOptional('LOG_FILE_PATH', './logs/app.log'),
    maxFiles: getEnvOptional('LOG_MAX_FILES', '7d'),
    maxSize: getEnvOptional('LOG_MAX_SIZE', '20m'),
  },
};

/**
 * 설정 검증
 */
export function validateConfig(): void {
  const requiredKeys = [
    'ANTHROPIC_API_KEY',
    'BIZINFO_API_KEY',
    'KSTARTUP_API_KEY',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GOOGLE_REFRESH_TOKEN',
    'GOOGLE_SPREADSHEET_ID',
    'SLACK_WEBHOOK_URL',
  ];

  const missing = requiredKeys.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
        'Please check your .env file and ensure all required variables are set.'
    );
  }
}

/**
 * 개발 모드 확인
 */
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';
export const isTest = process.env.NODE_ENV === 'test';

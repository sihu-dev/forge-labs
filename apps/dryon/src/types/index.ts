/**
 * 정부지원사업 자동화 시스템 - 타입 정의
 */

import { z } from 'zod';

// ============================================
// 공고 데이터 스키마
// ============================================

export const ProgramSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  organization: z.string(),
  category: z.string().optional(),
  target: z.string().optional(),
  deadline: z.string(),
  startDate: z.string(),
  url: z.string().url().optional(),
  source: z.enum([
    'Bizinfo',
    'K-Startup',
    'SeoulAIHub',
    'THEVC',
    'Manual',
    'bizinfo',
    'k-startup',
    'kodit',
    'koreg',
    'kibo',
    'seoul',
    'kised',
    'nipa',
    'semas',
    'gyeonggi',
    'busan',
    'tips',
    'kdata',
    'ccei',
    'sba',
    'technopark',
    'naver-search',
    'sparklabs',
    'kakao-ventures',
    'tumblbug',
    'naver-d2sf',
    'primer',
    'wadiz',
    'fasttrack-asia',
    'bonangels',
    'company-k-partners',
    'thevc',
    'crevisse',
    'crowdy',
    // 신규 추가: 진흥원/공단
    'kocca',
    'kisa',
    'kicox',
    'kiat',
    'keit',
    // 신규 추가: 대학 창업지원단
    'university-kaist',
    'university-snu',
    'university-yonsei',
    'university-korea',
    'university-postech',
    'university-hanyang',
    // 신규 추가: 비IT 부처
    'ministry-mafra',
    'ministry-mof',
    'ministry-molit',
    'ministry-me',
    'ministry-mohw',
    'ministry-rda',
    'ministry-forest',
    'ministry-kma',
    // 한국관광공사/관광산업포털
    '한국관광공사',
    'touraz',
  ]),
  memo: z.string().optional(),
  rawData: z.record(z.unknown()).optional(),
});

export type Program = z.infer<typeof ProgramSchema>;

// ============================================
// 공고 정보 (Announcement) - 새로운 통합 타입
// ============================================

export interface Announcement {
  id: string;
  title: string;
  source: string; // 출처 코드
  url: string;
  description?: string;
  deadline?: Date;
  startDate?: Date;
  agency?: string; // 주관기관
  budget?: string; // 지원규모
  targetAudience?: string; // 대상
  category?: string; // 카테고리
  collectedAt: Date;
  rawData?: Record<string, unknown>;
}

// ============================================
// AI 분석 결과 스키마
// ============================================

export const AnalysisResultSchema = z.object({
  score: z.number().min(1).max(10),
  recommendation: z.enum(['강력추천', '추천', '검토필요', '부적합']),
  matchReasons: z.array(z.string()),
  concerns: z.array(z.string()),
  keyEvaluationCriteria: z.array(z.string()),
  preparationTips: z.array(z.string()),
  estimatedBudget: z.string().optional(),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']),
});

export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;

// ============================================
// 분석된 공고 (공고 + 분석 결과)
// ============================================

export const AnalyzedProgramSchema = ProgramSchema.extend({
  analysis: AnalysisResultSchema,
  analyzedAt: z.string().datetime(),
});

export type AnalyzedProgram = z.infer<typeof AnalyzedProgramSchema>;

// ============================================
// 내 사업 정보
// ============================================

export const MyBusinessSchema = z.object({
  serviceName: z.string(),
  item: z.string(),
  field: z.string(),
  stage: z.string(),
  team: z.string(),
  techStack: z.string(),
  additionalInfo: z.record(z.string()).optional(),
});

export type MyBusiness = z.infer<typeof MyBusinessSchema>;

// ============================================
// 사업계획서 생성 요청
// ============================================

export const BusinessPlanRequestSchema = z.object({
  program: ProgramSchema,
  myBusiness: MyBusinessSchema,
  targetBudget: z.number().optional(),
  evaluationCriteria: z
    .array(
      z.object({
        name: z.string(),
        points: z.number(),
      })
    )
    .optional(),
});

export type BusinessPlanRequest = z.infer<typeof BusinessPlanRequestSchema>;

// ============================================
// 사업계획서 결과
// ============================================

export const BusinessPlanSchema = z.object({
  title: z.string(),
  sections: z.array(
    z.object({
      heading: z.string(),
      content: z.string(),
      points: z.number().optional(),
    })
  ),
  budget: z
    .object({
      total: z.number(),
      items: z.array(
        z.object({
          category: z.string(),
          amount: z.number(),
          percentage: z.number(),
          justification: z.string(),
        })
      ),
    })
    .optional(),
  checklist: z.array(z.string()).optional(),
  expectedScore: z
    .object({
      total: z.number(),
      breakdown: z.array(
        z.object({
          criterion: z.string(),
          expectedPoints: z.number(),
          maxPoints: z.number(),
        })
      ),
    })
    .optional(),
  strategy: z.string().optional(),
  generatedAt: z.string().datetime(),
});

export type BusinessPlan = z.infer<typeof BusinessPlanSchema>;

// ============================================
// API 응답 래퍼
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

// ============================================
// 로거 설정
// ============================================

export interface LoggerConfig {
  level: string;
  filePath?: string;
  maxFiles?: string;
  maxSize?: string;
}

// ============================================
// 스케줄러 설정
// ============================================

export interface SchedulerConfig {
  cron: string;
  timezone: string;
  enabled: boolean;
}

// ============================================
// 서비스 설정
// ============================================

export interface ServiceConfig {
  anthropic: {
    apiKey: string;
    model: string;
    maxTokens: number;
    temperature: number;
  };
  bizinfo: {
    apiKey: string;
    apiUrl: string;
  };
  kstartup: {
    apiKey: string;
    apiUrl: string;
  };
  apis?: {
    kodit?: {
      apiKey?: string;
      url?: string;
    };
    koreg?: {
      apiKey?: string;
      url?: string;
    };
    [key: string]:
      | {
          apiKey?: string;
          url?: string;
        }
      | undefined;
  };
  naver?: {
    clientId?: string;
    clientSecret?: string;
  };
  google: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    refreshToken: string;
    spreadsheetId: string;
    calendarId: string;
  };
  slack: {
    webhookUrl: string;
    channel: string;
  };
  scheduler: SchedulerConfig;
  filterKeywords: string[];
  minScoreThreshold: number;
  myBusiness: MyBusiness;
  redis?: {
    host: string;
    port: number;
    password?: string;
    db: number;
  };
  logger: LoggerConfig;
}

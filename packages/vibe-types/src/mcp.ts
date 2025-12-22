/**
 * MCP (Model Context Protocol) Types
 */

import type { A11yCheckOptions, A11yReport } from './a11y';
import type { DesignTokens } from './tokens';
import type { GeneratedProject, GenerationConfig } from './generation';
import type { AnimationSuggestion, MotionCodeOptions } from './motion';

/** MCP 도구 입력 기본 타입 */
export interface MCPToolInput {
  /** 이미지 소스 (URL, base64, file path) */
  source?: string;
  /** 여러 이미지 소스 */
  sources?: string[];
}

/** Vision-to-Code 입력 */
export interface VisionToCodeInput extends MCPToolInput {
  source: string;
  options?: Partial<GenerationConfig>;
}

/** Vision-to-Code 출력 */
export interface VisionToCodeOutput {
  success: boolean;
  project?: GeneratedProject;
  error?: string;
}

/** 토큰 추출 입력 */
export interface ExtractTokensInput extends MCPToolInput {
  source: string;
  format?: 'tailwind' | 'css' | 'json';
}

/** 토큰 추출 출력 */
export interface ExtractTokensOutput {
  success: boolean;
  tokens?: DesignTokens;
  tailwindTheme?: string;
  cssVariables?: string;
  json?: string;
  error?: string;
}

/** 접근성 검사 입력 */
export interface CheckA11yInput extends MCPToolInput {
  source: string;
  options?: A11yCheckOptions;
}

/** 접근성 검사 출력 */
export interface CheckA11yOutput {
  success: boolean;
  report?: A11yReport;
  error?: string;
}

/** 목업 생성 입력 */
export interface GenerateMockupInput extends MCPToolInput {
  source: string;
  device: string;
  style?: 'realistic' | 'clay' | 'flat' | 'wireframe';
  orientation?: 'portrait' | 'landscape';
  background?: string;
}

/** 목업 생성 출력 */
export interface GenerateMockupOutput {
  success: boolean;
  /** 생성된 목업 이미지 (base64) */
  image?: string;
  /** 이미지 URL (저장된 경우) */
  url?: string;
  error?: string;
}

/** 이미지 검색 입력 */
export interface FindImagesInput extends MCPToolInput {
  /** 검색 컨텍스트 (스크린샷에서 추출) */
  source?: string;
  /** 직접 검색어 */
  query?: string;
  /** 결과 수 */
  count?: number;
  /** 이미지 소스 필터 */
  sources?: ('unsplash' | 'pexels' | 'pixabay')[];
}

/** 이미지 검색 출력 */
export interface FindImagesOutput {
  success: boolean;
  images?: {
    url: string;
    thumbnail: string;
    source: string;
    author?: string;
    license: string;
  }[];
  error?: string;
}

/** 콘텐츠 생성 입력 */
export interface GenerateContentInput extends MCPToolInput {
  source: string;
  industry?: string;
  tone?: 'professional' | 'casual' | 'playful';
  language?: 'en' | 'ko' | 'ja' | 'zh';
}

/** 콘텐츠 생성 출력 */
export interface GenerateContentOutput {
  success: boolean;
  content?: {
    elementId: string;
    type: string;
    original?: string;
    generated: string;
  }[];
  error?: string;
}

/** 플로우 감지 입력 */
export interface DetectFlowInput extends MCPToolInput {
  sources: string[];
  format?: 'mermaid' | 'figjam' | 'json';
}

/** 플로우 감지 출력 */
export interface DetectFlowOutput {
  success: boolean;
  flow?: {
    screens: { id: string; name: string; thumbnail?: string }[];
    connections: { from: string; to: string; label?: string }[];
  };
  mermaid?: string;
  figjam?: string;
  error?: string;
}

/** 이미지 처리 입력 */
export interface ProcessImageInput extends MCPToolInput {
  source: string;
  removeBackground?: boolean;
  upscale?: '2x' | '4x' | '8x';
  enhance?: boolean;
  compress?: boolean;
  format?: 'png' | 'webp' | 'avif' | 'jpg';
}

/** 이미지 처리 출력 */
export interface ProcessImageOutput {
  success: boolean;
  /** 처리된 이미지 (base64) */
  image?: string;
  /** 원본 크기 */
  originalSize?: { width: number; height: number };
  /** 처리 후 크기 */
  processedSize?: { width: number; height: number };
  /** 파일 크기 (bytes) */
  fileSize?: number;
  error?: string;
}

/** 모션 생성 입력 */
export interface GenerateMotionInput extends MCPToolInput {
  source: string;
  options?: MotionCodeOptions;
}

/** 모션 생성 출력 */
export interface GenerateMotionOutput {
  success: boolean;
  suggestions?: AnimationSuggestion[];
  error?: string;
}

/** 차트 생성 입력 */
export interface GenerateChartInput extends MCPToolInput {
  source: string;
  library?: 'recharts' | 'nivo' | 'chartjs' | 'visx';
}

/** 차트 생성 출력 */
export interface GenerateChartOutput {
  success: boolean;
  chartType?: string;
  data?: unknown[];
  code?: string;
  error?: string;
}

/** MCP 도구 정의 */
export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

/** MCP 도구 목록 */
export const MCP_TOOLS: MCPToolDefinition[] = [
  {
    name: 'vision_to_code',
    description: 'Convert screenshot/URL to React+Tailwind code',
    inputSchema: {
      type: 'object',
      properties: {
        source: { type: 'string', description: 'Image URL, base64, or file path' },
        options: {
          type: 'object',
          properties: {
            framework: { enum: ['react', 'vue', 'svelte', 'html'] },
            componentLib: { enum: ['catalyst', 'shadcn', 'none'] },
            typescript: { type: 'boolean' },
            responsive: { type: 'boolean' },
          },
        },
      },
      required: ['source'],
    },
  },
  {
    name: 'extract_tokens',
    description: 'Extract design tokens from screenshot',
    inputSchema: {
      type: 'object',
      properties: {
        source: { type: 'string' },
        format: { enum: ['tailwind', 'css', 'json'] },
      },
      required: ['source'],
    },
  },
  {
    name: 'check_accessibility',
    description: 'Check WCAG compliance and suggest fixes',
    inputSchema: {
      type: 'object',
      properties: {
        source: { type: 'string' },
        level: { enum: ['A', 'AA', 'AAA'] },
        includeSimulations: { type: 'boolean' },
      },
      required: ['source'],
    },
  },
  {
    name: 'generate_mockup',
    description: 'Apply device frame to screenshot',
    inputSchema: {
      type: 'object',
      properties: {
        source: { type: 'string' },
        device: { type: 'string' },
        style: { enum: ['realistic', 'clay', 'flat'] },
      },
      required: ['source', 'device'],
    },
  },
  {
    name: 'find_images',
    description: 'Find stock images matching context',
    inputSchema: {
      type: 'object',
      properties: {
        source: { type: 'string' },
        query: { type: 'string' },
        count: { type: 'number' },
      },
    },
  },
  {
    name: 'generate_content',
    description: 'Generate contextual content for placeholders',
    inputSchema: {
      type: 'object',
      properties: {
        source: { type: 'string' },
        industry: { type: 'string' },
        language: { enum: ['en', 'ko', 'ja', 'zh'] },
      },
      required: ['source'],
    },
  },
  {
    name: 'detect_flow',
    description: 'Detect user flow from multiple screenshots',
    inputSchema: {
      type: 'object',
      properties: {
        sources: { type: 'array', items: { type: 'string' } },
        format: { enum: ['mermaid', 'figjam', 'json'] },
      },
      required: ['sources'],
    },
  },
  {
    name: 'process_image',
    description: 'Remove background, upscale, enhance images',
    inputSchema: {
      type: 'object',
      properties: {
        source: { type: 'string' },
        removeBackground: { type: 'boolean' },
        upscale: { enum: ['2x', '4x', '8x'] },
        enhance: { type: 'boolean' },
      },
      required: ['source'],
    },
  },
  {
    name: 'generate_motion',
    description: 'Suggest and generate animations',
    inputSchema: {
      type: 'object',
      properties: {
        source: { type: 'string' },
        library: { enum: ['motion', 'framer-motion', 'css'] },
      },
      required: ['source'],
    },
  },
  {
    name: 'generate_chart',
    description: 'Detect chart and generate code',
    inputSchema: {
      type: 'object',
      properties: {
        source: { type: 'string' },
        library: { enum: ['recharts', 'nivo', 'chartjs'] },
      },
      required: ['source'],
    },
  },
];

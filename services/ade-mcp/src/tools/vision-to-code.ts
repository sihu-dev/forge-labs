/**
 * Vision-to-Code Tool
 * 스크린샷을 React+Tailwind 코드로 변환
 */

import type { VisionPipeline } from '@forge-labs/vibe-engine';
import type { TokenExtractor } from '@forge-labs/vibe-engine';
import type {
  VisionToCodeInput,
  VisionToCodeOutput,
  GenerationConfig,
  DEFAULT_GENERATION_CONFIG,
} from '@forge-labs/vibe-types';

/** 도구 컨텍스트 */
interface ToolContext {
  pipeline: VisionPipeline;
  tokenExtractor: TokenExtractor;
}

/** 도구 정의 */
export interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute: (args: Record<string, unknown>, context: ToolContext) => Promise<unknown>;
}

/**
 * Vision-to-Code 도구
 */
export const visionToCodeTool: MCPTool = {
  name: 'vision_to_code',
  description: `Convert a screenshot or URL into React + Tailwind CSS code.

Features:
- Detects UI components (buttons, inputs, cards, etc.)
- Extracts design tokens (colors, typography, spacing)
- Maps to Catalyst/shadcn components
- Generates TypeScript React code
- Supports responsive design with Container Queries

Usage:
- source: Image URL, base64 data, or file path
- options.framework: 'react' | 'vue' | 'svelte' | 'html'
- options.componentLib: 'catalyst' | 'shadcn' | 'none'
- options.typescript: boolean
- options.responsive: boolean`,

  inputSchema: {
    type: 'object',
    properties: {
      source: {
        type: 'string',
        description: 'Image source: URL (https://...), base64 (data:image/...), or file path',
      },
      options: {
        type: 'object',
        properties: {
          framework: {
            type: 'string',
            enum: ['react', 'vue', 'svelte', 'html'],
            default: 'react',
            description: 'Target framework',
          },
          componentLib: {
            type: 'string',
            enum: ['catalyst', 'shadcn', 'none'],
            default: 'catalyst',
            description: 'Component library to use',
          },
          styling: {
            type: 'string',
            enum: ['tailwind-v4', 'tailwind-v3', 'css-modules'],
            default: 'tailwind-v4',
            description: 'Styling system',
          },
          typescript: {
            type: 'boolean',
            default: true,
            description: 'Generate TypeScript code',
          },
          responsive: {
            type: 'boolean',
            default: true,
            description: 'Generate responsive code with Container Queries',
          },
          accessibility: {
            type: 'boolean',
            default: true,
            description: 'Add ARIA attributes',
          },
          darkMode: {
            type: 'boolean',
            default: true,
            description: 'Support dark mode',
          },
          extractTokens: {
            type: 'boolean',
            default: true,
            description: 'Extract and include design tokens',
          },
        },
      },
    },
    required: ['source'],
  },

  async execute(args, context): Promise<VisionToCodeOutput> {
    const { source, options = {} } = args as unknown as VisionToCodeInput;
    const { pipeline } = context;

    try {
      // 입력 타입 감지
      let inputType: 'base64' | 'url' | 'file' = 'url';
      if (source.startsWith('data:image')) {
        inputType = 'base64';
      } else if (source.startsWith('/') || source.startsWith('.')) {
        inputType = 'file';
      }

      // 생성 설정
      const config: GenerationConfig = {
        framework: options.framework || 'react',
        styling: options.styling || 'tailwind-v4',
        componentLib: options.componentLib || 'catalyst',
        typescript: options.typescript ?? true,
        responsive: options.responsive ?? true,
        accessibility: options.accessibility ?? true,
        darkMode: options.darkMode ?? true,
        animation: false,
        inlineStyles: false,
      };

      // 파이프라인 실행
      const result = await pipeline.process(
        { image: source, type: inputType },
        {
          config,
          onProgress: (event) => {
            // 진행 상황 로깅 (stderr로)
            console.error(`[${event.stage}] ${event.progress}% - ${event.message}`);
          },
        }
      );

      return {
        success: true,
        project: result.project,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },
};

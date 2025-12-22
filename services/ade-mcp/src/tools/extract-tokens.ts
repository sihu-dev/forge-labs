/**
 * Extract Tokens Tool
 * 스크린샷에서 디자인 토큰 추출
 */

import type { TokenExtractor } from '@forge-labs/vibe-engine';
import type { VisionPipeline } from '@forge-labs/vibe-engine';
import type { ExtractTokensInput, ExtractTokensOutput } from '@forge-labs/vibe-types';

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
 * Extract Tokens 도구
 */
export const extractTokensTool: MCPTool = {
  name: 'extract_tokens',
  description: `Extract design tokens from a screenshot.

Extracts:
- Colors (primary, secondary, background, etc.)
- Typography (font families, sizes, weights)
- Spacing (base unit, scale)
- Border radius
- Shadows
- Animation timings

Output formats:
- tailwind: Tailwind v4 @theme CSS
- css: CSS custom properties
- json: W3C Design Tokens format`,

  inputSchema: {
    type: 'object',
    properties: {
      source: {
        type: 'string',
        description: 'Image source: URL, base64, or file path',
      },
      format: {
        type: 'string',
        enum: ['tailwind', 'css', 'json', 'all'],
        default: 'all',
        description: 'Output format',
      },
      options: {
        type: 'object',
        properties: {
          maxColors: {
            type: 'number',
            default: 16,
            description: 'Maximum number of colors to extract',
          },
          detectDarkMode: {
            type: 'boolean',
            default: true,
            description: 'Detect and generate dark mode tokens',
          },
          matchFonts: {
            type: 'boolean',
            default: true,
            description: 'Try to match detected fonts to known fonts',
          },
        },
      },
    },
    required: ['source'],
  },

  async execute(args, context): Promise<ExtractTokensOutput> {
    const { source, format = 'all', options = {} } = args as unknown as ExtractTokensInput & {
      format?: string;
      options?: Record<string, unknown>;
    };
    const { tokenExtractor } = context;

    try {
      // 토큰 추출
      const result = await tokenExtractor.extract(source, {
        color: {
          maxColors: options.maxColors as number,
          detectDarkMode: options.detectDarkMode as boolean,
        },
        typography: {
          matchFonts: options.matchFonts as boolean,
        },
      });

      // 포맷에 따른 출력
      const output: ExtractTokensOutput = {
        success: true,
        tokens: result.tokens,
      };

      if (format === 'tailwind' || format === 'all') {
        output.tailwindTheme = result.tailwindTheme;
      }

      if (format === 'css' || format === 'all') {
        output.cssVariables = result.cssVariables;
      }

      if (format === 'json' || format === 'all') {
        output.json = result.json;
      }

      return output;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Token extraction failed',
      };
    }
  },
};

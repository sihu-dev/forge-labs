/**
 * Generate Mockup Tool
 * 디바이스 프레임 목업 생성
 */

import type { VisionPipeline, TokenExtractor } from '@forge-labs/vibe-engine';
import type { GenerateMockupInput, GenerateMockupOutput } from '@forge-labs/vibe-types';

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

/** 지원 디바이스 목록 */
const SUPPORTED_DEVICES = {
  // iPhone
  'iphone-15-pro': { width: 1179, height: 2556, name: 'iPhone 15 Pro' },
  'iphone-15': { width: 1179, height: 2556, name: 'iPhone 15' },
  'iphone-14': { width: 1170, height: 2532, name: 'iPhone 14' },
  'iphone-se': { width: 750, height: 1334, name: 'iPhone SE' },
  // Android
  'pixel-8': { width: 1080, height: 2400, name: 'Google Pixel 8' },
  'galaxy-s24': { width: 1080, height: 2340, name: 'Samsung Galaxy S24' },
  // Tablets
  'ipad-pro-13': { width: 2048, height: 2732, name: 'iPad Pro 13"' },
  'ipad-air': { width: 1640, height: 2360, name: 'iPad Air' },
  // Laptops
  'macbook-pro-16': { width: 3456, height: 2234, name: 'MacBook Pro 16"' },
  'macbook-air-15': { width: 2880, height: 1864, name: 'MacBook Air 15"' },
  // Desktops
  'imac-24': { width: 4480, height: 2520, name: 'iMac 24"' },
  'desktop-4k': { width: 3840, height: 2160, name: '4K Desktop' },
  'desktop-1080p': { width: 1920, height: 1080, name: '1080p Desktop' },
};

/**
 * Generate Mockup 도구
 */
export const generateMockupTool: MCPTool = {
  name: 'generate_mockup',
  description: `Apply a device frame to a screenshot to create a professional mockup.

Supported devices:
- iphone-15-pro, iphone-15, iphone-14, iphone-se
- pixel-8, galaxy-s24
- ipad-pro-13, ipad-air
- macbook-pro-16, macbook-air-15
- imac-24, desktop-4k, desktop-1080p

Styles:
- realistic: Photorealistic device frame
- clay: Minimal clay style
- flat: Flat 2D style
- wireframe: Wireframe outline only`,

  inputSchema: {
    type: 'object',
    properties: {
      source: {
        type: 'string',
        description: 'Screenshot image: URL, base64, or file path',
      },
      device: {
        type: 'string',
        enum: Object.keys(SUPPORTED_DEVICES),
        description: 'Target device for mockup',
      },
      style: {
        type: 'string',
        enum: ['realistic', 'clay', 'flat', 'wireframe'],
        default: 'realistic',
        description: 'Mockup style',
      },
      orientation: {
        type: 'string',
        enum: ['portrait', 'landscape'],
        default: 'portrait',
        description: 'Device orientation',
      },
      background: {
        type: 'string',
        default: 'transparent',
        description: 'Background color or "transparent"',
      },
      options: {
        type: 'object',
        properties: {
          shadow: {
            type: 'boolean',
            default: true,
            description: 'Add drop shadow',
          },
          reflection: {
            type: 'boolean',
            default: false,
            description: 'Add reflection effect',
          },
          angle: {
            type: 'object',
            properties: {
              x: { type: 'number', default: 0 },
              y: { type: 'number', default: 0 },
              z: { type: 'number', default: 0 },
            },
            description: '3D rotation angles',
          },
        },
      },
    },
    required: ['source', 'device'],
  },

  async execute(args, context): Promise<GenerateMockupOutput> {
    const {
      source,
      device,
      style = 'realistic',
      orientation = 'portrait',
      background = 'transparent',
      options = {},
    } = args as unknown as GenerateMockupInput & { options?: Record<string, unknown> };

    try {
      // 디바이스 정보 확인
      const deviceInfo = SUPPORTED_DEVICES[device as keyof typeof SUPPORTED_DEVICES];
      if (!deviceInfo) {
        return {
          success: false,
          error: `Unsupported device: ${device}. Supported: ${Object.keys(SUPPORTED_DEVICES).join(', ')}`,
        };
      }

      // TODO: 실제 목업 생성 구현
      // - Sharp 또는 Canvas를 사용한 이미지 합성
      // - 3D 변환 적용
      // - 그림자/반사 효과

      // 현재는 메타데이터만 반환
      return {
        success: true,
        image: '', // base64 결과 이미지
        url: undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Mockup generation failed',
      };
    }
  },
};

/**
 * 지원 디바이스 목록 export
 */
export { SUPPORTED_DEVICES };

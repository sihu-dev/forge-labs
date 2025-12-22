/**
 * ADE MCP Server
 * Model Context Protocol 서버 구현
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

import { VisionPipeline } from '@forge-labs/vibe-engine';
import { tokenExtractor } from '@forge-labs/vibe-engine';
import { DEFAULT_GENERATION_CONFIG } from '@forge-labs/vibe-types';

import { visionToCodeTool } from './tools/vision-to-code.js';
import { extractTokensTool } from './tools/extract-tokens.js';
import { checkA11yTool } from './tools/check-a11y.js';
import { generateMockupTool } from './tools/generate-mockup.js';
import { findImagesTool } from './tools/find-images.js';
import { processImageTool } from './tools/process-image.js';

/** MCP 도구 정의 */
const TOOLS = [
  visionToCodeTool,
  extractTokensTool,
  checkA11yTool,
  generateMockupTool,
  findImagesTool,
  processImageTool,
];

/**
 * ADE MCP Server 클래스
 */
export class ADEMCPServer {
  private server: Server;
  private pipeline: VisionPipeline;

  constructor() {
    this.server = new Server(
      {
        name: 'ade-vision-suite',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // API 키 설정 (환경 변수에서)
    const apiKey = process.env.ANTHROPIC_API_KEY || '';
    this.pipeline = new VisionPipeline(apiKey);

    this.setupHandlers();
  }

  /**
   * 핸들러 설정
   */
  private setupHandlers(): void {
    // 도구 목록 조회
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: TOOLS.map((tool) => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
        })),
      };
    });

    // 도구 실행
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        const tool = TOOLS.find((t) => t.name === name);
        if (!tool) {
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${name}`
          );
        }

        const result = await tool.execute(args || {}, {
          pipeline: this.pipeline,
          tokenExtractor,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: false, error: message }),
            },
          ],
          isError: true,
        };
      }
    });
  }

  /**
   * 서버 시작
   */
  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('ADE MCP Server started');
  }
}

// 직접 실행 시
const server = new ADEMCPServer();
server.start().catch(console.error);

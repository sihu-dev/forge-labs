#!/usr/bin/env node
/**
 * BIDFLOW MCP Server
 * Model Context Protocol server for 나라장터 bid automation
 *
 * @version 1.0.0
 * @spec MCP 2025-11-25
 */

import { Server } from '@modelcontextprotocol/sdk/server';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import 'dotenv/config';

// Import tool handlers
import { tools, handleToolCall } from './tools/index.js';
import { resources, handleResourceRead } from './resources/index.js';
import { prompts, handlePromptGet } from './prompts/index.js';
import { logAuditEvent } from './lib/audit.js';
import { checkRateLimit } from './lib/rate-limit.js';

// Server configuration
const SERVER_NAME = process.env.MCP_SERVER_NAME || 'bidflow';
const SERVER_VERSION = process.env.MCP_SERVER_VERSION || '1.0.0';

// Initialize MCP server
const server = new Server(
  {
    name: SERVER_NAME,
    version: SERVER_VERSION,
  },
  {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
    },
  }
);

// ============================================================================
// REQUEST HANDLERS
// ============================================================================

/**
 * List all available tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  console.error(`[${SERVER_NAME}] Listing ${tools.length} tools`);
  return { tools };
});

/**
 * Execute a tool
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  console.error(`[${SERVER_NAME}] Calling tool: ${name}`);

  // Rate limiting
  const rateLimitOk = await checkRateLimit('tool', name);
  if (!rateLimitOk) {
    throw new Error('Rate limit exceeded. Please try again later.');
  }

  // Audit logging
  const auditEvent = {
    event_type: 'mcp_tool_call' as const,
    server: SERVER_NAME,
    tool: name,
    arguments: args,
    timestamp: new Date().toISOString(),
  };

  try {
    const result = await handleToolCall(name, args || {});

    await logAuditEvent({
      ...auditEvent,
      result: { status: 'success', data: result },
    });

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    await logAuditEvent({
      ...auditEvent,
      result: { status: 'error', error: errorMessage },
    });

    throw error;
  }
});

/**
 * List all available resources
 */
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  console.error(`[${SERVER_NAME}] Listing ${resources.length} resources`);
  return { resources };
});

/**
 * Read a resource
 */
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  console.error(`[${SERVER_NAME}] Reading resource: ${uri}`);

  // Rate limiting
  const rateLimitOk = await checkRateLimit('resource', uri);
  if (!rateLimitOk) {
    throw new Error('Rate limit exceeded. Please try again later.');
  }

  const result = await handleResourceRead(uri);
  return result;
});

/**
 * List all available prompts
 */
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  console.error(`[${SERVER_NAME}] Listing ${prompts.length} prompts`);
  return { prompts };
});

/**
 * Get a prompt with arguments
 */
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  console.error(`[${SERVER_NAME}] Getting prompt: ${name}`);

  const result = await handlePromptGet(name, args || {});
  return result;
});

// ============================================================================
// SERVER LIFECYCLE
// ============================================================================

/**
 * Start the MCP server
 */
async function main() {
  console.error(`[${SERVER_NAME}] Starting BIDFLOW MCP Server v${SERVER_VERSION}`);
  console.error(`[${SERVER_NAME}] Environment: ${process.env.NODE_ENV || 'development'}`);
  console.error(`[${SERVER_NAME}] BIDFLOW API: ${process.env.BIDFLOW_API_URL || 'http://localhost:3010'}`);
  console.error(`[${SERVER_NAME}] Tools: ${tools.length}, Resources: ${resources.length}, Prompts: ${prompts.length}`);

  // Validate environment
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.error('[ERROR] Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_ANON_KEY.');
    process.exit(1);
  }

  // Create stdio transport
  const transport = new StdioServerTransport();

  // Connect server to transport
  await server.connect(transport);

  console.error(`[${SERVER_NAME}] Server running and ready for requests`);
}

// Handle errors
process.on('uncaughtException', (error) => {
  console.error('[FATAL] Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[FATAL] Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.error(`[${SERVER_NAME}] Received SIGINT, shutting down gracefully...`);
  await server.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.error(`[${SERVER_NAME}] Received SIGTERM, shutting down gracefully...`);
  await server.close();
  process.exit(0);
});

// Start the server
main().catch((error) => {
  console.error('[FATAL] Failed to start server:', error);
  process.exit(1);
});

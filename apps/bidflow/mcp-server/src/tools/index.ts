/**
 * MCP Tools Registry
 * Exports all available tools and the router for handling tool calls
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';

// Import tool definitions
import { searchBidsTool, handleSearchBids } from './search_bids.js';
import { getBidDetailsTool, handleGetBidDetails } from './get_bid_details.js';
import { trackCompetitorsTool, handleTrackCompetitors } from './track_competitors.js';
import { matchProductsTool, handleMatchProducts } from './match_products.js';
import { createProposalTool, handleCreateProposal } from './create_proposal.js';
import { scheduleCrawlTool, handleScheduleCrawl } from './schedule_crawl.js';
import { exportBidsTool, handleExportBids } from './export_bids.js';
import { getStatisticsTool, handleGetStatistics } from './get_statistics.js';
import { addKeywordTool, handleAddKeyword } from './manage_keywords.js';
import { removeKeywordTool, handleRemoveKeyword } from './manage_keywords.js';
import { getKeywordsTool, handleGetKeywords } from './manage_keywords.js';
import { healthCheckTool, handleHealthCheck } from './health_check.js';

// ============================================================================
// TOOL REGISTRY
// ============================================================================

/**
 * All available MCP tools
 */
export const tools: Tool[] = [
  searchBidsTool,
  getBidDetailsTool,
  trackCompetitorsTool,
  matchProductsTool,
  createProposalTool,
  scheduleCrawlTool,
  exportBidsTool,
  getStatisticsTool,
  addKeywordTool,
  removeKeywordTool,
  getKeywordsTool,
  healthCheckTool,
];

// ============================================================================
// TOOL CALL ROUTER
// ============================================================================

/**
 * Route tool calls to appropriate handlers
 */
export async function handleToolCall(name: string, args: unknown): Promise<unknown> {
  switch (name) {
    case 'search_bids':
      return await handleSearchBids(args);
    case 'get_bid_details':
      return await handleGetBidDetails(args);
    case 'track_competitors':
      return await handleTrackCompetitors(args);
    case 'match_products':
      return await handleMatchProducts(args);
    case 'create_proposal':
      return await handleCreateProposal(args);
    case 'schedule_crawl':
      return await handleScheduleCrawl(args);
    case 'export_bids':
      return await handleExportBids(args);
    case 'get_statistics':
      return await handleGetStatistics(args);
    case 'add_keyword':
      return await handleAddKeyword(args);
    case 'remove_keyword':
      return await handleRemoveKeyword(args);
    case 'get_keywords':
      return await handleGetKeywords();
    case 'health_check':
      return await handleHealthCheck();
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

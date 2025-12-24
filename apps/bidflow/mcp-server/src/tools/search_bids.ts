/**
 * Tool: search_bids
 * Search for bid opportunities from 나라장터 and other sources
 */

import { z } from 'zod';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { getSupabaseClient } from '../lib/supabase.js';

// ============================================================================
// SCHEMA DEFINITION
// ============================================================================

const SearchBidsInputSchema = z.object({
  keywords: z.array(z.string()).optional().describe('Keywords to search for (e.g., ["유량계", "초음파"])'),
  source: z.enum(['narajangto', 'kepco', 'kwater', 'ted', 'ungm', 'sam']).optional().describe('Bid data source'),
  from_date: z.string().datetime().optional().describe('Start date (ISO 8601)'),
  to_date: z.string().datetime().optional().describe('End date (ISO 8601)'),
  min_amount: z.number().int().min(0).optional().describe('Minimum estimated amount (KRW)'),
  max_amount: z.number().int().min(0).optional().describe('Maximum estimated amount (KRW)'),
  status: z.enum(['new', 'reviewing', 'preparing', 'submitted', 'won', 'lost']).optional().describe('Bid status'),
  type: z.enum(['product', 'service', 'construction', 'facility']).optional().describe('Bid type'),
  min_match_score: z.number().min(0).max(100).optional().describe('Minimum product match score (0-100)'),
  organization: z.string().optional().describe('Organization/customer name to filter by'),
  limit: z.number().int().min(1).max(100).default(20).describe('Maximum number of results to return'),
  offset: z.number().int().min(0).default(0).optional().describe('Number of results to skip (pagination)'),
});

type SearchBidsInput = z.infer<typeof SearchBidsInputSchema>;

// ============================================================================
// TOOL DEFINITION
// ============================================================================

export const searchBidsTool: Tool = {
  name: 'search_bids',
  description: `Search for bid opportunities from 나라장터 (Korean public procurement portal) and other sources.

Returns a list of bids matching the search criteria, including:
- Bid details (title, organization, deadline, amount)
- Product matching scores (how well CMNTech products match)
- Status and priority information
- Direct links to bid announcements

Use this tool to:
- Find new opportunities matching specific keywords
- Filter bids by amount, deadline, or status
- Discover high-value bids (>50M KRW) automatically
- Track bids from specific organizations
- Monitor competitor activity

Examples:
- Search for flow meter bids: {"keywords": ["유량계", "초음파"]}
- Find high-value opportunities: {"min_amount": 50000000, "limit": 10}
- Track water authority bids: {"organization": "수자원공사"}
- Get this week's new bids: {"from_date": "2025-12-17T00:00:00Z", "status": "new"}`,
  inputSchema: {
    type: 'object',
    properties: {
      keywords: {
        type: 'array',
        items: { type: 'string' },
        description: 'Keywords to search for (e.g., ["유량계", "초음파"])',
      },
      source: {
        type: 'string',
        enum: ['narajangto', 'kepco', 'kwater', 'ted', 'ungm', 'sam'],
        description: 'Bid data source (default: all sources)',
      },
      from_date: {
        type: 'string',
        format: 'date-time',
        description: 'Start date in ISO 8601 format (e.g., "2025-01-01T00:00:00Z")',
      },
      to_date: {
        type: 'string',
        format: 'date-time',
        description: 'End date in ISO 8601 format',
      },
      min_amount: {
        type: 'number',
        description: 'Minimum estimated amount in KRW (e.g., 10000000 for 10M)',
      },
      max_amount: {
        type: 'number',
        description: 'Maximum estimated amount in KRW',
      },
      status: {
        type: 'string',
        enum: ['new', 'reviewing', 'preparing', 'submitted', 'won', 'lost'],
        description: 'Filter by bid status',
      },
      type: {
        type: 'string',
        enum: ['product', 'service', 'construction', 'facility'],
        description: 'Filter by bid type',
      },
      min_match_score: {
        type: 'number',
        description: 'Minimum product match score (0-100)',
      },
      organization: {
        type: 'string',
        description: 'Filter by organization/customer name',
      },
      limit: {
        type: 'number',
        default: 20,
        description: 'Maximum number of results (1-100, default: 20)',
      },
      offset: {
        type: 'number',
        default: 0,
        description: 'Number of results to skip for pagination',
      },
    },
  },
};

// ============================================================================
// HANDLER IMPLEMENTATION
// ============================================================================

export async function handleSearchBids(args: unknown) {
  // Validate input
  const input = SearchBidsInputSchema.parse(args);

  const supabase = getSupabaseClient();

  // Build query
  let query = supabase
    .from('bids')
    .select(`
      id,
      title,
      organization,
      deadline,
      estimated_amount,
      status,
      priority,
      type,
      source,
      keywords,
      url,
      created_at,
      updated_at,
      pipeline_entries (
        match_score,
        matched_products,
        ai_summary
      )
    `)
    .order('created_at', { ascending: false });

  // Apply filters
  if (input.keywords && input.keywords.length > 0) {
    // Search in title, keywords array, and raw_data
    const keywordFilter = input.keywords
      .map((kw) => `title.ilike.%${kw}%,keywords.cs.{${kw}}`)
      .join(',');
    query = query.or(keywordFilter);
  }

  if (input.source) {
    query = query.eq('source', input.source);
  }

  if (input.from_date) {
    query = query.gte('deadline', input.from_date);
  }

  if (input.to_date) {
    query = query.lte('deadline', input.to_date);
  }

  if (input.min_amount !== undefined) {
    query = query.gte('estimated_amount', input.min_amount);
  }

  if (input.max_amount !== undefined) {
    query = query.lte('estimated_amount', input.max_amount);
  }

  if (input.status) {
    query = query.eq('status', input.status);
  }

  if (input.type) {
    query = query.eq('type', input.type);
  }

  if (input.organization) {
    query = query.ilike('organization', `%${input.organization}%`);
  }

  // Apply pagination
  query = query.range(input.offset, input.offset + input.limit - 1);

  // Execute query
  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to search bids: ${error.message}`);
  }

  // Filter by match score if specified
  let filteredBids = data || [];
  if (input.min_match_score !== undefined) {
    filteredBids = filteredBids.filter((bid) => {
      const pipelineEntry = bid.pipeline_entries?.[0];
      return pipelineEntry && pipelineEntry.match_score >= input.min_match_score! / 100;
    });
  }

  // Format response
  const bids = filteredBids.map((bid) => {
    const pipelineEntry = bid.pipeline_entries?.[0];
    return {
      id: bid.id,
      title: bid.title,
      organization: bid.organization,
      deadline: bid.deadline,
      estimated_amount: bid.estimated_amount,
      status: bid.status,
      priority: bid.priority,
      type: bid.type,
      source: bid.source,
      keywords: bid.keywords,
      url: bid.url,
      match_score: pipelineEntry ? Math.round(pipelineEntry.match_score * 100) : 0,
      matched_products: pipelineEntry?.matched_products?.map((m: any) => m.productName) || [],
      ai_summary: pipelineEntry?.ai_summary || null,
      created_at: bid.created_at,
    };
  });

  return {
    total: count || filteredBids.length,
    count: filteredBids.length,
    limit: input.limit,
    offset: input.offset,
    bids,
  };
}

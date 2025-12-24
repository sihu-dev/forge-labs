/**
 * Tool: get_bid_details
 * Fetch detailed information for a specific bid
 */

import { z } from 'zod';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { getSupabaseClient } from '../lib/supabase.js';

const GetBidDetailsInputSchema = z.object({
  bid_id: z.string().uuid().describe('UUID of the bid to fetch'),
});

export const getBidDetailsTool: Tool = {
  name: 'get_bid_details',
  description: `Fetch detailed information for a specific bid opportunity.

Returns comprehensive bid data including:
- Full bid announcement details
- Requirements and specifications
- Attachments and documents
- Product matching analysis with scores
- AI-generated summary
- Historical status changes

Use this tool to:
- Deep-dive into a specific opportunity
- Analyze requirements for proposal writing
- Review product match reasoning
- Access bid documents and attachments`,
  inputSchema: {
    type: 'object',
    properties: {
      bid_id: {
        type: 'string',
        format: 'uuid',
        description: 'UUID of the bid (from search_bids results)',
      },
    },
    required: ['bid_id'],
  },
};

export async function handleGetBidDetails(args: unknown) {
  const input = GetBidDetailsInputSchema.parse(args);

  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('bids')
    .select(`
      *,
      pipeline_entries (
        id,
        stage,
        assigned_to,
        notes,
        due_date,
        match_score,
        matched_products,
        ai_summary,
        created_at,
        updated_at
      )
    `)
    .eq('id', input.bid_id)
    .single();

  if (error) {
    throw new Error(`Failed to fetch bid details: ${error.message}`);
  }

  if (!data) {
    throw new Error(`Bid not found: ${input.bid_id}`);
  }

  const pipelineEntry = data.pipeline_entries?.[0];

  return {
    id: data.id,
    source: data.source,
    external_id: data.external_id,
    title: data.title,
    organization: data.organization,
    deadline: data.deadline,
    estimated_amount: data.estimated_amount,
    status: data.status,
    priority: data.priority,
    type: data.type,
    keywords: data.keywords,
    url: data.url,
    raw_data: data.raw_data,
    created_at: data.created_at,
    updated_at: data.updated_at,
    pipeline: pipelineEntry
      ? {
          stage: pipelineEntry.stage,
          assigned_to: pipelineEntry.assigned_to,
          notes: pipelineEntry.notes,
          due_date: pipelineEntry.due_date,
          match_score: Math.round(pipelineEntry.match_score * 100),
          matched_products: pipelineEntry.matched_products || [],
          ai_summary: pipelineEntry.ai_summary,
        }
      : null,
  };
}

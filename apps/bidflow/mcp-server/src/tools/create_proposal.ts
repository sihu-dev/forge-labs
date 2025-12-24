/**
 * Tool: create_proposal
 * Generate AI-powered proposal draft
 */

import { z } from 'zod';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { callBidflowAPI } from '../lib/api-client.js';

const CreateProposalInputSchema = z.object({
  bid_id: z.string().uuid(),
  product_ids: z.array(z.string()),
  tone: z.enum(['professional', 'friendly', 'technical']).default('professional'),
  include_pricing: z.boolean().default(false),
});

export const createProposalTool: Tool = {
  name: 'create_proposal',
  description: `Generate AI-powered proposal draft for a bid opportunity.

Creates a comprehensive proposal including:
- Executive summary
- Technical approach and methodology
- Product specifications and advantages
- Implementation timeline
- Optional pricing section
- References and credentials

Supports different tones: professional, friendly, or technical.`,
  inputSchema: {
    type: 'object',
    properties: {
      bid_id: { type: 'string', format: 'uuid' },
      product_ids: { type: 'array', items: { type: 'string' } },
      tone: { type: 'string', enum: ['professional', 'friendly', 'technical'], default: 'professional' },
      include_pricing: { type: 'boolean', default: false },
    },
    required: ['bid_id', 'product_ids'],
  },
};

export async function handleCreateProposal(args: unknown) {
  const input = CreateProposalInputSchema.parse(args);

  const response = await callBidflowAPI(`/api/v1/bids/${input.bid_id}/create-proposal`, {
    method: 'POST',
    body: JSON.stringify({
      product_ids: input.product_ids,
      tone: input.tone,
      include_pricing: input.include_pricing,
    }),
  });

  if (!response.success) {
    throw new Error(response.error?.message || 'Proposal generation failed');
  }

  return response.data;
}

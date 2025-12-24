/**
 * Tool: match_products
 * Match CMNTech products to a bid opportunity
 */

import { z } from 'zod';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { callBidflowAPI } from '../lib/api-client.js';

const MatchProductsInputSchema = z.object({
  bid_id: z.string().uuid().describe('UUID of the bid'),
  threshold: z.number().min(0).max(100).default(50).describe('Minimum match score threshold'),
});

export const matchProductsTool: Tool = {
  name: 'match_products',
  description: `Match CMNTech products to a bid opportunity using AI-powered analysis.

Analyzes bid requirements and specifications to determine which CMNTech products are best suited:
- UR-1000PLUS® (Multi-path ultrasonic flow meter)
- MF-1000C (Electromagnetic flow meter)
- UR-1010PLUS® (Non-full pipe ultrasonic flow meter)
- SL-3000PLUS (Open channel flow meter)
- EnerRay (Ultrasonic heat meter)

Returns match scores (0-100) with confidence levels and reasoning.`,
  inputSchema: {
    type: 'object',
    properties: {
      bid_id: { type: 'string', format: 'uuid' },
      threshold: { type: 'number', default: 50, description: 'Minimum score (0-100)' },
    },
    required: ['bid_id'],
  },
};

export async function handleMatchProducts(args: unknown) {
  const input = MatchProductsInputSchema.parse(args);

  // Call BIDFLOW API to perform product matching
  const response = await callBidflowAPI(`/api/v1/bids/${input.bid_id}/match-products`, {
    method: 'POST',
    body: JSON.stringify({ threshold: input.threshold }),
  });

  if (!response.success) {
    throw new Error(response.error?.message || 'Product matching failed');
  }

  return {
    bid_id: input.bid_id,
    matches: response.data,
  };
}

/**
 * Tool: track_competitors
 * Monitor competitor activity on specific bids
 */

import { z } from 'zod';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { getSupabaseClient } from '../lib/supabase.js';

const TrackCompetitorsInputSchema = z.object({
  bid_id: z.string().uuid(),
  competitors: z.array(z.string()).min(1),
});

export const trackCompetitorsTool: Tool = {
  name: 'track_competitors',
  description: 'Monitor competitor activity on specific bid opportunities. Set up alerts when competitors submit bids or proposals.',
  inputSchema: {
    type: 'object',
    properties: {
      bid_id: { type: 'string', format: 'uuid' },
      competitors: { type: 'array', items: { type: 'string' }, minItems: 1 },
    },
    required: ['bid_id', 'competitors'],
  },
};

export async function handleTrackCompetitors(args: unknown) {
  const input = TrackCompetitorsInputSchema.parse(args);

  const supabase = getSupabaseClient();

  // Store competitor tracking data
  const { data, error } = await supabase
    .from('competitor_tracking')
    .upsert({
      bid_id: input.bid_id,
      competitors: input.competitors,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to track competitors: ${error.message}`);
  }

  return {
    bid_id: input.bid_id,
    competitors: input.competitors,
    tracking_enabled: true,
    tracked_since: data.created_at,
  };
}

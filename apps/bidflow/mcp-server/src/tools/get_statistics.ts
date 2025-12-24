import { z } from 'zod';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { getSupabaseClient } from '../lib/supabase.js';

const GetStatisticsInputSchema = z.object({
  period: z.enum(['day', 'week', 'month', 'year']).default('week'),
  source: z.enum(['narajangto', 'kepco', 'kwater']).optional(),
});

export const getStatisticsTool: Tool = {
  name: 'get_statistics',
  description: 'Get bid statistics and analytics (total bids, win rate, value, etc.)',
  inputSchema: {
    type: 'object',
    properties: {
      period: { type: 'string', enum: ['day', 'week', 'month', 'year'], default: 'week' },
      source: { type: 'string', enum: ['narajangto', 'kepco', 'kwater'] },
    },
  },
};

export async function handleGetStatistics(args: unknown) {
  const input = GetStatisticsInputSchema.parse(args);
  const supabase = getSupabaseClient();

  const now = new Date();
  const periodDays = { day: 1, week: 7, month: 30, year: 365 }[input.period];
  const startDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);

  let query = supabase
    .from('bids')
    .select('id, status, estimated_amount, created_at, source')
    .gte('created_at', startDate.toISOString());

  if (input.source) {
    query = query.eq('source', input.source);
  }

  const { data, error } = await query;

  if (error) throw new Error(`Failed to fetch statistics: ${error.message}`);

  const stats = {
    period: input.period,
    start_date: startDate.toISOString(),
    end_date: now.toISOString(),
    total_bids: data?.length || 0,
    by_status: {} as Record<string, number>,
    by_source: {} as Record<string, number>,
    total_value: 0,
    average_value: 0,
  };

  data?.forEach((bid) => {
    stats.by_status[bid.status] = (stats.by_status[bid.status] || 0) + 1;
    stats.by_source[bid.source] = (stats.by_source[bid.source] || 0) + 1;
    if (bid.estimated_amount) stats.total_value += bid.estimated_amount;
  });

  stats.average_value = data?.length ? stats.total_value / data.length : 0;

  return stats;
}

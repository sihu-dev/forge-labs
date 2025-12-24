import { z } from 'zod';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { callBidflowAPI } from '../lib/api-client.js';

const ScheduleCrawlInputSchema = z.object({
  source: z.enum(['narajangto', 'kepco', 'kwater']),
  schedule: z.string().optional(),
  immediate: z.boolean().default(false),
});

export const scheduleCrawlTool: Tool = {
  name: 'schedule_crawl',
  description: 'Schedule or trigger automated bid crawling from data sources',
  inputSchema: {
    type: 'object',
    properties: {
      source: { type: 'string', enum: ['narajangto', 'kepco', 'kwater'] },
      schedule: { type: 'string', description: 'Cron expression (e.g., "0 8 * * *")' },
      immediate: { type: 'boolean', default: false },
    },
    required: ['source'],
  },
};

export async function handleScheduleCrawl(args: unknown) {
  const input = ScheduleCrawlInputSchema.parse(args);
  const response = await callBidflowAPI('/api/v1/crawl/schedule', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return response.data;
}

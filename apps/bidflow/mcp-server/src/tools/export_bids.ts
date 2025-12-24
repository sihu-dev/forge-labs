import { z } from 'zod';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { callBidflowAPI } from '../lib/api-client.js';

const ExportBidsInputSchema = z.object({
  bid_ids: z.array(z.string().uuid()).optional(),
  format: z.enum(['excel', 'csv', 'json']).default('excel'),
  filters: z.record(z.unknown()).optional(),
});

export const exportBidsTool: Tool = {
  name: 'export_bids',
  description: 'Export bids to Excel, CSV, or JSON format',
  inputSchema: {
    type: 'object',
    properties: {
      bid_ids: { type: 'array', items: { type: 'string', format: 'uuid' } },
      format: { type: 'string', enum: ['excel', 'csv', 'json'], default: 'excel' },
      filters: { type: 'object' },
    },
  },
};

export async function handleExportBids(args: unknown) {
  const input = ExportBidsInputSchema.parse(args);
  const response = await callBidflowAPI('/api/v1/bids/export', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return response.data;
}

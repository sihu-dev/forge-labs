import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { getSupabaseClient } from '../lib/supabase.js';
import { callBidflowAPI } from '../lib/api-client.js';

export const healthCheckTool: Tool = {
  name: 'health_check',
  description: 'Check health status of BIDFLOW MCP server and connected services',
  inputSchema: {
    type: 'object',
    properties: {},
  },
};

export async function handleHealthCheck() {
  const checks = {
    timestamp: new Date().toISOString(),
    server: 'healthy',
    supabase: 'unknown',
    bidflow_api: 'unknown',
  };

  // Check Supabase connection
  try {
    const supabase = getSupabaseClient();
    await supabase.from('bids').select('id').limit(1);
    checks.supabase = 'healthy';
  } catch {
    checks.supabase = 'unhealthy';
  }

  // Check BIDFLOW API
  try {
    await callBidflowAPI('/api/v1/health');
    checks.bidflow_api = 'healthy';
  } catch {
    checks.bidflow_api = 'unhealthy';
  }

  return checks;
}

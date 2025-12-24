/**
 * MCP Resources Registry
 * Resources provide read-only access to data via URI patterns
 */

import type { Resource } from '@modelcontextprotocol/sdk/types.js';
import { getSupabaseClient } from '../lib/supabase.js';

// ============================================================================
// RESOURCE DEFINITIONS
// ============================================================================

export const resources: Resource[] = [
  {
    uri: 'bid_data://{bid_id}',
    name: 'Bid Data',
    description: 'Access bid data by ID. URI pattern: bid_data://UUID',
    mimeType: 'application/json',
  },
  {
    uri: 'company_profile://{organization_name}',
    name: 'Company Profile',
    description: 'Fetch organization profile and history. URI pattern: company_profile://CompanyName',
    mimeType: 'application/json',
  },
  {
    uri: 'market_trends://{category}',
    name: 'Market Trends',
    description: 'Get market analysis and trends. URI pattern: market_trends://flow_meters',
    mimeType: 'application/json',
  },
  {
    uri: 'product_catalog://',
    name: 'Product Catalog',
    description: 'CMNTech product catalog with specifications',
    mimeType: 'application/json',
  },
  {
    uri: 'crawl_stats://{source}',
    name: 'Crawl Statistics',
    description: 'Crawling statistics by source. URI pattern: crawl_stats://narajangto',
    mimeType: 'application/json',
  },
];

// ============================================================================
// RESOURCE HANDLER
// ============================================================================

export async function handleResourceRead(uri: string) {
  const url = new URL(uri);
  const protocol = url.protocol.replace(':', '');

  switch (protocol) {
    case 'bid_data':
      return await readBidData(url.pathname.replace('//', ''));

    case 'company_profile':
      return await readCompanyProfile(decodeURIComponent(url.pathname.replace('//', '')));

    case 'market_trends':
      return await readMarketTrends(url.pathname.replace('//', ''));

    case 'product_catalog':
      return await readProductCatalog();

    case 'crawl_stats':
      return await readCrawlStats(url.pathname.replace('//', ''));

    default:
      throw new Error(`Unknown resource protocol: ${protocol}`);
  }
}

// ============================================================================
// RESOURCE READERS
// ============================================================================

async function readBidData(bidId: string) {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('bids')
    .select('*')
    .eq('id', bidId)
    .single();

  if (error) throw new Error(`Failed to read bid data: ${error.message}`);
  if (!data) throw new Error(`Bid not found: ${bidId}`);

  return {
    contents: [
      {
        uri: `bid_data://${bidId}`,
        mimeType: 'application/json',
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

async function readCompanyProfile(organizationName: string) {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('bids')
    .select('organization, estimated_amount, status, created_at')
    .ilike('organization', `%${organizationName}%`)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw new Error(`Failed to read company profile: ${error.message}`);

  const profile = {
    organization: organizationName,
    total_bids: data?.length || 0,
    total_value: data?.reduce((sum, bid) => sum + (bid.estimated_amount || 0), 0) || 0,
    recent_bids: data?.slice(0, 10) || [],
    status_breakdown: data?.reduce((acc, bid) => {
      acc[bid.status] = (acc[bid.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {},
  };

  return {
    contents: [
      {
        uri: `company_profile://${organizationName}`,
        mimeType: 'application/json',
        text: JSON.stringify(profile, null, 2),
      },
    ],
  };
}

async function readMarketTrends(category: string) {
  // Mock implementation - replace with real analytics
  const trends = {
    category,
    period: 'last_90_days',
    total_bids: 142,
    total_value: 15600000000,
    average_value: 109859155,
    top_keywords: ['유량계', '초음파', '계측기', '전자식'],
    top_organizations: ['K-water', '환경부', '지자체'],
    forecast: {
      next_month_bids: 48,
      trend: 'increasing',
    },
  };

  return {
    contents: [
      {
        uri: `market_trends://${category}`,
        mimeType: 'application/json',
        text: JSON.stringify(trends, null, 2),
      },
    ],
  };
}

async function readProductCatalog() {
  const catalog = {
    products: [
      {
        id: 'UR-1000PLUS',
        name: 'UR-1000PLUS® 다회선 초음파 유량계',
        category: 'Ultrasonic Flow Meter',
        pipe_size: '100-4000mm',
        accuracy: '±0.5%',
        applications: ['상수도', '취수장', '정수장', '만관형 유량측정'],
        price_range: 'Contact Sales',
      },
      {
        id: 'MF-1000C',
        name: 'MF-1000C 일체형 전자유량계',
        category: 'Electromagnetic Flow Meter',
        pipe_size: '15-2000mm',
        accuracy: '±0.3%',
        applications: ['상거래용', '공업용수', '계량기'],
        price_range: 'Contact Sales',
      },
      {
        id: 'UR-1010PLUS',
        name: 'UR-1010PLUS® 비만관형 초음파 유량계',
        category: 'Ultrasonic Flow Meter (Non-full pipe)',
        pipe_size: '200-3000mm',
        accuracy: '±1.0%',
        applications: ['하수', '우수', '복류수', '부분충수'],
        price_range: 'Contact Sales',
      },
      {
        id: 'SL-3000PLUS',
        name: 'SL-3000PLUS 개수로 유량계',
        category: 'Open Channel Flow Meter',
        pipe_size: 'N/A',
        accuracy: '±1.0%',
        applications: ['개수로', '하천', '방류량측정', '농업용수'],
        price_range: 'Contact Sales',
      },
      {
        id: 'EnerRay',
        name: 'EnerRay 초음파 열량계',
        category: 'Ultrasonic Heat Meter',
        pipe_size: '15-300mm',
        accuracy: '±2.0%',
        applications: ['난방', '냉난방', '열교환', '지역난방'],
        price_range: 'Contact Sales',
      },
    ],
  };

  return {
    contents: [
      {
        uri: 'product_catalog://',
        mimeType: 'application/json',
        text: JSON.stringify(catalog, null, 2),
      },
    ],
  };
}

async function readCrawlStats(source: string) {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('crawl_jobs')
    .select('*')
    .eq('source', source)
    .order('started_at', { ascending: false })
    .limit(10);

  if (error) throw new Error(`Failed to read crawl stats: ${error.message}`);

  const stats = {
    source,
    recent_jobs: data || [],
    total_jobs: data?.length || 0,
    success_rate: data?.length
      ? data.filter((j) => j.status === 'completed').length / data.length
      : 0,
  };

  return {
    contents: [
      {
        uri: `crawl_stats://${source}`,
        mimeType: 'application/json',
        text: JSON.stringify(stats, null, 2),
      },
    ],
  };
}

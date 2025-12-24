/**
 * Supabase Edge Function: Marketing Metrics Aggregation
 *
 * Aggregates marketing metrics for dashboard consumption
 * Runs on-demand or via cron schedule
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MetricsRequest {
  period: {
    start: string;
    end: string;
  };
  metrics?: string[]; // Optional: specific metrics to calculate
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body
    const { period, metrics }: MetricsRequest = await req.json();

    // Validate period
    if (!period?.start || !period?.end) {
      return new Response(
        JSON.stringify({ error: 'Period start and end are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // === Pipeline Metrics ===
    const pipelineMetrics = await calculatePipelineMetrics(supabase, period);

    // === Outreach Performance ===
    const outreachMetrics = await calculateOutreachMetrics(supabase, period);

    // === Content Performance ===
    const contentMetrics = await calculateContentMetrics(supabase, period);

    // === LTV Analysis ===
    const ltvMetrics = await calculateLTVMetrics(supabase, period);

    // === Campaign Performance ===
    const campaignMetrics = await calculateCampaignMetrics(supabase, period);

    // Return aggregated metrics
    return new Response(
      JSON.stringify({
        success: true,
        period,
        metrics: {
          pipeline: pipelineMetrics,
          outreach: outreachMetrics,
          content: contentMetrics,
          ltv: ltvMetrics,
          campaigns: campaignMetrics,
        },
        generated_at: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error aggregating metrics:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// ============================================
// Metric Calculation Functions
// ============================================

async function calculatePipelineMetrics(supabase: any, period: any) {
  const { data: leads, error } = await supabase
    .from('leads')
    .select('*')
    .gte('created_at', period.start)
    .lte('created_at', period.end);

  if (error) throw error;

  const newLeads = leads?.length || 0;
  const qualified = leads?.filter((l: any) =>
    ['qualified', 'nurturing', 'opportunity', 'converted'].includes(l.status)
  ).length || 0;
  const opportunities = leads?.filter((l: any) =>
    ['opportunity', 'converted'].includes(l.status)
  ).length || 0;
  const conversions = leads?.filter((l: any) => l.status === 'converted').length || 0;

  // Calculate velocity
  const convertedLeads = leads?.filter((l: any) => l.converted_at) || [];
  let velocityDays = 0;
  if (convertedLeads.length > 0) {
    const totalDays = convertedLeads.reduce((sum: number, lead: any) => {
      const created = new Date(lead.created_at).getTime();
      const converted = new Date(lead.converted_at).getTime();
      return sum + (converted - created) / (1000 * 60 * 60 * 24);
    }, 0);
    velocityDays = totalDays / convertedLeads.length;
  }

  return {
    new_leads: newLeads,
    qualified_leads: qualified,
    opportunities,
    conversions,
    lead_to_qualified_rate: newLeads > 0 ? (qualified / newLeads) * 100 : 0,
    qualified_to_opportunity_rate: qualified > 0 ? (opportunities / qualified) * 100 : 0,
    opportunity_to_conversion_rate: opportunities > 0 ? (conversions / opportunities) * 100 : 0,
    overall_conversion_rate: newLeads > 0 ? (conversions / newLeads) * 100 : 0,
    avg_pipeline_velocity_days: velocityDays,
  };
}

async function calculateOutreachMetrics(supabase: any, period: any) {
  const { data: emails, error } = await supabase
    .from('email_logs')
    .select('*')
    .gte('sent_at', period.start)
    .lte('sent_at', period.end);

  if (error) throw error;

  const sent = emails?.length || 0;
  const delivered = emails?.filter((e: any) => e.status === 'delivered' || e.delivered_at).length || 0;
  const opened = emails?.filter((e: any) => e.opened_at).length || 0;
  const clicked = emails?.filter((e: any) => e.clicked_at).length || 0;
  const replied = emails?.filter((e: any) => e.replied_at).length || 0;
  const bounced = emails?.filter((e: any) => e.status === 'bounced').length || 0;
  const unsubscribed = emails?.filter((e: any) => e.status === 'unsubscribed').length || 0;

  return {
    emails_sent: sent,
    delivery_rate: sent > 0 ? (delivered / sent) * 100 : 0,
    open_rate: delivered > 0 ? (opened / delivered) * 100 : 0,
    click_rate: delivered > 0 ? (clicked / delivered) * 100 : 0,
    reply_rate: delivered > 0 ? (replied / delivered) * 100 : 0,
    bounce_rate: sent > 0 ? (bounced / sent) * 100 : 0,
    unsubscribe_rate: delivered > 0 ? (unsubscribed / delivered) * 100 : 0,
  };
}

async function calculateContentMetrics(supabase: any, period: any) {
  const { data: content, error } = await supabase
    .from('content_performance')
    .select('*')
    .gte('measured_at', period.start)
    .lte('measured_at', period.end);

  if (error) throw error;

  const totalViews = content?.reduce((sum: number, c: any) => sum + (c.views || 0), 0) || 0;
  const totalLeads = content?.reduce((sum: number, c: any) => sum + (c.leads_generated || 0), 0) || 0;
  const totalConversions = content?.reduce((sum: number, c: any) => sum + (c.conversions || 0), 0) || 0;

  return {
    total_content_pieces: content?.length || 0,
    total_views: totalViews,
    total_leads_generated: totalLeads,
    total_conversions: totalConversions,
    avg_conversion_rate: totalViews > 0 ? (totalConversions / totalViews) * 100 : 0,
    top_performers: content
      ?.sort((a: any, b: any) => b.leads_generated - a.leads_generated)
      .slice(0, 5)
      .map((c: any) => ({
        title: c.title,
        type: c.type,
        leads: c.leads_generated,
        conversions: c.conversions,
      })) || [],
  };
}

async function calculateLTVMetrics(supabase: any, period: any) {
  const { data: ltvData, error } = await supabase
    .from('ltv_analysis')
    .select('*')
    .gte('measured_at', period.start)
    .lte('measured_at', period.end)
    .order('measured_at', { ascending: false })
    .limit(1);

  if (error) throw error;

  if (!ltvData || ltvData.length === 0) {
    return {
      avg_ltv: 0,
      avg_cac: 0,
      ltv_cac_ratio: 0,
      segments: [],
    };
  }

  // Get latest LTV analysis
  const latest = ltvData[0];

  return {
    avg_ltv: latest.avg_ltv,
    avg_cac: latest.avg_cac,
    ltv_cac_ratio: latest.ltv_cac_ratio,
    avg_tenure_months: latest.avg_tenure_months,
    churn_rate: latest.churn_rate,
  };
}

async function calculateCampaignMetrics(supabase: any, period: any) {
  const { data: campaigns, error } = await supabase
    .from('campaigns')
    .select(`
      *,
      campaign_performance(*)
    `)
    .gte('start_date', period.start)
    .lte('end_date', period.end);

  if (error) throw error;

  const activeCampaigns = campaigns?.filter((c: any) => c.status === 'active').length || 0;
  const totalSpent = campaigns?.reduce((sum: number, c: any) => sum + (c.spent || 0), 0) || 0;
  const totalLeads = campaigns?.reduce((sum: number, c: any) => {
    const latestPerf = c.campaign_performance?.[c.campaign_performance.length - 1];
    return sum + (latestPerf?.leads || 0);
  }, 0) || 0;

  return {
    total_campaigns: campaigns?.length || 0,
    active_campaigns: activeCampaigns,
    total_spent: totalSpent,
    total_leads: totalLeads,
    avg_cac: totalLeads > 0 ? totalSpent / totalLeads : 0,
  };
}

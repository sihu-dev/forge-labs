/**
 * Marketing Dashboard - Supabase Query Functions
 *
 * Reusable query functions for fetching marketing metrics
 */

import { createClient } from '@supabase/supabase-js';
import type {
  IPipelineMetrics,
  IOutreachPerformance,
  ILead,
  IEmailLog,
  ICampaign,
  IAnomalyAlert,
  ISystemHealth,
} from '@forge/types/src/marketing/index.js';
import {
  aggregatePipelineMetrics,
  aggregateOutreachPerformance,
  analyzeBestSendTimes,
} from '@forge/utils/src/marketing-metrics';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================
// Pipeline Queries
// ============================================

/**
 * Fetch pipeline metrics for a given period
 */
export async function fetchPipelineMetrics(
  period: { start: string; end: string }
): Promise<IPipelineMetrics> {
  const { data: leads, error } = await supabase
    .from('leads')
    .select('*')
    .gte('created_at', period.start)
    .lte('created_at', period.end);

  if (error) throw error;

  const metrics = aggregatePipelineMetrics(
    leads as any[],
    period
  );

  return {
    period,
    ...metrics,
  };
}

/**
 * Fetch leads by source
 */
export async function fetchLeadsBySource(
  period: { start: string; end: string }
) {
  const { data, error } = await supabase
    .from('leads')
    .select('source, status')
    .gte('created_at', period.start)
    .lte('created_at', period.end);

  if (error) throw error;

  // Group by source
  const sourceMap = new Map<string, { leads: number; conversions: number }>();

  data?.forEach((lead) => {
    const source = lead.source || 'unknown';
    const stats = sourceMap.get(source) || { leads: 0, conversions: 0 };

    stats.leads++;
    if (lead.status === 'converted') {
      stats.conversions++;
    }

    sourceMap.set(source, stats);
  });

  return Array.from(sourceMap.entries()).map(([source, stats]) => ({
    source,
    leads: stats.leads,
    conversions: stats.conversions,
    conversionRate: stats.leads > 0 ? (stats.conversions / stats.leads) * 100 : 0,
  }));
}

/**
 * Fetch lead activities for a specific lead
 */
export async function fetchLeadActivities(leadId: string) {
  const { data, error } = await supabase
    .from('lead_activities')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data;
}

// ============================================
// Outreach Queries
// ============================================

/**
 * Fetch outreach performance metrics
 */
export async function fetchOutreachMetrics(
  period: { start: string; end: string }
): Promise<IOutreachPerformance> {
  const { data: emails, error } = await supabase
    .from('email_logs')
    .select('*')
    .gte('sent_at', period.start)
    .lte('sent_at', period.end);

  if (error) throw error;

  const metrics = aggregateOutreachPerformance(
    emails as any[],
    period
  );

  // Analyze best send times
  const validEmails = emails?.filter((e) => e.sent_at) || [];
  const bestSendTimes = analyzeBestSendTimes(validEmails as any[]);

  return {
    period,
    ...metrics,
    best_send_times: bestSendTimes.slice(0, 10), // Top 10
  };
}

/**
 * Fetch email sequences with performance stats
 */
export async function fetchEmailSequences() {
  const { data, error } = await supabase
    .from('email_sequences')
    .select(`
      *,
      sequence_steps(*)
    `)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data;
}

/**
 * Fetch email logs for a specific lead
 */
export async function fetchEmailLogsForLead(leadId: string) {
  const { data, error } = await supabase
    .from('email_logs')
    .select('*')
    .eq('lead_id', leadId)
    .order('sent_at', { ascending: false });

  if (error) throw error;

  return data;
}

// ============================================
// Campaign Queries
// ============================================

/**
 * Fetch active campaigns with performance
 */
export async function fetchActiveCampaigns() {
  const { data, error } = await supabase
    .from('campaigns')
    .select(`
      *,
      campaign_performance(*)
    `)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data;
}

/**
 * Fetch campaign performance over time
 */
export async function fetchCampaignPerformance(
  campaignId: string,
  period: { start: string; end: string }
) {
  const { data, error } = await supabase
    .from('campaign_performance')
    .select('*')
    .eq('campaign_id', campaignId)
    .gte('measured_at', period.start)
    .lte('measured_at', period.end)
    .order('measured_at', { ascending: true });

  if (error) throw error;

  return data;
}

// ============================================
// Content Queries
// ============================================

/**
 * Fetch content performance
 */
export async function fetchContentPerformance(
  period: { start: string; end: string }
) {
  const { data, error } = await supabase
    .from('content_performance')
    .select('*')
    .gte('measured_at', period.start)
    .lte('measured_at', period.end)
    .order('leads_generated', { ascending: false });

  if (error) throw error;

  return data;
}

// ============================================
// Real-time Monitoring Queries
// ============================================

/**
 * Fetch system health status
 */
export async function fetchSystemHealth(): Promise<ISystemHealth | null> {
  const { data, error } = await supabase
    .from('system_health')
    .select('*')
    .order('checked_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error('Error fetching system health:', error);
    return null;
  }

  return data;
}

/**
 * Fetch anomaly alerts
 */
export async function fetchAnomalyAlerts(
  acknowledged?: boolean
): Promise<IAnomalyAlert[]> {
  let query = supabase
    .from('anomaly_alerts')
    .select('*')
    .order('detected_at', { ascending: false })
    .limit(50);

  if (acknowledged !== undefined) {
    query = query.eq('acknowledged', acknowledged);
  }

  const { data, error } = await query;

  if (error) throw error;

  return data || [];
}

/**
 * Acknowledge an anomaly alert
 */
export async function acknowledgeAlert(alertId: string, userId: string) {
  const { error } = await supabase
    .from('anomaly_alerts')
    .update({
      acknowledged: true,
      acknowledged_at: new Date().toISOString(),
      acknowledged_by: userId,
    })
    .eq('id', alertId);

  if (error) throw error;
}

// ============================================
// Analytics Aggregation Queries
// ============================================

/**
 * Fetch daily metrics rollup
 */
export async function fetchDailyMetrics(
  period: { start: string; end: string }
) {
  const { data, error } = await supabase
    .from('daily_metrics')
    .select('*')
    .gte('date', period.start.split('T')[0])
    .lte('date', period.end.split('T')[0])
    .order('date', { ascending: true });

  if (error) throw error;

  return data;
}

/**
 * Fetch email performance daily rollup
 */
export async function fetchEmailPerformanceDaily(
  period: { start: string; end: string }
) {
  const { data, error } = await supabase
    .from('email_performance_daily')
    .select('*')
    .gte('date', period.start.split('T')[0])
    .lte('date', period.end.split('T')[0])
    .order('date', { ascending: true });

  if (error) throw error;

  return data;
}

// ============================================
// Real-time Subscriptions
// ============================================

/**
 * Subscribe to anomaly alerts in real-time
 */
export function subscribeToAnomalyAlerts(
  callback: (alert: IAnomalyAlert) => void
) {
  const channel = supabase
    .channel('anomaly-alerts')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'anomaly_alerts',
      },
      (payload) => {
        callback(payload.new as IAnomalyAlert);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to system health updates
 */
export function subscribeToSystemHealth(
  callback: (health: ISystemHealth) => void
) {
  const channel = supabase
    .channel('system-health')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'system_health',
      },
      (payload) => {
        callback(payload.new as ISystemHealth);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to lead activities
 */
export function subscribeToLeadActivities(
  leadId: string,
  callback: (activity: any) => void
) {
  const channel = supabase
    .channel(`lead-activities-${leadId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'lead_activities',
        filter: `lead_id=eq.${leadId}`,
      },
      (payload) => {
        callback(payload.new);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// ============================================
// Utility Functions
// ============================================

/**
 * Refresh materialized views
 */
export async function refreshMaterializedViews() {
  const { error } = await supabase.rpc('refresh_materialized_views');

  if (error) throw error;
}

/**
 * Export dashboard data to CSV
 */
export async function exportDashboardData(
  period: { start: string; end: string }
) {
  // Fetch all data
  const [pipeline, outreach, content, campaigns] = await Promise.all([
    fetchPipelineMetrics(period),
    fetchOutreachMetrics(period),
    fetchContentPerformance(period),
    fetchActiveCampaigns(),
  ]);

  // Convert to CSV format (simple implementation)
  const csv = [
    'Metric,Value',
    `New Leads,${pipeline.new_leads}`,
    `Conversions,${pipeline.conversions}`,
    `Conversion Rate,${pipeline.overall_conversion_rate.toFixed(2)}%`,
    `Emails Sent,${outreach.emails_sent}`,
    `Open Rate,${outreach.open_rate.toFixed(2)}%`,
    `Reply Rate,${outreach.reply_rate.toFixed(2)}%`,
    `Content Pieces,${content?.length || 0}`,
    `Active Campaigns,${campaigns?.length || 0}`,
  ].join('\n');

  return csv;
}

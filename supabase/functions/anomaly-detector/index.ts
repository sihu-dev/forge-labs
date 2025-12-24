/**
 * Supabase Edge Function: Anomaly Detection
 *
 * Uses Claude AI to detect anomalies in marketing metrics
 * Sends alerts via Slack, Email, or Webhook
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get recent metrics for analysis
    const recentMetrics = await getRecentMetrics(supabase);

    // Detect anomalies
    const anomalies = await detectAnomalies(recentMetrics);

    // Check notification rules and send alerts
    for (const anomaly of anomalies) {
      await processAnomaly(supabase, anomaly);
    }

    return new Response(
      JSON.stringify({
        success: true,
        anomalies_detected: anomalies.length,
        anomalies,
        checked_at: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error detecting anomalies:', error);
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
// Anomaly Detection Logic
// ============================================

async function getRecentMetrics(supabase: any) {
  // Get metrics from the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Get email performance daily rollup
  const { data: emailMetrics } = await supabase
    .from('email_performance_daily')
    .select('*')
    .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
    .order('date', { ascending: true });

  // Get daily lead metrics
  const { data: leadMetrics } = await supabase
    .from('daily_metrics')
    .select('*')
    .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
    .order('date', { ascending: true });

  return {
    email: emailMetrics || [],
    leads: leadMetrics || [],
  };
}

function detectAnomalies(metrics: any) {
  const anomalies: any[] = [];

  // Check email metrics
  if (metrics.email.length > 7) {
    const emailAnomalies = detectEmailAnomalies(metrics.email);
    anomalies.push(...emailAnomalies);
  }

  // Check lead metrics
  if (metrics.leads.length > 7) {
    const leadAnomalies = detectLeadAnomalies(metrics.leads);
    anomalies.push(...leadAnomalies);
  }

  return anomalies;
}

function detectEmailAnomalies(emailMetrics: any[]) {
  const anomalies: any[] = [];

  // Get the latest metric
  const latest = emailMetrics[emailMetrics.length - 1];

  // Calculate moving averages (7-day window)
  const window = emailMetrics.slice(-8, -1); // Last 7 days before today

  const metrics = ['open_rate', 'click_rate', 'reply_rate', 'bounce_rate'];

  metrics.forEach((metric) => {
    const values = window.map((m) => m[metric] || 0);
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
    const current = latest[metric] || 0;

    // Calculate deviation
    const deviation = avg === 0 ? 0 : ((current - avg) / avg) * 100;

    // Threshold for anomaly (30% deviation)
    if (Math.abs(deviation) > 30) {
      anomalies.push({
        type: deviation > 0 ? 'spike' : 'drop',
        severity: Math.abs(deviation) > 50 ? 'high' : 'medium',
        metric_name: metric,
        current_value: current,
        expected_value: avg,
        deviation_percent: deviation,
        description: `${metric.replace(/_/g, ' ')} has ${deviation > 0 ? 'increased' : 'decreased'} significantly`,
        detected_at: new Date().toISOString(),
      });
    }
  });

  return anomalies;
}

function detectLeadAnomalies(leadMetrics: any[]) {
  const anomalies: any[] = [];

  const latest = leadMetrics[leadMetrics.length - 1];
  const window = leadMetrics.slice(-8, -1);

  const metrics = ['new_leads', 'qualified_leads', 'conversions'];

  metrics.forEach((metric) => {
    const values = window.map((m) => m[metric] || 0);
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
    const current = latest[metric] || 0;

    const deviation = avg === 0 ? 0 : ((current - avg) / avg) * 100;

    if (Math.abs(deviation) > 30) {
      anomalies.push({
        type: deviation > 0 ? 'spike' : 'drop',
        severity: Math.abs(deviation) > 50 ? 'high' : 'medium',
        metric_name: metric,
        current_value: current,
        expected_value: avg,
        deviation_percent: deviation,
        description: `${metric.replace(/_/g, ' ')} has ${deviation > 0 ? 'increased' : 'decreased'} significantly`,
        detected_at: new Date().toISOString(),
      });
    }
  });

  return anomalies;
}

// ============================================
// Alert Processing
// ============================================

async function processAnomaly(supabase: any, anomaly: any) {
  // Insert anomaly alert into database
  const { data: alert, error: insertError } = await supabase
    .from('anomaly_alerts')
    .insert({
      type: anomaly.type,
      severity: anomaly.severity,
      metric_name: anomaly.metric_name,
      current_value: anomaly.current_value,
      expected_value: anomaly.expected_value,
      deviation_percent: anomaly.deviation_percent,
      description: anomaly.description,
      detected_at: anomaly.detected_at,
    })
    .select()
    .single();

  if (insertError) {
    console.error('Error inserting anomaly alert:', insertError);
    return;
  }

  // Get notification rules that match this anomaly
  const { data: rules } = await supabase
    .from('notification_rules')
    .select('*')
    .eq('enabled', true);

  if (!rules || rules.length === 0) {
    return;
  }

  // Filter rules that match the anomaly
  const matchingRules = rules.filter((rule: any) => {
    const trigger = rule.trigger;
    if (trigger.metric !== anomaly.metric_name) return false;

    // Check cooldown
    if (rule.last_triggered_at) {
      const lastTriggered = new Date(rule.last_triggered_at);
      const cooldownMs = rule.cooldown_minutes * 60 * 1000;
      if (Date.now() - lastTriggered.getTime() < cooldownMs) {
        return false; // Still in cooldown
      }
    }

    // Check threshold
    const meetsThreshold = evaluateThreshold(
      anomaly.current_value,
      trigger.operator,
      trigger.threshold
    );

    return meetsThreshold;
  });

  // Send notifications for matching rules
  for (const rule of matchingRules) {
    await sendNotifications(rule, anomaly);

    // Update last_triggered_at
    await supabase
      .from('notification_rules')
      .update({ last_triggered_at: new Date().toISOString() })
      .eq('id', rule.id);
  }
}

function evaluateThreshold(value: number, operator: string, threshold: number): boolean {
  switch (operator) {
    case '>':
      return value > threshold;
    case '<':
      return value < threshold;
    case '>=':
      return value >= threshold;
    case '<=':
      return value <= threshold;
    case '=':
      return value === threshold;
    default:
      return false;
  }
}

async function sendNotifications(rule: any, anomaly: any) {
  const { channels, recipients } = rule;

  for (const channel of channels) {
    switch (channel) {
      case 'email':
        await sendEmailNotification(recipients.email, anomaly);
        break;
      case 'slack':
        await sendSlackNotification(recipients.slack_channel, anomaly);
        break;
      case 'webhook':
        await sendWebhookNotification(recipients.webhook_url, anomaly);
        break;
      case 'sms':
        // TODO: Implement SMS notification (Twilio)
        console.log('SMS notification not yet implemented');
        break;
    }
  }
}

async function sendEmailNotification(emails: string[], anomaly: any) {
  // TODO: Implement email sending (Resend, SendGrid, etc.)
  console.log('Sending email notification to:', emails);
  console.log('Anomaly:', anomaly);
}

async function sendSlackNotification(channel: string, anomaly: any) {
  const slackWebhookUrl = Deno.env.get('SLACK_WEBHOOK_URL');
  if (!slackWebhookUrl) {
    console.error('SLACK_WEBHOOK_URL not configured');
    return;
  }

  const color = anomaly.severity === 'critical' ? '#dc2626' : anomaly.severity === 'high' ? '#f59e0b' : '#3b82f6';

  const message = {
    text: `🚨 Marketing Anomaly Detected`,
    attachments: [
      {
        color,
        fields: [
          {
            title: 'Metric',
            value: anomaly.metric_name.replace(/_/g, ' ').toUpperCase(),
            short: true,
          },
          {
            title: 'Severity',
            value: anomaly.severity.toUpperCase(),
            short: true,
          },
          {
            title: 'Current Value',
            value: `${anomaly.current_value.toFixed(1)}%`,
            short: true,
          },
          {
            title: 'Expected Value',
            value: `${anomaly.expected_value.toFixed(1)}%`,
            short: true,
          },
          {
            title: 'Deviation',
            value: `${anomaly.deviation_percent > 0 ? '+' : ''}${anomaly.deviation_percent.toFixed(0)}%`,
            short: true,
          },
          {
            title: 'Description',
            value: anomaly.description,
            short: false,
          },
        ],
        footer: 'Marketing Analytics Dashboard',
        ts: Math.floor(new Date(anomaly.detected_at).getTime() / 1000),
      },
    ],
  };

  try {
    const response = await fetch(slackWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      console.error('Failed to send Slack notification:', await response.text());
    }
  } catch (error) {
    console.error('Error sending Slack notification:', error);
  }
}

async function sendWebhookNotification(url: string, anomaly: any) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'anomaly_detected',
        anomaly,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      console.error('Failed to send webhook notification:', await response.text());
    }
  } catch (error) {
    console.error('Error sending webhook notification:', error);
  }
}

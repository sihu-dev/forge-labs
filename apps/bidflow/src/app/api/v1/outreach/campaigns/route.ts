/**
 * BIDFLOW API - Outreach Campaigns
 *
 * POST /api/v1/outreach/campaigns - Create and launch campaign
 * GET  /api/v1/outreach/campaigns - List campaigns
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createOutreachOrchestrator,
  OutreachOrchestrator,
  type IOrchestratorConfig,
} from '@/lib/outreach/sequence-orchestrator';
import type { ILead } from '@forge/types/outreach';

// ============================================
// POST - Create Campaign
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      name,
      target_persona,
      leads,
      channels = ['email'],
      ai_personalization_level = 'medium',
    } = body;

    // Validate inputs
    if (!name || !target_persona || !leads || leads.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: name, target_persona, leads' },
        { status: 400 }
      );
    }

    // Get configuration from environment
    const config: IOrchestratorConfig = {
      claude_api_key: process.env.CLAUDE_API_KEY || '',
      channels: {
        email: {
          config: {
            channel: 'email',
            provider: 'instantly',
            status: 'active',
            credentials: {},
            rate_limits: {
              max_per_hour: 50,
              max_per_day: 200,
              min_delay_seconds: 30,
              current_usage: 0,
              reset_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            },
            settings: {
              enabled: true,
              priority: 1,
              business_hours_only: true,
              timezone: 'America/New_York',
            },
          },
          provider: {
            api_key: process.env.INSTANTLY_API_KEY || '',
            workspace_id: process.env.INSTANTLY_WORKSPACE_ID || '',
            campaign_id: process.env.INSTANTLY_CAMPAIGN_ID,
            from_email: process.env.FROM_EMAIL || 'outreach@example.com',
            from_name: process.env.FROM_NAME || 'Your Company',
            tracking_enabled: true,
            warmup_enabled: false,
          },
        },
      },
    };

    // Initialize orchestrator
    const orchestrator = createOutreachOrchestrator(config);

    // Create sequence from template
    const sequence = OutreachOrchestrator.createSequenceTemplate({
      name: `${name} Sequence`,
      target_persona,
      channels,
      ai_personalization_level,
    });

    // Launch campaign
    const result = await orchestrator.launchCampaign({
      name,
      sequence,
      leads: leads as ILead[],
    });

    return NextResponse.json({
      success: true,
      campaign_id: result.campaign_id,
      executions_scheduled: result.executions_scheduled,
      sequence_id: sequence.id,
      message: `Campaign "${name}" launched successfully`,
    });
  } catch (error) {
    console.error('[Outreach API]', error);
    return NextResponse.json(
      { error: 'Failed to create campaign', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// ============================================
// GET - List Campaigns
// ============================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';

    // In production, fetch from database
    // For now, return mock data
    const campaigns = [
      {
        id: 'campaign-1',
        name: 'Manufacturing Decision Makers Q1 2025',
        sequence_id: 'sequence-1',
        status: 'running',
        total_leads: 150,
        active_leads: 120,
        performance: {
          emails_sent: 450,
          open_rate: 52.3,
          reply_rate: 8.7,
          meetings_scheduled: 12,
        },
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'campaign-2',
        name: 'E-commerce Founders Outreach',
        sequence_id: 'sequence-2',
        status: 'paused',
        total_leads: 85,
        active_leads: 60,
        performance: {
          emails_sent: 210,
          open_rate: 48.1,
          reply_rate: 6.2,
          meetings_scheduled: 5,
        },
        created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    const filteredCampaigns =
      status === 'all' ? campaigns : campaigns.filter((c) => c.status === status);

    return NextResponse.json({
      success: true,
      campaigns: filteredCampaigns,
      total: filteredCampaigns.length,
    });
  } catch (error) {
    console.error('[Outreach API]', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}

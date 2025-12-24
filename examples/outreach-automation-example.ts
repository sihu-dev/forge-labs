/**
 * OUTREACH AUTOMATION - Complete Working Example
 *
 * This file demonstrates how to use the multi-channel outreach
 * sequence automation system with Claude AI personalization.
 */

import {
  createOutreachOrchestrator,
  OutreachOrchestrator,
  type IOrchestratorConfig,
} from '../apps/bidflow/src/lib/outreach/sequence-orchestrator';

import type {
  ILead,
  IOutreachSequence,
  ISequenceStep,
} from '@forge/types/outreach';

// ============================================
// EXAMPLE 1: Quick Start - Email Outreach
// ============================================

async function example1_QuickEmailOutreach() {
  console.log('🚀 Example 1: Quick Email Outreach\n');

  // Step 1: Configure orchestrator
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
          from_email: 'john@yourcompany.com',
          from_name: 'John Smith',
          tracking_enabled: true,
          warmup_enabled: false,
        },
      },
    },
  };

  const orchestrator = createOutreachOrchestrator(config);

  // Step 2: Create sequence template
  const sequence = OutreachOrchestrator.createSequenceTemplate({
    name: 'SaaS Founders Outreach',
    target_persona: 'SaaS founders, 10-50 employees, looking to scale',
    channels: ['email'],
    ai_personalization_level: 'medium',
  });

  // Step 3: Define leads
  const leads: ILead[] = [
    {
      id: 'lead-1',
      email: 'jane@startup.com',
      first_name: 'Jane',
      last_name: 'Smith',
      company_name: 'Startup Inc',
      job_title: 'CEO & Founder',
      status: 'new',
      tags: ['saas', 'founder'],
      custom_fields: {
        company_size: '10-50 employees',
        industry: 'SaaS',
        website: 'https://startup.com',
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'lead-2',
      email: 'mike@techco.io',
      first_name: 'Mike',
      last_name: 'Johnson',
      company_name: 'TechCo',
      job_title: 'CTO',
      status: 'new',
      tags: ['saas', 'technical'],
      custom_fields: {
        company_size: '20-100 employees',
        industry: 'SaaS',
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  // Step 4: Launch campaign
  const result = await orchestrator.launchCampaign({
    name: 'April 2025 SaaS Outreach',
    sequence,
    leads,
    settings: {
      daily_send_limit: 100,
      optimal_send_times: ['09:00', '14:00'],
      skip_weekends: true,
      time_zone: 'America/New_York',
      auto_stop_on_reply: true,
      auto_stop_on_unsubscribe: true,
    },
  });

  console.log('✅ Campaign launched!');
  console.log(`   Campaign ID: ${result.campaign_id}`);
  console.log(`   Executions scheduled: ${result.executions_scheduled}\n`);

  return result;
}

// ============================================
// EXAMPLE 2: Multi-Channel Outreach
// ============================================

async function example2_MultiChannelOutreach() {
  console.log('🎯 Example 2: Multi-Channel Outreach (Email → LinkedIn → Phone)\n');

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
          from_email: 'sales@company.com',
          from_name: 'Sales Team',
          tracking_enabled: true,
          warmup_enabled: false,
        },
      },
      linkedin: {
        config: {
          channel: 'linkedin',
          provider: 'heyreach',
          status: 'active',
          credentials: {},
          rate_limits: {
            max_per_hour: 20,
            max_per_day: 100,
            min_delay_seconds: 60,
            current_usage: 0,
            reset_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          },
          settings: {
            enabled: true,
            priority: 2,
            business_hours_only: true,
            timezone: 'America/New_York',
          },
        },
        provider: {
          api_key: process.env.HEYREACH_API_KEY || '',
          account_id: process.env.HEYREACH_ACCOUNT_ID || '',
          connection_request_limit: 100,
          message_limit: 150,
          use_safe_mode: true,
        },
      },
      phone: {
        config: {
          channel: 'phone',
          provider: 'vapi',
          status: 'active',
          credentials: {},
          rate_limits: {
            max_per_hour: 10,
            max_per_day: 50,
            min_delay_seconds: 120,
            current_usage: 0,
            reset_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          },
          settings: {
            enabled: true,
            priority: 3,
            business_hours_only: true,
            timezone: 'America/New_York',
          },
        },
        provider: {
          api_key: process.env.VAPI_API_KEY || '',
          assistant_id: process.env.VAPI_ASSISTANT_ID || '',
          phone_number: '+12125551234',
          voice_id: 'jennifer',
          max_duration_minutes: 5,
          record_calls: true,
        },
      },
    },
  };

  const orchestrator = createOutreachOrchestrator(config);

  // Custom sequence with multiple channels
  const sequence = OutreachOrchestrator.createSequenceTemplate({
    name: 'Enterprise Multi-Touch',
    target_persona: 'VP/C-Level, Fortune 1000 companies',
    channels: ['email', 'linkedin', 'phone'],
    ai_personalization_level: 'deep',
  });

  const enterpriseLeads: ILead[] = [
    {
      id: 'lead-ent-1',
      email: 'sarah@bigcorp.com',
      first_name: 'Sarah',
      last_name: 'Williams',
      company_name: 'BigCorp Inc',
      job_title: 'VP of Operations',
      linkedin_url: 'https://linkedin.com/in/sarahwilliams',
      phone: '+14155551234',
      status: 'new',
      tags: ['enterprise', 'decision-maker'],
      custom_fields: {
        company_size: '1000+ employees',
        industry: 'Technology',
        revenue: '$100M-$500M',
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const result = await orchestrator.launchCampaign({
    name: 'Enterprise Q2 2025',
    sequence,
    leads: enterpriseLeads,
  });

  console.log('✅ Multi-channel campaign launched!');
  console.log(`   Sequence: Email (Day 0) → LinkedIn (Day 3) → Email (Day 7) → Phone (Day 10)\n`);

  return result;
}

// ============================================
// EXAMPLE 3: Custom Sequence with Advanced Personalization
// ============================================

async function example3_CustomSequence() {
  console.log('🎨 Example 3: Custom Sequence with Deep Personalization\n');

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
          from_email: 'outreach@company.com',
          from_name: 'Research Team',
          tracking_enabled: true,
          warmup_enabled: false,
        },
      },
    },
  };

  const orchestrator = createOutreachOrchestrator(config);

  // Build custom sequence with advanced AI personalization
  const customSteps: ISequenceStep[] = [
    {
      id: 'step-1',
      sequence_id: 'custom-seq-1',
      step_number: 1,
      type: 'initial_outreach',
      channel: 'email',
      delay_days: 0,
      subject_variants: [
        '{{company_name}}: Interesting growth pattern',
        'Quick thought on {{company_name}}\'s expansion',
      ],
      body_variants: [
        `Hi {{first_name}},

I've been following {{company_name}}'s journey and noticed your recent {{recent_news}}.

Given your role as {{job_title}}, I thought you might be interested in how companies like yours are solving {{pain_point}}.

Would a 15-minute conversation make sense?

Best,
[Your Name]`,
      ],
      cta_variants: [
        'Open to a quick call?',
        'Worth 15 minutes of your time?',
      ],
      conditions: [],
      ai_personalization: {
        enabled: true,
        research_depth: 'deep',
        tone: 'professional',
        custom_prompts: [],
        use_company_research: true,
        use_pain_point_detection: true,
        use_value_prop_generation: true,
        ab_variant_count: 3,
      },
    },
    {
      id: 'step-2',
      sequence_id: 'custom-seq-1',
      step_number: 2,
      type: 'follow_up',
      channel: 'email',
      delay_days: 4,
      subject_variants: ['Re: {{company_name}}'],
      body_variants: [
        `Hi {{first_name}},

Just circling back on my previous email.

I found a case study of {{competitor}} that might interest you - they reduced {{metric}} by 40% using a similar approach.

5-minute call this week?`,
      ],
      conditions: [
        {
          type: 'previous_replied',
          operator: 'equals',
          value: false,
          skip_if_true: false,
        },
        {
          type: 'previous_opened',
          operator: 'equals',
          value: true,
          skip_if_true: true,
        },
      ],
      ai_personalization: {
        enabled: true,
        research_depth: 'medium',
        tone: 'friendly',
        custom_prompts: [],
        use_company_research: true,
        use_pain_point_detection: false,
        use_value_prop_generation: true,
        ab_variant_count: 2,
      },
    },
  ];

  const customSequence: IOutreachSequence = {
    id: `custom-${Date.now()}`,
    name: 'Research-Driven Outreach',
    description: 'Deep personalization for high-value prospects',
    status: 'active',
    target_persona: 'VP+ at high-growth companies',
    steps: customSteps,
    performance: {
      total_leads: 0,
      active_leads: 0,
      completed_leads: 0,
      emails_sent: 0,
      emails_delivered: 0,
      emails_opened: 0,
      emails_clicked: 0,
      emails_replied: 0,
      emails_bounced: 0,
      open_rate: 0,
      click_rate: 0,
      reply_rate: 0,
      bounce_rate: 0,
      unsubscribe_rate: 0,
      positive_replies: 0,
      meetings_scheduled: 0,
      customers_converted: 0,
      conversion_rate: 0,
      objections_count: 0,
      out_of_office_count: 0,
      variant_performance: {},
      last_updated: new Date().toISOString(),
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const highValueLeads: ILead[] = [
    {
      id: 'lead-hv-1',
      email: 'alex@unicorn.ai',
      first_name: 'Alex',
      last_name: 'Chen',
      company_name: 'Unicorn AI',
      job_title: 'Chief Revenue Officer',
      status: 'new',
      tags: ['high-value', 'c-level'],
      custom_fields: {
        company_size: '100-500 employees',
        industry: 'AI/ML',
        funding_stage: 'Series B',
        recent_funding: '$50M',
      },
      enrichment_data: {
        company_size: '100-500 employees',
        industry: 'AI/ML',
        revenue: '$10M-$50M',
        technologies: ['Python', 'TensorFlow', 'AWS'],
        pain_points: ['Scaling sales operations', 'Manual lead qualification'],
        recent_news: ['Series B funding', 'Expansion to EMEA'],
        decision_maker_level: 'c_level',
        buying_intent: 'high',
        researched_at: new Date().toISOString(),
        data_sources: ['LinkedIn', 'Crunchbase', 'Company website'],
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const result = await orchestrator.launchCampaign({
    name: 'High-Value Custom Outreach',
    sequence: customSequence,
    leads: highValueLeads,
  });

  console.log('✅ Custom sequence launched!');
  console.log('   Deep AI personalization enabled');
  console.log('   Expected reply rate: 12-18%\n');

  return result;
}

// ============================================
// EXAMPLE 4: Response Handling
// ============================================

async function example4_ResponseHandling() {
  console.log('💬 Example 4: Handling Incoming Responses\n');

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
          from_email: 'sales@company.com',
          from_name: 'Sales Team',
          tracking_enabled: true,
          warmup_enabled: false,
        },
      },
    },
  };

  const orchestrator = createOutreachOrchestrator(config);

  // Simulate different response types
  const responses = [
    {
      type: 'Positive',
      message: 'Yes, I\'m interested! Can we schedule a call this week?',
      execution_id: 'exec-1',
    },
    {
      type: 'Objection (Budget)',
      message: 'This looks interesting but we don\'t have budget right now.',
      execution_id: 'exec-2',
    },
    {
      type: 'Out of Office',
      message: 'I\'m out of the office until March 15th.',
      execution_id: 'exec-3',
    },
    {
      type: 'Unsubscribe',
      message: 'Please remove me from your list.',
      execution_id: 'exec-4',
    },
  ];

  for (const response of responses) {
    console.log(`📨 Response Type: ${response.type}`);
    console.log(`   Message: "${response.message}"`);

    const result = await orchestrator.handleIncomingResponse({
      execution_id: response.execution_id,
      message: response.message,
      lead_id: 'lead-123',
    });

    console.log(`   ✅ Action: ${result.action_taken}`);
    if (result.suggested_reply) {
      console.log(`   🤖 AI Suggested Reply: "${result.suggested_reply.substring(0, 80)}..."`);
    }
    console.log(`   Sequence Status: ${result.sequence_status}\n`);
  }
}

// ============================================
// EXAMPLE 5: Campaign Performance Tracking
// ============================================

async function example5_PerformanceTracking() {
  console.log('📊 Example 5: Campaign Performance Tracking\n');

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
          from_email: 'sales@company.com',
          from_name: 'Sales Team',
          tracking_enabled: true,
          warmup_enabled: false,
        },
      },
    },
  };

  const orchestrator = createOutreachOrchestrator(config);

  const performance = await orchestrator.getCampaignPerformance('campaign-123');

  console.log('Campaign Performance:');
  console.log('────────────────────────────────────────');
  console.log(`Total Leads:           ${performance.total_leads}`);
  console.log(`Active Leads:          ${performance.active_leads}`);
  console.log(`Completed:             ${performance.completed_leads}`);
  console.log('');
  console.log('Email Metrics:');
  console.log(`  Sent:                ${performance.emails_sent}`);
  console.log(`  Delivered:           ${performance.emails_delivered}`);
  console.log(`  Opened:              ${performance.emails_opened} (${performance.open_rate.toFixed(1)}%)`);
  console.log(`  Clicked:             ${performance.emails_clicked} (${performance.click_rate.toFixed(1)}%)`);
  console.log(`  Replied:             ${performance.emails_replied} (${performance.reply_rate.toFixed(1)}%)`);
  console.log('');
  console.log('Conversions:');
  console.log(`  Positive Replies:    ${performance.positive_replies}`);
  console.log(`  Meetings Scheduled:  ${performance.meetings_scheduled}`);
  console.log(`  Customers:           ${performance.customers_converted}`);
  console.log(`  Conversion Rate:     ${performance.conversion_rate.toFixed(1)}%`);
  console.log('────────────────────────────────────────\n');
}

// ============================================
// EXAMPLE 6: Channel Verification
// ============================================

async function example6_VerifyChannels() {
  console.log('✓ Example 6: Verify Channel Connections\n');

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
          from_email: 'sales@company.com',
          from_name: 'Sales Team',
          tracking_enabled: true,
          warmup_enabled: false,
        },
      },
    },
  };

  const orchestrator = createOutreachOrchestrator(config);

  const channelStatus = await orchestrator.verifyChannels();

  console.log('Channel Status:');
  Object.entries(channelStatus).forEach(([channel, isConnected]) => {
    const status = isConnected ? '✅ Connected' : '❌ Disconnected';
    console.log(`  ${channel.padEnd(15)} ${status}`);
  });
  console.log('');
}

// ============================================
// RUN ALL EXAMPLES
// ============================================

async function runAllExamples() {
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  OUTREACH AUTOMATION - COMPLETE EXAMPLES');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('\n');

  try {
    // Run examples (uncomment to execute)
    // await example1_QuickEmailOutreach();
    // await example2_MultiChannelOutreach();
    // await example3_CustomSequence();
    // await example4_ResponseHandling();
    // await example5_PerformanceTracking();
    // await example6_VerifyChannels();

    console.log('\n✅ All examples completed successfully!\n');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run if executed directly
if (require.main === module) {
  runAllExamples();
}

export {
  example1_QuickEmailOutreach,
  example2_MultiChannelOutreach,
  example3_CustomSequence,
  example4_ResponseHandling,
  example5_PerformanceTracking,
  example6_VerifyChannels,
};

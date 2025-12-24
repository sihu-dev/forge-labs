/**
 * BIDFLOW - Outreach Sequence Orchestrator (L3 - Application Layer)
 *
 * High-level orchestration for multi-channel outreach automation
 */

import {
  createChannelService,
  InstantlyEmailService,
  HeyReachLinkedInService,
  VapiVoiceService,
  WhatsAppBusinessService,
  type IChannelService,
} from '@forge/core';

import {
  createSequenceEngine,
  type ISequenceEngine,
} from '@forge/core/services/sequence-engine-service';

import type {
  IOutreachSequence,
  ICampaign,
  ILead,
  IChannelConfig,
  IInstantlyConfig,
  IHeyReachConfig,
  IVapiConfig,
  IWhatsAppConfig,
  OutreachChannel,
  ISequenceStep,
} from '@forge/types/outreach';

// ============================================
// Orchestrator Configuration
// ============================================

export interface IOrchestratorConfig {
  claude_api_key: string;
  channels: {
    email?: {
      config: IChannelConfig;
      provider: IInstantlyConfig;
    };
    linkedin?: {
      config: IChannelConfig;
      provider: IHeyReachConfig;
    };
    phone?: {
      config: IChannelConfig;
      provider: IVapiConfig;
    };
    whatsapp?: {
      config: IChannelConfig;
      provider: IWhatsAppConfig;
    };
  };
}

// ============================================
// Outreach Orchestrator
// ============================================

export class OutreachOrchestrator {
  private channelServices: Map<OutreachChannel, IChannelService>;
  private sequenceEngine: ISequenceEngine;

  constructor(config: IOrchestratorConfig) {
    // Initialize channel services
    this.channelServices = new Map();

    if (config.channels.email) {
      const emailService = new InstantlyEmailService(
        config.channels.email.config,
        config.channels.email.provider
      );
      this.channelServices.set('email', emailService);
    }

    if (config.channels.linkedin) {
      const linkedinService = new HeyReachLinkedInService(
        config.channels.linkedin.config,
        config.channels.linkedin.provider
      );
      this.channelServices.set('linkedin', linkedinService);
    }

    if (config.channels.phone) {
      const phoneService = new VapiVoiceService(
        config.channels.phone.config,
        config.channels.phone.provider
      );
      this.channelServices.set('phone', phoneService);
    }

    if (config.channels.whatsapp) {
      const whatsappService = new WhatsAppBusinessService(
        config.channels.whatsapp.config,
        config.channels.whatsapp.provider
      );
      this.channelServices.set('whatsapp', whatsappService);
    }

    // Initialize sequence engine
    this.sequenceEngine = createSequenceEngine(this.channelServices, config.claude_api_key);
  }

  /**
   * Create and launch a new outreach campaign
   */
  async launchCampaign(params: {
    name: string;
    sequence: IOutreachSequence;
    leads: ILead[];
    settings?: Partial<ICampaign['settings']>;
  }): Promise<{ campaign_id: string; executions_scheduled: number }> {
    const campaign: ICampaign = {
      id: `campaign-${Date.now()}`,
      name: params.name,
      sequence_id: params.sequence.id,
      leads: params.leads.map((l) => l.id),
      status: 'running',
      start_date: new Date().toISOString(),
      performance: {
        total_leads: params.leads.length,
        active_leads: params.leads.length,
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
      settings: {
        daily_send_limit: 200,
        optimal_send_times: ['09:00', '14:00', '16:30'],
        skip_weekends: true,
        time_zone: 'America/New_York',
        auto_stop_on_reply: true,
        auto_stop_on_unsubscribe: true,
        ...params.settings,
      },
    };

    const result = await this.sequenceEngine.startCampaign(campaign, params.sequence);

    return {
      campaign_id: campaign.id,
      executions_scheduled: result.executions?.length || 0,
    };
  }

  /**
   * Process incoming response
   */
  async handleIncomingResponse(params: {
    execution_id: string;
    message: string;
    lead_id: string;
  }): Promise<{
    action_taken: string;
    suggested_reply?: string;
    sequence_status: string;
  }> {
    const result = await this.sequenceEngine.handleResponse(params.execution_id, params.message);

    return {
      action_taken: result.next_action,
      suggested_reply: result.ai_suggested_reply,
      sequence_status: result.should_continue_sequence ? 'continuing' : 'stopped',
    };
  }

  /**
   * Get campaign performance
   */
  async getCampaignPerformance(campaignId: string): Promise<ICampaign['performance']> {
    // In production, fetch from database
    // For now, return mock data
    return {
      total_leads: 100,
      active_leads: 75,
      completed_leads: 25,
      emails_sent: 250,
      emails_delivered: 240,
      emails_opened: 120,
      emails_clicked: 45,
      emails_replied: 18,
      emails_bounced: 10,
      open_rate: 50,
      click_rate: 37.5,
      reply_rate: 7.5,
      bounce_rate: 4,
      unsubscribe_rate: 0.8,
      positive_replies: 12,
      meetings_scheduled: 8,
      customers_converted: 2,
      conversion_rate: 2,
      objections_count: 6,
      out_of_office_count: 3,
      variant_performance: {},
      last_updated: new Date().toISOString(),
    };
  }

  /**
   * Verify all channel connections
   */
  async verifyChannels(): Promise<Record<OutreachChannel, boolean>> {
    const results: Partial<Record<OutreachChannel, boolean>> = {};

    for (const [channel, service] of this.channelServices.entries()) {
      results[channel] = await service.verify();
    }

    return results as Record<OutreachChannel, boolean>;
  }

  /**
   * Create sequence from template
   */
  static createSequenceTemplate(params: {
    name: string;
    target_persona: string;
    channels: OutreachChannel[];
    ai_personalization_level: 'basic' | 'medium' | 'deep';
  }): IOutreachSequence {
    const steps: ISequenceStep[] = [
      {
        id: 'step-1',
        sequence_id: 'sequence-1',
        step_number: 1,
        type: 'initial_outreach',
        channel: params.channels[0] || 'email',
        delay_days: 0,
        subject_variants: [
          'Quick question about {{company_name}}',
          '{{first_name}}, saw your work at {{company_name}}',
        ],
        body_variants: [
          'Hi {{first_name}},\n\nI noticed your work at {{company_name}} and thought you might be interested in...',
        ],
        cta_variants: ['Are you open to a quick 15-minute call?'],
        conditions: [],
        ai_personalization: {
          enabled: true,
          research_depth: params.ai_personalization_level,
          tone: 'professional',
          custom_prompts: [],
          use_company_research: params.ai_personalization_level !== 'basic',
          use_pain_point_detection: params.ai_personalization_level === 'deep',
          use_value_prop_generation: true,
          ab_variant_count: 3,
        },
      },
      {
        id: 'step-2',
        sequence_id: 'sequence-1',
        step_number: 2,
        type: 'follow_up',
        channel: params.channels[0] || 'email',
        delay_days: 3,
        body_variants: [
          'Hi {{first_name}},\n\nJust wanted to follow up on my previous email...',
        ],
        conditions: [
          {
            type: 'previous_replied',
            operator: 'equals',
            value: false,
            skip_if_true: false,
          },
        ],
        ai_personalization: {
          enabled: true,
          research_depth: 'basic',
          tone: 'friendly',
          custom_prompts: [],
          use_company_research: false,
          use_pain_point_detection: false,
          use_value_prop_generation: true,
          ab_variant_count: 2,
        },
      },
      {
        id: 'step-3',
        sequence_id: 'sequence-1',
        step_number: 3,
        type: 'follow_up',
        channel: params.channels[1] || params.channels[0] || 'email',
        delay_days: 7,
        body_variants: [
          'Hey {{first_name}}, trying one more time...',
        ],
        conditions: [
          {
            type: 'previous_replied',
            operator: 'equals',
            value: false,
            skip_if_true: false,
          },
        ],
        ai_personalization: {
          enabled: true,
          research_depth: 'basic',
          tone: 'casual',
          custom_prompts: [],
          use_company_research: false,
          use_pain_point_detection: false,
          use_value_prop_generation: false,
          ab_variant_count: 2,
        },
      },
      {
        id: 'step-4',
        sequence_id: 'sequence-1',
        step_number: 4,
        type: 'break_up',
        channel: params.channels[0] || 'email',
        delay_days: 14,
        subject_variants: ['Breaking up is hard to do'],
        body_variants: [
          'Hi {{first_name}},\n\nI haven\'t heard back, so I\'ll assume this isn\'t a priority right now. If things change, feel free to reach out.\n\nBest,',
        ],
        conditions: [],
        ai_personalization: {
          enabled: false,
          research_depth: 'basic',
          tone: 'professional',
          custom_prompts: [],
          use_company_research: false,
          use_pain_point_detection: false,
          use_value_prop_generation: false,
          ab_variant_count: 1,
        },
      },
    ];

    return {
      id: `sequence-${Date.now()}`,
      name: params.name,
      description: `Automated outreach for ${params.target_persona}`,
      status: 'active',
      target_persona: params.target_persona,
      steps,
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
  }
}

// ============================================
// Factory Function
// ============================================

export function createOutreachOrchestrator(config: IOrchestratorConfig): OutreachOrchestrator {
  return new OutreachOrchestrator(config);
}

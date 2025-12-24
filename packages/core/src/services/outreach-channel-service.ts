/**
 * @forge/core - Outreach Channel Services (L2 - Cells)
 *
 * Channel integrations for multi-channel outreach
 */

import type {
  IChannelConfig,
  IOutreachExecution,
  ILead,
  IOutreachContent,
  IInstantlyConfig,
  IHeyReachConfig,
  IVapiConfig,
  IWhatsAppConfig,
  IWebhookEvent,
  OutreachChannel,
  ExecutionStatus,
} from '@forge/types/outreach';

// ============================================
// Base Channel Service Interface
// ============================================

export interface IChannelService {
  readonly channel: OutreachChannel;
  readonly config: IChannelConfig;

  /**
   * Send outreach message
   */
  send(lead: ILead, content: IOutreachContent, metadata?: Record<string, unknown>): Promise<ISendResult>;

  /**
   * Check delivery status
   */
  getStatus(executionId: string): Promise<IStatusResult>;

  /**
   * Handle incoming webhook
   */
  handleWebhook(payload: unknown): Promise<IWebhookEvent | null>;

  /**
   * Verify channel connection
   */
  verify(): Promise<boolean>;

  /**
   * Get current rate limit status
   */
  getRateLimitStatus(): Promise<IRateLimitStatus>;
}

export interface ISendResult {
  success: boolean;
  execution_id: string;
  scheduled_at?: string;
  sent_at?: string;
  status: ExecutionStatus;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface IStatusResult {
  execution_id: string;
  status: ExecutionStatus;
  delivered_at?: string;
  opened_at?: string;
  clicked_at?: string;
  replied_at?: string;
  tracking_data?: Record<string, unknown>;
}

export interface IRateLimitStatus {
  current_usage: number;
  max_limit: number;
  reset_at: string;
  available: number;
}

// ============================================
// Email Service (Instantly.ai)
// ============================================

export class InstantlyEmailService implements IChannelService {
  readonly channel: OutreachChannel = 'email';

  constructor(
    readonly config: IChannelConfig,
    private readonly instantlyConfig: IInstantlyConfig
  ) {}

  async send(lead: ILead, content: IOutreachContent, metadata?: Record<string, unknown>): Promise<ISendResult> {
    try {
      // Instantly.ai API call
      const response = await fetch('https://api.instantly.ai/api/v1/lead/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.instantlyConfig.api_key}`,
        },
        body: JSON.stringify({
          campaign_id: this.instantlyConfig.campaign_id,
          email: lead.email,
          first_name: lead.first_name,
          last_name: lead.last_name,
          company_name: lead.company_name,
          custom_variables: {
            job_title: lead.job_title,
            ...content.personalization_tokens,
          },
          // Custom email content if using custom variables
          ...(content.subject && { subject: content.subject }),
          ...(content.body && { body: content.body }),
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        return {
          success: false,
          execution_id: '',
          status: 'failed',
          error: `Instantly.ai error: ${error}`,
        };
      }

      const data = await response.json();

      return {
        success: true,
        execution_id: data.lead_id || `instantly-${Date.now()}`,
        status: 'scheduled',
        scheduled_at: new Date().toISOString(),
        metadata: { instantly_lead_id: data.lead_id },
      };
    } catch (error) {
      return {
        success: false,
        execution_id: '',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getStatus(executionId: string): Promise<IStatusResult> {
    // Instantly.ai status check
    const response = await fetch(
      `https://api.instantly.ai/api/v1/analytics/campaign/${this.instantlyConfig.campaign_id}/emails`,
      {
        headers: {
          'Authorization': `Bearer ${this.instantlyConfig.api_key}`,
        },
      }
    );

    const data = await response.json();
    const email = data.emails?.find((e: any) => e.lead_id === executionId);

    if (!email) {
      return {
        execution_id: executionId,
        status: 'scheduled',
      };
    }

    return {
      execution_id: executionId,
      status: this.mapInstantlyStatus(email.status),
      delivered_at: email.delivered_at,
      opened_at: email.opened_at,
      clicked_at: email.clicked_at,
      replied_at: email.replied_at,
      tracking_data: email,
    };
  }

  async handleWebhook(payload: unknown): Promise<IWebhookEvent | null> {
    const data = payload as any;

    // Instantly.ai webhook format
    if (!data.event_type || !data.lead_id) {
      return null;
    }

    return {
      id: `webhook-${Date.now()}`,
      type: this.mapInstantlyEventType(data.event_type),
      channel: 'email',
      execution_id: data.lead_id,
      lead_id: data.lead_id,
      data: data,
      timestamp: new Date().toISOString(),
      processed: false,
    };
  }

  async verify(): Promise<boolean> {
    try {
      const response = await fetch('https://api.instantly.ai/api/v1/account', {
        headers: {
          'Authorization': `Bearer ${this.instantlyConfig.api_key}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async getRateLimitStatus(): Promise<IRateLimitStatus> {
    // Instantly.ai doesn't expose rate limits via API
    // We track this locally based on config
    return {
      current_usage: this.config.rate_limits.current_usage,
      max_limit: this.config.rate_limits.max_per_day,
      reset_at: this.config.rate_limits.reset_at,
      available: this.config.rate_limits.max_per_day - this.config.rate_limits.current_usage,
    };
  }

  private mapInstantlyStatus(status: string): ExecutionStatus {
    const statusMap: Record<string, ExecutionStatus> = {
      'scheduled': 'scheduled',
      'sent': 'sent',
      'delivered': 'delivered',
      'opened': 'opened',
      'clicked': 'clicked',
      'replied': 'replied',
      'bounced': 'bounced',
      'failed': 'failed',
    };
    return statusMap[status] || 'scheduled';
  }

  private mapInstantlyEventType(eventType: string): IWebhookEvent['type'] {
    const eventMap: Record<string, IWebhookEvent['type']> = {
      'email_sent': 'email.delivered',
      'email_opened': 'email.opened',
      'email_clicked': 'email.clicked',
      'email_replied': 'email.replied',
      'email_bounced': 'email.bounced',
      'unsubscribed': 'email.unsubscribed',
    };
    return eventMap[eventType] || 'email.delivered';
  }
}

// ============================================
// LinkedIn Service (HeyReach)
// ============================================

export class HeyReachLinkedInService implements IChannelService {
  readonly channel: OutreachChannel = 'linkedin';

  constructor(
    readonly config: IChannelConfig,
    private readonly heyreachConfig: IHeyReachConfig
  ) {}

  async send(lead: ILead, content: IOutreachContent, metadata?: Record<string, unknown>): Promise<ISendResult> {
    try {
      const isConnectionRequest = metadata?.type === 'connection_request';

      // HeyReach API call
      const response = await fetch('https://api.heyreach.io/api/v1/campaigns/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.heyreachConfig.api_key,
        },
        body: JSON.stringify({
          account_id: this.heyreachConfig.account_id,
          linkedin_url: lead.linkedin_url,
          first_name: lead.first_name,
          last_name: lead.last_name,
          company: lead.company_name,
          message: content.body,
          connection_note: isConnectionRequest ? content.body : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        return {
          success: false,
          execution_id: '',
          status: 'failed',
          error: `HeyReach error: ${error}`,
        };
      }

      const data = await response.json();

      return {
        success: true,
        execution_id: data.lead_id || `heyreach-${Date.now()}`,
        status: 'scheduled',
        scheduled_at: new Date().toISOString(),
        metadata: { heyreach_lead_id: data.lead_id },
      };
    } catch (error) {
      return {
        success: false,
        execution_id: '',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getStatus(executionId: string): Promise<IStatusResult> {
    const response = await fetch(
      `https://api.heyreach.io/api/v1/leads/${executionId}`,
      {
        headers: {
          'x-api-key': this.heyreachConfig.api_key,
        },
      }
    );

    const data = await response.json();

    return {
      execution_id: executionId,
      status: this.mapHeyReachStatus(data.status),
      sent_at: data.sent_at,
      replied_at: data.replied_at,
      tracking_data: data,
    };
  }

  async handleWebhook(payload: unknown): Promise<IWebhookEvent | null> {
    const data = payload as any;

    if (!data.event || !data.lead_id) {
      return null;
    }

    return {
      id: `webhook-${Date.now()}`,
      type: this.mapHeyReachEventType(data.event),
      channel: 'linkedin',
      execution_id: data.lead_id,
      lead_id: data.lead_id,
      data: data,
      timestamp: new Date().toISOString(),
      processed: false,
    };
  }

  async verify(): Promise<boolean> {
    try {
      const response = await fetch('https://api.heyreach.io/api/v1/account', {
        headers: {
          'x-api-key': this.heyreachConfig.api_key,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async getRateLimitStatus(): Promise<IRateLimitStatus> {
    return {
      current_usage: this.config.rate_limits.current_usage,
      max_limit: this.config.rate_limits.max_per_day,
      reset_at: this.config.rate_limits.reset_at,
      available: this.config.rate_limits.max_per_day - this.config.rate_limits.current_usage,
    };
  }

  private mapHeyReachStatus(status: string): ExecutionStatus {
    const statusMap: Record<string, ExecutionStatus> = {
      'pending': 'scheduled',
      'sent': 'sent',
      'replied': 'replied',
      'failed': 'failed',
    };
    return statusMap[status] || 'scheduled';
  }

  private mapHeyReachEventType(event: string): IWebhookEvent['type'] {
    const eventMap: Record<string, IWebhookEvent['type']> = {
      'connection_accepted': 'linkedin.connection_accepted',
      'message_sent': 'linkedin.message_sent',
      'message_replied': 'linkedin.message_replied',
    };
    return eventMap[event] || 'linkedin.message_sent';
  }
}

// ============================================
// Voice AI Service (Vapi.ai)
// ============================================

export class VapiVoiceService implements IChannelService {
  readonly channel: OutreachChannel = 'phone';

  constructor(
    readonly config: IChannelConfig,
    private readonly vapiConfig: IVapiConfig
  ) {}

  async send(lead: ILead, content: IOutreachContent, metadata?: Record<string, unknown>): Promise<ISendResult> {
    try {
      if (!lead.phone) {
        return {
          success: false,
          execution_id: '',
          status: 'failed',
          error: 'Lead has no phone number',
        };
      }

      // Vapi.ai API call
      const response = await fetch('https://api.vapi.ai/call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.vapiConfig.api_key}`,
        },
        body: JSON.stringify({
          assistant_id: this.vapiConfig.assistant_id,
          phone_number_id: this.vapiConfig.phone_number_id,
          customer: {
            number: lead.phone,
            name: `${lead.first_name} ${lead.last_name}`,
          },
          // Pass script/content as assistant override
          assistant_overrides: {
            first_message: content.body,
            model: {
              messages: [
                {
                  role: 'system',
                  content: metadata?.system_prompt || 'You are a friendly sales assistant.',
                },
              ],
            },
          },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        return {
          success: false,
          execution_id: '',
          status: 'failed',
          error: `Vapi error: ${error}`,
        };
      }

      const data = await response.json();

      return {
        success: true,
        execution_id: data.id || `vapi-${Date.now()}`,
        status: 'scheduled',
        scheduled_at: new Date().toISOString(),
        metadata: { vapi_call_id: data.id },
      };
    } catch (error) {
      return {
        success: false,
        execution_id: '',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getStatus(executionId: string): Promise<IStatusResult> {
    const response = await fetch(
      `https://api.vapi.ai/call/${executionId}`,
      {
        headers: {
          'Authorization': `Bearer ${this.vapiConfig.api_key}`,
        },
      }
    );

    const data = await response.json();

    return {
      execution_id: executionId,
      status: this.mapVapiStatus(data.status),
      tracking_data: data,
    };
  }

  async handleWebhook(payload: unknown): Promise<IWebhookEvent | null> {
    const data = payload as any;

    if (!data.event || !data.call?.id) {
      return null;
    }

    return {
      id: `webhook-${Date.now()}`,
      type: this.mapVapiEventType(data.event),
      channel: 'phone',
      execution_id: data.call.id,
      lead_id: data.call.customer?.number || '',
      data: data,
      timestamp: new Date().toISOString(),
      processed: false,
    };
  }

  async verify(): Promise<boolean> {
    try {
      const response = await fetch('https://api.vapi.ai/assistant', {
        headers: {
          'Authorization': `Bearer ${this.vapiConfig.api_key}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async getRateLimitStatus(): Promise<IRateLimitStatus> {
    return {
      current_usage: this.config.rate_limits.current_usage,
      max_limit: this.config.rate_limits.max_per_day,
      reset_at: this.config.rate_limits.reset_at,
      available: this.config.rate_limits.max_per_day - this.config.rate_limits.current_usage,
    };
  }

  private mapVapiStatus(status: string): ExecutionStatus {
    const statusMap: Record<string, ExecutionStatus> = {
      'queued': 'scheduled',
      'ringing': 'sending',
      'in-progress': 'sending',
      'completed': 'delivered',
      'failed': 'failed',
      'busy': 'failed',
      'no-answer': 'failed',
    };
    return statusMap[status] || 'scheduled';
  }

  private mapVapiEventType(event: string): IWebhookEvent['type'] {
    const eventMap: Record<string, IWebhookEvent['type']> = {
      'call.completed': 'phone.call_completed',
      'voicemail.left': 'phone.voicemail_left',
    };
    return eventMap[event] || 'phone.call_completed';
  }
}

// ============================================
// WhatsApp Service (WhatsApp Business API)
// ============================================

export class WhatsAppBusinessService implements IChannelService {
  readonly channel: OutreachChannel = 'whatsapp';

  constructor(
    readonly config: IChannelConfig,
    private readonly whatsappConfig: IWhatsAppConfig
  ) {}

  async send(lead: ILead, content: IOutreachContent, metadata?: Record<string, unknown>): Promise<ISendResult> {
    try {
      if (!lead.whatsapp) {
        return {
          success: false,
          execution_id: '',
          status: 'failed',
          error: 'Lead has no WhatsApp number',
        };
      }

      // WhatsApp Business API call
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${this.whatsappConfig.phone_number_id}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.whatsappConfig.access_token}`,
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: lead.whatsapp,
            type: 'text',
            text: {
              body: content.body,
            },
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        return {
          success: false,
          execution_id: '',
          status: 'failed',
          error: `WhatsApp error: ${error}`,
        };
      }

      const data = await response.json();

      return {
        success: true,
        execution_id: data.messages?.[0]?.id || `whatsapp-${Date.now()}`,
        status: 'sent',
        sent_at: new Date().toISOString(),
        metadata: { whatsapp_message_id: data.messages?.[0]?.id },
      };
    } catch (error) {
      return {
        success: false,
        execution_id: '',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getStatus(executionId: string): Promise<IStatusResult> {
    // WhatsApp Business API doesn't have a direct status endpoint
    // Status is tracked via webhooks
    return {
      execution_id: executionId,
      status: 'sent',
    };
  }

  async handleWebhook(payload: unknown): Promise<IWebhookEvent | null> {
    const data = payload as any;

    if (!data.entry?.[0]?.changes?.[0]?.value) {
      return null;
    }

    const value = data.entry[0].changes[0].value;
    const status = value.statuses?.[0];
    const message = value.messages?.[0];

    if (status) {
      return {
        id: `webhook-${Date.now()}`,
        type: this.mapWhatsAppEventType(status.status),
        channel: 'whatsapp',
        execution_id: status.id,
        lead_id: status.recipient_id,
        data: status,
        timestamp: new Date().toISOString(),
        processed: false,
      };
    }

    if (message) {
      return {
        id: `webhook-${Date.now()}`,
        type: 'whatsapp.message_replied',
        channel: 'whatsapp',
        execution_id: message.id,
        lead_id: message.from,
        data: message,
        timestamp: new Date().toISOString(),
        processed: false,
      };
    }

    return null;
  }

  async verify(): Promise<boolean> {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${this.whatsappConfig.phone_number_id}`,
        {
          headers: {
            'Authorization': `Bearer ${this.whatsappConfig.access_token}`,
          },
        }
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  async getRateLimitStatus(): Promise<IRateLimitStatus> {
    return {
      current_usage: this.config.rate_limits.current_usage,
      max_limit: this.config.rate_limits.max_per_day,
      reset_at: this.config.rate_limits.reset_at,
      available: this.config.rate_limits.max_per_day - this.config.rate_limits.current_usage,
    };
  }

  private mapWhatsAppEventType(status: string): IWebhookEvent['type'] {
    const eventMap: Record<string, IWebhookEvent['type']> = {
      'sent': 'whatsapp.message_delivered',
      'delivered': 'whatsapp.message_delivered',
      'read': 'whatsapp.message_read',
    };
    return eventMap[status] || 'whatsapp.message_delivered';
  }
}

// ============================================
// Channel Service Factory
// ============================================

export function createChannelService(
  channel: OutreachChannel,
  config: IChannelConfig,
  providerConfig: IInstantlyConfig | IHeyReachConfig | IVapiConfig | IWhatsAppConfig
): IChannelService {
  switch (channel) {
    case 'email':
      return new InstantlyEmailService(config, providerConfig as IInstantlyConfig);
    case 'linkedin':
      return new HeyReachLinkedInService(config, providerConfig as IHeyReachConfig);
    case 'phone':
      return new VapiVoiceService(config, providerConfig as IVapiConfig);
    case 'whatsapp':
      return new WhatsAppBusinessService(config, providerConfig as IWhatsAppConfig);
    default:
      throw new Error(`Unsupported channel: ${channel}`);
  }
}

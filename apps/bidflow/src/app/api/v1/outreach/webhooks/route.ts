/**
 * BIDFLOW API - Outreach Webhooks
 *
 * POST /api/v1/outreach/webhooks - Handle incoming webhooks from all channels
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createOutreachOrchestrator,
  type IOrchestratorConfig,
} from '@/lib/outreach/sequence-orchestrator';

// ============================================
// Webhook Handler
// ============================================

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get('provider'); // instantly, heyreach, vapi, whatsapp
    const body = await request.json();

    if (!provider) {
      return NextResponse.json({ error: 'Provider parameter required' }, { status: 400 });
    }

    // Route to appropriate handler
    switch (provider) {
      case 'instantly':
        return handleInstantlyWebhook(body);
      case 'heyreach':
        return handleHeyReachWebhook(body);
      case 'vapi':
        return handleVapiWebhook(body);
      case 'whatsapp':
        return handleWhatsAppWebhook(body);
      default:
        return NextResponse.json({ error: 'Unknown provider' }, { status: 400 });
    }
  } catch (error) {
    console.error('[Webhook Handler]', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// ============================================
// Instantly.ai Webhook Handler
// ============================================

async function handleInstantlyWebhook(payload: any) {
  console.log('[Instantly Webhook]', payload);

  const { event_type, lead_id, email, message } = payload;

  // Handle different event types
  switch (event_type) {
    case 'email_replied':
      // Process reply
      const orchestrator = await getOrchestrator();
      const result = await orchestrator.handleIncomingResponse({
        execution_id: lead_id,
        message: message || '',
        lead_id: email,
      });

      console.log('[Instantly] Reply handled:', result);

      // Update database with response data
      // await updateExecutionStatus(lead_id, 'replied', { reply_message: message });

      return NextResponse.json({ success: true, action: result.action_taken });

    case 'email_opened':
      console.log('[Instantly] Email opened:', lead_id);
      // await updateExecutionStatus(lead_id, 'opened');
      return NextResponse.json({ success: true });

    case 'email_clicked':
      console.log('[Instantly] Email clicked:', lead_id);
      // await updateExecutionStatus(lead_id, 'clicked');
      return NextResponse.json({ success: true });

    case 'email_bounced':
      console.log('[Instantly] Email bounced:', lead_id);
      // await updateExecutionStatus(lead_id, 'bounced');
      // await updateLeadStatus(email, 'bounced');
      return NextResponse.json({ success: true });

    case 'unsubscribed':
      console.log('[Instantly] Unsubscribed:', email);
      // await updateLeadStatus(email, 'unsubscribed');
      // await stopSequence(lead_id);
      return NextResponse.json({ success: true });

    default:
      return NextResponse.json({ success: true, message: 'Event type not handled' });
  }
}

// ============================================
// HeyReach (LinkedIn) Webhook Handler
// ============================================

async function handleHeyReachWebhook(payload: any) {
  console.log('[HeyReach Webhook]', payload);

  const { event, lead_id, message, linkedin_url } = payload;

  switch (event) {
    case 'connection_accepted':
      console.log('[HeyReach] Connection accepted:', linkedin_url);
      // Update lead status
      // await updateLeadStatus(lead_id, 'connected');
      // Trigger next sequence step (first message)
      return NextResponse.json({ success: true });

    case 'message_replied':
      const orchestrator = await getOrchestrator();
      const result = await orchestrator.handleIncomingResponse({
        execution_id: lead_id,
        message: message || '',
        lead_id: linkedin_url,
      });

      console.log('[HeyReach] Reply handled:', result);
      return NextResponse.json({ success: true, action: result.action_taken });

    case 'message_sent':
      console.log('[HeyReach] Message sent:', lead_id);
      // await updateExecutionStatus(lead_id, 'sent');
      return NextResponse.json({ success: true });

    default:
      return NextResponse.json({ success: true, message: 'Event type not handled' });
  }
}

// ============================================
// Vapi.ai (Voice) Webhook Handler
// ============================================

async function handleVapiWebhook(payload: any) {
  console.log('[Vapi Webhook]', payload);

  const { event, call } = payload;

  switch (event) {
    case 'call.completed':
      const { id, status, duration, transcript, customer } = call;

      console.log('[Vapi] Call completed:', {
        call_id: id,
        status,
        duration,
        customer_number: customer?.number,
      });

      // Analyze transcript for sentiment and next action
      if (transcript) {
        const orchestrator = await getOrchestrator();
        const result = await orchestrator.handleIncomingResponse({
          execution_id: id,
          message: transcript,
          lead_id: customer?.number || '',
        });

        console.log('[Vapi] Call analyzed:', result);

        // If meeting scheduled, create calendar event
        if (result.action_taken === 'schedule_meeting') {
          // await scheduleMeeting(customer?.number, transcript);
        }
      }

      return NextResponse.json({ success: true });

    case 'voicemail.left':
      console.log('[Vapi] Voicemail left:', call.id);
      // await updateExecutionStatus(call.id, 'delivered');
      return NextResponse.json({ success: true });

    default:
      return NextResponse.json({ success: true, message: 'Event type not handled' });
  }
}

// ============================================
// WhatsApp Business Webhook Handler
// ============================================

async function handleWhatsAppWebhook(payload: any) {
  console.log('[WhatsApp Webhook]', payload);

  const entry = payload.entry?.[0];
  const changes = entry?.changes?.[0];
  const value = changes?.value;

  if (!value) {
    return NextResponse.json({ success: true });
  }

  // Handle status updates
  const statuses = value.statuses || [];
  for (const status of statuses) {
    console.log('[WhatsApp] Message status:', {
      id: status.id,
      status: status.status,
      recipient: status.recipient_id,
    });

    // Update execution status
    // await updateExecutionStatus(status.id, mapWhatsAppStatus(status.status));
  }

  // Handle incoming messages (replies)
  const messages = value.messages || [];
  for (const message of messages) {
    console.log('[WhatsApp] Incoming message:', {
      from: message.from,
      text: message.text?.body,
    });

    const orchestrator = await getOrchestrator();
    const result = await orchestrator.handleIncomingResponse({
      execution_id: message.id,
      message: message.text?.body || '',
      lead_id: message.from,
    });

    console.log('[WhatsApp] Reply handled:', result);

    // Send AI-generated reply if applicable
    if (result.suggested_reply && result.action_taken === 'send_ai_reply') {
      // await sendWhatsAppMessage(message.from, result.suggested_reply);
    }
  }

  return NextResponse.json({ success: true });
}

// ============================================
// Helper Functions
// ============================================

async function getOrchestrator() {
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
          from_email: process.env.FROM_EMAIL || 'outreach@example.com',
          from_name: process.env.FROM_NAME || 'Your Company',
          tracking_enabled: true,
          warmup_enabled: false,
        },
      },
    },
  };

  return createOutreachOrchestrator(config);
}

function mapWhatsAppStatus(status: string): string {
  const statusMap: Record<string, string> = {
    sent: 'sent',
    delivered: 'delivered',
    read: 'opened',
    failed: 'failed',
  };
  return statusMap[status] || status;
}

// ============================================
// Webhook Verification (for WhatsApp)
// ============================================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  // WhatsApp webhook verification
  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log('[WhatsApp] Webhook verified');
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

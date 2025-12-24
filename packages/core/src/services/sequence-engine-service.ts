/**
 * @forge/core - Sequence Engine Service (L2 - Cells)
 *
 * Orchestrates multi-channel outreach sequences with Claude AI personalization
 */

import type {
  IOutreachSequence,
  ISequenceStep,
  ILead,
  ICampaign,
  IOutreachExecution,
  IResponseData,
  IOutreachContent,
  IAIPersonalizationConfig,
  ICompanyResearch,
  IPainPoint,
  IValueProposition,
  IABVariant,
  ISendTimeOptimization,
  OutreachChannel,
  ExecutionStatus,
  ResponseAction,
} from '@forge/types/outreach';

import {
  calculateNextStepTime,
  getNextStep,
  detectResponseType,
  calculateSentimentScore,
  determineNextAction,
  detectObjections,
  calculateSequencePerformance,
  replacePersonalizationTokens,
  selectBestVariant,
  isWithinRateLimit,
  validateSequence,
} from '@forge/utils/outreach-sequence';

import {
  buildPrompt,
  getRecommendedPrompt,
  ALL_PROMPTS,
} from '@forge/utils/claude-prompts';

import type { IChannelService } from './outreach-channel-service';

// ============================================
// Sequence Engine Interface
// ============================================

export interface ISequenceEngine {
  /**
   * Start a campaign
   */
  startCampaign(campaign: ICampaign, sequence: IOutreachSequence): Promise<IEngineResult>;

  /**
   * Execute next step for a lead
   */
  executeNextStep(leadId: string, campaignId: string): Promise<IEngineResult>;

  /**
   * Handle incoming response
   */
  handleResponse(executionId: string, message: string): Promise<IResponseHandlingResult>;

  /**
   * Generate AI-personalized content
   */
  generatePersonalizedContent(
    lead: ILead,
    step: ISequenceStep,
    research?: ICompanyResearch
  ): Promise<IPersonalizedContent>;

  /**
   * Optimize send time for lead
   */
  optimizeSendTime(leadId: string): Promise<ISendTimeOptimization>;

  /**
   * Run A/B test
   */
  runABTest(variantIds: string[], testConfig: IABTestConfig): Promise<IABTestResult>;
}

export interface IEngineResult {
  success: boolean;
  executions?: IOutreachExecution[];
  errors?: string[];
  metadata?: Record<string, unknown>;
}

export interface IResponseHandlingResult {
  response_type: IResponseData['type'];
  next_action: ResponseAction;
  ai_suggested_reply?: string;
  should_continue_sequence: boolean;
  metadata?: Record<string, unknown>;
}

export interface IPersonalizedContent {
  subject?: string;
  body: string;
  cta?: string;
  variants: Array<{
    variant_id: string;
    subject?: string;
    body: string;
    cta?: string;
  }>;
  personalization_score: number;
  research_used?: ICompanyResearch;
  pain_points_identified?: IPainPoint[];
  value_prop?: IValueProposition;
}

export interface IABTestConfig {
  test_id: string;
  element_type: 'subject' | 'body' | 'cta';
  min_sample_size: number;
  confidence_level: number;
}

export interface IABTestResult {
  winner_variant_id?: string;
  confidence: number;
  results: Array<{
    variant_id: string;
    performance: {
      open_rate: number;
      click_rate: number;
      reply_rate: number;
    };
  }>;
}

// ============================================
// Sequence Engine Implementation
// ============================================

export class SequenceEngineService implements ISequenceEngine {
  private executionStore: Map<string, IOutreachExecution[]> = new Map();
  private campaignStore: Map<string, ICampaign> = new Map();
  private sequenceStore: Map<string, IOutreachSequence> = new Map();

  constructor(
    private readonly channelServices: Map<OutreachChannel, IChannelService>,
    private readonly claudeApiKey: string
  ) {}

  async startCampaign(campaign: ICampaign, sequence: IOutreachSequence): Promise<IEngineResult> {
    // Validate sequence
    const validation = validateSequence(sequence);
    if (!validation.valid) {
      return {
        success: false,
        errors: validation.errors,
      };
    }

    // Store campaign and sequence
    this.campaignStore.set(campaign.id, campaign);
    this.sequenceStore.set(sequence.id, sequence);

    const executions: IOutreachExecution[] = [];
    const errors: string[] = [];

    // Schedule first step for all leads
    for (const leadId of campaign.leads) {
      try {
        const result = await this.executeNextStep(leadId, campaign.id);
        if (result.executions) {
          executions.push(...result.executions);
        }
        if (result.errors) {
          errors.push(...result.errors);
        }
      } catch (error) {
        errors.push(`Failed to schedule lead ${leadId}: ${error}`);
      }
    }

    return {
      success: errors.length === 0,
      executions,
      errors: errors.length > 0 ? errors : undefined,
      metadata: {
        campaign_id: campaign.id,
        total_scheduled: executions.length,
      },
    };
  }

  async executeNextStep(leadId: string, campaignId: string): Promise<IEngineResult> {
    const campaign = this.campaignStore.get(campaignId);
    if (!campaign) {
      return { success: false, errors: ['Campaign not found'] };
    }

    const sequence = this.sequenceStore.get(campaign.sequence_id);
    if (!sequence) {
      return { success: false, errors: ['Sequence not found'] };
    }

    // Get previous executions for this lead
    const previousExecutions = this.executionStore.get(leadId) || [];

    // Determine next step
    const currentStepNumber = previousExecutions.length > 0
      ? previousExecutions[previousExecutions.length - 1].step_id
      : 0;

    const nextStep = getNextStep(sequence, Number(currentStepNumber), previousExecutions);

    if (!nextStep) {
      // Sequence completed
      return {
        success: true,
        metadata: { status: 'sequence_completed' },
      };
    }

    // Get channel service
    const channelService = this.channelServices.get(nextStep.channel);
    if (!channelService) {
      return { success: false, errors: [`Channel ${nextStep.channel} not configured`] };
    }

    // Check rate limits
    const rateLimitStatus = await channelService.getRateLimitStatus();
    if (!isWithinRateLimit(rateLimitStatus.current_usage, rateLimitStatus.max_limit, new Date(rateLimitStatus.reset_at))) {
      return {
        success: false,
        errors: ['Rate limit exceeded'],
        metadata: { rate_limit: rateLimitStatus },
      };
    }

    // Get lead data (mock for now - would come from database)
    const lead: ILead = {
      id: leadId,
      email: 'lead@example.com',
      first_name: 'John',
      last_name: 'Doe',
      company_name: 'Acme Corp',
      status: 'in_sequence',
      tags: [],
      custom_fields: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Generate personalized content
    const personalizedContent = await this.generatePersonalizedContent(lead, nextStep);

    // Select best variant
    const selectedVariant = personalizedContent.variants[0]; // In production, use selectBestVariant()

    const content: IOutreachContent = {
      subject: selectedVariant.subject,
      body: selectedVariant.body,
      cta: selectedVariant.cta,
      variant_id: selectedVariant.variant_id,
      personalization_tokens: {},
      ai_generated: true,
    };

    // Calculate send time
    const sendTime = calculateNextStepTime(
      previousExecutions.length > 0 ? new Date(previousExecutions[previousExecutions.length - 1].sent_at || new Date()) : new Date(),
      nextStep
    );

    // Send via channel
    const sendResult = await channelService.send(lead, content);

    if (!sendResult.success) {
      return {
        success: false,
        errors: [sendResult.error || 'Send failed'],
      };
    }

    // Create execution record
    const execution: IOutreachExecution = {
      id: sendResult.execution_id,
      campaign_id: campaignId,
      lead_id: leadId,
      step_id: nextStep.id,
      channel: nextStep.channel,
      status: sendResult.status,
      scheduled_at: sendTime.toISOString(),
      sent_at: sendResult.sent_at,
      content,
      tracking: {
        open_count: 0,
        click_count: 0,
        link_clicks: {},
      },
    };

    // Store execution
    previousExecutions.push(execution);
    this.executionStore.set(leadId, previousExecutions);

    return {
      success: true,
      executions: [execution],
    };
  }

  async handleResponse(executionId: string, message: string): Promise<IResponseHandlingResult> {
    // Detect response type
    const responseType = detectResponseType(message);
    const sentimentScore = calculateSentimentScore(message);
    const objections = detectObjections(message);

    const responseData: IResponseData = {
      type: responseType,
      message,
      sentiment_score: sentimentScore,
      detected_objections: objections.length > 0 ? objections : undefined,
      next_action: 'continue_sequence',
    };

    // Determine next action
    const nextAction = determineNextAction(responseData);
    responseData.next_action = nextAction;

    // Generate AI reply if needed
    let aiSuggestedReply: string | undefined;
    if (nextAction === 'send_ai_reply') {
      aiSuggestedReply = await this.generateAIReply(message, responseType, objections);
    }

    // Determine if sequence should continue
    const shouldContinue = !['mark_unsubscribed', 'schedule_meeting', 'mark_as_customer'].includes(nextAction);

    return {
      response_type: responseType,
      next_action: nextAction,
      ai_suggested_reply: aiSuggestedReply,
      should_continue_sequence: shouldContinue,
      metadata: {
        sentiment_score: sentimentScore,
        objections,
      },
    };
  }

  async generatePersonalizedContent(
    lead: ILead,
    step: ISequenceStep,
    research?: ICompanyResearch
  ): Promise<IPersonalizedContent> {
    const config = step.ai_personalization;

    if (!config.enabled) {
      // Use template variants as-is
      return {
        body: step.body_variants[0],
        variants: step.body_variants.map((body, idx) => ({
          variant_id: `template-${idx}`,
          body,
        })),
        personalization_score: 0,
      };
    }

    // Conduct research if needed
    let companyResearch = research;
    if (config.use_company_research && !companyResearch) {
      companyResearch = await this.conductCompanyResearch(lead);
    }

    // Identify pain points
    let painPoints: IPainPoint[] | undefined;
    if (config.use_pain_point_detection && companyResearch) {
      painPoints = await this.identifyPainPoints(lead, companyResearch);
    }

    // Generate value proposition
    let valueProp: IValueProposition | undefined;
    if (config.use_value_prop_generation) {
      valueProp = await this.generateValueProposition(lead, step, companyResearch, painPoints);
    }

    // Generate A/B variants
    const variants = await this.generateABVariants(lead, step, valueProp, config.ab_variant_count);

    return {
      subject: valueProp?.headline,
      body: valueProp?.full_message || variants[0].body,
      cta: valueProp?.cta,
      variants,
      personalization_score: valueProp?.personalization_score || 50,
      research_used: companyResearch,
      pain_points_identified: painPoints,
      value_prop: valueProp,
    };
  }

  async optimizeSendTime(leadId: string): Promise<ISendTimeOptimization> {
    // In production, use ML model based on historical data
    // For now, return industry benchmark
    return {
      lead_id: leadId,
      optimal_day: 'tuesday',
      optimal_hour: 10,
      confidence: 75,
      based_on: 'industry_benchmark',
      timezone: 'America/New_York',
      last_updated: new Date().toISOString(),
    };
  }

  async runABTest(variantIds: string[], testConfig: IABTestConfig): Promise<IABTestResult> {
    // Get executions for variants
    const allExecutions: IOutreachExecution[] = [];
    this.executionStore.forEach((executions) => {
      allExecutions.push(...executions);
    });

    const results = variantIds.map((variantId) => {
      const variantExecutions = allExecutions.filter((e) => e.content.variant_id === variantId);
      const performance = calculateSequencePerformance(variantExecutions);

      return {
        variant_id: variantId,
        performance: {
          open_rate: performance.open_rate || 0,
          click_rate: performance.click_rate || 0,
          reply_rate: performance.reply_rate || 0,
        },
      };
    });

    // Determine winner (simplified)
    const winner = results.reduce((best, current) =>
      current.performance.reply_rate > best.performance.reply_rate ? current : best
    );

    return {
      winner_variant_id: winner.variant_id,
      confidence: 0.85,
      results,
    };
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  private async conductCompanyResearch(lead: ILead): Promise<ICompanyResearch> {
    const prompt = buildPrompt(ALL_PROMPTS.COMPANY_RESEARCH, {
      company_name: lead.company_name,
      company_website: lead.custom_fields.website || '',
      industry: lead.custom_fields.industry || '',
      contact_name: `${lead.first_name} ${lead.last_name}`,
      job_title: lead.job_title || '',
    });

    const response = await this.callClaudeAPI(prompt.systemPrompt, prompt.userPrompt);

    try {
      const data = JSON.parse(response);
      return {
        company_name: lead.company_name,
        industry: data.company_overview.description || '',
        description: data.company_overview.description || '',
        recent_news: data.recent_news || [],
        technologies: data.technologies || [],
        competitors: data.competitors || [],
        pain_points: data.pain_points || [],
        buying_signals: data.buying_signals || [],
        researched_at: new Date().toISOString(),
        confidence_score: 0.8,
      };
    } catch {
      // Fallback if parsing fails
      return {
        company_name: lead.company_name,
        industry: '',
        description: response,
        recent_news: [],
        technologies: [],
        competitors: [],
        pain_points: [],
        buying_signals: [],
        researched_at: new Date().toISOString(),
        confidence_score: 0.5,
      };
    }
  }

  private async identifyPainPoints(lead: ILead, research: ICompanyResearch): Promise<IPainPoint[]> {
    const prompt = buildPrompt(ALL_PROMPTS.PAIN_POINT_DETECTION, {
      company_name: lead.company_name,
      industry: research.industry,
      contact_name: `${lead.first_name} ${lead.last_name}`,
      job_title: lead.job_title || '',
      company_size: lead.custom_fields.company_size || 'Unknown',
      recent_context: research.recent_news.map((n) => n.summary).join('; '),
      our_solution_category: 'Business Automation',
    });

    const response = await this.callClaudeAPI(prompt.systemPrompt, prompt.userPrompt);

    try {
      const data = JSON.parse(response);
      return data.pain_points || [];
    } catch {
      return [];
    }
  }

  private async generateValueProposition(
    lead: ILead,
    step: ISequenceStep,
    research?: ICompanyResearch,
    painPoints?: IPainPoint[]
  ): Promise<IValueProposition> {
    const prompt = buildPrompt(ALL_PROMPTS.VALUE_PROP_GENERATOR, {
      contact_name: lead.first_name,
      job_title: lead.job_title || '',
      company_name: lead.company_name,
      industry: research?.industry || 'Unknown',
      company_size: lead.custom_fields.company_size || 'Unknown',
      pain_points: painPoints?.map((p) => p.description).join('\n') || 'General business efficiency',
      solution_category: 'Business Automation',
      key_benefits: 'Save time, reduce costs, increase efficiency',
      differentiation: 'AI-powered, easy to use, proven ROI',
      proof_points: 'Used by 500+ companies, 40% average time savings',
      channel: step.channel,
      sequence_step: step.type,
      tone: step.ai_personalization.tone,
    });

    const response = await this.callClaudeAPI(prompt.systemPrompt, prompt.userPrompt);

    try {
      const data = JSON.parse(response);
      return {
        headline: data.headline || '',
        subheadline: data.opening_line || '',
        key_benefits: data.proof_points || [],
        proof_points: data.proof_points || [],
        cta: data.cta || '',
        personalization_score: data.personalization_score || 50,
        generated_at: new Date().toISOString(),
        full_message: data.full_message,
      };
    } catch {
      return {
        headline: 'Improve Your Business Efficiency',
        subheadline: `Hi ${lead.first_name}, I noticed your work at ${lead.company_name}`,
        key_benefits: ['Save time', 'Reduce costs'],
        proof_points: ['Proven results'],
        cta: 'Would you be open to a quick chat?',
        personalization_score: 30,
        generated_at: new Date().toISOString(),
      };
    }
  }

  private async generateABVariants(
    lead: ILead,
    step: ISequenceStep,
    valueProp?: IValueProposition,
    variantCount: number = 3
  ): Promise<Array<{ variant_id: string; subject?: string; body: string; cta?: string }>> {
    const baseMessage = valueProp?.full_message || step.body_variants[0];

    const prompt = buildPrompt(ALL_PROMPTS.AB_VARIANT_GENERATOR, {
      variant_count: String(variantCount),
      base_message: baseMessage,
      contact_name: lead.first_name,
      company_name: lead.company_name,
      job_title: lead.job_title || '',
      test_element: 'message_length',
      channel: step.channel,
      max_length: '150',
      tone: step.ai_personalization.tone,
    });

    const response = await this.callClaudeAPI(prompt.systemPrompt, prompt.userPrompt);

    try {
      const data = JSON.parse(response);
      return data.variants.map((v: any, idx: number) => ({
        variant_id: v.variant_id || `variant-${idx}`,
        subject: v.subject_line,
        body: v.body,
        cta: v.cta,
      }));
    } catch {
      // Fallback: return template variants
      return step.body_variants.map((body, idx) => ({
        variant_id: `template-${idx}`,
        body: replacePersonalizationTokens(body, lead),
      }));
    }
  }

  private async generateAIReply(
    message: string,
    responseType: IResponseData['type'],
    objections: string[]
  ): Promise<string> {
    const prompt = buildPrompt(ALL_PROMPTS.OBJECTION_HANDLER, {
      contact_name: 'there',
      job_title: '',
      company_name: '',
      objection_text: message,
      objection_type: objections[0] || 'General',
      interaction_history: 'First response',
      known_pain_points: '',
      solution_benefits: 'Efficiency, cost savings, time savings',
    });

    const response = await this.callClaudeAPI(prompt.systemPrompt, prompt.userPrompt);

    try {
      const data = JSON.parse(response);
      return data.email_response || response;
    } catch {
      return response;
    }
  }

  private async callClaudeAPI(systemPrompt: string, userPrompt: string): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.claudeApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      }),
    });

    const data = await response.json();
    return data.content?.[0]?.text || '';
  }
}

// ============================================
// Factory Function
// ============================================

export function createSequenceEngine(
  channelServices: Map<OutreachChannel, IChannelService>,
  claudeApiKey: string
): ISequenceEngine {
  return new SequenceEngineService(channelServices, claudeApiKey);
}

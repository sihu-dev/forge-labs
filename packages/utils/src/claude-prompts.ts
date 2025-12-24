/**
 * @forge/utils - Claude AI Prompt Templates (L1 - Molecules)
 *
 * Structured prompts for outreach personalization using Claude AI
 */

import type { IClaudePrompt, ILead, ICompanyResearch, IPainPoint, IValueProposition } from '@forge/types/outreach';

// ============================================
// Company Research Prompts
// ============================================

export const COMPANY_RESEARCH_PROMPT: IClaudePrompt = {
  id: 'company-research-v1',
  name: 'Company Deep Research',
  category: 'research',
  system_prompt: `You are an expert B2B sales researcher specializing in identifying business pain points, buying signals, and decision-maker insights. Your goal is to provide actionable intelligence for personalized outreach.

Focus on:
1. Company size, industry, and recent developments
2. Technology stack and digital maturity
3. Potential pain points based on industry trends
4. Buying signals (funding, hiring, expansions)
5. Competitive landscape

Provide concise, actionable insights suitable for sales outreach.`,

  user_prompt_template: `Research the following company and provide detailed intelligence:

**Company Information:**
- Company Name: {{company_name}}
- Website: {{company_website}}
- Industry: {{industry}}
- Contact: {{contact_name}} ({{job_title}})

**Research Requirements:**
1. Company overview (size, revenue, headquarters)
2. Recent news and developments (last 6 months)
3. Technology stack and tools they likely use
4. Top 3 potential pain points they might face
5. Buying signals (hiring, funding, expansion)
6. Competitors in their space
7. Decision maker level and typical concerns for {{job_title}}

**Output Format (JSON):**
{
  "company_overview": {
    "size": "string (e.g., '50-200 employees')",
    "revenue_range": "string",
    "headquarters": "string",
    "description": "string (2-3 sentences)"
  },
  "recent_news": [
    {
      "title": "string",
      "summary": "string",
      "date": "string",
      "relevance": "high|medium|low"
    }
  ],
  "technologies": ["string"],
  "pain_points": [
    {
      "category": "operational|financial|growth|technical",
      "description": "string",
      "severity": "critical|high|medium|low",
      "evidence": ["string"]
    }
  ],
  "buying_signals": ["string"],
  "competitors": ["string"],
  "decision_maker_insights": {
    "typical_concerns": ["string"],
    "kpis_they_care_about": ["string"]
  }
}`,

  variables: ['company_name', 'company_website', 'industry', 'contact_name', 'job_title'],
  model: 'claude-3-5-sonnet-20241022',
  temperature: 0.3,
  max_tokens: 2000,
};

// ============================================
// Pain Point Identification Prompts
// ============================================

export const PAIN_POINT_DETECTION_PROMPT: IClaudePrompt = {
  id: 'pain-point-detection-v1',
  name: 'Pain Point Detection',
  category: 'research',
  system_prompt: `You are an expert at identifying business pain points from company data, industry trends, and contact information. Your goal is to uncover specific challenges that our solution can address.

Analyze the provided information and identify:
1. Explicit pain points (mentioned in news, job postings, etc.)
2. Implicit pain points (industry common challenges)
3. Growth blockers (what prevents them from scaling)
4. Efficiency gaps (where they're losing time/money)

Prioritize pain points that are:
- Urgent and costly
- Within our solution's scope
- Likely to resonate with the decision maker`,

  user_prompt_template: `Identify pain points for this prospect:

**Company:** {{company_name}} ({{industry}})
**Contact:** {{contact_name}} - {{job_title}}
**Company Size:** {{company_size}}
**Recent Context:** {{recent_context}}

**Our Solution Addresses:**
{{our_solution_category}}

**Task:**
Identify top 3-5 pain points this company likely faces that our solution can address.

**Output Format (JSON):**
{
  "pain_points": [
    {
      "category": "operational|financial|growth|technical|competitive",
      "title": "string (concise title)",
      "description": "string (1-2 sentences)",
      "severity": "critical|high|medium|low",
      "evidence": ["string (why we think this is a pain point)"],
      "our_solution_fit": 85,
      "talking_points": ["string (how to bring this up in outreach)"]
    }
  ],
  "primary_pain_point": "string (the most urgent one)",
  "recommended_angle": "string (best approach for initial outreach)"
}`,

  variables: ['company_name', 'industry', 'contact_name', 'job_title', 'company_size', 'recent_context', 'our_solution_category'],
  model: 'claude-3-5-sonnet-20241022',
  temperature: 0.4,
  max_tokens: 1500,
};

// ============================================
// Value Proposition Generation Prompts
// ============================================

export const VALUE_PROP_GENERATOR_PROMPT: IClaudePrompt = {
  id: 'value-prop-generator-v1',
  name: 'Custom Value Proposition Generator',
  category: 'value_prop',
  system_prompt: `You are a world-class B2B copywriter specializing in personalized value propositions. Your messages are:
- Hyper-personalized to the recipient
- Focused on outcomes, not features
- Concise and scannable
- Backed by proof points
- Action-oriented

Write in a professional yet conversational tone. Avoid:
- Generic pitches
- Buzzwords and jargon
- Feature dumps
- Pushy language`,

  user_prompt_template: `Create a personalized value proposition for this prospect:

**Prospect Details:**
- Name: {{contact_name}}
- Title: {{job_title}}
- Company: {{company_name}} ({{industry}}, {{company_size}})

**Their Pain Points:**
{{pain_points}}

**Our Solution:**
- Category: {{solution_category}}
- Key Benefits: {{key_benefits}}
- Differentiation: {{differentiation}}
- Proof Points: {{proof_points}}

**Outreach Context:**
- Channel: {{channel}}
- Step: {{sequence_step}} (e.g., initial outreach, follow-up)
- Tone: {{tone}}

**Task:**
Generate a compelling value proposition that:
1. Hooks them with a relevant pain point
2. Shows specific value for their role/company
3. Includes proof/credibility
4. Has a clear, low-friction CTA

**Output Format (JSON):**
{
  "headline": "string (attention-grabbing, 10-15 words)",
  "opening_line": "string (personalized hook, 1-2 sentences)",
  "value_statement": "string (what we do for companies like theirs, 2-3 sentences)",
  "proof_points": [
    "string (credibility: stats, logos, case studies)"
  ],
  "cta": "string (clear next step)",
  "full_message": "string (complete email/message body)",
  "subject_line_options": [
    "string (if email)"
  ],
  "personalization_score": 85
}`,

  variables: [
    'contact_name',
    'job_title',
    'company_name',
    'industry',
    'company_size',
    'pain_points',
    'solution_category',
    'key_benefits',
    'differentiation',
    'proof_points',
    'channel',
    'sequence_step',
    'tone',
  ],
  model: 'claude-3-5-sonnet-20241022',
  temperature: 0.7,
  max_tokens: 1200,
};

// ============================================
// A/B Variant Generation Prompts
// ============================================

export const AB_VARIANT_GENERATOR_PROMPT: IClaudePrompt = {
  id: 'ab-variant-generator-v1',
  name: 'A/B Test Variant Generator',
  category: 'personalization',
  system_prompt: `You are an expert in email A/B testing and conversion optimization. Generate distinct variants that test different hypotheses while maintaining the core message.

Each variant should:
- Test a specific element (hook, value prop, CTA, etc.)
- Be meaningfully different (not just word swaps)
- Maintain consistent tone and professionalism
- Be optimized for the channel`,

  user_prompt_template: `Generate {{variant_count}} distinct variants for this outreach:

**Base Message:**
{{base_message}}

**Recipient Context:**
- Name: {{contact_name}}
- Company: {{company_name}}
- Title: {{job_title}}

**Element to Test:**
{{test_element}} (subject_line, opening_hook, value_prop, cta, message_length)

**Constraints:**
- Channel: {{channel}}
- Max length: {{max_length}} words
- Tone: {{tone}}

**Task:**
Create {{variant_count}} variants, each testing a different hypothesis.

**Output Format (JSON):**
{
  "variants": [
    {
      "variant_id": "A",
      "hypothesis": "string (what we're testing)",
      "subject_line": "string (if email)",
      "body": "string (full message)",
      "cta": "string",
      "expected_outcome": "string (why this might perform better)"
    }
  ],
  "test_recommendation": "string (which variant to start with and why)"
}`,

  variables: ['variant_count', 'base_message', 'contact_name', 'company_name', 'job_title', 'test_element', 'channel', 'max_length', 'tone'],
  model: 'claude-3-5-sonnet-20241022',
  temperature: 0.8,
  max_tokens: 2000,
};

// ============================================
// Objection Handling Prompts
// ============================================

export const OBJECTION_HANDLER_PROMPT: IClaudePrompt = {
  id: 'objection-handler-v1',
  name: 'Objection Response Generator',
  category: 'objection_handling',
  system_prompt: `You are an expert sales professional skilled at handling objections with empathy and strategic reframing. Your responses:
- Acknowledge the concern genuinely
- Reframe without being pushy
- Provide social proof or logic
- Move toward a micro-commitment
- Know when to back off gracefully

Maintain a helpful, consultative tone. Never be defensive or aggressive.`,

  user_prompt_template: `Craft a response to this objection:

**Prospect:** {{contact_name}} ({{job_title}} at {{company_name}})

**Objection Received:**
"{{objection_text}}"

**Objection Type:** {{objection_type}}
(e.g., Budget Constraints, No Interest, Timing Issues, Existing Solution, Wrong Contact, Price)

**Context:**
- Previous interactions: {{interaction_history}}
- Pain points identified: {{known_pain_points}}
- Our solution benefits: {{solution_benefits}}

**Task:**
Generate a thoughtful response that:
1. Acknowledges their concern
2. Addresses the objection strategically
3. Provides value/insight
4. Suggests a low-commitment next step OR gracefully backs off

**Output Format (JSON):**
{
  "response_strategy": "string (approach: reframe, provide value, defer, disqualify)",
  "email_response": "string (full response message)",
  "alternative_cta": "string (if original CTA won't work)",
  "follow_up_timing": "string (when to follow up, if at all)",
  "disqualify_recommendation": true/false,
  "reasoning": "string (why this approach)"
}`,

  variables: ['contact_name', 'job_title', 'company_name', 'objection_text', 'objection_type', 'interaction_history', 'known_pain_points', 'solution_benefits'],
  model: 'claude-3-5-sonnet-20241022',
  temperature: 0.6,
  max_tokens: 1000,
};

// ============================================
// Follow-Up Message Prompts
// ============================================

export const FOLLOW_UP_GENERATOR_PROMPT: IClaudePrompt = {
  id: 'follow-up-generator-v1',
  name: 'Follow-Up Message Generator',
  category: 'personalization',
  system_prompt: `You are an expert at crafting follow-up messages that re-engage cold prospects without being annoying. Your follow-ups:
- Reference previous message briefly
- Add new value (insight, resource, news)
- Are concise and respectful
- Have a clear, easy CTA
- Know when to use "break-up" emails

Use pattern interrupts and genuine value to stand out.`,

  user_prompt_template: `Generate a follow-up message:

**Prospect:** {{contact_name}} ({{job_title}} at {{company_name}})

**Previous Outreach:**
{{previous_messages}}

**Follow-Up Number:** {{follow_up_number}} (1, 2, 3, etc.)

**Days Since Last Message:** {{days_since_last}}

**Engagement So Far:**
- Opened: {{opened}}
- Clicked: {{clicked}}
- Replied: {{replied}}

**New Context/Hook:**
{{new_hook}} (e.g., recent news, new case study, industry insight)

**Task:**
Generate a follow-up that:
- Acknowledges radio silence gracefully
- Provides new value/angle
- Is concise (< 100 words)
- Has a clear micro-CTA

**Output Format (JSON):**
{
  "subject_line": "string (if email)",
  "body": "string (full message)",
  "approach": "string (value-add, break-up, permission-based, etc.)",
  "cta": "string",
  "expected_response_rate": "low|medium|high"
}`,

  variables: ['contact_name', 'job_title', 'company_name', 'previous_messages', 'follow_up_number', 'days_since_last', 'opened', 'clicked', 'replied', 'new_hook'],
  model: 'claude-3-5-sonnet-20241022',
  temperature: 0.7,
  max_tokens: 800,
};

// ============================================
// LinkedIn-Specific Prompts
// ============================================

export const LINKEDIN_MESSAGE_PROMPT: IClaudePrompt = {
  id: 'linkedin-message-v1',
  name: 'LinkedIn Message Generator',
  category: 'personalization',
  system_prompt: `You are an expert at LinkedIn outreach. Your messages are:
- Conversational and casual (it's social media)
- Brief (2-3 short paragraphs max)
- Personalized with profile insights
- Non-salesy in tone
- Focused on building relationships first

Reference their profile, posts, or mutual connections naturally.`,

  user_prompt_template: `Create a LinkedIn message:

**Recipient:** {{contact_name}} ({{job_title}} at {{company_name}})

**LinkedIn Profile Insights:**
- Recent posts/activity: {{recent_activity}}
- Mutual connections: {{mutual_connections}}
- Shared interests: {{shared_interests}}
- Education: {{education}}

**Outreach Goal:** {{outreach_goal}}
(e.g., connection request, direct message, InMail)

**Our Value Prop:**
{{value_proposition}}

**Task:**
Generate a LinkedIn message that:
1. Opens with genuine personalization
2. Builds rapport naturally
3. Hints at value without hard selling
4. Has a conversational CTA

**Output Format (JSON):**
{
  "connection_note": "string (if connection request, max 200 chars)",
  "direct_message": "string (if messaging existing connection)",
  "subject_line": "string (if InMail)",
  "message_body": "string (main message)",
  "personalization_elements_used": ["string"]
}`,

  variables: ['contact_name', 'job_title', 'company_name', 'recent_activity', 'mutual_connections', 'shared_interests', 'education', 'outreach_goal', 'value_proposition'],
  model: 'claude-3-5-sonnet-20241022',
  temperature: 0.75,
  max_tokens: 600,
};

// ============================================
// Voice AI Script Prompts
// ============================================

export const VOICE_AI_SCRIPT_PROMPT: IClaudePrompt = {
  id: 'voice-ai-script-v1',
  name: 'Voice AI Call Script Generator',
  category: 'personalization',
  system_prompt: `You are an expert at creating natural-sounding voice AI scripts for sales outreach. Your scripts:
- Sound conversational, not robotic
- Handle interruptions gracefully
- Ask qualifying questions
- Listen for buying signals
- Know when to hand off to human

Write for spoken language with natural pauses and conversational flow.`,

  user_prompt_template: `Generate a voice AI script:

**Call Recipient:** {{contact_name}} ({{job_title}} at {{company_name}})

**Call Goal:** {{call_goal}}
(e.g., qualify, book meeting, deliver value, re-engage)

**Key Information:**
- Pain points: {{pain_points}}
- Our solution: {{solution_summary}}
- Desired outcome: {{desired_outcome}}

**Voice AI Capabilities:**
- Can detect sentiment
- Can handle objections (up to 2 rounds)
- Can schedule meetings via calendar API
- Will transfer to human if requested

**Task:**
Create a conversational script with:
1. Opening (identify yourself, purpose)
2. Qualification questions
3. Value delivery
4. Objection handling paths
5. Next step/CTA
6. Graceful exit

**Output Format (JSON):**
{
  "opening": "string (first 2-3 sentences)",
  "qualification_questions": [
    {
      "question": "string",
      "follow_up_if_yes": "string",
      "follow_up_if_no": "string"
    }
  ],
  "value_delivery": "string (main pitch, 30-45 seconds)",
  "objection_responses": {
    "not_interested": "string",
    "no_time": "string",
    "send_email": "string",
    "talk_to_human": "string (transfer script)"
  },
  "cta": "string (book meeting or next step)",
  "closing": "string (thank you and exit)",
  "estimated_duration_seconds": 120
}`,

  variables: ['contact_name', 'job_title', 'company_name', 'call_goal', 'pain_points', 'solution_summary', 'desired_outcome'],
  model: 'claude-3-5-sonnet-20241022',
  temperature: 0.7,
  max_tokens: 1500,
};

// ============================================
// WhatsApp Message Prompts
// ============================================

export const WHATSAPP_MESSAGE_PROMPT: IClaudePrompt = {
  id: 'whatsapp-message-v1',
  name: 'WhatsApp Business Message Generator',
  category: 'personalization',
  system_prompt: `You are an expert at WhatsApp Business messaging. Your messages are:
- Ultra-brief (mobile-first)
- Conversational and friendly
- Use emojis sparingly and appropriately
- Respect the personal nature of WhatsApp
- Provide immediate value

Remember: WhatsApp feels personal, so be respectful and concise.`,

  user_prompt_template: `Create a WhatsApp message:

**Recipient:** {{contact_name}} ({{company_name}})

**Context:** {{message_context}}
(e.g., opt-in list, previous interaction, referral)

**Message Goal:** {{message_goal}}

**Value/Offer:** {{value_offer}}

**Constraints:**
- Max length: 160 characters (aim for SMS-like brevity)
- Must comply with WhatsApp Business policy
- Include opt-out option

**Task:**
Generate a WhatsApp message that:
1. Gets to the point immediately
2. Delivers value in first sentence
3. Has ultra-clear CTA
4. Respects the personal channel

**Output Format (JSON):**
{
  "message_text": "string (main message)",
  "optional_image_description": "string (if using image)",
  "cta_button_text": "string (if using quick reply)",
  "opt_out_text": "Reply STOP to opt out",
  "estimated_response_rate": "low|medium|high"
}`,

  variables: ['contact_name', 'company_name', 'message_context', 'message_goal', 'value_offer'],
  model: 'claude-3-5-haiku-20241022',
  temperature: 0.6,
  max_tokens: 400,
};

// ============================================
// Prompt Helper Functions
// ============================================

/**
 * Build prompt with variables replaced
 */
export function buildPrompt(
  template: IClaudePrompt,
  variables: Record<string, string>
): { systemPrompt: string; userPrompt: string } {
  let userPrompt = template.user_prompt_template;

  // Replace all variables
  template.variables.forEach((variable) => {
    const value = variables[variable] || `[${variable} not provided]`;
    const regex = new RegExp(`{{${variable}}}`, 'g');
    userPrompt = userPrompt.replace(regex, value);
  });

  return {
    systemPrompt: template.system_prompt,
    userPrompt,
  };
}

/**
 * Get recommended prompt for channel and step
 */
export function getRecommendedPrompt(
  channel: 'email' | 'linkedin' | 'phone' | 'whatsapp',
  stepType: 'initial_outreach' | 'follow_up' | 'objection' | 'value_prop'
): IClaudePrompt {
  if (stepType === 'objection') return OBJECTION_HANDLER_PROMPT;
  if (stepType === 'value_prop') return VALUE_PROP_GENERATOR_PROMPT;
  if (stepType === 'follow_up') return FOLLOW_UP_GENERATOR_PROMPT;

  // Channel-specific for initial outreach
  switch (channel) {
    case 'linkedin':
      return LINKEDIN_MESSAGE_PROMPT;
    case 'phone':
      return VOICE_AI_SCRIPT_PROMPT;
    case 'whatsapp':
      return WHATSAPP_MESSAGE_PROMPT;
    case 'email':
    default:
      return VALUE_PROP_GENERATOR_PROMPT;
  }
}

/**
 * Validate required variables
 */
export function validatePromptVariables(
  template: IClaudePrompt,
  providedVariables: Record<string, string>
): { valid: boolean; missing: string[] } {
  const missing = template.variables.filter((variable) => !providedVariables[variable]);

  return {
    valid: missing.length === 0,
    missing,
  };
}

// ============================================
// Export All Prompts
// ============================================

export const ALL_PROMPTS = {
  COMPANY_RESEARCH: COMPANY_RESEARCH_PROMPT,
  PAIN_POINT_DETECTION: PAIN_POINT_DETECTION_PROMPT,
  VALUE_PROP_GENERATOR: VALUE_PROP_GENERATOR_PROMPT,
  AB_VARIANT_GENERATOR: AB_VARIANT_GENERATOR_PROMPT,
  OBJECTION_HANDLER: OBJECTION_HANDLER_PROMPT,
  FOLLOW_UP_GENERATOR: FOLLOW_UP_GENERATOR_PROMPT,
  LINKEDIN_MESSAGE: LINKEDIN_MESSAGE_PROMPT,
  VOICE_AI_SCRIPT: VOICE_AI_SCRIPT_PROMPT,
  WHATSAPP_MESSAGE: WHATSAPP_MESSAGE_PROMPT,
} as const;

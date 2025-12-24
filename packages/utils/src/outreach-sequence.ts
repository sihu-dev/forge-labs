/**
 * @forge/utils - Outreach Sequence Utilities (L1 - Molecules)
 *
 * Business logic for outreach sequence execution and optimization
 */

import type {
  IOutreachSequence,
  ISequenceStep,
  ILead,
  IOutreachExecution,
  ExecutionStatus,
  IResponseData,
  ResponseAction,
  ISequencePerformance,
  IVariantPerformance,
  IABVariant,
  ISendTimeOptimization,
  OUTREACH_CONSTANTS,
} from '@forge/types/outreach';

// ============================================
// Sequence Scheduling
// ============================================

/**
 * Calculate next step execution time
 */
export function calculateNextStepTime(
  currentStepExecutedAt: Date,
  nextStep: ISequenceStep,
  optimization?: ISendTimeOptimization
): Date {
  const baseTime = new Date(currentStepExecutedAt);

  // Add delay days
  baseTime.setDate(baseTime.getDate() + nextStep.delay_days);

  // Apply send time optimization if available
  if (optimization) {
    const optimizedTime = applyOptimalSendTime(baseTime, optimization);
    return optimizedTime;
  }

  // Default to 9 AM local time
  baseTime.setHours(9, 0, 0, 0);

  return baseTime;
}

/**
 * Apply optimal send time based on ML predictions
 */
export function applyOptimalSendTime(
  baseDate: Date,
  optimization: ISendTimeOptimization
): Date {
  const result = new Date(baseDate);

  // Set optimal hour
  result.setHours(optimization.optimal_hour, 0, 0, 0);

  // Adjust to optimal day if needed
  const targetDayIndex = getDayIndex(optimization.optimal_day);
  const currentDayIndex = result.getDay();

  if (currentDayIndex !== targetDayIndex) {
    const daysToAdd = (targetDayIndex - currentDayIndex + 7) % 7;
    result.setDate(result.getDate() + daysToAdd);
  }

  return result;
}

function getDayIndex(day: string): number {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days.indexOf(day.toLowerCase());
}

/**
 * Check if execution should be skipped based on conditions
 */
export function shouldSkipStep(
  step: ISequenceStep,
  previousExecutions: IOutreachExecution[]
): boolean {
  if (step.conditions.length === 0) return false;

  return step.conditions.some((condition) => {
    const previousStep = previousExecutions[previousExecutions.length - 1];
    if (!previousStep) return false;

    let conditionMet = false;

    switch (condition.type) {
      case 'previous_opened':
        conditionMet = previousStep.opened_at !== undefined;
        break;
      case 'previous_clicked':
        conditionMet = previousStep.clicked_at !== undefined;
        break;
      case 'previous_replied':
        conditionMet = previousStep.replied_at !== undefined;
        break;
      case 'custom':
        // Implement custom condition logic
        conditionMet = false;
        break;
    }

    return condition.skip_if_true === conditionMet;
  });
}

/**
 * Select next step in sequence
 */
export function getNextStep(
  sequence: IOutreachSequence,
  currentStepNumber: number,
  previousExecutions: IOutreachExecution[]
): ISequenceStep | null {
  const nextSteps = sequence.steps
    .filter((s) => s.step_number > currentStepNumber)
    .sort((a, b) => a.step_number - b.step_number);

  for (const step of nextSteps) {
    if (!shouldSkipStep(step, previousExecutions)) {
      return step;
    }
  }

  return null; // Sequence completed
}

// ============================================
// Response Detection & Classification
// ============================================

/**
 * Detect response type from message content
 */
export function detectResponseType(message: string): IResponseData['type'] {
  const lowerMessage = message.toLowerCase();

  // Check for unsubscribe first (highest priority)
  if (containsAny(lowerMessage, ['unsubscribe', 'remove me', 'stop', 'opt out'])) {
    return 'unsubscribe';
  }

  // Check for out of office
  if (containsAny(lowerMessage, ['out of office', 'ooo', 'vacation', 'away', 'auto-reply'])) {
    return 'out_of_office';
  }

  // Check for objections
  if (containsAny(lowerMessage, ['not interested', 'no budget', 'not now', 'too expensive'])) {
    return 'objection';
  }

  // Check for positive signals
  if (containsAny(lowerMessage, ['interested', 'yes', 'absolutely', 'schedule', 'meeting'])) {
    return 'positive';
  }

  return 'neutral';
}

/**
 * Calculate sentiment score (-1 to 1)
 */
export function calculateSentimentScore(message: string): number {
  const lowerMessage = message.toLowerCase();

  const positiveWords = ['great', 'excellent', 'interested', 'yes', 'perfect', 'absolutely'];
  const negativeWords = ['no', 'not', 'never', 'unfortunately', 'can\'t', 'won\'t'];

  let score = 0;
  positiveWords.forEach((word) => {
    if (lowerMessage.includes(word)) score += 0.2;
  });
  negativeWords.forEach((word) => {
    if (lowerMessage.includes(word)) score -= 0.2;
  });

  return Math.max(-1, Math.min(1, score));
}

/**
 * Determine next action based on response
 */
export function determineNextAction(responseData: IResponseData): ResponseAction {
  switch (responseData.type) {
    case 'positive':
      return responseData.sentiment_score > 0.5 ? 'schedule_meeting' : 'send_ai_reply';

    case 'objection':
      return responseData.sentiment_score < -0.5 ? 'escalate_to_human' : 'send_ai_reply';

    case 'out_of_office':
      return 'reschedule_sequence';

    case 'unsubscribe':
      return 'mark_unsubscribed';

    case 'neutral':
      return 'continue_sequence';

    default:
      return 'continue_sequence';
  }
}

/**
 * Detect objections from message
 */
export function detectObjections(message: string): string[] {
  const objections: string[] = [];
  const lowerMessage = message.toLowerCase();

  const objectionPatterns = [
    { pattern: /no budget|not budgeted|budget concerns/, objection: 'Budget Constraints' },
    { pattern: /not interested|no thanks/, objection: 'No Interest' },
    { pattern: /already have|current solution|working with/, objection: 'Existing Solution' },
    { pattern: /not the right time|maybe later|check back/, objection: 'Timing Issues' },
    { pattern: /not decision maker|talk to|need approval/, objection: 'Wrong Contact' },
    { pattern: /too expensive|pricing|cost/, objection: 'Price Objection' },
  ];

  objectionPatterns.forEach(({ pattern, objection }) => {
    if (pattern.test(lowerMessage)) {
      objections.push(objection);
    }
  });

  return objections;
}

// ============================================
// Performance Calculation
// ============================================

/**
 * Calculate sequence performance metrics
 */
export function calculateSequencePerformance(
  executions: IOutreachExecution[]
): Partial<ISequencePerformance> {
  const total = executions.length;
  if (total === 0) {
    return {
      emails_sent: 0,
      open_rate: 0,
      click_rate: 0,
      reply_rate: 0,
      bounce_rate: 0,
      conversion_rate: 0,
    };
  }

  const delivered = executions.filter((e) => e.status === 'delivered' || e.status === 'opened' || e.status === 'clicked' || e.status === 'replied').length;
  const opened = executions.filter((e) => e.opened_at !== undefined).length;
  const clicked = executions.filter((e) => e.clicked_at !== undefined).length;
  const replied = executions.filter((e) => e.replied_at !== undefined).length;
  const bounced = executions.filter((e) => e.status === 'bounced').length;

  return {
    emails_sent: total,
    emails_delivered: delivered,
    emails_opened: opened,
    emails_clicked: clicked,
    emails_replied: replied,
    emails_bounced: bounced,
    open_rate: delivered > 0 ? (opened / delivered) * 100 : 0,
    click_rate: opened > 0 ? (clicked / opened) * 100 : 0,
    reply_rate: delivered > 0 ? (replied / delivered) * 100 : 0,
    bounce_rate: total > 0 ? (bounced / total) * 100 : 0,
  };
}

/**
 * Calculate variant performance
 */
export function calculateVariantPerformance(
  variantId: string,
  executions: IOutreachExecution[]
): IVariantPerformance {
  const variantExecutions = executions.filter((e) => e.content.variant_id === variantId);
  const performance = calculateSequencePerformance(variantExecutions);

  return {
    variant_id: variantId,
    sent_count: variantExecutions.length,
    open_rate: performance.open_rate || 0,
    click_rate: performance.click_rate || 0,
    reply_rate: performance.reply_rate || 0,
    conversion_rate: 0, // Needs additional data
    confidence_score: calculateStatisticalConfidence(variantExecutions.length),
  };
}

/**
 * Calculate statistical confidence for A/B testing
 */
export function calculateStatisticalConfidence(sampleSize: number): number {
  // Simplified confidence calculation
  // In production, use proper statistical tests (Chi-square, t-test)
  if (sampleSize < 30) return 0;
  if (sampleSize < 100) return 0.8;
  if (sampleSize < 500) return 0.9;
  return 0.95;
}

/**
 * Determine A/B test winner
 */
export function determineABTestWinner(
  variants: IABVariant[],
  executions: IOutreachExecution[],
  criteria: 'open_rate' | 'click_rate' | 'reply_rate' | 'conversion_rate'
): string | null {
  const performances = variants.map((v) => ({
    variantId: v.id,
    performance: calculateVariantPerformance(v.id, executions),
  }));

  // Check if we have enough data
  const totalSamples = performances.reduce((sum, p) => sum + p.performance.sent_count, 0);
  if (totalSamples < 100) return null; // Need more data

  // Find best performing variant
  const sorted = performances.sort((a, b) => {
    const aValue = a.performance[criteria] || 0;
    const bValue = b.performance[criteria] || 0;
    return bValue - aValue;
  });

  const winner = sorted[0];

  // Check if confidence is high enough
  if (winner.performance.confidence_score >= 0.95) {
    return winner.variantId;
  }

  return null; // Not enough confidence
}

// ============================================
// Content Personalization
// ============================================

/**
 * Replace personalization tokens in content
 */
export function replacePersonalizationTokens(
  template: string,
  lead: ILead,
  customTokens?: Record<string, string>
): string {
  let result = template;

  // Standard tokens
  const tokens: Record<string, string> = {
    '{{first_name}}': lead.first_name,
    '{{last_name}}': lead.last_name,
    '{{company_name}}': lead.company_name,
    '{{job_title}}': lead.job_title || '',
    '{{email}}': lead.email,
    ...customTokens,
  };

  Object.entries(tokens).forEach(([token, value]) => {
    result = result.replace(new RegExp(token, 'g'), value);
  });

  return result;
}

/**
 * Select best variant based on performance
 */
export function selectBestVariant(
  variants: string[],
  variantPerformances?: Record<string, IVariantPerformance>
): string {
  if (!variantPerformances || variants.length === 1) {
    return variants[0];
  }

  // Find variant with best performance
  let bestVariant = variants[0];
  let bestScore = 0;

  variants.forEach((variant) => {
    const perf = variantPerformances[variant];
    if (perf) {
      const score = (perf.open_rate + perf.click_rate + perf.reply_rate * 2) / 4;
      if (score > bestScore) {
        bestScore = score;
        bestVariant = variant;
      }
    }
  });

  return bestVariant;
}

// ============================================
// Rate Limiting
// ============================================

/**
 * Check if within rate limit
 */
export function isWithinRateLimit(
  currentUsage: number,
  maxLimit: number,
  resetAt: Date
): boolean {
  const now = new Date();

  // If reset time has passed, we're good
  if (now >= resetAt) {
    return true;
  }

  // Check if current usage is below limit
  return currentUsage < maxLimit;
}

/**
 * Calculate rate limit reset time
 */
export function calculateRateLimitReset(
  period: 'hour' | 'day'
): Date {
  const now = new Date();
  const reset = new Date(now);

  if (period === 'hour') {
    reset.setHours(reset.getHours() + 1, 0, 0, 0);
  } else {
    reset.setDate(reset.getDate() + 1);
    reset.setHours(0, 0, 0, 0);
  }

  return reset;
}

// ============================================
// Helper Functions
// ============================================

function containsAny(text: string, keywords: string[]): boolean {
  return keywords.some((keyword) => text.includes(keyword));
}

/**
 * Generate execution summary
 */
export function generateExecutionSummary(executions: IOutreachExecution[]): string {
  const performance = calculateSequencePerformance(executions);

  return `
📊 Sequence Performance Summary

Total Sent: ${performance.emails_sent}
Delivered: ${performance.emails_delivered}
Opened: ${performance.emails_opened} (${performance.open_rate?.toFixed(1)}%)
Clicked: ${performance.emails_clicked} (${performance.click_rate?.toFixed(1)}%)
Replied: ${performance.emails_replied} (${performance.reply_rate?.toFixed(1)}%)
Bounced: ${performance.emails_bounced} (${performance.bounce_rate?.toFixed(1)}%)
  `.trim();
}

/**
 * Validate sequence configuration
 */
export function validateSequence(sequence: IOutreachSequence): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!sequence.name || sequence.name.trim().length === 0) {
    errors.push('Sequence name is required');
  }

  if (sequence.steps.length === 0) {
    errors.push('Sequence must have at least one step');
  }

  // Check step numbers are sequential
  const stepNumbers = sequence.steps.map((s) => s.step_number).sort((a, b) => a - b);
  for (let i = 0; i < stepNumbers.length; i++) {
    if (stepNumbers[i] !== i + 1) {
      errors.push(`Step numbers must be sequential (missing step ${i + 1})`);
      break;
    }
  }

  // Check each step has variants
  sequence.steps.forEach((step, idx) => {
    if (step.body_variants.length === 0) {
      errors.push(`Step ${idx + 1} must have at least one body variant`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

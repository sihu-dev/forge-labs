/**
 * MCP Prompts Registry
 * Prompts provide AI prompt templates with arguments
 */

import type { Prompt } from '@modelcontextprotocol/sdk/types.js';
import { getSupabaseClient } from '../lib/supabase.js';

// ============================================================================
// PROMPT DEFINITIONS
// ============================================================================

export const prompts: Prompt[] = [
  {
    name: 'qualify_bid',
    description: 'AI prompt template for bid qualification and go/no-go decision',
    arguments: [
      {
        name: 'bid_id',
        description: 'UUID of the bid to qualify',
        required: true,
      },
    ],
  },
  {
    name: 'match_product',
    description: 'AI prompt template for advanced product matching',
    arguments: [
      {
        name: 'bid_id',
        description: 'UUID of the bid',
        required: true,
      },
      {
        name: 'requirements',
        description: 'Additional requirements context',
        required: false,
      },
    ],
  },
  {
    name: 'write_proposal',
    description: 'AI prompt template for proposal generation',
    arguments: [
      {
        name: 'bid_id',
        description: 'UUID of the bid',
        required: true,
      },
      {
        name: 'product_ids',
        description: 'Comma-separated product IDs to include',
        required: true,
      },
      {
        name: 'tone',
        description: 'Tone of writing: professional, friendly, or technical',
        required: false,
      },
    ],
  },
];

// ============================================================================
// PROMPT HANDLER
// ============================================================================

export async function handlePromptGet(name: string, args: Record<string, string>) {
  switch (name) {
    case 'qualify_bid':
      return await generateQualifyBidPrompt(args.bid_id);

    case 'match_product':
      return await generateMatchProductPrompt(args.bid_id, args.requirements);

    case 'write_proposal':
      return await generateWriteProposalPrompt(args.bid_id, args.product_ids, args.tone);

    default:
      throw new Error(`Unknown prompt: ${name}`);
  }
}

// ============================================================================
// PROMPT GENERATORS
// ============================================================================

async function generateQualifyBidPrompt(bidId: string) {
  const supabase = getSupabaseClient();

  const { data: bid, error } = await supabase
    .from('bids')
    .select(`
      *,
      pipeline_entries (matched_products, match_score, ai_summary)
    `)
    .eq('id', bidId)
    .single();

  if (error || !bid) throw new Error('Bid not found');

  const pipelineEntry = bid.pipeline_entries?.[0];
  const productMatches = pipelineEntry?.matched_products || [];

  const promptText = `# Bid Qualification Analysis

Analyze this bid opportunity and provide a go/no-go recommendation for CMNTech.

## Bid Details
- **Title**: ${bid.title}
- **Organization**: ${bid.organization}
- **Deadline**: ${bid.deadline}
- **Estimated Amount**: ${bid.estimated_amount ? `₩${bid.estimated_amount.toLocaleString()}` : 'Not disclosed'}
- **Type**: ${bid.type}
- **Source**: ${bid.source}

## Requirements
${bid.raw_data?.requirements || 'Not specified'}

## Specifications
${bid.raw_data?.specifications || 'Not specified'}

## Product Match Analysis
${productMatches.length > 0
    ? productMatches.map((m: any) => `- ${m.productName}: ${m.score}/100 (${m.confidence})`).join('\n')
    : 'No products matched'}

${pipelineEntry?.ai_summary ? `## AI Summary\n${pipelineEntry.ai_summary}` : ''}

---

## Evaluation Criteria

Please evaluate on these dimensions:

### 1. Strategic Fit (30%)
- Does this align with our target markets?
- Is this organization a strategic customer?
- Does this showcase our core capabilities?

### 2. Win Probability (40%)
- How well do our products match the requirements?
- What is the competitive landscape?
- Do we have relevant case studies/references?
- Is the budget realistic for our solution?

### 3. Resource Requirements (20%)
- Can we deliver within the timeline?
- Do we have the technical expertise?
- Is the proposal effort justified by potential revenue?

### 4. Risk Assessment (10%)
- Are there any red flags in the requirements?
- Payment terms and financial stability of customer?
- Compliance and certification requirements?

---

## Output Format

Provide your recommendation in this structure:

**RECOMMENDATION**: [PURSUE | MONITOR | SKIP]

**SCORE**: [0-100]

**STRATEGIC FIT**: [Analysis]

**WIN PROBABILITY**: [Analysis]

**RESOURCE REQUIREMENTS**: [Analysis]

**RISKS**: [List key risks]

**NEXT ACTIONS**: [If PURSUE, what are immediate next steps?]`;

  return {
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: promptText,
        },
      },
    ],
  };
}

async function generateMatchProductPrompt(bidId: string, additionalRequirements?: string) {
  const supabase = getSupabaseClient();

  const { data: bid, error } = await supabase
    .from('bids')
    .select('*')
    .eq('id', bidId)
    .single();

  if (error || !bid) throw new Error('Bid not found');

  const promptText = `# Product Matching Analysis

Match the most suitable CMNTech products to this bid opportunity.

## Bid Information
- **Title**: ${bid.title}
- **Organization**: ${bid.organization}
- **Type**: ${bid.type}
- **Requirements**: ${bid.raw_data?.requirements || 'Not specified'}
- **Specifications**: ${bid.raw_data?.specifications || 'Not specified'}
${additionalRequirements ? `\n**Additional Context**: ${additionalRequirements}` : ''}

## CMNTech Product Lineup

1. **UR-1000PLUS®** - 다회선 초음파 유량계
   - Pipe Size: 100-4000mm (만관형)
   - Best for: 상수도, 취수장, 정수장
   - Keywords: 초음파, 다회선, 만관, 정밀유량측정

2. **MF-1000C** - 일체형 전자유량계
   - Pipe Size: 15-2000mm
   - Best for: 상거래용, 공업용수, 계량기
   - Keywords: 전자식, 상거래, 계량

3. **UR-1010PLUS®** - 비만관형 초음파 유량계
   - Pipe Size: 200-3000mm (부분충수)
   - Best for: 하수, 우수, 복류수
   - Keywords: 비만관, 하수, 우수, 부분충수

4. **SL-3000PLUS** - 개수로 유량계
   - Best for: 하천, 개수로, 방류량, 농업용수
   - Keywords: 개수로, 하천, 방류

5. **EnerRay** - 초음파 열량계
   - Pipe Size: 15-300mm
   - Best for: 난방, 열교환, 지역난방
   - Keywords: 열량, 에너지, 난방

---

## Analysis Task

For each product, provide:
1. **Match Score** (0-100)
2. **Confidence Level** (very_high | high | medium | low)
3. **Matching Criteria**
4. **Gap Analysis** (requirements not met)
5. **Recommendation** (primary, secondary, not suitable)

Output as JSON:
\`\`\`json
{
  "recommended": "Product ID",
  "matches": [
    {
      "product_id": "UR-1000PLUS",
      "score": 85,
      "confidence": "high",
      "reasons": ["Reason 1", "Reason 2"],
      "requirements_match": ["Match 1"],
      "requirements_gap": ["Gap 1"]
    }
  ]
}
\`\`\``;

  return {
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: promptText,
        },
      },
    ],
  };
}

async function generateWriteProposalPrompt(bidId: string, productIds: string, tone?: string) {
  const supabase = getSupabaseClient();

  const { data: bid, error } = await supabase
    .from('bids')
    .select('*')
    .eq('id', bidId)
    .single();

  if (error || !bid) throw new Error('Bid not found');

  const products = productIds.split(',');
  const toneInstructions = {
    professional: 'formal, businesslike, authoritative',
    friendly: 'warm, approachable, customer-focused',
    technical: 'detailed, engineering-focused, specifications-heavy',
  }[tone || 'professional'] || 'professional and clear';

  const promptText = `# Proposal Generation

Write a compelling technical proposal for this bid opportunity.

## Bid Details
- **Title**: ${bid.title}
- **Organization**: ${bid.organization}
- **Deadline**: ${bid.deadline}
- **Requirements**: ${bid.raw_data?.requirements || 'See bid announcement'}
- **Specifications**: ${bid.raw_data?.specifications || 'See bid announcement'}

## Proposed Products
${products.map((p) => `- ${p}`).join('\n')}

## Writing Guidelines
- **Tone**: ${toneInstructions}
- **Length**: 3-5 pages
- **Language**: Korean (formal business Korean)
- **Format**: Structured with clear sections

---

## Required Sections

### 1. Executive Summary (1 page)
Concise overview of our solution and value proposition.

### 2. Understanding of Requirements (0.5 page)
Demonstrate we fully understand the customer's needs and challenges.

### 3. Technical Approach (1.5 pages)
- Proposed solution architecture
- Product specifications
- Why our products are the best fit
- Technical advantages over competitors

### 4. Implementation Plan (0.5 page)
- Project timeline
- Installation methodology
- Quality assurance
- Training and support

### 5. Company Credentials (0.5 page)
- CMNTech expertise in flow measurement
- Relevant case studies and references
- Certifications and quality standards

### 6. Pricing (Optional, 0.5 page)
Competitive and transparent pricing structure.

---

Generate a professional proposal following this structure. Focus on demonstrating value, technical excellence, and customer success.`;

  return {
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: promptText,
        },
      },
    ],
  };
}

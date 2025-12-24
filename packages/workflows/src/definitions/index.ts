/**
 * 워크플로우 정의 모음
 */

export { leadEnrichmentWorkflow } from './lead-enrichment.js';
export { leadScoringWorkflow } from './lead-scoring.js';
export { outreachSequenceWorkflow } from './outreach-sequence.js';
export { crmSyncWorkflow } from './crm-sync.js';
export { crossSellWorkflow } from './cross-sell.js';

// 모든 워크플로우 배열
import { leadEnrichmentWorkflow } from './lead-enrichment.js';
import { leadScoringWorkflow } from './lead-scoring.js';
import { outreachSequenceWorkflow } from './outreach-sequence.js';
import { crmSyncWorkflow } from './crm-sync.js';
import { crossSellWorkflow } from './cross-sell.js';

export const ALL_WORKFLOWS = [
  leadEnrichmentWorkflow,
  leadScoringWorkflow,
  outreachSequenceWorkflow,
  crmSyncWorkflow,
  crossSellWorkflow,
] as const;

/**
 * @forge/crm - HubSpot Provider (Stub)
 * L2 Cells - HubSpot CRM 프로바이더 (스케일 시 구현)
 */

import type { ICRMProvider, ICRMConfig } from '../../interfaces/index.js';
import { HubSpotLeadManager } from './lead-manager.js';
import { HubSpotDealManager } from './deal-manager.js';
import { HubSpotCompanyManager } from './company-manager.js';

/**
 * HubSpot CRM Provider (Stub)
 * TODO: 스케일 시 실제 HubSpot API 연동
 */
export class HubSpotProvider implements ICRMProvider {
  readonly type = 'hubspot' as const;
  readonly leads: HubSpotLeadManager;
  readonly deals: HubSpotDealManager;
  readonly companies: HubSpotCompanyManager;

  private initialized = false;

  constructor(private readonly config: ICRMConfig) {
    if (config.provider !== 'hubspot') {
      throw new Error(`Invalid provider: expected 'hubspot', got '${config.provider}'`);
    }

    const baseUrl = config.baseUrl || 'https://api.hubapi.com';

    this.leads = new HubSpotLeadManager(config.apiKey, baseUrl);
    this.deals = new HubSpotDealManager(config.apiKey, baseUrl);
    this.companies = new HubSpotCompanyManager(config.apiKey, baseUrl);
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    throw new Error('HubSpot provider not yet implemented. Use Attio provider or implement HubSpot integration.');
  }

  async testConnection(): Promise<boolean> {
    console.warn('HubSpot provider not yet implemented');
    return false;
  }

  async dispose(): Promise<void> {
    this.initialized = false;
  }
}

export { HubSpotLeadManager } from './lead-manager.js';
export { HubSpotDealManager } from './deal-manager.js';
export { HubSpotCompanyManager } from './company-manager.js';

/**
 * @forge/crm - Attio Provider
 * L2 Cells - Attio CRM 프로바이더
 */

import type { ICRMProvider, ICRMConfig } from '../../interfaces/index.js';
import { AttioLeadManager } from './lead-manager.js';
import { AttioDealManager } from './deal-manager.js';
import { AttioCompanyManager } from './company-manager.js';
import { AttioSyncService } from './sync-service.js';

/**
 * Attio CRM Provider
 */
export class AttioProvider implements ICRMProvider {
  readonly type = 'attio' as const;
  readonly leads: AttioLeadManager;
  readonly deals: AttioDealManager;
  readonly companies: AttioCompanyManager;
  readonly sync: AttioSyncService;

  private initialized = false;

  constructor(private readonly config: ICRMConfig) {
    if (config.provider !== 'attio') {
      throw new Error(`Invalid provider: expected 'attio', got '${config.provider}'`);
    }

    const baseUrl = config.baseUrl || 'https://api.attio.com/v2';

    this.leads = new AttioLeadManager(config.apiKey, baseUrl);
    this.deals = new AttioDealManager(config.apiKey, baseUrl);
    this.companies = new AttioCompanyManager(config.apiKey, baseUrl);
    this.sync = new AttioSyncService(config.apiKey, baseUrl);
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // API 연결 테스트
    const connected = await this.testConnection();
    if (!connected) {
      throw new Error('Failed to connect to Attio API');
    }

    this.initialized = true;
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl || 'https://api.attio.com/v2'}/self`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Attio connection test failed:', error);
      return false;
    }
  }

  async dispose(): Promise<void> {
    this.initialized = false;
  }
}

export { AttioLeadManager } from './lead-manager.js';
export { AttioDealManager } from './deal-manager.js';
export { AttioCompanyManager } from './company-manager.js';
export { AttioSyncService } from './sync-service.js';

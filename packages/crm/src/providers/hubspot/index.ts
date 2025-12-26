/**
 * @forge/crm - HubSpot Provider
 * L2 Cells - HubSpot CRM 프로바이더
 */

import type { ICRMProvider, ICRMConfig } from '../../interfaces/index.js';
import { HubSpotLeadManager } from './lead-manager.js';
import { HubSpotDealManager } from './deal-manager.js';
import { HubSpotCompanyManager } from './company-manager.js';

/**
 * HubSpot CRM Provider
 * HubSpot CRM API v3와 통합
 */
export class HubSpotProvider implements ICRMProvider {
  readonly type = 'hubspot' as const;
  readonly leads: HubSpotLeadManager;
  readonly deals: HubSpotDealManager;
  readonly companies: HubSpotCompanyManager;

  private initialized = false;
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(private readonly config: ICRMConfig) {
    if (config.provider !== 'hubspot') {
      throw new Error(`Invalid provider: expected 'hubspot', got '${config.provider}'`);
    }

    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.hubapi.com';

    this.leads = new HubSpotLeadManager(this.apiKey, this.baseUrl);
    this.deals = new HubSpotDealManager(this.apiKey, this.baseUrl);
    this.companies = new HubSpotCompanyManager(this.apiKey, this.baseUrl);
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // 연결 테스트
    const isConnected = await this.testConnection();
    if (!isConnected) {
      throw new Error('Failed to connect to HubSpot API. Please check your API key.');
    }

    this.initialized = true;
  }

  async testConnection(): Promise<boolean> {
    try {
      // HubSpot API 접근 확인 - 계정 정보 조회
      const response = await fetch(`${this.baseUrl}/account-info/v3/api-usage/daily`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      // 401/403은 인증 실패
      if (response.status === 401 || response.status === 403) {
        console.error('HubSpot authentication failed');
        return false;
      }

      // 일부 API 엔드포인트는 권한에 따라 다른 응답을 줄 수 있음
      // 접근이 되면 연결 성공으로 판단
      return response.ok || response.status === 404;
    } catch (error) {
      console.error('HubSpot connection test failed:', error);
      return false;
    }
  }

  async dispose(): Promise<void> {
    this.initialized = false;
  }
}

export { HubSpotLeadManager } from './lead-manager.js';
export { HubSpotDealManager } from './deal-manager.js';
export { HubSpotCompanyManager } from './company-manager.js';

/**
 * @forge/crm - CRM Factory
 * L2 Cells - CRM 프로바이더 팩토리 (Strategy 패턴)
 */

import type { ICRMProvider, ICRMConfig, CRMProviderType } from './interfaces/index.js';
import { AttioProvider } from './providers/attio/index.js';
import { HubSpotProvider } from './providers/hubspot/index.js';

/**
 * CRM 프로바이더 팩토리
 * Strategy 패턴으로 프로바이더 교체 가능
 */
export class CRMFactory {
  private static providers = new Map<CRMProviderType, typeof AttioProvider | typeof HubSpotProvider>([
    ['attio', AttioProvider],
    ['hubspot', HubSpotProvider]
  ]);

  /**
   * CRM 프로바이더 생성
   * @param config - CRM 설정
   * @returns ICRMProvider 인스턴스
   *
   * @example
   * ```typescript
   * const crm = CRMFactory.create({
   *   provider: 'attio',
   *   apiKey: process.env.ATTIO_API_KEY!
   * });
   *
   * await crm.initialize();
   *
   * const lead = await crm.leads.create({
   *   email: 'john@example.com',
   *   firstName: 'John',
   *   lastName: 'Doe',
   *   source: 'website'
   * });
   * ```
   */
  static create(config: ICRMConfig): ICRMProvider {
    const ProviderClass = this.providers.get(config.provider);

    if (!ProviderClass) {
      throw new Error(`Unknown CRM provider: ${config.provider}`);
    }

    return new ProviderClass(config);
  }

  /**
   * 환경변수에서 설정 로드
   * @param provider - CRM 프로바이더 타입
   * @returns CRM 프로바이더 인스턴스
   *
   * @example
   * ```typescript
   * // .env
   * // ATTIO_API_KEY=your_api_key
   *
   * const crm = CRMFactory.createFromEnv('attio');
   * await crm.initialize();
   * ```
   */
  static createFromEnv(provider: CRMProviderType): ICRMProvider {
    const apiKey = this.getApiKeyFromEnv(provider);

    if (!apiKey) {
      throw new Error(`Missing API key for ${provider}. Set ${this.getEnvKeyName(provider)} in environment.`);
    }

    return this.create({
      provider,
      apiKey
    });
  }

  /**
   * 지원하는 프로바이더 목록 조회
   */
  static getSupportedProviders(): CRMProviderType[] {
    return Array.from(this.providers.keys());
  }

  /**
   * 프로바이더 지원 여부 확인
   */
  static isSupported(provider: string): provider is CRMProviderType {
    return this.providers.has(provider as CRMProviderType);
  }

  /**
   * 환경변수에서 API 키 조회
   */
  private static getApiKeyFromEnv(provider: CRMProviderType): string | undefined {
    const envKeyName = this.getEnvKeyName(provider);
    return process.env[envKeyName];
  }

  /**
   * 환경변수 키 이름 조회
   */
  private static getEnvKeyName(provider: CRMProviderType): string {
    const envKeyMap: Record<CRMProviderType, string> = {
      attio: 'ATTIO_API_KEY',
      hubspot: 'HUBSPOT_API_KEY'
    };

    return envKeyMap[provider];
  }
}

/**
 * 편의 함수: Attio CRM 생성
 */
export function createAttioCRM(apiKey: string): ICRMProvider {
  return CRMFactory.create({ provider: 'attio', apiKey });
}

/**
 * 편의 함수: HubSpot CRM 생성
 */
export function createHubSpotCRM(apiKey: string): ICRMProvider {
  return CRMFactory.create({ provider: 'hubspot', apiKey });
}

/**
 * @forge/crm - CRM 추상화 레이어
 * L2 Cells - Attio & HubSpot 지원
 *
 * Strategy 패턴으로 CRM 프로바이더 교체 가능
 *
 * @example
 * ```typescript
 * import { CRMFactory } from '@forge/crm';
 *
 * // 방법 1: 직접 생성
 * const crm = CRMFactory.create({
 *   provider: 'attio',
 *   apiKey: 'your_api_key'
 * });
 *
 * // 방법 2: 환경변수에서 로드
 * const crm = CRMFactory.createFromEnv('attio');
 *
 * // 초기화
 * await crm.initialize();
 *
 * // 리드 생성
 * const lead = await crm.leads.create({
 *   email: 'john@example.com',
 *   firstName: 'John',
 *   lastName: 'Doe',
 *   source: 'website'
 * });
 *
 * // 딜 생성
 * const deal = await crm.deals.create({
 *   title: 'HEPHAITOS Enterprise',
 *   stage: 'proposal',
 *   priority: 'high',
 *   value: 10000000,
 *   currency: 'KRW'
 * });
 * ```
 */

// Interfaces
export * from './interfaces/index.js';

// Factory
export * from './factory.js';

// Providers
export * from './providers/attio/index.js';
export * from './providers/hubspot/index.js';

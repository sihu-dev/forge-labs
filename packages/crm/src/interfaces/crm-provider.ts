/**
 * @forge/crm - CRM Provider Interface
 * L2 Cells - CRM 추상화 레이어
 */

import type { ILeadManager } from './lead-manager.js';
import type { IDealManager } from './deal-manager.js';
import type { ICompanyManager } from './company-manager.js';

/**
 * CRM 프로바이더 타입
 */
export type CRMProviderType = 'attio' | 'hubspot';

/**
 * CRM 프로바이더 설정
 */
export interface ICRMConfig {
  provider: CRMProviderType;
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  retryAttempts?: number;
}

/**
 * CRM 프로바이더 공통 인터페이스
 * Strategy 패턴으로 프로바이더 교체 가능
 */
export interface ICRMProvider {
  /**
   * 프로바이더 타입
   */
  readonly type: CRMProviderType;

  /**
   * 리드 관리자
   */
  readonly leads: ILeadManager;

  /**
   * 딜 관리자
   */
  readonly deals: IDealManager;

  /**
   * 회사 관리자
   */
  readonly companies: ICompanyManager;

  /**
   * API 연결 테스트
   */
  testConnection(): Promise<boolean>;

  /**
   * 프로바이더 초기화
   */
  initialize(): Promise<void>;

  /**
   * 프로바이더 종료
   */
  dispose(): Promise<void>;
}

/**
 * CRM API 응답 래퍼
 */
export interface ICRMResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  metadata?: {
    requestId?: string;
    timestamp: string;
    rateLimit?: {
      limit: number;
      remaining: number;
      reset: string;
    };
  };
}

/**
 * 페이지네이션 파라미터
 */
export interface IPaginationParams {
  limit?: number;
  offset?: number;
  cursor?: string;
}

/**
 * 페이지네이션 응답
 */
export interface IPaginatedResponse<T> {
  items: T[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
}

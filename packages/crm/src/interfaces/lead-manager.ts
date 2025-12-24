/**
 * @forge/crm - Lead Manager Interface
 * L2 Cells - 리드 관리 인터페이스
 */

import type { ICRMResponse, IPaginatedResponse, IPaginationParams } from './crm-provider.js';

/**
 * 리드 상태
 */
export type LeadStatus =
  | 'new'           // 신규
  | 'contacted'     // 접촉
  | 'qualified'     // 검증됨
  | 'unqualified'   // 부적격
  | 'nurturing'     // 육성중
  | 'converted'     // 전환됨
  | 'lost';         // 실패

/**
 * 리드 소스
 */
export type LeadSource =
  | 'website'       // 웹사이트
  | 'referral'      // 추천
  | 'social'        // 소셜미디어
  | 'event'         // 이벤트
  | 'outbound'      // 아웃바운드
  | 'partner'       // 파트너
  | 'other';        // 기타

/**
 * 리드 엔티티
 */
export interface ILead {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  status: LeadStatus;
  source: LeadSource;
  score?: number;              // 리드 점수 (0-100)
  tags?: string[];
  customFields?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  convertedAt?: string;        // 전환 시각
  lastContactedAt?: string;    // 마지막 접촉 시각
}

/**
 * 리드 생성 데이터
 */
export interface ICreateLeadData {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  source: LeadSource;
  tags?: string[];
  customFields?: Record<string, unknown>;
}

/**
 * 리드 업데이트 데이터
 */
export interface IUpdateLeadData {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  status?: LeadStatus;
  source?: LeadSource;
  score?: number;
  tags?: string[];
  customFields?: Record<string, unknown>;
}

/**
 * 리드 필터
 */
export interface ILeadFilter {
  status?: LeadStatus[];
  source?: LeadSource[];
  tags?: string[];
  scoreMin?: number;
  scoreMax?: number;
  createdAfter?: string;
  createdBefore?: string;
  search?: string;             // 이메일, 이름, 회사명 검색
}

/**
 * 리드 관리 인터페이스
 */
export interface ILeadManager {
  /**
   * 리드 생성
   */
  create(data: ICreateLeadData): Promise<ICRMResponse<ILead>>;

  /**
   * 리드 조회
   */
  getById(id: string): Promise<ICRMResponse<ILead>>;

  /**
   * 이메일로 리드 조회
   */
  getByEmail(email: string): Promise<ICRMResponse<ILead | null>>;

  /**
   * 리드 업데이트
   */
  update(id: string, data: IUpdateLeadData): Promise<ICRMResponse<ILead>>;

  /**
   * 리드 삭제
   */
  delete(id: string): Promise<ICRMResponse<void>>;

  /**
   * 리드 목록 조회
   */
  list(
    filter?: ILeadFilter,
    pagination?: IPaginationParams
  ): Promise<ICRMResponse<IPaginatedResponse<ILead>>>;

  /**
   * 리드 상태 변경
   */
  updateStatus(id: string, status: LeadStatus): Promise<ICRMResponse<ILead>>;

  /**
   * 리드 점수 업데이트
   */
  updateScore(id: string, score: number): Promise<ICRMResponse<ILead>>;

  /**
   * 리드에 태그 추가
   */
  addTags(id: string, tags: string[]): Promise<ICRMResponse<ILead>>;

  /**
   * 리드에서 태그 제거
   */
  removeTags(id: string, tags: string[]): Promise<ICRMResponse<ILead>>;

  /**
   * 리드를 딜로 전환
   */
  convertToDeal(id: string, dealData?: Record<string, unknown>): Promise<ICRMResponse<{ leadId: string; dealId: string }>>;
}

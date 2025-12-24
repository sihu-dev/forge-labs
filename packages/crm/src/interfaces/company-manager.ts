/**
 * @forge/crm - Company Manager Interface
 * L2 Cells - 회사 관리 인터페이스
 */

import type { ICRMResponse, IPaginatedResponse, IPaginationParams } from './crm-provider.js';

/**
 * 회사 규모
 */
export type CompanySize =
  | 'startup'       // 스타트업 (1-10명)
  | 'small'         // 소기업 (11-50명)
  | 'medium'        // 중기업 (51-200명)
  | 'large'         // 대기업 (201-1000명)
  | 'enterprise';   // 엔터프라이즈 (1000명+)

/**
 * 회사 산업
 */
export type CompanyIndustry =
  | 'technology'    // 기술
  | 'finance'       // 금융
  | 'healthcare'    // 헬스케어
  | 'education'     // 교육
  | 'retail'        // 소매
  | 'manufacturing' // 제조
  | 'services'      // 서비스
  | 'other';        // 기타

/**
 * 회사 상태
 */
export type CompanyStatus =
  | 'active'        // 활성
  | 'prospect'      // 잠재고객
  | 'customer'      // 고객
  | 'churned'       // 이탈
  | 'inactive';     // 비활성

/**
 * 회사 엔티티
 */
export interface ICompany {
  id: string;
  name: string;
  domain?: string;
  description?: string;
  industry?: CompanyIndustry;
  size?: CompanySize;
  status: CompanyStatus;
  website?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  employeeCount?: number;
  annualRevenue?: number;
  currency?: string;
  foundedYear?: number;
  tags?: string[];
  socialProfiles?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
  customFields?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/**
 * 회사 생성 데이터
 */
export interface ICreateCompanyData {
  name: string;
  domain?: string;
  description?: string;
  industry?: CompanyIndustry;
  size?: CompanySize;
  website?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  employeeCount?: number;
  annualRevenue?: number;
  currency?: string;
  foundedYear?: number;
  tags?: string[];
  socialProfiles?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
  customFields?: Record<string, unknown>;
}

/**
 * 회사 업데이트 데이터
 */
export interface IUpdateCompanyData {
  name?: string;
  domain?: string;
  description?: string;
  industry?: CompanyIndustry;
  size?: CompanySize;
  status?: CompanyStatus;
  website?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  employeeCount?: number;
  annualRevenue?: number;
  currency?: string;
  foundedYear?: number;
  tags?: string[];
  socialProfiles?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
  customFields?: Record<string, unknown>;
}

/**
 * 회사 필터
 */
export interface ICompanyFilter {
  status?: CompanyStatus[];
  industry?: CompanyIndustry[];
  size?: CompanySize[];
  tags?: string[];
  employeeCountMin?: number;
  employeeCountMax?: number;
  revenueMin?: number;
  revenueMax?: number;
  country?: string;
  search?: string;             // 이름, 도메인 검색
}

/**
 * 회사 관리 인터페이스
 */
export interface ICompanyManager {
  /**
   * 회사 생성
   */
  create(data: ICreateCompanyData): Promise<ICRMResponse<ICompany>>;

  /**
   * 회사 조회
   */
  getById(id: string): Promise<ICRMResponse<ICompany>>;

  /**
   * 도메인으로 회사 조회
   */
  getByDomain(domain: string): Promise<ICRMResponse<ICompany | null>>;

  /**
   * 회사 업데이트
   */
  update(id: string, data: IUpdateCompanyData): Promise<ICRMResponse<ICompany>>;

  /**
   * 회사 삭제
   */
  delete(id: string): Promise<ICRMResponse<void>>;

  /**
   * 회사 목록 조회
   */
  list(
    filter?: ICompanyFilter,
    pagination?: IPaginationParams
  ): Promise<ICRMResponse<IPaginatedResponse<ICompany>>>;

  /**
   * 회사 상태 변경
   */
  updateStatus(id: string, status: CompanyStatus): Promise<ICRMResponse<ICompany>>;

  /**
   * 회사에 태그 추가
   */
  addTags(id: string, tags: string[]): Promise<ICRMResponse<ICompany>>;

  /**
   * 회사에서 태그 제거
   */
  removeTags(id: string, tags: string[]): Promise<ICRMResponse<ICompany>>;

  /**
   * 회사의 연락처 목록 조회
   */
  getContacts(id: string): Promise<ICRMResponse<unknown[]>>;

  /**
   * 회사의 딜 목록 조회
   */
  getDeals(id: string): Promise<ICRMResponse<unknown[]>>;

  /**
   * 도메인으로 회사 정보 자동 채우기 (enrichment)
   */
  enrichByDomain(domain: string): Promise<ICRMResponse<Partial<ICompany>>>;
}

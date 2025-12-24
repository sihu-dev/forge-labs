/**
 * @forge/crm - Deal Manager Interface
 * L2 Cells - 딜 관리 인터페이스
 */

import type { ICRMResponse, IPaginatedResponse, IPaginationParams } from './crm-provider.js';

/**
 * 딜 스테이지
 */
export type DealStage =
  | 'lead'          // 리드
  | 'qualification' // 검증
  | 'proposal'      // 제안
  | 'negotiation'   // 협상
  | 'closed_won'    // 성공
  | 'closed_lost';  // 실패

/**
 * 딜 우선순위
 */
export type DealPriority = 'low' | 'medium' | 'high' | 'critical';

/**
 * 딜 엔티티
 */
export interface IDeal {
  id: string;
  title: string;
  description?: string;
  stage: DealStage;
  priority: DealPriority;
  value: number;               // 딜 금액
  currency: string;            // 통화 (KRW, USD 등)
  probability?: number;        // 성공 확률 (0-100)
  expectedCloseDate?: string;
  actualCloseDate?: string;
  contactId?: string;          // 연결된 리드/컨택트 ID
  companyId?: string;          // 연결된 회사 ID
  ownerId?: string;            // 담당자 ID
  tags?: string[];
  customFields?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/**
 * 딜 생성 데이터
 */
export interface ICreateDealData {
  title: string;
  description?: string;
  stage: DealStage;
  priority?: DealPriority;
  value: number;
  currency?: string;
  probability?: number;
  expectedCloseDate?: string;
  contactId?: string;
  companyId?: string;
  ownerId?: string;
  tags?: string[];
  customFields?: Record<string, unknown>;
}

/**
 * 딜 업데이트 데이터
 */
export interface IUpdateDealData {
  title?: string;
  description?: string;
  stage?: DealStage;
  priority?: DealPriority;
  value?: number;
  currency?: string;
  probability?: number;
  expectedCloseDate?: string;
  actualCloseDate?: string;
  contactId?: string;
  companyId?: string;
  ownerId?: string;
  tags?: string[];
  customFields?: Record<string, unknown>;
}

/**
 * 딜 필터
 */
export interface IDealFilter {
  stage?: DealStage[];
  priority?: DealPriority[];
  tags?: string[];
  valueMin?: number;
  valueMax?: number;
  probabilityMin?: number;
  probabilityMax?: number;
  expectedCloseBefore?: string;
  expectedCloseAfter?: string;
  ownerId?: string;
  companyId?: string;
  search?: string;             // 제목, 설명 검색
}

/**
 * 딜 통계
 */
export interface IDealStats {
  totalDeals: number;
  totalValue: number;
  avgValue: number;
  winRate: number;             // 성공률 (%)
  avgDaysToClose: number;
  byStage: Record<DealStage, { count: number; value: number }>;
  byPriority: Record<DealPriority, { count: number; value: number }>;
}

/**
 * 딜 관리 인터페이스
 */
export interface IDealManager {
  /**
   * 딜 생성
   */
  create(data: ICreateDealData): Promise<ICRMResponse<IDeal>>;

  /**
   * 딜 조회
   */
  getById(id: string): Promise<ICRMResponse<IDeal>>;

  /**
   * 딜 업데이트
   */
  update(id: string, data: IUpdateDealData): Promise<ICRMResponse<IDeal>>;

  /**
   * 딜 삭제
   */
  delete(id: string): Promise<ICRMResponse<void>>;

  /**
   * 딜 목록 조회
   */
  list(
    filter?: IDealFilter,
    pagination?: IPaginationParams
  ): Promise<ICRMResponse<IPaginatedResponse<IDeal>>>;

  /**
   * 딜 스테이지 변경
   */
  updateStage(id: string, stage: DealStage): Promise<ICRMResponse<IDeal>>;

  /**
   * 딜 우선순위 변경
   */
  updatePriority(id: string, priority: DealPriority): Promise<ICRMResponse<IDeal>>;

  /**
   * 딜에 태그 추가
   */
  addTags(id: string, tags: string[]): Promise<ICRMResponse<IDeal>>;

  /**
   * 딜에서 태그 제거
   */
  removeTags(id: string, tags: string[]): Promise<ICRMResponse<IDeal>>;

  /**
   * 딜 통계 조회
   */
  getStats(filter?: IDealFilter): Promise<ICRMResponse<IDealStats>>;

  /**
   * 딜 성공 처리
   */
  markAsWon(id: string, actualCloseDate?: string): Promise<ICRMResponse<IDeal>>;

  /**
   * 딜 실패 처리
   */
  markAsLost(id: string, reason?: string): Promise<ICRMResponse<IDeal>>;
}

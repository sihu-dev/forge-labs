/**
 * @forge/types - FOLIO Competitor Types
 * L0 (Atoms) - 경쟁사 정보 타입 정의
 */

import type { Timestamp } from '../index';
import type { BusinessCategory } from './category.js';
import type { ILocation } from './location.js';
import type { IProduct, IPriceRange } from './product.js';

/**
 * 데이터 소스
 */
export type DataSource =
  | 'naver_place'
  | 'kakao_local'
  | 'google_maps'
  | 'manual';

/**
 * 경쟁사 정보 인터페이스
 */
export interface ICompetitor {
  /** 고유 ID */
  id: string;
  /** 상호명 */
  name: string;
  /** 업종 카테고리 */
  category: BusinessCategory;
  /** 세부 카테고리 */
  subCategory?: string;
  /** 위치 정보 */
  location: ILocation;
  /** 연락처 */
  phone?: string;
  /** 영업시간 */
  businessHours?: IBusinessHours;

  /** 평점 (0-5) */
  rating: number;
  /** 리뷰 수 */
  reviewCount: number;
  /** 가격대 */
  priceRange: IPriceRange;

  /** 상품/메뉴 목록 */
  products: IProduct[];

  /** 데이터 소스 */
  source: DataSource;
  /** 소스 ID (네이버/카카오 ID) */
  sourceId?: string;
  /** 크롤링 일시 */
  crawledAt: Timestamp;
  /** 마지막 업데이트 */
  updatedAt: Timestamp;
}

/**
 * 영업시간 인터페이스
 */
export interface IBusinessHours {
  /** 요일별 영업시간 */
  weekday: IDayHours;
  saturday?: IDayHours;
  sunday?: IDayHours;
  holiday?: IDayHours;
  /** 휴무일 */
  closedDays?: string[];
}

/**
 * 일별 영업시간
 */
export interface IDayHours {
  open: string;   // "09:00"
  close: string;  // "22:00"
  breakStart?: string;
  breakEnd?: string;
}

/**
 * 경쟁사 요약 인터페이스
 */
export interface ICompetitorSummary {
  id: string;
  name: string;
  category: BusinessCategory;
  rating: number;
  reviewCount: number;
  priceRange: IPriceRange;
  distance?: number;  // 미터
}

/**
 * 경쟁사 변동 이벤트
 */
export interface ICompetitorChange {
  competitorId: string;
  changeType: 'price' | 'menu' | 'rating' | 'new' | 'closed';
  field?: string;
  oldValue?: unknown;
  newValue?: unknown;
  detectedAt: Timestamp;
}

/**
 * 경쟁사 필터 인터페이스
 */
export interface ICompetitorFilter {
  category?: BusinessCategory;
  minRating?: number;
  maxDistance?: number;
  priceRange?: IPriceRange;
  source?: DataSource;
}

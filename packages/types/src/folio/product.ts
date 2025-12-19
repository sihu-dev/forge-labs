/**
 * @forge/types - FOLIO Product Types
 * L0 (Atoms) - 상품/메뉴 타입 정의
 */

import type { Timestamp } from '../index';

/**
 * 가격대 enum
 */
export type PriceLevel = 'budget' | 'moderate' | 'premium' | 'luxury';

/**
 * 가격 범위 인터페이스
 */
export interface IPriceRange {
  /** 최저가 */
  min: number;
  /** 최고가 */
  max: number;
  /** 통화 */
  currency: string;
  /** 가격대 레벨 */
  level?: PriceLevel;
}

/**
 * 상품/메뉴 인터페이스
 */
export interface IProduct {
  /** 고유 ID */
  id: string;
  /** 상품명 */
  name: string;
  /** 설명 */
  description?: string;
  /** 가격 */
  price: number;
  /** 통화 */
  currency: string;
  /** 카테고리 */
  category?: string;
  /** 이미지 URL */
  imageUrl?: string;
  /** 인기 상품 여부 */
  isPopular?: boolean;
  /** 신메뉴 여부 */
  isNew?: boolean;
  /** 품절 여부 */
  isSoldOut?: boolean;
  /** 마지막 업데이트 */
  updatedAt?: Timestamp;
}

/**
 * 메뉴판 인터페이스
 */
export interface IMenu {
  /** 경쟁사 ID */
  competitorId: string;
  /** 카테고리별 상품 */
  categories: IMenuCategory[];
  /** 크롤링 일시 */
  crawledAt: Timestamp;
}

/**
 * 메뉴 카테고리
 */
export interface IMenuCategory {
  name: string;
  products: IProduct[];
}

/**
 * 가격 변동 기록
 */
export interface IPriceHistory {
  productId: string;
  price: number;
  recordedAt: Timestamp;
}

/**
 * 가격대 레벨 결정
 */
export function determinePriceLevel(avgPrice: number): PriceLevel {
  if (avgPrice < 8000) return 'budget';
  if (avgPrice < 15000) return 'moderate';
  if (avgPrice < 30000) return 'premium';
  return 'luxury';
}

/**
 * 가격 범위 계산
 */
export function calculatePriceRange(products: IProduct[]): IPriceRange {
  if (products.length === 0) {
    return { min: 0, max: 0, currency: 'KRW' };
  }

  const prices = products.map((p) => p.price).filter((p) => p > 0);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;

  return {
    min,
    max,
    currency: 'KRW',
    level: determinePriceLevel(avg),
  };
}

/**
 * @forge/types - FOLIO Category Types
 * L0 (Atoms) - 업종 카테고리 타입 정의
 */

/**
 * 대분류 업종
 */
export type BusinessCategory =
  | 'food'        // 음식점
  | 'cafe'        // 카페
  | 'retail'      // 소매
  | 'service'     // 서비스
  | 'beauty'      // 미용
  | 'health'      // 건강/의료
  | 'education'   // 교육
  | 'other';      // 기타

/**
 * 음식점 세부 카테고리
 */
export type FoodSubCategory =
  | 'korean'      // 한식
  | 'chinese'     // 중식
  | 'japanese'    // 일식
  | 'western'     // 양식
  | 'chicken'     // 치킨
  | 'pizza'       // 피자
  | 'burger'      // 버거
  | 'asian'       // 아시안
  | 'dessert'     // 디저트
  | 'other';

/**
 * 카페 세부 카테고리
 */
export type CafeSubCategory =
  | 'coffee'      // 커피 전문점
  | 'dessert'     // 디저트 카페
  | 'brunch'      // 브런치 카페
  | 'bakery'      // 베이커리
  | 'tea'         // 차 전문점
  | 'other';

/**
 * 업종 정보 인터페이스
 */
export interface IBusinessType {
  category: BusinessCategory;
  subCategory?: string;
  displayName: string;
  icon?: string;
}

/**
 * 업종별 표시명 매핑
 */
export const CATEGORY_DISPLAY_NAMES: Record<BusinessCategory, string> = {
  food: '음식점',
  cafe: '카페',
  retail: '소매점',
  service: '서비스',
  beauty: '미용실',
  health: '건강/의료',
  education: '교육',
  other: '기타',
} as const;

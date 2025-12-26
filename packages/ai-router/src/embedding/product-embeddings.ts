/**
 * 제품 임베딩 데이터
 *
 * BIDFLOW 제품 목록 (초음파 유량계 전문)
 */

import type { ProductEmbedding } from '../types.js';

/**
 * 제품 정의 (임베딩 제외)
 */
export const PRODUCT_DEFINITIONS: Omit<ProductEmbedding, 'embedding'>[] = [
  {
    id: 'ur-1000',
    name: 'UR-1000',
    description: '초음파 유량계 (상수도용, 기본형)',
    keywords: ['초음파', '유량계', '상수도', '수도미터', '계량기', '물', 'DN50-300'],
  },
  {
    id: 'ur-1000-plus',
    name: 'UR-1000PLUS',
    description: '초음파 유량계 (상수도용, 고급형)',
    keywords: ['초음파', '유량계', '상수도', '수도미터', '계량기', '고정밀', 'DN50-600'],
  },
  {
    id: 'ur-2000',
    name: 'UR-2000',
    description: '초음파 유량계 (하수/오수용)',
    keywords: ['초음파', '유량계', '하수', '오수', '폐수', '수처리', 'DN100-1000'],
  },
  {
    id: 'ur-3000',
    name: 'UR-3000',
    description: '초음파 유량계 (공업용수용)',
    keywords: ['초음파', '유량계', '공업용수', '산업용', '냉각수', 'DN80-500'],
  },
  {
    id: 'ur-4000',
    name: 'UR-4000',
    description: '휴대용 초음파 유량계',
    keywords: ['휴대용', '클램프온', '비접촉', '초음파', '유량계', '포터블'],
  },
  {
    id: 'em-100',
    name: 'EM-100',
    description: '전자식 유량계 (상수도용)',
    keywords: ['전자식', '유량계', '상수도', '마그네틱', '전자기'],
  },
  {
    id: 'level-1000',
    name: 'LEVEL-1000',
    description: '초음파 수위계',
    keywords: ['초음파', '수위계', '레벨', '수위측정', '저수조'],
  },
  {
    id: 'pipe-sensor',
    name: 'PIPE-SENSOR',
    description: '배관 모니터링 센서',
    keywords: ['배관', '모니터링', '센서', '누수', '압력', '파이프'],
  },
];

/**
 * 파이프 규격 패턴 (DN 또는 mm)
 */
export const PIPE_SIZE_PATTERNS = [
  /DN\s*(\d+)/gi,
  /(\d+)\s*mm/gi,
  /(\d+)\s*파이/gi,
  /(\d+)\s*인치/gi,
];

/**
 * 발주기관 패턴 (가점 적용)
 */
export const PREFERRED_ORGANIZATIONS = [
  '상수도사업본부',
  '수도사업소',
  '환경공단',
  '한국수자원공사',
  'K-water',
  '수자원공사',
  '농어촌공사',
  '도시개발공사',
];

/**
 * 강력 키워드 (높은 가중치)
 */
export const STRONG_KEYWORDS = [
  '초음파',
  '유량계',
  '수도미터',
  '계량기',
  '상수도',
  '하수도',
];

/**
 * 약 키워드 (낮은 가중치)
 */
export const WEAK_KEYWORDS = [
  '물',
  '수도',
  '배관',
  '펌프',
];

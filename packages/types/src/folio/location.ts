/**
 * @forge/types - FOLIO Location Types
 * L0 (Atoms) - 위치 정보 타입 정의
 */

/**
 * 좌표 인터페이스
 */
export interface ICoordinates {
  /** 위도 */
  lat: number;
  /** 경도 */
  lng: number;
}

/**
 * 주소 인터페이스
 */
export interface IAddress {
  /** 전체 주소 */
  full: string;
  /** 도로명 주소 */
  road?: string;
  /** 지번 주소 */
  jibun?: string;
  /** 시/도 */
  sido: string;
  /** 시/군/구 */
  sigungu: string;
  /** 동/읍/면 */
  dong?: string;
  /** 우편번호 */
  zipCode?: string;
}

/**
 * 위치 정보 인터페이스
 */
export interface ILocation {
  /** 좌표 */
  coordinates: ICoordinates;
  /** 주소 */
  address: IAddress;
  /** 상권 ID (선택) */
  commercialAreaId?: string;
  /** 상권명 */
  commercialAreaName?: string;
}

/**
 * 반경 검색 인터페이스
 */
export interface IRadiusSearch {
  /** 중심 좌표 */
  center: ICoordinates;
  /** 반경 (미터) */
  radiusMeters: number;
}

/**
 * 바운딩 박스 인터페이스
 */
export interface IBoundingBox {
  /** 남서 좌표 */
  sw: ICoordinates;
  /** 북동 좌표 */
  ne: ICoordinates;
}

/**
 * 기본 검색 반경 (미터)
 */
export const DEFAULT_SEARCH_RADIUS = 1000;

/**
 * 최대 검색 반경 (미터)
 */
export const MAX_SEARCH_RADIUS = 5000;

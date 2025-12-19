/**
 * @forge/utils - Geo Utilities
 * L1 (Molecules) - 지리/거리 계산 유틸리티
 */

import type { FolioTypes } from '@forge/types';

type ICoordinates = FolioTypes.ICoordinates;
type IBoundingBox = FolioTypes.IBoundingBox;

/**
 * 지구 반경 (km)
 */
const EARTH_RADIUS_KM = 6371;

/**
 * 두 좌표 간 거리 계산 (Haversine 공식)
 *
 * @param coord1 - 첫 번째 좌표
 * @param coord2 - 두 번째 좌표
 * @returns 거리 (미터)
 *
 * @example
 * const distance = calculateDistance(
 *   { lat: 37.5665, lng: 126.9780 },  // 서울시청
 *   { lat: 37.5512, lng: 126.9882 }   // 남산타워
 * );
 * // 약 1,890m
 */
export function calculateDistance(
  coord1: ICoordinates,
  coord2: ICoordinates
): number {
  const lat1Rad = toRadians(coord1.lat);
  const lat2Rad = toRadians(coord2.lat);
  const deltaLat = toRadians(coord2.lat - coord1.lat);
  const deltaLng = toRadians(coord2.lng - coord1.lng);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(deltaLng / 2) *
      Math.sin(deltaLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = EARTH_RADIUS_KM * c;

  return Math.round(distanceKm * 1000); // 미터로 변환
}

/**
 * 각도를 라디안으로 변환
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * 중심점과 반경으로 바운딩 박스 생성
 *
 * @param center - 중심 좌표
 * @param radiusMeters - 반경 (미터)
 * @returns 바운딩 박스
 */
export function createBoundingBox(
  center: ICoordinates,
  radiusMeters: number
): IBoundingBox {
  const radiusKm = radiusMeters / 1000;

  // 위도 1도 = 약 111km
  const latDelta = radiusKm / 111;

  // 경도 1도는 위도에 따라 다름
  const lngDelta = radiusKm / (111 * Math.cos(toRadians(center.lat)));

  return {
    sw: {
      lat: center.lat - latDelta,
      lng: center.lng - lngDelta,
    },
    ne: {
      lat: center.lat + latDelta,
      lng: center.lng + lngDelta,
    },
  };
}

/**
 * 좌표가 바운딩 박스 내에 있는지 확인
 */
export function isWithinBoundingBox(
  coord: ICoordinates,
  box: IBoundingBox
): boolean {
  return (
    coord.lat >= box.sw.lat &&
    coord.lat <= box.ne.lat &&
    coord.lng >= box.sw.lng &&
    coord.lng <= box.ne.lng
  );
}

/**
 * 좌표가 중심점 반경 내에 있는지 확인
 */
export function isWithinRadius(
  coord: ICoordinates,
  center: ICoordinates,
  radiusMeters: number
): boolean {
  return calculateDistance(coord, center) <= radiusMeters;
}

/**
 * 좌표 배열의 중심점 계산
 */
export function calculateCentroid(coords: ICoordinates[]): ICoordinates {
  if (coords.length === 0) {
    throw new Error('Cannot calculate centroid of empty array');
  }

  const sum = coords.reduce(
    (acc, coord) => ({
      lat: acc.lat + coord.lat,
      lng: acc.lng + coord.lng,
    }),
    { lat: 0, lng: 0 }
  );

  return {
    lat: sum.lat / coords.length,
    lng: sum.lng / coords.length,
  };
}

/**
 * 거리 기준 좌표 정렬
 */
export function sortByDistance<T extends { coordinates: ICoordinates }>(
  items: T[],
  center: ICoordinates
): Array<T & { distance: number }> {
  return items
    .map((item) => ({
      ...item,
      distance: calculateDistance(item.coordinates, center),
    }))
    .sort((a, b) => a.distance - b.distance);
}

/**
 * 거리 포맷팅
 *
 * @param meters - 미터
 * @returns 포맷팅된 문자열
 *
 * @example
 * formatDistance(500);   // "500m"
 * formatDistance(1500);  // "1.5km"
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

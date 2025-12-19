/**
 * HEPHAITOS - Utility Functions
 * L1 (Molecules) - 공통 유틸리티
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Tailwind CSS 클래스 병합 유틸리티
 * clsx + tailwind-merge 조합으로 충돌 해결
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 숫자 포맷팅 (통화)
 */
export function formatCurrency(
  value: number,
  currency: 'USD' | 'KRW' = 'USD',
  options?: Intl.NumberFormatOptions
): string {
  const locale = currency === 'KRW' ? 'ko-KR' : 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'KRW' ? 0 : 2,
    ...options,
  }).format(value);
}

/**
 * 숫자 포맷팅 (퍼센트)
 */
export function formatPercent(
  value: number,
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  }).format(value / 100);
}

/**
 * 숫자 포맷팅 (일반)
 */
export function formatNumber(
  value: number,
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat('ko-KR', options).format(value);
}

/**
 * 날짜 포맷팅
 */
export function formatDate(
  date: Date | string,
  format: 'full' | 'short' | 'time' = 'short'
): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  const options: Record<string, Intl.DateTimeFormatOptions> = {
    full: {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    },
    short: {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    },
    time: {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    },
  };

  return d.toLocaleString('ko-KR', options[format]);
}

/**
 * 상대 시간 포맷팅
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;

  return formatDate(d, 'short');
}

/**
 * 딜레이 함수
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * UUID 생성
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 객체 깊은 복사
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * 배열 청크 분할
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

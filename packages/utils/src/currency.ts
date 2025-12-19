/**
 * @forge/utils - Currency Utilities
 * L1 (Molecules) - 통화 변환 유틸리티
 */

import type { CurrencyCode } from '@forge/types';

/**
 * 환율 데이터 타입
 */
export interface IExchangeRates {
  base: CurrencyCode;
  timestamp: string;
  rates: Record<CurrencyCode, number>;
}

/**
 * 기본 환율 (USD 기준, 폴백용)
 */
const DEFAULT_RATES: Record<CurrencyCode, number> = {
  USD: 1,
  KRW: 1320,
  EUR: 0.92,
  JPY: 149,
  CNY: 7.24,
  BTC: 0.000024,
  ETH: 0.00043,
  USDT: 1,
};

/**
 * 환율 캐시
 */
let ratesCache: IExchangeRates | null = null;

/**
 * 통화 변환
 *
 * @param amount - 변환할 금액
 * @param from - 원본 통화
 * @param to - 대상 통화
 * @param rates - 환율 데이터 (선택, 없으면 캐시 또는 기본값 사용)
 * @returns 변환된 금액
 *
 * @example
 * const krw = convertCurrency(100, 'USD', 'KRW');
 * // 132000 (100 USD = 132,000 KRW)
 */
export function convertCurrency(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode,
  rates?: IExchangeRates
): number {
  if (from === to) return amount;

  const exchangeRates = rates?.rates ?? ratesCache?.rates ?? DEFAULT_RATES;

  // USD 기준으로 변환
  const usdAmount = from === 'USD' ? amount : amount / exchangeRates[from];
  const result = to === 'USD' ? usdAmount : usdAmount * exchangeRates[to];

  return result;
}

/**
 * 환율 캐시 업데이트
 */
export function updateRatesCache(rates: IExchangeRates): void {
  ratesCache = rates;
}

/**
 * 현재 캐시된 환율 조회
 */
export function getCachedRates(): IExchangeRates | null {
  return ratesCache;
}

/**
 * 통화 포맷팅
 *
 * @param amount - 금액
 * @param currency - 통화 코드
 * @param locale - 로케일 (기본: ko-KR)
 * @returns 포맷팅된 문자열
 *
 * @example
 * formatCurrency(1234567.89, 'USD'); // "$1,234,567.89"
 * formatCurrency(1234567.89, 'KRW'); // "₩1,234,568"
 */
export function formatCurrency(
  amount: number,
  currency: CurrencyCode,
  locale: string = 'ko-KR'
): string {
  // 암호화폐는 별도 처리
  if (['BTC', 'ETH', 'USDT'].includes(currency)) {
    const symbol = currency === 'USDT' ? '$' : currency;
    const decimals = currency === 'USDT' ? 2 : 8;
    return `${amount.toFixed(decimals)} ${symbol}`;
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: currency === 'KRW' ? 0 : 2,
      maximumFractionDigits: currency === 'KRW' ? 0 : 2,
    }).format(amount);
  } catch {
    // 지원되지 않는 통화의 경우
    return `${currency} ${amount.toFixed(2)}`;
  }
}

/**
 * 숫자 축약 표기
 *
 * @param value - 숫자
 * @param decimals - 소수점 자릿수 (기본: 2)
 * @returns 축약된 문자열
 *
 * @example
 * abbreviateNumber(1234567); // "1.23M"
 * abbreviateNumber(1234);    // "1.23K"
 */
export function abbreviateNumber(value: number, decimals: number = 2): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (abs >= 1e12) {
    return `${sign}${(abs / 1e12).toFixed(decimals)}T`;
  }
  if (abs >= 1e9) {
    return `${sign}${(abs / 1e9).toFixed(decimals)}B`;
  }
  if (abs >= 1e6) {
    return `${sign}${(abs / 1e6).toFixed(decimals)}M`;
  }
  if (abs >= 1e3) {
    return `${sign}${(abs / 1e3).toFixed(decimals)}K`;
  }

  return `${sign}${abs.toFixed(decimals)}`;
}

/**
 * 퍼센트 포맷팅
 *
 * @param value - 퍼센트 값 (예: 12.5 = 12.5%)
 * @param showSign - 양수에 + 기호 표시 여부
 * @returns 포맷팅된 문자열
 */
export function formatPercent(value: number, showSign: boolean = true): string {
  const sign = showSign && value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

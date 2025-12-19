/**
 * @forge/utils - Validation Tests
 * API 키 및 입력 검증 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  validateApiKey,
  isValidSymbol,
  isValidAmount,
  isValidUUID,
  isValidTimestamp,
  isValidEmail,
  validatePortfolioName,
  validateRequiredFields,
} from '../validation';

// ═══════════════════════════════════════════════════════════════
// validateApiKey 테스트
// ═══════════════════════════════════════════════════════════════

describe('validateApiKey', () => {
  describe('Binance', () => {
    it('유효한 Binance API 키', () => {
      const validKey = 'A'.repeat(64);
      const validSecret = 'B'.repeat(64);

      const result = validateApiKey('binance', validKey, validSecret);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('잘못된 길이의 API 키', () => {
      const shortKey = 'A'.repeat(32);
      const validSecret = 'B'.repeat(64);

      const result = validateApiKey('binance', shortKey, validSecret);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('잘못된 문자가 포함된 API 키', () => {
      const invalidKey = 'A'.repeat(63) + '!';
      const validSecret = 'B'.repeat(64);

      const result = validateApiKey('binance', invalidKey, validSecret);
      expect(result.valid).toBe(false);
    });

    it('빈 API 키', () => {
      const result = validateApiKey('binance', '', '');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('API key is required');
      expect(result.errors).toContain('API secret is required');
    });
  });

  describe('Upbit', () => {
    it('유효한 Upbit API 키 (UUID 형식)', () => {
      const validKey = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const validSecret = 'x9y8z7w6-v5u4-3210-lkji-hgfedcba9876';

      const result = validateApiKey('upbit', validKey, validSecret);
      expect(result.valid).toBe(true);
    });

    it('잘못된 UUID 형식', () => {
      const invalidKey = 'not-a-valid-uuid';
      const validSecret = 'x9y8z7w6-v5u4-3210-lkji-hgfedcba9876';

      const result = validateApiKey('upbit', invalidKey, validSecret);
      expect(result.valid).toBe(false);
    });
  });

  describe('에러 처리', () => {
    it('지원하지 않는 거래소', () => {
      const result = validateApiKey('unknown' as never, 'key', 'secret');
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Unsupported'))).toBe(true);
    });
  });
});

// ═══════════════════════════════════════════════════════════════
// isValidSymbol 테스트
// ═══════════════════════════════════════════════════════════════

describe('isValidSymbol', () => {
  it('유효한 심볼', () => {
    expect(isValidSymbol('BTC')).toBe(true);
    expect(isValidSymbol('ETH')).toBe(true);
    expect(isValidSymbol('USDT')).toBe(true);
    expect(isValidSymbol('BNB')).toBe(true);
  });

  it('소문자도 유효', () => {
    expect(isValidSymbol('btc')).toBe(true);
    expect(isValidSymbol('eth')).toBe(true);
  });

  it('숫자 포함 유효', () => {
    expect(isValidSymbol('USD1')).toBe(true);
    expect(isValidSymbol('1INCH')).toBe(true);
  });

  it('잘못된 심볼', () => {
    expect(isValidSymbol('')).toBe(false);
    expect(isValidSymbol('BTC/USDT')).toBe(false); // 슬래시 포함
    expect(isValidSymbol('BTC-USD')).toBe(false); // 하이픈 포함
    expect(isValidSymbol('VERYLONGSYMBOL123')).toBe(false); // 너무 김
  });
});

// ═══════════════════════════════════════════════════════════════
// isValidAmount 테스트
// ═══════════════════════════════════════════════════════════════

describe('isValidAmount', () => {
  it('양수 금액', () => {
    expect(isValidAmount(100)).toBe(true);
    expect(isValidAmount(0.001)).toBe(true);
    expect(isValidAmount(1000000)).toBe(true);
  });

  it('잘못된 금액', () => {
    expect(isValidAmount(0)).toBe(false);
    expect(isValidAmount(-100)).toBe(false);
    expect(isValidAmount(NaN)).toBe(false);
    expect(isValidAmount(Infinity)).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════
// isValidUUID 테스트
// ═══════════════════════════════════════════════════════════════

describe('isValidUUID', () => {
  it('유효한 UUID', () => {
    expect(isValidUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
    expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
  });

  it('잘못된 UUID', () => {
    expect(isValidUUID('not-a-uuid')).toBe(false);
    expect(isValidUUID('123')).toBe(false);
    expect(isValidUUID('')).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════
// isValidTimestamp 테스트
// ═══════════════════════════════════════════════════════════════

describe('isValidTimestamp', () => {
  it('유효한 타임스탬프', () => {
    expect(isValidTimestamp('2024-01-01T00:00:00Z')).toBe(true);
    expect(isValidTimestamp('2024-12-31')).toBe(true);
    expect(isValidTimestamp(new Date().toISOString())).toBe(true);
  });

  it('잘못된 타임스탬프', () => {
    expect(isValidTimestamp('not-a-date')).toBe(false);
    expect(isValidTimestamp('')).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════
// isValidEmail 테스트
// ═══════════════════════════════════════════════════════════════

describe('isValidEmail', () => {
  it('유효한 이메일', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('user.name@domain.co.kr')).toBe(true);
  });

  it('잘못된 이메일', () => {
    expect(isValidEmail('not-an-email')).toBe(false);
    expect(isValidEmail('missing@domain')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════
// validatePortfolioName 테스트
// ═══════════════════════════════════════════════════════════════

describe('validatePortfolioName', () => {
  it('유효한 포트폴리오 이름', () => {
    const result = validatePortfolioName('My Portfolio');
    expect(result.valid).toBe(true);
  });

  it('한글 이름', () => {
    const result = validatePortfolioName('내 포트폴리오');
    expect(result.valid).toBe(true);
  });

  it('너무 짧은 이름', () => {
    const result = validatePortfolioName('A');
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('2 characters'))).toBe(true);
  });

  it('너무 긴 이름', () => {
    const result = validatePortfolioName('A'.repeat(51));
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('50 characters'))).toBe(true);
  });

  it('빈 이름', () => {
    const result = validatePortfolioName('');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Portfolio name is required');
  });
});

// ═══════════════════════════════════════════════════════════════
// validateRequiredFields 테스트
// ═══════════════════════════════════════════════════════════════

describe('validateRequiredFields', () => {
  it('모든 필드 존재', () => {
    const obj = { name: 'test', email: 'test@test.com', age: 25 };
    const result = validateRequiredFields(obj, ['name', 'email']);
    expect(result.valid).toBe(true);
  });

  it('필드 누락', () => {
    const obj = { name: 'test' };
    const result = validateRequiredFields(obj, ['name', 'email']);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('email is required');
  });

  it('빈 값', () => {
    const obj = { name: '', email: null };
    const result = validateRequiredFields(obj, ['name', 'email']);
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(2);
  });
});

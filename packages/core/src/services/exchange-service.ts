/**
 * @forge/core - Exchange Service
 * L2 (Cells) - 거래소 API 통합 서비스
 */

import type { HephaitosTypes, IResult, Timestamp } from '@forge/types';
import { normalizeBalance, validateApiKey } from '@forge/utils';

type ExchangeType = HephaitosTypes.ExchangeType;
type IAsset = HephaitosTypes.IAsset;
type IExchangeCredentials = HephaitosTypes.IExchangeCredentials;
type IExchangeConfig = HephaitosTypes.IExchangeConfig;

/**
 * 거래 내역 인터페이스
 */
export interface ITransaction {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  amount: number;
  price: number;
  fee: number;
  fee_currency: string;
  timestamp: Timestamp;
}

/**
 * 거래소 서비스 인터페이스
 */
export interface IExchangeService {
  /** 거래소 타입 */
  readonly exchange: ExchangeType;

  /** 잔고 조회 */
  getBalance(credentials: IExchangeCredentials): Promise<IResult<IAsset[]>>;

  /** 거래 내역 조회 */
  getTransactions(
    credentials: IExchangeCredentials,
    startTime?: Date,
    endTime?: Date
  ): Promise<IResult<ITransaction[]>>;

  /** API 키 검증 */
  validateCredentials(credentials: IExchangeCredentials): Promise<IResult<boolean>>;
}

/**
 * 거래소 서비스 기본 클래스
 */
abstract class BaseExchangeService implements IExchangeService {
  abstract readonly exchange: ExchangeType;
  protected config: IExchangeConfig;

  constructor(config: IExchangeConfig) {
    this.config = config;
  }

  abstract getBalance(credentials: IExchangeCredentials): Promise<IResult<IAsset[]>>;
  abstract getTransactions(
    credentials: IExchangeCredentials,
    startTime?: Date,
    endTime?: Date
  ): Promise<IResult<ITransaction[]>>;
  abstract validateCredentials(credentials: IExchangeCredentials): Promise<IResult<boolean>>;

  /**
   * API 요청 헬퍼
   */
  protected async fetch<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<IResult<T>> {
    const startTime = Date.now();

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        return {
          success: false,
          error: new Error(`HTTP ${response.status}: ${response.statusText}`),
          metadata: {
            timestamp: new Date().toISOString(),
            duration_ms: Date.now() - startTime,
          },
        };
      }

      const data = await response.json() as T;

      return {
        success: true,
        data,
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    }
  }
}

/**
 * Binance 거래소 서비스
 */
export class BinanceService extends BaseExchangeService {
  readonly exchange: ExchangeType = 'binance';

  constructor() {
    super({
      type: 'binance',
      name: 'Binance',
      baseUrl: 'https://api.binance.com',
      rateLimit: 1200,
      features: ['spot', 'futures', 'margin', 'staking'],
    });
  }

  async getBalance(credentials: IExchangeCredentials): Promise<IResult<IAsset[]>> {
    const startTime = Date.now();

    // API 키 형식 검증
    const validation = validateApiKey('binance', credentials.api_key, credentials.api_secret);
    if (!validation.valid) {
      return {
        success: false,
        error: new Error(validation.errors.join(', ')),
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    }

    try {
      // 서명 생성
      const timestamp = Date.now();
      const queryString = `timestamp=${timestamp}`;
      const signature = await this.sign(queryString, credentials.api_secret);

      const response = await this.fetch<{ balances: Array<{ asset: string; free: string; locked: string }> }>(
        `${this.config.baseUrl}/api/v3/account?${queryString}&signature=${signature}`,
        {
          headers: {
            'X-MBX-APIKEY': credentials.api_key,
          },
        }
      );

      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error,
          metadata: response.metadata,
        };
      }

      // 가격 조회 (간략화 - 실제로는 별도 API 호출)
      const prices = new Map<string, number>();
      // TODO: 실제 가격 조회 구현

      const assets = normalizeBalance('binance', response.data.balances, prices);

      return {
        success: true,
        data: assets,
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    }
  }

  async getTransactions(
    credentials: IExchangeCredentials,
    startTime?: Date,
    endTime?: Date
  ): Promise<IResult<ITransaction[]>> {
    // TODO: 구현
    return {
      success: true,
      data: [],
      metadata: {
        timestamp: new Date().toISOString(),
        duration_ms: 0,
      },
    };
  }

  async validateCredentials(credentials: IExchangeCredentials): Promise<IResult<boolean>> {
    const result = await this.getBalance(credentials);
    return {
      success: result.success,
      data: result.success,
      error: result.error,
      metadata: result.metadata,
    };
  }

  /**
   * HMAC-SHA256 서명 생성
   */
  private async sign(data: string, secret: string): Promise<string> {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
    return Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
}

/**
 * Upbit 거래소 서비스
 */
export class UpbitService extends BaseExchangeService {
  readonly exchange: ExchangeType = 'upbit';

  constructor() {
    super({
      type: 'upbit',
      name: 'Upbit',
      baseUrl: 'https://api.upbit.com',
      rateLimit: 600,
      features: ['spot'],
    });
  }

  async getBalance(credentials: IExchangeCredentials): Promise<IResult<IAsset[]>> {
    const startTime = Date.now();

    // API 키 형식 검증
    const validation = validateApiKey('upbit', credentials.api_key, credentials.api_secret);
    if (!validation.valid) {
      return {
        success: false,
        error: new Error(validation.errors.join(', ')),
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    }

    try {
      // JWT 토큰 생성 (간략화)
      const token = this.generateJWT(credentials.api_key, credentials.api_secret);

      const response = await this.fetch<Array<{
        currency: string;
        balance: string;
        locked: string;
        avg_buy_price: string;
      }>>(
        `${this.config.baseUrl}/v1/accounts`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error,
          metadata: response.metadata,
        };
      }

      const prices = new Map<string, number>();
      const assets = normalizeBalance('upbit', response.data, prices);

      return {
        success: true,
        data: assets,
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    }
  }

  async getTransactions(
    credentials: IExchangeCredentials,
    startTime?: Date,
    endTime?: Date
  ): Promise<IResult<ITransaction[]>> {
    return {
      success: true,
      data: [],
      metadata: {
        timestamp: new Date().toISOString(),
        duration_ms: 0,
      },
    };
  }

  async validateCredentials(credentials: IExchangeCredentials): Promise<IResult<boolean>> {
    const result = await this.getBalance(credentials);
    return {
      success: result.success,
      data: result.success,
      error: result.error,
      metadata: result.metadata,
    };
  }

  private generateJWT(accessKey: string, secretKey: string): string {
    // 간략화된 JWT 생성 (실제로는 jsonwebtoken 라이브러리 사용)
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      access_key: accessKey,
      nonce: crypto.randomUUID(),
    }));
    // 실제 서명은 secretKey로 생성해야 함
    return `${header}.${payload}.signature`;
  }
}

/**
 * 거래소 서비스 팩토리
 */
export class ExchangeServiceFactory {
  private static services: Map<ExchangeType, IExchangeService> = new Map();

  /**
   * 거래소 서비스 인스턴스 획득
   */
  static getService(exchange: ExchangeType): IExchangeService {
    if (!this.services.has(exchange)) {
      const service = this.createService(exchange);
      this.services.set(exchange, service);
    }
    return this.services.get(exchange)!;
  }

  /**
   * 거래소 서비스 생성
   */
  private static createService(exchange: ExchangeType): IExchangeService {
    switch (exchange) {
      case 'binance':
        return new BinanceService();
      case 'upbit':
        return new UpbitService();
      default:
        throw new Error(`Unsupported exchange: ${exchange}`);
    }
  }

  /**
   * 지원 거래소 목록
   */
  static getSupportedExchanges(): ExchangeType[] {
    return ['binance', 'upbit'];
  }
}

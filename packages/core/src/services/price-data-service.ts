/**
 * @forge/core - Price Data Service
 * L2 (Cells) - 과거 가격 데이터 서비스
 */

import type { HephaitosTypes, IResult, Timestamp } from '@forge/types';

type IOHLCV = HephaitosTypes.IOHLCV;
type IPriceData = HephaitosTypes.IPriceData;
type Timeframe = HephaitosTypes.Timeframe;

/**
 * 가격 데이터 서비스 인터페이스
 */
export interface IPriceDataService {
  /** 과거 가격 데이터 조회 */
  getHistoricalPrices(
    symbol: string,
    timeframe: Timeframe,
    startDate: string,
    endDate: string
  ): Promise<IResult<IPriceData>>;

  /** OHLCV 캔들 조회 */
  getOHLCV(
    symbol: string,
    timeframe: Timeframe,
    limit?: number
  ): Promise<IResult<IOHLCV[]>>;

  /** 타임프레임 리샘플링 */
  resampleTimeframe(
    candles: IOHLCV[],
    sourceTimeframe: Timeframe,
    targetTimeframe: Timeframe
  ): IOHLCV[];
}

/**
 * 타임프레임을 밀리초로 변환
 */
function timeframeToMs(tf: Timeframe): number {
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  switch (tf) {
    case '1m': return minute;
    case '5m': return 5 * minute;
    case '15m': return 15 * minute;
    case '30m': return 30 * minute;
    case '1h': return hour;
    case '4h': return 4 * hour;
    case '1d': return day;
    case '1w': return 7 * day;
    case '1M': return 30 * day;
    default: return day;
  }
}

/**
 * 인메모리 가격 데이터 서비스 (테스트용)
 *
 * 실제로는 거래소 API 또는 데이터 벤더 연동
 */
export class InMemoryPriceDataService implements IPriceDataService {
  private priceData: Map<string, IOHLCV[]> = new Map();

  /**
   * 테스트 데이터 추가
   */
  addPriceData(symbol: string, candles: IOHLCV[]): void {
    this.priceData.set(symbol, candles);
  }

  /**
   * 시뮬레이션 가격 데이터 생성
   */
  generateSimulatedData(
    symbol: string,
    timeframe: Timeframe,
    startDate: string,
    endDate: string,
    basePrice: number = 100
  ): void {
    const candles: IOHLCV[] = [];
    const intervalMs = timeframeToMs(timeframe);
    let currentTime = new Date(startDate).getTime();
    const endTime = new Date(endDate).getTime();

    let price = basePrice;

    while (currentTime <= endTime) {
      // 랜덤 워크 가격 생성
      const change = (Math.random() - 0.48) * 2; // 약간의 상승 바이어스
      price = price * (1 + change / 100);

      const volatility = 1 + Math.random();
      const open = price;
      const high = price * (1 + Math.random() * volatility / 100);
      const low = price * (1 - Math.random() * volatility / 100);
      const close = low + Math.random() * (high - low);
      const volume = 1000000 + Math.random() * 5000000;

      candles.push({
        timestamp: new Date(currentTime).toISOString(),
        open: parseFloat(open.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        close: parseFloat(close.toFixed(2)),
        volume: parseFloat(volume.toFixed(0)),
      });

      price = close;
      currentTime += intervalMs;
    }

    this.priceData.set(`${symbol}-${timeframe}`, candles);
  }

  async getHistoricalPrices(
    symbol: string,
    timeframe: Timeframe,
    startDate: string,
    endDate: string
  ): Promise<IResult<IPriceData>> {
    const startTime = Date.now();
    const key = `${symbol}-${timeframe}`;

    // 데이터가 없으면 시뮬레이션 데이터 생성
    if (!this.priceData.has(key)) {
      this.generateSimulatedData(symbol, timeframe, startDate, endDate);
    }

    const allCandles = this.priceData.get(key) ?? [];

    // 날짜 필터링
    const startMs = new Date(startDate).getTime();
    const endMs = new Date(endDate).getTime();

    const filteredCandles = allCandles.filter(c => {
      const ts = new Date(c.timestamp).getTime();
      return ts >= startMs && ts <= endMs;
    });

    return {
      success: true,
      data: {
        symbol,
        timeframe,
        candles: filteredCandles,
        startTime: startDate,
        endTime: endDate,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      },
    };
  }

  async getOHLCV(
    symbol: string,
    timeframe: Timeframe,
    limit: number = 500
  ): Promise<IResult<IOHLCV[]>> {
    const startTime = Date.now();
    const key = `${symbol}-${timeframe}`;

    let candles = this.priceData.get(key);

    if (!candles) {
      // 최근 limit개 캔들에 해당하는 기간 계산
      const endDate = new Date();
      const intervalMs = timeframeToMs(timeframe);
      const startDate = new Date(endDate.getTime() - limit * intervalMs);

      this.generateSimulatedData(
        symbol,
        timeframe,
        startDate.toISOString(),
        endDate.toISOString()
      );
      candles = this.priceData.get(key) ?? [];
    }

    const result = candles.slice(-limit);

    return {
      success: true,
      data: result,
      metadata: {
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      },
    };
  }

  resampleTimeframe(
    candles: IOHLCV[],
    sourceTimeframe: Timeframe,
    targetTimeframe: Timeframe
  ): IOHLCV[] {
    const sourceMs = timeframeToMs(sourceTimeframe);
    const targetMs = timeframeToMs(targetTimeframe);

    if (targetMs <= sourceMs) {
      // 더 작은 타임프레임으로는 리샘플링 불가
      return candles;
    }

    const ratio = targetMs / sourceMs;
    const result: IOHLCV[] = [];

    for (let i = 0; i < candles.length; i += ratio) {
      const chunk = candles.slice(i, Math.min(i + ratio, candles.length));
      if (chunk.length === 0) break;

      const aggregated: IOHLCV = {
        timestamp: chunk[0].timestamp,
        open: chunk[0].open,
        high: Math.max(...chunk.map(c => c.high)),
        low: Math.min(...chunk.map(c => c.low)),
        close: chunk[chunk.length - 1].close,
        volume: chunk.reduce((sum, c) => sum + c.volume, 0),
      };

      result.push(aggregated);
    }

    return result;
  }
}

/**
 * 실제 거래소 API 기반 가격 데이터 서비스
 * Binance와 Upbit의 공개 API를 사용하여 실제 가격 데이터 제공
 */
export class RealPriceDataService implements IPriceDataService {
  private cache: Map<string, { data: IOHLCV[], timestamp: number }> = new Map();
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5분 캐시
  private readonly BINANCE_BASE_URL = 'https://api.binance.com';
  private readonly UPBIT_BASE_URL = 'https://api.upbit.com';

  /**
   * 타임프레임을 거래소별 형식으로 변환
   */
  private convertTimeframe(timeframe: Timeframe, exchange: 'binance' | 'upbit'): string {
    if (exchange === 'binance') {
      // Binance: 1m, 5m, 15m, 30m, 1h, 4h, 1d, 1w, 1M
      return timeframe;
    } else {
      // Upbit: minutes/1, minutes/5, minutes/15, minutes/30, hours/1, hours/4, days, weeks, months
      const map: Record<Timeframe, string> = {
        '1m': 'minutes/1',
        '5m': 'minutes/5',
        '15m': 'minutes/15',
        '30m': 'minutes/30',
        '1h': 'hours/1',
        '4h': 'hours/4',
        '1d': 'days',
        '1w': 'weeks',
        '1M': 'months',
      };
      return map[timeframe] || 'days';
    }
  }

  /**
   * 심볼을 거래소별 형식으로 변환
   */
  private convertSymbol(symbol: string, exchange: 'binance' | 'upbit'): string {
    if (exchange === 'binance') {
      // BTC/USDT → BTCUSDT
      return symbol.replace('/', '');
    } else {
      // BTC/USDT → KRW-BTC (Upbit은 주로 KRW 마켓)
      const [base] = symbol.split('/');
      return `KRW-${base}`;
    }
  }

  /**
   * Binance에서 OHLCV 데이터 가져오기
   */
  private async fetchBinanceOHLCV(
    symbol: string,
    timeframe: Timeframe,
    startTime?: number,
    endTime?: number,
    limit: number = 500
  ): Promise<IOHLCV[]> {
    const binanceSymbol = this.convertSymbol(symbol, 'binance');
    const binanceInterval = this.convertTimeframe(timeframe, 'binance');

    let url = `${this.BINANCE_BASE_URL}/api/v3/klines?symbol=${binanceSymbol}&interval=${binanceInterval}&limit=${limit}`;
    if (startTime) url += `&startTime=${startTime}`;
    if (endTime) url += `&endTime=${endTime}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as Array<[
      number, string, string, string, string, string, // timestamp, open, high, low, close, volume
      number, string, number, string, string, string
    ]>;

    return data.map(([timestamp, open, high, low, close, volume]) => ({
      timestamp: new Date(timestamp).toISOString(),
      open: parseFloat(open),
      high: parseFloat(high),
      low: parseFloat(low),
      close: parseFloat(close),
      volume: parseFloat(volume),
    }));
  }

  /**
   * Upbit에서 OHLCV 데이터 가져오기
   */
  private async fetchUpbitOHLCV(
    symbol: string,
    timeframe: Timeframe,
    count: number = 200
  ): Promise<IOHLCV[]> {
    const upbitSymbol = this.convertSymbol(symbol, 'upbit');
    const upbitInterval = this.convertTimeframe(timeframe, 'upbit');

    const url = `${this.UPBIT_BASE_URL}/v1/candles/${upbitInterval}?market=${upbitSymbol}&count=${count}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Upbit API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as Array<{
      market: string;
      candle_date_time_utc: string;
      opening_price: number;
      high_price: number;
      low_price: number;
      trade_price: number;
      candle_acc_trade_volume: number;
    }>;

    // Upbit은 최신순으로 반환하므로 역순으로 정렬
    return data.reverse().map(candle => ({
      timestamp: candle.candle_date_time_utc,
      open: candle.opening_price,
      high: candle.high_price,
      low: candle.low_price,
      close: candle.trade_price,
      volume: candle.candle_acc_trade_volume,
    }));
  }

  /**
   * 거래소 자동 감지 (심볼 기반)
   */
  private detectExchange(symbol: string): 'binance' | 'upbit' {
    // USDT 페어는 Binance, 그 외는 Upbit (KRW)
    return symbol.includes('USDT') || symbol.includes('USD') ? 'binance' : 'upbit';
  }

  async getHistoricalPrices(
    symbol: string,
    timeframe: Timeframe,
    startDate: string,
    endDate: string
  ): Promise<IResult<IPriceData>> {
    const startTime = Date.now();
    const cacheKey = `${symbol}-${timeframe}-${startDate}-${endDate}`;

    // 캐시 확인
    const cached = this.cache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL_MS) {
      return {
        success: true,
        data: {
          symbol,
          timeframe,
          candles: cached.data,
          startTime: startDate,
          endTime: endDate,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
          cached: true,
        },
      };
    }

    try {
      const exchange = this.detectExchange(symbol);
      let candles: IOHLCV[];

      const startMs = new Date(startDate).getTime();
      const endMs = new Date(endDate).getTime();

      if (exchange === 'binance') {
        candles = await this.fetchBinanceOHLCV(symbol, timeframe, startMs, endMs, 1000);
      } else {
        // Upbit은 최대 200개만 지원하므로 여러 번 호출 필요할 수 있음
        candles = await this.fetchUpbitOHLCV(symbol, timeframe, 200);
        // 날짜 필터링
        candles = candles.filter(c => {
          const ts = new Date(c.timestamp).getTime();
          return ts >= startMs && ts <= endMs;
        });
      }

      // 캐시 저장
      this.cache.set(cacheKey, { data: candles, timestamp: Date.now() });

      return {
        success: true,
        data: {
          symbol,
          timeframe,
          candles,
          startTime: startDate,
          endTime: endDate,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
          cached: false,
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

  async getOHLCV(
    symbol: string,
    timeframe: Timeframe,
    limit: number = 500
  ): Promise<IResult<IOHLCV[]>> {
    const startTime = Date.now();
    const cacheKey = `${symbol}-${timeframe}-latest-${limit}`;

    // 캐시 확인 (최신 데이터는 1분 캐시)
    const cached = this.cache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < 60 * 1000) {
      return {
        success: true,
        data: cached.data,
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
          cached: true,
        },
      };
    }

    try {
      const exchange = this.detectExchange(symbol);
      let candles: IOHLCV[];

      if (exchange === 'binance') {
        candles = await this.fetchBinanceOHLCV(symbol, timeframe, undefined, undefined, limit);
      } else {
        candles = await this.fetchUpbitOHLCV(symbol, timeframe, Math.min(limit, 200));
      }

      // 캐시 저장
      this.cache.set(cacheKey, { data: candles, timestamp: Date.now() });

      return {
        success: true,
        data: candles,
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
          cached: false,
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

  resampleTimeframe(
    candles: IOHLCV[],
    sourceTimeframe: Timeframe,
    targetTimeframe: Timeframe
  ): IOHLCV[] {
    const sourceMs = timeframeToMs(sourceTimeframe);
    const targetMs = timeframeToMs(targetTimeframe);

    if (targetMs <= sourceMs) {
      return candles;
    }

    const ratio = targetMs / sourceMs;
    const result: IOHLCV[] = [];

    for (let i = 0; i < candles.length; i += ratio) {
      const chunk = candles.slice(i, Math.min(i + ratio, candles.length));
      if (chunk.length === 0) break;

      const aggregated: IOHLCV = {
        timestamp: chunk[0].timestamp,
        open: chunk[0].open,
        high: Math.max(...chunk.map(c => c.high)),
        low: Math.min(...chunk.map(c => c.low)),
        close: chunk[chunk.length - 1].close,
        volume: chunk.reduce((sum, c) => sum + c.volume, 0),
      };

      result.push(aggregated);
    }

    return result;
  }

  /**
   * 캐시 초기화
   */
  clearCache(): void {
    this.cache.clear();
  }
}

/**
 * 가격 데이터 서비스 팩토리
 */
export function createPriceDataService(mode: 'real' | 'memory' = 'real'): IPriceDataService {
  return mode === 'real' ? new RealPriceDataService() : new InMemoryPriceDataService();
}

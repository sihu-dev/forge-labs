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
 * 가격 데이터 서비스 팩토리
 */
export function createPriceDataService(): IPriceDataService {
  return new InMemoryPriceDataService();
}

/**
 * Credit Utils
 * 클라이언트/서버 양쪽에서 사용 가능한 순수 함수들
 */

/**
 * 크레딧 가격 계산
 * @param credits 크레딧 수량
 * @returns KRW 가격
 */
export function calculatePrice(credits: number): number {
  // 가격표 (크레딧당 단가가 대량 구매 시 저렴)
  const priceTiers = [
    { min: 1000, price: 80 },    // 1000+ 크레딧: 80원/크레딧
    { min: 500, price: 90 },     // 500-999 크레딧: 90원/크레딧
    { min: 100, price: 95 },     // 100-499 크레딧: 95원/크레딧
    { min: 0, price: 100 },      // 1-99 크레딧: 100원/크레딧
  ]

  const tier = priceTiers.find((t) => credits >= t.min)!
  return credits * tier.price
}

/**
 * 백테스트 실행 비용 계산
 */
export function getBacktestCost(config: {
  timeframe: string
  days: number
  symbols: number
}): number {
  // 기본 비용: 10 크레딧
  let cost = 10

  // 타임프레임에 따른 추가 비용
  const timeframeMultiplier: Record<string, number> = {
    '1m': 3,
    '5m': 2,
    '15m': 1.5,
    '1h': 1,
    '4h': 0.8,
    '1d': 0.5,
  }

  cost *= timeframeMultiplier[config.timeframe] || 1

  // 기간에 따른 추가 비용 (30일 기준)
  cost *= config.days / 30

  // 심볼 수에 따른 추가 비용
  cost *= config.symbols

  return Math.ceil(cost)
}

/**
 * @forge/core - L2/L3 핵심 서비스 (Cells/Tissues)
 *
 * 비즈니스 로직과 데이터 접근 레이어
 * HEPHAITOS + BIDFLOW 전용
 */

// L2 Services - Exchange
export {
  type IExchangeService,
  type ITransaction,
  BinanceService,
  UpbitService,
  ExchangeServiceFactory,
} from './services/exchange-service.js';

// L2 Repositories - Portfolio
export {
  type IPortfolioRepository,
  InMemoryPortfolioRepository,
  createPortfolioRepository,
} from './repositories/portfolio-repository.js';

// L2 Services - Price Data
export {
  type IPriceDataService,
  InMemoryPriceDataService,
  RealPriceDataService,
  createPriceDataService,
} from './services/price-data-service.js';

// L2 Repositories - Strategy
export {
  type IStrategyRepository,
  InMemoryStrategyRepository,
  createStrategyRepository,
} from './repositories/strategy-repository.js';

// L2 Repositories - Backtest Result
export {
  type IBacktestResultRepository,
  InMemoryBacktestResultRepository,
  createBacktestResultRepository,
} from './repositories/backtest-result-repository.js';

// L2 Repositories - Order
export {
  type IOrderRepository,
  type IPositionRepository,
  InMemoryOrderRepository,
  InMemoryPositionRepository,
  createOrderRepository,
  createPositionRepository,
} from './repositories/order-repository.js';

// L2 Repositories - Risk
export {
  type IRiskRepository,
  InMemoryRiskRepository,
  createRiskRepository,
} from './repositories/risk-repository.js';

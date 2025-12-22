/**
 * @forge/core - L2/L3 핵심 서비스 (Cells/Tissues)
 *
 * 비즈니스 로직과 데이터 접근 레이어
 */

// L2 Services
export {
  type IExchangeService,
  type ITransaction,
  BinanceService,
  UpbitService,
  ExchangeServiceFactory,
} from './services/exchange-service.js';

// L2 Repositories - HEPHAITOS
export {
  type IPortfolioRepository,
  InMemoryPortfolioRepository,
  createPortfolioRepository,
} from './repositories/portfolio-repository.js';

// L2 Services - HEPHAITOS (백테스팅)
export {
  type IPriceDataService,
  InMemoryPriceDataService,
  createPriceDataService,
} from './services/price-data-service.js';

// L2 Repositories - HEPHAITOS (전략)
export {
  type IStrategyRepository,
  InMemoryStrategyRepository,
  createStrategyRepository,
} from './repositories/strategy-repository.js';

// L2 Repositories - HEPHAITOS (백테스트 결과)
export {
  type IBacktestResultRepository,
  InMemoryBacktestResultRepository,
  createBacktestResultRepository,
} from './repositories/backtest-result-repository.js';

// L2 Repositories - HEPHAITOS (주문 실행)
export {
  type IOrderRepository,
  type IPositionRepository,
  InMemoryOrderRepository,
  InMemoryPositionRepository,
  createOrderRepository,
  createPositionRepository,
} from './repositories/order-repository.js';

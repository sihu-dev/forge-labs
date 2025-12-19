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

// L2 Services - FOLIO
export {
  type IPlaceCrawlerService,
  type IPlaceSearchResult,
  NaverPlaceCrawlerService,
  KakaoLocalCrawlerService,
  createPlaceCrawlerService,
} from './services/place-crawler-service.js';

// L2 Repositories - FOLIO
export {
  type ICompetitorRepository,
  InMemoryCompetitorRepository,
  createCompetitorRepository,
} from './repositories/competitor-repository.js';

// L2 Repositories - DRYON (자가개선 성장 루프)
export {
  type IFeedbackRepository,
  InMemoryFeedbackRepository,
  createFeedbackRepository,
} from './repositories/feedback-repository.js';

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

// L2 Services - FOLIO (매출 데이터)
export {
  type ISalesDataService,
  InMemorySalesDataService,
  createSalesDataService,
} from './services/sales-data-service.js';

// L2 Repositories - FOLIO (매출 예측)
export {
  type IForecastRepository,
  InMemoryForecastRepository,
  createForecastRepository,
} from './repositories/forecast-repository.js';

// L2 Repositories - DRYON (알람 관리)
export {
  type IAlarmRepository,
  InMemoryAlarmRepository,
  createAlarmRepository,
} from './repositories/alarm-repository.js';

// L2 Repositories - HEPHAITOS (주문 실행)
export {
  type IOrderRepository,
  type IPositionRepository,
  InMemoryOrderRepository,
  InMemoryPositionRepository,
  createOrderRepository,
  createPositionRepository,
} from './repositories/order-repository.js';

// L2 Repositories - FOLIO (재고 관리)
export {
  type IInventoryRepository,
  InMemoryInventoryRepository,
  createInventoryRepository,
} from './repositories/inventory-repository.js';

// L2 Repositories - DRYON (에너지 모니터링)
export {
  type IEnergyRepository,
  InMemoryEnergyRepository,
  createEnergyRepository,
} from './repositories/energy-repository.js';

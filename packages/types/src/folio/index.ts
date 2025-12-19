/**
 * @forge/types - FOLIO Types
 * L0 (Atoms) - FOLIO 도메인 타입 통합 export
 */

// Category Types
export {
  type BusinessCategory,
  type FoodSubCategory,
  type CafeSubCategory,
  type IBusinessType,
  CATEGORY_DISPLAY_NAMES,
} from './category.js';

// Location Types
export {
  type ICoordinates,
  type IAddress,
  type ILocation,
  type IRadiusSearch,
  type IBoundingBox,
  DEFAULT_SEARCH_RADIUS,
  MAX_SEARCH_RADIUS,
} from './location.js';

// Product Types
export {
  type PriceLevel,
  type IPriceRange,
  type IProduct,
  type IMenu,
  type IMenuCategory,
  type IPriceHistory,
  determinePriceLevel,
  calculatePriceRange,
} from './product.js';

// Competitor Types
export {
  type DataSource,
  type ICompetitor,
  type IBusinessHours,
  type IDayHours,
  type ICompetitorSummary,
  type ICompetitorChange,
  type ICompetitorFilter,
} from './competitor.js';

// Sales Types
export {
  type DayOfWeek,
  type TimeSlot,
  type AggregationPeriod,
  type PaymentMethod,
  type ISalesRecord,
  type IHourlySales,
  type ISalesSummary,
  type ISalesTrendPoint,
  TIME_SLOT_RANGES,
  DAY_OF_WEEK_INDEX,
  hourToTimeSlot,
  dateToDayOfWeek,
} from './sales.js';

// Forecast Types
export {
  type ExternalFactorType,
  type IWeatherData,
  type IHolidayData,
  type IEventData,
  type IExternalFactors,
  type ISeasonalPattern,
  type IFactorContribution,
  type IConfidenceInterval,
  type IForecastPoint,
  type ISalesForecast,
  type IForecastEvaluation,
  type IForecastConfig,
  DEFAULT_FORECAST_CONFIG,
} from './forecast.js';

// Inventory Types
export {
  type ABCClass,
  type StockStatus,
  type OrderStatus,
  type Unit,
  type IInventoryItem,
  type IStockLevel,
  type IOrderRecommendation,
  type ISupplier,
  type IPurchaseOrderItem,
  type IPurchaseOrder,
  type IInventoryAnalysis,
  type IInventoryDashboard,
  type IStockMovement,
  type IInventoryConfig,
  DEFAULT_INVENTORY_CONFIG,
  ABC_MANAGEMENT_POLICY,
} from './inventory.js';

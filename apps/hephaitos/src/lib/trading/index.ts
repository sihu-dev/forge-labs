// ============================================
// Trading Module Exports (Enhanced 2026)
// ============================================

// Trade Executor (Enhanced 2026: UnifiedBroker, Legal Compliance, Risk Profiler)
export {
  TradeExecutor,
  createTradeExecutor,
  type ExecutorConfig,
  type ExecutorStatus,
  type ExecutorState,
  type Position,
  type TradeResult,
  type ExecutorError,
} from './executor'

// 🆕 Structured Logger (2026)
export {
  logger,
  errorMetrics,
  TradingLogger,
  ErrorMetricsTracker,
  type LogLevel,
  type LogEntry,
  type LoggerConfig,
  type ErrorMetrics,
} from './logger'

// Crypto / API Key Management
export {
  encrypt,
  decrypt,
  encryptCredentials,
  decryptCredentials,
  CredentialStore,
  credentialStore,
  generateSecurePassword,
  maskApiKey,
  isValidApiKeyFormat,
  secureCompare,
  type EncryptedData,
  type ExchangeCredentials,
  type EncryptedCredentials,
} from './crypto'

// 🆕 Leverage & Margin Trading (QRY-020)
export {
  LeverageService,
  leverageService,
  MAX_LEVERAGE,
  MARGIN_THRESHOLDS,
  MAINTENANCE_MARGIN_RATE,
  type MarginType,
  type PositionSide,
  type LeverageConfig,
  type MarginAccount,
  type MarginPosition,
  type MarginOrderRequest,
  type LiquidationEvent,
  type MarginCalculation,
} from './leverage-service'

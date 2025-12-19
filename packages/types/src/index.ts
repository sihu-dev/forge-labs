/**
 * @forge/types - L0 타입 정의 (Atoms)
 *
 * 모든 패키지가 참조하는 기초 타입 정의
 * 불변성과 타입 안전성 보장
 */

// ============================================
// 공통 기초 타입
// ============================================

/**
 * 고유 식별자 타입
 */
export type UUID = string;
export type Timestamp = string; // ISO 8601 형식

/**
 * 결과 래퍼 타입 (성공/실패 구분)
 */
export interface IResult<T, E = Error> {
  success: boolean;
  data?: T;
  error?: E;
  metadata: IResultMetadata;
}

export interface IResultMetadata {
  timestamp: Timestamp;
  duration_ms: number;
  request_id?: UUID;
}

/**
 * 페이지네이션 타입
 */
export interface IPagination {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export interface IPaginatedResult<T> extends IResult<T[]> {
  pagination: IPagination;
}

// ============================================
// 앱별 도메인 타입
// ============================================

/**
 * HEPHAITOS 도메인 타입
 */
export namespace Hephaitos {
  /** 거래소 종류 */
  export type ExchangeType = 'binance' | 'upbit' | 'bithumb' | 'coinbase' | 'kraken';

  /** 자산 타입 */
  export interface IAsset {
    symbol: string;
    name: string;
    amount: number;
    price_usd: number;
    value_usd: number;
    change_24h: number;
  }

  /** 포트폴리오 */
  export interface IPortfolio {
    id: UUID;
    user_id: UUID;
    exchange: ExchangeType;
    assets: IAsset[];
    total_value_usd: number;
    synced_at: Timestamp;
  }

  /** 트레이딩 전략 */
  export interface IStrategy {
    id: UUID;
    name: string;
    description: string;
    parameters: Record<string, unknown>;
    backtest_results?: IBacktestResult;
  }

  /** 백테스트 결과 */
  export interface IBacktestResult {
    total_return: number;
    sharpe_ratio: number;
    max_drawdown: number;
    win_rate: number;
    period: {
      start: Timestamp;
      end: Timestamp;
    };
  }
}

/**
 * FOLIO 도메인 타입
 */
export namespace Folio {
  /** 경쟁사 정보 */
  export interface ICompetitor {
    id: UUID;
    name: string;
    category: string;
    location: ILocation;
    price_range: IPriceRange;
    rating: number;
    review_count: number;
    products: IProduct[];
    crawled_at: Timestamp;
  }

  /** 위치 정보 */
  export interface ILocation {
    address: string;
    lat: number;
    lng: number;
    region: string;
  }

  /** 가격 범위 */
  export interface IPriceRange {
    min: number;
    max: number;
    currency: string;
  }

  /** 상품 정보 */
  export interface IProduct {
    id: UUID;
    name: string;
    price: number;
    category: string;
    description?: string;
    image_url?: string;
  }

  /** 매출 예측 */
  export interface ISalesForecast {
    period: string;
    predicted_revenue: number;
    confidence: number;
    factors: IForecastFactor[];
  }

  export interface IForecastFactor {
    name: string;
    impact: number; // -1 to 1
    description: string;
  }

  /** 카드 매출 분석 */
  export interface ICardAnalysis {
    period: string;
    total_sales: number;
    transaction_count: number;
    average_ticket: number;
    peak_hours: string[];
    customer_segments: ICustomerSegment[];
  }

  export interface ICustomerSegment {
    name: string;
    percentage: number;
    average_spend: number;
  }
}

/**
 * DRYON 도메인 타입
 */
export namespace Dryon {
  /** 센서 종류 */
  export type SensorType = 'temperature' | 'humidity' | 'pressure' | 'flow' | 'level' | 'vibration';

  /** 센서 프로토콜 */
  export type SensorProtocol = 'modbus' | 'opcua' | 'mqtt';

  /** 센서 정보 */
  export interface ISensor {
    id: UUID;
    name: string;
    type: SensorType;
    protocol: SensorProtocol;
    unit: string;
    location: string;
    config: ISensorConfig;
  }

  export interface ISensorConfig {
    address?: string;
    register?: number;
    topic?: string;
    polling_interval_ms: number;
  }

  /** 센서 데이터 */
  export interface ISensorData {
    sensor_id: UUID;
    value: number;
    timestamp: Timestamp;
    quality: 'good' | 'uncertain' | 'bad';
  }

  /** 공정 최적화 권장사항 */
  export interface IOptimizationRecommendation {
    id: UUID;
    type: 'energy' | 'quality' | 'throughput';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    expected_saving: number;
    parameters: Record<string, number>;
    confidence: number;
  }

  /** 슬러지 분석 결과 */
  export interface ISludgeAnalysis {
    id: UUID;
    moisture_content: number;
    dry_matter: number;
    energy_consumption: number;
    throughput: number;
    efficiency_score: number;
    timestamp: Timestamp;
  }
}

// ============================================
// 크롤러 타입
// ============================================

/** 크롤러 모드 */
export type CrawlerMode = 'web' | 'api' | 'sensor';

/** 크롤러 설정 */
export interface ICrawlerConfig {
  mode: CrawlerMode;
  max_retries: number;
  timeout_ms: number;
  rate_limit_per_second: number;
  user_agent?: string;
}

/** 크롤링 결과 */
export interface ICrawlResult<T = unknown> extends IResult<T> {
  source: string;
  content_hash?: string;
  cached: boolean;
}

// ============================================
// LLM 타입
// ============================================

/** LLM 제공자 */
export type LLMProvider = 'openai' | 'anthropic';

/** LLM 모델 */
export type LLMModel =
  | 'gpt-4o'
  | 'gpt-4o-mini'
  | 'claude-3-5-sonnet-20241022'
  | 'claude-3-5-haiku-20241022';

/** LLM 설정 */
export interface ILLMConfig {
  provider: LLMProvider;
  model: LLMModel;
  temperature: number;
  max_tokens: number;
  api_key?: string;
}

/** 추출 스키마 */
export interface IExtractionSchema {
  name: string;
  description: string;
  fields: ISchemaField[];
}

export interface ISchemaField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required: boolean;
  enum?: string[];
}

// ============================================
// 에러 타입
// ============================================

/** 에러 코드 */
export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'NETWORK_ERROR'
  | 'TIMEOUT_ERROR'
  | 'AUTH_ERROR'
  | 'RATE_LIMIT_ERROR'
  | 'NOT_FOUND_ERROR'
  | 'INTERNAL_ERROR'
  | 'UNKNOWN_ERROR';

/** 에러 상세 */
export interface IErrorDetail {
  code: ErrorCode;
  message: string;
  context?: Record<string, unknown>;
  stack?: string;
  timestamp: Timestamp;
}

// ============================================
// 상수
// ============================================

/** 기본 설정 상수 */
export const DEFAULT_CONFIG = {
  CRAWLER: {
    MAX_RETRIES: 3,
    TIMEOUT_MS: 30000,
    RATE_LIMIT_PER_SECOND: 10,
  },
  LLM: {
    TEMPERATURE: 0.7,
    MAX_TOKENS: 4096,
  },
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
  },
} as const;

/** HTTP 상태 코드 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
} as const;

/** 환율 코드 */
export type CurrencyCode = 'USD' | 'KRW' | 'EUR' | 'JPY' | 'CNY' | 'BTC' | 'ETH' | 'USDT';

// ============================================
// 모듈별 상세 타입 (나노인자 구현)
// ============================================

/**
 * HEPHAITOS 상세 타입 (L0 구현체)
 */
export * as HephaitosTypes from './hephaitos/index.js';

/**
 * FOLIO 상세 타입 (L0 구현체)
 */
export * as FolioTypes from './folio/index.js';

/**
 * DRYON 상세 타입 (L0 구현체)
 * 자가개선 성장 루프 패턴 적용
 */
export * as DryonTypes from './dryon/index.js';

/**
 * BIDFLOW 상세 타입 (L0 구현체)
 * 입찰 자동화 시스템
 */
export * as BiddingTypes from './bidding/index.js';

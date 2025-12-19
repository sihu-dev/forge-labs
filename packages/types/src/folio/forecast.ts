/**
 * @forge/types - FOLIO Forecast Types
 * L0 (Atoms) - 매출 예측 타입 정의
 */

import type { DayOfWeek, TimeSlot, AggregationPeriod } from './sales.js';

/**
 * 외부 요인 타입
 */
export type ExternalFactorType =
  | 'weather'        // 날씨
  | 'holiday'        // 공휴일
  | 'event'          // 이벤트
  | 'competition'    // 경쟁사
  | 'season'         // 계절
  | 'economy';       // 경기

/**
 * 날씨 데이터
 */
export interface IWeatherData {
  /** 날짜 */
  date: string;
  /** 기온 (°C) */
  temperature: number;
  /** 체감온도 (°C) */
  feelsLike?: number;
  /** 강수량 (mm) */
  precipitation: number;
  /** 날씨 상태 */
  condition: 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'stormy';
  /** 습도 (%) */
  humidity?: number;
}

/**
 * 휴일 데이터
 */
export interface IHolidayData {
  /** 날짜 */
  date: string;
  /** 휴일명 */
  name: string;
  /** 휴일 타입 */
  type: 'national' | 'regional' | 'school' | 'religious';
  /** 예상 영향 (1=매우 부정, 5=매우 긍정) */
  expectedImpact: number;
}

/**
 * 이벤트 데이터
 */
export interface IEventData {
  /** ID */
  id: string;
  /** 이벤트명 */
  name: string;
  /** 시작일 */
  startDate: string;
  /** 종료일 */
  endDate: string;
  /** 타입 */
  type: 'promotion' | 'festival' | 'sports' | 'concert' | 'other';
  /** 위치 (좌표) */
  location?: { lat: number; lng: number };
  /** 반경 영향 (미터) */
  impactRadius?: number;
  /** 예상 영향 계수 */
  impactFactor: number;
}

/**
 * 외부 요인 통합
 */
export interface IExternalFactors {
  /** 날짜 */
  date: string;
  /** 날씨 */
  weather?: IWeatherData;
  /** 휴일 */
  holiday?: IHolidayData;
  /** 이벤트 목록 */
  events?: IEventData[];
  /** 경쟁사 이벤트 */
  competitorEvents?: {
    competitorId: string;
    eventType: string;
    impactFactor: number;
  }[];
}

/**
 * 계절성 패턴
 */
export interface ISeasonalPattern {
  /** 요일별 지수 (평균=1.0) */
  dayOfWeekIndex: Record<DayOfWeek, number>;
  /** 월별 지수 (평균=1.0) */
  monthIndex: Record<number, number>;
  /** 시간대별 지수 (선택) */
  timeSlotIndex?: Record<TimeSlot, number>;
  /** 주차별 지수 (1-5주차) */
  weekOfMonthIndex?: Record<number, number>;
}

/**
 * 영향 요인 기여도
 */
export interface IFactorContribution {
  /** 요인 타입 */
  type: ExternalFactorType | 'trend' | 'seasonality' | 'base';
  /** 요인명 */
  name: string;
  /** 기여도 (금액) */
  contribution: number;
  /** 기여도 (%) */
  contributionPercent: number;
  /** 영향 방향 */
  direction: 'positive' | 'negative' | 'neutral';
  /** 설명 */
  description?: string;
}

/**
 * 신뢰구간
 */
export interface IConfidenceInterval {
  /** 하한 */
  lower: number;
  /** 상한 */
  upper: number;
  /** 신뢰수준 (%) */
  level: number;
}

/**
 * 단일 기간 예측
 */
export interface IForecastPoint {
  /** 날짜/기간 */
  date: string;
  /** 예측 매출 */
  predicted: number;
  /** 80% 신뢰구간 */
  confidence80: IConfidenceInterval;
  /** 95% 신뢰구간 */
  confidence95: IConfidenceInterval;
  /** 요인별 기여도 */
  factors: IFactorContribution[];
}

/**
 * 매출 예측 결과
 */
export interface ISalesForecast {
  /** 예측 ID */
  id: string;
  /** 생성 시간 */
  createdAt: string;

  /** 예측 기간 타입 */
  periodType: AggregationPeriod;
  /** 예측 시작일 */
  startDate: string;
  /** 예측 종료일 */
  endDate: string;

  /** 예측 포인트들 */
  forecasts: IForecastPoint[];

  /** 총 예측 매출 */
  totalPredicted: number;
  /** 전체 신뢰구간 */
  totalConfidence80: IConfidenceInterval;
  totalConfidence95: IConfidenceInterval;

  /** 주요 영향 요인 (Top 5) */
  topFactors: IFactorContribution[];

  /** 모델 정보 */
  model: {
    type: 'simple_ma' | 'exponential' | 'prophet' | 'custom';
    parameters?: Record<string, number>;
    accuracy?: {
      mape: number;  // Mean Absolute Percentage Error
      rmse: number;  // Root Mean Square Error
    };
  };

  /** 설명 텍스트 */
  explanation: string;
  /** 리스크 요인 */
  risks: string[];
  /** 기회 요인 */
  opportunities: string[];
}

/**
 * 예측 vs 실제 비교
 */
export interface IForecastEvaluation {
  /** 예측 ID */
  forecastId: string;
  /** 평가 기간 */
  period: {
    start: string;
    end: string;
  };
  /** 예측값 */
  predicted: number;
  /** 실제값 */
  actual: number;
  /** 오차 */
  error: number;
  /** 오차율 (%) */
  errorPercent: number;
  /** 예측이 신뢰구간 내에 있었는지 */
  withinConfidence80: boolean;
  withinConfidence95: boolean;
}

/**
 * 예측 설정
 */
export interface IForecastConfig {
  /** 예측 기간 (일) */
  horizonDays: number;
  /** 집계 단위 */
  aggregation: AggregationPeriod;
  /** 사용할 과거 데이터 기간 (일) */
  historyDays: number;
  /** 외부 요인 사용 여부 */
  useExternalFactors: boolean;
  /** 신뢰수준 */
  confidenceLevels: number[];
}

/**
 * 기본 예측 설정
 */
export const DEFAULT_FORECAST_CONFIG: IForecastConfig = {
  horizonDays: 30,
  aggregation: 'daily',
  historyDays: 90,
  useExternalFactors: true,
  confidenceLevels: [80, 95],
} as const;

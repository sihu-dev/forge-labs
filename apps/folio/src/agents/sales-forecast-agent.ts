/**
 * FOLIO - Sales Forecast Agent
 * L3 (Tissues) - 매출 예측 에이전트
 *
 * AI 기반 매출 예측 및 분석
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │                  예측 프로세스 흐름                          │
 * ├─────────────────────────────────────────────────────────────┤
 * │  1. Collect     →  과거 매출 + 외부 요인 수집               │
 * │  2. Analyze     →  패턴 분석 (계절성, 추세)                 │
 * │  3. Forecast    →  예측 모델 실행                          │
 * │  4. Explain     →  예측 근거 설명 생성                     │
 * └─────────────────────────────────────────────────────────────┘
 */

import { FolioTypes } from '@forge/types';
import type { IResult, Timestamp } from '@forge/types';
import type { ISalesDataService, IForecastRepository } from '@forge/core';
import {
  extractSeasonalPattern,
  forecastHoltLinear,
  applySeasonalAdjustment,
  applyExternalFactors,
  calculateSimpleConfidenceInterval,
  calculateMAPE,
} from '@forge/utils';

type ISalesRecord = FolioTypes.ISalesRecord;
type ISalesForecast = FolioTypes.ISalesForecast;
type IForecastConfig = FolioTypes.IForecastConfig;
type IForecastPoint = FolioTypes.IForecastPoint;
type ISeasonalPattern = FolioTypes.ISeasonalPattern;
type IExternalFactors = FolioTypes.IExternalFactors;
type IFactorContribution = FolioTypes.IFactorContribution;
type DayOfWeek = FolioTypes.DayOfWeek;

/**
 * 에이전트 설정
 */
export interface ISalesForecastAgentConfig {
  /** 기본 예측 설정 */
  defaultConfig: IForecastConfig;
  /** 외부 요인 공급자 (선택) */
  externalFactorProvider?: (date: string) => Promise<IExternalFactors>;
}

/**
 * 기본 설정
 */
const DEFAULT_AGENT_CONFIG: ISalesForecastAgentConfig = {
  defaultConfig: FolioTypes.DEFAULT_FORECAST_CONFIG,
};

/**
 * 매출 예측 에이전트
 */
export class SalesForecastAgent {
  private salesDataService: ISalesDataService;
  private forecastRepo: IForecastRepository;
  private config: ISalesForecastAgentConfig;

  constructor(
    salesDataService: ISalesDataService,
    forecastRepo: IForecastRepository,
    config: Partial<ISalesForecastAgentConfig> = {}
  ) {
    this.salesDataService = salesDataService;
    this.forecastRepo = forecastRepo;
    this.config = { ...DEFAULT_AGENT_CONFIG, ...config };
  }

  /**
   * 매출 예측 생성
   */
  async generateForecast(
    forecastConfig?: Partial<IForecastConfig>
  ): Promise<IResult<ISalesForecast>> {
    const startTime = Date.now();
    const config = { ...this.config.defaultConfig, ...forecastConfig };

    try {
      // 1. 과거 데이터 수집
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - config.historyDays);

      const historyResult = await this.salesDataService.getSalesHistory(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );

      if (!historyResult.success || !historyResult.data) {
        throw new Error('Failed to get sales history');
      }

      const salesRecords = historyResult.data;
      if (salesRecords.length < 30) {
        throw new Error('Insufficient data: need at least 30 days of history');
      }

      // 2. 패턴 분석
      const seasonalPattern = extractSeasonalPattern(salesRecords);
      const revenueValues = salesRecords.map(r => r.revenue);

      // 3. 기본 예측 (Holt 선형)
      const baseForecasts = forecastHoltLinear(
        revenueValues,
        config.horizonDays,
        0.3,
        0.1
      );

      // 4. 예측 포인트 생성
      const forecastPoints: IForecastPoint[] = [];
      const forecastStartDate = new Date(endDate);
      forecastStartDate.setDate(forecastStartDate.getDate() + 1);

      for (let i = 0; i < config.horizonDays; i++) {
        const forecastDate = new Date(forecastStartDate);
        forecastDate.setDate(forecastDate.getDate() + i);
        const dateStr = forecastDate.toISOString().split('T')[0];
        const dayOfWeek = FolioTypes.dateToDayOfWeek(forecastDate);
        const month = forecastDate.getMonth() + 1;

        // 기본 예측값
        let predicted = baseForecasts[i];
        const factors: IFactorContribution[] = [];

        // 기본 트렌드 기여
        factors.push({
          type: 'trend',
          name: '기본 추세',
          contribution: predicted - revenueValues[revenueValues.length - 1],
          contributionPercent: 0,
          direction: 'neutral',
          description: 'Holt 선형 추세 모델',
        });

        // 계절성 조정
        const { adjusted: seasonalAdjusted, contribution: seasonalContrib } =
          applySeasonalAdjustment(predicted, dayOfWeek, month, seasonalPattern);
        predicted = seasonalAdjusted;
        factors.push(seasonalContrib);

        // 외부 요인 조정 (공급자가 있으면)
        if (config.useExternalFactors && this.config.externalFactorProvider) {
          const externalFactors = await this.config.externalFactorProvider(dateStr);
          const { adjusted, contributions } = applyExternalFactors(predicted, externalFactors);
          predicted = adjusted;
          factors.push(...contributions);
        }

        // 신뢰구간
        const confidence80 = calculateSimpleConfidenceInterval(predicted, 80);
        const confidence95 = calculateSimpleConfidenceInterval(predicted, 95);

        forecastPoints.push({
          date: dateStr,
          predicted: Math.round(predicted),
          confidence80,
          confidence95,
          factors,
        });
      }

      // 5. 총합 계산
      const totalPredicted = forecastPoints.reduce((sum, p) => sum + p.predicted, 0);

      // 6. 주요 요인 추출
      const topFactors = this.extractTopFactors(forecastPoints);

      // 7. 설명 생성
      const { explanation, risks, opportunities } =
        this.generateExplanation(salesRecords, forecastPoints, seasonalPattern);

      // 8. 예측 객체 생성
      const forecast: ISalesForecast = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        periodType: config.aggregation,
        startDate: forecastPoints[0].date,
        endDate: forecastPoints[forecastPoints.length - 1].date,
        forecasts: forecastPoints,
        totalPredicted,
        totalConfidence80: calculateSimpleConfidenceInterval(totalPredicted, 80),
        totalConfidence95: calculateSimpleConfidenceInterval(totalPredicted, 95),
        topFactors,
        model: {
          type: 'exponential',
          parameters: { alpha: 0.3, beta: 0.1 },
        },
        explanation,
        risks,
        opportunities,
      };

      // 9. 저장
      await this.forecastRepo.save(forecast);

      return {
        success: true,
        data: forecast,
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
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

  /**
   * 예측 정확도 평가
   */
  async evaluateForecast(
    forecastId: string,
    actualSales: ISalesRecord[]
  ): Promise<IResult<{ accuracy: number; evaluations: FolioTypes.IForecastEvaluation[] }>> {
    const startTime = Date.now();

    const forecastResult = await this.forecastRepo.getById(forecastId);
    if (!forecastResult.success || !forecastResult.data) {
      return {
        success: false,
        error: new Error('Forecast not found'),
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    }

    const forecast = forecastResult.data;
    const evaluations: FolioTypes.IForecastEvaluation[] = [];

    // 예측과 실제 매칭
    for (const point of forecast.forecasts) {
      const actual = actualSales.find(s => s.date === point.date);
      if (actual) {
        const error = actual.revenue - point.predicted;
        const errorPercent = (error / actual.revenue) * 100;

        const evaluation: FolioTypes.IForecastEvaluation = {
          forecastId,
          period: { start: point.date, end: point.date },
          predicted: point.predicted,
          actual: actual.revenue,
          error,
          errorPercent,
          withinConfidence80:
            actual.revenue >= point.confidence80.lower &&
            actual.revenue <= point.confidence80.upper,
          withinConfidence95:
            actual.revenue >= point.confidence95.lower &&
            actual.revenue <= point.confidence95.upper,
        };

        evaluations.push(evaluation);
        await this.forecastRepo.saveEvaluation(evaluation);
      }
    }

    // MAPE 계산
    const actuals = evaluations.map(e => e.actual);
    const predictions = evaluations.map(e => e.predicted);
    const mape = calculateMAPE(actuals, predictions);

    return {
      success: true,
      data: {
        accuracy: 100 - mape,
        evaluations,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      },
    };
  }

  /**
   * 패턴 분석
   */
  async analyzePatterns(): Promise<IResult<{
    seasonalPattern: ISeasonalPattern;
    insights: string[];
  }>> {
    const startTime = Date.now();

    // 최근 90일 데이터
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);

    const historyResult = await this.salesDataService.getSalesHistory(
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );

    if (!historyResult.success || !historyResult.data) {
      return {
        success: false,
        error: new Error('Failed to get sales history'),
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    }

    const pattern = extractSeasonalPattern(historyResult.data);
    const insights = this.generatePatternInsights(pattern);

    return {
      success: true,
      data: { seasonalPattern: pattern, insights },
      metadata: {
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      },
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // 내부 헬퍼 메서드
  // ═══════════════════════════════════════════════════════════════

  private extractTopFactors(
    forecastPoints: IForecastPoint[]
  ): IFactorContribution[] {
    // 모든 요인 집계
    const factorSums = new Map<string, IFactorContribution>();

    for (const point of forecastPoints) {
      for (const factor of point.factors) {
        const existing = factorSums.get(factor.name);
        if (existing) {
          existing.contribution += factor.contribution;
          existing.contributionPercent += factor.contributionPercent;
        } else {
          factorSums.set(factor.name, { ...factor });
        }
      }
    }

    // 기여도 절대값 기준 정렬 후 Top 5
    return Array.from(factorSums.values())
      .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
      .slice(0, 5);
  }

  private generateExplanation(
    history: ISalesRecord[],
    forecasts: IForecastPoint[],
    pattern: ISeasonalPattern
  ): { explanation: string; risks: string[]; opportunities: string[] } {
    const avgHistorical = history.reduce((sum, r) => sum + r.revenue, 0) / history.length;
    const avgForecast = forecasts.reduce((sum, p) => sum + p.predicted, 0) / forecasts.length;

    const changePercent = ((avgForecast - avgHistorical) / avgHistorical) * 100;

    const parts: string[] = [];

    // 전체 전망
    if (changePercent > 10) {
      parts.push(`예측 기간 동안 평균 매출이 약 ${changePercent.toFixed(0)}% 증가할 것으로 예상됩니다.`);
    } else if (changePercent < -10) {
      parts.push(`예측 기간 동안 평균 매출이 약 ${Math.abs(changePercent).toFixed(0)}% 감소할 것으로 예상됩니다.`);
    } else {
      parts.push('예측 기간 동안 매출이 비슷한 수준을 유지할 것으로 예상됩니다.');
    }

    // 요일 패턴
    const bestDay = Object.entries(pattern.dayOfWeekIndex)
      .sort(([, a], [, b]) => b - a)[0];
    const worstDay = Object.entries(pattern.dayOfWeekIndex)
      .sort(([, a], [, b]) => a - b)[0];

    parts.push(`가장 매출이 좋은 요일은 ${this.translateDayOfWeek(bestDay[0] as DayOfWeek)}이고, ` +
      `${this.translateDayOfWeek(worstDay[0] as DayOfWeek)}이 가장 낮습니다.`);

    const explanation = parts.join(' ');

    // 리스크
    const risks: string[] = [];
    if (changePercent < -5) {
      risks.push('전반적인 하락 추세 예상');
    }
    if (worstDay[1] < 0.7) {
      risks.push(`${this.translateDayOfWeek(worstDay[0] as DayOfWeek)}요일 매출 부진`);
    }

    // 기회
    const opportunities: string[] = [];
    if (changePercent > 5) {
      opportunities.push('성장세 지속 예상');
    }
    if (bestDay[1] > 1.2) {
      opportunities.push(`${this.translateDayOfWeek(bestDay[0] as DayOfWeek)}요일 집중 마케팅 고려`);
    }

    return { explanation, risks, opportunities };
  }

  private generatePatternInsights(pattern: ISeasonalPattern): string[] {
    const insights: string[] = [];

    // 요일별 분석
    const dayEntries = Object.entries(pattern.dayOfWeekIndex) as [DayOfWeek, number][];
    const bestDay = dayEntries.sort(([, a], [, b]) => b - a)[0];
    const worstDay = dayEntries.sort(([, a], [, b]) => a - b)[0];

    insights.push(`최고 매출 요일: ${this.translateDayOfWeek(bestDay[0])} (평균 대비 ${((bestDay[1] - 1) * 100).toFixed(0)}%)`);
    insights.push(`최저 매출 요일: ${this.translateDayOfWeek(worstDay[0])} (평균 대비 ${((worstDay[1] - 1) * 100).toFixed(0)}%)`);

    // 주말 vs 평일
    const weekendAvg = (pattern.dayOfWeekIndex.sat + pattern.dayOfWeekIndex.sun) / 2;
    const weekdayAvg = (
      pattern.dayOfWeekIndex.mon +
      pattern.dayOfWeekIndex.tue +
      pattern.dayOfWeekIndex.wed +
      pattern.dayOfWeekIndex.thu +
      pattern.dayOfWeekIndex.fri
    ) / 5;

    if (weekendAvg > weekdayAvg * 1.1) {
      insights.push('주말 매출이 평일보다 높음');
    } else if (weekdayAvg > weekendAvg * 1.1) {
      insights.push('평일 매출이 주말보다 높음');
    }

    return insights;
  }

  private translateDayOfWeek(day: DayOfWeek): string {
    const translations: Record<DayOfWeek, string> = {
      mon: '월요일', tue: '화요일', wed: '수요일',
      thu: '목요일', fri: '금요일', sat: '토요일', sun: '일요일',
    };
    return translations[day];
  }
}

/**
 * 에이전트 팩토리
 */
export function createSalesForecastAgent(
  salesDataService: ISalesDataService,
  forecastRepo: IForecastRepository,
  config?: Partial<ISalesForecastAgentConfig>
): SalesForecastAgent {
  return new SalesForecastAgent(salesDataService, forecastRepo, config);
}

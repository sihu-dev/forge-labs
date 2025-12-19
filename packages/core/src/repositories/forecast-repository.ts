/**
 * @forge/core - Forecast Repository
 * L2 (Cells) - 예측 결과 저장소
 */

import type { FolioTypes, IResult, Timestamp } from '@forge/types';

type ISalesForecast = FolioTypes.ISalesForecast;
type IForecastEvaluation = FolioTypes.IForecastEvaluation;

/**
 * 예측 저장소 인터페이스
 */
export interface IForecastRepository {
  /** 예측 저장 */
  save(forecast: ISalesForecast): Promise<IResult<ISalesForecast>>;

  /** 예측 조회 */
  getById(id: string): Promise<IResult<ISalesForecast | null>>;

  /** 최근 예측 목록 */
  listRecent(limit?: number): Promise<IResult<ISalesForecast[]>>;

  /** 예측 삭제 */
  delete(id: string): Promise<IResult<boolean>>;

  /** 예측 평가 저장 */
  saveEvaluation(evaluation: IForecastEvaluation): Promise<IResult<IForecastEvaluation>>;

  /** 예측 평가 조회 */
  getEvaluationsByForecastId(forecastId: string): Promise<IResult<IForecastEvaluation[]>>;

  /** 모델 정확도 통계 */
  getAccuracyStats(): Promise<IResult<{
    avgMAPE: number;
    totalForecasts: number;
    accurateWithin80: number;
    accurateWithin95: number;
  }>>;
}

/**
 * 인메모리 예측 저장소
 */
export class InMemoryForecastRepository implements IForecastRepository {
  private forecasts: Map<string, ISalesForecast> = new Map();
  private evaluations: Map<string, IForecastEvaluation[]> = new Map();

  async save(forecast: ISalesForecast): Promise<IResult<ISalesForecast>> {
    const startTime = Date.now();
    this.forecasts.set(forecast.id, forecast);

    return {
      success: true,
      data: forecast,
      metadata: {
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      },
    };
  }

  async getById(id: string): Promise<IResult<ISalesForecast | null>> {
    const startTime = Date.now();
    const forecast = this.forecasts.get(id) ?? null;

    return {
      success: true,
      data: forecast,
      metadata: {
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      },
    };
  }

  async listRecent(limit: number = 10): Promise<IResult<ISalesForecast[]>> {
    const startTime = Date.now();

    const sorted = Array.from(this.forecasts.values())
      .sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, limit);

    return {
      success: true,
      data: sorted,
      metadata: {
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      },
    };
  }

  async delete(id: string): Promise<IResult<boolean>> {
    const startTime = Date.now();
    const deleted = this.forecasts.delete(id);
    this.evaluations.delete(id);

    return {
      success: true,
      data: deleted,
      metadata: {
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      },
    };
  }

  async saveEvaluation(
    evaluation: IForecastEvaluation
  ): Promise<IResult<IForecastEvaluation>> {
    const startTime = Date.now();

    const existing = this.evaluations.get(evaluation.forecastId) ?? [];
    existing.push(evaluation);
    this.evaluations.set(evaluation.forecastId, existing);

    return {
      success: true,
      data: evaluation,
      metadata: {
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      },
    };
  }

  async getEvaluationsByForecastId(
    forecastId: string
  ): Promise<IResult<IForecastEvaluation[]>> {
    const startTime = Date.now();
    const evaluations = this.evaluations.get(forecastId) ?? [];

    return {
      success: true,
      data: evaluations,
      metadata: {
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      },
    };
  }

  async getAccuracyStats(): Promise<
    IResult<{
      avgMAPE: number;
      totalForecasts: number;
      accurateWithin80: number;
      accurateWithin95: number;
    }>
  > {
    const startTime = Date.now();

    let totalMAPE = 0;
    let count = 0;
    let within80 = 0;
    let within95 = 0;

    for (const evaluations of this.evaluations.values()) {
      for (const evaluation of evaluations) {
        totalMAPE += Math.abs(evaluation.errorPercent);
        count++;
        if (evaluation.withinConfidence80) within80++;
        if (evaluation.withinConfidence95) within95++;
      }
    }

    return {
      success: true,
      data: {
        avgMAPE: count > 0 ? totalMAPE / count : 0,
        totalForecasts: this.forecasts.size,
        accurateWithin80: count > 0 ? (within80 / count) * 100 : 0,
        accurateWithin95: count > 0 ? (within95 / count) * 100 : 0,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      },
    };
  }
}

/**
 * 예측 저장소 팩토리
 */
export function createForecastRepository(): IForecastRepository {
  return new InMemoryForecastRepository();
}

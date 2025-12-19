/**
 * @forge/core - Energy Repository
 * L2 (Cells) - 에너지 데이터 저장소
 *
 * 에너지 계측, 소비, 요금제 데이터 CRUD
 */

import type { DryonTypes } from '@forge/types';

type IEnergyReading = DryonTypes.IEnergyReading;
type IEnergyConsumption = DryonTypes.IEnergyConsumption;
type IEfficiencyMetrics = DryonTypes.IEfficiencyMetrics;
type IEnergyTariff = DryonTypes.IEnergyTariff;
type IEnergyCost = DryonTypes.IEnergyCost;
type IPeakDemand = DryonTypes.IPeakDemand;
type IEfficiencyRecommendation = DryonTypes.IEfficiencyRecommendation;
type EnergyType = DryonTypes.EnergyType;
type AggregationPeriod = DryonTypes.AggregationPeriod;

/**
 * 에너지 저장소 인터페이스
 */
export interface IEnergyRepository {
  // ═══════════════════════════════════════════════════════════════
  // 계측값 관리
  // ═══════════════════════════════════════════════════════════════

  /** 계측값 저장 */
  saveReading(reading: IEnergyReading): Promise<IEnergyReading>;

  /** 최근 계측값 조회 */
  getLatestReading(meterId: string): Promise<IEnergyReading | null>;

  /** 기간별 계측값 조회 */
  getReadings(
    meterId: string,
    startTime: string,
    endTime: string
  ): Promise<IEnergyReading[]>;

  /** 에너지 타입별 최근 계측값 */
  getLatestByEnergyType(energyType: EnergyType): Promise<IEnergyReading | null>;

  // ═══════════════════════════════════════════════════════════════
  // 소비 집계
  // ═══════════════════════════════════════════════════════════════

  /** 소비 집계 저장 */
  saveConsumption(consumption: IEnergyConsumption): Promise<IEnergyConsumption>;

  /** 소비 집계 조회 */
  getConsumption(
    energyType: EnergyType,
    period: AggregationPeriod,
    startTime: string,
    endTime: string
  ): Promise<IEnergyConsumption[]>;

  /** 일별 소비 합계 */
  getDailyConsumption(
    date: string,
    energyType?: EnergyType
  ): Promise<Record<EnergyType, number>>;

  /** 월별 소비 합계 */
  getMonthlyConsumption(
    year: number,
    month: number,
    energyType?: EnergyType
  ): Promise<Record<EnergyType, number>>;

  // ═══════════════════════════════════════════════════════════════
  // 효율 지표
  // ═══════════════════════════════════════════════════════════════

  /** 효율 지표 저장 */
  saveEfficiencyMetrics(metrics: IEfficiencyMetrics): Promise<IEfficiencyMetrics>;

  /** 효율 지표 이력 조회 */
  getEfficiencyHistory(
    startTime: string,
    endTime: string
  ): Promise<IEfficiencyMetrics[]>;

  /** 최근 효율 지표 */
  getLatestEfficiency(): Promise<IEfficiencyMetrics | null>;

  // ═══════════════════════════════════════════════════════════════
  // 피크 수요
  // ═══════════════════════════════════════════════════════════════

  /** 피크 수요 저장 */
  savePeakDemand(peak: IPeakDemand): Promise<IPeakDemand>;

  /** 월별 피크 수요 조회 */
  getMonthlyPeak(year: number, month: number): Promise<IPeakDemand | null>;

  // ═══════════════════════════════════════════════════════════════
  // 요금제 및 비용
  // ═══════════════════════════════════════════════════════════════

  /** 요금제 저장 */
  saveTariff(tariff: IEnergyTariff): Promise<IEnergyTariff>;

  /** 현재 적용 요금제 조회 */
  getCurrentTariff(energyType: EnergyType): Promise<IEnergyTariff | null>;

  /** 비용 분석 저장 */
  saveEnergyCost(cost: IEnergyCost): Promise<IEnergyCost>;

  /** 비용 분석 조회 */
  getCostHistory(
    startTime: string,
    endTime: string
  ): Promise<IEnergyCost[]>;

  // ═══════════════════════════════════════════════════════════════
  // 효율화 추천
  // ═══════════════════════════════════════════════════════════════

  /** 추천 저장 */
  saveRecommendation(rec: IEfficiencyRecommendation): Promise<IEfficiencyRecommendation>;

  /** 활성 추천 조회 */
  getActiveRecommendations(): Promise<IEfficiencyRecommendation[]>;

  /** 추천 삭제 */
  deleteRecommendation(recId: string): Promise<boolean>;
}

/**
 * In-Memory 에너지 저장소 구현
 */
export class InMemoryEnergyRepository implements IEnergyRepository {
  private readings: Map<string, IEnergyReading[]> = new Map(); // meterId -> readings
  private consumptions: IEnergyConsumption[] = [];
  private efficiencyHistory: IEfficiencyMetrics[] = [];
  private peakDemands: Map<string, IPeakDemand> = new Map(); // YYYY-MM -> peak
  private tariffs: Map<EnergyType, IEnergyTariff> = new Map();
  private costs: IEnergyCost[] = [];
  private recommendations: Map<string, IEfficiencyRecommendation> = new Map();

  // ═══════════════════════════════════════════════════════════════
  // 계측값 관리
  // ═══════════════════════════════════════════════════════════════

  async saveReading(reading: IEnergyReading): Promise<IEnergyReading> {
    const meterReadings = this.readings.get(reading.meterId) ?? [];
    meterReadings.push(reading);

    // 최대 1000개 유지
    if (meterReadings.length > 1000) {
      meterReadings.shift();
    }

    this.readings.set(reading.meterId, meterReadings);
    return reading;
  }

  async getLatestReading(meterId: string): Promise<IEnergyReading | null> {
    const meterReadings = this.readings.get(meterId);
    if (!meterReadings || meterReadings.length === 0) return null;
    return meterReadings[meterReadings.length - 1];
  }

  async getReadings(
    meterId: string,
    startTime: string,
    endTime: string
  ): Promise<IEnergyReading[]> {
    const meterReadings = this.readings.get(meterId) ?? [];
    const startMs = new Date(startTime).getTime();
    const endMs = new Date(endTime).getTime();

    return meterReadings.filter(r => {
      const ts = new Date(r.timestamp).getTime();
      return ts >= startMs && ts <= endMs;
    });
  }

  async getLatestByEnergyType(
    energyType: EnergyType
  ): Promise<IEnergyReading | null> {
    let latest: IEnergyReading | null = null;
    let latestTime = 0;

    for (const meterReadings of this.readings.values()) {
      for (const reading of meterReadings) {
        if (reading.energyType === energyType) {
          const ts = new Date(reading.timestamp).getTime();
          if (ts > latestTime) {
            latest = reading;
            latestTime = ts;
          }
        }
      }
    }

    return latest;
  }

  // ═══════════════════════════════════════════════════════════════
  // 소비 집계
  // ═══════════════════════════════════════════════════════════════

  async saveConsumption(
    consumption: IEnergyConsumption
  ): Promise<IEnergyConsumption> {
    this.consumptions.push(consumption);

    // 최대 1000개 유지
    if (this.consumptions.length > 1000) {
      this.consumptions.shift();
    }

    return consumption;
  }

  async getConsumption(
    energyType: EnergyType,
    period: AggregationPeriod,
    startTime: string,
    endTime: string
  ): Promise<IEnergyConsumption[]> {
    const startMs = new Date(startTime).getTime();
    const endMs = new Date(endTime).getTime();

    return this.consumptions.filter(c => {
      if (c.energyType !== energyType) return false;
      if (c.period !== period) return false;
      const ts = new Date(c.startTime).getTime();
      return ts >= startMs && ts <= endMs;
    });
  }

  async getDailyConsumption(
    date: string,
    energyType?: EnergyType
  ): Promise<Record<EnergyType, number>> {
    const result: Record<EnergyType, number> = {
      electricity: 0,
      natural_gas: 0,
      steam: 0,
      heat: 0,
    };

    const targetDate = date.split('T')[0];

    for (const c of this.consumptions) {
      if (c.period !== 'daily') continue;
      if (c.startTime.split('T')[0] !== targetDate) continue;
      if (energyType && c.energyType !== energyType) continue;

      result[c.energyType] += c.totalConsumption;
    }

    return result;
  }

  async getMonthlyConsumption(
    year: number,
    month: number,
    energyType?: EnergyType
  ): Promise<Record<EnergyType, number>> {
    const result: Record<EnergyType, number> = {
      electricity: 0,
      natural_gas: 0,
      steam: 0,
      heat: 0,
    };

    const targetPrefix = `${year}-${month.toString().padStart(2, '0')}`;

    for (const c of this.consumptions) {
      if (!c.startTime.startsWith(targetPrefix)) continue;
      if (energyType && c.energyType !== energyType) continue;

      result[c.energyType] += c.totalConsumption;
    }

    return result;
  }

  // ═══════════════════════════════════════════════════════════════
  // 효율 지표
  // ═══════════════════════════════════════════════════════════════

  async saveEfficiencyMetrics(
    metrics: IEfficiencyMetrics
  ): Promise<IEfficiencyMetrics> {
    this.efficiencyHistory.push(metrics);

    if (this.efficiencyHistory.length > 500) {
      this.efficiencyHistory.shift();
    }

    return metrics;
  }

  async getEfficiencyHistory(
    startTime: string,
    endTime: string
  ): Promise<IEfficiencyMetrics[]> {
    const startMs = new Date(startTime).getTime();
    const endMs = new Date(endTime).getTime();

    return this.efficiencyHistory.filter(e => {
      const ts = new Date(e.period.start).getTime();
      return ts >= startMs && ts <= endMs;
    });
  }

  async getLatestEfficiency(): Promise<IEfficiencyMetrics | null> {
    if (this.efficiencyHistory.length === 0) return null;
    return this.efficiencyHistory[this.efficiencyHistory.length - 1];
  }

  // ═══════════════════════════════════════════════════════════════
  // 피크 수요
  // ═══════════════════════════════════════════════════════════════

  async savePeakDemand(peak: IPeakDemand): Promise<IPeakDemand> {
    const key = peak.period.start.substring(0, 7); // YYYY-MM
    this.peakDemands.set(key, peak);
    return peak;
  }

  async getMonthlyPeak(year: number, month: number): Promise<IPeakDemand | null> {
    const key = `${year}-${month.toString().padStart(2, '0')}`;
    return this.peakDemands.get(key) ?? null;
  }

  // ═══════════════════════════════════════════════════════════════
  // 요금제 및 비용
  // ═══════════════════════════════════════════════════════════════

  async saveTariff(tariff: IEnergyTariff): Promise<IEnergyTariff> {
    this.tariffs.set(tariff.energyType, tariff);
    return tariff;
  }

  async getCurrentTariff(energyType: EnergyType): Promise<IEnergyTariff | null> {
    return this.tariffs.get(energyType) ?? null;
  }

  async saveEnergyCost(cost: IEnergyCost): Promise<IEnergyCost> {
    this.costs.push(cost);

    if (this.costs.length > 500) {
      this.costs.shift();
    }

    return cost;
  }

  async getCostHistory(
    startTime: string,
    endTime: string
  ): Promise<IEnergyCost[]> {
    const startMs = new Date(startTime).getTime();
    const endMs = new Date(endTime).getTime();

    return this.costs.filter(c => {
      const ts = new Date(c.period.start).getTime();
      return ts >= startMs && ts <= endMs;
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // 효율화 추천
  // ═══════════════════════════════════════════════════════════════

  async saveRecommendation(
    rec: IEfficiencyRecommendation
  ): Promise<IEfficiencyRecommendation> {
    this.recommendations.set(rec.id, rec);
    return rec;
  }

  async getActiveRecommendations(): Promise<IEfficiencyRecommendation[]> {
    return Array.from(this.recommendations.values()).sort(
      (a, b) => b.priority - a.priority
    );
  }

  async deleteRecommendation(recId: string): Promise<boolean> {
    return this.recommendations.delete(recId);
  }
}

/**
 * 에너지 저장소 팩토리
 */
export function createEnergyRepository(): IEnergyRepository {
  return new InMemoryEnergyRepository();
}

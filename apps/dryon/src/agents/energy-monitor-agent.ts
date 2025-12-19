/**
 * DRYON - Energy Monitor Agent
 * L3 (Tissues) - 에너지 모니터링 에이전트
 *
 * ┌────────────────────────────────────────────────────────────────┐
 * │                   에너지 모니터링 워크플로우                      │
 * ├────────────────────────────────────────────────────────────────┤
 * │                                                                │
 * │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
 * │  │   COLLECT   │───▶│   ANALYZE   │───▶│  CALCULATE  │        │
 * │  │  계측 수집   │    │  소비 분석   │    │  효율 계산   │        │
 * │  └─────────────┘    └─────────────┘    └─────────────┘        │
 * │                                               │                │
 * │                     ┌─────────────┐           │                │
 * │                     │  RECOMMEND  │◀──────────┘                │
 * │                     │  효율화 추천  │                           │
 * │                     └─────────────┘                            │
 * │                            │                                   │
 * │                     ┌─────────────┐                            │
 * │                     │   ALERT     │                            │
 * │                     │  피크 경고   │                            │
 * │                     └─────────────┘                            │
 * │                                                                │
 * └────────────────────────────────────────────────────────────────┘
 */

import { DryonTypes } from '@forge/types';
import type { IEnergyRepository } from '@forge/core';
import {
  calculateSEC,
  calculateCOP,
  calculateDryingEfficiency,
  calculateLoadFactor,
  calculatePowerFactor,
  analyzePeakDemand,
  calculatePeakUtilization,
  calculateEnergyCostByTOU,
  calculateDemandCharge,
  calculateTotalEnergy,
  determineTimeOfUse,
  isSummerSeason,
  detectEnergyAnomaly,
  compareToBenchmark,
  type ITOURates,
  type IBenchmarkComparison,
} from '@forge/utils';

type IEnergyReading = DryonTypes.IEnergyReading;
type IEnergyConsumption = DryonTypes.IEnergyConsumption;
type IEfficiencyMetrics = DryonTypes.IEfficiencyMetrics;
type IEnergyCost = DryonTypes.IEnergyCost;
type IPeakDemand = DryonTypes.IPeakDemand;
type IEfficiencyRecommendation = DryonTypes.IEfficiencyRecommendation;
type IEnergyDashboard = DryonTypes.IEnergyDashboard;
type IEnergyMonitorConfig = DryonTypes.IEnergyMonitorConfig;
type IEfficiencyBenchmark = DryonTypes.IEfficiencyBenchmark;
type EnergyType = DryonTypes.EnergyType;
type TimeOfUse = DryonTypes.TimeOfUse;
type EfficiencyCategory = DryonTypes.EfficiencyCategory;

/**
 * 에너지 모니터 에이전트 설정
 */
export interface IEnergyMonitorAgentConfig extends IEnergyMonitorConfig {
  /** 계약 전력 (kW) */
  contractedPower: number;
  /** 효율 벤치마크 */
  benchmark: IEfficiencyBenchmark;
  /** TOU 요금 */
  touRates: ITOURates;
  /** 수요 요금 (원/kW) */
  demandRate: number;
  /** 기본요금 (원/월) */
  baseFee: number;
}

/**
 * 에너지 모니터 에이전트
 */
export class EnergyMonitorAgent {
  private readonly config: IEnergyMonitorAgentConfig;
  private readonly energyRepo: IEnergyRepository;

  /** 이상 감지용 이력 캐시 */
  private powerHistory: number[] = [];

  constructor(
    energyRepo: IEnergyRepository,
    config?: Partial<IEnergyMonitorAgentConfig>
  ) {
    this.energyRepo = energyRepo;
    this.config = {
      readingIntervalSec: 60,
      aggregationIntervalMin: 15,
      peakWarningThreshold: 90,
      targetSEC: 1.0,
      anomalySensitivity: 5,
      costAlertThreshold: 1000000,
      contractedPower: 500,
      benchmark: DryonTypes.DEFAULT_EFFICIENCY_BENCHMARK,
      touRates: { peak: 150, shoulder: 100, off_peak: 60 },
      demandRate: 8000,
      baseFee: 500000,
      ...config,
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // 계측값 수집
  // ═══════════════════════════════════════════════════════════════

  /**
   * 에너지 계측값 기록
   */
  async recordReading(reading: IEnergyReading): Promise<{
    reading: IEnergyReading;
    anomaly?: { isAnomaly: boolean; reason?: string };
    peakWarning?: boolean;
  }> {
    await this.energyRepo.saveReading(reading);

    // 이상 감지 (전력만)
    let anomaly: { isAnomaly: boolean; reason?: string } | undefined;
    if (reading.power !== undefined) {
      this.powerHistory.push(reading.power);
      if (this.powerHistory.length > 100) {
        this.powerHistory.shift();
      }

      if (this.powerHistory.length >= 10) {
        const anomalyResult = detectEnergyAnomaly(
          reading.power,
          this.powerHistory.slice(0, -1),
          this.config.anomalySensitivity / 5 * 2 // 1-10 → 0.4-4
        );
        if (anomalyResult.isAnomaly) {
          anomaly = anomalyResult;
        }
      }
    }

    // 피크 경고
    let peakWarning = false;
    if (reading.power !== undefined) {
      const utilization = calculatePeakUtilization(
        reading.power,
        this.config.contractedPower
      );
      if (utilization >= this.config.peakWarningThreshold) {
        peakWarning = true;
      }
    }

    return { reading, anomaly, peakWarning };
  }

  // ═══════════════════════════════════════════════════════════════
  // 소비 분석
  // ═══════════════════════════════════════════════════════════════

  /**
   * 일별 소비 요약
   */
  async getDailyConsumption(date: string): Promise<{
    byType: Record<EnergyType, number>;
    totalKwh: number;
    peakPower: number;
    avgPower: number;
    loadFactor: number;
  }> {
    const consumption = await this.energyRepo.getDailyConsumption(date);
    const totalKwh = calculateTotalEnergy(consumption);

    // 피크 분석 (전기 미터에서)
    const startOfDay = `${date}T00:00:00Z`;
    const endOfDay = `${date}T23:59:59Z`;

    // 모든 미터에서 readings 가져오기 (단순화)
    const electricReading = await this.energyRepo.getLatestByEnergyType('electricity');
    const peakAnalysis = electricReading
      ? { peak: electricReading.power ?? 0, peakTime: electricReading.timestamp, avg: 0, loadFactor: 0 }
      : { peak: 0, peakTime: '', avg: 0, loadFactor: 0 };

    return {
      byType: consumption,
      totalKwh,
      peakPower: peakAnalysis.peak,
      avgPower: peakAnalysis.avg,
      loadFactor: peakAnalysis.loadFactor,
    };
  }

  /**
   * 월별 소비 요약
   */
  async getMonthlyConsumption(
    year: number,
    month: number
  ): Promise<{
    byType: Record<EnergyType, number>;
    totalKwh: number;
    monthlyPeak: number;
  }> {
    const consumption = await this.energyRepo.getMonthlyConsumption(year, month);
    const totalKwh = calculateTotalEnergy(consumption);

    const peakDemand = await this.energyRepo.getMonthlyPeak(year, month);

    return {
      byType: consumption,
      totalKwh,
      monthlyPeak: peakDemand?.monthlyPeak ?? 0,
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // 효율 계산
  // ═══════════════════════════════════════════════════════════════

  /**
   * 효율 지표 계산 및 저장
   */
  async calculateEfficiency(
    periodStart: string,
    periodEnd: string,
    processData: {
      driedSludgeKg: number;
      moistureRemovedKg: number;
      heatOutputKwh?: number;
    }
  ): Promise<{
    metrics: IEfficiencyMetrics;
    benchmarkComparison: IBenchmarkComparison[];
  }> {
    // 기간 내 전기 소비량 조회
    const electricConsumption = await this.energyRepo.getConsumption(
      'electricity',
      'hourly',
      periodStart,
      periodEnd
    );

    const totalElectric = electricConsumption.reduce(
      (sum, c) => sum + c.totalConsumption,
      0
    );

    // 피크 전력 (간략 계산)
    const peakPower = Math.max(
      ...electricConsumption.map(c => c.peakPower ?? 0),
      0
    );
    const avgPower = electricConsumption.length > 0
      ? totalElectric / electricConsumption.length
      : 0;

    // SEC
    const sec = calculateSEC(totalElectric, processData.driedSludgeKg);

    // COP (열출력이 있는 경우)
    const cop = processData.heatOutputKwh
      ? calculateCOP(processData.heatOutputKwh, totalElectric)
      : undefined;

    // 건조 효율
    const dryingEfficiency = calculateDryingEfficiency(
      processData.moistureRemovedKg,
      totalElectric
    );

    // 부하율
    const loadFactor = calculateLoadFactor(avgPower, peakPower);

    // 역률 (최근 계측값에서)
    const latestReading = await this.energyRepo.getLatestByEnergyType('electricity');
    const powerFactor = latestReading?.powerFactor;

    const metrics: IEfficiencyMetrics = {
      period: { start: periodStart, end: periodEnd },
      sec,
      cop,
      dryingEfficiency,
      loadFactor,
      powerFactor,
      throughput: processData.driedSludgeKg,
      moistureRemoved: processData.moistureRemovedKg,
      energyInput: totalElectric,
      heatRecovered: processData.heatOutputKwh,
      heatRecoveryRate: processData.heatOutputKwh
        ? (processData.heatOutputKwh / totalElectric) * 100
        : undefined,
    };

    await this.energyRepo.saveEfficiencyMetrics(metrics);

    // 벤치마크 비교
    const benchmarkComparison = compareToBenchmark(
      {
        sec,
        cop,
        dryingEfficiency,
        loadFactor,
        powerFactor,
      },
      this.config.benchmark
    );

    return { metrics, benchmarkComparison };
  }

  // ═══════════════════════════════════════════════════════════════
  // 비용 분석
  // ═══════════════════════════════════════════════════════════════

  /**
   * 에너지 비용 분석
   */
  async analyzeCosts(
    periodStart: string,
    periodEnd: string
  ): Promise<IEnergyCost> {
    // 전기 소비량 (TOU별)
    const consumptions = await this.energyRepo.getConsumption(
      'electricity',
      'hourly',
      periodStart,
      periodEnd
    );

    // TOU별 집계
    const byTOU: Record<TimeOfUse, number> = {
      peak: 0,
      shoulder: 0,
      off_peak: 0,
    };

    for (const c of consumptions) {
      const time = new Date(c.startTime);
      const tou = determineTimeOfUse(time, isSummerSeason(time));
      byTOU[tou] += c.totalConsumption;
    }

    // 전력량 요금
    const { total: energyCharge, byTOU: costByTOU } = calculateEnergyCostByTOU(
      byTOU,
      this.config.touRates
    );

    // 수요 요금
    const peakDemand = await this.energyRepo.getMonthlyPeak(
      new Date(periodStart).getFullYear(),
      new Date(periodStart).getMonth() + 1
    );
    const demandCharge = calculateDemandCharge(
      peakDemand?.monthlyPeak ?? 0,
      this.config.demandRate
    );

    // 전체 에너지 소비
    const byEnergyType: Record<EnergyType, { consumption: number; unit: string; cost: number }> = {
      electricity: {
        consumption: byTOU.peak + byTOU.shoulder + byTOU.off_peak,
        unit: 'kWh',
        cost: energyCharge,
      },
      natural_gas: { consumption: 0, unit: 'Nm³', cost: 0 },
      steam: { consumption: 0, unit: 'ton', cost: 0 },
      heat: { consumption: 0, unit: 'kWh', cost: 0 },
    };

    const totalCost = this.config.baseFee + demandCharge + energyCharge;

    const cost: IEnergyCost = {
      period: { start: periodStart, end: periodEnd },
      byEnergyType,
      totalCost,
      baseFee: this.config.baseFee,
      demandCharge,
      energyCharge,
      byTimeOfUse: costByTOU,
    };

    await this.energyRepo.saveEnergyCost(cost);

    return cost;
  }

  // ═══════════════════════════════════════════════════════════════
  // 피크 분석
  // ═══════════════════════════════════════════════════════════════

  /**
   * 피크 수요 분석
   */
  async analyzePeak(year: number, month: number): Promise<IPeakDemand> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const startStr = startDate.toISOString();
    const endStr = endDate.toISOString();

    // 일별 소비에서 피크 추출 (단순화)
    const dailyPeaks: Array<{ date: string; peak: number; occurredAt: string }> = [];
    let monthlyPeak = 0;
    let peakOccurredAt = '';

    // 간략화된 피크 분석
    const latestReading = await this.energyRepo.getLatestByEnergyType('electricity');
    if (latestReading?.power) {
      monthlyPeak = latestReading.power;
      peakOccurredAt = latestReading.timestamp;
    }

    const peakDemand: IPeakDemand = {
      period: { start: startStr, end: endStr },
      monthlyPeak,
      peakOccurredAt,
      contractedPower: this.config.contractedPower,
      peakUtilization: calculatePeakUtilization(monthlyPeak, this.config.contractedPower),
      dailyPeaks,
    };

    await this.energyRepo.savePeakDemand(peakDemand);

    return peakDemand;
  }

  // ═══════════════════════════════════════════════════════════════
  // 효율화 추천
  // ═══════════════════════════════════════════════════════════════

  /**
   * 효율화 추천 생성
   */
  async generateRecommendations(): Promise<IEfficiencyRecommendation[]> {
    const recommendations: IEfficiencyRecommendation[] = [];
    const latestEfficiency = await this.energyRepo.getLatestEfficiency();

    if (!latestEfficiency) return recommendations;

    const comparison = compareToBenchmark(
      {
        sec: latestEfficiency.sec,
        cop: latestEfficiency.cop,
        dryingEfficiency: latestEfficiency.dryingEfficiency,
        loadFactor: latestEfficiency.loadFactor,
        powerFactor: latestEfficiency.powerFactor,
      },
      this.config.benchmark
    );

    // SEC 개선 추천
    const secComp = comparison.find(c => c.metric.includes('SEC'));
    if (secComp && secComp.status !== 'good') {
      recommendations.push({
        id: `rec-sec-${Date.now()}`,
        category: 'equipment_tuning',
        title: 'SEC 개선 필요',
        description: `현재 SEC ${secComp.current.toFixed(2)} kWh/kg로 목표치 ${secComp.target} 대비 ${Math.abs(secComp.gapPercent).toFixed(1)}% 초과`,
        estimatedSavings: Math.abs(secComp.gap) * 1000, // 예상 (간략)
        estimatedCostSavings: Math.abs(secComp.gap) * 1000 * 100,
        difficulty: 3,
        priority: secComp.status === 'critical' ? 9 : 6,
        actions: [
          '건조기 운전 조건 최적화',
          '열원 온도 조절',
          '폐열 회수 점검',
        ],
        evidence: {
          metric: 'SEC',
          current: secComp.current,
          target: secComp.target,
          gap: secComp.gap,
        },
        createdAt: new Date().toISOString(),
      });
    }

    // 부하율 개선 추천
    const lfComp = comparison.find(c => c.metric.includes('부하율'));
    if (lfComp && lfComp.status !== 'good') {
      recommendations.push({
        id: `rec-lf-${Date.now()}`,
        category: 'load_shifting',
        title: '부하율 개선 필요',
        description: `현재 부하율 ${lfComp.current.toFixed(1)}%로 목표치 ${lfComp.target}% 미달`,
        estimatedSavings: 0,
        estimatedCostSavings: this.config.demandRate * 10, // 피크 10kW 감소 가정
        difficulty: 2,
        priority: lfComp.status === 'critical' ? 8 : 5,
        actions: [
          '운전 스케줄 조정',
          '피크 시간대 부하 분산',
          '야간 운전 비율 확대',
        ],
        evidence: {
          metric: '부하율',
          current: lfComp.current,
          target: lfComp.target,
          gap: lfComp.gap,
        },
        createdAt: new Date().toISOString(),
      });
    }

    // 저장
    for (const rec of recommendations) {
      await this.energyRepo.saveRecommendation(rec);
    }

    return recommendations;
  }

  /**
   * 활성 추천 조회
   */
  async getRecommendations(): Promise<IEfficiencyRecommendation[]> {
    return this.energyRepo.getActiveRecommendations();
  }

  // ═══════════════════════════════════════════════════════════════
  // 대시보드
  // ═══════════════════════════════════════════════════════════════

  /**
   * 에너지 대시보드 데이터
   */
  async getDashboard(): Promise<IEnergyDashboard> {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    // 현재 전력
    const latestReading = await this.energyRepo.getLatestByEnergyType('electricity');
    const currentPower = latestReading?.power ?? 0;

    // 오늘 소비량
    const todayConsumption = await this.energyRepo.getDailyConsumption(today);

    // 이번 달 소비량
    const monthConsumption = await this.energyRepo.getMonthlyConsumption(year, month);

    // 이번 달 비용 (간략 추정)
    const monthKwh = calculateTotalEnergy(monthConsumption);
    const monthCost = monthKwh * 100; // 대략 100원/kWh 가정

    // 현재 효율
    const latestEfficiency = await this.energyRepo.getLatestEfficiency();
    const currentEfficiency = {
      sec: latestEfficiency?.sec ?? 0,
      cop: latestEfficiency?.cop,
      dryingEfficiency: latestEfficiency?.dryingEfficiency ?? 0,
    };

    // 피크 현황
    const peakStatus = {
      currentPeak: currentPower,
      contractedPower: this.config.contractedPower,
      utilizationPercent: calculatePeakUtilization(currentPower, this.config.contractedPower),
    };

    // 현재 시간대
    const currentTimeOfUse = determineTimeOfUse(now, isSummerSeason(now));

    // 활성 추천 수
    const recommendations = await this.energyRepo.getActiveRecommendations();

    return {
      currentPower,
      todayConsumption,
      monthConsumption,
      monthCost,
      currentEfficiency,
      peakStatus,
      currentTimeOfUse,
      trend24h: [], // 실제 구현에서는 24시간 데이터
      activeRecommendations: recommendations.length,
    };
  }
}

/**
 * 에너지 모니터 에이전트 팩토리
 */
export function createEnergyMonitorAgent(
  energyRepo: IEnergyRepository,
  config?: Partial<IEnergyMonitorAgentConfig>
): EnergyMonitorAgent {
  return new EnergyMonitorAgent(energyRepo, config);
}

/**
 * @forge/types - DRYON Energy Types
 * L0 (Atoms) - 에너지 모니터링 타입 정의
 */

// ═══════════════════════════════════════════════════════════════
// 기본 타입
// ═══════════════════════════════════════════════════════════════

/**
 * 에너지 타입
 */
export type EnergyType = 'electricity' | 'natural_gas' | 'steam' | 'heat';

/**
 * 시간대 구분 (TOU)
 */
export type TimeOfUse = 'peak' | 'shoulder' | 'off_peak';

/**
 * 집계 기간
 */
export type AggregationPeriod = 'hourly' | 'daily' | 'weekly' | 'monthly';

/**
 * 효율화 카테고리
 */
export type EfficiencyCategory =
  | 'load_shifting'      // 부하 이동
  | 'peak_reduction'     // 피크 절감
  | 'equipment_tuning'   // 장비 조정
  | 'heat_recovery'      // 폐열 회수
  | 'insulation'         // 단열 개선
  | 'maintenance';       // 유지보수

// ═══════════════════════════════════════════════════════════════
// 에너지 계측
// ═══════════════════════════════════════════════════════════════

/**
 * 에너지 계측값
 */
export interface IEnergyReading {
  /** 계측 ID */
  id: string;
  /** 미터 ID */
  meterId: string;
  /** 에너지 타입 */
  energyType: EnergyType;
  /** 계측 시간 */
  timestamp: string;
  /** 순시 전력 (kW) */
  power?: number;
  /** 누적 사용량 */
  cumulativeEnergy: number;
  /** 단위 (kWh, Nm³, ton) */
  unit: string;
  /** 역률 (전기만) */
  powerFactor?: number;
  /** 유효전력 (kW) */
  activePower?: number;
  /** 무효전력 (kVar) */
  reactivePower?: number;
  /** 피상전력 (kVA) */
  apparentPower?: number;
  /** 전압 (V) */
  voltage?: number;
  /** 전류 (A) */
  current?: number;
  /** 품질 플래그 */
  quality: 'good' | 'uncertain' | 'bad';
}

/**
 * 에너지 소비 집계
 */
export interface IEnergyConsumption {
  /** 에너지 타입 */
  energyType: EnergyType;
  /** 시작 시간 */
  startTime: string;
  /** 종료 시간 */
  endTime: string;
  /** 집계 기간 */
  period: AggregationPeriod;
  /** 총 소비량 */
  totalConsumption: number;
  /** 단위 */
  unit: string;
  /** 피크 전력 (kW) */
  peakPower?: number;
  /** 피크 시간 */
  peakTime?: string;
  /** 평균 전력 (kW) */
  avgPower?: number;
  /** 시간대별 소비 */
  byTimeOfUse?: Record<TimeOfUse, number>;
  /** 비용 */
  cost?: number;
}

// ═══════════════════════════════════════════════════════════════
// 효율 지표
// ═══════════════════════════════════════════════════════════════

/**
 * 효율 지표
 */
export interface IEfficiencyMetrics {
  /** 측정 기간 */
  period: {
    start: string;
    end: string;
  };
  /** SEC: 비에너지소비량 (kWh/kg 건조슬러지) */
  sec: number;
  /** COP: 성능계수 (열출력/전기입력) */
  cop?: number;
  /** 건조 효율 (%) */
  dryingEfficiency: number;
  /** 부하율 (평균/피크) */
  loadFactor: number;
  /** 역률 */
  powerFactor?: number;
  /** 처리량 (kg/h) */
  throughput: number;
  /** 수분 제거량 (kg) */
  moistureRemoved: number;
  /** 투입 에너지 (kWh) */
  energyInput: number;
  /** 열 회수량 (kWh) */
  heatRecovered?: number;
  /** 열 회수율 (%) */
  heatRecoveryRate?: number;
}

/**
 * 기준 효율 (벤치마크)
 */
export interface IEfficiencyBenchmark {
  /** SEC 목표 */
  targetSEC: number;
  /** COP 목표 */
  targetCOP: number;
  /** 건조 효율 목표 */
  targetDryingEfficiency: number;
  /** 부하율 목표 */
  targetLoadFactor: number;
  /** 역률 목표 */
  targetPowerFactor: number;
}

// ═══════════════════════════════════════════════════════════════
// 요금 및 비용
// ═══════════════════════════════════════════════════════════════

/**
 * 에너지 요금제
 */
export interface IEnergyTariff {
  /** 요금제 ID */
  id: string;
  /** 요금제 이름 */
  name: string;
  /** 에너지 타입 */
  energyType: EnergyType;
  /** 적용 시작일 */
  effectiveFrom: string;
  /** 기본요금 (월) */
  baseFee: number;
  /** 수요요금 (원/kW) */
  demandCharge?: number;
  /** 전력량요금 */
  energyCharges: {
    /** 시간대별 요금 */
    byTimeOfUse?: Record<TimeOfUse, number>;
    /** 단일 요금 */
    flat?: number;
  };
  /** 누진 구간 */
  tiers?: Array<{
    /** 구간 상한 */
    upTo: number;
    /** 단가 */
    rate: number;
  }>;
}

/**
 * 에너지 비용 분석
 */
export interface IEnergyCost {
  /** 분석 기간 */
  period: {
    start: string;
    end: string;
  };
  /** 에너지 타입별 비용 */
  byEnergyType: Record<EnergyType, {
    consumption: number;
    unit: string;
    cost: number;
  }>;
  /** 총 비용 */
  totalCost: number;
  /** 기본요금 */
  baseFee: number;
  /** 수요요금 */
  demandCharge: number;
  /** 전력량요금 */
  energyCharge: number;
  /** 시간대별 비용 */
  byTimeOfUse?: Record<TimeOfUse, number>;
  /** 단위당 비용 (원/kg 건조슬러지) */
  costPerUnit?: number;
}

// ═══════════════════════════════════════════════════════════════
// 피크 수요
// ═══════════════════════════════════════════════════════════════

/**
 * 피크 수요 분석
 */
export interface IPeakDemand {
  /** 분석 기간 */
  period: {
    start: string;
    end: string;
  };
  /** 월간 최대 수요 (kW) */
  monthlyPeak: number;
  /** 피크 발생 시간 */
  peakOccurredAt: string;
  /** 계약 전력 (kW) */
  contractedPower: number;
  /** 피크 사용률 (%) */
  peakUtilization: number;
  /** 일별 피크 기록 */
  dailyPeaks: Array<{
    date: string;
    peak: number;
    occurredAt: string;
  }>;
  /** 피크 예측 */
  forecast?: {
    expectedPeak: number;
    confidence: number;
  };
}

// ═══════════════════════════════════════════════════════════════
// 효율화 추천
// ═══════════════════════════════════════════════════════════════

/**
 * 효율화 추천
 */
export interface IEfficiencyRecommendation {
  /** 추천 ID */
  id: string;
  /** 카테고리 */
  category: EfficiencyCategory;
  /** 제목 */
  title: string;
  /** 상세 설명 */
  description: string;
  /** 예상 절감량 (kWh) */
  estimatedSavings: number;
  /** 예상 비용 절감 (원) */
  estimatedCostSavings: number;
  /** 구현 난이도 (1-5) */
  difficulty: number;
  /** 우선순위 (1-10) */
  priority: number;
  /** 실행 방법 */
  actions: string[];
  /** 근거 데이터 */
  evidence: {
    metric: string;
    current: number;
    target: number;
    gap: number;
  };
  /** 생성 시간 */
  createdAt: string;
}

// ═══════════════════════════════════════════════════════════════
// 대시보드
// ═══════════════════════════════════════════════════════════════

/**
 * 에너지 대시보드 데이터
 */
export interface IEnergyDashboard {
  /** 현재 전력 (kW) */
  currentPower: number;
  /** 오늘 소비량 */
  todayConsumption: Record<EnergyType, number>;
  /** 이번 달 소비량 */
  monthConsumption: Record<EnergyType, number>;
  /** 이번 달 비용 */
  monthCost: number;
  /** 현재 효율 지표 */
  currentEfficiency: {
    sec: number;
    cop?: number;
    dryingEfficiency: number;
  };
  /** 피크 현황 */
  peakStatus: {
    currentPeak: number;
    contractedPower: number;
    utilizationPercent: number;
  };
  /** 시간대 현황 */
  currentTimeOfUse: TimeOfUse;
  /** 실시간 추세 (최근 24시간) */
  trend24h: Array<{
    timestamp: string;
    power: number;
    consumption: number;
  }>;
  /** 활성 추천 수 */
  activeRecommendations: number;
}

// ═══════════════════════════════════════════════════════════════
// 설정
// ═══════════════════════════════════════════════════════════════

/**
 * 에너지 모니터링 설정
 */
export interface IEnergyMonitorConfig {
  /** 계측 주기 (초) */
  readingIntervalSec: number;
  /** 집계 주기 (분) */
  aggregationIntervalMin: number;
  /** 피크 경고 임계값 (계약전력 대비 %) */
  peakWarningThreshold: number;
  /** SEC 목표 */
  targetSEC: number;
  /** 이상 감지 민감도 (1-10) */
  anomalySensitivity: number;
  /** 비용 알림 임계값 (원) */
  costAlertThreshold: number;
}

/**
 * 기본 에너지 모니터링 설정
 */
export const DEFAULT_ENERGY_CONFIG: IEnergyMonitorConfig = {
  readingIntervalSec: 60,
  aggregationIntervalMin: 15,
  peakWarningThreshold: 90,
  targetSEC: 1.0,
  anomalySensitivity: 5,
  costAlertThreshold: 1000000,
};

/**
 * 기본 효율 벤치마크
 */
export const DEFAULT_EFFICIENCY_BENCHMARK: IEfficiencyBenchmark = {
  targetSEC: 1.0,
  targetCOP: 3.0,
  targetDryingEfficiency: 70,
  targetLoadFactor: 60,
  targetPowerFactor: 0.95,
};

/**
 * 에너지 변환 계수
 */
export const ENERGY_CONVERSION = {
  /** 천연가스 → kWh (Nm³당) */
  naturalGasToKwh: 10.5,
  /** 스팀 → kWh (ton당) */
  steamToKwh: 640,
  /** 물의 증발잠열 (kWh/kg) */
  waterLatentHeat: 0.627,
};

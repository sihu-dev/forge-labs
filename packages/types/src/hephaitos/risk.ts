/**
 * @forge/types - HEPHAITOS Risk Types
 * L0 (Atoms) - 리스크 관리 타입 정의
 */

/**
 * 리스크 수준
 */
export type RiskLevel =
  | 'minimal'    // 최소 리스크
  | 'low'        // 낮은 리스크
  | 'moderate'   // 보통 리스크
  | 'high'       // 높은 리스크
  | 'extreme';   // 극단적 리스크

/**
 * VaR 계산 방법
 */
export type VaRMethod =
  | 'historical'      // 역사적 시뮬레이션
  | 'parametric'      // 모수적 (정규분포 가정)
  | 'monte_carlo';    // 몬테카를로 시뮬레이션

/**
 * VaR 계산 결과
 */
export interface IVaRResult {
  /** VaR 값 (손실 금액) */
  value: number;
  /** VaR 비율 (포트폴리오 대비 %) */
  percentage: number;
  /** 신뢰수준 (예: 0.95 = 95%) */
  confidenceLevel: number;
  /** 보유기간 (일) */
  holdingPeriod: number;
  /** 계산 방법 */
  method: VaRMethod;
  /** 계산 일시 */
  calculatedAt: string;
}

/**
 * CVaR (Conditional VaR) 결과
 * Expected Shortfall이라고도 함
 */
export interface ICVaRResult extends IVaRResult {
  /** CVaR 값 (VaR 초과 시 예상 평균 손실) */
  cvarValue: number;
  /** CVaR 비율 */
  cvarPercentage: number;
}

/**
 * 드로다운 분석 결과
 */
export interface IDrawdownAnalysis {
  /** 현재 드로다운 (%) */
  currentDrawdown: number;
  /** 최대 드로다운 (%) */
  maxDrawdown: number;
  /** 최대 드로다운 발생일 */
  maxDrawdownDate: string;
  /** 평균 드로다운 (%) */
  avgDrawdown: number;
  /** 드로다운 지속 기간 (현재, 일) */
  currentDuration: number;
  /** 최장 드로다운 기간 (일) */
  maxDuration: number;
  /** 회복까지 예상 기간 (일, null이면 예측 불가) */
  estimatedRecovery: number | null;
  /** 드로다운 횟수 (기간 내) */
  drawdownCount: number;
  /** 5% 이상 드로다운 횟수 */
  significantDrawdowns: number;
}

/**
 * 리스크 한도 설정
 */
export interface IRiskLimit {
  /** 한도 ID */
  id: string;
  /** 사용자 ID */
  userId: string;
  /** 포트폴리오 ID */
  portfolioId?: string;

  /** 일일 최대 손실 (%) */
  dailyLossLimit: number;
  /** 주간 최대 손실 (%) */
  weeklyLossLimit: number;
  /** 월간 최대 손실 (%) */
  monthlyLossLimit: number;

  /** 최대 드로다운 허용치 (%) */
  maxDrawdownLimit: number;
  /** 단일 포지션 최대 비중 (%) */
  maxPositionSize: number;
  /** 최대 레버리지 */
  maxLeverage: number;

  /** VaR 한도 (포트폴리오 대비 %) */
  varLimit: number;

  /** 활성화 여부 */
  isActive: boolean;
  /** 생성일 */
  createdAt: string;
  /** 수정일 */
  updatedAt: string;
}

/**
 * 리스크 알림
 */
export interface IRiskAlert {
  /** 알림 ID */
  id: string;
  /** 사용자 ID */
  userId: string;
  /** 포트폴리오 ID */
  portfolioId?: string;

  /** 알림 유형 */
  type:
    | 'var_breach'         // VaR 한도 초과
    | 'drawdown_warning'   // 드로다운 경고
    | 'loss_limit'         // 손실 한도 초과
    | 'position_size'      // 포지션 사이즈 초과
    | 'leverage_warning'   // 레버리지 경고
    | 'correlation_risk';  // 상관관계 리스크

  /** 리스크 수준 */
  level: RiskLevel;
  /** 알림 제목 */
  title: string;
  /** 알림 메시지 */
  message: string;

  /** 현재 값 */
  currentValue: number;
  /** 한도 값 */
  limitValue: number;
  /** 초과율 (%) */
  breachPercent: number;

  /** 읽음 여부 */
  isRead: boolean;
  /** 해결 여부 */
  isResolved: boolean;
  /** 생성일 */
  createdAt: string;
  /** 해결일 */
  resolvedAt?: string;
}

/**
 * 포지션 사이즈 권고
 */
export interface IPositionSizeRecommendation {
  /** 심볼 */
  symbol: string;
  /** 권장 포지션 사이즈 (금액) */
  recommendedSize: number;
  /** 권장 포지션 비중 (%) */
  recommendedPercent: number;
  /** 최대 허용 사이즈 (금액) */
  maxAllowedSize: number;
  /** 최대 허용 비중 (%) */
  maxAllowedPercent: number;

  /** 계산 기준 */
  basis: {
    /** 포트폴리오 총 가치 */
    portfolioValue: number;
    /** 리스크 허용 비율 (%) */
    riskTolerance: number;
    /** 예상 변동성 (%) */
    expectedVolatility: number;
    /** 손절 비율 (%) */
    stopLossPercent: number;
  };

  /** 리스크 수준 */
  riskLevel: RiskLevel;
  /** 권고 사유 */
  rationale: string;
}

/**
 * 종합 리스크 지표
 */
export interface IRiskMetrics {
  /** 포트폴리오 ID */
  portfolioId: string;
  /** 계산 일시 */
  calculatedAt: string;

  // ─────────────────────────────────────
  // VaR 지표
  // ─────────────────────────────────────

  /** 1일 VaR (95%) */
  var95_1d: IVaRResult;
  /** 1일 VaR (99%) */
  var99_1d: IVaRResult;
  /** 10일 VaR (95%) */
  var95_10d: IVaRResult;
  /** CVaR (95%) */
  cvar95: ICVaRResult;

  // ─────────────────────────────────────
  // 드로다운 지표
  // ─────────────────────────────────────

  /** 드로다운 분석 */
  drawdown: IDrawdownAnalysis;

  // ─────────────────────────────────────
  // 리스크 조정 수익률
  // ─────────────────────────────────────

  /** 샤프 비율 */
  sharpeRatio: number;
  /** 소르티노 비율 */
  sortinoRatio: number;
  /** 칼마 비율 */
  calmarRatio: number;
  /** 정보 비율 (벤치마크 대비) */
  informationRatio?: number;

  // ─────────────────────────────────────
  // 변동성 지표
  // ─────────────────────────────────────

  /** 일간 변동성 (%) */
  dailyVolatility: number;
  /** 연환산 변동성 (%) */
  annualizedVolatility: number;
  /** 하방 변동성 (%) */
  downsideVolatility: number;
  /** 베타 (시장 대비) */
  beta?: number;

  // ─────────────────────────────────────
  // 집중도 지표
  // ─────────────────────────────────────

  /** 허핀달-허쉬만 지수 (집중도) */
  hhi: number;
  /** 상위 자산 비중 (%) */
  topAssetWeight: number;
  /** 상관관계 리스크 점수 */
  correlationRisk: number;

  // ─────────────────────────────────────
  // 종합 평가
  // ─────────────────────────────────────

  /** 종합 리스크 수준 */
  overallRiskLevel: RiskLevel;
  /** 리스크 점수 (0-100) */
  riskScore: number;
  /** 활성 알림 수 */
  activeAlerts: number;
}

/**
 * 리스크 한도 기본값
 */
export const DEFAULT_RISK_LIMITS: Omit<IRiskLimit, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
  dailyLossLimit: 3,        // 3%
  weeklyLossLimit: 7,       // 7%
  monthlyLossLimit: 15,     // 15%
  maxDrawdownLimit: 20,     // 20%
  maxPositionSize: 25,      // 25%
  maxLeverage: 3,           // 3x
  varLimit: 5,              // 5%
  isActive: true,
} as const;

/**
 * 리스크 수준 임계값
 */
export const RISK_LEVEL_THRESHOLDS = {
  /** 리스크 점수 기준 */
  score: {
    minimal: 20,    // 0-20
    low: 40,        // 21-40
    moderate: 60,   // 41-60
    high: 80,       // 61-80
    extreme: 100,   // 81-100
  },
  /** VaR 기준 (포트폴리오 대비 %) */
  var: {
    minimal: 1,
    low: 3,
    moderate: 5,
    high: 10,
    extreme: Infinity,
  },
  /** 드로다운 기준 (%) */
  drawdown: {
    minimal: 5,
    low: 10,
    moderate: 20,
    high: 30,
    extreme: Infinity,
  },
} as const;

/**
 * HEPHAITOS - Risk Management Agent
 * L3 (Tissues) - 리스크 관리 에이전트
 *
 * 포트폴리오 리스크를 실시간으로 모니터링하고 관리
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │                  리스크 관리 흐름                            │
 * ├─────────────────────────────────────────────────────────────┤
 * │  1. Monitor    →  실시간 포트폴리오 가치 추적                │
 * │  2. Calculate  →  VaR, CVaR, 드로다운 계산                  │
 * │  3. Evaluate   →  리스크 한도 대비 평가                      │
 * │  4. Alert      →  위험 감지 시 알림 발생                     │
 * │  5. Recommend  →  포지션 조정 권고                           │
 * └─────────────────────────────────────────────────────────────┘
 *
 * ⚠️ 면책조항: 리스크 분석은 참고용이며 투자 결정은 본인 책임입니다.
 */

import type { IResult, HephaitosTypes } from '@forge/types';
import type { IRiskRepository, IPortfolioRepository } from '@forge/core';
import {
  calculateVaR,
  calculateCVaR,
  analyzeDrawdown,
  calculateSharpeRatio,
  calculateSortinoRatio,
  calculateCalmarRatio,
  calculateDailyVolatility,
  calculateAnnualizedVolatility,
  calculateDownsideVolatility,
  calculateBeta,
  calculateHHI,
  calculateCorrelationRisk,
  calculateRiskScore,
  getRiskLevelFromScore,
  recommendPositionSize,
} from '@forge/utils';

type IRiskMetrics = HephaitosTypes.IRiskMetrics;
type IRiskLimit = HephaitosTypes.IRiskLimit;
type IRiskAlert = HephaitosTypes.IRiskAlert;
type IVaRResult = HephaitosTypes.IVaRResult;
type ICVaRResult = HephaitosTypes.ICVaRResult;
type IDrawdownAnalysis = HephaitosTypes.IDrawdownAnalysis;
type IPositionSizeRecommendation = HephaitosTypes.IPositionSizeRecommendation;
type RiskLevel = HephaitosTypes.RiskLevel;

/**
 * 에이전트 설정
 */
export interface IRiskAgentConfig {
  /** 리스크 계산 주기 (ms) */
  calculationIntervalMs?: number;
  /** 알림 발생 콜백 */
  onAlert?: (alert: IRiskAlert) => void;
  /** VaR 신뢰수준 (기본: 0.95) */
  varConfidenceLevel?: number;
  /** VaR 보유기간 (기본: 1일) */
  varHoldingPeriod?: number;
  /** 자동 알림 생성 활성화 */
  autoAlertEnabled?: boolean;
}

/**
 * 일별 수익률 데이터
 */
interface IDailyReturn {
  date: string;
  return: number;
  portfolioValue: number;
}

/**
 * 자산 비중 데이터
 */
interface IAssetWeight {
  symbol: string;
  weight: number;
}

/**
 * 리스크 관리 에이전트
 *
 * 포트폴리오 리스크를 실시간으로 모니터링하고
 * VaR, 드로다운 등의 지표를 계산하여 리스크 한도 초과 시 알림
 */
export class RiskAgent {
  private riskRepo: IRiskRepository;
  private portfolioRepo: IPortfolioRepository;
  private config: Required<IRiskAgentConfig>;

  // 캐시
  private dailyReturnsCache: Map<string, IDailyReturn[]> = new Map();
  private assetWeightsCache: Map<string, IAssetWeight[]> = new Map();

  constructor(
    riskRepo: IRiskRepository,
    portfolioRepo: IPortfolioRepository,
    config: IRiskAgentConfig = {}
  ) {
    this.riskRepo = riskRepo;
    this.portfolioRepo = portfolioRepo;
    this.config = {
      calculationIntervalMs: config.calculationIntervalMs ?? 60000, // 1분
      onAlert: config.onAlert ?? (() => {}),
      varConfidenceLevel: config.varConfidenceLevel ?? 0.95,
      varHoldingPeriod: config.varHoldingPeriod ?? 1,
      autoAlertEnabled: config.autoAlertEnabled ?? true,
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // 리스크 지표 계산
  // ═══════════════════════════════════════════════════════════════

  /**
   * 포트폴리오 리스크 지표 계산
   */
  async calculateRiskMetrics(
    portfolioId: string,
    dailyReturns: number[],
    portfolioValue: number,
    assetWeights: number[],
    benchmarkReturns?: number[]
  ): Promise<IResult<IRiskMetrics>> {
    const startTime = Date.now();

    try {
      // VaR 계산
      const var95_1d = calculateVaR(dailyReturns, portfolioValue, {
        confidenceLevel: 0.95,
        holdingPeriod: 1,
        method: 'historical',
      });

      const var99_1d = calculateVaR(dailyReturns, portfolioValue, {
        confidenceLevel: 0.99,
        holdingPeriod: 1,
        method: 'historical',
      });

      const var95_10d = calculateVaR(dailyReturns, portfolioValue, {
        confidenceLevel: 0.95,
        holdingPeriod: 10,
        method: 'historical',
      });

      // CVaR 계산
      const cvar95 = calculateCVaR(dailyReturns, portfolioValue, 0.95, 1);

      // 포트폴리오 가치 시계열 생성 (수익률에서 역산)
      const equityValues = this.reconstructEquityCurve(dailyReturns, portfolioValue);
      const timestamps = this.generateTimestamps(dailyReturns.length);

      // 드로다운 분석
      const drawdown = analyzeDrawdown(equityValues, timestamps);

      // 리스크 조정 수익률
      const sharpeRatio = calculateSharpeRatio(dailyReturns);
      const sortinoRatio = calculateSortinoRatio(dailyReturns);

      // 연환산 수익률 계산 (단순 평균 기반)
      const avgDailyReturn = dailyReturns.length > 0
        ? dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length
        : 0;
      const annualizedReturn = avgDailyReturn * 252 * 100;

      const calmarRatio = calculateCalmarRatio(annualizedReturn, drawdown.maxDrawdown);

      // 정보 비율 (벤치마크가 있는 경우)
      let informationRatio: number | undefined;
      if (benchmarkReturns && benchmarkReturns.length === dailyReturns.length) {
        const excessReturns = dailyReturns.map((r, i) => r - benchmarkReturns[i]);
        const avgExcess = excessReturns.reduce((a, b) => a + b, 0) / excessReturns.length;
        const trackingError = Math.sqrt(
          excessReturns.reduce((sum, r) => sum + Math.pow(r - avgExcess, 2), 0) / excessReturns.length
        );
        if (trackingError > 0) {
          informationRatio = (avgExcess * 252) / (trackingError * Math.sqrt(252));
        }
      }

      // 변동성 지표
      const dailyVolatility = calculateDailyVolatility(dailyReturns);
      const annualizedVolatility = calculateAnnualizedVolatility(dailyReturns);
      const downsideVolatility = calculateDownsideVolatility(dailyReturns);

      // 베타 (벤치마크가 있는 경우)
      const beta = benchmarkReturns
        ? calculateBeta(dailyReturns, benchmarkReturns)
        : undefined;

      // 집중도 지표
      const hhi = calculateHHI(assetWeights);
      const topAssetWeight = assetWeights.length > 0 ? Math.max(...assetWeights) : 0;

      // 상관관계 리스크 (단순화: 평균 집중도 기반)
      const correlationRisk = hhi / 100; // HHI를 0-100 스케일로 변환

      // 종합 리스크 점수
      const riskScore = calculateRiskScore(
        var95_1d.percentage,
        drawdown.maxDrawdown,
        annualizedVolatility,
        hhi
      );

      const overallRiskLevel = getRiskLevelFromScore(riskScore);

      // 활성 알림 수 조회
      const alertsResult = await this.riskRepo.getAlerts(
        '', // userId는 별도로 전달 필요
        { portfolioId, isResolved: false }
      );
      const activeAlerts = alertsResult.success && alertsResult.data ? alertsResult.data.length : 0;

      const metrics: IRiskMetrics = {
        portfolioId,
        calculatedAt: new Date().toISOString(),
        var95_1d,
        var99_1d,
        var95_10d,
        cvar95,
        drawdown,
        sharpeRatio,
        sortinoRatio,
        calmarRatio,
        informationRatio,
        dailyVolatility,
        annualizedVolatility,
        downsideVolatility,
        beta,
        hhi,
        topAssetWeight,
        correlationRisk,
        overallRiskLevel,
        riskScore,
        activeAlerts,
      };

      // 저장
      await this.riskRepo.saveMetrics(metrics);

      return {
        success: true,
        data: metrics,
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

  // ═══════════════════════════════════════════════════════════════
  // 리스크 한도 관리
  // ═══════════════════════════════════════════════════════════════

  /**
   * 리스크 한도 설정
   */
  async setRiskLimits(
    userId: string,
    limits: Partial<IRiskLimit>,
    portfolioId?: string
  ): Promise<IResult<IRiskLimit>> {
    const startTime = Date.now();

    try {
      const now = new Date().toISOString();

      const riskLimit: IRiskLimit = {
        id: crypto.randomUUID(),
        userId,
        portfolioId,
        dailyLossLimit: limits.dailyLossLimit ?? 3,
        weeklyLossLimit: limits.weeklyLossLimit ?? 7,
        monthlyLossLimit: limits.monthlyLossLimit ?? 15,
        maxDrawdownLimit: limits.maxDrawdownLimit ?? 20,
        maxPositionSize: limits.maxPositionSize ?? 25,
        maxLeverage: limits.maxLeverage ?? 3,
        varLimit: limits.varLimit ?? 5,
        isActive: limits.isActive ?? true,
        createdAt: now,
        updatedAt: now,
      };

      const result = await this.riskRepo.saveLimit(riskLimit);

      return {
        success: result.success,
        data: result.data,
        error: result.error,
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
   * 리스크 한도 대비 현재 상태 평가
   */
  async evaluateRiskStatus(
    userId: string,
    portfolioId: string,
    currentMetrics: IRiskMetrics
  ): Promise<IResult<IRiskAlert[]>> {
    const startTime = Date.now();
    const alerts: IRiskAlert[] = [];

    try {
      // 리스크 한도 조회
      const limitResult = await this.riskRepo.getLimit(userId, portfolioId);
      if (!limitResult.success || !limitResult.data) {
        return {
          success: true,
          data: [],
          metadata: {
            timestamp: new Date().toISOString(),
            duration_ms: Date.now() - startTime,
          },
        };
      }

      const limits = limitResult.data;
      const now = new Date().toISOString();

      // VaR 한도 체크
      if (currentMetrics.var95_1d.percentage > limits.varLimit) {
        alerts.push(this.createAlert(
          userId,
          portfolioId,
          'var_breach',
          currentMetrics.var95_1d.percentage,
          limits.varLimit,
          now
        ));
      }

      // 드로다운 한도 체크
      if (currentMetrics.drawdown.currentDrawdown > limits.maxDrawdownLimit) {
        alerts.push(this.createAlert(
          userId,
          portfolioId,
          'drawdown_warning',
          currentMetrics.drawdown.currentDrawdown,
          limits.maxDrawdownLimit,
          now
        ));
      }

      // 집중도 체크 (HHI > 5000은 높은 집중도)
      if (currentMetrics.hhi > 5000) {
        alerts.push(this.createAlert(
          userId,
          portfolioId,
          'correlation_risk',
          currentMetrics.hhi / 100,
          50, // 50% 임계값
          now
        ));
      }

      // 알림 저장
      if (this.config.autoAlertEnabled) {
        for (const alert of alerts) {
          await this.riskRepo.saveAlert(alert);
          this.config.onAlert(alert);
        }
      }

      return {
        success: true,
        data: alerts,
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        data: [],
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 포지션 사이징 권고
  // ═══════════════════════════════════════════════════════════════

  /**
   * 포지션 사이즈 권고
   */
  getPositionSizeRecommendation(
    symbol: string,
    portfolioValue: number,
    expectedVolatility: number,
    stopLossPercent: number,
    riskTolerance: number = 2,
    winRate: number = 0.5,
    avgWinLoss: number = 1.5
  ): IPositionSizeRecommendation {
    const recommendation = recommendPositionSize(
      portfolioValue,
      expectedVolatility,
      stopLossPercent,
      riskTolerance,
      winRate,
      avgWinLoss
    );

    return {
      ...recommendation,
      symbol,
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // 알림 관리
  // ═══════════════════════════════════════════════════════════════

  /**
   * 사용자 알림 조회
   */
  async getAlerts(
    userId: string,
    options?: {
      portfolioId?: string;
      isRead?: boolean;
      isResolved?: boolean;
      level?: RiskLevel;
    }
  ): Promise<IResult<IRiskAlert[]>> {
    const result = await this.riskRepo.getAlerts(userId, options);

    return {
      success: result.success,
      data: result.data,
      error: result.error,
      metadata: result.metadata,
    };
  }

  /**
   * 알림 읽음 처리
   */
  async markAlertAsRead(alertId: string): Promise<IResult<boolean>> {
    return await this.riskRepo.markAlertAsRead(alertId);
  }

  /**
   * 알림 해결 처리
   */
  async resolveAlert(alertId: string): Promise<IResult<boolean>> {
    return await this.riskRepo.resolveAlert(alertId);
  }

  // ═══════════════════════════════════════════════════════════════
  // 리스크 리포트
  // ═══════════════════════════════════════════════════════════════

  /**
   * 리스크 요약 리포트 생성
   */
  async generateRiskReport(
    portfolioId: string
  ): Promise<IResult<{
    metrics: IRiskMetrics | null;
    summary: string;
    recommendations: string[];
  }>> {
    const startTime = Date.now();

    try {
      const metricsResult = await this.riskRepo.getLatestMetrics(portfolioId);

      if (!metricsResult.success || !metricsResult.data) {
        return {
          success: true,
          data: {
            metrics: null,
            summary: '리스크 데이터가 없습니다.',
            recommendations: ['포트폴리오를 동기화하여 리스크 분석을 시작하세요.'],
          },
          metadata: {
            timestamp: new Date().toISOString(),
            duration_ms: Date.now() - startTime,
          },
        };
      }

      const metrics = metricsResult.data;
      const summary = this.generateSummary(metrics);
      const recommendations = this.generateRecommendations(metrics);

      return {
        success: true,
        data: {
          metrics,
          summary,
          recommendations,
        },
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

  // ═══════════════════════════════════════════════════════════════
  // Private 헬퍼 메서드
  // ═══════════════════════════════════════════════════════════════

  private reconstructEquityCurve(dailyReturns: number[], currentValue: number): number[] {
    if (dailyReturns.length === 0) return [currentValue];

    // 역순으로 계산 (현재 가치에서 과거로)
    const values: number[] = new Array(dailyReturns.length + 1);
    values[dailyReturns.length] = currentValue;

    for (let i = dailyReturns.length - 1; i >= 0; i--) {
      values[i] = values[i + 1] / (1 + dailyReturns[i]);
    }

    return values;
  }

  private generateTimestamps(count: number): string[] {
    const timestamps: string[] = [];
    const now = new Date();

    for (let i = count; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      timestamps.push(date.toISOString());
    }

    return timestamps;
  }

  private createAlert(
    userId: string,
    portfolioId: string,
    type: IRiskAlert['type'],
    currentValue: number,
    limitValue: number,
    createdAt: string
  ): IRiskAlert {
    const breachPercent = ((currentValue - limitValue) / limitValue) * 100;
    const level = this.getAlertLevel(breachPercent);

    const titles: Record<IRiskAlert['type'], string> = {
      var_breach: 'VaR 한도 초과',
      drawdown_warning: '드로다운 경고',
      loss_limit: '손실 한도 초과',
      position_size: '포지션 사이즈 초과',
      leverage_warning: '레버리지 경고',
      correlation_risk: '집중도 리스크',
    };

    const messages: Record<IRiskAlert['type'], string> = {
      var_breach: `VaR(95%)가 ${currentValue.toFixed(2)}%로 한도(${limitValue}%)를 초과했습니다.`,
      drawdown_warning: `현재 드로다운이 ${currentValue.toFixed(2)}%로 한도(${limitValue}%)를 초과했습니다.`,
      loss_limit: `손실이 ${currentValue.toFixed(2)}%로 한도(${limitValue}%)를 초과했습니다.`,
      position_size: `포지션 비중이 ${currentValue.toFixed(2)}%로 한도(${limitValue}%)를 초과했습니다.`,
      leverage_warning: `레버리지가 ${currentValue.toFixed(2)}x로 한도(${limitValue}x)를 초과했습니다.`,
      correlation_risk: `포트폴리오 집중도(HHI)가 ${currentValue.toFixed(0)}으로 높습니다.`,
    };

    return {
      id: crypto.randomUUID(),
      userId,
      portfolioId,
      type,
      level,
      title: titles[type],
      message: messages[type],
      currentValue,
      limitValue,
      breachPercent,
      isRead: false,
      isResolved: false,
      createdAt,
    };
  }

  private getAlertLevel(breachPercent: number): RiskLevel {
    if (breachPercent <= 10) return 'low';
    if (breachPercent <= 25) return 'moderate';
    if (breachPercent <= 50) return 'high';
    return 'extreme';
  }

  private generateSummary(metrics: IRiskMetrics): string {
    const riskDescriptions: Record<RiskLevel, string> = {
      minimal: '매우 낮은 리스크 상태입니다.',
      low: '낮은 리스크 상태입니다.',
      moderate: '보통 수준의 리스크 상태입니다.',
      high: '높은 리스크 상태입니다. 주의가 필요합니다.',
      extreme: '매우 높은 리스크 상태입니다. 즉시 조치가 필요합니다.',
    };

    return `
리스크 점수: ${metrics.riskScore}/100 (${metrics.overallRiskLevel})
${riskDescriptions[metrics.overallRiskLevel]}

주요 지표:
- VaR(95%, 1일): ${metrics.var95_1d.percentage.toFixed(2)}%
- 최대 드로다운: ${metrics.drawdown.maxDrawdown.toFixed(2)}%
- 연환산 변동성: ${metrics.annualizedVolatility.toFixed(2)}%
- 샤프 비율: ${metrics.sharpeRatio.toFixed(2)}
- 집중도(HHI): ${metrics.hhi.toFixed(0)}
    `.trim();
  }

  private generateRecommendations(metrics: IRiskMetrics): string[] {
    const recommendations: string[] = [];

    // VaR 기반 권고
    if (metrics.var95_1d.percentage > 5) {
      recommendations.push('VaR가 높습니다. 포지션 축소를 고려하세요.');
    }

    // 드로다운 기반 권고
    if (metrics.drawdown.currentDrawdown > 15) {
      recommendations.push('드로다운이 상당합니다. 리스크 관리 전략을 재검토하세요.');
    }

    // 변동성 기반 권고
    if (metrics.annualizedVolatility > 40) {
      recommendations.push('변동성이 높습니다. 안정적인 자산 비중 확대를 고려하세요.');
    }

    // 집중도 기반 권고
    if (metrics.hhi > 5000) {
      recommendations.push('포트폴리오가 집중되어 있습니다. 분산 투자를 고려하세요.');
    }

    // 샤프 비율 기반 권고
    if (metrics.sharpeRatio < 0.5) {
      recommendations.push('리스크 대비 수익률이 낮습니다. 전략 검토가 필요합니다.');
    }

    if (recommendations.length === 0) {
      recommendations.push('현재 리스크 수준이 양호합니다. 현 전략을 유지하세요.');
    }

    // 면책조항 추가
    recommendations.push(
      '※ 위 권고사항은 참고용이며, 투자 결정은 본인 책임입니다.'
    );

    return recommendations;
  }
}

/**
 * 리스크 에이전트 인스턴스 생성
 */
export function createRiskAgent(
  riskRepo: IRiskRepository,
  portfolioRepo: IPortfolioRepository,
  config?: IRiskAgentConfig
): RiskAgent {
  return new RiskAgent(riskRepo, portfolioRepo, config);
}

/**
 * @forge/core - Risk Repository
 * L2 (Cells) - 리스크 데이터 저장소
 */

import type { HephaitosTypes, IResult, IPaginatedResult, IPagination } from '@forge/types';

type IRiskMetrics = HephaitosTypes.IRiskMetrics;
type IRiskLimit = HephaitosTypes.IRiskLimit;
type IRiskAlert = HephaitosTypes.IRiskAlert;
type RiskLevel = HephaitosTypes.RiskLevel;

/**
 * 리스크 저장소 인터페이스
 */
export interface IRiskRepository {
  // ═══════════════════════════════════════════════════════════════
  // 리스크 지표
  // ═══════════════════════════════════════════════════════════════

  /** 리스크 지표 저장 */
  saveMetrics(metrics: IRiskMetrics): Promise<IResult<IRiskMetrics>>;

  /** 최신 리스크 지표 조회 */
  getLatestMetrics(portfolioId: string): Promise<IResult<IRiskMetrics | null>>;

  /** 리스크 지표 이력 조회 */
  getMetricsHistory(
    portfolioId: string,
    startDate?: Date,
    endDate?: Date,
    pagination?: Partial<IPagination>
  ): Promise<IPaginatedResult<IRiskMetrics>>;

  // ═══════════════════════════════════════════════════════════════
  // 리스크 한도
  // ═══════════════════════════════════════════════════════════════

  /** 리스크 한도 저장 */
  saveLimit(limit: IRiskLimit): Promise<IResult<IRiskLimit>>;

  /** 사용자 리스크 한도 조회 */
  getLimit(userId: string, portfolioId?: string): Promise<IResult<IRiskLimit | null>>;

  /** 리스크 한도 업데이트 */
  updateLimit(limitId: string, updates: Partial<IRiskLimit>): Promise<IResult<IRiskLimit>>;

  /** 리스크 한도 삭제 */
  deleteLimit(limitId: string): Promise<IResult<boolean>>;

  // ═══════════════════════════════════════════════════════════════
  // 리스크 알림
  // ═══════════════════════════════════════════════════════════════

  /** 알림 저장 */
  saveAlert(alert: IRiskAlert): Promise<IResult<IRiskAlert>>;

  /** 사용자 알림 목록 조회 */
  getAlerts(
    userId: string,
    options?: {
      portfolioId?: string;
      isRead?: boolean;
      isResolved?: boolean;
      level?: RiskLevel;
    },
    pagination?: Partial<IPagination>
  ): Promise<IPaginatedResult<IRiskAlert>>;

  /** 알림 읽음 처리 */
  markAlertAsRead(alertId: string): Promise<IResult<boolean>>;

  /** 알림 해결 처리 */
  resolveAlert(alertId: string): Promise<IResult<boolean>>;

  /** 모든 알림 읽음 처리 */
  markAllAlertsAsRead(userId: string): Promise<IResult<number>>;

  /** 해결된 알림 삭제 */
  deleteResolvedAlerts(userId: string, olderThan?: Date): Promise<IResult<number>>;
}

/**
 * 리스크 저장소 구현 (In-Memory - 개발용)
 */
export class InMemoryRiskRepository implements IRiskRepository {
  private metricsHistory: Map<string, IRiskMetrics[]> = new Map();
  private limits: Map<string, IRiskLimit> = new Map();
  private alerts: Map<string, IRiskAlert> = new Map();

  // ═══════════════════════════════════════════════════════════════
  // 리스크 지표
  // ═══════════════════════════════════════════════════════════════

  async saveMetrics(metrics: IRiskMetrics): Promise<IResult<IRiskMetrics>> {
    const startTime = Date.now();

    try {
      const history = this.metricsHistory.get(metrics.portfolioId) ?? [];
      history.push({ ...metrics });

      // 최대 365일치만 보관
      if (history.length > 365) {
        history.splice(0, history.length - 365);
      }

      this.metricsHistory.set(metrics.portfolioId, history);

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

  async getLatestMetrics(portfolioId: string): Promise<IResult<IRiskMetrics | null>> {
    const startTime = Date.now();

    try {
      const history = this.metricsHistory.get(portfolioId) ?? [];
      const latest = history.length > 0 ? history[history.length - 1] : null;

      return {
        success: true,
        data: latest ? { ...latest } : null,
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

  async getMetricsHistory(
    portfolioId: string,
    startDate?: Date,
    endDate?: Date,
    pagination?: Partial<IPagination>
  ): Promise<IPaginatedResult<IRiskMetrics>> {
    const startTime = Date.now();
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 30;

    try {
      let history = this.metricsHistory.get(portfolioId) ?? [];

      // 날짜 필터링
      if (startDate) {
        history = history.filter(
          (m) => new Date(m.calculatedAt) >= startDate
        );
      }
      if (endDate) {
        history = history.filter(
          (m) => new Date(m.calculatedAt) <= endDate
        );
      }

      // 시간순 정렬 (최신 먼저)
      history.sort(
        (a, b) => new Date(b.calculatedAt).getTime() - new Date(a.calculatedAt).getTime()
      );

      const total = history.length;
      const offset = (page - 1) * limit;
      const paged = history.slice(offset, offset + limit);

      return {
        success: true,
        data: paged.map((m) => ({ ...m })),
        pagination: {
          page,
          limit,
          total,
          hasMore: offset + limit < total,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error : new Error(String(error)),
        pagination: { page, limit, total: 0, hasMore: false },
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 리스크 한도
  // ═══════════════════════════════════════════════════════════════

  async saveLimit(limit: IRiskLimit): Promise<IResult<IRiskLimit>> {
    const startTime = Date.now();

    try {
      this.limits.set(limit.id, { ...limit });

      return {
        success: true,
        data: limit,
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

  async getLimit(userId: string, portfolioId?: string): Promise<IResult<IRiskLimit | null>> {
    const startTime = Date.now();

    try {
      // 포트폴리오별 한도 우선, 없으면 사용자 전체 한도
      let limit = Array.from(this.limits.values()).find(
        (l) => l.userId === userId && l.portfolioId === portfolioId
      );

      if (!limit && portfolioId) {
        limit = Array.from(this.limits.values()).find(
          (l) => l.userId === userId && !l.portfolioId
        );
      }

      return {
        success: true,
        data: limit ? { ...limit } : null,
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

  async updateLimit(limitId: string, updates: Partial<IRiskLimit>): Promise<IResult<IRiskLimit>> {
    const startTime = Date.now();

    try {
      const existing = this.limits.get(limitId);

      if (!existing) {
        return {
          success: false,
          error: new Error(`Risk limit not found: ${limitId}`),
          metadata: {
            timestamp: new Date().toISOString(),
            duration_ms: Date.now() - startTime,
          },
        };
      }

      const updated: IRiskLimit = {
        ...existing,
        ...updates,
        id: existing.id, // ID 변경 방지
        userId: existing.userId, // 사용자 변경 방지
        updatedAt: new Date().toISOString(),
      };

      this.limits.set(limitId, updated);

      return {
        success: true,
        data: updated,
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

  async deleteLimit(limitId: string): Promise<IResult<boolean>> {
    const startTime = Date.now();

    try {
      const deleted = this.limits.delete(limitId);

      return {
        success: true,
        data: deleted,
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
  // 리스크 알림
  // ═══════════════════════════════════════════════════════════════

  async saveAlert(alert: IRiskAlert): Promise<IResult<IRiskAlert>> {
    const startTime = Date.now();

    try {
      this.alerts.set(alert.id, { ...alert });

      return {
        success: true,
        data: alert,
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

  async getAlerts(
    userId: string,
    options?: {
      portfolioId?: string;
      isRead?: boolean;
      isResolved?: boolean;
      level?: RiskLevel;
    },
    pagination?: Partial<IPagination>
  ): Promise<IPaginatedResult<IRiskAlert>> {
    const startTime = Date.now();
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;

    try {
      let alerts = Array.from(this.alerts.values()).filter(
        (a) => a.userId === userId
      );

      // 필터 적용
      if (options?.portfolioId !== undefined) {
        alerts = alerts.filter((a) => a.portfolioId === options.portfolioId);
      }
      if (options?.isRead !== undefined) {
        alerts = alerts.filter((a) => a.isRead === options.isRead);
      }
      if (options?.isResolved !== undefined) {
        alerts = alerts.filter((a) => a.isResolved === options.isResolved);
      }
      if (options?.level !== undefined) {
        alerts = alerts.filter((a) => a.level === options.level);
      }

      // 시간순 정렬 (최신 먼저)
      alerts.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      const total = alerts.length;
      const offset = (page - 1) * limit;
      const paged = alerts.slice(offset, offset + limit);

      return {
        success: true,
        data: paged.map((a) => ({ ...a })),
        pagination: {
          page,
          limit,
          total,
          hasMore: offset + limit < total,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error : new Error(String(error)),
        pagination: { page, limit, total: 0, hasMore: false },
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    }
  }

  async markAlertAsRead(alertId: string): Promise<IResult<boolean>> {
    const startTime = Date.now();

    try {
      const alert = this.alerts.get(alertId);

      if (!alert) {
        return {
          success: false,
          error: new Error(`Alert not found: ${alertId}`),
          metadata: {
            timestamp: new Date().toISOString(),
            duration_ms: Date.now() - startTime,
          },
        };
      }

      alert.isRead = true;
      this.alerts.set(alertId, alert);

      return {
        success: true,
        data: true,
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

  async resolveAlert(alertId: string): Promise<IResult<boolean>> {
    const startTime = Date.now();

    try {
      const alert = this.alerts.get(alertId);

      if (!alert) {
        return {
          success: false,
          error: new Error(`Alert not found: ${alertId}`),
          metadata: {
            timestamp: new Date().toISOString(),
            duration_ms: Date.now() - startTime,
          },
        };
      }

      alert.isResolved = true;
      alert.resolvedAt = new Date().toISOString();
      this.alerts.set(alertId, alert);

      return {
        success: true,
        data: true,
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

  async markAllAlertsAsRead(userId: string): Promise<IResult<number>> {
    const startTime = Date.now();

    try {
      let count = 0;

      for (const [id, alert] of this.alerts) {
        if (alert.userId === userId && !alert.isRead) {
          alert.isRead = true;
          this.alerts.set(id, alert);
          count++;
        }
      }

      return {
        success: true,
        data: count,
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

  async deleteResolvedAlerts(userId: string, olderThan?: Date): Promise<IResult<number>> {
    const startTime = Date.now();

    try {
      let count = 0;
      const cutoff = olderThan ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 기본 30일

      for (const [id, alert] of this.alerts) {
        if (
          alert.userId === userId &&
          alert.isResolved &&
          new Date(alert.resolvedAt!) < cutoff
        ) {
          this.alerts.delete(id);
          count++;
        }
      }

      return {
        success: true,
        data: count,
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
}

/**
 * 리스크 저장소 인스턴스 생성
 */
export function createRiskRepository(
  type: 'memory' | 'supabase' = 'memory'
): IRiskRepository {
  switch (type) {
    case 'memory':
      return new InMemoryRiskRepository();
    case 'supabase':
      // TODO: Supabase 구현
      throw new Error('Supabase risk repository not implemented yet');
    default:
      throw new Error(`Unknown repository type: ${type}`);
  }
}

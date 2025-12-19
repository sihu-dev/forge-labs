/**
 * @forge/core - Feedback Repository
 * L2 (Cells) - 학습 피드백 저장소
 *
 * 자가개선 성장 루프의 LEARN 단계 데이터 저장
 * 경험과 패턴을 저장하여 모델 개선에 활용
 */

import type { DryonTypes, IResult, IPaginatedResult, IPagination, Timestamp } from '@forge/types';
import { updateConfidence } from '@forge/utils';

type ILearningExperience = DryonTypes.ILearningExperience;
type ILearningPattern = DryonTypes.ILearningPattern;
type ILearningFeedback = DryonTypes.ILearningFeedback;
type IPatternConditions = DryonTypes.IPatternConditions;
type IModelState = DryonTypes.IModelState;

/**
 * 피드백 저장소 인터페이스
 */
export interface IFeedbackRepository {
  // 경험 (Experience) 관리
  saveExperience(experience: ILearningExperience): Promise<IResult<ILearningExperience>>;
  getExperience(id: string): Promise<IResult<ILearningExperience | null>>;
  getRecentExperiences(limit: number): Promise<IResult<ILearningExperience[]>>;
  getExperiencesByReward(minReward: number, maxReward?: number): Promise<IResult<ILearningExperience[]>>;

  // 패턴 (Pattern) 관리
  savePattern(pattern: ILearningPattern): Promise<IResult<ILearningPattern>>;
  getPattern(id: string): Promise<IResult<ILearningPattern | null>>;
  getActivePatterns(): Promise<IResult<ILearningPattern[]>>;
  findMatchingPatterns(conditions: Partial<IPatternConditions>): Promise<IResult<ILearningPattern[]>>;
  updatePatternStats(patternId: string, success: boolean, reward: number): Promise<IResult<ILearningPattern>>;

  // 피드백 관리
  saveFeedback(feedback: ILearningFeedback): Promise<IResult<ILearningFeedback>>;
  getFeedbacksByExperience(experienceId: string): Promise<IResult<ILearningFeedback[]>>;

  // 모델 상태
  getModelState(): Promise<IResult<IModelState>>;
}

/**
 * 피드백 저장소 구현 (In-Memory)
 */
export class InMemoryFeedbackRepository implements IFeedbackRepository {
  private experiences: Map<string, ILearningExperience> = new Map();
  private patterns: Map<string, ILearningPattern> = new Map();
  private feedbacks: Map<string, ILearningFeedback[]> = new Map();

  async saveExperience(experience: ILearningExperience): Promise<IResult<ILearningExperience>> {
    const startTime = Date.now();

    try {
      this.experiences.set(experience.id, { ...experience });

      return {
        success: true,
        data: experience,
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

  async getExperience(id: string): Promise<IResult<ILearningExperience | null>> {
    const startTime = Date.now();

    return {
      success: true,
      data: this.experiences.get(id) ?? null,
      metadata: {
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      },
    };
  }

  async getRecentExperiences(limit: number): Promise<IResult<ILearningExperience[]>> {
    const startTime = Date.now();

    const sorted = Array.from(this.experiences.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
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

  async getExperiencesByReward(
    minReward: number,
    maxReward?: number
  ): Promise<IResult<ILearningExperience[]>> {
    const startTime = Date.now();

    const filtered = Array.from(this.experiences.values()).filter((exp) => {
      if (exp.reward < minReward) return false;
      if (maxReward !== undefined && exp.reward > maxReward) return false;
      return true;
    });

    return {
      success: true,
      data: filtered,
      metadata: {
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      },
    };
  }

  async savePattern(pattern: ILearningPattern): Promise<IResult<ILearningPattern>> {
    const startTime = Date.now();

    try {
      this.patterns.set(pattern.id, { ...pattern });

      return {
        success: true,
        data: pattern,
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

  async getPattern(id: string): Promise<IResult<ILearningPattern | null>> {
    const startTime = Date.now();

    return {
      success: true,
      data: this.patterns.get(id) ?? null,
      metadata: {
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      },
    };
  }

  async getActivePatterns(): Promise<IResult<ILearningPattern[]>> {
    const startTime = Date.now();

    const active = Array.from(this.patterns.values())
      .filter((p) => p.isActive)
      .sort((a, b) => b.confidence - a.confidence);

    return {
      success: true,
      data: active,
      metadata: {
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      },
    };
  }

  async findMatchingPatterns(
    conditions: Partial<IPatternConditions>
  ): Promise<IResult<ILearningPattern[]>> {
    const startTime = Date.now();

    const matching = Array.from(this.patterns.values())
      .filter((pattern) => {
        if (!pattern.isActive) return false;
        return this.matchesConditions(pattern.conditions, conditions);
      })
      .sort((a, b) => b.confidence - a.confidence);

    return {
      success: true,
      data: matching,
      metadata: {
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      },
    };
  }

  async updatePatternStats(
    patternId: string,
    success: boolean,
    reward: number
  ): Promise<IResult<ILearningPattern>> {
    const startTime = Date.now();

    try {
      const pattern = this.patterns.get(patternId);
      if (!pattern) {
        return {
          success: false,
          error: new Error(`Pattern not found: ${patternId}`),
          metadata: {
            timestamp: new Date().toISOString(),
            duration_ms: Date.now() - startTime,
          },
        };
      }

      // 통계 업데이트
      const newStats = {
        ...pattern.stats,
        totalApplications: pattern.stats.totalApplications + 1,
        successCount: pattern.stats.successCount + (success ? 1 : 0),
        failureCount: pattern.stats.failureCount + (success ? 0 : 1),
        successRate:
          (pattern.stats.successCount + (success ? 1 : 0)) /
          (pattern.stats.totalApplications + 1),
        avgReward:
          (pattern.stats.avgReward * pattern.stats.totalApplications + reward) /
          (pattern.stats.totalApplications + 1),
      };

      // 신뢰도 업데이트
      const newConfidence = updateConfidence(pattern.confidence, reward);

      const updated: ILearningPattern = {
        ...pattern,
        stats: newStats,
        confidence: newConfidence,
        updatedAt: new Date().toISOString(),
      };

      this.patterns.set(patternId, updated);

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

  async saveFeedback(feedback: ILearningFeedback): Promise<IResult<ILearningFeedback>> {
    const startTime = Date.now();

    try {
      const existing = this.feedbacks.get(feedback.experienceId) ?? [];
      existing.push(feedback);
      this.feedbacks.set(feedback.experienceId, existing);

      return {
        success: true,
        data: feedback,
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

  async getFeedbacksByExperience(experienceId: string): Promise<IResult<ILearningFeedback[]>> {
    const startTime = Date.now();

    return {
      success: true,
      data: this.feedbacks.get(experienceId) ?? [],
      metadata: {
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      },
    };
  }

  async getModelState(): Promise<IResult<IModelState>> {
    const startTime = Date.now();

    const activePatterns = Array.from(this.patterns.values()).filter((p) => p.isActive);
    const avgAccuracy =
      activePatterns.length > 0
        ? activePatterns.reduce((sum, p) => sum + p.stats.successRate, 0) / activePatterns.length
        : 0;

    const state: IModelState = {
      version: '1.0.0',
      lastUpdatedAt: new Date().toISOString(),
      totalExperiences: this.experiences.size,
      activePatterns: activePatterns.length,
      avgPredictionAccuracy: avgAccuracy,
      performanceTrend: this.calculateTrend(),
    };

    return {
      success: true,
      data: state,
      metadata: {
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      },
    };
  }

  private matchesConditions(
    patternConditions: IPatternConditions,
    queryConditions: Partial<IPatternConditions>
  ): boolean {
    if (queryConditions.temperatureRange && patternConditions.temperatureRange) {
      // 범위가 겹치는지 확인
      const overlap =
        queryConditions.temperatureRange.max >= patternConditions.temperatureRange.min &&
        queryConditions.temperatureRange.min <= patternConditions.temperatureRange.max;
      if (!overlap) return false;
    }

    if (queryConditions.humidityRange && patternConditions.humidityRange) {
      const overlap =
        queryConditions.humidityRange.max >= patternConditions.humidityRange.min &&
        queryConditions.humidityRange.min <= patternConditions.humidityRange.max;
      if (!overlap) return false;
    }

    return true;
  }

  private calculateTrend(): 'improving' | 'stable' | 'declining' {
    // 최근 경험들의 보상 추이 분석
    const recent = Array.from(this.experiences.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20);

    if (recent.length < 10) return 'stable';

    const firstHalf = recent.slice(10);
    const secondHalf = recent.slice(0, 10);

    const firstAvg = firstHalf.reduce((sum, e) => sum + e.reward, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, e) => sum + e.reward, 0) / secondHalf.length;

    if (secondAvg > firstAvg + 0.05) return 'improving';
    if (secondAvg < firstAvg - 0.05) return 'declining';
    return 'stable';
  }
}

/**
 * 피드백 저장소 생성
 */
export function createFeedbackRepository(
  type: 'memory' | 'supabase' = 'memory'
): IFeedbackRepository {
  switch (type) {
    case 'memory':
      return new InMemoryFeedbackRepository();
    case 'supabase':
      throw new Error('Supabase repository not implemented');
    default:
      throw new Error(`Unknown repository type: ${type}`);
  }
}

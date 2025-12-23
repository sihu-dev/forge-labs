/**
 * 공고 적합도 분석 엔진
 */

import { claudeAgent } from '../agents/claude-agent.js';
import type { Program, AnalyzedProgram } from '../types/index.js';
import { log } from '../utils/logger.js';
import { config } from '../config/index.js';
import pRetry from 'p-retry';

export class ProgramAnalyzer {
  private minScoreThreshold: number;

  constructor() {
    this.minScoreThreshold = config.minScoreThreshold;
    log.info(
      `ProgramAnalyzer initialized (min score: ${this.minScoreThreshold})`
    );
  }

  /**
   * 여러 공고 분석 (배치 처리)
   */
  async analyzePrograms(programs: Program[]): Promise<AnalyzedProgram[]> {
    log.info(`Analyzing ${programs.length} programs`);

    const analyzed: AnalyzedProgram[] = [];

    for (const program of programs) {
      try {
        const result = await this.analyzeWithRetry(program);

        if (result.analysis.score >= this.minScoreThreshold) {
          analyzed.push(result);
          log.info(
            `✓ ${program.title}: ${result.analysis.score}점 (${result.analysis.recommendation})`
          );
        } else {
          log.debug(
            `✗ ${program.title}: ${result.analysis.score}점 (기준 미달)`
          );
        }

        // Rate limiting 방지 (1초 대기)
        await this.delay(1000);
      } catch (error) {
        log.error(`Failed to analyze program: ${program.title}`, error);
      }
    }

    log.info(
      `Analysis complete: ${analyzed.length}/${programs.length} programs passed threshold`
    );

    return analyzed;
  }

  /**
   * 단일 공고 분석 (재시도 포함)
   */
  private async analyzeWithRetry(program: Program): Promise<AnalyzedProgram> {
    return pRetry(
      async () => {
        const analysis = await claudeAgent.analyzeProgram(program);

        return {
          ...program,
          analysis,
          analyzedAt: new Date().toISOString(),
        };
      },
      {
        retries: 3,
        minTimeout: 1000,
        maxTimeout: 5000,
        onFailedAttempt: (error) => {
          log.warn(
            `Retry ${error.attemptNumber}/${error.retriesLeft} for ${program.title}`,
            error
          );
        },
      }
    );
  }

  /**
   * 우선순위별 정렬
   */
  sortByPriority(programs: AnalyzedProgram[]): AnalyzedProgram[] {
    const priorityOrder = { HIGH: 1, MEDIUM: 2, LOW: 3 };

    return programs.sort((a, b) => {
      // 우선순위 먼저 비교
      const aPriority = priorityOrder[a.analysis.priority] || 4;
      const bPriority = priorityOrder[b.analysis.priority] || 4;

      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      // 우선순위 같으면 점수로 비교
      return b.analysis.score - a.analysis.score;
    });
  }

  /**
   * 마감일 임박 순으로 정렬
   */
  sortByDeadline(programs: AnalyzedProgram[]): AnalyzedProgram[] {
    return programs.sort((a, b) => {
      const dateA = new Date(a.deadline).getTime();
      const dateB = new Date(b.deadline).getTime();
      return dateA - dateB;
    });
  }

  /**
   * 지연 헬퍼
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const programAnalyzer = new ProgramAnalyzer();

/**
 * 통합 알림 매니저
 * Email과 Slack 알림을 통합 관리
 */

import { EmailNotifier, type EmailConfig } from './email-notifier.js';
import { SlackNotifier, type SlackConfig } from './slack-notifier.js';
import { log } from '../../utils/logger.js';
import type { AnalyzedProgram } from '../../types/index.js';

export interface NotificationConfig {
  email: EmailConfig;
  slack: SlackConfig;
  minScoreThreshold?: number;
}

export class NotificationManager {
  private emailNotifier: EmailNotifier;
  private slackNotifier: SlackNotifier;
  private minScoreThreshold: number;

  constructor(config: NotificationConfig) {
    this.emailNotifier = new EmailNotifier(config.email);
    this.slackNotifier = new SlackNotifier(config.slack);
    this.minScoreThreshold = config.minScoreThreshold || 7;

    log.info(
      `📢 Notification Manager initialized (minScore: ${this.minScoreThreshold})`
    );
  }

  /**
   * 새로운 공고 알림 발송 (Email + Slack)
   */
  async notifyNewPrograms(programs: AnalyzedProgram[]): Promise<void> {
    // 최소 점수 이상인 공고만 필터링
    const filteredPrograms = programs.filter(
      (p) => p.analysis.score >= this.minScoreThreshold
    );

    if (filteredPrograms.length === 0) {
      log.info(
        `No programs to notify (all below threshold ${this.minScoreThreshold})`
      );
      return;
    }

    log.info(
      `📢 Sending notifications for ${filteredPrograms.length}/${programs.length} programs (score ≥${this.minScoreThreshold})`
    );

    const results = await Promise.allSettled([
      this.emailNotifier.sendNewProgramsNotification(filteredPrograms),
      this.slackNotifier.sendNewProgramsNotification(filteredPrograms),
    ]);

    // 결과 로깅
    results.forEach((result, index) => {
      const channel = index === 0 ? 'Email' : 'Slack';
      if (result.status === 'fulfilled') {
        log.info(`✅ ${channel} notification sent successfully`);
      } else {
        log.error(`❌ ${channel} notification failed:`, result.reason);
      }
    });
  }

  /**
   * HIGH 우선순위 공고만 즉시 알림
   */
  async notifyUrgentPrograms(programs: AnalyzedProgram[]): Promise<void> {
    const urgentPrograms = programs.filter(
      (p) =>
        p.analysis.priority === 'HIGH' &&
        p.analysis.score >= this.minScoreThreshold
    );

    if (urgentPrograms.length === 0) {
      log.info('No urgent programs to notify');
      return;
    }

    log.info(
      `🚨 Sending urgent notifications for ${urgentPrograms.length} programs`
    );

    await this.notifyNewPrograms(urgentPrograms);
  }

  /**
   * 특정 점수 이상 공고만 알림
   */
  async notifyByScore(
    programs: AnalyzedProgram[],
    minScore: number
  ): Promise<void> {
    const filteredPrograms = programs.filter(
      (p) => p.analysis.score >= minScore
    );

    if (filteredPrograms.length === 0) {
      log.info(`No programs with score ≥${minScore}`);
      return;
    }

    log.info(
      `📢 Sending notifications for ${filteredPrograms.length} programs (score ≥${minScore})`
    );

    await Promise.allSettled([
      this.emailNotifier.sendNewProgramsNotification(filteredPrograms),
      this.slackNotifier.sendNewProgramsNotification(filteredPrograms),
    ]);
  }

  /**
   * 알림 시스템 연결 테스트
   */
  async testConnections(): Promise<{
    email: boolean;
    slack: boolean;
  }> {
    log.info('🧪 Testing notification connections...');

    const [emailResult, slackResult] = await Promise.allSettled([
      this.emailNotifier.testConnection(),
      this.slackNotifier.testConnection(),
    ]);

    const results = {
      email: emailResult.status === 'fulfilled' && emailResult.value,
      slack: slackResult.status === 'fulfilled' && slackResult.value,
    };

    log.info(
      `Test results: Email=${results.email ? '✅' : '❌'}, Slack=${results.slack ? '✅' : '❌'}`
    );

    return results;
  }

  /**
   * 일일 요약 알림
   */
  async sendDailySummary(
    totalCollected: number,
    analyzed: AnalyzedProgram[],
    recommended: AnalyzedProgram[]
  ): Promise<void> {
    const summary = {
      totalCollected,
      totalAnalyzed: analyzed.length,
      recommended: recommended.length,
      highPriority: analyzed.filter((p) => p.analysis.priority === 'HIGH')
        .length,
      averageScore:
        analyzed.reduce((sum, p) => sum + p.analysis.score, 0) /
          analyzed.length || 0,
    };

    log.info('📊 Sending daily summary', summary);

    // 요약 통계를 알림으로 전송
    if (recommended.length > 0) {
      await this.notifyNewPrograms(recommended);
    }
  }
}

/**
 * 환경변수에서 NotificationConfig 생성
 */
export function createNotificationConfigFromEnv(): NotificationConfig {
  return {
    email: {
      enabled: process.env.EMAIL_ENABLED === 'true',
      smtpHost: process.env.EMAIL_SMTP_HOST || 'smtp.gmail.com',
      smtpPort: parseInt(process.env.EMAIL_SMTP_PORT || '587', 10),
      smtpSecure: process.env.EMAIL_SMTP_SECURE === 'true',
      smtpUser: process.env.EMAIL_SMTP_USER || '',
      smtpPassword: process.env.EMAIL_SMTP_PASSWORD || '',
      from: process.env.EMAIL_FROM || 'noreply@example.com',
      to: process.env.EMAIL_TO || '',
    },
    slack: {
      enabled: process.env.SLACK_ENABLED === 'true',
      webhookUrl: process.env.SLACK_WEBHOOK_URL || '',
      channel: process.env.SLACK_CHANNEL || '#general',
    },
    minScoreThreshold: parseInt(process.env.MIN_SCORE_THRESHOLD || '7', 10),
  };
}

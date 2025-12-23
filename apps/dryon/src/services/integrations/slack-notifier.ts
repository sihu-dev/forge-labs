/**
 * Slack 알림 서비스
 */

import axios from 'axios';
import { config } from '../../config/index.js';
import { log } from '../../utils/logger.js';
import type { AnalyzedProgram } from '../../types/index.js';
import { format } from 'date-fns';

export class SlackNotifier {
  private webhookUrl: string;
  private channel: string;

  constructor() {
    this.webhookUrl = config.slack.webhookUrl;
    this.channel = config.slack.channel;
    log.info('SlackNotifier initialized');
  }

  /**
   * 분석 결과 알림
   */
  async notifyAnalysisResults(programs: AnalyzedProgram[]): Promise<void> {
    if (programs.length === 0) {
      await this.sendMessage('📭 오늘은 적합한 공고가 없습니다.');
      return;
    }

    const message = this.buildAnalysisMessage(programs);
    await this.sendMessage(message);
  }

  /**
   * 분석 메시지 생성
   */
  private buildAnalysisMessage(programs: AnalyzedProgram[]): string {
    const today = format(new Date(), 'yyyy-MM-dd');

    let message = `🎯 *${today} 정부지원사업 알림*\n\n`;
    message += `발견된 적합 공고: ${programs.length}건\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;

    for (const program of programs) {
      const { analysis } = program;

      message += `*${program.title}*\n`;
      message += `• 적합도: ${analysis.score}점 (${analysis.recommendation})\n`;
      message += `• 주관: ${program.organization}\n`;
      message += `• 마감: ${program.deadline}\n`;
      message += `• 우선순위: ${analysis.priority}\n`;
      message += `• 매칭이유: ${analysis.matchReasons.join(', ')}\n`;

      if (program.url) {
        message += `• <${program.url}|상세보기>\n`;
      }

      message += `\n`;
    }

    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `💡 ${config.minScoreThreshold}점 이상 공고만 알림됩니다.\n`;
    message += `📋 사업계획서 생성: Claude에게 "사업계획서 만들어줘" 요청`;

    return message;
  }

  /**
   * 에러 알림
   */
  async notifyError(errorMessage: string, error?: Error): Promise<void> {
    let message = `🚨 *시스템 오류 발생*\n\n`;
    message += `${errorMessage}\n\n`;

    if (error) {
      message += `\`\`\`\n${error.message}\n\`\`\``;
    }

    await this.sendMessage(message);
  }

  /**
   * 시스템 시작 알림
   */
  async notifySystemStart(): Promise<void> {
    const message = `✅ 정부지원사업 자동화 시스템이 시작되었습니다.\n스케줄: 매일 오전 8시`;
    await this.sendMessage(message);
  }

  /**
   * Slack 메시지 전송
   */
  private async sendMessage(text: string): Promise<void> {
    try {
      await axios.post(this.webhookUrl, {
        channel: this.channel,
        text,
        username: 'Hyein Agent',
        icon_emoji: ':robot_face:',
      });

      log.info('Slack notification sent successfully');
    } catch (error) {
      log.error('Failed to send Slack notification', error);
      throw error;
    }
  }

  /**
   * 마크다운 블록 형식으로 전송 (고급)
   */
  async sendRichMessage(programs: AnalyzedProgram[]): Promise<void> {
    if (programs.length === 0) {
      await this.sendMessage('📭 오늘은 적합한 공고가 없습니다.');
      return;
    }

    const blocks = this.buildRichBlocks(programs);

    try {
      await axios.post(this.webhookUrl, {
        channel: this.channel,
        blocks,
        username: 'Hyein Agent',
        icon_emoji: ':robot_face:',
      });

      log.info('Slack rich notification sent successfully');
    } catch (error) {
      log.error('Failed to send Slack rich notification', error);
      // 실패시 일반 메시지로 폴백
      await this.notifyAnalysisResults(programs);
    }
  }

  /**
   * Rich 블록 생성
   */
  private buildRichBlocks(programs: AnalyzedProgram[]): unknown[] {
    const today = format(new Date(), 'yyyy-MM-dd');

    const blocks: unknown[] = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `🎯 ${today} 정부지원사업 알림`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `발견된 적합 공고: *${programs.length}건*`,
        },
      },
      {
        type: 'divider',
      },
    ];

    for (const program of programs) {
      const { analysis } = program;

      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${program.title}*\n• 적합도: ${analysis.score}점 (${analysis.recommendation})\n• 주관: ${program.organization}\n• 마감: ${program.deadline}\n• 우선순위: ${analysis.priority}`,
        },
        accessory: program.url
          ? {
              type: 'button',
              text: {
                type: 'plain_text',
                text: '상세보기',
              },
              url: program.url,
            }
          : undefined,
      });
    }

    blocks.push({
      type: 'divider',
    });

    blocks.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `💡 ${config.minScoreThreshold}점 이상 공고만 알림됩니다.`,
        },
      ],
    });

    return blocks;
  }
}

export const slackNotifier = new SlackNotifier();

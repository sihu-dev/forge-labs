/**
 * Slack 알림 서비스
 * Incoming Webhook을 사용한 Slack 메시지 발송
 */

import axios from 'axios';
import { log } from '../../utils/logger.js';
import type { AnalyzedProgram } from '../../types/index.js';

export interface SlackConfig {
  enabled: boolean;
  webhookUrl: string;
  channel: string;
}

interface SlackBlock {
  type: string;
  text?: {
    type: string;
    text: string;
    emoji?: boolean;
  };
  fields?: Array<{
    type: string;
    text: string;
  }>;
  elements?: Array<{
    type: string;
    text?: string;
  }>;
  accessory?: unknown;
}

export class SlackNotifier {
  private config: SlackConfig;

  constructor(config: SlackConfig) {
    this.config = config;
  }

  /**
   * 새로운 공고 발견 시 Slack 알림 발송
   */
  async sendNewProgramsNotification(
    programs: AnalyzedProgram[]
  ): Promise<void> {
    if (!this.config.enabled) {
      log.warn('Slack notification is disabled');
      return;
    }

    if (programs.length === 0) {
      log.info('No programs to notify');
      return;
    }

    try {
      const blocks = this.generateSlackBlocks(programs);

      await axios.post(this.config.webhookUrl, {
        username: '정부지원사업 알림봇',
        icon_emoji: ':rocket:',
        blocks,
      });

      log.info(
        `✅ Slack notification sent successfully (${programs.length} programs)`
      );
    } catch (error) {
      log.error('Failed to send Slack notification', error);
      throw error;
    }
  }

  /**
   * Slack Block Kit 형식으로 메시지 생성
   */
  private generateSlackBlocks(programs: AnalyzedProgram[]): SlackBlock[] {
    const highPriority = programs.filter((p) => p.analysis.priority === 'HIGH');
    const recommended = programs.filter(
      (p) =>
        p.analysis.recommendation === '강력추천' ||
        p.analysis.recommendation === '추천'
    );

    // 헤더
    const blocks: SlackBlock[] = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `🎯 새로운 정부지원사업 공고 ${programs.length}건 발견!`,
          emoji: true,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*📊 전체 공고:*\n${programs.length}개`,
          },
          {
            type: 'mrkdwn',
            text: `*⭐ 추천 공고:*\n${recommended.length}개`,
          },
          {
            type: 'mrkdwn',
            text: `*🔴 긴급 (HIGH):*\n${highPriority.length}개`,
          },
          {
            type: 'mrkdwn',
            text: `*🕐 분석 일시:*\n${new Date().toLocaleString('ko-KR')}`,
          },
        ],
      },
      {
        type: 'divider',
      },
    ];

    // 각 공고를 점수 순으로 정렬하여 추가
    programs
      .sort((a, b) => b.analysis.score - a.analysis.score)
      .forEach((program, index) => {
        // 공고 제목 및 기본 정보
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${index + 1}. ${program.title}*\n${this.getRecommendationEmoji(program.analysis.recommendation)} ${program.analysis.recommendation} | ${this.getPriorityEmoji(program.analysis.priority)} ${program.analysis.priority} | ⭐ ${program.analysis.score}/10점`,
          },
        });

        // 상세 정보
        const fields: Array<{ type: string; text: string }> = [
          {
            type: 'mrkdwn',
            text: `*기관:*\n${program.organization}`,
          },
          {
            type: 'mrkdwn',
            text: `*마감일:*\n${new Date(program.deadline).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}`,
          },
        ];

        if (program.analysis.estimatedBudget) {
          fields.push({
            type: 'mrkdwn',
            text: `*예상 지원금:*\n${program.analysis.estimatedBudget}`,
          });
        }

        blocks.push({
          type: 'section',
          fields,
        });

        // 매칭 이유
        if (program.analysis.matchReasons.length > 0) {
          blocks.push({
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*✅ 매칭 이유:*\n${program.analysis.matchReasons.map((r) => `• ${r}`).join('\n')}`,
            },
          });
        }

        // 준비 팁
        if (program.analysis.preparationTips.length > 0) {
          blocks.push({
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*💡 준비 팁:*\n${program.analysis.preparationTips
                .slice(0, 3)
                .map((t) => `• ${t}`)
                .join('\n')}`,
            },
          });
        }

        // 상세보기 버튼
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `<${program.url}|🔗 공고 상세보기 →>`,
          },
        });

        // 구분선 (마지막 공고가 아닐 경우)
        if (index < programs.length - 1) {
          blocks.push({
            type: 'divider',
          });
        }
      });

    // 푸터
    blocks.push(
      {
        type: 'divider',
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: '🤖 AI 기반 정부지원사업 자동화 시스템 | ZZIK (찍) 프로젝트',
          },
        ],
      }
    );

    return blocks;
  }

  private getRecommendationEmoji(recommendation: string): string {
    switch (recommendation) {
      case '강력추천':
        return '🌟';
      case '추천':
        return '⭐';
      case '검토필요':
        return '🔍';
      case '부적합':
        return '❌';
      default:
        return '📌';
    }
  }

  private getPriorityEmoji(priority: string): string {
    switch (priority) {
      case 'HIGH':
        return '🔴';
      case 'MEDIUM':
        return '🟡';
      case 'LOW':
        return '🟢';
      default:
        return '⚪';
    }
  }

  /**
   * Slack 연결 테스트
   */
  async testConnection(): Promise<boolean> {
    if (!this.config.enabled) {
      log.error('Slack notification is disabled');
      return false;
    }

    try {
      await axios.post(this.config.webhookUrl, {
        username: '정부지원사업 알림봇',
        icon_emoji: ':white_check_mark:',
        text: '✅ Slack 알림 연결 테스트 성공!',
      });

      log.info('✅ Slack connection test successful');
      return true;
    } catch (error) {
      log.error('❌ Slack connection test failed', error);
      return false;
    }
  }
}

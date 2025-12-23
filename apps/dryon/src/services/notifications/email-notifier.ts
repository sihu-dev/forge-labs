/**
 * 이메일 알림 서비스
 * nodemailer를 사용한 SMTP 이메일 발송
 */

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { log } from '../../utils/logger.js';
import type { AnalyzedProgram } from '../../types/index.js';

export interface EmailConfig {
  enabled: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPassword: string;
  from: string;
  to: string;
}

export class EmailNotifier {
  private transporter: Transporter | null = null;
  private config: EmailConfig;

  constructor(config: EmailConfig) {
    this.config = config;

    if (config.enabled) {
      this.initializeTransporter();
    }
  }

  private initializeTransporter(): void {
    try {
      this.transporter = nodemailer.createTransport({
        host: this.config.smtpHost,
        port: this.config.smtpPort,
        secure: this.config.smtpSecure, // true for 465, false for other ports
        auth: {
          user: this.config.smtpUser,
          pass: this.config.smtpPassword,
        },
      });

      log.info('📧 Email transporter initialized');
    } catch (error) {
      log.error('Failed to initialize email transporter', error);
      this.transporter = null;
    }
  }

  /**
   * 새로운 공고 발견 시 이메일 알림 발송
   */
  async sendNewProgramsNotification(
    programs: AnalyzedProgram[]
  ): Promise<void> {
    if (!this.config.enabled || !this.transporter) {
      log.warn('Email notification is disabled or transporter not initialized');
      return;
    }

    if (programs.length === 0) {
      log.info('No programs to notify');
      return;
    }

    try {
      const subject = `🎯 새로운 정부지원사업 공고 ${programs.length}건 발견!`;
      const html = this.generateEmailHTML(programs);
      const text = this.generateEmailText(programs);

      await this.transporter.sendMail({
        from: this.config.from,
        to: this.config.to,
        subject,
        text,
        html,
      });

      log.info(
        `✅ Email sent successfully to ${this.config.to} (${programs.length} programs)`
      );
    } catch (error) {
      log.error('Failed to send email notification', error);
      throw error;
    }
  }

  /**
   * HTML 이메일 본문 생성
   */
  private generateEmailHTML(programs: AnalyzedProgram[]): string {
    const highPriority = programs.filter((p) => p.analysis.priority === 'HIGH');
    const recommended = programs.filter(
      (p) =>
        p.analysis.recommendation === '강력추천' ||
        p.analysis.recommendation === '추천'
    );

    const programsHTML = programs
      .sort((a, b) => b.analysis.score - a.analysis.score)
      .map(
        (program, index) => `
      <div style="border: 2px solid ${this.getPriorityColor(program.analysis.priority)}; border-radius: 8px; padding: 20px; margin-bottom: 20px; background-color: #f9f9f9;">
        <h3 style="color: #333; margin-top: 0;">
          ${index + 1}. ${program.title}
        </h3>

        <div style="display: flex; gap: 10px; margin: 10px 0;">
          <span style="background-color: ${this.getRecommendationColor(program.analysis.recommendation)}; color: white; padding: 5px 12px; border-radius: 4px; font-size: 12px; font-weight: bold;">
            ${program.analysis.recommendation}
          </span>
          <span style="background-color: ${this.getPriorityColor(program.analysis.priority)}; color: white; padding: 5px 12px; border-radius: 4px; font-size: 12px; font-weight: bold;">
            ${program.analysis.priority}
          </span>
          <span style="background-color: #4CAF50; color: white; padding: 5px 12px; border-radius: 4px; font-size: 12px; font-weight: bold;">
            ${program.analysis.score}/10점
          </span>
        </div>

        <p style="color: #666; margin: 10px 0;"><strong>기관:</strong> ${program.organization}</p>
        <p style="color: #666; margin: 10px 0;"><strong>마감일:</strong> ${new Date(program.deadline).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        ${program.analysis.estimatedBudget ? `<p style="color: #666; margin: 10px 0;"><strong>예상 지원금:</strong> ${program.analysis.estimatedBudget}</p>` : ''}

        <div style="margin-top: 15px;">
          <h4 style="color: #333; margin-bottom: 8px;">✅ 매칭 이유</h4>
          <ul style="color: #555; margin: 5px 0; padding-left: 20px;">
            ${program.analysis.matchReasons.map((reason) => `<li>${reason}</li>`).join('')}
          </ul>
        </div>

        ${
          program.analysis.preparationTips.length > 0
            ? `
        <div style="margin-top: 15px;">
          <h4 style="color: #333; margin-bottom: 8px;">💡 준비 팁</h4>
          <ul style="color: #555; margin: 5px 0; padding-left: 20px;">
            ${program.analysis.preparationTips.map((tip) => `<li>${tip}</li>`).join('')}
          </ul>
        </div>
        `
            : ''
        }

        ${
          program.analysis.concerns.length > 0
            ? `
        <div style="margin-top: 15px;">
          <h4 style="color: #333; margin-bottom: 8px;">⚠️ 주의사항</h4>
          <ul style="color: #555; margin: 5px 0; padding-left: 20px;">
            ${program.analysis.concerns.map((concern) => `<li>${concern}</li>`).join('')}
          </ul>
        </div>
        `
            : ''
        }

        <div style="margin-top: 15px;">
          <a href="${program.url}" style="display: inline-block; background-color: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            공고 상세보기 →
          </a>
        </div>
      </div>
    `
      )
      .join('');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>정부지원사업 공고 알림</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">

  <div style="background-color: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <h1 style="color: #2196F3; margin-top: 0; border-bottom: 3px solid #2196F3; padding-bottom: 15px;">
      🎯 새로운 정부지원사업 공고 알림
    </h1>

    <div style="background-color: #E3F2FD; border-left: 4px solid #2196F3; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 5px 0;"><strong>📊 분석 요약</strong></p>
      <p style="margin: 5px 0;">• 전체 공고: <strong>${programs.length}개</strong></p>
      <p style="margin: 5px 0;">• 추천 공고: <strong>${recommended.length}개</strong></p>
      <p style="margin: 5px 0;">• 긴급 (HIGH): <strong>${highPriority.length}개</strong></p>
      <p style="margin: 5px 0;">• 분석 일시: <strong>${new Date().toLocaleString('ko-KR')}</strong></p>
    </div>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

    ${programsHTML}

    <div style="margin-top: 30px; padding: 20px; background-color: #f0f0f0; border-radius: 8px; text-align: center;">
      <p style="color: #666; margin: 5px 0;">
        이 알림은 AI 기반 정부지원사업 자동화 시스템에서 발송되었습니다.
      </p>
      <p style="color: #999; font-size: 12px; margin: 5px 0;">
        ZZIK (찍) 프로젝트 | Hyein Agent
      </p>
    </div>
  </div>

</body>
</html>
    `;
  }

  /**
   * 텍스트 이메일 본문 생성 (HTML 미지원 클라이언트용)
   */
  private generateEmailText(programs: AnalyzedProgram[]): string {
    const header = `
==========================================================
🎯 새로운 정부지원사업 공고 ${programs.length}건 발견!
==========================================================

분석 일시: ${new Date().toLocaleString('ko-KR')}
전체 공고: ${programs.length}개
추천 공고: ${programs.filter((p) => p.analysis.recommendation === '강력추천' || p.analysis.recommendation === '추천').length}개

==========================================================
`;

    const programsText = programs
      .sort((a, b) => b.analysis.score - a.analysis.score)
      .map(
        (program, index) => `
${index + 1}. ${program.title}

   기관: ${program.organization}
   마감일: ${new Date(program.deadline).toLocaleDateString('ko-KR')}
   적합도: ${program.analysis.score}/10점 (${program.analysis.recommendation})
   우선순위: ${program.analysis.priority}
   ${program.analysis.estimatedBudget ? `예상 지원금: ${program.analysis.estimatedBudget}` : ''}

   ✅ 매칭 이유:
   ${program.analysis.matchReasons.map((r) => `   - ${r}`).join('\n')}

   💡 준비 팁:
   ${program.analysis.preparationTips.map((t) => `   - ${t}`).join('\n')}

   🔗 상세보기: ${program.url}

----------------------------------------------------------
`
      )
      .join('');

    return (
      header +
      programsText +
      '\n이 알림은 AI 기반 정부지원사업 자동화 시스템에서 발송되었습니다.\n'
    );
  }

  private getRecommendationColor(recommendation: string): string {
    switch (recommendation) {
      case '강력추천':
        return '#4CAF50'; // Green
      case '추천':
        return '#2196F3'; // Blue
      case '검토필요':
        return '#FF9800'; // Orange
      case '부적합':
        return '#F44336'; // Red
      default:
        return '#9E9E9E'; // Grey
    }
  }

  private getPriorityColor(priority: string): string {
    switch (priority) {
      case 'HIGH':
        return '#F44336'; // Red
      case 'MEDIUM':
        return '#FF9800'; // Orange
      case 'LOW':
        return '#4CAF50'; // Green
      default:
        return '#9E9E9E'; // Grey
    }
  }

  /**
   * 이메일 연결 테스트
   */
  async testConnection(): Promise<boolean> {
    if (!this.transporter) {
      log.error('Email transporter not initialized');
      return false;
    }

    try {
      await this.transporter.verify();
      log.info('✅ Email connection test successful');
      return true;
    } catch (error) {
      log.error('❌ Email connection test failed', error);
      return false;
    }
  }
}

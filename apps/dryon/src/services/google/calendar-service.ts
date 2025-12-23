/**
 * Google Calendar 연동 서비스
 * 공고 마감일을 캘린더에 자동 등록
 */

import { google } from 'googleapis';
import type { calendar_v3 } from 'googleapis';
import { log } from '../../utils/logger.js';
import type { AnalyzedProgram } from '../../types/index.js';

export interface GoogleCalendarConfig {
  enabled: boolean;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  refreshToken: string;
  calendarId: string;
}

export class GoogleCalendarService {
  private calendar: calendar_v3.Calendar | null = null;
  private config: GoogleCalendarConfig;

  constructor(config: GoogleCalendarConfig) {
    this.config = config;

    if (config.enabled) {
      this.initializeClient();
    }
  }

  private initializeClient(): void {
    try {
      const oauth2Client = new google.auth.OAuth2(
        this.config.clientId,
        this.config.clientSecret,
        this.config.redirectUri
      );

      oauth2Client.setCredentials({
        refresh_token: this.config.refreshToken,
      });

      this.calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      log.info('📅 Google Calendar client initialized');
    } catch (error) {
      log.error('Failed to initialize Google Calendar client', error);
      this.calendar = null;
    }
  }

  /**
   * 공고 마감일을 캘린더 이벤트로 추가
   */
  async addProgramDeadline(program: AnalyzedProgram): Promise<string | null> {
    if (!this.config.enabled || !this.calendar) {
      log.warn('Google Calendar is disabled or client not initialized');
      return null;
    }

    try {
      const deadline = new Date(program.deadline);
      const reminderDays = this.getReminderDays(program.analysis.priority);

      const event: calendar_v3.Schema$Event = {
        summary: `📌 ${program.title}`,
        description: this.generateEventDescription(program),
        start: {
          date: deadline.toISOString().split('T')[0],
          timeZone: 'Asia/Seoul',
        },
        end: {
          date: deadline.toISOString().split('T')[0],
          timeZone: 'Asia/Seoul',
        },
        reminders: {
          useDefault: false,
          overrides: reminderDays.map((days) => ({
            method: 'email',
            minutes: days * 24 * 60,
          })),
        },
        colorId: this.getColorId(program.analysis.priority),
        source: {
          title: program.organization,
          url: program.url,
        },
      };

      const response = await this.calendar.events.insert({
        calendarId: this.config.calendarId,
        requestBody: event,
      });

      log.info(
        `✅ Added calendar event: ${program.title} (${response.data.id})`
      );
      return response.data.id || null;
    } catch (error) {
      log.error(`Failed to add calendar event for ${program.title}`, error);
      return null;
    }
  }

  /**
   * 이벤트 설명 생성
   */
  private generateEventDescription(program: AnalyzedProgram): string {
    const parts = [
      `🎯 정부지원사업 마감일 알림`,
      ``,
      `📊 적합도: ${program.analysis.score}/10점 (${program.analysis.recommendation})`,
      `🔴 우선순위: ${program.analysis.priority}`,
      ``,
      `🏢 기관: ${program.organization}`,
      `📁 카테고리: ${program.category}`,
      `👥 대상: ${program.target}`,
    ];

    if (program.analysis.estimatedBudget) {
      parts.push(`💰 예상 지원금: ${program.analysis.estimatedBudget}`);
    }

    if (program.analysis.matchReasons.length > 0) {
      parts.push(``);
      parts.push(`✅ 매칭 이유:`);
      program.analysis.matchReasons.forEach((reason) => {
        parts.push(`  • ${reason}`);
      });
    }

    if (program.analysis.preparationTips.length > 0) {
      parts.push(``);
      parts.push(`💡 준비 팁:`);
      program.analysis.preparationTips.forEach((tip) => {
        parts.push(`  • ${tip}`);
      });
    }

    if (program.analysis.concerns.length > 0) {
      parts.push(``);
      parts.push(`⚠️ 주의사항:`);
      program.analysis.concerns.forEach((concern) => {
        parts.push(`  • ${concern}`);
      });
    }

    parts.push(``);
    parts.push(`🔗 공고 상세보기: ${program.url}`);

    return parts.join('\n');
  }

  /**
   * 우선순위별 리마인더 일수 설정
   */
  private getReminderDays(priority: string): number[] {
    switch (priority) {
      case 'HIGH':
        return [14, 7, 3, 1]; // 2주 전, 1주 전, 3일 전, 1일 전
      case 'MEDIUM':
        return [7, 3, 1]; // 1주 전, 3일 전, 1일 전
      case 'LOW':
        return [7, 1]; // 1주 전, 1일 전
      default:
        return [7]; // 1주 전
    }
  }

  /**
   * 우선순위별 캘린더 색상 설정
   */
  private getColorId(priority: string): string {
    switch (priority) {
      case 'HIGH':
        return '11'; // Red
      case 'MEDIUM':
        return '5'; // Yellow
      case 'LOW':
        return '10'; // Green
      default:
        return '1'; // Blue
    }
  }

  /**
   * 여러 공고를 캘린더에 일괄 추가
   */
  async addProgramDeadlines(programs: AnalyzedProgram[]): Promise<void> {
    if (!this.config.enabled || !this.calendar) {
      log.warn('Google Calendar is disabled or client not initialized');
      return;
    }

    if (programs.length === 0) {
      log.info('No programs to add to calendar');
      return;
    }

    log.info(`📅 Adding ${programs.length} programs to Google Calendar...`);

    const results = await Promise.allSettled(
      programs.map((program) => this.addProgramDeadline(program))
    );

    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    log.info(`✅ Calendar events: ${succeeded} succeeded, ${failed} failed`);
  }

  /**
   * 특정 점수 이상 공고만 캘린더에 추가
   */
  async addHighScoreProgramDeadlines(
    programs: AnalyzedProgram[],
    minScore: number = 7
  ): Promise<void> {
    const filteredPrograms = programs.filter(
      (p) => p.analysis.score >= minScore
    );

    if (filteredPrograms.length === 0) {
      log.info(`No programs with score >= ${minScore} to add to calendar`);
      return;
    }

    log.info(
      `📅 Adding ${filteredPrograms.length}/${programs.length} programs to calendar (score >= ${minScore})`
    );

    await this.addProgramDeadlines(filteredPrograms);
  }

  /**
   * 연결 테스트
   */
  async testConnection(): Promise<boolean> {
    if (!this.calendar) {
      log.error('Google Calendar client not initialized');
      return false;
    }

    try {
      const response = await this.calendar.calendarList.get({
        calendarId: this.config.calendarId,
      });

      log.info(
        `✅ Google Calendar connection test successful: ${response.data.summary}`
      );
      return true;
    } catch (error) {
      log.error('❌ Google Calendar connection test failed', error);
      return false;
    }
  }

  /**
   * 이벤트 삭제
   */
  async deleteEvent(eventId: string): Promise<void> {
    if (!this.calendar) return;

    try {
      await this.calendar.events.delete({
        calendarId: this.config.calendarId,
        eventId,
      });

      log.info(`✅ Deleted calendar event: ${eventId}`);
    } catch (error) {
      log.error(`Failed to delete calendar event: ${eventId}`, error);
    }
  }

  /**
   * 특정 기간의 이벤트 조회
   */
  async getEvents(
    timeMin: Date = new Date(),
    timeMax?: Date
  ): Promise<calendar_v3.Schema$Event[]> {
    if (!this.calendar) {
      throw new Error('Google Calendar client not initialized');
    }

    try {
      const response = await this.calendar.events.list({
        calendarId: this.config.calendarId,
        timeMin: timeMin.toISOString(),
        timeMax: timeMax?.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      });

      return response.data.items || [];
    } catch (error) {
      log.error('Failed to get calendar events', error);
      throw error;
    }
  }

  /**
   * 중복 이벤트 확인 (제목 기준)
   */
  async isDuplicateEvent(
    programTitle: string,
    deadline: Date
  ): Promise<boolean> {
    if (!this.calendar) return false;

    try {
      const events = await this.getEvents(
        new Date(deadline.getTime() - 7 * 24 * 60 * 60 * 1000), // 1주일 전부터
        new Date(deadline.getTime() + 7 * 24 * 60 * 60 * 1000) // 1주일 후까지
      );

      return events.some((event) => event.summary?.includes(programTitle));
    } catch (error) {
      log.error('Failed to check duplicate event', error);
      return false;
    }
  }

  /**
   * 중복 제거 후 추가
   */
  async addNewProgramDeadlinesOnly(programs: AnalyzedProgram[]): Promise<void> {
    if (!this.calendar || programs.length === 0) return;

    log.info(
      `📅 Checking for duplicate events among ${programs.length} programs...`
    );

    const newPrograms: AnalyzedProgram[] = [];

    for (const program of programs) {
      const isDuplicate = await this.isDuplicateEvent(
        program.title,
        new Date(program.deadline)
      );
      if (!isDuplicate) {
        newPrograms.push(program);
      }
    }

    if (newPrograms.length === 0) {
      log.info('No new events to add (all duplicates)');
      return;
    }

    log.info(
      `📅 Adding ${newPrograms.length}/${programs.length} new events (${programs.length - newPrograms.length} duplicates skipped)`
    );

    await this.addProgramDeadlines(newPrograms);
  }
}

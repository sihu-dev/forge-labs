/**
 * Google Calendar 연동 서비스
 */

import { google } from 'googleapis';
import { config } from '../../config/index.js';
import { log } from '../../utils/logger.js';
import type { AnalyzedProgram } from '../../types/index.js';
import { addDays } from 'date-fns';

export class GoogleCalendarService {
  private calendar: ReturnType<typeof google.calendar>;
  private calendarId: string;

  constructor() {
    const auth = new google.auth.OAuth2(
      config.google.clientId,
      config.google.clientSecret,
      config.google.redirectUri
    );

    auth.setCredentials({
      refresh_token: config.google.refreshToken,
    });

    this.calendar = google.calendar({ version: 'v3', auth });
    this.calendarId = config.google.calendarId;

    log.info('GoogleCalendarService initialized');
  }

  /**
   * 공고 마감일을 캘린더에 추가
   */
  async addProgramDeadlines(programs: AnalyzedProgram[]): Promise<void> {
    log.info(`Adding ${programs.length} program deadlines to Google Calendar`);

    for (const program of programs) {
      try {
        await this.addEvent(program);
      } catch (error) {
        log.error(`Failed to add calendar event for ${program.title}`, error);
      }
    }

    log.info('Program deadlines added to Google Calendar');
  }

  /**
   * 단일 이벤트 추가
   */
  private async addEvent(program: AnalyzedProgram): Promise<void> {
    // 향후 확장을 위한 날짜 계산 예시
    // const deadlineDate = parseISO(program.deadline);
    // const reminderDate = addDays(deadlineDate, -3);

    const event = {
      summary: `[마감] ${program.title}`,
      description: `
주관기관: ${program.organization}
적합도: ${program.analysis.score}점 (${program.analysis.recommendation})
우선순위: ${program.analysis.priority}

매칭이유:
${program.analysis.matchReasons.join('\n')}

준비사항:
${program.analysis.preparationTips.join('\n')}

${program.url ? `상세보기: ${program.url}` : ''}
      `.trim(),
      start: {
        date: program.deadline,
        timeZone: 'Asia/Seoul',
      },
      end: {
        date: program.deadline,
        timeZone: 'Asia/Seoul',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 * 3 }, // 3일 전
          { method: 'popup', minutes: 24 * 60 }, // 1일 전
        ],
      },
      colorId: this.getColorByPriority(program.analysis.priority),
    };

    await this.calendar.events.insert({
      calendarId: this.calendarId,
      requestBody: event,
    });

    log.info(`Calendar event added: ${program.title}`);
  }

  /**
   * 우선순위별 색상
   */
  private getColorByPriority(priority: 'HIGH' | 'MEDIUM' | 'LOW'): string {
    const colorMap = {
      HIGH: '11', // 빨강
      MEDIUM: '5', // 노랑
      LOW: '2', // 초록
    };

    return colorMap[priority] || '7'; // 기본: 파랑
  }

  /**
   * 특정 기간의 이벤트 조회
   */
  async getEvents(
    timeMin: Date,
    timeMax: Date
  ): Promise<Array<{ summary: string; start: string }>> {
    try {
      const response = await this.calendar.events.list({
        calendarId: this.calendarId,
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      });

      return (
        response.data.items?.map((event) => ({
          summary: event.summary || '',
          start: event.start?.date || event.start?.dateTime || '',
        })) || []
      );
    } catch (error) {
      log.error('Failed to get calendar events', error);
      return [];
    }
  }

  /**
   * 이벤트 삭제 (이름으로 검색)
   */
  async deleteEventByTitle(title: string): Promise<void> {
    try {
      const now = new Date();
      const futureDate = addDays(now, 365);

      const response = await this.calendar.events.list({
        calendarId: this.calendarId,
        timeMin: now.toISOString(),
        timeMax: futureDate.toISOString(),
        q: title,
        singleEvents: true,
      });

      const events = response.data.items || [];

      for (const event of events) {
        if (event.id) {
          await this.calendar.events.delete({
            calendarId: this.calendarId,
            eventId: event.id,
          });

          log.info(`Calendar event deleted: ${title}`);
        }
      }
    } catch (error) {
      log.error(`Failed to delete calendar event: ${title}`, error);
    }
  }
}

export const googleCalendarService = new GoogleCalendarService();

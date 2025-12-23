/**
 * Google Services 통합 관리자
 * Sheets와 Calendar를 통합 관리
 */

import {
  GoogleSheetsService,
  type GoogleSheetsConfig,
} from './sheets-service.js';
import {
  GoogleCalendarService,
  type GoogleCalendarConfig,
} from './calendar-service.js';
import { log } from '../../utils/logger.js';
import type { AnalyzedProgram } from '../../types/index.js';

export interface GoogleServicesConfig {
  sheets: GoogleSheetsConfig;
  calendar: GoogleCalendarConfig;
  minScoreThreshold?: number;
}

export class GoogleServicesManager {
  private sheetsService: GoogleSheetsService;
  private calendarService: GoogleCalendarService;
  private minScoreThreshold: number;

  constructor(config: GoogleServicesConfig) {
    this.sheetsService = new GoogleSheetsService(config.sheets);
    this.calendarService = new GoogleCalendarService(config.calendar);
    this.minScoreThreshold = config.minScoreThreshold || 7;

    log.info(
      `🔧 Google Services Manager initialized (minScore: ${this.minScoreThreshold})`
    );
  }

  /**
   * 분석된 공고를 Sheets와 Calendar에 동시 등록
   */
  async syncPrograms(programs: AnalyzedProgram[]): Promise<void> {
    // 최소 점수 이상인 공고만 필터링
    const filteredPrograms = programs.filter(
      (p) => p.analysis.score >= this.minScoreThreshold
    );

    if (filteredPrograms.length === 0) {
      log.info(
        `No programs to sync (all below threshold ${this.minScoreThreshold})`
      );
      return;
    }

    log.info(
      `🔄 Syncing ${filteredPrograms.length}/${programs.length} programs to Google Services (score ≥${this.minScoreThreshold})`
    );

    const results = await Promise.allSettled([
      this.sheetsService.appendNewProgramsOnly(filteredPrograms),
      this.calendarService.addNewProgramDeadlinesOnly(filteredPrograms),
    ]);

    // 결과 로깅
    results.forEach((result, index) => {
      const service = index === 0 ? 'Google Sheets' : 'Google Calendar';
      if (result.status === 'fulfilled') {
        log.info(`✅ ${service} sync successful`);
      } else {
        log.error(`❌ ${service} sync failed:`, result.reason);
      }
    });
  }

  /**
   * HIGH 우선순위 공고만 동기화
   */
  async syncUrgentPrograms(programs: AnalyzedProgram[]): Promise<void> {
    const urgentPrograms = programs.filter(
      (p) =>
        p.analysis.priority === 'HIGH' &&
        p.analysis.score >= this.minScoreThreshold
    );

    if (urgentPrograms.length === 0) {
      log.info('No urgent programs to sync');
      return;
    }

    log.info(`🚨 Syncing ${urgentPrograms.length} urgent programs`);

    await this.syncPrograms(urgentPrograms);
  }

  /**
   * 특정 점수 이상 공고만 동기화
   */
  async syncByScore(
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
      `🔄 Syncing ${filteredPrograms.length} programs (score ≥${minScore})`
    );

    await Promise.allSettled([
      this.sheetsService.appendNewProgramsOnly(filteredPrograms),
      this.calendarService.addNewProgramDeadlinesOnly(filteredPrograms),
    ]);
  }

  /**
   * Google Services 연결 테스트
   */
  async testConnections(): Promise<{
    sheets: boolean;
    calendar: boolean;
  }> {
    log.info('🧪 Testing Google Services connections...');

    const [sheetsResult, calendarResult] = await Promise.allSettled([
      this.sheetsService.testConnection(),
      this.calendarService.testConnection(),
    ]);

    const results = {
      sheets: sheetsResult.status === 'fulfilled' && sheetsResult.value,
      calendar: calendarResult.status === 'fulfilled' && calendarResult.value,
    };

    log.info(
      `Test results: Sheets=${results.sheets ? '✅' : '❌'}, Calendar=${results.calendar ? '✅' : '❌'}`
    );

    return results;
  }

  /**
   * Sheets만 동기화
   */
  async syncToSheetsOnly(programs: AnalyzedProgram[]): Promise<void> {
    const filteredPrograms = programs.filter(
      (p) => p.analysis.score >= this.minScoreThreshold
    );

    if (filteredPrograms.length === 0) {
      log.info('No programs to sync to Sheets');
      return;
    }

    log.info(
      `📊 Syncing ${filteredPrograms.length} programs to Google Sheets only`
    );

    await this.sheetsService.appendNewProgramsOnly(filteredPrograms);
  }

  /**
   * Calendar만 동기화
   */
  async syncToCalendarOnly(programs: AnalyzedProgram[]): Promise<void> {
    const filteredPrograms = programs.filter(
      (p) => p.analysis.score >= this.minScoreThreshold
    );

    if (filteredPrograms.length === 0) {
      log.info('No programs to sync to Calendar');
      return;
    }

    log.info(
      `📅 Syncing ${filteredPrograms.length} programs to Google Calendar only`
    );

    await this.calendarService.addNewProgramDeadlinesOnly(filteredPrograms);
  }

  /**
   * 일일 요약 동기화
   */
  async syncDailySummary(
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

    log.info('📊 Syncing daily summary', summary);

    // 추천 공고만 동기화
    if (recommended.length > 0) {
      await this.syncPrograms(recommended);
    }
  }
}

/**
 * 환경변수에서 GoogleServicesConfig 생성
 */
export function createGoogleServicesConfigFromEnv(): GoogleServicesConfig {
  const sheetsEnabled = process.env.GOOGLE_SHEETS_ENABLED === 'true';
  const calendarEnabled = process.env.GOOGLE_CALENDAR_ENABLED === 'true';

  return {
    sheets: {
      enabled: sheetsEnabled,
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      redirectUri:
        process.env.GOOGLE_REDIRECT_URI ||
        'http://localhost:3000/oauth2callback',
      refreshToken: process.env.GOOGLE_REFRESH_TOKEN || '',
      spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID || '',
    },
    calendar: {
      enabled: calendarEnabled,
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      redirectUri:
        process.env.GOOGLE_REDIRECT_URI ||
        'http://localhost:3000/oauth2callback',
      refreshToken: process.env.GOOGLE_REFRESH_TOKEN || '',
      calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
    },
    minScoreThreshold: parseInt(process.env.MIN_SCORE_THRESHOLD || '7', 10),
  };
}

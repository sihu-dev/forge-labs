/**
 * Google Sheets 연동 서비스
 */

import { google } from 'googleapis';
import { config } from '../../config/index.js';
import { log } from '../../utils/logger.js';
import type { AnalyzedProgram } from '../../types/index.js';

export class GoogleSheetsService {
  private sheets: ReturnType<typeof google.sheets>;
  private spreadsheetId: string;

  constructor() {
    const auth = new google.auth.OAuth2(
      config.google.clientId,
      config.google.clientSecret,
      config.google.redirectUri
    );

    auth.setCredentials({
      refresh_token: config.google.refreshToken,
    });

    this.sheets = google.sheets({ version: 'v4', auth });
    this.spreadsheetId = config.google.spreadsheetId;

    log.info('GoogleSheetsService initialized');
  }

  /**
   * 분석된 공고를 Sheets에 저장
   */
  async savePrograms(programs: AnalyzedProgram[]): Promise<void> {
    log.info(`Saving ${programs.length} programs to Google Sheets`);

    try {
      const values = programs.map((program) => [
        program.title,
        program.organization,
        program.category || '',
        program.target || '',
        program.deadline,
        program.url || '',
        program.source,
        program.analysis.score,
        program.analysis.recommendation,
        program.analysis.priority,
        program.analysis.matchReasons.join(', '),
        program.analysis.concerns.join(', '),
        program.analysis.preparationTips.join(', '),
        program.analysis.estimatedBudget || '',
        program.analyzedAt,
      ]);

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'Sheet1!A:O', // A부터 O까지 15개 컬럼
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values,
        },
      });

      log.info('Programs saved to Google Sheets successfully');
    } catch (error) {
      log.error('Failed to save programs to Google Sheets', error);
      throw error;
    }
  }

  /**
   * Sheets 헤더 초기화
   */
  async initializeSheet(): Promise<void> {
    log.info('Initializing Google Sheets header');

    try {
      const headers = [
        '사업명',
        '주관기관',
        '분야',
        '지원대상',
        '마감일',
        'URL',
        '출처',
        '적합도점수',
        '추천도',
        '우선순위',
        '매칭이유',
        '우려사항',
        '준비팁',
        '예상지원금',
        '분석일시',
      ];

      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: 'Sheet1!A1:O1',
        valueInputOption: 'RAW',
        requestBody: {
          values: [headers],
        },
      });

      log.info('Google Sheets header initialized');
    } catch (error) {
      log.error('Failed to initialize Google Sheets header', error);
      throw error;
    }
  }

  /**
   * 특정 범위 읽기
   */
  async readRange(range: string): Promise<string[][]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range,
      });

      return (response.data.values as string[][]) || [];
    } catch (error) {
      log.error(`Failed to read range ${range}`, error);
      return [];
    }
  }

  /**
   * 시트 클리어 (테스트용)
   */
  async clearSheet(range: string = 'Sheet1!A2:O'): Promise<void> {
    try {
      await this.sheets.spreadsheets.values.clear({
        spreadsheetId: this.spreadsheetId,
        range,
      });

      log.info(`Sheet range ${range} cleared`);
    } catch (error) {
      log.error(`Failed to clear sheet range ${range}`, error);
      throw error;
    }
  }
}

export const googleSheetsService = new GoogleSheetsService();

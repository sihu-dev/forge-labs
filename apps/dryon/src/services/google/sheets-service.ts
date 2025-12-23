/**
 * Google Sheets 연동 서비스
 * 분석된 공고를 스프레드시트에 자동 기록
 */

import { google } from 'googleapis';
import type { sheets_v4 } from 'googleapis';
import { log } from '../../utils/logger.js';
import type { AnalyzedProgram } from '../../types/index.js';

export interface GoogleSheetsConfig {
  enabled: boolean;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  refreshToken: string;
  spreadsheetId: string;
}

export class GoogleSheetsService {
  private sheets: sheets_v4.Sheets | null = null;
  private config: GoogleSheetsConfig;

  constructor(config: GoogleSheetsConfig) {
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

      this.sheets = google.sheets({ version: 'v4', auth: oauth2Client });

      log.info('📊 Google Sheets client initialized');
    } catch (error) {
      log.error('Failed to initialize Google Sheets client', error);
      this.sheets = null;
    }
  }

  /**
   * 스프레드시트에 헤더 생성 (최초 1회)
   */
  async createHeaderIfNotExists(): Promise<void> {
    if (!this.sheets) {
      log.warn('Google Sheets client not initialized');
      return;
    }

    try {
      // 현재 시트 확인
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.config.spreadsheetId,
        range: '공고목록!A1:Z1',
      });

      // 헤더가 없으면 생성
      if (!response.data.values || response.data.values.length === 0) {
        const headers = [
          '분석일시',
          '공고ID',
          '공고명',
          '기관',
          '카테고리',
          '대상',
          '마감일',
          '적합도 점수',
          '추천도',
          '우선순위',
          '예상 지원금',
          '매칭 이유',
          '준비 팁',
          '주의사항',
          '공고 URL',
          '비고',
        ];

        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.config.spreadsheetId,
          range: '공고목록!A1:P1',
          valueInputOption: 'RAW',
          requestBody: {
            values: [headers],
          },
        });

        log.info('✅ Created header row in Google Sheets');
      }
    } catch (error: any) {
      // 시트가 없으면 생성
      if (error.message?.includes('Unable to parse range')) {
        await this.createSheet();
        await this.createHeaderIfNotExists();
      } else {
        log.error('Failed to create header', error);
      }
    }
  }

  /**
   * 새 시트 생성
   */
  private async createSheet(): Promise<void> {
    if (!this.sheets) return;

    try {
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.config.spreadsheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: '공고목록',
                  gridProperties: {
                    rowCount: 1000,
                    columnCount: 16,
                    frozenRowCount: 1,
                  },
                },
              },
            },
          ],
        },
      });

      log.info('✅ Created new sheet: 공고목록');
    } catch (error) {
      log.error('Failed to create sheet', error);
    }
  }

  /**
   * 분석된 공고를 스프레드시트에 추가
   */
  async appendPrograms(programs: AnalyzedProgram[]): Promise<void> {
    if (!this.config.enabled || !this.sheets) {
      log.warn('Google Sheets is disabled or client not initialized');
      return;
    }

    if (programs.length === 0) {
      log.info('No programs to append to Google Sheets');
      return;
    }

    try {
      // 헤더 확인/생성
      await this.createHeaderIfNotExists();

      // 데이터 변환
      const rows = programs.map((program) => [
        new Date(program.analyzedAt).toLocaleString('ko-KR'), // 분석일시
        program.id, // 공고ID
        program.title, // 공고명
        program.organization, // 기관
        program.category, // 카테고리
        program.target, // 대상
        new Date(program.deadline).toLocaleDateString('ko-KR'), // 마감일
        program.analysis.score, // 적합도 점수
        program.analysis.recommendation, // 추천도
        program.analysis.priority, // 우선순위
        program.analysis.estimatedBudget || '', // 예상 지원금
        program.analysis.matchReasons.join('\n'), // 매칭 이유
        program.analysis.preparationTips.join('\n'), // 준비 팁
        program.analysis.concerns.join('\n'), // 주의사항
        program.url, // 공고 URL
        program.memo || '', // 비고
      ]);

      // 스프레드시트에 추가
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.config.spreadsheetId,
        range: '공고목록!A:P',
        valueInputOption: 'RAW',
        requestBody: {
          values: rows,
        },
      });

      log.info(`✅ Added ${programs.length} programs to Google Sheets`);
    } catch (error) {
      log.error('Failed to append programs to Google Sheets', error);
      throw error;
    }
  }

  /**
   * 특정 점수 이상 공고만 추가
   */
  async appendHighScorePrograms(
    programs: AnalyzedProgram[],
    minScore: number = 7
  ): Promise<void> {
    const filteredPrograms = programs.filter(
      (p) => p.analysis.score >= minScore
    );

    if (filteredPrograms.length === 0) {
      log.info(`No programs with score >= ${minScore} to append`);
      return;
    }

    log.info(
      `📊 Appending ${filteredPrograms.length}/${programs.length} programs (score >= ${minScore})`
    );

    await this.appendPrograms(filteredPrograms);
  }

  /**
   * 연결 테스트
   */
  async testConnection(): Promise<boolean> {
    if (!this.sheets) {
      log.error('Google Sheets client not initialized');
      return false;
    }

    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: this.config.spreadsheetId,
      });

      log.info(
        `✅ Google Sheets connection test successful: ${response.data.properties?.title}`
      );
      return true;
    } catch (error) {
      log.error('❌ Google Sheets connection test failed', error);
      return false;
    }
  }

  /**
   * 스프레드시트 데이터 조회
   */
  async getPrograms(range: string = '공고목록!A2:P'): Promise<string[][]> {
    if (!this.sheets) {
      throw new Error('Google Sheets client not initialized');
    }

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.config.spreadsheetId,
        range,
      });

      return response.data.values || [];
    } catch (error) {
      log.error('Failed to get programs from Google Sheets', error);
      throw error;
    }
  }

  /**
   * 중복 공고 확인 (공고ID 기준)
   */
  async isDuplicate(programId: string): Promise<boolean> {
    if (!this.sheets) return false;

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.config.spreadsheetId,
        range: '공고목록!B:B', // 공고ID 컬럼
      });

      const existingIds = response.data.values?.flat() || [];
      return existingIds.includes(programId);
    } catch (error) {
      log.error('Failed to check duplicate', error);
      return false;
    }
  }

  /**
   * 중복 제거 후 추가
   */
  async appendNewProgramsOnly(programs: AnalyzedProgram[]): Promise<void> {
    if (!this.sheets || programs.length === 0) return;

    try {
      // 기존 공고 ID 조회
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.config.spreadsheetId,
        range: '공고목록!B:B',
      });

      const existingIds = new Set(response.data.values?.flat() || []);

      // 중복 제거
      const newPrograms = programs.filter((p) => !existingIds.has(p.id));

      if (newPrograms.length === 0) {
        log.info('No new programs to add (all duplicates)');
        return;
      }

      log.info(
        `📊 Adding ${newPrograms.length}/${programs.length} new programs (${programs.length - newPrograms.length} duplicates skipped)`
      );

      await this.appendPrograms(newPrograms);
    } catch (error) {
      // 시트가 비어있으면 모두 추가
      log.info('Sheet is empty, adding all programs');
      await this.appendPrograms(programs);
    }
  }
}

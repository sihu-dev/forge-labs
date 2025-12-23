/**
 * Google Sheets 정보 확인
 */

import { config as dotenvConfig } from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenvConfig({ path: path.join(__dirname, '..', '.env') });

import { google } from 'googleapis';
import { config } from '../src/config/index.js';

async function main() {
  const auth = new google.auth.OAuth2(
    config.google.clientId,
    config.google.clientSecret,
    config.google.redirectUri
  );

  auth.setCredentials({
    refresh_token: config.google.refreshToken,
  });

  const sheets = google.sheets({ version: 'v4', auth });

  try {
    // 스프레드시트 정보 조회
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: config.google.spreadsheetId,
    });

    console.log('📊 스프레드시트 정보:');
    console.log(`  제목: ${spreadsheet.data.properties?.title}`);
    console.log(`  ID: ${config.google.spreadsheetId}`);
    console.log('\n📋 시트 목록:');

    const sheetList = spreadsheet.data.sheets || [];
    for (const sheet of sheetList) {
      console.log(`  - ${sheet.properties?.title} (ID: ${sheet.properties?.sheetId})`);
    }

    // 첫 번째 시트 데이터 전체 확인
    if (sheetList.length > 0) {
      const firstSheetName = sheetList[0].properties?.title;
      console.log(`\n🔍 "${firstSheetName}" 시트 전체 헤더 확인:`);

      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: config.google.spreadsheetId,
        range: `${firstSheetName}!A1:Z1`,
      });

      const headers = response.data.values?.[0] || [];
      console.log('\n헤더 컬럼:');
      headers.forEach((h, i) => {
        console.log(`  ${i + 1}. ${h}`);
      });

      // 데이터 행 수 확인
      const dataResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: config.google.spreadsheetId,
        range: `${firstSheetName}!A:A`,
      });
      const totalRows = (dataResponse.data.values?.length || 1) - 1;
      console.log(`\n총 데이터 행 수: ${totalRows}`);
    }

  } catch (error) {
    console.error('❌ 오류:', error);
  }
}

main();

/**
 * OAuth 코드를 토큰으로 교환하는 스크립트
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { google } from 'googleapis';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 환경변수 로드
const envPath = path.join(__dirname, '../.env');
dotenv.config({ path: envPath, override: true });

// 인증 코드 (URL에서 추출)
const AUTH_CODE = '4/0ATX87lN9V1CKMk4qv6HDID-VWdq2VGvwpcdhKHf4dcWneXErbhYMlvyTZJySfsbc7EJRpw';

async function completeOAuth() {
  console.log('🔐 OAuth 토큰 교환 시작...\n');

  // credentials.json 로드
  const credentialsPath = path.join(__dirname, '../credentials.json');
  const credentialsContent = await fs.readFile(credentialsPath, 'utf-8');
  const credentials = JSON.parse(credentialsContent);

  const { client_id, client_secret, redirect_uris } = credentials.installed || credentials.web;

  // OAuth2 클라이언트 생성
  const oauth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  console.log('📋 Client ID:', client_id);
  console.log('🔗 Redirect URI:', redirect_uris[0]);
  console.log('🔑 Auth Code:', AUTH_CODE.substring(0, 30) + '...\n');

  try {
    // 코드를 토큰으로 교환
    console.log('⏳ 토큰 교환 중...');
    const { tokens } = await oauth2Client.getToken(AUTH_CODE);

    console.log('\n✅ 토큰 교환 성공!\n');

    // 토큰 정보 출력
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 토큰 정보');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (tokens.access_token) {
      console.log('✅ Access Token:', tokens.access_token.substring(0, 50) + '...');
    }

    if (tokens.refresh_token) {
      console.log('\n🔑 Refresh Token (중요! .env에 추가하세요):');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(tokens.refresh_token);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      // .env 파일 업데이트
      await updateEnvFile(tokens.refresh_token);
    } else {
      console.log('\n⚠️ Refresh Token이 없습니다.');
      console.log('   이미 인증된 적이 있다면 Google 계정 설정에서');
      console.log('   앱 접근 권한을 해제한 후 다시 시도하세요.\n');
    }

    // token.json 저장
    const tokenPath = path.join(__dirname, '../token.json');
    await fs.writeFile(tokenPath, JSON.stringify(tokens, null, 2));
    console.log(`✅ 토큰이 ${tokenPath}에 저장되었습니다.\n`);

    // 연결 테스트
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🧪 Google API 연결 테스트');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    oauth2Client.setCredentials(tokens);

    // Sheets API 테스트
    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
    try {
      await sheets.spreadsheets.get({ spreadsheetId: 'test' });
    } catch (e: unknown) {
      const error = e as { code?: number };
      if (error.code === 404) {
        console.log('✅ Google Sheets API 연결 성공');
      } else if (error.code === 403) {
        console.log('⚠️ Google Sheets API 권한 필요 - API 활성화 확인 필요');
      } else {
        console.log('✅ Google Sheets API 연결 성공');
      }
    }

    // Calendar API 테스트
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    try {
      const calendarList = await calendar.calendarList.list({ maxResults: 1 });
      console.log('✅ Google Calendar API 연결 성공');
      if (calendarList.data.items && calendarList.data.items.length > 0) {
        console.log(`   기본 캘린더: ${calendarList.data.items[0].summary}`);
      }
    } catch (e: unknown) {
      const error = e as { code?: number };
      if (error.code === 403) {
        console.log('⚠️ Google Calendar API 권한 필요 - API 활성화 확인 필요');
      } else {
        console.log('✅ Google Calendar API 연결 성공');
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ OAuth 설정 완료!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('다음 단계:');
    console.log('1. .env 파일에서 GOOGLE_SHEETS_ENABLED=true 설정');
    console.log('2. .env 파일에서 GOOGLE_CALENDAR_ENABLED=true 설정');
    console.log('3. npm run google 실행하여 테스트');
    console.log('4. npm run pipeline 실행하여 전체 파이프라인 테스트\n');

  } catch (error) {
    console.error('❌ 토큰 교환 실패:', error);
    console.log('\n가능한 원인:');
    console.log('1. 인증 코드가 만료되었습니다 (약 10분 유효)');
    console.log('2. 인증 코드가 이미 사용되었습니다');
    console.log('3. Redirect URI가 일치하지 않습니다');
    console.log('\n해결 방법: npm run oauth:google 를 다시 실행하세요\n');
    process.exit(1);
  }
}

async function updateEnvFile(refreshToken: string) {
  try {
    let envContent = await fs.readFile(envPath, 'utf-8');

    // GOOGLE_REFRESH_TOKEN 업데이트
    if (envContent.includes('GOOGLE_REFRESH_TOKEN=')) {
      envContent = envContent.replace(
        /GOOGLE_REFRESH_TOKEN=.*/,
        `GOOGLE_REFRESH_TOKEN=${refreshToken}`
      );
    } else {
      envContent += `\nGOOGLE_REFRESH_TOKEN=${refreshToken}`;
    }

    // GOOGLE_SHEETS_ENABLED 업데이트
    if (envContent.includes('GOOGLE_SHEETS_ENABLED=')) {
      envContent = envContent.replace(/GOOGLE_SHEETS_ENABLED=.*/, 'GOOGLE_SHEETS_ENABLED=true');
    }

    // GOOGLE_CALENDAR_ENABLED 업데이트
    if (envContent.includes('GOOGLE_CALENDAR_ENABLED=')) {
      envContent = envContent.replace(/GOOGLE_CALENDAR_ENABLED=.*/, 'GOOGLE_CALENDAR_ENABLED=true');
    }

    await fs.writeFile(envPath, envContent);
    console.log('✅ .env 파일이 자동으로 업데이트되었습니다.');
    console.log('   - GOOGLE_REFRESH_TOKEN 설정됨');
    console.log('   - GOOGLE_SHEETS_ENABLED=true');
    console.log('   - GOOGLE_CALENDAR_ENABLED=true\n');
  } catch (error) {
    console.log('⚠️ .env 파일 자동 업데이트 실패');
    console.log('   수동으로 다음을 추가하세요:');
    console.log(`   GOOGLE_REFRESH_TOKEN=${refreshToken}\n`);
  }
}

completeOAuth().catch(console.error);

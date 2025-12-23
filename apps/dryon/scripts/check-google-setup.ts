/**
 * Google OAuth 설정 진단 스크립트
 * credentials.json 및 환경변수 설정 확인
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 환경변수 로드
const envPath = path.join(__dirname, '../.env');
dotenv.config({ path: envPath, override: true });

async function checkSetup() {
  console.log('🔍 Google OAuth 설정 진단 시작...\n');

  let hasErrors = false;

  // 1. credentials.json 파일 확인
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('1️⃣ credentials.json 파일 확인');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const credentialsPath = path.join(__dirname, '../credentials.json');
  try {
    const content = await fs.readFile(credentialsPath, 'utf-8');
    const credentials = JSON.parse(content);

    console.log('✅ credentials.json 파일 존재');
    console.log(`📍 위치: ${credentialsPath}\n`);

    // 파일 타입 확인
    if (credentials.installed) {
      console.log('✅ 애플리케이션 타입: 데스크톱 앱 (installed)');
      const { client_id, client_secret, redirect_uris } = credentials.installed;
      console.log(`📋 Client ID: ${client_id}`);
      console.log(`🔑 Client Secret: ${client_secret ? '설정됨' : '❌ 없음'}`);
      console.log(`🔗 Redirect URIs: ${redirect_uris?.join(', ') || '❌ 없음'}\n`);

      if (!redirect_uris || redirect_uris.length === 0) {
        console.log('⚠️ 경고: redirect_uris가 설정되지 않았습니다.\n');
        hasErrors = true;
      }
    } else if (credentials.web) {
      console.log('✅ 애플리케이션 타입: 웹 애플리케이션 (web)');
      const { client_id, client_secret, redirect_uris } = credentials.web;
      console.log(`📋 Client ID: ${client_id}`);
      console.log(`🔑 Client Secret: ${client_secret ? '설정됨' : '❌ 없음'}`);
      console.log(`🔗 Redirect URIs: ${redirect_uris?.join(', ') || '❌ 없음'}\n`);

      if (!redirect_uris || redirect_uris.length === 0) {
        console.log('⚠️ 경고: redirect_uris가 설정되지 않았습니다.\n');
        hasErrors = true;
      }
    } else {
      console.log('❌ 오류: credentials.json 형식이 올바르지 않습니다.');
      console.log('   "installed" 또는 "web" 키가 필요합니다.\n');
      hasErrors = true;
    }
  } catch (error) {
    console.log('❌ credentials.json 파일을 찾을 수 없습니다.');
    console.log(`   위치: ${credentialsPath}`);
    console.log('   Google Cloud Console에서 OAuth 클라이언트 ID를 생성하고');
    console.log('   credentials.json 파일을 다운로드하여 프로젝트 루트에 저장하세요.\n');
    hasErrors = true;
  }

  // 2. 환경변수 확인
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('2️⃣ 환경변수 설정 확인');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const envVars = {
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_REFRESH_TOKEN: process.env.GOOGLE_REFRESH_TOKEN,
    GOOGLE_SPREADSHEET_ID: process.env.GOOGLE_SPREADSHEET_ID,
    GOOGLE_CALENDAR_ID: process.env.GOOGLE_CALENDAR_ID,
    GOOGLE_SHEETS_ENABLED: process.env.GOOGLE_SHEETS_ENABLED,
    GOOGLE_CALENDAR_ENABLED: process.env.GOOGLE_CALENDAR_ENABLED,
  };

  for (const [key, value] of Object.entries(envVars)) {
    if (value) {
      if (key.includes('SECRET') || key.includes('TOKEN')) {
        console.log(`✅ ${key}: ${value.substring(0, 20)}...`);
      } else {
        console.log(`✅ ${key}: ${value}`);
      }
    } else {
      if (key === 'GOOGLE_REFRESH_TOKEN') {
        console.log(`⚠️ ${key}: 설정 안됨 (OAuth 인증 필요)`);
      } else {
        console.log(`❌ ${key}: 설정 안됨`);
        if (!key.includes('ENABLED')) {
          hasErrors = true;
        }
      }
    }
  }

  console.log('\n');

  // 3. 필수 API 활성화 안내
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('3️⃣ Google Cloud Console 설정 필요 사항');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('다음 사항들을 Google Cloud Console에서 확인하세요:\n');

  console.log('1. API 활성화 확인:');
  console.log('   → https://console.cloud.google.com/apis/library?project=hyeinagent');
  console.log('   - Google Sheets API');
  console.log('   - Google Calendar API\n');

  console.log('2. OAuth 2.0 클라이언트 ID 설정:');
  console.log('   → https://console.cloud.google.com/apis/credentials?project=hyeinagent');
  console.log('   - 승인된 리디렉션 URI에 다음 추가:');
  console.log('     • http://localhost');
  console.log('     • http://localhost:3000/oauth2callback');
  console.log('     • http://localhost/oauth2callback\n');

  console.log('3. OAuth 동의 화면 설정:');
  console.log('   → https://console.cloud.google.com/apis/credentials/consent?project=hyeinagent');
  console.log('   - 테스트 사용자에 본인 Google 계정 추가');
  console.log('   - 범위(Scopes) 확인:');
  console.log('     • https://www.googleapis.com/auth/spreadsheets');
  console.log('     • https://www.googleapis.com/auth/calendar\n');

  // 4. 진단 결과 요약
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('4️⃣ 진단 결과 요약');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (hasErrors) {
    console.log('❌ 설정이 완료되지 않았습니다.\n');
    console.log('다음 단계를 진행하세요:');
    console.log('1. Google Cloud Console에서 위 설정 완료');
    console.log('2. npm run oauth:google 실행하여 OAuth 인증');
    console.log('3. 생성된 Refresh Token을 .env에 추가');
    console.log('4. npm run google 실행하여 연결 테스트\n');
  } else if (!process.env.GOOGLE_REFRESH_TOKEN) {
    console.log('⚠️ OAuth 인증이 필요합니다.\n');
    console.log('다음 단계를 진행하세요:');
    console.log('1. npm run oauth:google 실행');
    console.log('2. 브라우저에서 Google 계정으로 로그인');
    console.log('3. 생성된 Refresh Token을 .env에 추가');
    console.log('4. npm run google 실행하여 연결 테스트\n');
  } else {
    console.log('✅ 모든 설정이 완료되었습니다!\n');
    console.log('다음 명령어로 테스트하세요:');
    console.log('- npm run google     (Google Services 연결 테스트)');
    console.log('- npm run pipeline   (전체 파이프라인 실행)\n');
  }

  // 5. 403 에러 해결 가이드
  if (hasErrors) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💡 403 에러 해결 방법');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('403 에러가 발생한다면 다음을 확인하세요:\n');

    console.log('1. Redirect URI 확인:');
    console.log('   - credentials.json의 redirect_uris 확인');
    console.log('   - Google Cloud Console의 승인된 리디렉션 URI와 정확히 일치해야 함');
    console.log('   - 대소문자, 슬래시(/) 포함 여부까지 정확히 일치\n');

    console.log('2. 애플리케이션 타입 변경 고려:');
    console.log('   - 현재: 웹 애플리케이션 또는 데스크톱 앱');
    console.log('   - 권장: 데스크톱 앱 (Desktop App)');
    console.log('   - Google Cloud Console에서 새 OAuth 클라이언트 ID 생성\n');

    console.log('3. 테스트 사용자 추가:');
    console.log('   - OAuth 동의 화면 > 테스트 사용자');
    console.log('   - 본인 Google 계정 추가 필수\n');

    console.log('상세 가이드: docs/GOOGLE_OAUTH_SETUP.md\n');
  }
}

checkSetup().catch((error) => {
  console.error('❌ 진단 중 오류 발생:', error);
  process.exit(1);
});

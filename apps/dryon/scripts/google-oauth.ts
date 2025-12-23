/**
 * Google OAuth 인증 스크립트
 * Google Sheets 및 Calendar API 접근을 위한 Refresh Token 생성
 */

import fs from 'fs/promises';
import { google } from 'googleapis';
import readline from 'readline';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 환경변수 로드
const envPath = path.join(__dirname, '../.env');
dotenv.config({ path: envPath, override: true });

// OAuth2 Scopes
const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/calendar',
];

const TOKEN_PATH = path.join(__dirname, '../token.json');
const CREDENTIALS_PATH = path.join(__dirname, '../credentials.json');

/**
 * credentials.json 파일 읽기
 */
async function loadCredentials() {
  try {
    const content = await fs.readFile(CREDENTIALS_PATH, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('❌ credentials.json 파일을 찾을 수 없습니다.');
    console.error('   Google Cloud Console에서 OAuth 클라이언트 ID를 생성하고');
    console.error('   credentials.json 파일을 프로젝트 루트에 저장하세요.');
    throw error;
  }
}

/**
 * OAuth2 클라이언트 생성
 */
function createOAuth2Client(credentials: any) {
  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
  return new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
}

/**
 * 사용자로부터 인증 코드 입력받기
 */
function getAuthCode(authUrl: string): Promise<string> {
  console.log('\n🔗 다음 URL을 브라우저에서 열어주세요:\n');
  console.log(authUrl);
  console.log('\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question('인증 후 받은 코드를 여기에 입력하세요: ', (code) => {
      rl.close();
      resolve(code);
    });
  });
}

/**
 * 새로운 토큰 생성
 */
async function generateNewToken(oauth2Client: any) {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });

  const code = await getAuthCode(authUrl);

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // token.json 파일에 저장
    await fs.writeFile(TOKEN_PATH, JSON.stringify(tokens, null, 2));
    console.log('\n✅ 토큰이 token.json 파일에 저장되었습니다.');

    if (tokens.refresh_token) {
      console.log('\n🔑 Refresh Token:');
      console.log(tokens.refresh_token);
      console.log('\n이 Refresh Token을 .env 파일의 GOOGLE_REFRESH_TOKEN에 추가하세요.\n');

      // .env 파일 업데이트 제안
      console.log('자동으로 .env 파일을 업데이트하시겠습니까? (y/n)');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      rl.question('> ', async (answer) => {
        rl.close();
        if (answer.toLowerCase() === 'y') {
          await updateEnvFile(tokens.refresh_token);
        } else {
          console.log('\n수동으로 .env 파일을 업데이트해주세요:');
          console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
        }
      });
    } else {
      console.log('\n⚠️ Refresh Token이 생성되지 않았습니다.');
      console.log('   access_type: "offline"이 제대로 설정되었는지 확인하세요.');
    }

    return oauth2Client;
  } catch (error) {
    console.error('❌ 토큰 생성 실패:', error);
    throw error;
  }
}

/**
 * .env 파일 업데이트
 */
async function updateEnvFile(refreshToken: string) {
  try {
    const envContent = await fs.readFile(envPath, 'utf-8');
    const updatedContent = envContent.replace(
      /GOOGLE_REFRESH_TOKEN=.*/,
      `GOOGLE_REFRESH_TOKEN=${refreshToken}`
    );
    await fs.writeFile(envPath, updatedContent);
    console.log('\n✅ .env 파일이 업데이트되었습니다!');
    console.log('\n이제 다음을 실행하여 Google Services를 활성화하세요:');
    console.log('  1. .env 파일에서 GOOGLE_SHEETS_ENABLED=true 설정');
    console.log('  2. .env 파일에서 GOOGLE_CALENDAR_ENABLED=true 설정');
    console.log('  3. npm run google 실행하여 테스트');
  } catch (error) {
    console.error('❌ .env 파일 업데이트 실패:', error);
  }
}

/**
 * 기존 토큰 로드
 */
async function loadSavedToken(oauth2Client: any) {
  try {
    const content = await fs.readFile(TOKEN_PATH, 'utf-8');
    const tokens = JSON.parse(content);
    oauth2Client.setCredentials(tokens);
    console.log('✅ 저장된 토큰을 로드했습니다.');
    return oauth2Client;
  } catch (error) {
    return null;
  }
}

/**
 * 메인 함수
 */
async function main() {
  console.log('🔐 Google OAuth 인증 시작...\n');

  try {
    // 1. credentials.json 로드
    const credentials = await loadCredentials();
    console.log('✅ credentials.json 파일 로드 완료');

    // 2. OAuth2 클라이언트 생성
    const oauth2Client = createOAuth2Client(credentials);
    console.log('✅ OAuth2 클라이언트 생성 완료');

    // 3. 기존 토큰 확인
    const savedToken = await loadSavedToken(oauth2Client);

    if (savedToken) {
      console.log('\n✅ 이미 인증이 완료되었습니다!');
      console.log('\ntoken.json 파일에서 refresh_token을 확인하세요.');

      const tokenContent = await fs.readFile(TOKEN_PATH, 'utf-8');
      const tokens = JSON.parse(tokenContent);

      if (tokens.refresh_token) {
        console.log('\n🔑 Refresh Token:');
        console.log(tokens.refresh_token);
        console.log('\n이 토큰을 .env 파일의 GOOGLE_REFRESH_TOKEN에 추가하세요.');
      }
    } else {
      // 4. 새 토큰 생성
      console.log('\n새로운 인증이 필요합니다.');
      await generateNewToken(oauth2Client);
    }
  } catch (error) {
    console.error('\n❌ 오류 발생:', error);
    process.exit(1);
  }
}

main();

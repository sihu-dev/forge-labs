/**
 * 알림 시스템 테스트 스크립트
 * Email 및 Slack 알림 연결 및 발송 테스트
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 환경변수 로드 (명시적 경로 지정) - MUST load BEFORE any other imports that use config
const envPath = path.join(__dirname, '../.env');
dotenv.config({ path: envPath, override: true });

console.log('📄 .env file path:', envPath);
console.log('🔑 SLACK_WEBHOOK_URL:', process.env.SLACK_WEBHOOK_URL?.substring(0, 50) + '...\n');

// Import notification services AFTER dotenv is loaded
import {
  NotificationManager,
  createNotificationConfigFromEnv,
} from '../src/services/notifications/index.js';
import type { AnalyzedProgram } from '../src/types/index.js';

async function main() {
  console.log('🧪 알림 시스템 테스트 시작...\n');

  // 1. NotificationManager 초기화
  const config = createNotificationConfigFromEnv();
  const notificationManager = new NotificationManager(config);

  console.log('📋 알림 설정:');
  console.log(`  - Email: ${config.email.enabled ? '✅ 활성화' : '❌ 비활성화'}`);
  console.log(`  - Slack: ${config.slack.enabled ? '✅ 활성화' : '❌ 비활성화'}`);
  console.log(`  - 최소 점수 임계값: ${config.minScoreThreshold}점\n`);

  // 2. 연결 테스트
  console.log('🔗 연결 테스트 중...\n');
  const connectionResults = await notificationManager.testConnections();

  console.log('연결 테스트 결과:');
  console.log(`  - Email: ${connectionResults.email ? '✅ 성공' : '❌ 실패'}`);
  console.log(`  - Slack: ${connectionResults.slack ? '✅ 성공' : '❌ 실패'}\n`);

  // 3. 분석된 공고 데이터 로드
  const dataPath = path.join(__dirname, '../data/analyzed-programs.json');
  let programs: AnalyzedProgram[] = [];

  try {
    const content = await fs.readFile(dataPath, 'utf-8');
    const data = JSON.parse(content);
    programs = data.programs || [];
    console.log(`📁 ${programs.length}개 분석된 공고 로드 완료\n`);
  } catch (error) {
    console.error('❌ 분석 데이터를 찾을 수 없습니다. 먼저 npm run analyze를 실행하세요.');
    process.exit(1);
  }

  // 4. 점수 필터링
  const highScorePrograms = programs.filter((p) => p.analysis.score >= 7);
  console.log(`✅ 적합도 7점 이상 공고: ${highScorePrograms.length}개\n`);

  if (highScorePrograms.length === 0) {
    console.log('⚠️ 알림 발송할 공고가 없습니다.');
    return;
  }

  // 5. 테스트 알림 발송
  console.log('📤 테스트 알림 발송 중...\n');

  try {
    await notificationManager.notifyNewPrograms(highScorePrograms);
    console.log('\n✅ 알림 발송 완료!');
    console.log('\n이메일과 Slack 채널을 확인해보세요.');
  } catch (error) {
    console.error('\n❌ 알림 발송 실패:', error);
    process.exit(1);
  }

  // 6. 요약 출력
  console.log('\n' + '='.repeat(60));
  console.log('📊 알림 발송 요약');
  console.log('='.repeat(60));
  console.log(`전체 공고: ${programs.length}개`);
  console.log(`알림 발송: ${highScorePrograms.length}개 (점수 7점 이상)`);
  console.log(`강력추천: ${highScorePrograms.filter((p) => p.analysis.recommendation === '강력추천').length}개`);
  console.log(`HIGH 우선순위: ${highScorePrograms.filter((p) => p.analysis.priority === 'HIGH').length}개`);
  console.log('='.repeat(60) + '\n');
}

main().catch((error) => {
  console.error('❌ 오류 발생:', error);
  process.exit(1);
});

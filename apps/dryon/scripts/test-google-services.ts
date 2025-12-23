/**
 * Google Services 테스트 스크립트
 * Google Sheets 및 Calendar 연동 테스트
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 환경변수 로드 (명시적 경로 지정) - MUST load BEFORE any other imports
const envPath = path.join(__dirname, '../.env');
dotenv.config({ path: envPath, override: true });

console.log('📄 .env file path:', envPath);
console.log('🔑 GOOGLE_REFRESH_TOKEN:', process.env.GOOGLE_REFRESH_TOKEN ? '설정됨' : '설정안됨');
console.log('🔑 GOOGLE_SHEETS_ENABLED:', process.env.GOOGLE_SHEETS_ENABLED);
console.log('🔑 GOOGLE_CALENDAR_ENABLED:', process.env.GOOGLE_CALENDAR_ENABLED, '\n');

async function main() {
  // Import Google services AFTER dotenv is loaded (truly dynamic)
  const { GoogleServicesManager, createGoogleServicesConfigFromEnv } = await import(
    '../src/services/google/index.js'
  );

  console.log('🧪 Google Services 테스트 시작...\n');

  // 1. GoogleServicesManager 초기화
  const config = createGoogleServicesConfigFromEnv();
  const googleManager = new GoogleServicesManager(config);

  console.log('📋 Google Services 설정:');
  console.log(`  - Google Sheets: ${config.sheets.enabled ? '✅ 활성화' : '❌ 비활성화'}`);
  console.log(`  - Google Calendar: ${config.calendar.enabled ? '✅ 활성화' : '❌ 비활성화'}`);
  console.log(`  - 최소 점수 임계값: ${config.minScoreThreshold}점\n`);

  // 2. 연결 테스트
  console.log('🔗 연결 테스트 중...\n');
  const connectionResults = await googleManager.testConnections();

  console.log('연결 테스트 결과:');
  console.log(`  - Google Sheets: ${connectionResults.sheets ? '✅ 성공' : '❌ 실패'}`);
  console.log(`  - Google Calendar: ${connectionResults.calendar ? '✅ 성공' : '❌ 실패'}\n`);

  // 3. 분석된 공고 데이터 로드
  const dataPath = path.join(__dirname, '../data/analyzed-programs.json');
  let programs: Array<{
    title: string;
    organization: string;
    deadline: string;
    analysis: {
      score: number;
      recommendation: string;
      priority: string;
    };
  }> = [];

  try {
    const content = await fs.readFile(dataPath, 'utf-8');
    const data = JSON.parse(content);
    programs = data.programs || [];
    console.log(`📁 ${programs.length}개 분석된 공고 로드 완료\n`);
  } catch {
    console.error('❌ 분석 데이터를 찾을 수 없습니다. 먼저 npm run analyze를 실행하세요.');
    process.exit(1);
  }

  // 4. 점수 필터링
  const highScorePrograms = programs.filter((p) => p.analysis.score >= 7);
  console.log(`✅ 적합도 7점 이상 공고: ${highScorePrograms.length}개\n`);

  if (highScorePrograms.length === 0) {
    console.log('⚠️ 동기화할 공고가 없습니다.');
    return;
  }

  // 5. Google Services 동기화
  console.log('🔄 Google Services 동기화 중...\n');

  try {
    await googleManager.syncPrograms(highScorePrograms);
    console.log('\n✅ Google Services 동기화 완료!');
    console.log('\nGoogle Sheets와 Calendar를 확인해보세요.');
  } catch (error) {
    console.error('\n❌ 동기화 실패:', error);
    process.exit(1);
  }

  // 6. 요약 출력
  console.log('\n' + '='.repeat(60));
  console.log('📊 동기화 요약');
  console.log('='.repeat(60));
  console.log(`전체 공고: ${programs.length}개`);
  console.log(`동기화: ${highScorePrograms.length}개 (점수 7점 이상)`);
  console.log(`강력추천: ${highScorePrograms.filter((p) => p.analysis.recommendation === '강력추천').length}개`);
  console.log(`HIGH 우선순위: ${highScorePrograms.filter((p) => p.analysis.priority === 'HIGH').length}개`);
  console.log('='.repeat(60) + '\n');

  // 7. 동기화된 공고 목록
  console.log('📋 동기화된 공고 목록:\n');
  highScorePrograms
    .sort((a, b) => b.analysis.score - a.analysis.score)
    .forEach((program, index) => {
      console.log(`${index + 1}. ${program.title}`);
      console.log(`   기관: ${program.organization}`);
      console.log(`   마감일: ${new Date(program.deadline).toLocaleDateString('ko-KR')}`);
      console.log(`   점수: ${program.analysis.score}/10 (${program.analysis.recommendation})`);
      console.log(`   우선순위: ${program.analysis.priority}\n`);
    });
}

main().catch((error) => {
  console.error('❌ 오류 발생:', error);
  process.exit(1);
});

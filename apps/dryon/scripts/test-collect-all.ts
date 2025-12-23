/**
 * 전체 수집기 테스트 (AI 분석 제외)
 * 프로덕션 모드로 모든 소스에서 데이터 수집
 */

import { config as dotenvConfig } from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// 개발 모드 비활성화 (import 전에 설정해야 함)
process.env.NODE_ENV = 'production';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenvConfig({ path: path.join(__dirname, '..', '.env') });

// collectors import - 여기서 isDevelopment가 결정됨
import { collectAllPrograms } from '../src/services/collectors/index.js';

async function main() {
  console.log('🚀 전체 수집기 테스트 시작 (프로덕션 모드)...\n');

  try {
    const startTime = Date.now();
    const programs = await collectAllPrograms();
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log(`\n${'='.repeat(80)}`);
    console.log(`📊 수집 결과: 총 ${programs.length}개 사업공고 (${elapsed}초 소요)`);
    console.log(`${'='.repeat(80)}\n`);

    // 소스별 그룹핑
    const bySource = new Map<string, typeof programs>();
    for (const p of programs) {
      const source = p.source || 'unknown';
      if (!bySource.has(source)) bySource.set(source, []);
      bySource.get(source)!.push(p);
    }

    // 소스별 통계
    console.log('📈 소스별 수집 현황:');
    console.log('-'.repeat(40));
    for (const [source, sourcePrograms] of bySource) {
      console.log(`  ${source}: ${sourcePrograms.length}개`);
    }
    console.log('-'.repeat(40));
    console.log(`  총계: ${programs.length}개\n`);

    // 샘플 공고 출력 (최대 10개)
    console.log('📄 수집된 공고 샘플:');
    console.log('-'.repeat(60));
    for (const p of programs.slice(0, 10)) {
      const deadline = new Date(p.deadline).toLocaleDateString('ko-KR');
      console.log(`  📌 ${p.title.slice(0, 50)}${p.title.length > 50 ? '...' : ''}`);
      console.log(`     기관: ${p.organization} | 마감: ${deadline}`);
      console.log(`     소스: ${p.source}`);
      console.log('');
    }

    if (programs.length > 10) {
      console.log(`  ... 외 ${programs.length - 10}개\n`);
    }

    console.log(`✅ 테스트 완료!`);

  } catch (error) {
    console.error('❌ 테스트 실패:', error);
    process.exit(1);
  }
}

main();

/**
 * 테크노파크 크롤러 테스트
 */

import { config as dotenvConfig } from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenvConfig({ path: path.join(__dirname, '..', '.env') });

import { technoparkCrawler } from '../src/services/collectors/technopark-crawler.js';

async function main() {
  console.log('🏭 테크노파크 크롤러 테스트 시작...\n');

  try {
    const programs = await technoparkCrawler.collect();

    console.log(`\n📊 수집 결과: 총 ${programs.length}개 사업공고\n`);
    console.log('=' .repeat(80));

    // 기관별 그룹핑
    const byOrg = new Map<string, typeof programs>();
    for (const p of programs) {
      const org = p.organization;
      if (!byOrg.has(org)) byOrg.set(org, []);
      byOrg.get(org)!.push(p);
    }

    for (const [org, orgPrograms] of byOrg) {
      console.log(`\n🏢 ${org} (${orgPrograms.length}개)`);
      console.log('-'.repeat(60));

      for (const p of orgPrograms.slice(0, 5)) { // 각 기관별 최대 5개만 출력
        const deadline = new Date(p.deadline).toLocaleDateString('ko-KR');
        const status = p.memo?.match(/상태: (\S+)/)?.[1] || '확인필요';
        console.log(`  📄 ${p.title.slice(0, 50)}${p.title.length > 50 ? '...' : ''}`);
        console.log(`     마감: ${deadline} | 상태: ${status}`);
        console.log(`     URL: ${p.url}`);
        console.log('');
      }
    }

    console.log('=' .repeat(80));
    console.log(`\n✅ 테스트 완료!`);

  } catch (error) {
    console.error('❌ 테스트 실패:', error);
    process.exit(1);
  }
}

main();

/**
 * 관광산업포털(touraz.kr) 크롤러 테스트
 */

import { config as dotenvConfig } from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenvConfig({ path: path.join(__dirname, '..', '.env') });

import { tourazCrawler } from '../src/services/collectors/touraz-crawler.js';

async function main() {
  console.log('🛫 관광산업포털(touraz.kr) 크롤러 테스트 시작...\n');

  try {
    const programs = await tourazCrawler.collect();

    console.log(`\n${'='.repeat(80)}`);
    console.log(`📊 수집 결과: 총 ${programs.length}개 사업공고`);
    console.log(`${'='.repeat(80)}\n`);

    // 탭별 그룹핑
    const byTab = new Map<string, typeof programs>();
    for (const p of programs) {
      const tabMatch = p.memo?.match(/\| ([^|]+) \|/);
      const tab = tabMatch ? tabMatch[1].trim() : '기타';
      if (!byTab.has(tab)) byTab.set(tab, []);
      byTab.get(tab)!.push(p);
    }

    // 탭별 출력
    for (const [tab, tabPrograms] of byTab) {
      console.log(`🏢 ${tab} (${tabPrograms.length}개)`);
      console.log('-'.repeat(60));
      for (const p of tabPrograms) {
        const deadline = new Date(p.deadline).toLocaleDateString('ko-KR');
        console.log(`  📄 ${p.title}`);
        console.log(`     마감: ${deadline} | 카테고리: ${p.category}`);
        console.log(`     URL: ${p.url}`);
        console.log('');
      }
    }

    console.log('✅ 테스트 완료!');
  } catch (error) {
    console.error('❌ 테스트 실패:', error);
    process.exit(1);
  }
}

main();

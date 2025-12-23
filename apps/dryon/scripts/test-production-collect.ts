/**
 * 프로덕션 모드 전체 수집기 테스트
 * 실제 API와 크롤러를 사용하여 데이터 수집
 */

import { config as dotenvConfig } from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenvConfig({ path: path.join(__dirname, '..', '.env') });

import { bizinfoCollector } from '../src/services/collectors/bizinfo-collector.js';
import { kstartupCollector } from '../src/services/collectors/kstartup-collector.js';
import { kisedCrawler } from '../src/services/collectors/kised-crawler.js';
import { cceiUniversalCrawler } from '../src/services/collectors/ccei-universal-crawler.js';
import { sbaCrawler } from '../src/services/collectors/sba-crawler.js';
import { financeCrawler } from '../src/services/collectors/finance-crawler.js';
import { technoparkCrawler } from '../src/services/collectors/technopark-crawler.js';
import { agencyCrawler } from '../src/services/collectors/agency-crawler.js';
import { universityCrawler } from '../src/services/collectors/university-crawler.js';
import { ministryCrawler } from '../src/services/collectors/ministry-crawler.js';
import { tourazCrawler } from '../src/services/collectors/touraz-crawler.js';
import type { Program } from '../src/types/index.js';
import pQueue from 'p-queue';

interface CollectorResult {
  name: string;
  programs: Program[];
  error?: Error;
  elapsed: number;
}

async function main() {
  console.log('🚀 프로덕션 모드 전체 수집기 테스트 시작...\n');

  const queue = new pQueue({ concurrency: 5 });
  const results: CollectorResult[] = [];

  // 수집기 목록
  const collectors = [
    { name: 'Bizinfo API', collector: () => bizinfoCollector.collect() },
    { name: 'K-Startup API', collector: () => kstartupCollector.collect() },
    { name: 'KISED 크롤러', collector: () => kisedCrawler.collect() },
    { name: 'CCEI (17개)', collector: () => cceiUniversalCrawler.collect() },
    { name: 'SBA 크롤러', collector: () => sbaCrawler.collect() },
    { name: 'Finance (3개)', collector: () => financeCrawler.collect() },
    { name: 'Technopark (17개)', collector: () => technoparkCrawler.collect() },
    { name: 'Agency (5개)', collector: () => agencyCrawler.collect() },
    { name: 'University (6개)', collector: () => universityCrawler.collect() },
    { name: 'Ministry (8개)', collector: () => ministryCrawler.collect() },
    { name: 'Touraz (관광산업)', collector: () => tourazCrawler.collect() },
  ];

  const startTime = Date.now();

  // 병렬 수집
  const tasks = collectors.map(({ name, collector }) =>
    queue.add(async () => {
      const taskStart = Date.now();
      try {
        console.log(`  ⏳ ${name} 수집 시작...`);
        const programs = await collector();
        const elapsed = (Date.now() - taskStart) / 1000;
        console.log(`  ✅ ${name}: ${programs.length}개 (${elapsed.toFixed(1)}초)`);
        results.push({ name, programs, elapsed });
      } catch (error) {
        const elapsed = (Date.now() - taskStart) / 1000;
        console.log(`  ❌ ${name}: 실패 (${elapsed.toFixed(1)}초)`);
        results.push({ name, programs: [], error: error as Error, elapsed });
      }
    })
  );

  await Promise.all(tasks);

  const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  // 결과 출력
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📊 수집 결과 요약 (총 ${totalElapsed}초 소요)`);
  console.log(`${'='.repeat(80)}\n`);

  // 소스별 통계
  console.log('📈 소스별 수집 현황:');
  console.log('-'.repeat(50));

  let totalPrograms = 0;
  let successCount = 0;

  for (const result of results) {
    const status = result.error ? '❌' : '✅';
    const count = result.programs.length;
    totalPrograms += count;
    if (!result.error && count > 0) successCount++;

    console.log(`  ${status} ${result.name.padEnd(20)} ${String(count).padStart(5)}개  (${result.elapsed.toFixed(1)}초)`);
  }

  console.log('-'.repeat(50));
  console.log(`  총계: ${totalPrograms}개 (${successCount}/${results.length} 소스 성공)\n`);

  // 모든 프로그램 합치기
  const allPrograms = results.flatMap(r => r.programs);

  // 중복 제거
  const seen = new Set<string>();
  const uniquePrograms = allPrograms.filter(p => {
    const key = `${p.title.trim()}_${p.organization.trim()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  console.log(`📊 중복 제거 후: ${uniquePrograms.length}개 (원본: ${allPrograms.length}개)\n`);

  // 마감 임박 공고
  const now = new Date();
  const urgent = uniquePrograms.filter(p => {
    const deadline = new Date(p.deadline);
    const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysLeft >= 0 && daysLeft <= 14;
  });

  if (urgent.length > 0) {
    console.log(`🚨 마감 임박 공고 (D-14 이내): ${urgent.length}개`);
    console.log('-'.repeat(60));
    for (const p of urgent.slice(0, 10)) {
      const deadline = new Date(p.deadline);
      const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      console.log(`  📌 [D-${daysLeft}] ${p.title.slice(0, 45)}${p.title.length > 45 ? '...' : ''}`);
      console.log(`     기관: ${p.organization}`);
      console.log(`     소스: ${p.source}\n`);
    }
    if (urgent.length > 10) {
      console.log(`  ... 외 ${urgent.length - 10}개\n`);
    }
  }

  // 최근 수집된 공고 샘플
  console.log('📄 최근 수집된 공고 샘플 (최대 15개):');
  console.log('-'.repeat(60));
  for (const p of uniquePrograms.slice(0, 15)) {
    const deadline = new Date(p.deadline).toLocaleDateString('ko-KR');
    console.log(`  📌 ${p.title.slice(0, 50)}${p.title.length > 50 ? '...' : ''}`);
    console.log(`     기관: ${p.organization} | 마감: ${deadline}`);
    console.log(`     소스: ${p.source}`);
    if (p.url) console.log(`     URL: ${p.url}`);
    console.log('');
  }

  if (uniquePrograms.length > 15) {
    console.log(`  ... 외 ${uniquePrograms.length - 15}개\n`);
  }

  console.log('✅ 테스트 완료!');
}

main().catch(error => {
  console.error('❌ 테스트 실패:', error);
  process.exit(1);
});

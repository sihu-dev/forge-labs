/**
 * 공고 수집 전용 스크립트
 * Claude Code에서 분석하기 위해 JSON으로 저장
 */

import { collectAllPrograms } from '../src/services/collectors/index.js';
import { log } from '../src/utils/logger.js';
import fs from 'fs';
import path from 'path';

async function collectAndSave() {
  try {
    log.info('🚀 Starting program collection...');

    // 공고 수집
    const programs = await collectAllPrograms();

    // 결과 저장 경로
    const outputDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, 'collected-programs.json');
    const timestamp = new Date().toISOString();

    const output = {
      collectedAt: timestamp,
      totalCount: programs.length,
      programs: programs.map((p) => ({
        id: p.id,
        title: p.title,
        organization: p.organization,
        category: p.category,
        target: p.target,
        deadline: p.deadline,
        url: p.url,
        memo: p.memo,
        source: p.source,
      })),
    };

    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');

    log.info(`✅ Collected ${programs.length} programs`);
    log.info(`📁 Saved to: ${outputPath}`);
    log.info('');
    log.info('🤖 Next step: Ask Claude Code to analyze these programs!');
    log.info('   Copy this prompt:');
    log.info('');
    log.info(
      '   "data/collected-programs.json 파일을 읽고, 각 공고를 ZZIK 사업 관점에서 분석해서 분석 결과 JSON을 만들어줘"'
    );

    return programs;
  } catch (error) {
    log.error('Failed to collect programs', error);
    throw error;
  }
}

// 실행
collectAndSave();

/**
 * 수집된 공고를 AI로 분석하는 스크립트
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { ProgramAnalyzer } from '../src/services/ai/analyzer.js';
import type { Program, MyBusiness, AnalyzedProgram } from '../src/types/index.js';
import { log } from '../src/utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 수집된 공고 파일 읽기
 */
async function loadCollectedPrograms(): Promise<Program[]> {
  const filePath = path.join(__dirname, '../data/collected-programs.json');

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(content);
    return data.programs || [];
  } catch (error) {
    log.error('공고 파일 읽기 실패', error);
    throw new Error('collected-programs.json 파일을 찾을 수 없습니다.');
  }
}

/**
 * 내 사업 정보 읽기
 */
async function loadMyBusiness(): Promise<MyBusiness> {
  const filePath = path.join(__dirname, '../config/my-business.json');

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    log.warn('사업 정보 파일 없음, 기본값 사용');
    // 기본 사업 정보 (ZZIK 예시)
    return {
      serviceName: 'ZZIK (찍)',
      item: '위치기반 여행 경로 추천 서비스',
      field: 'AI/LBS/관광테크',
      stage: '초기 (MVP 개발 중)',
      team: '2인 (개발자 2명)',
      techStack: 'Next.js, React, TypeScript, Python, AI/ML',
      additionalInfo: {
        targetMarket: '국내 여행객 (20-30대)',
        uniqueValue: 'AI 기반 개인 맞춤형 여행 경로 자동 생성',
        currentProgress: 'MVP 개발 중, 베타 테스트 준비',
      },
    };
  }
}

/**
 * 분석 결과 저장
 */
async function saveAnalyzedPrograms(
  analyzedPrograms: AnalyzedProgram[]
): Promise<void> {
  const filePath = path.join(__dirname, '../data/analyzed-programs.json');

  const output = {
    analyzedAt: new Date().toISOString(),
    totalCount: analyzedPrograms.length,
    highPriority: analyzedPrograms.filter((p) => p.analysis.priority === 'HIGH').length,
    recommended: analyzedPrograms.filter(
      (p) => p.analysis.recommendation === '강력추천' || p.analysis.recommendation === '추천'
    ).length,
    programs: analyzedPrograms,
  };

  await fs.writeFile(filePath, JSON.stringify(output, null, 2), 'utf-8');
  log.info(`📁 분석 결과 저장: ${filePath}`);
}

/**
 * 분석 결과 요약 출력
 */
function printSummary(analyzedPrograms: AnalyzedProgram[]): void {
  console.log('\n' + '='.repeat(60));
  console.log('📊 분석 결과 요약');
  console.log('='.repeat(60));

  // 추천도별 통계
  const byRecommendation = {
    강력추천: analyzedPrograms.filter((p) => p.analysis.recommendation === '강력추천').length,
    추천: analyzedPrograms.filter((p) => p.analysis.recommendation === '추천').length,
    검토필요: analyzedPrograms.filter((p) => p.analysis.recommendation === '검토필요').length,
    부적합: analyzedPrograms.filter((p) => p.analysis.recommendation === '부적합').length,
  };

  console.log('\n[추천도별 분포]');
  console.log(`  🌟 강력추천: ${byRecommendation.강력추천}개`);
  console.log(`  ⭐ 추천: ${byRecommendation.추천}개`);
  console.log(`  🔍 검토필요: ${byRecommendation.검토필요}개`);
  console.log(`  ❌ 부적합: ${byRecommendation.부적합}개`);

  // 우선순위별 통계
  const byPriority = {
    HIGH: analyzedPrograms.filter((p) => p.analysis.priority === 'HIGH').length,
    MEDIUM: analyzedPrograms.filter((p) => p.analysis.priority === 'MEDIUM').length,
    LOW: analyzedPrograms.filter((p) => p.analysis.priority === 'LOW').length,
  };

  console.log('\n[우선순위별 분포]');
  console.log(`  🔴 HIGH: ${byPriority.HIGH}개`);
  console.log(`  🟡 MEDIUM: ${byPriority.MEDIUM}개`);
  console.log(`  🟢 LOW: ${byPriority.LOW}개`);

  // TOP 3 추천 공고
  const topPrograms = ProgramAnalyzer.filterAndSort(analyzedPrograms, {
    minScore: 7,
  }).slice(0, 3);

  if (topPrograms.length > 0) {
    console.log('\n[TOP 3 추천 공고]');
    topPrograms.forEach((p, idx) => {
      console.log(`\n  ${idx + 1}. ${p.title}`);
      console.log(`     기관: ${p.organization}`);
      console.log(`     점수: ${p.analysis.score}/10 (${p.analysis.recommendation})`);
      console.log(`     우선순위: ${p.analysis.priority}`);
      console.log(`     매칭 이유: ${p.analysis.matchReasons[0] || 'N/A'}`);
      console.log(`     마감일: ${new Date(p.deadline).toLocaleDateString('ko-KR')}`);
    });
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ 분석 완료! analyzed-programs.json 파일을 확인하세요.');
  console.log('='.repeat(60) + '\n');
}

/**
 * 메인 실행 함수
 */
async function main() {
  try {
    console.log('🚀 AI 분석 시작...\n');

    // API 키 확인 (OpenAI 또는 Anthropic)
    const openaiKey = process.env.OPENAI_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    if (!openaiKey && !anthropicKey) {
      throw new Error(
        'OPENAI_API_KEY 또는 ANTHROPIC_API_KEY 환경변수가 설정되지 않았습니다. .env 파일을 확인하세요.'
      );
    }

    const apiKey = openaiKey || anthropicKey;
    console.log(`🔑 Using ${openaiKey ? 'OpenAI' : 'Anthropic'} API\n`);

    // 1. 데이터 로드
    log.info('📂 데이터 로딩 중...');
    const programs = await loadCollectedPrograms();
    const myBusiness = await loadMyBusiness();

    log.info(`✅ ${programs.length}개 공고 로드 완료`);
    log.info(`✅ 사업 정보 로드: ${myBusiness.serviceName}`);

    // 2. AI 분석 실행
    const analyzer = new ProgramAnalyzer(apiKey);
    const analyzedPrograms = await analyzer.analyzePrograms(programs, myBusiness);

    // 3. 결과 저장
    await saveAnalyzedPrograms(analyzedPrograms);

    // 4. 요약 출력
    printSummary(analyzedPrograms);

  } catch (error) {
    log.error('분석 실패', error);
    console.error('\n❌ 에러 발생:', error);
    process.exit(1);
  }
}

// 스크립트 실행
main();

/**
 * AI 분석 시뮬레이션 (API 키 없이 테스트용)
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Program, AnalyzedProgram, MyBusiness } from '../src/types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ZZIK 사업 정보
const myBusiness: MyBusiness = {
  serviceName: 'ZZIK (찍)',
  item: 'AI 기반 위치기반 여행 경로 추천 서비스',
  field: 'AI/LBS/관광테크',
  stage: '초기 단계 (MVP 개발 중)',
  team: '2인 팀 (개발자 2명)',
  techStack: 'Next.js, React, TypeScript, Python, FastAPI, PostgreSQL, OpenAI API, Google Maps API',
};

// Mock AI 분석 함수
function mockAnalyze(program: Program): AnalyzedProgram {
  // 제목과 메모로 적합도 판단
  const title = program.title.toLowerCase();
  const memo = program.memo?.toLowerCase() || '';
  const category = program.category?.toLowerCase() || '';

  let score = 5;
  let recommendation: '강력추천' | '추천' | '검토필요' | '부적합' = '검토필요';
  let priority: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
  const matchReasons: string[] = [];
  const concerns: string[] = [];
  const keyEvaluationCriteria: string[] = [];
  const preparationTips: string[] = [];
  let estimatedBudget = '';

  // AI/LBS/관광 키워드 매칭
  if (memo.includes('ai') || memo.includes('인공지능')) {
    score += 2;
    matchReasons.push('AI 기술 활용 분야로 우리 사업과 완벽히 일치');
  }

  if (memo.includes('lbs') || memo.includes('위치기반')) {
    score += 2;
    matchReasons.push('위치기반 서비스(LBS) 분야가 핵심 지원 분야');
  }

  if (memo.includes('관광') || memo.includes('여행')) {
    score += 2;
    matchReasons.push('관광/여행 분야 적용으로 우리 서비스와 정확히 일치');
  }

  if (category.includes('ai') || category.includes('sw')) {
    score += 1;
    matchReasons.push('카테고리가 AI/SW 분야로 적합');
  }

  if (memo.includes('초기') || memo.includes('예비창업')) {
    score += 1;
    matchReasons.push('초기 단계 스타트업 대상으로 우리 사업 단계와 일치');
  }

  // 점수에 따른 추천도 및 우선순위
  if (score >= 9) {
    recommendation = '강력추천';
    priority = 'HIGH';
  } else if (score >= 7) {
    recommendation = '추천';
    priority = 'HIGH';
  } else if (score >= 5) {
    recommendation = '검토필요';
    priority = 'MEDIUM';
  } else {
    recommendation = '부적합';
    priority = 'LOW';
  }

  // 마감일 체크
  const deadline = new Date(program.deadline);
  const daysLeft = Math.floor((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (daysLeft < 14) {
    concerns.push(`마감일까지 ${daysLeft}일 남음 - 긴급 준비 필요`);
    if (score >= 7) priority = 'HIGH';
  } else if (daysLeft < 30) {
    concerns.push(`마감일까지 ${daysLeft}일 남음`);
  }

  // 예상 지원금 추출
  if (memo.includes('1억')) {
    estimatedBudget = '최대 1억원';
  } else if (memo.includes('1.5억')) {
    estimatedBudget = '최대 1.5억원';
  } else if (memo.includes('5천만')) {
    estimatedBudget = '최대 5천만원';
  } else if (memo.includes('7천만')) {
    estimatedBudget = 'R&D 최대 7천만원 + 실증 3천만원';
  }

  // 평가 기준 추출
  if (memo.includes('기술혁신성')) keyEvaluationCriteria.push('기술혁신성');
  if (memo.includes('사업성')) keyEvaluationCriteria.push('사업성');
  if (memo.includes('팀역량')) keyEvaluationCriteria.push('팀 역량');
  if (memo.includes('완성도')) keyEvaluationCriteria.push('기술 완성도');
  if (memo.includes('사업화')) keyEvaluationCriteria.push('사업화 가능성');

  // 준비 팁
  if (score >= 7) {
    preparationTips.push('AI 기반 경로 추천 알고리즘의 차별성을 명확히 제시');
    preparationTips.push('MVP 개발 현황과 베타 테스트 계획 구체화');
    preparationTips.push('관광 산업 기여도 및 사회적 가치 강조');
    if (memo.includes('관광')) {
      preparationTips.push('한국관광공사와의 협력 방안 제시');
    }
  }

  // 기본 우려사항
  if (concerns.length === 0) {
    concerns.push('경쟁률이 높을 것으로 예상됨');
  }

  return {
    ...program,
    analysis: {
      score: Math.min(score, 10),
      recommendation,
      matchReasons,
      concerns,
      keyEvaluationCriteria,
      preparationTips,
      estimatedBudget,
      priority,
    },
    analyzedAt: new Date().toISOString(),
  };
}

async function main() {
  try {
    console.log('🚀 Mock AI 분석 시작...\n');

    // 수집된 공고 로드
    const filePath = path.join(__dirname, '../data/collected-programs.json');
    const content = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(content);
    const programs: Program[] = data.programs || [];

    console.log(`✅ ${programs.length}개 공고 로드 완료`);
    console.log(`✅ 사업 정보: ${myBusiness.serviceName}\n`);

    // Mock 분석 실행
    const analyzedPrograms: AnalyzedProgram[] = programs.map(mockAnalyze);

    // 결과 저장
    const outputPath = path.join(__dirname, '../data/analyzed-programs.json');
    const output = {
      analyzedAt: new Date().toISOString(),
      totalCount: analyzedPrograms.length,
      highPriority: analyzedPrograms.filter((p) => p.analysis.priority === 'HIGH').length,
      recommended: analyzedPrograms.filter(
        (p) => p.analysis.recommendation === '강력추천' || p.analysis.recommendation === '추천'
      ).length,
      programs: analyzedPrograms,
    };

    await fs.writeFile(outputPath, JSON.stringify(output, null, 2), 'utf-8');
    console.log(`📁 분석 결과 저장: ${outputPath}\n`);

    // 요약 출력
    console.log('='.repeat(60));
    console.log('📊 분석 결과 요약');
    console.log('='.repeat(60));

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

    const byPriority = {
      HIGH: analyzedPrograms.filter((p) => p.analysis.priority === 'HIGH').length,
      MEDIUM: analyzedPrograms.filter((p) => p.analysis.priority === 'MEDIUM').length,
      LOW: analyzedPrograms.filter((p) => p.analysis.priority === 'LOW').length,
    };

    console.log('\n[우선순위별 분포]');
    console.log(`  🔴 HIGH: ${byPriority.HIGH}개`);
    console.log(`  🟡 MEDIUM: ${byPriority.MEDIUM}개`);
    console.log(`  🟢 LOW: ${byPriority.LOW}개`);

    // TOP 추천 공고
    const topPrograms = analyzedPrograms
      .filter((p) => p.analysis.score >= 7)
      .sort((a, b) => b.analysis.score - a.analysis.score);

    if (topPrograms.length > 0) {
      console.log('\n[적합도 7점 이상 추천 공고]');
      topPrograms.forEach((p, idx) => {
        console.log(`\n  ${idx + 1}. ${p.title}`);
        console.log(`     기관: ${p.organization}`);
        console.log(`     점수: ${p.analysis.score}/10 (${p.analysis.recommendation})`);
        console.log(`     우선순위: ${p.analysis.priority}`);
        console.log(`     매칭 이유: ${p.analysis.matchReasons[0] || 'N/A'}`);
        console.log(`     마감일: ${new Date(p.deadline).toLocaleDateString('ko-KR')}`);
        if (p.analysis.estimatedBudget) {
          console.log(`     예상 지원금: ${p.analysis.estimatedBudget}`);
        }
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Mock 분석 완료! analyzed-programs.json 파일을 확인하세요.');
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ 에러 발생:', error);
    process.exit(1);
  }
}

main();

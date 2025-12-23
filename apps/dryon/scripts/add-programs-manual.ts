/**
 * 수동으로 공고를 Google Sheets 및 Calendar에 추가
 */

import { config as dotenvConfig } from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenvConfig({ path: path.join(__dirname, '..', '.env') });

import { google } from 'googleapis';
import { config } from '../src/config/index.js';
import { googleCalendarService } from '../src/services/integrations/google-calendar.js';
import type { AnalyzedProgram } from '../src/types/index.js';

// 추가할 공고 데이터
const programsToAdd: AnalyzedProgram[] = [
  {
    id: 'ctp-2708806',
    title: '2026년 지역디지털기업성장지원사업 (SW서비스사업화, 선도기업사업화) 기업 모집 공고',
    organization: '충남테크노파크',
    category: 'SW/디지털',
    target: '지역 SW/디지털 기업',
    deadline: '2025-12-31T23:59:59.000Z', // 공고문에서 정확한 마감일 확인 필요
    startDate: '2025-12-01T00:00:00.000Z',
    source: 'technopark',
    url: 'https://ctp.or.kr/business/datadetail.do?seq=2708806',
    memo: '충남테크노파크 | SW서비스사업화, 선도기업사업화 지원 | 문의: 041.589.0602',
    analysis: {
      score: 8,
      recommendation: '추천',
      matchReasons: [
        'SW/디지털 기업 대상 지원사업',
        '지역 기반 성장 지원',
        'SW서비스 사업화 및 선도기업 육성 목적',
      ],
      concerns: [
        '충남 지역 소재 기업 우선일 수 있음',
        '상세 자격요건 첨부파일 확인 필요',
      ],
      keyEvaluationCriteria: [
        '기술력 및 사업성',
        '성장 잠재력',
        '지역 경제 기여도',
      ],
      preparationTips: [
        '첨부된 예비선도기업 자격요건표 확인',
        '사업계획서 및 기술력 증빙자료 준비',
      ],
      priority: 'HIGH',
    },
    analyzedAt: new Date().toISOString(),
  },
  {
    id: 'touraz-seoul-2026',
    title: '2026년도 서울관광기업지원센터 입주기업 추가모집',
    organization: '한국관광공사 (서울관광기업지원센터)',
    category: '입주지원',
    target: '창업 7년 이내 관광 기업 (법인/개인사업자)',
    deadline: '2025-12-15T15:00:00.000Z',
    startDate: '2025-12-01T09:00:00.000Z',
    source: 'touraz',
    url: 'https://touraz.kr/announcementList/pssrpView?pageClick=main2&pssrpSeqEnc=KPr*RLfSK6EK959GfjglwQ==',
    memo: '관광산업포털 | 6인실 1개실 모집 | 입주기간: 2026.2~12월 | 담당: 관광기업협력팀 박지은 매니저 (02-729-9419)',
    analysis: {
      score: 8,
      recommendation: '추천',
      matchReasons: [
        '임차료 및 관리비 지원',
        '원스톱 상담서비스 및 전문가 멘토링 제공',
        '서울 중심가 입주 기회',
      ],
      concerns: [
        '관광 관련 사업 필수',
        '창업 7년 이내 제한',
        '1개실만 모집 (경쟁률 높을 수 있음)',
      ],
      keyEvaluationCriteria: [
        '관광 사업 관련성',
        '사업 지속가능성',
        '창의성 및 성장 잠재력',
      ],
      preparationTips: [
        '관광 관련 사업임을 명확히 증명',
        '창업일자 및 사업자등록증 준비',
        '사업계획서에 공간 활용 계획 포함',
      ],
      priority: 'HIGH',
    },
    analyzedAt: new Date().toISOString(),
  },
];

async function main() {
  console.log('📝 수동 공고 추가 시작...\n');

  // Google Sheets API 초기화
  const auth = new google.auth.OAuth2(
    config.google.clientId,
    config.google.clientSecret,
    config.google.redirectUri
  );

  auth.setCredentials({
    refresh_token: config.google.refreshToken,
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const SHEET_NAME = '공고목록';

  try {
    // 1. Google Sheets에 추가
    // 헤더 순서: 분석일시, 공고ID, 공고명, 기관, 카테고리, 대상, 마감일, 적합도, 추천도, 우선순위, 예상 지원금, 매칭 이유, 준비 팁, 주의사항, 공고 URL, 비고
    console.log('📊 Google Sheets에 공고 추가 중...');

    const values = programsToAdd.map((p) => [
      p.analyzedAt, // 분석일시
      p.id, // 공고ID
      p.title, // 공고명
      p.organization, // 기관
      p.category || '', // 카테고리
      p.target || '', // 대상
      new Date(p.deadline).toLocaleDateString('ko-KR'), // 마감일
      p.analysis.score, // 적합도
      p.analysis.recommendation, // 추천도
      p.analysis.priority, // 우선순위
      p.analysis.estimatedBudget || '', // 예상 지원금
      p.analysis.matchReasons.join(', '), // 매칭 이유
      p.analysis.preparationTips.join(', '), // 준비 팁
      p.analysis.concerns.join(', '), // 주의사항
      p.url || '', // 공고 URL
      p.memo || '', // 비고
    ]);

    await sheets.spreadsheets.values.append({
      spreadsheetId: config.google.spreadsheetId,
      range: `${SHEET_NAME}!A:P`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values },
    });

    console.log('✅ Google Sheets 추가 완료!\n');

    // 2. Google Calendar에 마감일 추가
    console.log('📅 Google Calendar에 마감일 추가 중...');
    const calendar = google.calendar({ version: 'v3', auth });

    for (const program of programsToAdd) {
      try {
        const deadlineDate = new Date(program.deadline);
        const dateStr = deadlineDate.toISOString().split('T')[0]; // YYYY-MM-DD 형식

        const event = {
          summary: `[마감] ${program.title}`,
          description: `주관기관: ${program.organization}
적합도: ${program.analysis.score}점 (${program.analysis.recommendation})
우선순위: ${program.analysis.priority}

매칭이유:
${program.analysis.matchReasons.join('\n')}

준비사항:
${program.analysis.preparationTips.join('\n')}

${program.url ? `상세보기: ${program.url}` : ''}`.trim(),
          start: {
            date: dateStr,
            timeZone: 'Asia/Seoul',
          },
          end: {
            date: dateStr,
            timeZone: 'Asia/Seoul',
          },
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'email', minutes: 24 * 60 * 3 }, // 3일 전
              { method: 'popup', minutes: 24 * 60 }, // 1일 전
            ],
          },
          colorId: program.analysis.priority === 'HIGH' ? '11' : program.analysis.priority === 'MEDIUM' ? '5' : '2',
        };

        await calendar.events.insert({
          calendarId: config.google.calendarId,
          requestBody: event,
        });

        console.log(`  ✅ 캘린더 추가: ${program.title.slice(0, 40)}...`);
      } catch (error: any) {
        console.error(`  ❌ 캘린더 추가 실패: ${program.title.slice(0, 30)}...`, error?.message);
      }
    }
    console.log('✅ Google Calendar 추가 완료!\n');

    // 결과 출력
    console.log('='.repeat(60));
    console.log('📋 추가된 공고:');
    console.log('='.repeat(60));
    for (const p of programsToAdd) {
      const deadline = new Date(p.deadline).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      console.log(`\n📌 ${p.title}`);
      console.log(`   기관: ${p.organization}`);
      console.log(`   마감: ${deadline}`);
      console.log(`   URL: ${p.url}`);
    }

    console.log('\n✅ 모든 작업 완료!');
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

main();

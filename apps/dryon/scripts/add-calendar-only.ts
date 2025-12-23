/**
 * 캘린더에만 이벤트 추가
 */

import { config as dotenvConfig } from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenvConfig({ path: path.join(__dirname, '..', '.env') });

import { google } from 'googleapis';
import { config } from '../src/config/index.js';

// 추가할 공고 데이터
const programsToAdd = [
  {
    title: '2026년 지역디지털기업성장지원사업 (SW서비스사업화, 선도기업사업화) 기업 모집 공고',
    organization: '충남테크노파크',
    deadline: '2025-12-31',
    url: 'https://ctp.or.kr/business/datadetail.do?seq=2708806',
    matchReasons: [
      'SW/디지털 기업 대상 지원사업',
      '지역 기반 성장 지원',
      'SW서비스 사업화 및 선도기업 육성 목적',
    ],
    preparationTips: [
      '첨부된 예비선도기업 자격요건표 확인',
      '사업계획서 및 기술력 증빙자료 준비',
    ],
  },
  {
    title: '2026년도 서울관광기업지원센터 입주기업 추가모집',
    organization: '한국관광공사 (서울관광기업지원센터)',
    deadline: '2025-12-15',
    url: 'https://touraz.kr/announcementList/pssrpView?pageClick=main2&pssrpSeqEnc=KPr*RLfSK6EK959GfjglwQ==',
    matchReasons: [
      '임차료 및 관리비 지원',
      '원스톱 상담서비스 및 전문가 멘토링 제공',
      '서울 중심가 입주 기회',
    ],
    preparationTips: [
      '관광 관련 사업임을 명확히 증명',
      '창업일자 및 사업자등록증 준비',
      '사업계획서에 공간 활용 계획 포함',
    ],
  },
];

async function main() {
  console.log('📅 Google Calendar에 마감일 추가 중...\n');

  const auth = new google.auth.OAuth2(
    config.google.clientId,
    config.google.clientSecret,
    config.google.redirectUri
  );

  auth.setCredentials({
    refresh_token: config.google.refreshToken,
  });

  const calendar = google.calendar({ version: 'v3', auth });

  for (const program of programsToAdd) {
    try {
      const event = {
        summary: `[마감] ${program.title}`,
        description: `주관기관: ${program.organization}
적합도: 8점 (추천)
우선순위: HIGH

매칭이유:
${program.matchReasons.join('\n')}

준비사항:
${program.preparationTips.join('\n')}

상세보기: ${program.url}`.trim(),
        start: {
          date: program.deadline,
          timeZone: 'Asia/Seoul',
        },
        end: {
          date: program.deadline,
          timeZone: 'Asia/Seoul',
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 * 3 }, // 3일 전
            { method: 'popup', minutes: 24 * 60 }, // 1일 전
          ],
        },
        colorId: '11', // 빨강 (HIGH priority)
      };

      await calendar.events.insert({
        calendarId: config.google.calendarId,
        requestBody: event,
      });

      console.log(`✅ 캘린더 추가 완료: ${program.title.slice(0, 50)}...`);
      console.log(`   마감일: ${program.deadline}`);
      console.log('');
    } catch (error: any) {
      console.error(`❌ 캘린더 추가 실패: ${program.title.slice(0, 30)}...`);
      console.error(`   오류: ${error?.message}`);
      console.log('');
    }
  }

  console.log('✅ 모든 작업 완료!');
}

main();

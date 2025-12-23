#!/usr/bin/env node
/**
 * BIDFLOW DB 마이그레이션 스크립트
  * Supabase REST API 사용
   */

const fs = require('fs');
const path = require('path');

// 환경변수에서 Supabase 설정 로드
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 환경변수 검증
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('❌ 환경변수가 설정되지 않았습니다.');
    console.error('SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY를 설정해주세요.');
    process.exit(1);
}

async function testConnection() {
    console.log('🔗 Supabase 연결 테스트...\n');

    try {
          // REST API 테스트
          const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
                  headers: {
                            'apikey': SERVICE_ROLE_KEY,
                            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                  },
          });

          if (response.ok) {
                  console.log('✅ REST API 연결 성공!');
                  return true;
          } else {
                  console.log('❌ REST API 연결 실패:', response.status);
                  return false;
          }
    } catch (error) {
          console.error('❌ 연결 오류:', error.message);
          return false;
    }
}

// 스크립트 실행
testConnection();

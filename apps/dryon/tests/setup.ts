/**
 * Jest 테스트 환경 설정
 * 환경 변수 모킹
 */

// 필수 환경 변수 모킹
process.env.ANTHROPIC_API_KEY = 'test-key';
process.env.BIZINFO_API_KEY = 'test-key';
process.env.KSTARTUP_API_KEY = 'test-key';
process.env.GOOGLE_CLIENT_ID = 'test-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
process.env.GOOGLE_REFRESH_TOKEN = 'test-refresh-token';
process.env.GOOGLE_SPREADSHEET_ID = 'test-spreadsheet-id';
process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/test';
process.env.NODE_ENV = 'test';

// Mock axios to avoid real network calls during tests
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Provide simple canned responses for public API endpoints used in tests
mockedAxios.get.mockImplementation(async (url: string) => {
  if (typeof url === 'string' && url.includes('3034791')) {
    // Bizinfo response
    return {
      data: {
        data: [
          {
            사업명: '창업 지원 프로그램',
            소관기관: '중소기업청',
            분야: '기술',
            수행기관: '기관A',
            신청시작일자: '2025-12-01',
            신청종료일자: '2099-12-31',
            pblancId: '123',
          },
        ],
        currentCount: 1,
        matchCount: 1,
        page: 1,
        perPage: 100,
        totalCount: 1,
      },
    } as any;
  }

  if (typeof url === 'string' && url.includes('15125364')) {
    // KStartup response placeholder
    return {
      data: {
        data: [],
      },
    } as any;
  }

  return { data: {} } as any;
});

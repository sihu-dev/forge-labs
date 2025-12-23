/**
 * K-Startup 공고 수집기
 * 공공데이터포털 API: https://www.data.go.kr/data/15125364/openapi.do
 */

import axios from 'axios';
import { config } from '../../config/index.js';
import { log } from '../../utils/logger.js';
import type { Program } from '../../types/index.js';
import { ProgramSchema } from '../../types/index.js';
import { format } from 'date-fns';

interface KStartupRawData {
  bsnsNm?: string; // 사업명
  bsnsClCd?: string; // 사업분류코드
  bsnsOvrvw?: string; // 사업개요
  sprtTrgt?: string; // 지원대상
  rcritBgngDt?: string; // 모집시작일
  rcritEndDt?: string; // 모집종료일
  bsnsNo?: string; // 사업번호
  instNm?: string; // 기관명
  [key: string]: unknown;
}

interface KStartupApiResponse {
  currentCount: number;
  data: KStartupRawData[];
  matchCount: number;
  page: number;
  perPage: number;
  totalCount: number;
}

export class KStartupCollector {
  private apiKey: string;
  private apiUrl: string;
  private keywords: string[];

  constructor() {
    this.apiKey = config.kstartup.apiKey;
    this.apiUrl = config.kstartup.apiUrl;
    this.keywords = config.filterKeywords;

    log.info('KStartupCollector initialized');
  }

  /**
   * 공고 수집
   */
  async collect(): Promise<Program[]> {
    log.info('Starting K-Startup collection');

    try {
      const response = await axios.get<KStartupApiResponse>(this.apiUrl, {
        params: {
          serviceKey: this.apiKey,
          page: 1,
          perPage: 100,
          returnType: 'JSON',
        },
        timeout: 10000,
      });

      if (!response.data || !response.data.data) {
        log.warn('No data received from K-Startup API');
        return [];
      }

      const rawPrograms = response.data.data;
      log.info(`Received ${rawPrograms.length} programs from K-Startup`);

      const filtered = this.filterPrograms(rawPrograms);
      log.info(`Filtered to ${filtered.length} relevant programs`);

      return filtered;
    } catch (error) {
      log.error('Failed to collect from K-Startup', error);

      // API 활성화 안 된 경우 처리
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        log.warn(
          'K-Startup API is not activated. Please check your API key activation status.'
        );
      }

      return [];
    }
  }

  /**
   * 공고 필터링
   */
  private filterPrograms(rawData: KStartupRawData[]): Program[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = format(today, 'yyyy-MM-dd');

    const programs: Program[] = [];

    for (const item of rawData) {
      const title = item.bsnsNm || '';
      const deadline = item.rcritEndDt || '';

      // 마감일 체크
      if (!deadline) continue;
      const deadlineDate = new Date(deadline);
      if (deadlineDate < today) continue;

      // 키워드 매칭
      const searchText =
        `${title} ${item.bsnsOvrvw || ''} ${item.sprtTrgt || ''}`.toLowerCase();
      const hasKeyword = this.keywords.some((keyword) =>
        searchText.includes(keyword.toLowerCase())
      );
      if (!hasKeyword) continue;

      // URL 생성
      let url = '';
      if (item.bsnsNo) {
        url = `https://www.k-startup.go.kr/homepage/businessManage/businessManageDetail.do?mid=30004&bid=${item.bsnsNo}`;
      }

      try {
        const program: Program = {
          title,
          organization: item.instNm || 'K-Startup',
          category: item.bsnsClCd || '',
          target: item.sprtTrgt || '',
          deadline,
          startDate: item.rcritBgngDt || todayStr,
          url,
          source: 'K-Startup',
          memo: item.bsnsOvrvw || '',
          rawData: item,
        };

        const validated = ProgramSchema.parse(program);
        programs.push(validated);
      } catch (error) {
        log.warn(`Failed to parse K-Startup program: ${title}`, error);
      }
    }

    return programs;
  }

  /**
   * 사업 주관기관 정보 조회
   * API: https://www.data.go.kr/data/15125366/openapi.do
   */
  async getOrganizations(): Promise<
    Array<{ instNm: string; instClCd: string }>
  > {
    try {
      const orgApiUrl =
        'https://api.odcloud.kr/api/15125366/v1/uddi:정부지원사업주관기관정보';

      const response = await axios.get(orgApiUrl, {
        params: {
          serviceKey: this.apiKey,
          page: 1,
          perPage: 100,
        },
        timeout: 10000,
      });

      if (response.data && response.data.data) {
        return response.data.data;
      }

      return [];
    } catch (error) {
      log.error('Failed to get K-Startup organizations', error);
      return [];
    }
  }
}

export const kstartupCollector = new KStartupCollector();

/**
 * Bizinfo (기업마당) 공고 수집기
 */

import axios from 'axios';
import { config } from '../../config/index.js';
import { log } from '../../utils/logger.js';
import type { Program } from '../../types/index.js';
import { ProgramSchema } from '../../types/index.js';
import { format } from 'date-fns';

interface BizinfoRawData {
  사업명?: string;
  소관기관?: string;
  분야?: string;
  수행기관?: string;
  신청시작일자?: string;
  신청종료일자?: string;
  pblancId?: string;
  [key: string]: unknown;
}

interface BizinfoApiResponse {
  currentCount: number;
  data: BizinfoRawData[];
  matchCount: number;
  page: number;
  perPage: number;
  totalCount: number;
}

export class BizinfoCollector {
  private apiKey: string;
  private apiUrl: string;
  private keywords: string[];

  constructor() {
    this.apiKey = config.bizinfo.apiKey;
    this.apiUrl = config.bizinfo.apiUrl;
    this.keywords = config.filterKeywords;

    log.info('BizinfoCollector initialized');
  }

  /**
   * 공고 수집
   */
  async collect(): Promise<Program[]> {
    log.info('Starting Bizinfo collection');

    try {
      const response = await axios.get<BizinfoApiResponse>(this.apiUrl, {
        params: {
          serviceKey: this.apiKey,
          page: 1,
          perPage: 100,
          returnType: 'JSON',
        },
        timeout: 10000,
      });

      if (!response.data || !response.data.data) {
        log.warn('No data received from Bizinfo API');
        return [];
      }

      const rawPrograms = response.data.data;
      log.info(`Received ${rawPrograms.length} programs from Bizinfo`);

      const filtered = this.filterPrograms(rawPrograms);
      log.info(`Filtered to ${filtered.length} relevant programs`);

      return filtered;
    } catch (error) {
      log.error('Failed to collect from Bizinfo', error);
      throw error;
    }
  }

  /**
   * 공고 필터링
   */
  private filterPrograms(rawData: BizinfoRawData[]): Program[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = format(today, 'yyyy-MM-dd');

    const programs: Program[] = [];

    for (const item of rawData) {
      const title = item.사업명 || '';
      const deadline = item.신청종료일자 || '';

      // 마감일 체크
      if (!deadline) continue;
      const deadlineDate = new Date(deadline);
      if (deadlineDate < today) continue;

      // 키워드 매칭
      const hasKeyword = this.keywords.some((keyword) =>
        title.toLowerCase().includes(keyword.toLowerCase())
      );
      if (!hasKeyword) continue;

      // URL 생성
      let url = '';
      if (item.pblancId) {
        url = `https://www.bizinfo.go.kr/web/lay1/bbs/S1T122C128/AS/74/view.do?pblancId=${item.pblancId}`;
      }

      try {
        const program: Program = {
          title,
          organization: item.소관기관 || '',
          category: item.분야 || '',
          target: item.수행기관 || '',
          deadline,
          startDate: item.신청시작일자 || todayStr,
          url,
          source: 'Bizinfo',
          memo: '',
          rawData: item,
        };

        const validated = ProgramSchema.parse(program);
        programs.push(validated);
      } catch (error) {
        log.warn(`Failed to parse program: ${title}`, error);
      }
    }

    return programs;
  }

  /**
   * 특정 공고 상세 조회
   */
  async getDetails(pblancId: string): Promise<Program | null> {
    try {
      log.info(`Fetching details for pblancId: ${pblancId}`);

      // 실제 상세 페이지는 크롤링 필요, 여기서는 기본 구조만 반환
      return null;
    } catch (error) {
      log.error(`Failed to get details for ${pblancId}`, error);
      return null;
    }
  }
}

export const bizinfoCollector = new BizinfoCollector();

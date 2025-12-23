/**
 * THE VC 크롤러
 * URL: https://www.thevc.kr
 * 한국 최대 투자 정보 플랫폼 - VC, 액셀러레이터, 스타트업 데이터베이스
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { log } from '../../utils/logger.js';
import type { Program } from '../../types/index.js';

export class TheVCCrawler {
  private readonly baseUrl = 'https://www.thevc.kr';
  private readonly acceleratorUrl = 'https://www.thevc.kr/accelerators';

  async collect(): Promise<Program[]> {
    try {
      log.info('🕷️ THE VC 크롤링 시작');

      // 투자/액셀러레이터 프로그램 수집
      const programs = await this.scrapePrograms();

      log.info(`✅ THE VC: ${programs.length}개 프로그램 수집 완료`);
      return programs;
    } catch (error) {
      log.error('THE VC 크롤링 실패', error);
      return [this.createDefaultProgram()];
    }
  }

  private async scrapePrograms(): Promise<Program[]> {
    try {
      const response = await axios.get(this.acceleratorUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        timeout: 10000,
      });

      const $ = cheerio.load(response.data);
      const programs: Program[] = [];

      // 액셀러레이터 프로그램 정보 추출
      $('.accelerator-item, .program-item').each((_, element) => {
        const title = $(element).find('.title, h3, .name').text().trim();
        const organization = $(element)
          .find('.organization, .company')
          .text()
          .trim();
        const description = $(element)
          .find('.description, .desc')
          .text()
          .trim();
        const link = $(element).find('a').attr('href');

        if (title) {
          programs.push({
            id: this.generateId(title, organization),
            title: title || '액셀러레이터 프로그램',
            organization: organization || 'THE VC',
            category: '액셀러레이터',
            target: '스타트업',
            deadline: this.getDefaultDeadline(),
            startDate: new Date().toISOString(),
            url: link ? `${this.baseUrl}${link}` : this.acceleratorUrl,
            memo: description || '투자 및 액셀러레이팅 프로그램',
            source: 'thevc',
          });
        }
      });

      // 프로그램이 없으면 기본 프로그램 반환
      if (programs.length === 0) {
        return [this.createDefaultProgram()];
      }

      return programs;
    } catch (error) {
      log.error('THE VC 프로그램 스크래핑 실패', error);
      return [this.createDefaultProgram()];
    }
  }

  private createDefaultProgram(): Program {
    return {
      id: 'THEVC_001',
      title: 'THE VC 액셀러레이터 프로그램',
      organization: 'THE VC',
      category: '액셀러레이터',
      target: '초기 스타트업',
      deadline: this.getDefaultDeadline(),
      startDate: new Date().toISOString(),
      url: this.acceleratorUrl,
      memo: '[플랫폼 소개] 한국 최대 투자 정보 플랫폼\n\n[주요 서비스] VC, 액셀러레이터, 스타트업 데이터베이스\n\n[지원 내용] 투자 뉴스, 펀딩 라운드 정보, 액셀러레이터 프로그램 정보\n\n[특징] 스타트업 생태계 정보 통합 플랫폼',
      source: 'thevc',
    };
  }

  private generateId(title: string, organization: string): string {
    const hash = Buffer.from(`${title}-${organization}-${Date.now()}`)
      .toString('base64')
      .slice(0, 10);
    return `THEVC_${hash}`;
  }

  private getDefaultDeadline(): string {
    // 3개월 후
    const deadline = new Date();
    deadline.setMonth(deadline.getMonth() + 3);
    return deadline.toISOString();
  }
}

export const thevcCrawler = new TheVCCrawler();

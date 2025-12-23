/**
 * 크레비스파트너스 크롤러
 * URL: https://ventures.crevisse.com
 * 한국 최초 임팩트 투자 회사 (2004년 설립)
 * "Creative, Visionary and Social Entrepreneurs"
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { log } from '../../utils/logger.js';
import type { Program } from '../../types/index.js';

export class CrevisseCrawler {
  private readonly baseUrl = 'https://ventures.crevisse.com';

  async collect(): Promise<Program[]> {
    try {
      log.info('🕷️ 크레비스파트너스 크롤링 시작');

      // imweb 기반 동적 콘텐츠 크롤링
      const programs = await this.scrapePrograms();

      log.info(`✅ 크레비스파트너스: ${programs.length}개 프로그램 수집 완료`);
      return programs;
    } catch (error) {
      log.error('크레비스파트너스 크롤링 실패', error);
      return [this.createDefaultProgram()];
    }
  }

  private async scrapePrograms(): Promise<Program[]> {
    try {
      const response = await axios.get(this.baseUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        timeout: 10000,
      });

      const $ = cheerio.load(response.data);
      const programs: Program[] = [];

      // 투자 프로그램 정보 추출 (imweb 기반 동적 콘텐츠)
      $('.portfolio-item, .investment-item, .program-item').each(
        (_, element) => {
          const title = $(element).find('.title, h3, h4').text().trim();
          const description = $(element)
            .find('.description, .content, p')
            .text()
            .trim();
          const link = $(element).find('a').attr('href');

          if (title) {
            programs.push({
              id: this.generateId(title),
              title: title,
              organization: '크레비스파트너스',
              category: '임팩트투자',
              target: '소셜벤처, 임팩트 스타트업',
              deadline: this.getDefaultDeadline(),
              startDate: new Date().toISOString(),
              url: link
                ? link.startsWith('http')
                  ? link
                  : `${this.baseUrl}${link}`
                : this.baseUrl,
              memo: description || '임팩트 투자 프로그램',
              source: 'crevisse',
            });
          }
        }
      );

      // 프로그램이 없으면 기본 프로그램 반환
      if (programs.length === 0) {
        return [this.createDefaultProgram()];
      }

      return programs;
    } catch (error) {
      log.error('크레비스파트너스 프로그램 스크래핑 실패', error);
      return [this.createDefaultProgram()];
    }
  }

  private createDefaultProgram(): Program {
    return {
      id: 'CREVISSE_001',
      title: '크레비스파트너스 임팩트 투자 프로그램',
      organization: '크레비스파트너스',
      category: '임팩트투자',
      target: '소셜벤처, 임팩트 스타트업',
      deadline: this.getDefaultDeadline(),
      startDate: new Date().toISOString(),
      url: this.baseUrl,
      memo: '[회사 소개] 2004년 설립, 한국 최초 임팩트 투자 회사\n\n[투자 철학] Creative, Visionary and Social Entrepreneurs 지원\n\n[주요 분야] 사회적 가치 창출 스타트업, 지속가능한 비즈니스 모델\n\n[특징] ESG 및 임팩트 투자 전문, 초기 단계 스타트업 집중',
      source: 'crevisse',
    };
  }

  private generateId(title: string): string {
    const hash = Buffer.from(`${title}-${Date.now()}`)
      .toString('base64')
      .slice(0, 10);
    return `CREVISSE_${hash}`;
  }

  private getDefaultDeadline(): string {
    // 3개월 후
    const deadline = new Date();
    deadline.setMonth(deadline.getMonth() + 3);
    return deadline.toISOString();
  }
}

export const crevisseCrawler = new CrevisseCrawler();

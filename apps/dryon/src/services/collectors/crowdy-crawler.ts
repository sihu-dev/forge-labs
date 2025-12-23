/**
 * 크라우디 크롤러
 * URL: https://www.ycrowdy.com
 * 투자형(증권형) + 보상형(리워드) 크라우드펀딩 플랫폼
 * 2015년 설립, 한국 투자형 크라우드펀딩 시장점유율 1위
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { log } from '../../utils/logger.js';
import type { Program } from '../../types/index.js';

export class CrowdyCrawler {
  private readonly baseUrl = 'https://www.ycrowdy.com';
  private readonly equityUrl = 'https://www.ycrowdy.com/crowdy/info'; // 증권형

  async collect(): Promise<Program[]> {
    try {
      log.info('🕷️ 크라우디 크롤링 시작');

      // 증권형 + 사전공개 프로젝트 수집
      const programs = await this.scrapePrograms();

      log.info(`✅ 크라우디: ${programs.length}개 프로그램 수집 완료`);
      return programs;
    } catch (error) {
      log.error('크라우디 크롤링 실패', error);
      return [this.createDefaultProgram()];
    }
  }

  private async scrapePrograms(): Promise<Program[]> {
    try {
      // 증권형 프로젝트 페이지 크롤링
      const response = await axios.get(this.equityUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        timeout: 10000,
      });

      const $ = cheerio.load(response.data);
      const programs: Program[] = [];

      // Vue.js 기반 동적 콘텐츠에서 프로젝트 정보 추출
      $('.project-item, .campaign-item, .card').each((_, element) => {
        const title = $(element)
          .find('.title, h3, .project-title')
          .text()
          .trim();
        const company = $(element)
          .find('.company, .organization')
          .text()
          .trim();
        const description = $(element)
          .find('.description, .summary, p')
          .text()
          .trim();
        const deadline = $(element).find('.deadline, .date').text().trim();
        const link = $(element).find('a').attr('href');

        if (title) {
          programs.push({
            id: this.generateId(title, company),
            title: title,
            organization: company || '크라우디',
            category: '크라우드펀딩',
            target: '투자자, 일반인',
            deadline: this.parseDeadline(deadline),
            startDate: new Date().toISOString(),
            url: link
              ? link.startsWith('http')
                ? link
                : `${this.baseUrl}${link}`
              : this.equityUrl,
            memo: description || '증권형 크라우드펀딩 프로젝트',
            source: 'crowdy',
          });
        }
      });

      // 프로그램이 없으면 기본 프로그램 반환
      if (programs.length === 0) {
        return [this.createDefaultProgram()];
      }

      return programs;
    } catch (error) {
      log.error('크라우디 프로그램 스크래핑 실패', error);
      return [this.createDefaultProgram()];
    }
  }

  private createDefaultProgram(): Program {
    return {
      id: 'CROWDY_001',
      title: '크라우디 증권형 크라우드펀딩',
      organization: '크라우디',
      category: '크라우드펀딩',
      target: '스타트업, 벤처기업',
      deadline: this.getDefaultDeadline(),
      startDate: new Date().toISOString(),
      url: this.equityUrl,
      memo: '[플랫폼 소개] 2015년 설립, 한국 투자형 크라우드펀딩 시장점유율 1위\n\n[펀딩 유형] 투자형(증권형) + 보상형(리워드)\n\n[주요 특징] 온라인소액투자중개업자, Vue.js 기반 PWA 지원\n\n[지원 내용] 크라우드펀딩을 통한 자금 조달, 투자자 네트워크 연결\n\n[문의] 증권형: contact@ycrowdy.com, 리워드형: info@ycrowdy.com',
      source: 'crowdy',
    };
  }

  private generateId(title: string, company: string): string {
    const hash = Buffer.from(`${title}-${company}-${Date.now()}`)
      .toString('base64')
      .slice(0, 10);
    return `CROWDY_${hash}`;
  }

  private parseDeadline(deadlineText: string): string {
    if (!deadlineText) {
      return this.getDefaultDeadline();
    }

    // 날짜 파싱 시도
    try {
      // "D-7", "7일 남음" 등의 형식 처리
      const dDayMatch = deadlineText.match(/D-(\d+)/);
      if (dDayMatch && dDayMatch[1]) {
        const daysLeft = parseInt(dDayMatch[1], 10);
        const deadline = new Date();
        deadline.setDate(deadline.getDate() + daysLeft);
        return deadline.toISOString();
      }

      // "YYYY.MM.DD" 또는 "YYYY-MM-DD" 형식 처리
      const dateMatch = deadlineText.match(/(\d{4})[-.](\d{1,2})[-.](\d{1,2})/);
      if (dateMatch && dateMatch[1] && dateMatch[2] && dateMatch[3]) {
        const year = parseInt(dateMatch[1], 10);
        const month = parseInt(dateMatch[2], 10);
        const day = parseInt(dateMatch[3], 10);
        const deadline = new Date(year, month - 1, day);
        return deadline.toISOString();
      }
    } catch (error) {
      log.warn('크라우디 마감일 파싱 실패', { deadlineText, error });
    }

    return this.getDefaultDeadline();
  }

  private getDefaultDeadline(): string {
    // 2개월 후 (크라우드펀딩 평균 기간)
    const deadline = new Date();
    deadline.setMonth(deadline.getMonth() + 2);
    return deadline.toISOString();
  }
}

export const crowdyCrawler = new CrowdyCrawler();

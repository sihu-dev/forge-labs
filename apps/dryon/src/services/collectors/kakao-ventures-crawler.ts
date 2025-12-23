/**
 * Kakao Ventures Sitemap 파서
 * Sitemap: https://www.kakao.vc/sitemap.xml
 * robots.txt: Disallow: /blog? (블로그 쿼리만 제한)
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { log } from '../../utils/logger.js';
import type { Program } from '../../types/index.js';

interface SitemapUrl {
  loc: string;
  lastmod?: string;
}

export class KakaoVenturesCrawler {
  private readonly sitemapUrl = 'https://www.kakao.vc/sitemap.xml';
  private readonly programUrl = 'https://www.kakao.vc/en';

  async collect(): Promise<Program[]> {
    try {
      log.info('🕷️ Kakao Ventures 크롤링 시작');

      // Sitemap 파싱
      const urls = await this.parseSitemap();
      log.info(`📄 Sitemap에서 ${urls.length}개 URL 발견`);

      // 프로그램 정보 추출
      const programs = await this.scrapePrograms(urls);

      log.info(`✅ Kakao Ventures: ${programs.length}개 프로그램 수집 완료`);
      return programs;
    } catch (error) {
      log.error('Kakao Ventures 크롤링 실패', error);
      return [this.createDefaultProgram()];
    }
  }

  private async parseSitemap(): Promise<SitemapUrl[]> {
    try {
      const response = await axios.get(this.sitemapUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        timeout: 10000,
      });

      const $ = cheerio.load(response.data, { xmlMode: true });
      const urls: SitemapUrl[] = [];

      $('url').each((_, element) => {
        const loc = $(element).find('loc').text();
        const lastmod = $(element).find('lastmod').text();

        if (loc) {
          urls.push({
            loc,
            lastmod: lastmod || undefined,
          });
        }
      });

      return urls;
    } catch (error) {
      log.warn('Sitemap 파싱 실패', error);
      return [];
    }
  }

  private async scrapePrograms(urls: SitemapUrl[]): Promise<Program[]> {
    const programs: Program[] = [];

    // 오피스아워 관련 URL 찾기
    const officeHoursUrls = urls.filter(
      (url) =>
        url.loc.includes('office') ||
        url.loc.includes('program') ||
        url.loc.includes('apply')
    );

    if (officeHoursUrls.length > 0) {
      // 오피스아워 페이지 스크래핑
      for (const urlData of officeHoursUrls.slice(0, 3)) {
        const program = await this.scrapeProgramPage(urlData.loc);
        if (program) {
          programs.push(program);
        }
      }
    }

    // 프로그램 정보가 없으면 기본 정보 생성
    if (programs.length === 0) {
      programs.push(this.createDefaultProgram());
    }

    return programs;
  }

  private async scrapeProgramPage(url: string): Promise<Program | null> {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        timeout: 15000,
      });

      const $ = cheerio.load(response.data);

      // 제목 추출
      const title =
        $('h1').first().text().trim() ||
        $('title').text().trim() ||
        'Kakao Ventures Office Hours';

      // 설명 추출
      const description =
        $('meta[name="description"]').attr('content') ||
        $('p').first().text().trim();

      // 마감일 추출
      const deadlineText = this.extractDeadline($('body').text());

      return {
        id: `kakao-ventures-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title,
        organization: 'Kakao Ventures',
        category: '벤처캐피털',
        target: '초기 스타트업',
        deadline:
          deadlineText ||
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        startDate: new Date().toISOString(),
        source: 'kakao-ventures',
        url,
        memo: this.createMemo(description),
      };
    } catch (error) {
      log.warn(`프로그램 페이지 스크래핑 실패: ${url}`, error);
      return null;
    }
  }

  private createDefaultProgram(): Program {
    return {
      id: `kakao-ventures-default-${Date.now()}`,
      title: 'Kakao Ventures Office Hours',
      organization: 'Kakao Ventures',
      category: '벤처캐피털',
      target: '초기 스타트업',
      deadline: this.getNextOfficeHoursDeadline(),
      startDate: new Date().toISOString(),
      source: 'kakao-ventures',
      url: this.programUrl,
      memo: this.createMemo(''),
    };
  }

  private createMemo(description: string): string {
    const baseMemo = `[프로그램 개요]
Kakao Ventures는 초기 스타트업을 위한 오피스아워 프로그램을 운영합니다.

[오피스아워 프로그램]
- 사업계획서 없이도 지원 가능
- 데모 영상 또는 서비스 링크 제출
- 1:1 멘토링 및 투자 검토
- Google Forms를 통한 간편 접수

[포트폴리오]
- 280+ 투자 기업
- 주요 투자: 다양한 분야의 혁신 기업

[지원 방법]
- 공식 웹사이트: https://www.kakao.vc/en
- 브런치: https://brunch.co.kr/@kakaoventures

[Media Kit]
2025 Media Kit 다운로드 가능 (featpaper.com)`;

    return description
      ? `${baseMemo}\n\n[상세 정보]\n${description}`
      : baseMemo;
  }

  private extractDeadline(text: string): string | null {
    const patterns = [
      /(\d{4})[년.-](\d{1,2})[월.-](\d{1,2})일?/,
      /(\d{1,2})월\s*(\d{1,2})일/,
      /마감.*?(\d{1,2})월\s*(\d{1,2})일/,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        try {
          if (match[1]?.length === 4 && match[2] && match[3]) {
            const year = parseInt(match[1]);
            const month = parseInt(match[2]) - 1;
            const day = parseInt(match[3]);
            return new Date(year, month, day).toISOString();
          }
        } catch (e) {
          // 무시
        }
      }
    }

    return null;
  }

  private getNextOfficeHoursDeadline(): string {
    // 오피스아워는 상시 모집이므로 30일 후로 설정
    return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  }
}

export const kakaoVenturesCrawler = new KakaoVenturesCrawler();

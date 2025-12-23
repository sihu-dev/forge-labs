/**
 * Tumblbug 크롤러
 * 크라우드펀딩 플랫폼에서 스타트업 관련 프로젝트 수집
 * robots.txt: Allow: / (제한 없음)
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { log } from '../../utils/logger.js';
import type { Program } from '../../types/index.js';

export class TumblbugCrawler {
  private readonly baseUrl = 'https://www.tumblbug.com';
  private readonly discoverUrl = 'https://www.tumblbug.com/discover';

  async collect(): Promise<Program[]> {
    try {
      log.info('🕷️ Tumblbug 크롤링 시작');

      // 디스커버 페이지 스크래핑
      const programs = await this.scrapeDiscoverPage();

      log.info(`✅ Tumblbug: ${programs.length}개 프로젝트 수집 완료`);
      return programs;
    } catch (error) {
      log.error('Tumblbug 크롤링 실패', error);
      return [this.createDefaultProgram()];
    }
  }

  private async scrapeDiscoverPage(): Promise<Program[]> {
    try {
      const response = await axios.get(this.discoverUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        timeout: 15000,
      });

      const $ = cheerio.load(response.data);
      const programs: Program[] = [];

      // 프로젝트 카드 추출 (다양한 선택자 시도)
      const projectSelectors = [
        '.discover-project-card',
        '.project-card',
        'article.project',
        '[data-project-id]',
      ];

      let $projects = $();
      for (const selector of projectSelectors) {
        $projects = $(selector);
        if ($projects.length > 0) {
          log.info(
            `✅ Tumblbug: ${selector} 선택자로 ${$projects.length}개 발견`
          );
          break;
        }
      }

      // 프로젝트가 없으면 기본 정보 반환
      if ($projects.length === 0) {
        log.warn('Tumblbug: 프로젝트를 찾을 수 없음, 기본 정보 반환');
        return [this.createDefaultProgram()];
      }

      // 각 프로젝트 파싱 (최대 10개)
      $projects.slice(0, 10).each((_, element) => {
        const program = this.parseProjectCard($, $(element));
        if (program && this.isRelevantProject(program.title)) {
          programs.push(program);
        }
      });

      // 관련 프로젝트가 없으면 기본 정보 추가
      if (programs.length === 0) {
        programs.push(this.createDefaultProgram());
      }

      return programs;
    } catch (error) {
      log.warn('Tumblbug 디스커버 페이지 스크래핑 실패', error);
      return [this.createDefaultProgram()];
    }
  }

  private parseProjectCard(
    _$: cheerio.CheerioAPI,
    $card: cheerio.Cheerio<any>
  ): Program | null {
    try {
      // 제목 추출
      const $title = $card.find('.title, .project-title, h3, h4').first();
      const title = $title.text().trim();

      if (!title || title.length < 5) {
        return null;
      }

      // URL 추출
      const $link = $card.find('a[href*="/projects/"]').first();
      const href = $link.attr('href') || '';
      const url = href.startsWith('http') ? href : `${this.baseUrl}${href}`;

      // 카테고리 추출
      const $category = $card.find('.category, .project-category').first();
      const categoryText = $category.text().trim();

      // 설명 추출
      const $description = $card
        .find('.description, .project-description, p')
        .first();
      const description = $description.text().trim();

      // 마감일 추출
      const $deadline = $card.find('.deadline, .d-day, [class*="day"]');
      const deadlineText = $deadline.text().trim();

      return {
        id: `tumblbug-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title,
        organization: 'Tumblbug',
        category: this.extractCategory(categoryText, title),
        target: '스타트업 및 창업자',
        deadline:
          this.extractDeadline(deadlineText) ||
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        startDate: new Date().toISOString(),
        source: 'tumblbug',
        url,
        memo: this.createMemo(description, categoryText),
      };
    } catch (error) {
      log.warn('Tumblbug 프로젝트 카드 파싱 실패', error);
      return null;
    }
  }

  private isRelevantProject(title: string): boolean {
    const relevantKeywords = [
      '스타트업',
      '창업',
      '테크',
      'tech',
      '앱',
      'app',
      '플랫폼',
      'platform',
      '서비스',
      'AI',
      '인공지능',
      'IoT',
      '소프트웨어',
      'software',
      '혁신',
      '비즈니스',
      'business',
    ];

    return relevantKeywords.some((keyword) =>
      title.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  private extractCategory(categoryText: string, title: string): string {
    if (/테크|tech|기술/i.test(categoryText) || /테크|tech/i.test(title)) {
      return '테크/스타트업';
    }
    if (/게임|game/i.test(categoryText) || /게임|game/i.test(title)) {
      return '게임';
    }
    if (/디자인|design/i.test(categoryText)) {
      return '디자인';
    }
    if (/패션|fashion/i.test(categoryText)) {
      return '패션';
    }
    if (/푸드|food|음식/i.test(categoryText)) {
      return '푸드';
    }
    return '크라우드펀딩';
  }

  private extractDeadline(text: string): string | null {
    // "D-10", "10일 남음" 등의 패턴 추출
    const dDayMatch = text.match(/D-(\d+)/i);
    if (dDayMatch && dDayMatch[1]) {
      const daysLeft = parseInt(dDayMatch[1]);
      return new Date(
        Date.now() + daysLeft * 24 * 60 * 60 * 1000
      ).toISOString();
    }

    const daysMatch = text.match(/(\d+)일\s*남음/);
    if (daysMatch && daysMatch[1]) {
      const daysLeft = parseInt(daysMatch[1]);
      return new Date(
        Date.now() + daysLeft * 24 * 60 * 60 * 1000
      ).toISOString();
    }

    // 날짜 패턴 추출
    const datePatterns = [
      /(\d{4})[.-](\d{1,2})[.-](\d{1,2})/,
      /(\d{1,2})월\s*(\d{1,2})일/,
    ];

    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        try {
          if (match[1] && match[1].length === 4 && match[2] && match[3]) {
            const year = parseInt(match[1]);
            const month = parseInt(match[2]) - 1;
            const day = parseInt(match[3]);
            return new Date(year, month, day).toISOString();
          } else if (match[1] && match[2]) {
            const currentYear = new Date().getFullYear();
            const month = parseInt(match[1]) - 1;
            const day = parseInt(match[2]);
            return new Date(currentYear, month, day).toISOString();
          }
        } catch (e) {
          // 무시
        }
      }
    }

    return null;
  }

  private createDefaultProgram(): Program {
    return {
      id: `tumblbug-default-${Date.now()}`,
      title: 'Tumblbug 크라우드펀딩 플랫폼',
      organization: 'Tumblbug',
      category: '크라우드펀딩',
      target: '스타트업 및 창업자',
      deadline: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      startDate: new Date().toISOString(),
      source: 'tumblbug',
      url: this.discoverUrl,
      memo: this.createMemo('', ''),
    };
  }

  private createMemo(description: string, category: string): string {
    const baseMemo = `[플랫폼 개요]
Tumblbug은 한국 최대 크라우드펀딩 플랫폼으로 창작자와 후원자를 연결합니다.

[크라우드펀딩 유형]
1. 리워드형: 제품/서비스 선구매 방식
2. 후원형: 순수 후원 방식

[스타트업 활용]
- 초기 시장 검증 (Market Validation)
- 프리오더를 통한 초기 자금 확보
- 커뮤니티 구축 및 마케팅
- 투자자 관심 유도

[성공 사례]
- 테크 스타트업 다수 펀딩 성공
- 평균 달성률: 150%+
- 누적 펀딩액: 2,000억원+

[주요 카테고리]
- 테크/가전
- 게임
- 디자인
- 패션
- 푸드

[펀딩 절차]
1. 프로젝트 기획 및 제출
2. 심사 (3-5 영업일)
3. 펀딩 시작 (통상 30-40일)
4. 목표 달성 시 펀딩 성공
5. 리워드 제작 및 배송

[공식 사이트]
https://www.tumblbug.com`;

    if (description) {
      return `${baseMemo}\n\n[프로젝트 상세]\n카테고리: ${category}\n설명: ${description}`;
    }

    return baseMemo;
  }
}

export const tumblbugCrawler = new TumblbugCrawler();

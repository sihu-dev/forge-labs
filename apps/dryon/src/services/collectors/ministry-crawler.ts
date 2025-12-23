/**
 * 비IT 부처 융합사업 크롤러
 * 농림축산식품부, 해양수산부, 국토교통부, 환경부, 보건복지부, 농촌진흥청, 산림청, 기상청
 * 경쟁률이 낮은 AI 융합 틈새 공고 발굴
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { log } from '../../utils/logger.js';
import type { Program } from '../../types/index.js';
import pQueue from 'p-queue';

interface MinistrySource {
  code: string;
  name: string;
  url: string;
  boardUrl: string;
  aiKeywords: string[]; // AI 융합 분야 키워드
}

const MINISTRY_SOURCES: MinistrySource[] = [
  {
    code: 'mafra',
    name: '농림축산식품부',
    url: 'https://www.mafra.go.kr',
    boardUrl: 'https://www.mafra.go.kr/bbs/mafra/68/artclList.do',
    aiKeywords: ['스마트팜', '농업AI', '스마트농업', '정밀농업', '농업데이터'],
  },
  {
    code: 'mof',
    name: '해양수산부',
    url: 'https://www.mof.go.kr',
    boardUrl: 'https://www.mof.go.kr/article/list.do?boardKey=10&menuKey=376',
    aiKeywords: [
      '스마트양식',
      '수산AI',
      '해양데이터',
      '스마트해양',
      '자율운항',
    ],
  },
  {
    code: 'molit',
    name: '국토교통부',
    url: 'https://www.molit.go.kr',
    boardUrl: 'https://www.molit.go.kr/USR/BORD0201/m_69/LST.jsp',
    aiKeywords: ['스마트시티', '자율주행', '드론', 'UAM', '디지털트윈', 'MaaS'],
  },
  {
    code: 'me',
    name: '환경부',
    url: 'https://www.me.go.kr',
    boardUrl:
      'https://www.me.go.kr/home/web/board/read.do?boardMasterId=1&menuId=10181',
    aiKeywords: [
      '환경AI',
      '탄소중립',
      '그린디지털',
      '스마트환경',
      '환경데이터',
    ],
  },
  {
    code: 'mohw',
    name: '보건복지부',
    url: 'https://www.mohw.go.kr',
    boardUrl: 'https://www.mohw.go.kr/board.es?mid=a10503000000&bid=0027',
    aiKeywords: [
      '헬스케어AI',
      '디지털헬스',
      '의료AI',
      '스마트헬스',
      '바이오데이터',
    ],
  },
  {
    code: 'rda',
    name: '농촌진흥청',
    url: 'https://www.rda.go.kr',
    boardUrl:
      'https://www.rda.go.kr/board/board.do?mode=list&prgId=day_farmprmninfoEntry',
    aiKeywords: ['스마트팜', '농업로봇', '정밀농업', '농업빅데이터', 'AgTech'],
  },
  {
    code: 'forest',
    name: '산림청',
    url: 'https://www.forest.go.kr',
    boardUrl:
      'https://www.forest.go.kr/kfsweb/kfs/subIdx/Index.do?mn=KFS_02_01',
    aiKeywords: [
      '스마트산림',
      '산림드론',
      '산불AI',
      '산림빅데이터',
      '탄소흡수',
    ],
  },
  {
    code: 'kma',
    name: '기상청',
    url: 'https://www.kma.go.kr',
    boardUrl: 'https://www.kma.go.kr/kma/news/notice.jsp',
    aiKeywords: ['기상AI', '기후데이터', '예보AI', '기상빅데이터', '재해예측'],
  },
];

export class MinistryCrawler {
  async collect(): Promise<Program[]> {
    try {
      log.info(
        `🏛️ 비IT 부처 (${MINISTRY_SOURCES.length}개) 크롤링 시작 - AI 융합 틈새공고 탐색`
      );

      const queue = new pQueue({ concurrency: 2 }); // 부처 사이트는 느릴 수 있으므로 동시성 낮춤
      const allPrograms: Program[] = [];

      const results = await Promise.allSettled(
        MINISTRY_SOURCES.map((source) =>
          queue.add(() => this.scrapeSource(source))
        )
      );

      for (const [index, result] of results.entries()) {
        const source = MINISTRY_SOURCES[index];
        if (!source) continue;

        if (result.status === 'fulfilled') {
          const programs = result.value;
          if (programs && programs.length > 0) {
            log.info(
              `✅ ${source.name}: ${programs.length}개 수집 (AI융합 키워드: ${source.aiKeywords.join(', ')})`
            );
            allPrograms.push(...programs);
          }
        } else {
          log.warn(`❌ ${source.name}: 수집 실패`, result.reason);
        }
      }

      log.info(
        `✅ 비IT 부처 전체: ${allPrograms.length}개 AI융합 공고 수집 완료`
      );
      return allPrograms;
    } catch (error) {
      log.error('비IT 부처 크롤링 실패', error);
      return [];
    }
  }

  private async scrapeSource(source: MinistrySource): Promise<Program[]> {
    try {
      const response = await axios.get(source.boardUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        },
        timeout: 25000, // 정부 사이트는 느릴 수 있음
      });

      const $ = cheerio.load(response.data);
      const programs: Program[] = [];

      // 정부 기관 게시판 구조
      const selectors = [
        'table.board_list tbody tr',
        '.board-list tbody tr',
        '.tbl-list tbody tr',
        '.list-table tbody tr',
        '.bbsList tbody tr',
        'table tbody tr',
        '.bbs_list tbody tr',
        '.notice_list li',
        'ul.board_list li',
      ];

      for (const selector of selectors) {
        const elements = $(selector);
        if (elements.length === 0) continue;

        elements.each((_, element) => {
          const program = this.parseListItem($, $(element), source);
          if (program) {
            programs.push(program);
          }
        });

        if (programs.length > 0) break;
      }

      return programs.slice(0, 8); // 최대 8개
    } catch (error) {
      log.debug(`${source.name} 크롤링 오류`, error);
      return [];
    }
  }

  private parseListItem(
    _$: cheerio.CheerioAPI,
    $row: cheerio.Cheerio<any>,
    source: MinistrySource
  ): Program | null {
    try {
      // 제목 추출
      const titleSelectors = [
        'td.subject a',
        'td.title a',
        'a.title',
        '.title a',
        '.subject a',
        'td:nth-child(2) a',
        'a[href*="view"]',
        'a[href*="detail"]',
        'a[href*="read"]',
      ];

      let title = '';
      let href = '';

      for (const selector of titleSelectors) {
        const $link = $row.find(selector);
        if ($link.length) {
          title = $link.text().trim();
          href = $link.attr('href') || '';
          if (title && title.length >= 5) break;
        }
      }

      if (!title || title.length < 5) return null;

      // 제외 패턴
      if (['번호', '제목', '구분', '작성자', '조회'].includes(title))
        return null;

      // 공고 관련성 확인 + AI 융합 키워드 확인
      if (!this.isRelevantProgram(title, source)) return null;

      // URL 생성
      const url = href.startsWith('http') ? href : `${source.url}${href}`;

      // 날짜 추출
      const dateText = $row
        .find('td.date, .date, .regdate, td:last-child')
        .text()
        .trim();

      // AI 융합 관련 여부 확인
      const isAIFusion = this.isAIFusionProgram(title, source.aiKeywords);

      return {
        id: `${source.code}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: isAIFusion ? `[AI융합] ${title}` : title,
        organization: source.name,
        category: this.extractCategory(title, source),
        target: this.extractTarget(title),
        deadline:
          this.parseDeadline(title, dateText) ||
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        startDate: new Date().toISOString(),
        source: `ministry-${source.code}` as Program['source'],
        url,
        memo: `${source.name} | AI융합: ${isAIFusion ? '✅' : '❌'} | 등록: ${dateText}`,
      };
    } catch {
      return null;
    }
  }

  private isRelevantProgram(title: string, source: MinistrySource): boolean {
    const lowerTitle = title.toLowerCase();

    // 기본 공고 키워드
    const relevantKeywords = [
      '공고',
      '모집',
      '지원',
      '신청',
      '접수',
      '사업',
      '선정',
      '참여',
      'R&D',
      '과제',
      '기업',
      '창업',
      '스타트업',
      '실증',
    ];

    // 제외 키워드
    const excludeKeywords = [
      '채용',
      '구인',
      '입사',
      '결과',
      '선정결과',
      '정정',
      '취소',
      '인사',
    ];

    const hasRelevant = relevantKeywords.some((kw) => lowerTitle.includes(kw));
    const hasExclude = excludeKeywords.some((kw) => lowerTitle.includes(kw));

    if (!hasRelevant || hasExclude) return false;

    // AI 융합 키워드가 있으면 우선 수집
    const hasAIFusion = this.isAIFusionProgram(title, source.aiKeywords);
    if (hasAIFusion) return true;

    // 일반 지원사업도 수집
    return true;
  }

  private isAIFusionProgram(title: string, aiKeywords: string[]): boolean {
    const lowerTitle = title.toLowerCase();

    // 공통 AI 키워드
    const commonAIKeywords = [
      'ai',
      '인공지능',
      '빅데이터',
      '데이터',
      '스마트',
      '디지털',
      '자동화',
      '플랫폼',
    ];

    // 기관별 특화 키워드 + 공통 키워드
    const allKeywords = [...aiKeywords, ...commonAIKeywords];

    return allKeywords.some((kw) => lowerTitle.includes(kw.toLowerCase()));
  }

  private parseDeadline(title: string, dateText: string): string | null {
    const patterns = [
      /(\d{4})[.-](\d{1,2})[.-](\d{1,2})/,
      /(\d{1,2})월\s*(\d{1,2})일/,
      /~\s*(\d{1,2})[./](\d{1,2})/,
    ];

    for (const pattern of patterns) {
      const match = title.match(pattern);
      if (match && match[1] && match[2]) {
        try {
          if (match[1].length === 4 && match[3]) {
            const year = parseInt(match[1]);
            const month = parseInt(match[2]) - 1;
            const day = parseInt(match[3]);
            return new Date(year, month, day).toISOString();
          }
        } catch {
          // 무시
        }
      }
    }

    if (dateText) {
      const match = dateText.match(/(\d{4})[.-](\d{1,2})[.-](\d{1,2})/);
      if (match && match[1] && match[2] && match[3]) {
        try {
          const year = parseInt(match[1]);
          const month = parseInt(match[2]) - 1;
          const day = parseInt(match[3]);
          const postDate = new Date(year, month, day);
          return new Date(
            postDate.getTime() + 30 * 24 * 60 * 60 * 1000
          ).toISOString();
        } catch {
          // 무시
        }
      }
    }

    return null;
  }

  private extractCategory(title: string, source: MinistrySource): string {
    // 기관별 특화 분류
    switch (source.code) {
      case 'mafra':
      case 'rda':
        if (/스마트팜|농업AI|데이터/.test(title)) return '스마트팜/AgTech';
        return '농업';
      case 'mof':
        if (/스마트|AI|데이터|자율/.test(title)) return '스마트해양';
        return '해양수산';
      case 'molit':
        if (/스마트시티|자율주행|드론|UAM/.test(title))
          return '스마트시티/모빌리티';
        return '국토교통';
      case 'me':
        if (/AI|데이터|디지털|스마트/.test(title)) return '그린디지털';
        return '환경';
      case 'mohw':
        if (/AI|디지털|스마트|헬스/.test(title)) return '디지털헬스케어';
        return '보건복지';
      case 'forest':
        if (/스마트|드론|AI|데이터/.test(title)) return '스마트산림';
        return '산림';
      case 'kma':
        if (/AI|데이터|예측/.test(title)) return '기상AI';
        return '기상';
      default:
        return 'AI융합';
    }
  }

  private extractTarget(title: string): string {
    if (/예비창업/.test(title)) return '예비창업자';
    if (/중소기업/.test(title)) return '중소기업';
    if (/스타트업|벤처/.test(title)) return '스타트업/벤처';
    if (/농업|농촌/.test(title)) return '농업인/농업법인';
    if (/연구/.test(title)) return '연구기관/대학';
    return '기업 및 기관';
  }
}

export const ministryCrawler = new MinistryCrawler();

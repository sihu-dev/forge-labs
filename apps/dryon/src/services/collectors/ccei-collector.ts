/**
 * 창조경제혁신센터 공고 수집기
 * 전국 17개 창조경제혁신센터 통합
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { Announcement } from '../../types/index.js';
import { logger } from '../../utils/logger.js';

export class CceiCollector {
  private readonly centers = [
    { name: '서울', url: 'https://ccei.creativekorea.or.kr/seoul' },
    { name: '경기', url: 'https://ccei.creativekorea.or.kr/gyeonggi' },
    { name: '인천', url: 'https://ccei.creativekorea.or.kr/incheon' },
    { name: '강원', url: 'https://ccei.creativekorea.or.kr/gangwon' },
    { name: '대전', url: 'https://ccei.creativekorea.or.kr/daejeon' },
    { name: '세종', url: 'https://ccei.creativekorea.or.kr/sejong' },
    { name: '충북', url: 'https://ccei.creativekorea.or.kr/chungbuk' },
    { name: '충남', url: 'https://ccei.creativekorea.or.kr/chungnam' },
    { name: '대구', url: 'https://ccei.creativekorea.or.kr/daegu' },
    { name: '경북', url: 'https://ccei.creativekorea.or.kr/gyeongbuk' },
    { name: '부산', url: 'https://ccei.creativekorea.or.kr/busan' },
    { name: '울산', url: 'https://ccei.creativekorea.or.kr/ulsan' },
    { name: '경남', url: 'https://ccei.creativekorea.or.kr/gyeongnam' },
    { name: '광주', url: 'https://ccei.creativekorea.or.kr/gwangju' },
    { name: '전북', url: 'https://ccei.creativekorea.or.kr/jeonbuk' },
    { name: '전남', url: 'https://ccei.creativekorea.or.kr/jeonnam' },
    { name: '제주', url: 'https://ccei.creativekorea.or.kr/jeju' },
  ];

  async collect(keywords?: string[]): Promise<Announcement[]> {
    try {
      logger.info('🏢 창조경제혁신센터 공고 수집 시작 (전국 17개 센터)');

      const allAnnouncements: Announcement[] = [];

      // 병렬로 모든 센터에서 수집
      const results = await Promise.allSettled(
        this.centers.map((center) => this.collectFromCenter(center, keywords))
      );

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          allAnnouncements.push(...result.value);
        } else {
          logger.warn(
            `${this.centers[index]?.name} 센터 수집 실패`,
            result.reason
          );
        }
      });

      logger.info(`✅ 창조경제혁신센터: ${allAnnouncements.length}건 수집`);
      return allAnnouncements;
    } catch (error) {
      logger.error('창조경제혁신센터 공고 수집 실패', error);
      return [];
    }
  }

  private async collectFromCenter(
    center: { name: string; url: string },
    keywords?: string[]
  ): Promise<Announcement[]> {
    const announcements: Announcement[] = [];

    try {
      const response = await axios.get(`${center.url}/board/notice`, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        timeout: 10000,
      });

      const $ = cheerio.load(response.data);

      $('.board-list tbody tr').each((_, element) => {
        const $row = $(element);
        const title = $row.find('.title a').text().trim();
        const link = $row.find('.title a').attr('href');

        if (!title || !link) return;

        if (keywords && keywords.length > 0) {
          const hasKeyword = keywords.some((keyword) =>
            title.toLowerCase().includes(keyword.toLowerCase())
          );
          if (!hasKeyword) return;
        }

        const fullUrl = link.startsWith('http') ? link : `${center.url}${link}`;
        const id = `ccei-${center.name}-${link.split('=').pop() || Date.now()}`;

        announcements.push({
          id,
          title,
          source: 'ccei',
          url: fullUrl,
          description: `[${center.name}] ${title}`,
          collectedAt: new Date(),
          agency: `${center.name}창조경제혁신센터`,
        });
      });
    } catch (error) {
      // 개별 센터 실패는 경고만 출력
      logger.debug(`${center.name} 센터 수집 중 오류`, error);
    }

    return announcements;
  }
}

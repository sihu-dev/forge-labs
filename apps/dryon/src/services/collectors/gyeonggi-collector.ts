/**
 * 경기도 공고 수집기
 * 경기도 창업지원센터
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { Announcement } from '../../types/index.js';
import { logger } from '../../utils/logger.js';

export class GyeonggiCollector {
  private readonly baseUrl = 'https://www.gstartup.or.kr';
  private readonly announcementUrl = `${this.baseUrl}/main/selectBbsNttList.do?bbsNo=137`;

  async collect(keywords?: string[]): Promise<Announcement[]> {
    try {
      logger.info('🌆 경기도 공고 수집 시작');

      const response = await axios.get(this.announcementUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        timeout: 10000,
      });

      const $ = cheerio.load(response.data);
      const announcements: Announcement[] = [];

      $('.board_list tbody tr').each((_, element) => {
        const $row = $(element);
        const title = $row.find('.subject a').text().trim();
        const link = $row.find('.subject a').attr('href');

        if (!title || !link) return;

        if (keywords && keywords.length > 0) {
          const hasKeyword = keywords.some((keyword) =>
            title.toLowerCase().includes(keyword.toLowerCase())
          );
          if (!hasKeyword) return;
        }

        const fullUrl = link.startsWith('http')
          ? link
          : `${this.baseUrl}${link}`;
        const id = `gyeonggi-${link.split('=').pop() || Date.now()}`;

        announcements.push({
          id,
          title,
          source: 'gyeonggi',
          url: fullUrl,
          description: title,
          collectedAt: new Date(),
          agency: '경기도창업지원센터',
        });
      });

      logger.info(`✅ 경기도: ${announcements.length}건 수집`);
      return announcements;
    } catch (error) {
      logger.error('경기도 공고 수집 실패', error);
      return [];
    }
  }
}

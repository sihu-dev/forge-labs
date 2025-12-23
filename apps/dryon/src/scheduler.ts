/**
 * 스케줄러 - 매일 오전 8시 자동 실행
 */

import cron from 'node-cron';
import { config, validateConfig } from './config/index.js';
import { log } from './utils/logger.js';
import { collectAllPrograms } from './services/collectors/index.js';
import { programAnalyzer } from './services/analyzer.js';
import { slackNotifier } from './services/integrations/slack-notifier.js';
import { googleSheetsService } from './services/integrations/google-sheets.js';
import { googleCalendarService } from './services/integrations/google-calendar.js';

/**
 * 메인 워크플로우 실행
 */
export async function runWorkflow(): Promise<void> {
  log.info('====== Starting workflow ======');

  try {
    // 1. 공고 수집
    log.info('[Step 1] Collecting programs from all sources');
    const programs = await collectAllPrograms();

    if (programs.length === 0) {
      log.warn('No programs collected. Ending workflow.');
      await slackNotifier.notifyAnalysisResults([]);
      return;
    }

    log.info(`Collected ${programs.length} programs`);

    // 2. AI 적합도 분석
    log.info('[Step 2] Analyzing programs with Claude AI');
    const analyzed = await programAnalyzer.analyzePrograms(programs);

    if (analyzed.length === 0) {
      log.warn('No programs passed the threshold. Ending workflow.');
      await slackNotifier.notifyAnalysisResults([]);
      return;
    }

    log.info(`${analyzed.length} programs passed threshold`);

    // 3. 우선순위 정렬
    const sorted = programAnalyzer.sortByPriority(analyzed);

    // 4. Google Sheets에 저장
    log.info('[Step 3] Saving to Google Sheets');
    await googleSheetsService.savePrograms(sorted);

    // 5. Google Calendar에 마감일 추가
    log.info('[Step 4] Adding deadlines to Google Calendar');
    await googleCalendarService.addProgramDeadlines(sorted);

    // 6. Slack 알림
    log.info('[Step 5] Sending Slack notification');
    await slackNotifier.sendRichMessage(sorted);

    log.info('====== Workflow completed successfully ======');
  } catch (error) {
    log.error('Workflow failed', error);
    await slackNotifier.notifyError(
      '워크플로우 실행 중 오류가 발생했습니다.',
      error as Error
    );
    throw error;
  }
}

/**
 * 스케줄러 시작
 */
export function startScheduler(): void {
  // 설정 검증
  validateConfig();

  const { cron: cronExpression, timezone, enabled } = config.scheduler;

  if (!enabled) {
    log.warn('Scheduler is disabled in config');
    return;
  }

  log.info(`Starting scheduler: ${cronExpression} (${timezone})`);

  // Cron job 등록
  cron.schedule(
    cronExpression,
    async () => {
      log.info('Scheduled job triggered');
      try {
        await runWorkflow();
      } catch (error) {
        log.error('Scheduled workflow failed', error);
      }
    },
    {
      timezone,
    }
  );

  log.info('Scheduler started successfully');
  slackNotifier.notifySystemStart();
}

/**
 * 즉시 실행 (테스트용)
 */
export async function runNow(): Promise<void> {
  log.info('Running workflow immediately (manual trigger)');
  await runWorkflow();
}

// 직접 실행시
if (import.meta.url === `file://${process.argv[1]}`) {
  startScheduler();

  // 프로세스 종료 처리
  process.on('SIGINT', () => {
    log.info('Received SIGINT, shutting down gracefully');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    log.info('Received SIGTERM, shutting down gracefully');
    process.exit(0);
  });
}

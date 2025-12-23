/**
 * 정부지원사업 자동화 마스터 패키지 - 메인 엔트리
 */

import { startScheduler, runNow } from './scheduler.js';
import { log } from './utils/logger.js';
import { validateConfig } from './config/index.js';

async function main() {
  try {
    log.info('🚀 Hyein Agent Starting...');

    // 설정 검증
    validateConfig();

    // 명령줄 인자 확인
    const args = process.argv.slice(2);
    const command = args[0];

    if (command === 'now' || command === 'test') {
      // 즉시 실행
      log.info('Running workflow immediately...');
      await runNow();
      log.info('✅ Workflow completed. Exiting.');
      process.exit(0);
    } else {
      // 스케줄러 모드
      log.info('Starting in scheduler mode...');
      startScheduler();
      log.info('✅ Scheduler is running. Press Ctrl+C to stop.');
    }
  } catch (error) {
    log.error('Failed to start Hyein Agent', error);
    process.exit(1);
  }
}

// 프로세스 종료 처리
process.on('SIGINT', () => {
  log.info('Received SIGINT, shutting down gracefully');
  process.exit(0);
});

process.on('SIGTERM', () => {
  log.info('Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  log.error('Uncaught exception', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  log.error('Unhandled rejection', reason);
  process.exit(1);
});

// 실행
main();

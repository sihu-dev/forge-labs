/**
 * Winston 기반 로거
 */

import winston from 'winston';
import { config } from '../config/index.js';

const { combine, timestamp, printf, colorize, errors } = winston.format;

/**
 * 커스텀 로그 포맷
 */
const customFormat = printf(({ level, message, timestamp, stack }) => {
  const log = `${timestamp} [${level}]: ${message}`;
  return stack ? `${log}\n${stack}` : log;
});

/**
 * 로거 인스턴스 생성
 */
export const logger = winston.createLogger({
  level: config.logger.level,
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    customFormat
  ),
  transports: [
    // 콘솔 출력
    new winston.transports.Console({
      format: combine(colorize(), customFormat),
    }),

    // 파일 출력 (error 레벨)
    new winston.transports.File({
      filename:
        config.logger.filePath?.replace('.log', '-error.log') ||
        './logs/error.log',
      level: 'error',
      maxsize: parseSize(config.logger.maxSize || '20m'),
      maxFiles: parseInt(config.logger.maxFiles || '7', 10),
    }),

    // 파일 출력 (전체)
    new winston.transports.File({
      filename: config.logger.filePath || './logs/app.log',
      maxsize: parseSize(config.logger.maxSize || '20m'),
      maxFiles: parseInt(config.logger.maxFiles || '7', 10),
    }),
  ],
});

/**
 * 파일 크기 파싱 (예: "20m" -> 20 * 1024 * 1024)
 */
function parseSize(size: string): number {
  const match = size.match(/^(\d+)([kmg])?$/i);
  if (!match || !match[1]) return 20 * 1024 * 1024; // 기본 20MB

  const value = parseInt(match[1], 10);
  const unit = (match[2] || '').toLowerCase();

  const multipliers: Record<string, number> = {
    k: 1024,
    m: 1024 * 1024,
    g: 1024 * 1024 * 1024,
  };

  return value * (multipliers[unit] || 1);
}

/**
 * 로거 래퍼 함수들
 */
export const log = {
  info: (message: string, meta?: unknown) => logger.info(message, meta),
  error: (message: string, error?: Error | unknown) => {
    if (error instanceof Error) {
      logger.error(message, { error: error.message, stack: error.stack });
    } else {
      logger.error(message, { error });
    }
  },
  warn: (message: string, meta?: unknown) => logger.warn(message, meta),
  debug: (message: string, meta?: unknown) => logger.debug(message, meta),
};

export default logger;

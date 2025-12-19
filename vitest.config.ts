/**
 * FORGE LABS - Vitest Configuration
 * 모노레포 전체 테스트 설정
 */

import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    // 테스트 환경
    environment: 'node',

    // 글로벌 설정
    globals: true,

    // 테스트 파일 패턴
    include: [
      'packages/**/*.{test,spec}.{ts,tsx}',
      'apps/**/*.{test,spec}.{ts,tsx}',
      'tests/**/*.{test,spec}.{ts,tsx}',
    ],

    // 제외 패턴
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/.turbo/**',
    ],

    // 커버리지 설정
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      include: [
        'packages/*/src/**/*.ts',
        'apps/*/src/**/*.{ts,tsx}',
      ],
      exclude: [
        '**/*.d.ts',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/index.ts',
        '**/types.ts',
      ],
      thresholds: {
        statements: 60,
        branches: 60,
        functions: 60,
        lines: 60,
      },
    },

    // 타임아웃
    testTimeout: 10000,

    // 스냅샷
    snapshotFormat: {
      escapeString: true,
      printBasicPrototype: true,
    },
  },

  // 경로 별칭
  resolve: {
    alias: {
      '@forge/types': resolve(__dirname, 'packages/types/src'),
      '@forge/utils': resolve(__dirname, 'packages/utils/src'),
      '@forge/core': resolve(__dirname, 'packages/core/src'),
      '@forge/ui': resolve(__dirname, 'packages/ui/src'),
      '@': resolve(__dirname, 'apps/hephaitos/src'),
    },
  },
});

/**
 * @forge/core - Portfolio Repository Tests
 * 포트폴리오 리포지토리 테스트 (InMemoryPortfolioRepository)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryPortfolioRepository } from '../repositories/portfolio-repository';
import type { HephaitosTypes } from '@forge/types';

type IPortfolio = HephaitosTypes.IPortfolio;
type IPortfolioSnapshot = HephaitosTypes.IPortfolioSnapshot;
type IAsset = HephaitosTypes.IAsset;

// ═══════════════════════════════════════════════════════════════
// 테스트 데이터 헬퍼
// ═══════════════════════════════════════════════════════════════

const createMockAsset = (symbol: string, amount: number, priceUsd: number): IAsset => ({
  symbol,
  name: symbol,
  amount,
  price_usd: priceUsd,
  value_usd: amount * priceUsd,
  change_24h: 0,
});

const createMockPortfolio = (overrides: Partial<IPortfolio> = {}): IPortfolio => ({
  id: `portfolio-${Date.now()}`,
  user_id: 'user-1',
  exchange: 'binance',
  name: 'Main Portfolio',
  assets: [
    createMockAsset('BTC', 1.5, 50000),
    createMockAsset('ETH', 10, 2000),
  ],
  total_value_usd: 95000,
  created_at: new Date().toISOString(),
  synced_at: new Date().toISOString(),
  sync_status: 'success',
  ...overrides,
});

const createMockSnapshot = (
  portfolioId: string,
  overrides: Partial<IPortfolioSnapshot> = {}
): IPortfolioSnapshot => ({
  id: `snapshot-${Date.now()}-${Math.random()}`,
  portfolio_id: portfolioId,
  total_value_usd: 95000,
  asset_breakdown: [
    { symbol: 'BTC', amount: 1.5, value_usd: 75000, percentage: 78.95 },
    { symbol: 'ETH', amount: 10, value_usd: 20000, percentage: 21.05 },
  ],
  recorded_at: new Date().toISOString(),
  ...overrides,
});

// ═══════════════════════════════════════════════════════════════
// InMemoryPortfolioRepository 테스트
// ═══════════════════════════════════════════════════════════════

describe('InMemoryPortfolioRepository', () => {
  let repository: InMemoryPortfolioRepository;

  beforeEach(() => {
    repository = new InMemoryPortfolioRepository();
  });

  // ─────────────────────────────────────────────────────────────
  // save 테스트
  // ─────────────────────────────────────────────────────────────
  describe('save', () => {
    it('새 포트폴리오 저장 성공', async () => {
      const portfolio = createMockPortfolio({ id: 'portfolio-1' });

      const result = await repository.save(portfolio);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(portfolio);
      expect(result.metadata).toBeDefined();
    });

    it('동일 ID로 업데이트', async () => {
      const portfolio = createMockPortfolio({ id: 'portfolio-1', name: 'Original' });
      await repository.save(portfolio);

      const updated = { ...portfolio, name: 'Updated' };
      const result = await repository.save(updated);

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('Updated');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // getById 테스트
  // ─────────────────────────────────────────────────────────────
  describe('getById', () => {
    it('존재하는 포트폴리오 조회', async () => {
      const portfolio = createMockPortfolio({ id: 'portfolio-1' });
      await repository.save(portfolio);

      const result = await repository.getById('portfolio-1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(portfolio);
    });

    it('존재하지 않는 포트폴리오 조회', async () => {
      const result = await repository.getById('non-existent');

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });
  });

  // ─────────────────────────────────────────────────────────────
  // getByUserId 테스트
  // ─────────────────────────────────────────────────────────────
  describe('getByUserId', () => {
    it('사용자의 모든 포트폴리오 조회', async () => {
      const portfolio1 = createMockPortfolio({ id: 'p1', user_id: 'user-1', name: 'Portfolio 1' });
      const portfolio2 = createMockPortfolio({ id: 'p2', user_id: 'user-1', name: 'Portfolio 2' });
      const portfolio3 = createMockPortfolio({ id: 'p3', user_id: 'user-2', name: 'Portfolio 3' });

      await repository.save(portfolio1);
      await repository.save(portfolio2);
      await repository.save(portfolio3);

      const result = await repository.getByUserId('user-1');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.map(p => p.name)).toContain('Portfolio 1');
      expect(result.data?.map(p => p.name)).toContain('Portfolio 2');
    });

    it('포트폴리오 없는 사용자', async () => {
      const result = await repository.getByUserId('new-user');

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // delete 테스트
  // ─────────────────────────────────────────────────────────────
  describe('delete', () => {
    it('포트폴리오 삭제', async () => {
      const portfolio = createMockPortfolio({ id: 'portfolio-1' });
      await repository.save(portfolio);

      const deleteResult = await repository.delete('portfolio-1');
      expect(deleteResult.success).toBe(true);
      expect(deleteResult.data).toBe(true);

      const getResult = await repository.getById('portfolio-1');
      expect(getResult.data).toBeNull();
    });

    it('존재하지 않는 포트폴리오 삭제', async () => {
      const result = await repository.delete('non-existent');

      expect(result.success).toBe(true);
      expect(result.data).toBe(false);
    });

    it('삭제 시 스냅샷도 함께 삭제', async () => {
      const portfolio = createMockPortfolio({ id: 'portfolio-1' });
      await repository.save(portfolio);

      const snapshot = createMockSnapshot('portfolio-1');
      await repository.saveSnapshot(snapshot);

      await repository.delete('portfolio-1');

      const snapshots = await repository.getSnapshots('portfolio-1');
      expect(snapshots.data).toHaveLength(0);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // updateAssets 테스트
  // ─────────────────────────────────────────────────────────────
  describe('updateAssets', () => {
    it('자산 업데이트 성공', async () => {
      const portfolio = createMockPortfolio({ id: 'portfolio-1' });
      await repository.save(portfolio);

      const newAssets: IAsset[] = [
        createMockAsset('BTC', 2, 55000),
        createMockAsset('SOL', 100, 100),
      ];
      const syncedAt = new Date().toISOString();

      const result = await repository.updateAssets('portfolio-1', newAssets, syncedAt);

      expect(result.success).toBe(true);
      expect(result.data?.assets).toHaveLength(2);
      expect(result.data?.total_value_usd).toBe(120000);
      expect(result.data?.synced_at).toBe(syncedAt);
      expect(result.data?.sync_status).toBe('success');
    });

    it('존재하지 않는 포트폴리오 업데이트', async () => {
      const newAssets: IAsset[] = [createMockAsset('BTC', 1, 50000)];

      const result = await repository.updateAssets('non-existent', newAssets, new Date().toISOString());

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  // ─────────────────────────────────────────────────────────────
  // saveSnapshot 테스트
  // ─────────────────────────────────────────────────────────────
  describe('saveSnapshot', () => {
    it('스냅샷 저장', async () => {
      const snapshot = createMockSnapshot('portfolio-1');

      const result = await repository.saveSnapshot(snapshot);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(snapshot);
    });

    it('여러 스냅샷 저장', async () => {
      const snapshot1 = createMockSnapshot('portfolio-1', {
        id: 'snap-1',
        recorded_at: '2024-01-01T00:00:00.000Z',
        total_value_usd: 90000,
      });
      const snapshot2 = createMockSnapshot('portfolio-1', {
        id: 'snap-2',
        recorded_at: '2024-01-02T00:00:00.000Z',
        total_value_usd: 95000,
      });

      await repository.saveSnapshot(snapshot1);
      await repository.saveSnapshot(snapshot2);

      const result = await repository.getSnapshots('portfolio-1');
      expect(result.data).toHaveLength(2);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // getSnapshots 테스트
  // ─────────────────────────────────────────────────────────────
  describe('getSnapshots', () => {
    beforeEach(async () => {
      // 테스트 데이터 설정
      const snapshots = [
        createMockSnapshot('portfolio-1', { id: 's1', recorded_at: '2024-01-01T00:00:00.000Z' }),
        createMockSnapshot('portfolio-1', { id: 's2', recorded_at: '2024-01-15T00:00:00.000Z' }),
        createMockSnapshot('portfolio-1', { id: 's3', recorded_at: '2024-02-01T00:00:00.000Z' }),
        createMockSnapshot('portfolio-1', { id: 's4', recorded_at: '2024-02-15T00:00:00.000Z' }),
        createMockSnapshot('portfolio-1', { id: 's5', recorded_at: '2024-03-01T00:00:00.000Z' }),
      ];

      for (const snapshot of snapshots) {
        await repository.saveSnapshot(snapshot);
      }
    });

    it('모든 스냅샷 조회', async () => {
      const result = await repository.getSnapshots('portfolio-1');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(5);
      expect(result.pagination?.total).toBe(5);
    });

    it('날짜 범위 필터링', async () => {
      const result = await repository.getSnapshots(
        'portfolio-1',
        new Date('2024-01-10'),
        new Date('2024-02-10')
      );

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
    });

    it('페이지네이션', async () => {
      const result = await repository.getSnapshots(
        'portfolio-1',
        undefined,
        undefined,
        { page: 1, limit: 2 }
      );

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.pagination?.page).toBe(1);
      expect(result.pagination?.limit).toBe(2);
      expect(result.pagination?.total).toBe(5);
      expect(result.pagination?.hasMore).toBe(true);
    });

    it('두 번째 페이지 조회', async () => {
      const result = await repository.getSnapshots(
        'portfolio-1',
        undefined,
        undefined,
        { page: 2, limit: 2 }
      );

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.pagination?.page).toBe(2);
      expect(result.pagination?.hasMore).toBe(true);
    });

    it('시간순 정렬', async () => {
      const result = await repository.getSnapshots('portfolio-1');

      expect(result.success).toBe(true);
      const dates = result.data!.map(s => new Date(s.recorded_at).getTime());

      for (let i = 1; i < dates.length; i++) {
        expect(dates[i]).toBeGreaterThanOrEqual(dates[i - 1]);
      }
    });

    it('스냅샷 없는 포트폴리오', async () => {
      const result = await repository.getSnapshots('non-existent');

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
      expect(result.pagination?.total).toBe(0);
    });
  });
});

// ═══════════════════════════════════════════════════════════════
// 불변성 테스트
// ═══════════════════════════════════════════════════════════════

describe('Repository Immutability', () => {
  let repository: InMemoryPortfolioRepository;

  beforeEach(() => {
    repository = new InMemoryPortfolioRepository();
  });

  it('저장된 포트폴리오 수정이 원본에 영향 없음', async () => {
    const portfolio = createMockPortfolio({ id: 'portfolio-1', name: 'Original' });
    await repository.save(portfolio);

    const getResult = await repository.getById('portfolio-1');
    if (getResult.data) {
      getResult.data.name = 'Modified';
    }

    const getResult2 = await repository.getById('portfolio-1');
    expect(getResult2.data?.name).toBe('Original');
  });

  it('저장된 스냅샷 수정이 원본에 영향 없음', async () => {
    const snapshot = createMockSnapshot('portfolio-1', { id: 'snap-1', total_value_usd: 100000 });
    await repository.saveSnapshot(snapshot);

    const getResult = await repository.getSnapshots('portfolio-1');
    if (getResult.data && getResult.data[0]) {
      getResult.data[0].total_value_usd = 999999;
    }

    const getResult2 = await repository.getSnapshots('portfolio-1');
    expect(getResult2.data?.[0]?.total_value_usd).toBe(100000);
  });
});

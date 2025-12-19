/**
 * @forge/core - Strategy Repository
 * L2 (Cells) - 전략 저장소
 */

import type { HephaitosTypes, IResult, Timestamp } from '@forge/types';

type IStrategy = HephaitosTypes.IStrategy;
type ICreateStrategyInput = HephaitosTypes.ICreateStrategyInput;

/**
 * 전략 저장소 인터페이스
 */
export interface IStrategyRepository {
  /** 전략 저장 */
  save(strategy: IStrategy): Promise<IResult<IStrategy>>;

  /** 전략 생성 */
  create(input: ICreateStrategyInput): Promise<IResult<IStrategy>>;

  /** 전략 조회 */
  getById(id: string): Promise<IResult<IStrategy | null>>;

  /** 전략 목록 조회 */
  list(filters?: {
    type?: HephaitosTypes.StrategyType;
    tags?: string[];
  }): Promise<IResult<IStrategy[]>>;

  /** 전략 업데이트 */
  update(id: string, updates: Partial<IStrategy>): Promise<IResult<IStrategy>>;

  /** 전략 삭제 */
  delete(id: string): Promise<IResult<boolean>>;

  /** 전략 복제 */
  duplicate(id: string, newName: string): Promise<IResult<IStrategy>>;
}

/**
 * 인메모리 전략 저장소
 */
export class InMemoryStrategyRepository implements IStrategyRepository {
  private strategies: Map<string, IStrategy> = new Map();

  async save(strategy: IStrategy): Promise<IResult<IStrategy>> {
    const startTime = Date.now();

    this.strategies.set(strategy.id, {
      ...strategy,
      metadata: {
        ...strategy.metadata,
        updatedAt: new Date().toISOString(),
      },
    });

    return {
      success: true,
      data: this.strategies.get(strategy.id)!,
      metadata: {
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      },
    };
  }

  async create(input: ICreateStrategyInput): Promise<IResult<IStrategy>> {
    const startTime = Date.now();
    const now = new Date().toISOString();

    const strategy: IStrategy = {
      ...input,
      id: crypto.randomUUID(),
      metadata: {
        createdAt: now,
        updatedAt: now,
      },
    };

    this.strategies.set(strategy.id, strategy);

    return {
      success: true,
      data: strategy,
      metadata: {
        timestamp: now,
        duration_ms: Date.now() - startTime,
      },
    };
  }

  async getById(id: string): Promise<IResult<IStrategy | null>> {
    const startTime = Date.now();
    const strategy = this.strategies.get(id) ?? null;

    return {
      success: true,
      data: strategy,
      metadata: {
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      },
    };
  }

  async list(filters?: {
    type?: HephaitosTypes.StrategyType;
    tags?: string[];
  }): Promise<IResult<IStrategy[]>> {
    const startTime = Date.now();

    let strategies = Array.from(this.strategies.values());

    if (filters?.type) {
      strategies = strategies.filter(s => s.type === filters.type);
    }

    if (filters?.tags && filters.tags.length > 0) {
      strategies = strategies.filter(s =>
        filters.tags!.some(tag => s.metadata.tags?.includes(tag))
      );
    }

    // 최신순 정렬
    strategies.sort((a, b) =>
      new Date(b.metadata.updatedAt).getTime() -
      new Date(a.metadata.updatedAt).getTime()
    );

    return {
      success: true,
      data: strategies,
      metadata: {
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      },
    };
  }

  async update(
    id: string,
    updates: Partial<IStrategy>
  ): Promise<IResult<IStrategy>> {
    const startTime = Date.now();

    const existing = this.strategies.get(id);
    if (!existing) {
      return {
        success: false,
        error: new Error(`Strategy not found: ${id}`),
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    }

    const updated: IStrategy = {
      ...existing,
      ...updates,
      id, // ID는 변경 불가
      metadata: {
        ...existing.metadata,
        ...updates.metadata,
        updatedAt: new Date().toISOString(),
      },
    };

    this.strategies.set(id, updated);

    return {
      success: true,
      data: updated,
      metadata: {
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      },
    };
  }

  async delete(id: string): Promise<IResult<boolean>> {
    const startTime = Date.now();
    const deleted = this.strategies.delete(id);

    return {
      success: true,
      data: deleted,
      metadata: {
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      },
    };
  }

  async duplicate(id: string, newName: string): Promise<IResult<IStrategy>> {
    const startTime = Date.now();

    const original = this.strategies.get(id);
    if (!original) {
      return {
        success: false,
        error: new Error(`Strategy not found: ${id}`),
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    }

    const now = new Date().toISOString();
    const duplicate: IStrategy = {
      ...original,
      id: crypto.randomUUID(),
      name: newName,
      metadata: {
        ...original.metadata,
        createdAt: now,
        updatedAt: now,
      },
    };

    this.strategies.set(duplicate.id, duplicate);

    return {
      success: true,
      data: duplicate,
      metadata: {
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      },
    };
  }
}

/**
 * 전략 저장소 팩토리
 */
export function createStrategyRepository(): IStrategyRepository {
  return new InMemoryStrategyRepository();
}

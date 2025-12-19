/**
 * @forge/core - Order Repository
 * L2 (Cells) - 주문 및 포지션 저장소
 *
 * 주문 CRUD 및 포지션 관리
 */

import type { HephaitosTypes } from '@forge/types';

type IOrder = HephaitosTypes.IOrder;
type IOrderWithMeta = HephaitosTypes.IOrderWithMeta;
type IPosition = HephaitosTypes.IPosition;
type IPositionWithMeta = HephaitosTypes.IPositionWithMeta;
type ITrade = HephaitosTypes.ITrade;
type IOrderExecution = HephaitosTypes.IOrderExecution;
type OrderStatus = HephaitosTypes.OrderStatus;
type IOrderHistoryFilter = HephaitosTypes.IOrderHistoryFilter;
type OrderSide = HephaitosTypes.OrderSide;

// ═══════════════════════════════════════════════════════════════
// 주문 저장소 인터페이스
// ═══════════════════════════════════════════════════════════════

/**
 * 주문 저장소 인터페이스
 */
export interface IOrderRepository {
  // CRUD
  createOrder(order: IOrderWithMeta): Promise<IOrderWithMeta>;
  getOrderById(orderId: string): Promise<IOrderWithMeta | null>;
  updateOrder(orderId: string, updates: Partial<IOrderWithMeta>): Promise<IOrderWithMeta | null>;
  deleteOrder(orderId: string): Promise<boolean>;

  // 쿼리
  getOpenOrders(symbol?: string): Promise<IOrderWithMeta[]>;
  getOrdersByStatus(status: OrderStatus[]): Promise<IOrderWithMeta[]>;
  getOrderHistory(filter: IOrderHistoryFilter): Promise<IOrderWithMeta[]>;
  getOrdersByStrategy(strategyId: string): Promise<IOrderWithMeta[]>;

  // 실행 기록
  addExecution(orderId: string, execution: IOrderExecution): Promise<IOrderWithMeta | null>;

  // 통계
  countOrdersByStatus(): Promise<Record<OrderStatus, number>>;
}

/**
 * 포지션 저장소 인터페이스
 */
export interface IPositionRepository {
  // CRUD
  createPosition(position: IPositionWithMeta): Promise<IPositionWithMeta>;
  getPositionById(positionId: string): Promise<IPositionWithMeta | null>;
  updatePosition(positionId: string, updates: Partial<IPositionWithMeta>): Promise<IPositionWithMeta | null>;
  deletePosition(positionId: string): Promise<boolean>;

  // 쿼리
  getOpenPositions(symbol?: string): Promise<IPositionWithMeta[]>;
  getPositionBySymbol(symbol: string): Promise<IPositionWithMeta | null>;
  getClosedPositions(filter?: { dateRange?: { start: string; end: string } }): Promise<IPositionWithMeta[]>;
  getPositionsByStrategy(strategyId: string): Promise<IPositionWithMeta[]>;

  // 업데이트
  updateCurrentPrice(symbol: string, currentPrice: number): Promise<void>;
  closePosition(positionId: string, exitPrice: number, exitTime: string): Promise<IPositionWithMeta | null>;
  addPartialExit(
    positionId: string,
    exitPrice: number,
    quantity: number,
    exitedAt: string
  ): Promise<IPositionWithMeta | null>;

  // 통계
  getTotalUnrealizedPnL(): Promise<number>;
  countOpenPositions(): Promise<number>;
}

// ═══════════════════════════════════════════════════════════════
// In-Memory 주문 저장소 구현
// ═══════════════════════════════════════════════════════════════

export class InMemoryOrderRepository implements IOrderRepository {
  private orders: Map<string, IOrderWithMeta> = new Map();

  async createOrder(order: IOrderWithMeta): Promise<IOrderWithMeta> {
    this.orders.set(order.id, order);
    return order;
  }

  async getOrderById(orderId: string): Promise<IOrderWithMeta | null> {
    return this.orders.get(orderId) ?? null;
  }

  async updateOrder(
    orderId: string,
    updates: Partial<IOrderWithMeta>
  ): Promise<IOrderWithMeta | null> {
    const order = this.orders.get(orderId);
    if (!order) return null;

    const updated: IOrderWithMeta = {
      ...order,
      ...updates,
      id: order.id, // ID 변경 방지
      updatedAt: new Date().toISOString(),
    };

    this.orders.set(orderId, updated);
    return updated;
  }

  async deleteOrder(orderId: string): Promise<boolean> {
    return this.orders.delete(orderId);
  }

  async getOpenOrders(symbol?: string): Promise<IOrderWithMeta[]> {
    const openStatuses: OrderStatus[] = ['pending', 'open', 'partial'];
    let orders = Array.from(this.orders.values()).filter(o =>
      openStatuses.includes(o.status)
    );

    if (symbol) {
      orders = orders.filter(o => o.symbol === symbol);
    }

    return orders.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getOrdersByStatus(status: OrderStatus[]): Promise<IOrderWithMeta[]> {
    return Array.from(this.orders.values())
      .filter(o => status.includes(o.status))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }

  async getOrderHistory(filter: IOrderHistoryFilter): Promise<IOrderWithMeta[]> {
    let orders = Array.from(this.orders.values());

    if (filter.symbol) {
      orders = orders.filter(o => o.symbol === filter.symbol);
    }

    if (filter.side) {
      orders = orders.filter(o => o.side === filter.side);
    }

    if (filter.status && filter.status.length > 0) {
      orders = orders.filter(o => filter.status!.includes(o.status));
    }

    if (filter.dateRange) {
      const startTime = new Date(filter.dateRange.start).getTime();
      const endTime = new Date(filter.dateRange.end).getTime();
      orders = orders.filter(o => {
        const orderTime = new Date(o.createdAt).getTime();
        return orderTime >= startTime && orderTime <= endTime;
      });
    }

    if (filter.strategyId) {
      orders = orders.filter(o => o.strategyId === filter.strategyId);
    }

    if (filter.tags && filter.tags.length > 0) {
      orders = orders.filter(o =>
        o.tags?.some(tag => filter.tags!.includes(tag))
      );
    }

    // 정렬 (최신순)
    orders.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // 페이지네이션
    const page = filter.page ?? 1;
    const pageSize = filter.pageSize ?? 50;
    const start = (page - 1) * pageSize;

    return orders.slice(start, start + pageSize);
  }

  async getOrdersByStrategy(strategyId: string): Promise<IOrderWithMeta[]> {
    return Array.from(this.orders.values())
      .filter(o => o.strategyId === strategyId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }

  async addExecution(
    orderId: string,
    execution: IOrderExecution
  ): Promise<IOrderWithMeta | null> {
    const order = this.orders.get(orderId);
    if (!order) return null;

    const updated: IOrderWithMeta = {
      ...order,
      executions: [...order.executions, execution],
      filledQuantity: order.filledQuantity + execution.trade.quantity,
      avgFillPrice: this.calculateAvgFillPrice(order, execution),
      totalFees: order.totalFees + execution.trade.fee,
      updatedAt: new Date().toISOString(),
    };

    // 상태 업데이트
    if (updated.filledQuantity >= order.quantity) {
      updated.status = 'filled';
    } else if (updated.filledQuantity > 0) {
      updated.status = 'partial';
    }

    this.orders.set(orderId, updated);
    return updated;
  }

  private calculateAvgFillPrice(
    order: IOrderWithMeta,
    newExecution: IOrderExecution
  ): number {
    const totalQty = order.filledQuantity + newExecution.trade.quantity;
    if (totalQty === 0) return 0;

    const existingValue = order.filledQuantity * (order.avgFillPrice ?? 0);
    const newValue = newExecution.trade.quantity * newExecution.trade.price;

    return (existingValue + newValue) / totalQty;
  }

  async countOrdersByStatus(): Promise<Record<OrderStatus, number>> {
    const counts: Record<OrderStatus, number> = {
      pending: 0,
      open: 0,
      partial: 0,
      filled: 0,
      cancelled: 0,
      rejected: 0,
    };

    for (const order of this.orders.values()) {
      counts[order.status]++;
    }

    return counts;
  }
}

// ═══════════════════════════════════════════════════════════════
// In-Memory 포지션 저장소 구현
// ═══════════════════════════════════════════════════════════════

export class InMemoryPositionRepository implements IPositionRepository {
  private positions: Map<string, IPositionWithMeta> = new Map();
  private positionsBySymbol: Map<string, string> = new Map(); // symbol -> id (오픈 포지션만)

  async createPosition(position: IPositionWithMeta): Promise<IPositionWithMeta> {
    this.positions.set(position.id, position);

    if (position.status === 'open') {
      this.positionsBySymbol.set(position.symbol, position.id);
    }

    return position;
  }

  async getPositionById(positionId: string): Promise<IPositionWithMeta | null> {
    return this.positions.get(positionId) ?? null;
  }

  async updatePosition(
    positionId: string,
    updates: Partial<IPositionWithMeta>
  ): Promise<IPositionWithMeta | null> {
    const position = this.positions.get(positionId);
    if (!position) return null;

    const updated: IPositionWithMeta = {
      ...position,
      ...updates,
      id: position.id,
    };

    this.positions.set(positionId, updated);

    // 심볼 인덱스 업데이트
    if (updated.status === 'closed') {
      this.positionsBySymbol.delete(updated.symbol);
    }

    return updated;
  }

  async deletePosition(positionId: string): Promise<boolean> {
    const position = this.positions.get(positionId);
    if (position) {
      this.positionsBySymbol.delete(position.symbol);
    }
    return this.positions.delete(positionId);
  }

  async getOpenPositions(symbol?: string): Promise<IPositionWithMeta[]> {
    let positions = Array.from(this.positions.values()).filter(
      p => p.status === 'open'
    );

    if (symbol) {
      positions = positions.filter(p => p.symbol === symbol);
    }

    return positions;
  }

  async getPositionBySymbol(symbol: string): Promise<IPositionWithMeta | null> {
    const positionId = this.positionsBySymbol.get(symbol);
    if (!positionId) return null;
    return this.positions.get(positionId) ?? null;
  }

  async getClosedPositions(
    filter?: { dateRange?: { start: string; end: string } }
  ): Promise<IPositionWithMeta[]> {
    let positions = Array.from(this.positions.values()).filter(
      p => p.status === 'closed'
    );

    if (filter?.dateRange) {
      const startTime = new Date(filter.dateRange.start).getTime();
      const endTime = new Date(filter.dateRange.end).getTime();
      positions = positions.filter(p => {
        if (!p.closedAt) return false;
        const closedTime = new Date(p.closedAt).getTime();
        return closedTime >= startTime && closedTime <= endTime;
      });
    }

    return positions.sort((a, b) => {
      const aTime = a.closedAt ? new Date(a.closedAt).getTime() : 0;
      const bTime = b.closedAt ? new Date(b.closedAt).getTime() : 0;
      return bTime - aTime;
    });
  }

  async getPositionsByStrategy(strategyId: string): Promise<IPositionWithMeta[]> {
    return Array.from(this.positions.values()).filter(
      p => p.strategyId === strategyId
    );
  }

  async updateCurrentPrice(symbol: string, currentPrice: number): Promise<void> {
    const positionId = this.positionsBySymbol.get(symbol);
    if (!positionId) return;

    const position = this.positions.get(positionId);
    if (!position || position.status !== 'open') return;

    // PnL 재계산
    const direction = position.side === 'buy' ? 1 : -1;
    const unrealizedPnL =
      direction * (currentPrice - position.entryPrice) * position.quantity;
    const unrealizedPnLPercent =
      direction *
      ((currentPrice - position.entryPrice) / position.entryPrice) *
      100;

    // MFE/MAE 업데이트
    let mfe = position.mfe;
    let mae = position.mae;
    let peakPrice = position.peakPrice ?? currentPrice;
    let troughPrice = position.troughPrice ?? currentPrice;

    if (position.side === 'buy') {
      if (currentPrice > peakPrice) {
        peakPrice = currentPrice;
        mfe = Math.max(mfe, unrealizedPnLPercent);
      }
      if (currentPrice < troughPrice) {
        troughPrice = currentPrice;
        mae = Math.min(mae, unrealizedPnLPercent);
      }
    } else {
      if (currentPrice < troughPrice) {
        troughPrice = currentPrice;
        mfe = Math.max(mfe, unrealizedPnLPercent);
      }
      if (currentPrice > peakPrice) {
        peakPrice = currentPrice;
        mae = Math.min(mae, unrealizedPnLPercent);
      }
    }

    const updated: IPositionWithMeta = {
      ...position,
      currentPrice,
      unrealizedPnL,
      unrealizedPnLPercent,
      mfe,
      mae,
      peakPrice,
      troughPrice,
    };

    this.positions.set(positionId, updated);
  }

  async closePosition(
    positionId: string,
    exitPrice: number,
    exitTime: string
  ): Promise<IPositionWithMeta | null> {
    const position = this.positions.get(positionId);
    if (!position || position.status !== 'open') return null;

    const direction = position.side === 'buy' ? 1 : -1;
    const realizedPnL =
      direction * (exitPrice - position.entryPrice) * position.quantity -
      position.totalFees;

    const updated: IPositionWithMeta = {
      ...position,
      status: 'closed',
      exitPrice,
      closedAt: exitTime,
      realizedPnL,
      currentPrice: exitPrice,
      unrealizedPnL: 0,
      unrealizedPnLPercent: 0,
    };

    this.positions.set(positionId, updated);
    this.positionsBySymbol.delete(position.symbol);

    return updated;
  }

  async addPartialExit(
    positionId: string,
    exitPrice: number,
    quantity: number,
    exitedAt: string
  ): Promise<IPositionWithMeta | null> {
    const position = this.positions.get(positionId);
    if (!position || position.status !== 'open') return null;

    if (quantity > position.quantity) {
      quantity = position.quantity;
    }

    const direction = position.side === 'buy' ? 1 : -1;
    const realizedPnL =
      direction * (exitPrice - position.entryPrice) * quantity;

    const exitRecord = {
      exitedAt,
      exitPrice,
      quantity,
      realizedPnL,
      exitPercent: (quantity / position.quantity) * 100,
    };

    const remainingQty = position.quantity - quantity;

    const updated: IPositionWithMeta = {
      ...position,
      quantity: remainingQty,
      partialExits: [...position.partialExits, exitRecord],
    };

    // 전량 청산 시
    if (remainingQty <= 0) {
      updated.status = 'closed';
      updated.closedAt = exitedAt;
      updated.exitPrice = exitPrice;
      updated.realizedPnL = position.partialExits.reduce(
        (sum, e) => sum + e.realizedPnL,
        0
      ) + realizedPnL;
      this.positionsBySymbol.delete(position.symbol);
    }

    this.positions.set(positionId, updated);
    return updated;
  }

  async getTotalUnrealizedPnL(): Promise<number> {
    let total = 0;
    for (const position of this.positions.values()) {
      if (position.status === 'open') {
        total += position.unrealizedPnL;
      }
    }
    return total;
  }

  async countOpenPositions(): Promise<number> {
    return this.positionsBySymbol.size;
  }
}

// ═══════════════════════════════════════════════════════════════
// 팩토리 함수
// ═══════════════════════════════════════════════════════════════

export function createOrderRepository(): IOrderRepository {
  return new InMemoryOrderRepository();
}

export function createPositionRepository(): IPositionRepository {
  return new InMemoryPositionRepository();
}

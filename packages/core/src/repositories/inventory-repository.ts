/**
 * @forge/core - Inventory Repository
 * L2 (Cells) - 재고 데이터 저장소
 *
 * 재고 품목, 재고 수준, 발주서 CRUD
 */

import type { FolioTypes } from '@forge/types';

type IInventoryItem = FolioTypes.IInventoryItem;
type IStockLevel = FolioTypes.IStockLevel;
type IStockMovement = FolioTypes.IStockMovement;
type IPurchaseOrder = FolioTypes.IPurchaseOrder;
type ISupplier = FolioTypes.ISupplier;
type StockStatus = FolioTypes.StockStatus;
type ABCClass = FolioTypes.ABCClass;
type OrderStatus = FolioTypes.OrderStatus;

/**
 * 재고 저장소 인터페이스
 */
export interface IInventoryRepository {
  // ═══════════════════════════════════════════════════════════════
  // 품목 관리
  // ═══════════════════════════════════════════════════════════════

  /** 품목 생성 */
  createItem(item: IInventoryItem): Promise<IInventoryItem>;

  /** 품목 조회 */
  getItemById(itemId: string): Promise<IInventoryItem | null>;

  /** SKU로 품목 조회 */
  getItemBySku(sku: string): Promise<IInventoryItem | null>;

  /** 전체 품목 목록 */
  getAllItems(filter?: {
    category?: string;
    abcClass?: ABCClass;
    active?: boolean;
    supplierId?: string;
  }): Promise<IInventoryItem[]>;

  /** 품목 업데이트 */
  updateItem(
    itemId: string,
    updates: Partial<IInventoryItem>
  ): Promise<IInventoryItem | null>;

  /** 품목 삭제 */
  deleteItem(itemId: string): Promise<boolean>;

  // ═══════════════════════════════════════════════════════════════
  // 재고 수준 관리
  // ═══════════════════════════════════════════════════════════════

  /** 재고 수준 생성/업데이트 */
  upsertStockLevel(stockLevel: IStockLevel): Promise<IStockLevel>;

  /** 재고 수준 조회 */
  getStockLevel(itemId: string): Promise<IStockLevel | null>;

  /** 전체 재고 수준 목록 */
  getAllStockLevels(filter?: {
    status?: StockStatus[];
  }): Promise<IStockLevel[]>;

  /** 재고 상태별 품목 수 */
  countByStatus(): Promise<Record<StockStatus, number>>;

  // ═══════════════════════════════════════════════════════════════
  // 재고 이동
  // ═══════════════════════════════════════════════════════════════

  /** 재고 이동 기록 */
  recordMovement(movement: IStockMovement): Promise<IStockMovement>;

  /** 재고 이동 이력 조회 */
  getMovementHistory(
    itemId: string,
    limit?: number
  ): Promise<IStockMovement[]>;

  // ═══════════════════════════════════════════════════════════════
  // 발주서 관리
  // ═══════════════════════════════════════════════════════════════

  /** 발주서 생성 */
  createPurchaseOrder(order: IPurchaseOrder): Promise<IPurchaseOrder>;

  /** 발주서 조회 */
  getPurchaseOrderById(orderId: string): Promise<IPurchaseOrder | null>;

  /** 발주서 목록 */
  getPurchaseOrders(filter?: {
    status?: OrderStatus[];
    supplierId?: string;
    dateRange?: { start: string; end: string };
  }): Promise<IPurchaseOrder[]>;

  /** 발주서 상태 업데이트 */
  updatePurchaseOrderStatus(
    orderId: string,
    status: OrderStatus,
    metadata?: { actualDeliveryDate?: string }
  ): Promise<IPurchaseOrder | null>;

  // ═══════════════════════════════════════════════════════════════
  // 공급업체 관리
  // ═══════════════════════════════════════════════════════════════

  /** 공급업체 생성 */
  createSupplier(supplier: ISupplier): Promise<ISupplier>;

  /** 공급업체 조회 */
  getSupplierById(supplierId: string): Promise<ISupplier | null>;

  /** 공급업체 목록 */
  getAllSuppliers(activeOnly?: boolean): Promise<ISupplier[]>;

  /** 공급업체 업데이트 */
  updateSupplier(
    supplierId: string,
    updates: Partial<ISupplier>
  ): Promise<ISupplier | null>;
}

/**
 * In-Memory 재고 저장소 구현
 */
export class InMemoryInventoryRepository implements IInventoryRepository {
  private items: Map<string, IInventoryItem> = new Map();
  private itemsBySku: Map<string, string> = new Map(); // sku -> id
  private stockLevels: Map<string, IStockLevel> = new Map();
  private movements: Map<string, IStockMovement[]> = new Map();
  private purchaseOrders: Map<string, IPurchaseOrder> = new Map();
  private suppliers: Map<string, ISupplier> = new Map();

  // ═══════════════════════════════════════════════════════════════
  // 품목 관리
  // ═══════════════════════════════════════════════════════════════

  async createItem(item: IInventoryItem): Promise<IInventoryItem> {
    this.items.set(item.id, item);
    this.itemsBySku.set(item.sku, item.id);
    return item;
  }

  async getItemById(itemId: string): Promise<IInventoryItem | null> {
    return this.items.get(itemId) ?? null;
  }

  async getItemBySku(sku: string): Promise<IInventoryItem | null> {
    const itemId = this.itemsBySku.get(sku);
    if (!itemId) return null;
    return this.items.get(itemId) ?? null;
  }

  async getAllItems(filter?: {
    category?: string;
    abcClass?: ABCClass;
    active?: boolean;
    supplierId?: string;
  }): Promise<IInventoryItem[]> {
    let items = Array.from(this.items.values());

    if (filter) {
      if (filter.category) {
        items = items.filter(i => i.category === filter.category);
      }
      if (filter.abcClass) {
        items = items.filter(i => i.abcClass === filter.abcClass);
      }
      if (filter.active !== undefined) {
        items = items.filter(i => i.active === filter.active);
      }
      if (filter.supplierId) {
        items = items.filter(i => i.supplierId === filter.supplierId);
      }
    }

    return items;
  }

  async updateItem(
    itemId: string,
    updates: Partial<IInventoryItem>
  ): Promise<IInventoryItem | null> {
    const item = this.items.get(itemId);
    if (!item) return null;

    const updated: IInventoryItem = {
      ...item,
      ...updates,
      id: item.id,
      sku: item.sku, // SKU 변경 방지
      metadata: {
        ...item.metadata,
        createdAt: item.metadata?.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    this.items.set(itemId, updated);
    return updated;
  }

  async deleteItem(itemId: string): Promise<boolean> {
    const item = this.items.get(itemId);
    if (!item) return false;

    this.itemsBySku.delete(item.sku);
    this.stockLevels.delete(itemId);
    this.movements.delete(itemId);
    return this.items.delete(itemId);
  }

  // ═══════════════════════════════════════════════════════════════
  // 재고 수준 관리
  // ═══════════════════════════════════════════════════════════════

  async upsertStockLevel(stockLevel: IStockLevel): Promise<IStockLevel> {
    this.stockLevels.set(stockLevel.itemId, stockLevel);
    return stockLevel;
  }

  async getStockLevel(itemId: string): Promise<IStockLevel | null> {
    return this.stockLevels.get(itemId) ?? null;
  }

  async getAllStockLevels(filter?: {
    status?: StockStatus[];
  }): Promise<IStockLevel[]> {
    let levels = Array.from(this.stockLevels.values());

    if (filter?.status && filter.status.length > 0) {
      levels = levels.filter(l => filter.status!.includes(l.status));
    }

    return levels;
  }

  async countByStatus(): Promise<Record<StockStatus, number>> {
    const counts: Record<StockStatus, number> = {
      normal: 0,
      low: 0,
      critical: 0,
      stockout: 0,
      overstock: 0,
    };

    for (const level of this.stockLevels.values()) {
      counts[level.status]++;
    }

    return counts;
  }

  // ═══════════════════════════════════════════════════════════════
  // 재고 이동
  // ═══════════════════════════════════════════════════════════════

  async recordMovement(movement: IStockMovement): Promise<IStockMovement> {
    const itemMovements = this.movements.get(movement.itemId) ?? [];
    itemMovements.push(movement);
    this.movements.set(movement.itemId, itemMovements);
    return movement;
  }

  async getMovementHistory(
    itemId: string,
    limit: number = 100
  ): Promise<IStockMovement[]> {
    const movements = this.movements.get(itemId) ?? [];
    return movements
      .sort(
        (a, b) =>
          new Date(b.movedAt).getTime() - new Date(a.movedAt).getTime()
      )
      .slice(0, limit);
  }

  // ═══════════════════════════════════════════════════════════════
  // 발주서 관리
  // ═══════════════════════════════════════════════════════════════

  async createPurchaseOrder(order: IPurchaseOrder): Promise<IPurchaseOrder> {
    this.purchaseOrders.set(order.id, order);
    return order;
  }

  async getPurchaseOrderById(orderId: string): Promise<IPurchaseOrder | null> {
    return this.purchaseOrders.get(orderId) ?? null;
  }

  async getPurchaseOrders(filter?: {
    status?: OrderStatus[];
    supplierId?: string;
    dateRange?: { start: string; end: string };
  }): Promise<IPurchaseOrder[]> {
    let orders = Array.from(this.purchaseOrders.values());

    if (filter) {
      if (filter.status && filter.status.length > 0) {
        orders = orders.filter(o => filter.status!.includes(o.status));
      }
      if (filter.supplierId) {
        orders = orders.filter(o => o.supplierId === filter.supplierId);
      }
      if (filter.dateRange) {
        const startTime = new Date(filter.dateRange.start).getTime();
        const endTime = new Date(filter.dateRange.end).getTime();
        orders = orders.filter(o => {
          const orderTime = new Date(o.createdAt).getTime();
          return orderTime >= startTime && orderTime <= endTime;
        });
      }
    }

    return orders.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async updatePurchaseOrderStatus(
    orderId: string,
    status: OrderStatus,
    metadata?: { actualDeliveryDate?: string }
  ): Promise<IPurchaseOrder | null> {
    const order = this.purchaseOrders.get(orderId);
    if (!order) return null;

    const updated: IPurchaseOrder = {
      ...order,
      status,
      updatedAt: new Date().toISOString(),
      actualDeliveryDate: metadata?.actualDeliveryDate ?? order.actualDeliveryDate,
    };

    this.purchaseOrders.set(orderId, updated);
    return updated;
  }

  // ═══════════════════════════════════════════════════════════════
  // 공급업체 관리
  // ═══════════════════════════════════════════════════════════════

  async createSupplier(supplier: ISupplier): Promise<ISupplier> {
    this.suppliers.set(supplier.id, supplier);
    return supplier;
  }

  async getSupplierById(supplierId: string): Promise<ISupplier | null> {
    return this.suppliers.get(supplierId) ?? null;
  }

  async getAllSuppliers(activeOnly: boolean = false): Promise<ISupplier[]> {
    let suppliers = Array.from(this.suppliers.values());

    if (activeOnly) {
      suppliers = suppliers.filter(s => s.active);
    }

    return suppliers;
  }

  async updateSupplier(
    supplierId: string,
    updates: Partial<ISupplier>
  ): Promise<ISupplier | null> {
    const supplier = this.suppliers.get(supplierId);
    if (!supplier) return null;

    const updated: ISupplier = {
      ...supplier,
      ...updates,
      id: supplier.id,
    };

    this.suppliers.set(supplierId, updated);
    return updated;
  }
}

/**
 * 재고 저장소 팩토리
 */
export function createInventoryRepository(): IInventoryRepository {
  return new InMemoryInventoryRepository();
}

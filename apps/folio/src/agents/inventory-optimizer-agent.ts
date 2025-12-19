/**
 * FOLIO - Inventory Optimizer Agent
 * L3 (Tissues) - 재고 최적화 에이전트
 *
 * ┌────────────────────────────────────────────────────────────────┐
 * │                   재고 최적화 워크플로우                         │
 * ├────────────────────────────────────────────────────────────────┤
 * │                                                                │
 * │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
 * │  │   ANALYZE   │───▶│  CLASSIFY   │───▶│  CALCULATE  │        │
 * │  │  수요 분석   │    │  ABC 분류   │    │  EOQ/ROP    │        │
 * │  └─────────────┘    └─────────────┘    └─────────────┘        │
 * │                                               │                │
 * │                     ┌─────────────┐           │                │
 * │                     │  RECOMMEND  │◀──────────┘                │
 * │                     │   발주 추천  │                            │
 * │                     └─────────────┘                            │
 * │                            │                                   │
 * │                     ┌─────────────┐                            │
 * │                     │   MONITOR   │                            │
 * │                     │  재고 모니터 │                            │
 * │                     └─────────────┘                            │
 * │                                                                │
 * └────────────────────────────────────────────────────────────────┘
 */

import type { FolioTypes } from '@forge/types';
import type { IInventoryRepository } from '@forge/core';
import {
  calculateEOQ,
  calculateROP,
  calculateSafetyStock,
  calculateSafetyStockByDays,
  calculateTurnoverRate,
  calculateDaysOfSupply,
  estimateStockoutDate,
  calculateHoldingCostPerUnit,
  calculateStockoutRisk,
  determineStockStatus,
  classifyABC,
  calculateOrderQuantity,
  calculateOrderUrgency,
  calculateDemandStatistics,
  type IABCResult,
} from '@forge/utils';

type IInventoryItem = FolioTypes.IInventoryItem;
type IStockLevel = FolioTypes.IStockLevel;
type IOrderRecommendation = FolioTypes.IOrderRecommendation;
type IInventoryDashboard = FolioTypes.IInventoryDashboard;
type IInventoryAnalysis = FolioTypes.IInventoryAnalysis;
type IInventoryConfig = FolioTypes.IInventoryConfig;
type IPurchaseOrder = FolioTypes.IPurchaseOrder;
type IPurchaseOrderItem = FolioTypes.IPurchaseOrderItem;
type IStockMovement = FolioTypes.IStockMovement;
type ABCClass = FolioTypes.ABCClass;

/**
 * 재고 최적화 에이전트 설정
 */
export interface IInventoryOptimizerConfig extends IInventoryConfig {
  /** 자동 발주 추천 활성화 */
  autoRecommend: boolean;
  /** 추천 생성 주기 (ms) */
  recommendIntervalMs: number;
}

/**
 * 수요 데이터 (분석용)
 */
export interface IDemandData {
  /** 품목 ID */
  itemId: string;
  /** 일별 수요량 */
  dailyDemands: number[];
  /** 분석 기간 (일) */
  periodDays: number;
}

/**
 * 재고 최적화 에이전트
 */
export class InventoryOptimizerAgent {
  private readonly config: IInventoryOptimizerConfig;
  private readonly inventoryRepo: IInventoryRepository;

  /** ABC 분류 캐시 */
  private abcClassification: Map<string, ABCClass> = new Map();

  constructor(
    inventoryRepo: IInventoryRepository,
    config?: Partial<IInventoryOptimizerConfig>
  ) {
    this.inventoryRepo = inventoryRepo;
    this.config = {
      defaultSafetyStockDays: 7,
      serviceLevel: 0.95,
      defaultHoldingCostRate: 25,
      defaultOrderingCost: 50000,
      stockoutWarningDays: 7,
      abcThresholds: {
        aRevenuePercent: 80,
        bRevenuePercent: 15,
      },
      autoRecommend: true,
      recommendIntervalMs: 3600000, // 1시간
      ...config,
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // 재고 분석
  // ═══════════════════════════════════════════════════════════════

  /**
   * 품목별 재고 분석
   */
  async analyzeItem(
    itemId: string,
    demandData: IDemandData
  ): Promise<IInventoryAnalysis> {
    const item = await this.inventoryRepo.getItemById(itemId);
    if (!item) {
      throw new Error(`Item not found: ${itemId}`);
    }

    const stockLevel = await this.inventoryRepo.getStockLevel(itemId);

    // 수요 통계 계산
    const demandStats = calculateDemandStatistics(demandData.dailyDemands);

    // 연간 수요 추정
    const annualDemand = demandStats.avg * 365;

    // 재고 회전율
    const avgInventoryValue =
      (stockLevel?.currentStock ?? 0) * item.unitCost;
    const turnoverRate = calculateTurnoverRate(
      annualDemand * item.unitCost,
      avgInventoryValue
    );

    // 재고일수
    const daysOfSupply = calculateDaysOfSupply(
      stockLevel?.currentStock ?? 0,
      demandStats.avg
    );

    // 연간 보관 비용
    const annualHoldingCost =
      avgInventoryValue * (item.holdingCostRate / 100);

    // 품절 위험도
    const stockoutRisk = calculateStockoutRisk(
      stockLevel?.currentStock ?? 0,
      stockLevel?.reorderPoint ?? 0,
      stockLevel?.safetyStock ?? 0
    );

    // 과잉 재고 여부
    const isOverstocked =
      (stockLevel?.currentStock ?? 0) > (stockLevel?.maxStock ?? Infinity);

    return {
      itemId,
      avgDailyDemand: demandStats.avg,
      demandStdDev: demandStats.stdDev,
      turnoverRate: Math.round(turnoverRate * 100) / 100,
      daysOfSupply: Math.round(daysOfSupply * 10) / 10,
      annualHoldingCost: Math.round(annualHoldingCost),
      stockoutRisk: Math.round(stockoutRisk * 100) / 100,
      isOverstocked,
      analysisPeriod: {
        start: new Date(
          Date.now() - demandData.periodDays * 86400000
        ).toISOString(),
        end: new Date().toISOString(),
      },
    };
  }

  /**
   * 재고 수준 최적화 계산
   */
  async optimizeStockLevels(
    itemId: string,
    demandData: IDemandData
  ): Promise<IStockLevel> {
    const item = await this.inventoryRepo.getItemById(itemId);
    if (!item) {
      throw new Error(`Item not found: ${itemId}`);
    }

    const demandStats = calculateDemandStatistics(demandData.dailyDemands);
    const annualDemand = demandStats.avg * 365;

    // 단위당 보관 비용
    const holdingCostPerUnit = calculateHoldingCostPerUnit(
      item.unitCost,
      item.holdingCostRate
    );

    // EOQ 계산
    const eoqResult = calculateEOQ({
      annualDemand,
      orderingCost: item.orderingCost,
      holdingCostPerUnit,
    });

    // 안전 재고 계산
    const abcClass = this.abcClassification.get(itemId) ?? item.abcClass;
    const safetyDays = this.getSafetyStockDaysByABC(abcClass);

    let safetyStock: number;
    if (demandStats.stdDev > 0) {
      safetyStock = calculateSafetyStock({
        avgDailyDemand: demandStats.avg,
        demandStdDev: demandStats.stdDev,
        leadTimeDays: item.leadTimeDays,
        serviceLevel: this.config.serviceLevel,
      });
    } else {
      safetyStock = calculateSafetyStockByDays(demandStats.avg, safetyDays);
    }

    // ROP 계산
    const reorderPoint = calculateROP({
      avgDailyDemand: demandStats.avg,
      leadTimeDays: item.leadTimeDays,
      safetyStock,
    });

    // 최대 재고 (EOQ + 안전재고)
    const maxStock = eoqResult.eoq + safetyStock;

    // 현재 재고 조회
    const existingLevel = await this.inventoryRepo.getStockLevel(itemId);
    const currentStock = existingLevel?.currentStock ?? 0;
    const reservedStock = existingLevel?.reservedStock ?? 0;
    const incomingStock = existingLevel?.incomingStock ?? 0;

    // 상태 결정
    const status = determineStockStatus(
      currentStock,
      safetyStock,
      reorderPoint,
      maxStock
    );

    const stockLevel: IStockLevel = {
      itemId,
      currentStock,
      reservedStock,
      incomingStock,
      availableStock: currentStock - reservedStock,
      safetyStock,
      reorderPoint,
      maxStock,
      eoq: eoqResult.eoq,
      status,
      lastReceivedAt: existingLevel?.lastReceivedAt,
      lastIssuedAt: existingLevel?.lastIssuedAt,
      updatedAt: new Date().toISOString(),
    };

    // 저장
    await this.inventoryRepo.upsertStockLevel(stockLevel);

    return stockLevel;
  }

  private getSafetyStockDaysByABC(abcClass: ABCClass): number {
    switch (abcClass) {
      case 'A':
        return 3;
      case 'B':
        return 7;
      case 'C':
        return 14;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // ABC 분류
  // ═══════════════════════════════════════════════════════════════

  /**
   * ABC 분류 수행
   */
  async performABCClassification(
    revenueData: Array<{ itemId: string; annualRevenue: number }>
  ): Promise<IABCResult[]> {
    const results = classifyABC(
      revenueData,
      this.config.abcThresholds.aRevenuePercent,
      this.config.abcThresholds.aRevenuePercent +
        this.config.abcThresholds.bRevenuePercent
    );

    // 캐시 업데이트
    for (const result of results) {
      this.abcClassification.set(result.itemId, result.abcClass);

      // DB 업데이트
      await this.inventoryRepo.updateItem(result.itemId, {
        abcClass: result.abcClass,
      });
    }

    return results;
  }

  // ═══════════════════════════════════════════════════════════════
  // 발주 추천
  // ═══════════════════════════════════════════════════════════════

  /**
   * 발주 추천 목록 생성
   */
  async getReorderRecommendations(): Promise<IOrderRecommendation[]> {
    const recommendations: IOrderRecommendation[] = [];

    // 재발주점 이하 품목 조회
    const lowStockLevels = await this.inventoryRepo.getAllStockLevels({
      status: ['low', 'critical', 'stockout'],
    });

    for (const stockLevel of lowStockLevels) {
      const item = await this.inventoryRepo.getItemById(stockLevel.itemId);
      if (!item || !item.active) continue;

      const supplier = await this.inventoryRepo.getSupplierById(item.supplierId);

      // 발주량 계산
      const orderQty = calculateOrderQuantity({
        currentStock: stockLevel.currentStock,
        incomingStock: stockLevel.incomingStock,
        maxStock: stockLevel.maxStock,
        eoq: stockLevel.eoq,
        minOrderQuantity: item.minOrderQuantity,
        orderMultiple: item.orderMultiple,
      });

      if (orderQty <= 0) continue;

      // 재고일수 및 품절 예상일
      const avgDailyDemand =
        stockLevel.reorderPoint / (item.leadTimeDays + this.getSafetyStockDaysByABC(item.abcClass));
      const daysOfSupply = calculateDaysOfSupply(
        stockLevel.currentStock,
        avgDailyDemand
      );
      const estimatedStockout = estimateStockoutDate(daysOfSupply);

      // 긴급도
      const urgency = calculateOrderUrgency(
        daysOfSupply,
        item.leadTimeDays,
        this.getSafetyStockDaysByABC(item.abcClass)
      );

      // 발주 이유
      let reason: string;
      switch (stockLevel.status) {
        case 'stockout':
          reason = '품절 - 즉시 발주 필요';
          break;
        case 'critical':
          reason = '안전재고 이하 - 긴급 발주 필요';
          break;
        case 'low':
          reason = '재발주점 도달 - 발주 필요';
          break;
        default:
          reason = '정기 발주';
      }

      recommendations.push({
        id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        itemId: item.id,
        sku: item.sku,
        itemName: item.name,
        currentStock: stockLevel.currentStock,
        reorderPoint: stockLevel.reorderPoint,
        recommendedQuantity: orderQty,
        reason,
        urgency,
        estimatedStockoutDate: estimatedStockout ?? undefined,
        daysOfSupply: Math.round(daysOfSupply * 10) / 10,
        estimatedCost: orderQty * item.unitCost,
        supplierName: supplier?.name ?? 'Unknown',
        leadTimeDays: item.leadTimeDays,
        createdAt: new Date().toISOString(),
      });
    }

    // 긴급도 순 정렬
    return recommendations.sort((a, b) => b.urgency - a.urgency);
  }

  /**
   * 발주서 생성
   */
  async generatePurchaseOrder(
    recommendations: IOrderRecommendation[]
  ): Promise<IPurchaseOrder | null> {
    if (recommendations.length === 0) return null;

    // 공급업체별 그룹화 (첫 번째 공급업체로)
    const firstItem = await this.inventoryRepo.getItemById(
      recommendations[0].itemId
    );
    if (!firstItem) return null;

    const supplier = await this.inventoryRepo.getSupplierById(
      firstItem.supplierId
    );
    if (!supplier) return null;

    // 발주 항목 생성
    const items: IPurchaseOrderItem[] = [];
    let totalAmount = 0;
    let maxLeadTime = 0;

    for (const rec of recommendations) {
      const item = await this.inventoryRepo.getItemById(rec.itemId);
      if (!item || item.supplierId !== firstItem.supplierId) continue;

      const amount = rec.recommendedQuantity * item.unitCost;
      items.push({
        itemId: item.id,
        sku: item.sku,
        name: item.name,
        quantity: rec.recommendedQuantity,
        unitCost: item.unitCost,
        amount,
      });

      totalAmount += amount;
      maxLeadTime = Math.max(maxLeadTime, item.leadTimeDays);
    }

    if (items.length === 0) return null;

    // 예상 입고일
    const expectedDelivery = new Date();
    expectedDelivery.setDate(expectedDelivery.getDate() + maxLeadTime);

    const purchaseOrder: IPurchaseOrder = {
      id: `po-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      orderNumber: `PO-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      supplierId: supplier.id,
      supplierName: supplier.name,
      items,
      totalAmount,
      status: 'draft',
      expectedDeliveryDate: expectedDelivery.toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.inventoryRepo.createPurchaseOrder(purchaseOrder);

    return purchaseOrder;
  }

  // ═══════════════════════════════════════════════════════════════
  // 재고 입출고
  // ═══════════════════════════════════════════════════════════════

  /**
   * 입고 처리
   */
  async processReceipt(
    itemId: string,
    quantity: number,
    referenceId?: string
  ): Promise<IStockLevel> {
    const stockLevel = await this.inventoryRepo.getStockLevel(itemId);
    if (!stockLevel) {
      throw new Error(`Stock level not found: ${itemId}`);
    }

    const beforeStock = stockLevel.currentStock;
    const afterStock = beforeStock + quantity;

    // 재고 수준 업데이트
    const newStatus = determineStockStatus(
      afterStock,
      stockLevel.safetyStock,
      stockLevel.reorderPoint,
      stockLevel.maxStock
    );

    const updated: IStockLevel = {
      ...stockLevel,
      currentStock: afterStock,
      availableStock: afterStock - stockLevel.reservedStock,
      status: newStatus,
      lastReceivedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.inventoryRepo.upsertStockLevel(updated);

    // 이동 기록
    await this.inventoryRepo.recordMovement({
      id: `mv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      itemId,
      type: 'in',
      quantity,
      beforeStock,
      afterStock,
      reason: '입고',
      referenceId,
      movedAt: new Date().toISOString(),
    });

    return updated;
  }

  /**
   * 출고 처리
   */
  async processIssue(
    itemId: string,
    quantity: number,
    referenceId?: string
  ): Promise<IStockLevel> {
    const stockLevel = await this.inventoryRepo.getStockLevel(itemId);
    if (!stockLevel) {
      throw new Error(`Stock level not found: ${itemId}`);
    }

    if (stockLevel.availableStock < quantity) {
      throw new Error('Insufficient stock');
    }

    const beforeStock = stockLevel.currentStock;
    const afterStock = beforeStock - quantity;

    const newStatus = determineStockStatus(
      afterStock,
      stockLevel.safetyStock,
      stockLevel.reorderPoint,
      stockLevel.maxStock
    );

    const updated: IStockLevel = {
      ...stockLevel,
      currentStock: afterStock,
      availableStock: afterStock - stockLevel.reservedStock,
      status: newStatus,
      lastIssuedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.inventoryRepo.upsertStockLevel(updated);

    await this.inventoryRepo.recordMovement({
      id: `mv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      itemId,
      type: 'out',
      quantity: -quantity,
      beforeStock,
      afterStock,
      reason: '출고',
      referenceId,
      movedAt: new Date().toISOString(),
    });

    return updated;
  }

  // ═══════════════════════════════════════════════════════════════
  // 대시보드
  // ═══════════════════════════════════════════════════════════════

  /**
   * 재고 대시보드 데이터
   */
  async getDashboard(): Promise<IInventoryDashboard> {
    const items = await this.inventoryRepo.getAllItems({ active: true });
    const stockLevels = await this.inventoryRepo.getAllStockLevels();
    const statusCounts = await this.inventoryRepo.countByStatus();

    // ABC 분류별 집계
    const byABCClass: Record<ABCClass, number> = { A: 0, B: 0, C: 0 };
    for (const item of items) {
      byABCClass[item.abcClass]++;
    }

    // 총 재고 금액
    let totalStockValue = 0;
    const stockoutItems: Array<{ id: string; name: string }> = [];

    for (const level of stockLevels) {
      const item = await this.inventoryRepo.getItemById(level.itemId);
      if (item) {
        totalStockValue += level.currentStock * item.unitCost;

        if (level.status === 'stockout') {
          stockoutItems.push({ id: item.id, name: item.name });
        }
      }
    }

    // 평균 회전율 (간략 계산)
    const avgTurnoverRate = items.length > 0 ? 12 : 0; // 실제는 분석 필요

    // 발주 필요 품목
    const recommendations = await this.getReorderRecommendations();
    const nearStockoutItems = recommendations.filter(
      r => r.daysOfSupply <= this.config.stockoutWarningDays
    );

    return {
      totalSkus: items.length,
      byStatus: statusCounts,
      byABCClass,
      totalStockValue: Math.round(totalStockValue),
      stockoutItems,
      lowStockCount: statusCounts.low + statusCounts.critical,
      overstockCount: statusCounts.overstock,
      avgTurnoverRate,
      pendingReorderCount: recommendations.length,
      nearStockoutItems,
    };
  }
}

/**
 * 재고 최적화 에이전트 팩토리
 */
export function createInventoryOptimizerAgent(
  inventoryRepo: IInventoryRepository,
  config?: Partial<IInventoryOptimizerConfig>
): InventoryOptimizerAgent {
  return new InventoryOptimizerAgent(inventoryRepo, config);
}

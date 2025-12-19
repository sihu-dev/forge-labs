/**
 * @forge/utils - Inventory Calculation Utilities
 * L1 (Molecules) - 재고 관리 계산 유틸리티
 *
 * EOQ, ROP, 안전재고, ABC 분류 등
 */

import type { FolioTypes } from '@forge/types';

type ABCClass = FolioTypes.ABCClass;
type StockStatus = FolioTypes.StockStatus;
type IInventoryItem = FolioTypes.IInventoryItem;

// ═══════════════════════════════════════════════════════════════
// 경제적 주문량 (EOQ)
// ═══════════════════════════════════════════════════════════════

/**
 * EOQ 입력
 */
export interface IEOQInput {
  /** 연간 수요량 */
  annualDemand: number;
  /** 주문당 비용 */
  orderingCost: number;
  /** 단위당 연간 보관 비용 */
  holdingCostPerUnit: number;
}

/**
 * EOQ 결과
 */
export interface IEOQResult {
  /** 경제적 주문량 */
  eoq: number;
  /** 연간 주문 횟수 */
  ordersPerYear: number;
  /** 총 연간 비용 */
  totalAnnualCost: number;
  /** 연간 주문 비용 */
  annualOrderingCost: number;
  /** 연간 보관 비용 */
  annualHoldingCost: number;
}

/**
 * 경제적 주문량 (EOQ) 계산
 *
 * EOQ = √(2DS/H)
 * D: 연간 수요량
 * S: 주문당 비용
 * H: 단위당 연간 보관 비용
 */
export function calculateEOQ(input: IEOQInput): IEOQResult {
  const { annualDemand, orderingCost, holdingCostPerUnit } = input;

  if (annualDemand <= 0 || holdingCostPerUnit <= 0) {
    return {
      eoq: 0,
      ordersPerYear: 0,
      totalAnnualCost: 0,
      annualOrderingCost: 0,
      annualHoldingCost: 0,
    };
  }

  // EOQ 공식
  const eoq = Math.sqrt(
    (2 * annualDemand * orderingCost) / holdingCostPerUnit
  );

  // 연간 주문 횟수
  const ordersPerYear = annualDemand / eoq;

  // 연간 주문 비용
  const annualOrderingCost = ordersPerYear * orderingCost;

  // 연간 보관 비용 (평균 재고 = EOQ/2)
  const annualHoldingCost = (eoq / 2) * holdingCostPerUnit;

  // 총 비용
  const totalAnnualCost = annualOrderingCost + annualHoldingCost;

  return {
    eoq: Math.round(eoq),
    ordersPerYear: Math.round(ordersPerYear * 10) / 10,
    totalAnnualCost: Math.round(totalAnnualCost),
    annualOrderingCost: Math.round(annualOrderingCost),
    annualHoldingCost: Math.round(annualHoldingCost),
  };
}

// ═══════════════════════════════════════════════════════════════
// 재발주점 (ROP)
// ═══════════════════════════════════════════════════════════════

/**
 * ROP 입력
 */
export interface IROPInput {
  /** 일평균 수요 */
  avgDailyDemand: number;
  /** 리드타임 (일) */
  leadTimeDays: number;
  /** 안전 재고 */
  safetyStock: number;
}

/**
 * 재발주점 (ROP) 계산
 *
 * ROP = (d × L) + SS
 * d: 일평균 수요
 * L: 리드타임
 * SS: 안전 재고
 */
export function calculateROP(input: IROPInput): number {
  const { avgDailyDemand, leadTimeDays, safetyStock } = input;

  const rop = avgDailyDemand * leadTimeDays + safetyStock;

  return Math.ceil(rop);
}

// ═══════════════════════════════════════════════════════════════
// 안전 재고 (Safety Stock)
// ═══════════════════════════════════════════════════════════════

/**
 * 안전 재고 입력
 */
export interface ISafetyStockInput {
  /** 일평균 수요 */
  avgDailyDemand: number;
  /** 수요 표준편차 */
  demandStdDev: number;
  /** 리드타임 (일) */
  leadTimeDays: number;
  /** 서비스 수준 (0-1) */
  serviceLevel: number;
}

/**
 * 서비스 수준에 따른 Z-값 (표준정규분포)
 */
const SERVICE_LEVEL_Z: Record<number, number> = {
  0.80: 0.84,
  0.85: 1.04,
  0.90: 1.28,
  0.95: 1.65,
  0.97: 1.88,
  0.99: 2.33,
};

/**
 * 서비스 수준에 가장 가까운 Z값 반환
 */
function getZValue(serviceLevel: number): number {
  const levels = Object.keys(SERVICE_LEVEL_Z)
    .map(Number)
    .sort((a, b) => a - b);

  for (let i = levels.length - 1; i >= 0; i--) {
    if (serviceLevel >= levels[i]) {
      return SERVICE_LEVEL_Z[levels[i]];
    }
  }

  return 1.65; // 기본 95%
}

/**
 * 안전 재고 계산 (서비스 수준 기반)
 *
 * SS = Z × σ_d × √L
 * Z: 서비스 수준에 따른 Z값
 * σ_d: 수요 표준편차
 * L: 리드타임
 */
export function calculateSafetyStock(input: ISafetyStockInput): number {
  const { demandStdDev, leadTimeDays, serviceLevel } = input;

  const z = getZValue(serviceLevel);
  const ss = z * demandStdDev * Math.sqrt(leadTimeDays);

  return Math.ceil(ss);
}

/**
 * 고정 일수 기반 안전 재고 계산
 */
export function calculateSafetyStockByDays(
  avgDailyDemand: number,
  safetyDays: number
): number {
  return Math.ceil(avgDailyDemand * safetyDays);
}

// ═══════════════════════════════════════════════════════════════
// 재고 회전율 및 재고일수
// ═══════════════════════════════════════════════════════════════

/**
 * 재고 회전율 계산
 *
 * Turnover = 연간 매출원가 / 평균 재고금액
 */
export function calculateTurnoverRate(
  annualCostOfGoodsSold: number,
  avgInventoryValue: number
): number {
  if (avgInventoryValue <= 0) return 0;
  return annualCostOfGoodsSold / avgInventoryValue;
}

/**
 * 재고일수 계산
 *
 * Days of Supply = 현재 재고 / 일평균 수요
 */
export function calculateDaysOfSupply(
  currentStock: number,
  avgDailyDemand: number
): number {
  if (avgDailyDemand <= 0) return Infinity;
  return currentStock / avgDailyDemand;
}

/**
 * 재고일수 → 예상 품절일 변환
 */
export function estimateStockoutDate(
  daysOfSupply: number,
  fromDate: Date = new Date()
): string | null {
  if (!isFinite(daysOfSupply) || daysOfSupply <= 0) return null;

  const stockoutDate = new Date(fromDate);
  stockoutDate.setDate(stockoutDate.getDate() + Math.floor(daysOfSupply));

  return stockoutDate.toISOString().split('T')[0];
}

// ═══════════════════════════════════════════════════════════════
// 보관 비용
// ═══════════════════════════════════════════════════════════════

/**
 * 연간 보관 비용 계산
 */
export function calculateAnnualHoldingCost(
  avgInventoryValue: number,
  holdingCostRate: number // 비율 (예: 25 = 25%)
): number {
  return avgInventoryValue * (holdingCostRate / 100);
}

/**
 * 단위당 연간 보관 비용 계산
 */
export function calculateHoldingCostPerUnit(
  unitCost: number,
  holdingCostRate: number // 비율 (예: 25 = 25%)
): number {
  return unitCost * (holdingCostRate / 100);
}

// ═══════════════════════════════════════════════════════════════
// 품절 위험도
// ═══════════════════════════════════════════════════════════════

/**
 * 품절 위험도 계산 (0-1)
 */
export function calculateStockoutRisk(
  currentStock: number,
  reorderPoint: number,
  safetyStock: number
): number {
  if (currentStock <= 0) return 1; // 품절
  if (currentStock >= reorderPoint) return 0; // 안전

  // ROP 이하일 때 위험도 계산
  const riskRange = reorderPoint - safetyStock;
  if (riskRange <= 0) return 0.5;

  const position = currentStock - safetyStock;
  if (position <= 0) return 0.9; // 안전재고 이하

  // 선형 보간
  const risk = 1 - position / riskRange;
  return Math.max(0, Math.min(1, risk * 0.8)); // 최대 0.8
}

/**
 * 재고 상태 결정
 */
export function determineStockStatus(
  currentStock: number,
  safetyStock: number,
  reorderPoint: number,
  maxStock: number
): StockStatus {
  if (currentStock <= 0) return 'stockout';
  if (currentStock <= safetyStock) return 'critical';
  if (currentStock <= reorderPoint) return 'low';
  if (currentStock > maxStock) return 'overstock';
  return 'normal';
}

// ═══════════════════════════════════════════════════════════════
// ABC 분류
// ═══════════════════════════════════════════════════════════════

/**
 * ABC 분류 입력
 */
export interface IABCInput {
  /** 품목 ID */
  itemId: string;
  /** 연간 매출액 */
  annualRevenue: number;
}

/**
 * ABC 분류 결과
 */
export interface IABCResult {
  /** 품목 ID */
  itemId: string;
  /** 분류 */
  abcClass: ABCClass;
  /** 누적 매출 비율 (%) */
  cumulativePercent: number;
  /** 개별 매출 비율 (%) */
  revenuePercent: number;
}

/**
 * ABC 분류 수행
 *
 * @param items 품목별 매출 데이터
 * @param aThreshold A등급 기준 (기본 80%)
 * @param bThreshold B등급 기준 (기본 95% = 80+15)
 */
export function classifyABC(
  items: IABCInput[],
  aThreshold: number = 80,
  bThreshold: number = 95
): IABCResult[] {
  // 총 매출 계산
  const totalRevenue = items.reduce((sum, item) => sum + item.annualRevenue, 0);

  if (totalRevenue <= 0) {
    return items.map(item => ({
      itemId: item.itemId,
      abcClass: 'C' as ABCClass,
      cumulativePercent: 0,
      revenuePercent: 0,
    }));
  }

  // 매출 기준 내림차순 정렬
  const sorted = [...items].sort((a, b) => b.annualRevenue - a.annualRevenue);

  // 누적 비율 계산 및 분류
  let cumulativeRevenue = 0;
  const results: IABCResult[] = [];

  for (const item of sorted) {
    cumulativeRevenue += item.annualRevenue;
    const cumulativePercent = (cumulativeRevenue / totalRevenue) * 100;
    const revenuePercent = (item.annualRevenue / totalRevenue) * 100;

    let abcClass: ABCClass;
    if (cumulativePercent <= aThreshold) {
      abcClass = 'A';
    } else if (cumulativePercent <= bThreshold) {
      abcClass = 'B';
    } else {
      abcClass = 'C';
    }

    results.push({
      itemId: item.itemId,
      abcClass,
      cumulativePercent: Math.round(cumulativePercent * 100) / 100,
      revenuePercent: Math.round(revenuePercent * 100) / 100,
    });
  }

  return results;
}

// ═══════════════════════════════════════════════════════════════
// 발주량 계산
// ═══════════════════════════════════════════════════════════════

/**
 * 발주량 입력
 */
export interface IOrderQuantityInput {
  /** 현재 재고 */
  currentStock: number;
  /** 입고 예정량 */
  incomingStock: number;
  /** 최대 재고 */
  maxStock: number;
  /** EOQ */
  eoq: number;
  /** 최소 주문량 */
  minOrderQuantity: number;
  /** 주문 배수 */
  orderMultiple: number;
}

/**
 * 권장 발주량 계산
 */
export function calculateOrderQuantity(input: IOrderQuantityInput): number {
  const {
    currentStock,
    incomingStock,
    maxStock,
    eoq,
    minOrderQuantity,
    orderMultiple,
  } = input;

  // 필요량 = 최대재고 - (현재재고 + 입고예정)
  const needed = maxStock - (currentStock + incomingStock);

  if (needed <= 0) return 0;

  // EOQ와 필요량 중 적절한 값 선택
  let orderQty = Math.max(eoq, needed);

  // 최소 주문량 적용
  orderQty = Math.max(orderQty, minOrderQuantity);

  // 주문 배수 적용
  if (orderMultiple > 1) {
    orderQty = Math.ceil(orderQty / orderMultiple) * orderMultiple;
  }

  return orderQty;
}

/**
 * 발주 긴급도 계산 (1-10)
 */
export function calculateOrderUrgency(
  daysOfSupply: number,
  leadTimeDays: number,
  safetyStockDays: number
): number {
  // 안전재고일수 + 리드타임 = 발주 필요 시점
  const criticalDays = leadTimeDays + safetyStockDays;

  if (daysOfSupply <= 0) return 10; // 품절
  if (daysOfSupply <= leadTimeDays) return 9; // 리드타임 내 품절 예상
  if (daysOfSupply <= criticalDays) return 7; // 발주 필요
  if (daysOfSupply <= criticalDays * 1.5) return 5; // 발주 검토
  if (daysOfSupply <= criticalDays * 2) return 3; // 여유 있음

  return 1; // 충분
}

// ═══════════════════════════════════════════════════════════════
// 수요 통계
// ═══════════════════════════════════════════════════════════════

/**
 * 일별 수요 데이터에서 통계 계산
 */
export function calculateDemandStatistics(
  dailyDemands: number[]
): {
  avg: number;
  stdDev: number;
  min: number;
  max: number;
} {
  if (dailyDemands.length === 0) {
    return { avg: 0, stdDev: 0, min: 0, max: 0 };
  }

  const n = dailyDemands.length;
  const sum = dailyDemands.reduce((a, b) => a + b, 0);
  const avg = sum / n;

  const squaredDiffs = dailyDemands.map(d => Math.pow(d - avg, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / n;
  const stdDev = Math.sqrt(variance);

  return {
    avg: Math.round(avg * 100) / 100,
    stdDev: Math.round(stdDev * 100) / 100,
    min: Math.min(...dailyDemands),
    max: Math.max(...dailyDemands),
  };
}

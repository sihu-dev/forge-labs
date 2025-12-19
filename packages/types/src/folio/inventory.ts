/**
 * @forge/types - FOLIO Inventory Types
 * L0 (Atoms) - 재고 관리 타입 정의
 */

// ═══════════════════════════════════════════════════════════════
// 기본 타입
// ═══════════════════════════════════════════════════════════════

/**
 * ABC 분류
 */
export type ABCClass = 'A' | 'B' | 'C';

/**
 * 재고 상태
 */
export type StockStatus =
  | 'normal'      // 정상
  | 'low'         // 부족 (ROP 이하)
  | 'critical'    // 위험 (안전재고 이하)
  | 'stockout'    // 품절
  | 'overstock';  // 과잉

/**
 * 발주 상태
 */
export type OrderStatus =
  | 'draft'       // 초안
  | 'pending'     // 승인 대기
  | 'approved'    // 승인됨
  | 'ordered'     // 발주됨
  | 'shipped'     // 배송 중
  | 'received'    // 입고 완료
  | 'cancelled';  // 취소

/**
 * 단위
 */
export type Unit = 'ea' | 'kg' | 'g' | 'L' | 'ml' | 'box' | 'pack';

// ═══════════════════════════════════════════════════════════════
// 재고 품목
// ═══════════════════════════════════════════════════════════════

/**
 * 재고 품목
 */
export interface IInventoryItem {
  /** 품목 ID */
  id: string;
  /** SKU (Stock Keeping Unit) */
  sku: string;
  /** 품목명 */
  name: string;
  /** 카테고리 */
  category: string;
  /** 단위 */
  unit: Unit;
  /** 단가 */
  unitCost: number;
  /** 판매가 */
  sellingPrice: number;
  /** ABC 분류 */
  abcClass: ABCClass;
  /** 리드타임 (일) */
  leadTimeDays: number;
  /** 최소 주문량 (MOQ) */
  minOrderQuantity: number;
  /** 주문 배수 */
  orderMultiple: number;
  /** 주문당 비용 */
  orderingCost: number;
  /** 연간 보관비율 (%) */
  holdingCostRate: number;
  /** 공급업체 ID */
  supplierId: string;
  /** 활성 여부 */
  active: boolean;
  /** 메타데이터 */
  metadata?: {
    barcode?: string;
    description?: string;
    imageUrl?: string;
    createdAt: string;
    updatedAt: string;
  };
}

/**
 * 재고 수준
 */
export interface IStockLevel {
  /** 품목 ID */
  itemId: string;
  /** 현재 재고량 */
  currentStock: number;
  /** 예약 수량 (출고 예정) */
  reservedStock: number;
  /** 입고 예정량 */
  incomingStock: number;
  /** 가용 재고 (현재 - 예약) */
  availableStock: number;
  /** 안전 재고량 */
  safetyStock: number;
  /** 재발주점 (ROP) */
  reorderPoint: number;
  /** 최대 재고량 */
  maxStock: number;
  /** 경제적 주문량 (EOQ) */
  eoq: number;
  /** 재고 상태 */
  status: StockStatus;
  /** 마지막 입고일 */
  lastReceivedAt?: string;
  /** 마지막 출고일 */
  lastIssuedAt?: string;
  /** 업데이트 시간 */
  updatedAt: string;
}

// ═══════════════════════════════════════════════════════════════
// 발주 관련
// ═══════════════════════════════════════════════════════════════

/**
 * 발주 추천
 */
export interface IOrderRecommendation {
  /** 추천 ID */
  id: string;
  /** 품목 ID */
  itemId: string;
  /** SKU */
  sku: string;
  /** 품목명 */
  itemName: string;
  /** 현재 재고 */
  currentStock: number;
  /** 재발주점 */
  reorderPoint: number;
  /** 추천 발주량 */
  recommendedQuantity: number;
  /** 추천 이유 */
  reason: string;
  /** 긴급도 (1-10) */
  urgency: number;
  /** 예상 품절일 */
  estimatedStockoutDate?: string;
  /** 재고일수 */
  daysOfSupply: number;
  /** 예상 비용 */
  estimatedCost: number;
  /** 공급업체명 */
  supplierName: string;
  /** 리드타임 */
  leadTimeDays: number;
  /** 생성 시간 */
  createdAt: string;
}

/**
 * 공급업체
 */
export interface ISupplier {
  /** 공급업체 ID */
  id: string;
  /** 업체명 */
  name: string;
  /** 연락처 */
  contact: {
    phone?: string;
    email?: string;
    address?: string;
  };
  /** 기본 리드타임 (일) */
  defaultLeadTimeDays: number;
  /** 최소 주문금액 */
  minOrderAmount?: number;
  /** 결제 조건 */
  paymentTerms?: string;
  /** 평가 점수 (1-5) */
  rating?: number;
  /** 활성 여부 */
  active: boolean;
}

/**
 * 발주서 항목
 */
export interface IPurchaseOrderItem {
  /** 품목 ID */
  itemId: string;
  /** SKU */
  sku: string;
  /** 품목명 */
  name: string;
  /** 수량 */
  quantity: number;
  /** 단가 */
  unitCost: number;
  /** 금액 */
  amount: number;
}

/**
 * 발주서
 */
export interface IPurchaseOrder {
  /** 발주서 ID */
  id: string;
  /** 발주 번호 */
  orderNumber: string;
  /** 공급업체 ID */
  supplierId: string;
  /** 공급업체명 */
  supplierName: string;
  /** 발주 항목 */
  items: IPurchaseOrderItem[];
  /** 총 금액 */
  totalAmount: number;
  /** 상태 */
  status: OrderStatus;
  /** 예상 입고일 */
  expectedDeliveryDate: string;
  /** 실제 입고일 */
  actualDeliveryDate?: string;
  /** 비고 */
  notes?: string;
  /** 생성일 */
  createdAt: string;
  /** 수정일 */
  updatedAt: string;
}

// ═══════════════════════════════════════════════════════════════
// 분석 및 통계
// ═══════════════════════════════════════════════════════════════

/**
 * 재고 분석 결과
 */
export interface IInventoryAnalysis {
  /** 품목 ID */
  itemId: string;
  /** 일평균 수요 */
  avgDailyDemand: number;
  /** 수요 표준편차 */
  demandStdDev: number;
  /** 재고 회전율 (연간) */
  turnoverRate: number;
  /** 재고일수 */
  daysOfSupply: number;
  /** 보관 비용 (연간 추정) */
  annualHoldingCost: number;
  /** 품절 위험도 (0-1) */
  stockoutRisk: number;
  /** 과잉 재고 여부 */
  isOverstocked: boolean;
  /** 분석 기간 */
  analysisPeriod: {
    start: string;
    end: string;
  };
}

/**
 * 재고 대시보드 데이터
 */
export interface IInventoryDashboard {
  /** 총 SKU 수 */
  totalSkus: number;
  /** 재고 상태별 품목 수 */
  byStatus: Record<StockStatus, number>;
  /** ABC 분류별 품목 수 */
  byABCClass: Record<ABCClass, number>;
  /** 총 재고 금액 */
  totalStockValue: number;
  /** 품절 품목 목록 */
  stockoutItems: Array<{ id: string; name: string }>;
  /** 저재고 품목 수 */
  lowStockCount: number;
  /** 과잉 재고 품목 수 */
  overstockCount: number;
  /** 평균 재고 회전율 */
  avgTurnoverRate: number;
  /** 발주 필요 품목 수 */
  pendingReorderCount: number;
  /** 예상 품절 품목 (7일 이내) */
  nearStockoutItems: IOrderRecommendation[];
}

/**
 * 재고 이동 기록
 */
export interface IStockMovement {
  /** 이동 ID */
  id: string;
  /** 품목 ID */
  itemId: string;
  /** 이동 유형 */
  type: 'in' | 'out' | 'adjust';
  /** 수량 (+/-) */
  quantity: number;
  /** 이동 전 재고 */
  beforeStock: number;
  /** 이동 후 재고 */
  afterStock: number;
  /** 사유 */
  reason: string;
  /** 참조 ID (발주서, 판매 등) */
  referenceId?: string;
  /** 이동 시간 */
  movedAt: string;
}

// ═══════════════════════════════════════════════════════════════
// 설정
// ═══════════════════════════════════════════════════════════════

/**
 * 재고 설정
 */
export interface IInventoryConfig {
  /** 기본 안전재고 일수 */
  defaultSafetyStockDays: number;
  /** 서비스 수준 (품절 방지 확률, 0-1) */
  serviceLevel: number;
  /** 기본 연간 보관비율 (%) */
  defaultHoldingCostRate: number;
  /** 기본 주문당 비용 */
  defaultOrderingCost: number;
  /** 품절 경고 임계값 (일) */
  stockoutWarningDays: number;
  /** ABC 분류 기준 */
  abcThresholds: {
    /** A등급 매출 비율 (%) */
    aRevenuePercent: number;
    /** B등급 매출 비율 (%) */
    bRevenuePercent: number;
  };
}

/**
 * 기본 재고 설정
 */
export const DEFAULT_INVENTORY_CONFIG: IInventoryConfig = {
  defaultSafetyStockDays: 7,
  serviceLevel: 0.95,
  defaultHoldingCostRate: 25,
  defaultOrderingCost: 50000,
  stockoutWarningDays: 7,
  abcThresholds: {
    aRevenuePercent: 80,
    bRevenuePercent: 15,
  },
};

/**
 * ABC 분류별 관리 정책
 */
export const ABC_MANAGEMENT_POLICY = {
  A: {
    reviewFrequency: 'daily',
    safetyStockDays: 3,
    orderFrequency: 'weekly',
    description: '핵심 품목 - 집중 관리',
  },
  B: {
    reviewFrequency: 'weekly',
    safetyStockDays: 7,
    orderFrequency: 'biweekly',
    description: '중요 품목 - 정기 관리',
  },
  C: {
    reviewFrequency: 'monthly',
    safetyStockDays: 14,
    orderFrequency: 'monthly',
    description: '일반 품목 - 간소화 관리',
  },
};

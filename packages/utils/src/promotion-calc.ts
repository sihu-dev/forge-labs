/**
 * @forge/utils - Promotion Calculator
 * L1 (Molecules) - 프로모션 계산 유틸리티
 */

import type {
  ICoupon,
  ICouponApplyResult,
  DiscountType,
  IPricingRule,
  CREDIT_VOLUME_TIERS,
} from '@forge/types';

// ============================================
// Discount Calculation
// ============================================

/**
 * 할인 금액 계산
 */
export function calculateDiscount(
  originalPrice: number,
  discountType: DiscountType,
  discountValue: number,
  maxDiscount?: number
): number {
  let discount = 0;

  switch (discountType) {
    case 'percentage':
      discount = Math.round(originalPrice * (discountValue / 100));
      break;
    case 'fixed_amount':
      discount = discountValue;
      break;
    case 'credits':
      // 크레딧은 별도 처리 (가격 할인이 아님)
      discount = 0;
      break;
  }

  // 최대 할인 적용
  if (maxDiscount !== undefined && discount > maxDiscount) {
    discount = maxDiscount;
  }

  // 원가를 초과할 수 없음
  if (discount > originalPrice) {
    discount = originalPrice;
  }

  return discount;
}

/**
 * 최종 가격 계산
 */
export function calculateFinalPrice(
  originalPrice: number,
  discountType: DiscountType,
  discountValue: number,
  maxDiscount?: number
): number {
  const discount = calculateDiscount(originalPrice, discountType, discountValue, maxDiscount);
  return Math.max(0, originalPrice - discount);
}

// ============================================
// Coupon Validation
// ============================================

/**
 * 쿠폰 유효성 검증
 */
export function validateCoupon(
  coupon: ICoupon,
  userId: string,
  purchaseAmount: number,
  userUsageCount: number,
  currentDate: Date = new Date()
): ICouponApplyResult {
  // 상태 확인
  if (coupon.status !== 'active') {
    return {
      valid: false,
      discountAmount: 0,
      errorMessage: '유효하지 않은 쿠폰입니다',
    };
  }

  // 기간 확인
  if (currentDate < coupon.validFrom) {
    return {
      valid: false,
      discountAmount: 0,
      errorMessage: '아직 사용 기간이 아닙니다',
    };
  }

  if (currentDate > coupon.validUntil) {
    return {
      valid: false,
      discountAmount: 0,
      errorMessage: '사용 기간이 만료되었습니다',
    };
  }

  // 총 사용 횟수 확인
  if (coupon.maxUsageCount !== undefined && coupon.usageCount >= coupon.maxUsageCount) {
    return {
      valid: false,
      discountAmount: 0,
      errorMessage: '쿠폰 사용 한도를 초과했습니다',
    };
  }

  // 사용자당 사용 횟수 확인
  if (coupon.maxUsagePerUser !== undefined && userUsageCount >= coupon.maxUsagePerUser) {
    return {
      valid: false,
      discountAmount: 0,
      errorMessage: '이미 사용한 쿠폰입니다',
    };
  }

  // 최소 구매 금액 확인
  if (coupon.minPurchaseAmount !== undefined && purchaseAmount < coupon.minPurchaseAmount) {
    return {
      valid: false,
      discountAmount: 0,
      errorMessage: `최소 구매 금액은 ${coupon.minPurchaseAmount.toLocaleString()}원입니다`,
    };
  }

  // 할인 금액 계산
  const discountAmount = calculateDiscount(
    purchaseAmount,
    coupon.discountType,
    coupon.discountValue,
    coupon.maxDiscountAmount
  );

  return {
    valid: true,
    coupon,
    discountAmount,
  };
}

// ============================================
// Volume Pricing
// ============================================

/**
 * 크레딧 볼륨 할인 티어 타입
 */
interface CreditVolumeTier {
  minCredits: number;
  discountPercent: number;
  pricePerCredit: number;
}

/**
 * 기본 볼륨 할인 티어
 */
const DEFAULT_VOLUME_TIERS: CreditVolumeTier[] = [
  { minCredits: 3000, discountPercent: 20, pricePerCredit: 80 },
  { minCredits: 1000, discountPercent: 10, pricePerCredit: 90 },
  { minCredits: 500, discountPercent: 5, pricePerCredit: 95 },
  { minCredits: 100, discountPercent: 0, pricePerCredit: 100 },
];

/**
 * 크레딧 볼륨 가격 계산
 */
export function calculateCreditVolumePrice(
  creditAmount: number,
  tiers: CreditVolumeTier[] = DEFAULT_VOLUME_TIERS
): {
  totalPrice: number;
  pricePerCredit: number;
  discountPercent: number;
  savings: number;
} {
  // 티어 찾기 (가장 높은 할인부터 확인)
  const sortedTiers = [...tiers].sort((a, b) => b.minCredits - a.minCredits);
  const tier = sortedTiers.find(t => creditAmount >= t.minCredits) || sortedTiers[sortedTiers.length - 1];

  const basePrice = creditAmount * 100; // 기본 가격 (100원/크레딧)
  const totalPrice = creditAmount * tier.pricePerCredit;
  const savings = basePrice - totalPrice;

  return {
    totalPrice,
    pricePerCredit: tier.pricePerCredit,
    discountPercent: tier.discountPercent,
    savings,
  };
}

// ============================================
// Referral Calculation
// ============================================

/**
 * 추천 보상 계산
 */
export function calculateReferralReward(
  baseReferrerReward: number,
  baseRefereeReward: number,
  referralCount: number,
  bonusMultiplierThresholds: { count: number; multiplier: number }[] = [
    { count: 10, multiplier: 1.5 },
    { count: 25, multiplier: 2.0 },
    { count: 50, multiplier: 2.5 },
  ]
): {
  referrerReward: number;
  refereeReward: number;
  multiplier: number;
  nextThreshold?: { count: number; multiplier: number };
} {
  // 현재 적용 가능한 보너스 배율 찾기
  const sortedThresholds = [...bonusMultiplierThresholds].sort((a, b) => b.count - a.count);
  const currentMultiplier = sortedThresholds.find(t => referralCount >= t.count)?.multiplier || 1.0;

  // 다음 달성 목표 찾기
  const nextThreshold = bonusMultiplierThresholds
    .filter(t => referralCount < t.count)
    .sort((a, b) => a.count - b.count)[0];

  return {
    referrerReward: Math.round(baseReferrerReward * currentMultiplier),
    refereeReward: baseRefereeReward, // 피추천인 보상은 고정
    multiplier: currentMultiplier,
    nextThreshold,
  };
}

// ============================================
// Campaign ROI Calculation
// ============================================

/**
 * 캠페인 ROI 계산
 */
export function calculateCampaignROI(
  revenue: number,
  cost: number
): {
  profit: number;
  roi: number;
  breakEven: boolean;
} {
  const profit = revenue - cost;
  const roi = cost > 0 ? (profit / cost) * 100 : 0;

  return {
    profit,
    roi: Math.round(roi * 100) / 100,
    breakEven: profit >= 0,
  };
}

/**
 * 캠페인 전환율 계산
 */
export function calculateConversionRate(
  impressions: number,
  clicks: number,
  conversions: number
): {
  clickRate: number;      // CTR
  conversionRate: number; // CVR
  overallRate: number;    // 전체 전환율
} {
  return {
    clickRate: impressions > 0 ? Math.round((clicks / impressions) * 10000) / 100 : 0,
    conversionRate: clicks > 0 ? Math.round((conversions / clicks) * 10000) / 100 : 0,
    overallRate: impressions > 0 ? Math.round((conversions / impressions) * 10000) / 100 : 0,
  };
}

// ============================================
// Pricing Rule Evaluation
// ============================================

/**
 * 가격 규칙 평가
 */
export function evaluatePricingRule(
  rule: IPricingRule,
  context: {
    quantity?: number;
    timestamp?: Date;
    userSegment?: string;
  }
): boolean {
  if (!rule.isActive) return false;

  const { condition } = rule;

  switch (condition.type) {
    case 'quantity':
      if (context.quantity === undefined) return false;
      return evaluateCondition(context.quantity, condition.operator, condition.value);

    case 'time':
      if (!context.timestamp) return false;
      const hour = context.timestamp.getHours();
      return evaluateCondition(hour, condition.operator, condition.value);

    case 'user_segment':
      if (!context.userSegment) return false;
      // user_segment는 문자열 비교이므로 별도 처리
      return true;

    default:
      return false;
  }
}

/**
 * 조건 평가 헬퍼
 */
function evaluateCondition(
  value: number,
  operator: 'gte' | 'lte' | 'eq' | 'between',
  threshold: number | [number, number]
): boolean {
  if (Array.isArray(threshold)) {
    return operator === 'between' && value >= threshold[0] && value <= threshold[1];
  }

  switch (operator) {
    case 'gte':
      return value >= threshold;
    case 'lte':
      return value <= threshold;
    case 'eq':
      return value === threshold;
    default:
      return false;
  }
}

/**
 * 적용 가능한 최적 가격 규칙 찾기
 */
export function findBestPricingRule(
  rules: IPricingRule[],
  context: {
    quantity?: number;
    timestamp?: Date;
    userSegment?: string;
  }
): IPricingRule | null {
  const applicableRules = rules
    .filter(rule => evaluatePricingRule(rule, context))
    .sort((a, b) => b.priority - a.priority);

  return applicableRules[0] || null;
}

// ============================================
// Time-Limited Promotion
// ============================================

/**
 * 프로모션 남은 시간 계산
 */
export function calculateTimeRemaining(endDate: Date, now: Date = new Date()): {
  expired: boolean;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
  urgency: 'none' | 'low' | 'medium' | 'high';
} {
  const diff = endDate.getTime() - now.getTime();

  if (diff <= 0) {
    return {
      expired: true,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalSeconds: 0,
      urgency: 'none',
    };
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  // 긴급도 계산
  let urgency: 'none' | 'low' | 'medium' | 'high' = 'none';
  if (days === 0) {
    if (hours <= 1) urgency = 'high';
    else if (hours <= 6) urgency = 'medium';
    else urgency = 'low';
  }

  return {
    expired: false,
    days,
    hours,
    minutes,
    seconds,
    totalSeconds,
    urgency,
  };
}

/**
 * 프로모션 기간 포맷팅
 */
export function formatPromotionPeriod(startDate: Date, endDate: Date): string {
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  };

  return `${formatDate(startDate)} ~ ${formatDate(endDate)}`;
}

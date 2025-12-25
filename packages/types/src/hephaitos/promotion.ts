/**
 * @forge/types - Promotion Types
 * L0 (Atoms) - 프로모션/마케팅 시스템 타입 정의
 */

// ============================================
// Promotion Types
// ============================================

/**
 * 프로모션 타입
 */
export type PromotionType =
  | 'discount'           // 할인
  | 'bonus_credit'       // 보너스 크레딧
  | 'trial_extension'    // 무료 체험 연장
  | 'feature_unlock'     // 기능 잠금 해제
  | 'referral_reward'    // 추천인 보상
  | 'seasonal'           // 시즌 프로모션

/**
 * 프로모션 상태
 */
export type PromotionStatus = 'draft' | 'active' | 'scheduled' | 'expired' | 'cancelled'

/**
 * 할인 타입
 */
export type DiscountType = 'percentage' | 'fixed_amount' | 'credits'

/**
 * 프로모션 대상
 */
export type PromotionTarget =
  | 'all'                // 모든 사용자
  | 'new_users'          // 신규 가입자
  | 'inactive_users'     // 비활성 사용자
  | 'premium_users'      // 프리미엄 사용자
  | 'referral'           // 추천 대상
  | 'specific_plan'      // 특정 플랜 사용자

// ============================================
// Coupon Types
// ============================================

/**
 * 쿠폰 인터페이스
 */
export interface ICoupon {
  id: string
  code: string
  name: string
  description?: string

  // 할인 정보
  discountType: DiscountType
  discountValue: number  // percentage면 0-100, fixed면 KRW, credits면 크레딧 수

  // 제한
  minPurchaseAmount?: number  // 최소 구매 금액 (KRW)
  maxDiscountAmount?: number  // 최대 할인 금액 (KRW)
  maxUsageCount?: number      // 총 사용 가능 횟수
  maxUsagePerUser?: number    // 사용자당 사용 가능 횟수

  // 대상
  target: PromotionTarget
  targetPlanIds?: string[]    // specific_plan일 때 대상 플랜

  // 기간
  validFrom: Date
  validUntil: Date

  // 상태
  status: PromotionStatus
  usageCount: number

  // 메타
  createdAt: Date
  updatedAt: Date
}

/**
 * 쿠폰 사용 기록
 */
export interface ICouponUsage {
  id: string
  couponId: string
  userId: string
  orderId?: string
  discountAmount: number
  usedAt: Date
}

/**
 * 쿠폰 적용 결과
 */
export interface ICouponApplyResult {
  valid: boolean
  coupon?: ICoupon
  discountAmount: number
  errorMessage?: string
}

// ============================================
// Referral Types
// ============================================

/**
 * 추천 코드 인터페이스
 */
export interface IReferralCode {
  id: string
  userId: string
  code: string

  // 보상 설정
  referrerReward: number      // 추천인 보상 (크레딧)
  refereeReward: number       // 피추천인 보상 (크레딧)

  // 통계
  totalReferrals: number
  successfulReferrals: number
  totalRewardsEarned: number

  // 상태
  isActive: boolean
  createdAt: Date
}

/**
 * 추천 기록
 */
export interface IReferral {
  id: string
  referralCodeId: string
  referrerId: string
  refereeId: string

  // 상태
  status: 'pending' | 'completed' | 'cancelled'

  // 보상
  referrerRewardAmount: number
  refereeRewardAmount: number
  rewardedAt?: Date

  createdAt: Date
}

// ============================================
// Campaign Types
// ============================================

/**
 * 마케팅 캠페인
 */
export interface IMarketingCampaign {
  id: string
  name: string
  description?: string

  // 타입
  type: PromotionType

  // 기간
  startDate: Date
  endDate: Date

  // 대상
  target: PromotionTarget
  targetUserCount?: number

  // 혜택
  benefit: {
    type: DiscountType
    value: number
    maxValue?: number
  }

  // 조건
  conditions?: {
    minPurchase?: number
    requiredAction?: string
    previousPurchase?: boolean
  }

  // 통계
  stats: {
    impressions: number
    clicks: number
    conversions: number
    revenue: number
    cost: number
  }

  // 상태
  status: PromotionStatus
  createdAt: Date
  updatedAt: Date
}

// ============================================
// Pricing Tier Types
// ============================================

/**
 * 동적 가격 규칙
 */
export interface IPricingRule {
  id: string
  name: string

  // 조건
  condition: {
    type: 'quantity' | 'time' | 'user_segment' | 'custom'
    operator: 'gte' | 'lte' | 'eq' | 'between'
    value: number | [number, number]
    customLogic?: string
  }

  // 적용 할인
  discount: {
    type: DiscountType
    value: number
  }

  // 우선순위 (높을수록 우선)
  priority: number

  isActive: boolean
}

// ============================================
// Analytics Types
// ============================================

/**
 * 프로모션 분석 결과
 */
export interface IPromotionAnalytics {
  promotionId: string
  period: {
    start: Date
    end: Date
  }

  // 기본 지표
  metrics: {
    totalRedemptions: number
    uniqueUsers: number
    totalDiscountGiven: number
    averageOrderValue: number
    conversionRate: number
  }

  // ROI 분석
  roi: {
    revenue: number
    cost: number
    profit: number
    roiPercent: number
  }

  // 시계열 데이터
  dailyData: Array<{
    date: string
    redemptions: number
    revenue: number
    discount: number
  }>
}

// ============================================
// Constants
// ============================================

/**
 * 기본 추천 보상
 */
export const DEFAULT_REFERRAL_REWARDS = {
  referrer: 100,  // 추천인: 100 크레딧
  referee: 50,    // 피추천인: 50 크레딧
} as const

/**
 * 프로모션 타입별 기본 설정
 */
export const PROMOTION_TYPE_DEFAULTS: Record<PromotionType, {
  duration: number  // 기본 기간 (일)
  maxUsage: number  // 기본 최대 사용 횟수
}> = {
  discount: { duration: 30, maxUsage: 1000 },
  bonus_credit: { duration: 14, maxUsage: 500 },
  trial_extension: { duration: 7, maxUsage: 100 },
  feature_unlock: { duration: 30, maxUsage: 200 },
  referral_reward: { duration: 365, maxUsage: -1 },  // 무제한
  seasonal: { duration: 7, maxUsage: 5000 },
}

/**
 * 크레딧 볼륨 할인 티어
 */
export const CREDIT_VOLUME_TIERS = [
  { minCredits: 3000, discountPercent: 20, pricePerCredit: 80 },
  { minCredits: 1000, discountPercent: 10, pricePerCredit: 90 },
  { minCredits: 500, discountPercent: 5, pricePerCredit: 95 },
  { minCredits: 100, discountPercent: 0, pricePerCredit: 100 },
] as const

/**
 * Promotion Module
 * 프로모션/쿠폰/추천 시스템
 */

export {
  getCouponByCode,
  applyCoupon,
  recordCouponUsage,
  getActivePromotions,
  getOrCreateReferralCode,
  getReferralCodeByCode,
  processReferral,
  getReferralStats,
  calculateCreditPrice,
} from './service';

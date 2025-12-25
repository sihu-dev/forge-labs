/**
 * Promotion Service
 * 프로모션/쿠폰/추천 관리 서비스
 */

import { createClient } from '@/lib/supabase/server';
import {
  calculateDiscount,
  validateCoupon,
  calculateReferralReward,
  calculateCreditVolumePrice,
} from '@forge/utils';
import type {
  ICoupon,
  ICouponApplyResult,
  IReferralCode,
  IReferral,
  PromotionStatus,
  DiscountType,
  PromotionTarget,
  DEFAULT_REFERRAL_REWARDS,
} from '@forge/types';

// ============================================
// Coupon Service
// ============================================

/**
 * 쿠폰 코드로 쿠폰 조회
 */
export async function getCouponByCode(code: string): Promise<ICoupon | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', code.toUpperCase())
    .single();

  if (error || !data) return null;

  return mapToCoupon(data);
}

/**
 * 쿠폰 적용
 */
export async function applyCoupon(
  couponCode: string,
  userId: string,
  purchaseAmount: number
): Promise<ICouponApplyResult> {
  const supabase = await createClient();

  // 쿠폰 조회
  const coupon = await getCouponByCode(couponCode);
  if (!coupon) {
    return {
      valid: false,
      discountAmount: 0,
      errorMessage: '존재하지 않는 쿠폰입니다',
    };
  }

  // 사용자의 해당 쿠폰 사용 횟수 조회
  const { count } = await supabase
    .from('coupon_usages')
    .select('*', { count: 'exact', head: true })
    .eq('coupon_id', coupon.id)
    .eq('user_id', userId);

  const userUsageCount = count || 0;

  // 유효성 검증
  const result = validateCoupon(coupon, userId, purchaseAmount, userUsageCount);

  return result;
}

/**
 * 쿠폰 사용 기록
 */
export async function recordCouponUsage(
  couponId: string,
  userId: string,
  orderId: string,
  discountAmount: number
): Promise<void> {
  const supabase = await createClient();

  // 사용 기록 추가
  const { error: usageError } = await supabase
    .from('coupon_usages')
    .insert({
      coupon_id: couponId,
      user_id: userId,
      order_id: orderId,
      discount_amount: discountAmount,
    });

  if (usageError) throw usageError;

  // 쿠폰 사용 횟수 증가
  const { error: updateError } = await supabase.rpc('increment_coupon_usage', {
    coupon_id: couponId,
  });

  if (updateError) {
    // RPC가 없으면 직접 업데이트
    await supabase
      .from('coupons')
      .update({ usage_count: supabase.sql`usage_count + 1` } as any)
      .eq('id', couponId);
  }
}

/**
 * 활성 프로모션 목록 조회
 */
export async function getActivePromotions(): Promise<ICoupon[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('status', 'active')
    .gte('valid_until', new Date().toISOString())
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map(mapToCoupon);
}

// ============================================
// Referral Service
// ============================================

/**
 * 사용자의 추천 코드 조회 또는 생성
 */
export async function getOrCreateReferralCode(userId: string): Promise<IReferralCode> {
  const supabase = await createClient();

  // 기존 코드 조회
  const { data: existing } = await supabase
    .from('referral_codes')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (existing) {
    return mapToReferralCode(existing);
  }

  // 새 코드 생성
  const code = generateReferralCode();

  const { data: newCode, error } = await supabase
    .from('referral_codes')
    .insert({
      user_id: userId,
      code,
      referrer_reward: 100,  // 기본 보상
      referee_reward: 50,
      is_active: true,
    })
    .select()
    .single();

  if (error) throw error;

  return mapToReferralCode(newCode);
}

/**
 * 추천 코드로 추천 코드 정보 조회
 */
export async function getReferralCodeByCode(code: string): Promise<IReferralCode | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('referral_codes')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('is_active', true)
    .single();

  if (error || !data) return null;

  return mapToReferralCode(data);
}

/**
 * 추천 처리 (회원가입 시)
 */
export async function processReferral(
  referralCode: string,
  newUserId: string
): Promise<{ success: boolean; message: string }> {
  const supabase = await createClient();

  // 추천 코드 조회
  const referralCodeData = await getReferralCodeByCode(referralCode);
  if (!referralCodeData) {
    return { success: false, message: '유효하지 않은 추천 코드입니다' };
  }

  // 자기 자신 추천 방지
  if (referralCodeData.userId === newUserId) {
    return { success: false, message: '자신의 추천 코드는 사용할 수 없습니다' };
  }

  // 이미 추천받은 사용자인지 확인
  const { data: existingReferral } = await supabase
    .from('referrals')
    .select('id')
    .eq('referee_id', newUserId)
    .single();

  if (existingReferral) {
    return { success: false, message: '이미 추천을 받은 계정입니다' };
  }

  // 보상 계산
  const rewards = calculateReferralReward(
    referralCodeData.referrerReward,
    referralCodeData.refereeReward,
    referralCodeData.successfulReferrals
  );

  // 추천 기록 생성
  const { error: referralError } = await supabase
    .from('referrals')
    .insert({
      referral_code_id: referralCodeData.id,
      referrer_id: referralCodeData.userId,
      referee_id: newUserId,
      status: 'completed',
      referrer_reward_amount: rewards.referrerReward,
      referee_reward_amount: rewards.refereeReward,
      rewarded_at: new Date().toISOString(),
    });

  if (referralError) throw referralError;

  // 크레딧 지급 (추천인)
  await addCreditsForReferral(referralCodeData.userId, rewards.referrerReward, '추천인 보상');

  // 크레딧 지급 (피추천인)
  await addCreditsForReferral(newUserId, rewards.refereeReward, '추천 가입 보상');

  // 추천 코드 통계 업데이트
  await supabase
    .from('referral_codes')
    .update({
      total_referrals: referralCodeData.totalReferrals + 1,
      successful_referrals: referralCodeData.successfulReferrals + 1,
      total_rewards_earned: referralCodeData.totalRewardsEarned + rewards.referrerReward,
    })
    .eq('id', referralCodeData.id);

  return {
    success: true,
    message: `추천 보상이 지급되었습니다! (+${rewards.refereeReward} 크레딧)`,
  };
}

/**
 * 추천 통계 조회
 */
export async function getReferralStats(userId: string): Promise<{
  code: string;
  totalReferrals: number;
  successfulReferrals: number;
  totalRewardsEarned: number;
  currentMultiplier: number;
  nextThreshold?: { count: number; multiplier: number };
}> {
  const referralCode = await getOrCreateReferralCode(userId);

  const rewards = calculateReferralReward(
    referralCode.referrerReward,
    referralCode.refereeReward,
    referralCode.successfulReferrals
  );

  return {
    code: referralCode.code,
    totalReferrals: referralCode.totalReferrals,
    successfulReferrals: referralCode.successfulReferrals,
    totalRewardsEarned: referralCode.totalRewardsEarned,
    currentMultiplier: rewards.multiplier,
    nextThreshold: rewards.nextThreshold,
  };
}

// ============================================
// Credit Volume Discount
// ============================================

/**
 * 크레딧 구매 가격 계산 (볼륨 할인 적용)
 */
export function calculateCreditPrice(credits: number): {
  originalPrice: number;
  discountedPrice: number;
  savings: number;
  discountPercent: number;
  pricePerCredit: number;
} {
  const basePrice = credits * 100; // 기본 100원/크레딧
  const volumeResult = calculateCreditVolumePrice(credits);

  return {
    originalPrice: basePrice,
    discountedPrice: volumeResult.totalPrice,
    savings: volumeResult.savings,
    discountPercent: volumeResult.discountPercent,
    pricePerCredit: volumeResult.pricePerCredit,
  };
}

// ============================================
// Helper Functions
// ============================================

/**
 * 추천 코드 생성
 */
function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 혼동되기 쉬운 문자 제외
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * DB 데이터를 ICoupon으로 매핑
 */
function mapToCoupon(data: any): ICoupon {
  return {
    id: data.id,
    code: data.code,
    name: data.name,
    description: data.description,
    discountType: data.discount_type as DiscountType,
    discountValue: data.discount_value,
    minPurchaseAmount: data.min_purchase_amount,
    maxDiscountAmount: data.max_discount_amount,
    maxUsageCount: data.max_usage_count,
    maxUsagePerUser: data.max_usage_per_user,
    target: data.target as PromotionTarget,
    targetPlanIds: data.target_plan_ids,
    validFrom: new Date(data.valid_from),
    validUntil: new Date(data.valid_until),
    status: data.status as PromotionStatus,
    usageCount: data.usage_count || 0,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

/**
 * DB 데이터를 IReferralCode로 매핑
 */
function mapToReferralCode(data: any): IReferralCode {
  return {
    id: data.id,
    userId: data.user_id,
    code: data.code,
    referrerReward: data.referrer_reward,
    refereeReward: data.referee_reward,
    totalReferrals: data.total_referrals || 0,
    successfulReferrals: data.successful_referrals || 0,
    totalRewardsEarned: data.total_rewards_earned || 0,
    isActive: data.is_active,
    createdAt: new Date(data.created_at),
  };
}

/**
 * 추천 보상 크레딧 지급
 */
async function addCreditsForReferral(
  userId: string,
  amount: number,
  description: string
): Promise<void> {
  const supabase = await createClient();

  // 현재 잔액 조회
  const { data: credit } = await supabase
    .from('credits')
    .select('balance')
    .eq('user_id', userId)
    .single();

  const currentBalance = credit?.balance || 0;
  const newBalance = currentBalance + amount;

  // 잔액 업데이트 (upsert)
  await supabase
    .from('credits')
    .upsert({
      user_id: userId,
      balance: newBalance,
    }, { onConflict: 'user_id' });

  // 거래 기록
  await supabase
    .from('credit_transactions')
    .insert({
      user_id: userId,
      amount,
      type: 'bonus',
      description,
      metadata: { source: 'referral' },
    });
}

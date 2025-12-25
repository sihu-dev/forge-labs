/**
 * Onboarding Service
 * 온보딩 진행 상태 관리
 */

import { createClient } from '@/lib/supabase/server';

// 온보딩 상태 타입
export interface OnboardingProgress {
  userId: string;
  currentStep: number;
  data: {
    nickname?: string;
    investmentStyle?: string;
    interests?: string[];
    experience?: string;
    acceptedDisclaimer?: boolean;
    painPoints?: string[];
  };
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 온보딩 진행 상태 조회
 */
export async function getOnboardingProgress(userId: string): Promise<OnboardingProgress | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('onboarding_progress')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;

  return mapToProgress(data);
}

/**
 * 온보딩 진행 상태 저장
 */
export async function saveOnboardingProgress(
  userId: string,
  step: number,
  data: OnboardingProgress['data']
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('onboarding_progress')
    .upsert({
      user_id: userId,
      current_step: step,
      data,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

  if (error) throw error;
}

/**
 * 온보딩 완료 처리
 */
export async function completeOnboarding(
  userId: string,
  data: OnboardingProgress['data']
): Promise<void> {
  const supabase = await createClient();

  // 온보딩 진행 상태 완료 처리
  await supabase
    .from('onboarding_progress')
    .upsert({
      user_id: userId,
      current_step: -1, // 완료 표시
      data,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

  // 사용자 프로필 업데이트
  await supabase
    .from('profiles')
    .update({
      display_name: data.nickname,
      investment_style: data.investmentStyle,
      experience_level: data.experience,
      interests: data.interests,
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  // 웰컴 보너스 크레딧 지급
  await grantWelcomeBonus(userId);

  // 환영 알림 생성
  await createWelcomeNotification(userId, data.nickname || '회원');
}

/**
 * 온보딩 완료 여부 확인
 */
export async function isOnboardingCompleted(userId: string): Promise<boolean> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('profiles')
    .select('onboarding_completed')
    .eq('id', userId)
    .single();

  return data?.onboarding_completed === true;
}

/**
 * 온보딩 스킵 처리
 */
export async function skipOnboarding(userId: string): Promise<void> {
  const supabase = await createClient();

  await supabase
    .from('profiles')
    .update({
      onboarding_completed: true,
      onboarding_skipped: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);
}

// ============================================
// Helper Functions
// ============================================

/**
 * 웰컴 보너스 지급
 */
async function grantWelcomeBonus(userId: string): Promise<void> {
  const supabase = await createClient();
  const welcomeBonus = parseInt(process.env.NEXT_PUBLIC_WELCOME_BONUS || '100', 10);

  // 크레딧 잔액 조회
  const { data: credit } = await supabase
    .from('credits')
    .select('balance')
    .eq('user_id', userId)
    .single();

  const currentBalance = credit?.balance || 0;
  const newBalance = currentBalance + welcomeBonus;

  // 크레딧 업데이트 (upsert)
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
      amount: welcomeBonus,
      type: 'bonus',
      description: '온보딩 완료 보너스',
      metadata: { source: 'onboarding_complete' },
    });
}

/**
 * 환영 알림 생성
 */
async function createWelcomeNotification(userId: string, nickname: string): Promise<void> {
  const supabase = await createClient();

  await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      type: 'system',
      priority: 'normal',
      title: '🎉 환영합니다!',
      message: `${nickname}님, HEPHAITOS에 오신 것을 환영합니다! Copy → Learn → Build 여정을 시작하세요.`,
      action_url: '/dashboard',
      action_label: '시작하기',
    });
}

/**
 * DB 데이터를 OnboardingProgress로 매핑
 */
function mapToProgress(data: any): OnboardingProgress {
  return {
    userId: data.user_id,
    currentStep: data.current_step,
    data: data.data || {},
    completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

/**
 * 온보딩 분석 데이터 수집
 */
export async function recordOnboardingAnalytics(
  userId: string,
  event: 'started' | 'step_completed' | 'completed' | 'skipped',
  metadata?: Record<string, unknown>
): Promise<void> {
  const supabase = await createClient();

  await supabase
    .from('analytics_events')
    .insert({
      user_id: userId,
      event_type: `onboarding_${event}`,
      metadata,
      created_at: new Date().toISOString(),
    });
}

/**
 * Credit Service
 * 크레딧 관리 로직 (서버 전용)
 */

import { createClient } from '@/lib/supabase/server'

// 클라이언트/서버 양쪽에서 사용 가능한 함수 재내보내기
export { calculatePrice, getBacktestCost } from './utils'

export type CreditTransactionType = 'purchase' | 'usage' | 'bonus' | 'refund'

interface CreateTransactionParams {
  userId: string
  amount: number
  type: CreditTransactionType
  description?: string
  metadata?: Record<string, any>
}

// Type helper for Supabase queries (workaround for complex Database type inference)
type SupabaseAny = ReturnType<typeof createClient> extends Promise<infer T> ? T : never

/**
 * 사용자의 크레딧 잔액 조회
 */
export async function getCreditBalance(userId: string): Promise<number> {
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('credits')
    .select('balance')
    .eq('user_id', userId)
    .single()

  if (error) {
    // 크레딧 레코드가 없으면 생성
    if (error.code === 'PGRST116') {
      await initializeCredits(userId)
      return parseInt(process.env.NEXT_PUBLIC_WELCOME_BONUS || '50', 10)
    }
    throw error
  }

  return (data as { balance: number }).balance
}

/**
 * 크레딧 초기화 (신규 사용자)
 */
export async function initializeCredits(userId: string): Promise<void> {
  const supabase = await createClient()
  const welcomeBonus = parseInt(process.env.NEXT_PUBLIC_WELCOME_BONUS || '50', 10)

  // 크레딧 레코드 생성
  const { error: creditError } = await (supabase as any)
    .from('credits')
    .insert({
      user_id: userId,
      balance: welcomeBonus,
    })

  if (creditError) throw creditError

  // 웰컴 보너스 거래 기록
  await createTransaction({
    userId,
    amount: welcomeBonus,
    type: 'bonus',
    description: '가입 축하 보너스',
    metadata: { source: 'welcome_bonus' },
  })
}

/**
 * 크레딧 사용
 */
export async function useCredits(
  userId: string,
  amount: number,
  description: string,
  metadata?: Record<string, any>
): Promise<{ success: boolean; newBalance: number }> {
  const supabase = await createClient()

  // 현재 잔액 확인
  const currentBalance = await getCreditBalance(userId)

  if (currentBalance < amount) {
    throw new Error('크레딧이 부족합니다')
  }

  // 잔액 차감
  const newBalance = currentBalance - amount

  const { error } = await (supabase as any)
    .from('credits')
    .update({ balance: newBalance })
    .eq('user_id', userId)

  if (error) throw error

  // 거래 기록
  await createTransaction({
    userId,
    amount: -amount,
    type: 'usage',
    description,
    metadata,
  })

  return { success: true, newBalance }
}

/**
 * 크레딧 추가 (구매, 환불, 보너스 등)
 */
export async function addCredits(
  userId: string,
  amount: number,
  type: CreditTransactionType,
  description: string,
  metadata?: Record<string, any>
): Promise<{ success: boolean; newBalance: number }> {
  const supabase = await createClient()

  // 현재 잔액 확인
  const currentBalance = await getCreditBalance(userId)
  const newBalance = currentBalance + amount

  // 잔액 업데이트
  const { error } = await (supabase as any)
    .from('credits')
    .update({ balance: newBalance })
    .eq('user_id', userId)

  if (error) throw error

  // 거래 기록
  await createTransaction({
    userId,
    amount,
    type,
    description,
    metadata,
  })

  return { success: true, newBalance }
}

/**
 * 크레딧 거래 내역 생성
 */
async function createTransaction(params: CreateTransactionParams): Promise<void> {
  const supabase = await createClient()

  const { error } = await (supabase as any)
    .from('credit_transactions')
    .insert({
      user_id: params.userId,
      amount: params.amount,
      type: params.type,
      description: params.description || null,
      metadata: params.metadata || null,
    })

  if (error) throw error
}

/**
 * 크레딧 거래 내역 조회
 */
export async function getTransactionHistory(
  userId: string,
  limit: number = 50
): Promise<any[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('credit_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error

  return data || []
}


/**
 * Credit Service
 * 크레딧 관리 로직
 */

import { createClient } from '@/lib/supabase/server'

export type CreditTransactionType = 'purchase' | 'usage' | 'bonus' | 'refund'

interface CreateTransactionParams {
  userId: string
  amount: number
  type: CreditTransactionType
  description?: string
  metadata?: Record<string, any>
}

/**
 * 사용자의 크레딧 잔액 조회
 */
export async function getCreditBalance(userId: string): Promise<number> {
  const supabase = await createClient()

  const { data, error } = await supabase
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

  return data.balance
}

/**
 * 크레딧 초기화 (신규 사용자)
 */
export async function initializeCredits(userId: string): Promise<void> {
  const supabase = await createClient()
  const welcomeBonus = parseInt(process.env.NEXT_PUBLIC_WELCOME_BONUS || '50', 10)

  // 크레딧 레코드 생성
  const { error: creditError } = await supabase
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

  const { error } = await supabase
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
  const { error } = await supabase
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

  const { error } = await supabase
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

/**
 * 크레딧 가격 계산
 * @param credits 크레딧 수량
 * @returns KRW 가격
 */
export function calculatePrice(credits: number): number {
  // 가격표 (크레딧당 단가가 대량 구매 시 저렴)
  const priceTiers = [
    { min: 1000, price: 80 },    // 1000+ 크레딧: 80원/크레딧
    { min: 500, price: 90 },     // 500-999 크레딧: 90원/크레딧
    { min: 100, price: 95 },     // 100-499 크레딧: 95원/크레딧
    { min: 0, price: 100 },      // 1-99 크레딧: 100원/크레딧
  ]

  const tier = priceTiers.find((t) => credits >= t.min)!
  return credits * tier.price
}

/**
 * 백테스트 실행 비용 계산
 */
export function getBacktestCost(config: {
  timeframe: string
  days: number
  symbols: number
}): number {
  // 기본 비용: 10 크레딧
  let cost = 10

  // 타임프레임에 따른 추가 비용
  const timeframeMultiplier: Record<string, number> = {
    '1m': 3,
    '5m': 2,
    '15m': 1.5,
    '1h': 1,
    '4h': 0.8,
    '1d': 0.5,
  }

  cost *= timeframeMultiplier[config.timeframe] || 1

  // 기간에 따른 추가 비용 (30일 기준)
  cost *= config.days / 30

  // 심볼 수에 따른 추가 비용
  cost *= config.symbols

  return Math.ceil(cost)
}

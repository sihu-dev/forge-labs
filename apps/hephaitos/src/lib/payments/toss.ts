/**
 * Toss Payments Service
 * 토스페이먼츠 API 연동
 */

import { createClient } from '@/lib/supabase/server'
import { addCredits } from '@/lib/credits/service'

const TOSS_API_URL = 'https://api.tosspayments.com/v1'
const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY || ''

interface PaymentApprovalParams {
  paymentKey: string
  orderId: string
  amount: number
}

interface PaymentApprovalResponse {
  paymentKey: string
  orderId: string
  status: string
  totalAmount: number
  method: string
  approvedAt: string
}

/**
 * 결제 승인 요청
 */
export async function approvePayment(
  params: PaymentApprovalParams
): Promise<PaymentApprovalResponse> {
  const authHeader = Buffer.from(TOSS_SECRET_KEY + ':').toString('base64')
  
  const response = await fetch(TOSS_API_URL + '/payments/confirm', {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + authHeader,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      paymentKey: params.paymentKey,
      orderId: params.orderId,
      amount: params.amount,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || '결제 승인 실패')
  }

  return response.json()
}

/**
 * 결제 취소
 */
export async function cancelPayment(
  paymentKey: string,
  cancelReason: string
): Promise<void> {
  const authHeader = Buffer.from(TOSS_SECRET_KEY + ':').toString('base64')
  
  const response = await fetch(TOSS_API_URL + '/payments/' + paymentKey + '/cancel', {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + authHeader,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      cancelReason,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || '결제 취소 실패')
  }
}

/**
 * 결제 성공 처리 (크레딧 지급)
 */
export async function processSuccessfulPayment(
  userId: string,
  paymentKey: string,
  orderId: string,
  amount: number,
  credits: number
): Promise<void> {
  const supabase = await createClient()

  // 결제 레코드 생성
  const { error: paymentError } = await supabase
    .from('payments')
    .insert({
      user_id: userId,
      payment_key: paymentKey,
      order_id: orderId,
      amount,
      credits,
      status: 'completed',
      provider: 'toss',
    })

  if (paymentError) throw paymentError

  // 크레딧 지급
  await addCredits(userId, credits, 'purchase', '크레딧 ' + credits + '개 구매', {
    payment_key: paymentKey,
    order_id: orderId,
    amount,
  })
}

/**
 * 결제 실패 처리
 */
export async function processFailedPayment(
  userId: string,
  orderId: string,
  errorCode: string,
  errorMessage: string
): Promise<void> {
  const supabase = await createClient()

  await supabase
    .from('payments')
    .insert({
      user_id: userId,
      order_id: orderId,
      amount: 0,
      credits: 0,
      payment_key: '',
      status: 'failed',
      provider: 'toss',
      metadata: {
        error_code: errorCode,
        error_message: errorMessage,
      },
    })
}

/**
 * 주문 ID 생성
 */
export function generateOrderId(userId: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 9)
  return 'ORDER_' + userId.substring(0, 8) + '_' + timestamp + '_' + random
}

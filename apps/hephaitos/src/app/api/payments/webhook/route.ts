// ============================================
// Payment Webhook API
// 토스페이먼츠 웹훅 수신 API
// QRY-026: Payment Webhook Integration
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getTossPaymentsClient, type PlanType, type BillingCycle } from '@/lib/payments/toss-payments'
import { verifyWebhookSignature } from '@/lib/api/providers/toss-payments'

// Supabase Admin Client (service role)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Webhook event types
type WebhookEventType =
  | 'PAYMENT_STATUS_CHANGED'
  | 'BILLING_KEY_STATUS_CHANGED'
  | 'DEPOSIT_CALLBACK'
  | 'PAYOUT_STATUS_CHANGED'

interface WebhookPayload {
  eventType: WebhookEventType
  createdAt: string
  data: {
    paymentKey?: string
    orderId?: string
    status?: string
    transactionKey?: string
    secret?: string
    // Billing key events
    billingKey?: string
    customerKey?: string
    authenticatedAt?: string
  }
}

// Order ID에서 메타데이터 파싱 (HEPH_timestamp_uuid 형식)
function parseOrderMetadata(orderId: string): { userId?: string } {
  // orderId는 HEPH_timestamp_uuid 형식
  // 실제 userId는 결제 생성 시 metadata에 저장됨
  return {}
}

export async function POST(request: NextRequest) {
  try {
    // Raw body와 signature 추출
    const rawBody = await request.text()
    const signature = request.headers.get('x-toss-signature') || ''
    const webhookSecret = process.env.TOSS_WEBHOOK_SECRET

    // Production 환경에서 시그니처 검증 필수
    if (process.env.NODE_ENV === 'production') {
      if (!webhookSecret) {
        console.error('[Webhook] TOSS_WEBHOOK_SECRET not configured in production')
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
      }

      if (!signature) {
        console.warn('[Webhook] Missing signature header')
        return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
      }

      const isValid = verifyWebhookSignature(rawBody, signature, webhookSecret)
      if (!isValid) {
        console.warn('[Webhook] Invalid signature')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    const payload: WebhookPayload = JSON.parse(rawBody)

    console.log('[Webhook] Received:', {
      eventType: payload.eventType,
      createdAt: payload.createdAt,
      orderId: payload.data.orderId,
      status: payload.data.status,
    })

    switch (payload.eventType) {
      case 'PAYMENT_STATUS_CHANGED':
        await handlePaymentStatusChanged(payload.data)
        break

      case 'BILLING_KEY_STATUS_CHANGED':
        await handleBillingKeyChanged(payload.data)
        break

      case 'DEPOSIT_CALLBACK':
        await handleDepositCallback(payload.data)
        break

      default:
        console.log('[Webhook] Unhandled event type:', payload.eventType)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Webhook] Error:', error)
    // Webhook은 항상 200을 반환해야 재시도를 방지할 수 있음
    return NextResponse.json({ success: false })
  }
}

// ============================================
// Payment Status Changed Handler
// ============================================
async function handlePaymentStatusChanged(data: WebhookPayload['data']) {
  if (!data.paymentKey || !data.orderId) return

  const client = getTossPaymentsClient()
  const payment = await client.getPayment(data.paymentKey)

  if (!payment) {
    console.warn('[Webhook] Payment not found:', data.paymentKey)
    return
  }

  console.log('[Webhook] Payment status:', {
    orderId: payment.orderId,
    status: payment.status,
    amount: payment.amount,
  })

  // DB에서 결제 정보 조회
  const { data: existingPayment, error: fetchError } = await supabaseAdmin
    .from('payments')
    .select('*, user_id, plan_id, billing_cycle')
    .eq('order_id', payment.orderId)
    .single()

  if (fetchError || !existingPayment) {
    console.warn('[Webhook] Payment record not found in DB:', payment.orderId)
    return
  }

  const userId = existingPayment.user_id
  const planId = existingPayment.plan_id as PlanType | null
  const billingCycle = existingPayment.billing_cycle as BillingCycle | null

  switch (payment.status) {
    case 'completed':
      // 결제 완료 처리
      await handlePaymentCompleted(
        userId,
        payment.orderId,
        data.paymentKey,
        payment.amount,
        planId,
        billingCycle,
        payment.method
      )
      break

    case 'cancelled':
      // 결제 취소 처리
      await handlePaymentCancelled(data.paymentKey)
      break

    case 'failed':
      // 결제 실패 처리
      await handlePaymentFailed(payment.orderId)
      break

    default:
      console.log('[Webhook] Payment status pending:', payment.status)
  }
}

// ============================================
// Payment Completed
// ============================================
async function handlePaymentCompleted(
  userId: string,
  orderId: string,
  paymentKey: string,
  amount: number,
  planId: PlanType | null,
  billingCycle: BillingCycle | null,
  paymentMethod?: string
) {
  console.log('[Webhook] Processing completed payment:', { userId, orderId, planId })

  // 1. 결제 상태 업데이트
  const { error: updateError } = await supabaseAdmin
    .from('payments')
    .update({
      status: 'completed',
      payment_key: paymentKey,
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('order_id', orderId)

  if (updateError) {
    console.error('[Webhook] Failed to update payment:', updateError)
    return
  }

  // 2. 구독 활성화 (planId가 있는 경우)
  if (planId && planId !== 'free') {
    const { error: subError } = await supabaseAdmin.rpc('activate_subscription', {
      p_user_id: userId,
      p_plan_id: planId,
      p_billing_cycle: billingCycle || 'monthly',
      p_payment_method: paymentMethod || 'card',
    })

    if (subError) {
      console.error('[Webhook] Failed to activate subscription:', subError)
    } else {
      console.log('[Webhook] Subscription activated:', { userId, planId })
    }
  }

  // 3. 크레딧 추가 (플랜별 보너스)
  const creditBonus = getCreditBonus(planId, billingCycle)
  if (creditBonus > 0) {
    // 현재 크레딧 조회 후 증가
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .single()

    const currentCredits = profile?.credits || 0
    const { error: creditError } = await supabaseAdmin
      .from('profiles')
      .update({
        credits: currentCredits + creditBonus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (creditError) {
      console.error('[Webhook] Failed to add credits:', creditError)
    } else {
      console.log('[Webhook] Credits added:', { userId, amount: creditBonus, total: currentCredits + creditBonus })
    }
  }

  // 4. 알림 생성
  await supabaseAdmin.from('notifications').insert({
    user_id: userId,
    type: 'system',
    priority: 'normal',
    title: '결제가 완료되었습니다',
    message: `${planId?.toUpperCase() || '결제'}가 성공적으로 처리되었습니다.`,
    data: { orderId, amount, planId },
    action_url: '/dashboard/settings/billing',
    action_label: '결제 내역 확인',
  })
}

// ============================================
// Payment Cancelled
// ============================================
async function handlePaymentCancelled(paymentKey: string) {
  console.log('[Webhook] Processing cancelled payment:', paymentKey)

  // 결제 취소 기록
  const { data: payment, error } = await supabaseAdmin
    .from('payments')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('payment_key', paymentKey)
    .select('user_id, plan_id')
    .single()

  if (error || !payment) {
    console.error('[Webhook] Failed to update cancelled payment:', error)
    return
  }

  // 구독 취소 처리 (기간 종료 시)
  if (payment.plan_id && payment.plan_id !== 'free') {
    await supabaseAdmin.rpc('cancel_subscription', {
      p_user_id: payment.user_id,
      p_immediate: false, // 기간 종료 시 취소
    })
  }

  // 알림 생성
  await supabaseAdmin.from('notifications').insert({
    user_id: payment.user_id,
    type: 'system',
    priority: 'normal',
    title: '결제가 취소되었습니다',
    message: '결제가 취소되었습니다. 현재 구독은 기간 종료 시 만료됩니다.',
    action_url: '/dashboard/settings/billing',
    action_label: '결제 내역 확인',
  })
}

// ============================================
// Payment Failed
// ============================================
async function handlePaymentFailed(orderId: string) {
  console.log('[Webhook] Processing failed payment:', orderId)

  const { data: payment, error } = await supabaseAdmin
    .from('payments')
    .update({
      status: 'failed',
      updated_at: new Date().toISOString(),
    })
    .eq('order_id', orderId)
    .select('user_id')
    .single()

  if (error || !payment) {
    console.error('[Webhook] Failed to update failed payment:', error)
    return
  }

  // 알림 생성
  await supabaseAdmin.from('notifications').insert({
    user_id: payment.user_id,
    type: 'system',
    priority: 'high',
    title: '결제에 실패했습니다',
    message: '결제 처리 중 문제가 발생했습니다. 다시 시도해주세요.',
    action_url: '/pricing',
    action_label: '다시 결제하기',
  })
}

// ============================================
// Billing Key Changed (정기결제)
// ============================================
async function handleBillingKeyChanged(data: WebhookPayload['data']) {
  console.log('[Webhook] Billing key changed:', data.billingKey?.substring(0, 10) + '...')

  if (!data.customerKey || !data.billingKey) return

  // 빌링키 저장 (customerKey가 userId인 경우)
  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      billing_key: data.billingKey,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', data.customerKey)

  if (error) {
    console.error('[Webhook] Failed to update billing key:', error)
  }
}

// ============================================
// Deposit Callback (가상계좌)
// ============================================
async function handleDepositCallback(data: WebhookPayload['data']) {
  console.log('[Webhook] Deposit callback:', data.orderId)

  if (!data.orderId || !data.secret) return

  // 가상계좌 입금 완료 처리
  const { data: payment, error } = await supabaseAdmin
    .from('payments')
    .select('*')
    .eq('order_id', data.orderId)
    .single()

  if (error || !payment) {
    console.error('[Webhook] Payment not found for deposit:', data.orderId)
    return
  }

  // 입금 완료로 처리
  await handlePaymentCompleted(
    payment.user_id,
    payment.order_id,
    data.transactionKey || '',
    payment.amount,
    payment.plan_id,
    payment.billing_cycle,
    'virtual_account'
  )
}

// ============================================
// Helper Functions
// ============================================

function getCreditBonus(planId: PlanType | null, billingCycle: BillingCycle | null): number {
  if (!planId || planId === 'free') return 0

  const bonusMap: Record<PlanType, { monthly: number; yearly: number }> = {
    free: { monthly: 0, yearly: 0 },
    starter: { monthly: 100, yearly: 1500 }, // 연간 시 25% 보너스
    pro: { monthly: 500, yearly: 7500 },
    team: { monthly: 2000, yearly: 30000 },
  }

  const bonus = bonusMap[planId]
  return billingCycle === 'yearly' ? bonus.yearly : bonus.monthly
}

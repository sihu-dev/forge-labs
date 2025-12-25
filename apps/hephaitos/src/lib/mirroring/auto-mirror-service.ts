/**
 * Auto Mirror Service
 * QRY-016: 셀럽 포트폴리오 자동 미러링 서비스
 */

import { createClient } from '@/lib/supabase/server'
import { celebrityPortfolioManager, type TradeActivity, type MirrorConfig } from './celebrity-portfolio'
import { safeLogger } from '@/lib/utils/safe-logger'

// ============================================
// Types
// ============================================

export interface MirrorOrder {
  id: string
  userId: string
  celebrityId: string
  celebrityName: string
  symbol: string
  action: 'buy' | 'sell'
  suggestedShares: number
  suggestedValue: number
  reason: string
  originalTrade: TradeActivity
  status: 'pending' | 'approved' | 'rejected' | 'executed'
  createdAt: Date
  executedAt?: Date
}

export interface MirrorSubscription {
  id: string
  userId: string
  celebrityId: string
  celebrityName: string
  investmentAmount: number
  autoExecute: boolean
  minTradeValue: number
  maxTradeValue: number
  excludeSymbols: string[]
  notifyOnTrade: boolean
  notifyMethods: ('email' | 'push' | 'inapp')[]
  isActive: boolean
  createdAt: Date
  lastCheckedAt?: Date
}

export interface MirrorStats {
  userId: string
  totalSubscriptions: number
  activeSubscriptions: number
  pendingOrders: number
  executedOrders: number
  totalMirroredValue: number
  matchScoreAvg: number
}

// ============================================
// Auto Mirror Service
// ============================================

export class AutoMirrorService {
  /**
   * Subscribe to celebrity trades
   */
  async subscribe(
    userId: string,
    celebrityId: string,
    config: Partial<MirrorSubscription>
  ): Promise<MirrorSubscription> {
    const supabase = await createClient()
    const celebrity = celebrityPortfolioManager.getCelebrity(celebrityId)

    if (!celebrity) {
      throw new Error('Celebrity not found')
    }

    const subscription: MirrorSubscription = {
      id: `mirror_sub_${Date.now()}`,
      userId,
      celebrityId,
      celebrityName: celebrity.nameKr,
      investmentAmount: config.investmentAmount || 10000000,
      autoExecute: config.autoExecute || false,
      minTradeValue: config.minTradeValue || 100000,
      maxTradeValue: config.maxTradeValue || 10000000,
      excludeSymbols: config.excludeSymbols || [],
      notifyOnTrade: config.notifyOnTrade ?? true,
      notifyMethods: config.notifyMethods || ['inapp'],
      isActive: true,
      createdAt: new Date(),
    }

    // Save to database
    const { error } = await supabase.from('mirror_subscriptions').upsert({
      id: subscription.id,
      user_id: userId,
      celebrity_id: celebrityId,
      celebrity_name: celebrity.nameKr,
      investment_amount: subscription.investmentAmount,
      auto_execute: subscription.autoExecute,
      min_trade_value: subscription.minTradeValue,
      max_trade_value: subscription.maxTradeValue,
      exclude_symbols: subscription.excludeSymbols,
      notify_on_trade: subscription.notifyOnTrade,
      notify_methods: subscription.notifyMethods,
      is_active: subscription.isActive,
    })

    if (error) {
      safeLogger.error('[AutoMirror] Failed to save subscription', { error })
    }

    // Record analytics
    await this.recordAnalytics(userId, 'subscription_created', {
      celebrityId,
      investmentAmount: subscription.investmentAmount,
    })

    return subscription
  }

  /**
   * Unsubscribe from celebrity
   */
  async unsubscribe(userId: string, celebrityId: string): Promise<void> {
    const supabase = await createClient()

    await supabase
      .from('mirror_subscriptions')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('celebrity_id', celebrityId)

    await this.recordAnalytics(userId, 'subscription_cancelled', { celebrityId })
  }

  /**
   * Get user subscriptions
   */
  async getSubscriptions(userId: string): Promise<MirrorSubscription[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('mirror_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)

    if (error || !data) {
      return []
    }

    return data.map(this.mapSubscription)
  }

  /**
   * Check for new celebrity trades and generate mirror orders
   */
  async checkForNewTrades(userId: string): Promise<MirrorOrder[]> {
    const subscriptions = await this.getSubscriptions(userId)
    const newOrders: MirrorOrder[] = []

    for (const sub of subscriptions) {
      try {
        // Get recent trades from celebrity
        const trades = await celebrityPortfolioManager.getTradesAsync(sub.celebrityId, 10)

        // Filter trades since last check
        const newTrades = trades.filter(t =>
          !sub.lastCheckedAt || new Date(t.reportedDate) > sub.lastCheckedAt
        )

        for (const trade of newTrades) {
          // Check if symbol is excluded
          if (sub.excludeSymbols.includes(trade.symbol)) {
            continue
          }

          // Calculate suggested order
          const suggestedValue = this.calculateMirrorValue(trade, sub)

          // Check value limits
          if (suggestedValue < sub.minTradeValue || suggestedValue > sub.maxTradeValue) {
            continue
          }

          // Create mirror order
          const order = await this.createMirrorOrder(userId, sub, trade, suggestedValue)
          newOrders.push(order)

          // Send notification if enabled
          if (sub.notifyOnTrade) {
            await this.sendTradeNotification(userId, sub, trade, order)
          }
        }

        // Update last checked timestamp
        await this.updateLastChecked(userId, sub.celebrityId)
      } catch (error) {
        safeLogger.error('[AutoMirror] Failed to check trades', {
          userId,
          celebrityId: sub.celebrityId,
          error
        })
      }
    }

    return newOrders
  }

  /**
   * Get pending mirror orders
   */
  async getPendingOrders(userId: string): Promise<MirrorOrder[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('mirror_orders')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error || !data) {
      return []
    }

    return data.map(this.mapOrder)
  }

  /**
   * Approve mirror order (for manual execution)
   */
  async approveOrder(userId: string, orderId: string): Promise<MirrorOrder> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('mirror_orders')
      .update({ status: 'approved' })
      .eq('id', orderId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error || !data) {
      throw new Error('Failed to approve order')
    }

    await this.recordAnalytics(userId, 'order_approved', { orderId })

    return this.mapOrder(data)
  }

  /**
   * Reject mirror order
   */
  async rejectOrder(userId: string, orderId: string, reason?: string): Promise<void> {
    const supabase = await createClient()

    await supabase
      .from('mirror_orders')
      .update({
        status: 'rejected',
        rejection_reason: reason
      })
      .eq('id', orderId)
      .eq('user_id', userId)

    await this.recordAnalytics(userId, 'order_rejected', { orderId, reason })
  }

  /**
   * Execute approved order (connects to broker)
   */
  async executeOrder(userId: string, orderId: string): Promise<MirrorOrder> {
    const supabase = await createClient()

    // Get order details
    const { data: order, error } = await supabase
      .from('mirror_orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', userId)
      .single()

    if (error || !order) {
      throw new Error('Order not found')
    }

    if (order.status !== 'approved' && order.status !== 'pending') {
      throw new Error('Order cannot be executed')
    }

    try {
      // TODO: Connect to UnifiedBroker for actual execution
      // const broker = await getBrokerForUser(userId)
      // await broker.executeOrder({
      //   symbol: order.symbol,
      //   action: order.action,
      //   quantity: order.suggested_shares,
      // })

      // Update order status
      await supabase
        .from('mirror_orders')
        .update({
          status: 'executed',
          executed_at: new Date().toISOString()
        })
        .eq('id', orderId)

      await this.recordAnalytics(userId, 'order_executed', {
        orderId,
        symbol: order.symbol,
        value: order.suggested_value
      })

      return this.mapOrder({ ...order, status: 'executed', executed_at: new Date() })
    } catch (error) {
      safeLogger.error('[AutoMirror] Failed to execute order', { orderId, error })
      throw new Error('Order execution failed')
    }
  }

  /**
   * Get mirror statistics for user
   */
  async getStats(userId: string): Promise<MirrorStats> {
    const supabase = await createClient()

    // Get subscription counts
    const { data: subs } = await supabase
      .from('mirror_subscriptions')
      .select('*')
      .eq('user_id', userId)

    // Get order counts
    const { data: orders } = await supabase
      .from('mirror_orders')
      .select('*')
      .eq('user_id', userId)

    const totalSubs = subs?.length || 0
    const activeSubs = subs?.filter(s => s.is_active).length || 0
    const pendingOrders = orders?.filter(o => o.status === 'pending').length || 0
    const executedOrders = orders?.filter(o => o.status === 'executed').length || 0
    const totalValue = orders
      ?.filter(o => o.status === 'executed')
      .reduce((sum, o) => sum + o.suggested_value, 0) || 0

    return {
      userId,
      totalSubscriptions: totalSubs,
      activeSubscriptions: activeSubs,
      pendingOrders,
      executedOrders,
      totalMirroredValue: totalValue,
      matchScoreAvg: 75, // TODO: Calculate actual match score
    }
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  private calculateMirrorValue(trade: TradeActivity, sub: MirrorSubscription): number {
    // Get celebrity portfolio to calculate weight
    const portfolio = celebrityPortfolioManager.getPortfolio(sub.celebrityId)
    if (!portfolio) {
      return trade.value
    }

    // Find holding weight for this symbol
    const holding = portfolio.holdings.find(h => h.symbol === trade.symbol)
    const weight = holding?.weight || 5 // Default 5% if not found

    // Calculate proportional value based on user's investment amount
    return (sub.investmentAmount * weight) / 100
  }

  private async createMirrorOrder(
    userId: string,
    sub: MirrorSubscription,
    trade: TradeActivity,
    suggestedValue: number
  ): Promise<MirrorOrder> {
    const supabase = await createClient()

    // Get current price for share calculation
    const portfolio = celebrityPortfolioManager.getPortfolio(sub.celebrityId)
    const holding = portfolio?.holdings.find(h => h.symbol === trade.symbol)
    const currentPrice = holding?.currentPrice || trade.price

    const suggestedShares = Math.floor(suggestedValue / currentPrice)

    const order: MirrorOrder = {
      id: `mirror_order_${Date.now()}`,
      userId,
      celebrityId: sub.celebrityId,
      celebrityName: sub.celebrityName,
      symbol: trade.symbol,
      action: trade.action,
      suggestedShares,
      suggestedValue,
      reason: `${sub.celebrityName}의 ${trade.symbol} ${trade.action === 'buy' ? '매수' : '매도'} 미러링`,
      originalTrade: trade,
      status: sub.autoExecute ? 'approved' : 'pending',
      createdAt: new Date(),
    }

    // Save to database
    await supabase.from('mirror_orders').insert({
      id: order.id,
      user_id: userId,
      celebrity_id: sub.celebrityId,
      celebrity_name: sub.celebrityName,
      symbol: order.symbol,
      action: order.action,
      suggested_shares: order.suggestedShares,
      suggested_value: order.suggestedValue,
      reason: order.reason,
      original_trade: trade,
      status: order.status,
    })

    return order
  }

  private async sendTradeNotification(
    userId: string,
    sub: MirrorSubscription,
    trade: TradeActivity,
    order: MirrorOrder
  ): Promise<void> {
    const supabase = await createClient()

    // Create in-app notification
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'mirror_trade',
      priority: 'high',
      title: `${sub.celebrityName} 새 거래`,
      message: `${trade.symbol} ${trade.action === 'buy' ? '매수' : '매도'} 신호가 감지되었습니다. 미러링 주문이 생성되었습니다.`,
      action_url: `/dashboard/mirroring?order=${order.id}`,
      action_label: '주문 확인',
      metadata: {
        celebrityId: sub.celebrityId,
        symbol: trade.symbol,
        orderId: order.id,
      },
    })

    // Email notification (if enabled)
    if (sub.notifyMethods.includes('email')) {
      try {
        const { sendEmailNotification } = await import('@/lib/notifications/email-notification')
        await sendEmailNotification({
          userId,
          type: 'trade',
          title: `${sub.celebrityName} 새 거래 알림`,
          message: `${trade.symbol}에 대한 ${trade.action === 'buy' ? '매수' : '매도'} 거래가 감지되었습니다.`,
          metadata: {
            celebrityName: sub.celebrityName,
            symbol: trade.symbol,
            action: trade.action,
            suggestedValue: order.suggestedValue,
          },
        })
      } catch (error) {
        safeLogger.warn('[AutoMirror] Email notification failed', { userId, error })
      }
    }
  }

  private async updateLastChecked(userId: string, celebrityId: string): Promise<void> {
    const supabase = await createClient()

    await supabase
      .from('mirror_subscriptions')
      .update({ last_checked_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('celebrity_id', celebrityId)
  }

  private async recordAnalytics(
    userId: string,
    event: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const supabase = await createClient()

    await supabase.from('analytics_events').insert({
      user_id: userId,
      event_type: `mirror_${event}`,
      metadata,
    }).catch(() => {})
  }

  private mapSubscription(data: Record<string, unknown>): MirrorSubscription {
    return {
      id: data.id as string,
      userId: data.user_id as string,
      celebrityId: data.celebrity_id as string,
      celebrityName: data.celebrity_name as string,
      investmentAmount: data.investment_amount as number,
      autoExecute: data.auto_execute as boolean,
      minTradeValue: data.min_trade_value as number,
      maxTradeValue: data.max_trade_value as number,
      excludeSymbols: (data.exclude_symbols as string[]) || [],
      notifyOnTrade: data.notify_on_trade as boolean,
      notifyMethods: (data.notify_methods as ('email' | 'push' | 'inapp')[]) || ['inapp'],
      isActive: data.is_active as boolean,
      createdAt: new Date(data.created_at as string),
      lastCheckedAt: data.last_checked_at ? new Date(data.last_checked_at as string) : undefined,
    }
  }

  private mapOrder(data: Record<string, unknown>): MirrorOrder {
    return {
      id: data.id as string,
      userId: data.user_id as string,
      celebrityId: data.celebrity_id as string,
      celebrityName: data.celebrity_name as string,
      symbol: data.symbol as string,
      action: data.action as 'buy' | 'sell',
      suggestedShares: data.suggested_shares as number,
      suggestedValue: data.suggested_value as number,
      reason: data.reason as string,
      originalTrade: data.original_trade as TradeActivity,
      status: data.status as MirrorOrder['status'],
      createdAt: new Date(data.created_at as string),
      executedAt: data.executed_at ? new Date(data.executed_at as string) : undefined,
    }
  }
}

// ============================================
// Singleton Instance
// ============================================

export const autoMirrorService = new AutoMirrorService()

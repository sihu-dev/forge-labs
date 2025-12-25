// ============================================
// Notification Service
// Supabase Realtime 기반 실시간 알림 서비스
// QRY-025: Real-time WebSocket Notifications
// ============================================

import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type {
  Notification,
  NotificationType,
  NotificationPriority,
  NotificationSettings,
} from './types'

// ============================================
// Default Settings
// ============================================

const DEFAULT_SETTINGS: NotificationSettings = {
  email: true,
  push: true,
  inApp: true,
  categories: {
    price_alert: true,
    trade_executed: true,
    strategy_signal: true,
    celebrity_trade: true,
    portfolio_update: true,
    system: true,
    achievement: true,
    coaching: true,
  },
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00',
  },
}

// ============================================
// Database row type
// ============================================

interface NotificationRow {
  id: string
  user_id: string
  type: NotificationType
  priority: NotificationPriority
  title: string
  message: string
  data: Record<string, unknown> | null
  read: boolean
  action_url: string | null
  action_label: string | null
  expires_at: string | null
  created_at: string
}

// ============================================
// Notification Service Class
// ============================================

type NotificationListener = (notification: Notification) => void
type ConnectionListener = (connected: boolean) => void

class NotificationService {
  private notifications: Notification[] = []
  private settings: NotificationSettings = DEFAULT_SETTINGS
  private listeners: Set<NotificationListener> = new Set()
  private connectionListeners: Set<ConnectionListener> = new Set()
  private channel: RealtimeChannel | null = null
  private isConnected = false
  private userId: string | null = null

  // ============================================
  // Connection Management
  // ============================================

  async connect(userId: string): Promise<void> {
    this.userId = userId
    const supabase = createClient()

    try {
      // 초기 알림 로드
      await this.loadInitialNotifications()

      // Supabase Realtime 채널 구독
      this.channel = supabase
        .channel(`notifications:${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const notification = this.mapRowToNotification(payload.new as NotificationRow)
            this.addNotification(notification)
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const notification = this.mapRowToNotification(payload.new as NotificationRow)
            this.updateNotification(notification)
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            this.deleteInternal((payload.old as NotificationRow).id)
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('[NotificationService] Connected to Supabase Realtime')
            this.setConnected(true)
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            console.log('[NotificationService] Disconnected:', status)
            this.setConnected(false)
          }
        })
    } catch (error) {
      console.error('[NotificationService] Connection error:', error)
      this.setConnected(false)
    }
  }

  disconnect(): void {
    if (this.channel) {
      this.channel.unsubscribe()
      this.channel = null
    }
    this.setConnected(false)
    this.userId = null
  }

  private async loadInitialNotifications(): Promise<void> {
    if (!this.userId) return

    try {
      const response = await fetch(`/api/notifications?limit=50`)
      const data = await response.json()

      if (data.success && data.data?.notifications) {
        this.notifications = data.data.notifications.map((row: NotificationRow) =>
          this.mapRowToNotification(row)
        )
      }
    } catch (error) {
      console.error('[NotificationService] Failed to load initial notifications:', error)
    }
  }

  private mapRowToNotification(row: NotificationRow): Notification {
    return {
      id: row.id,
      type: row.type,
      priority: row.priority,
      title: row.title,
      message: row.message,
      data: row.data || undefined,
      read: row.read,
      createdAt: new Date(row.created_at),
      expiresAt: row.expires_at ? new Date(row.expires_at) : undefined,
      actionUrl: row.action_url || undefined,
      actionLabel: row.action_label || undefined,
    }
  }

  private setConnected(connected: boolean): void {
    this.isConnected = connected
    this.connectionListeners.forEach((listener) => listener(connected))
  }

  // ============================================
  // Notification Handling
  // ============================================

  private addNotification(notification: Notification): void {
    // 설정 확인
    if (!this.shouldShowNotification(notification)) {
      return
    }

    // 중복 체크
    const exists = this.notifications.some((n) => n.id === notification.id)
    if (exists) return

    // 추가
    this.notifications.unshift(notification)

    // 리스너 알림
    this.listeners.forEach((listener) => listener(notification))

    // 브라우저 알림 표시
    if (this.settings.push && 'Notification' in window) {
      this.showBrowserNotification(notification)
    }
  }

  private updateNotification(notification: Notification): void {
    const index = this.notifications.findIndex((n) => n.id === notification.id)
    if (index !== -1) {
      this.notifications[index] = notification
    }
  }

  private deleteInternal(id: string): void {
    this.notifications = this.notifications.filter((n) => n.id !== id)
  }

  private clearAllInternal(): void {
    this.notifications = []
  }

  // ============================================
  // Public Methods
  // ============================================

  getNotifications(): Notification[] {
    return [...this.notifications]
  }

  getUnreadCount(): number {
    return this.notifications.filter((n) => !n.read).length
  }

  async markAsRead(id: string): Promise<void> {
    // 낙관적 업데이트
    const notification = this.notifications.find((n) => n.id === id)
    if (notification) {
      notification.read = true
    }

    // API 호출
    try {
      await fetch(`/api/notifications/${id}`, { method: 'PATCH' })
    } catch (error) {
      console.error('[NotificationService] Failed to mark as read:', error)
    }
  }

  async markAllAsRead(): Promise<void> {
    // 낙관적 업데이트
    this.notifications.forEach((n) => {
      n.read = true
    })

    // API 호출
    try {
      await fetch('/api/notifications/read-all', { method: 'POST' })
    } catch (error) {
      console.error('[NotificationService] Failed to mark all as read:', error)
    }
  }

  async delete(id: string): Promise<void> {
    // 낙관적 업데이트
    this.deleteInternal(id)

    // API 호출
    try {
      await fetch(`/api/notifications/${id}`, { method: 'DELETE' })
    } catch (error) {
      console.error('[NotificationService] Failed to delete notification:', error)
    }
  }

  async clearAll(): Promise<void> {
    // 낙관적 업데이트
    this.clearAllInternal()

    // API 호출
    try {
      await fetch('/api/notifications', { method: 'DELETE' })
    } catch (error) {
      console.error('[NotificationService] Failed to clear all notifications:', error)
    }
  }

  // ============================================
  // Local Notification Creation (for testing)
  // ============================================

  async createNotification(
    type: NotificationType,
    title: string,
    message: string,
    options?: {
      priority?: NotificationPriority
      data?: Record<string, unknown>
      actionUrl?: string
      actionLabel?: string
    }
  ): Promise<Notification | null> {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          title,
          message,
          priority: options?.priority ?? 'normal',
          data: options?.data,
          actionUrl: options?.actionUrl,
          actionLabel: options?.actionLabel,
        }),
      })

      const data = await response.json()
      if (data.success && data.data) {
        return this.mapRowToNotification(data.data)
      }
      return null
    } catch (error) {
      console.error('[NotificationService] Failed to create notification:', error)
      return null
    }
  }

  // ============================================
  // Settings
  // ============================================

  getSettings(): NotificationSettings {
    return { ...this.settings }
  }

  async updateSettings(settings: Partial<NotificationSettings>): Promise<void> {
    this.settings = { ...this.settings, ...settings }

    // 서버에 설정 저장
    try {
      await fetch('/api/notifications/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email_enabled: this.settings.email,
          push_enabled: this.settings.push,
          in_app_enabled: this.settings.inApp,
          categories: this.settings.categories,
          quiet_hours_enabled: this.settings.quietHours.enabled,
          quiet_hours_start: this.settings.quietHours.start,
          quiet_hours_end: this.settings.quietHours.end,
        }),
      })
    } catch (error) {
      console.error('[NotificationService] Failed to save settings:', error)
    }

    // 로컬 스토리지에도 저장
    try {
      localStorage.setItem('notification_settings', JSON.stringify(this.settings))
    } catch (error) {
      console.warn('[NotificationService] Failed to save settings to localStorage:', error)
    }
  }

  async loadSettings(): Promise<void> {
    // 먼저 로컬 스토리지에서 로드
    try {
      const saved = localStorage.getItem('notification_settings')
      if (saved) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }
      }
    } catch (error) {
      console.warn('[NotificationService] Failed to load settings from localStorage:', error)
    }

    // 서버에서 설정 로드
    try {
      const response = await fetch('/api/notifications/settings')
      const data = await response.json()

      if (data.success && data.data) {
        this.settings = {
          email: data.data.email_enabled,
          push: data.data.push_enabled,
          inApp: data.data.in_app_enabled,
          categories: data.data.categories,
          quietHours: {
            enabled: data.data.quiet_hours_enabled,
            start: data.data.quiet_hours_start,
            end: data.data.quiet_hours_end,
          },
        }

        // 로컬 스토리지 업데이트
        localStorage.setItem('notification_settings', JSON.stringify(this.settings))
      }
    } catch (error) {
      console.warn('[NotificationService] Failed to load settings from server:', error)
    }
  }

  // ============================================
  // Listeners
  // ============================================

  onNotification(listener: NotificationListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  onConnectionChange(listener: ConnectionListener): () => void {
    this.connectionListeners.add(listener)
    return () => this.connectionListeners.delete(listener)
  }

  // ============================================
  // Utilities
  // ============================================

  private shouldShowNotification(notification: Notification): boolean {
    // 카테고리 설정 확인
    if (!this.settings.categories[notification.type]) {
      return false
    }

    // 조용한 시간 확인
    if (this.settings.quietHours.enabled) {
      const now = new Date()
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
      const { start, end } = this.settings.quietHours

      // 조용한 시간 내인지 확인
      if (start < end) {
        if (currentTime >= start && currentTime <= end) {
          return notification.priority === 'urgent'
        }
      } else {
        // 자정을 넘는 경우 (예: 22:00 ~ 08:00)
        if (currentTime >= start || currentTime <= end) {
          return notification.priority === 'urgent'
        }
      }
    }

    return true
  }

  private async showBrowserNotification(notification: Notification): Promise<void> {
    if (!('Notification' in window)) return

    if (Notification.permission === 'default') {
      await Notification.requestPermission()
    }

    if (Notification.permission === 'granted') {
      const icon = this.getNotificationIcon(notification.type)
      new Notification(notification.title, {
        body: notification.message,
        icon,
        tag: notification.id,
        data: notification,
      })
    }
  }

  private getNotificationIcon(type: NotificationType): string {
    const icons: Record<NotificationType, string> = {
      price_alert: '/icons/notification-price.png',
      trade_executed: '/icons/notification-trade.png',
      strategy_signal: '/icons/notification-strategy.png',
      celebrity_trade: '/icons/notification-celebrity.png',
      portfolio_update: '/icons/notification-portfolio.png',
      system: '/icons/notification-system.png',
      achievement: '/icons/notification-achievement.png',
      coaching: '/icons/notification-coaching.png',
    }
    return icons[type] || '/icons/notification-default.png'
  }

  getConnectionStatus(): boolean {
    return this.isConnected
  }
}

// ============================================
// Singleton Instance
// ============================================

export const notificationService = new NotificationService()
export default notificationService

/**
 * Push Notification Service
 * 웹 푸시 알림 서비스
 */

import type { Notification, NotificationType } from './types';

// VAPID 키 (Web Push)
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

// 알림 타입별 아이콘
const NOTIFICATION_ICONS: Record<NotificationType, string> = {
  price_alert: '/icons/push-price.png',
  trade_executed: '/icons/push-trade.png',
  strategy_signal: '/icons/push-strategy.png',
  celebrity_trade: '/icons/push-celebrity.png',
  portfolio_update: '/icons/push-portfolio.png',
  system: '/icons/push-system.png',
  achievement: '/icons/push-achievement.png',
  coaching: '/icons/push-coaching.png',
};

// 알림 타입별 배지
const NOTIFICATION_BADGES: Record<NotificationType, string> = {
  price_alert: '/badges/price.png',
  trade_executed: '/badges/trade.png',
  strategy_signal: '/badges/strategy.png',
  celebrity_trade: '/badges/celebrity.png',
  portfolio_update: '/badges/portfolio.png',
  system: '/badges/system.png',
  achievement: '/badges/achievement.png',
  coaching: '/badges/coaching.png',
};

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface SendPushResult {
  success: boolean;
  error?: string;
}

/**
 * 푸시 알림 권한 요청
 */
export async function requestPushPermission(): Promise<'granted' | 'denied' | 'default'> {
  if (!('Notification' in window)) {
    console.warn('[PushNotification] Notifications not supported');
    return 'denied';
  }

  if (!('serviceWorker' in navigator)) {
    console.warn('[PushNotification] Service Worker not supported');
    return 'denied';
  }

  const permission = await Notification.requestPermission();
  return permission;
}

/**
 * 푸시 구독 생성
 */
export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!VAPID_PUBLIC_KEY) {
    console.warn('[PushNotification] VAPID key not configured');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    // 서버에 구독 정보 저장
    await saveSubscription(subscription);

    return {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: arrayBufferToBase64(subscription.getKey('p256dh')!),
        auth: arrayBufferToBase64(subscription.getKey('auth')!),
      },
    };
  } catch (error) {
    console.error('[PushNotification] Subscribe failed:', error);
    return null;
  }
}

/**
 * 푸시 구독 해제
 */
export async function unsubscribeFromPush(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();
      await removeSubscription(subscription.endpoint);
      return true;
    }

    return false;
  } catch (error) {
    console.error('[PushNotification] Unsubscribe failed:', error);
    return false;
  }
}

/**
 * 현재 푸시 구독 상태 확인
 */
export async function getPushSubscriptionStatus(): Promise<{
  supported: boolean;
  permission: NotificationPermission;
  subscribed: boolean;
}> {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    return { supported: false, permission: 'denied', subscribed: false };
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    return {
      supported: true,
      permission: Notification.permission,
      subscribed: !!subscription,
    };
  } catch {
    return { supported: false, permission: 'denied', subscribed: false };
  }
}

/**
 * 로컬 알림 표시 (Service Worker 없이)
 */
export async function showLocalNotification(notification: Notification): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission !== 'granted') return false;

  try {
    const icon = NOTIFICATION_ICONS[notification.type];
    const badge = NOTIFICATION_BADGES[notification.type];

    new Notification(notification.title, {
      body: notification.message,
      icon,
      badge,
      tag: notification.id,
      data: notification,
      requireInteraction: notification.priority === 'urgent',
      silent: notification.priority === 'low',
    });

    return true;
  } catch (error) {
    console.error('[PushNotification] Show notification failed:', error);
    return false;
  }
}

/**
 * 서버에서 푸시 알림 발송 (API 호출용)
 */
export async function sendPushNotification(
  userId: string,
  notification: Notification
): Promise<SendPushResult> {
  try {
    const response = await fetch('/api/notifications/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        notification: {
          title: notification.title,
          body: notification.message,
          icon: NOTIFICATION_ICONS[notification.type],
          badge: NOTIFICATION_BADGES[notification.type],
          data: {
            id: notification.id,
            type: notification.type,
            actionUrl: notification.actionUrl,
          },
        },
      }),
    });

    if (!response.ok) {
      return { success: false, error: 'Push send failed' };
    }

    return { success: true };
  } catch (error) {
    console.error('[PushNotification] Send failed:', error);
    return { success: false, error: String(error) };
  }
}

// ============================================
// Helper Functions
// ============================================

/**
 * 서버에 구독 저장
 */
async function saveSubscription(subscription: PushSubscriptionJSON): Promise<void> {
  await fetch('/api/notifications/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscription }),
  });
}

/**
 * 서버에서 구독 제거
 */
async function removeSubscription(endpoint: string): Promise<void> {
  await fetch('/api/notifications/unsubscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint }),
  });
}

/**
 * Base64 URL을 Uint8Array로 변환
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

/**
 * ArrayBuffer를 Base64로 변환
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * 푸시 알림 지원 여부 확인
 */
export function isPushSupported(): boolean {
  return (
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  );
}

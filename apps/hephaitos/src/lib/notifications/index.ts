// ============================================
// Notifications Module Exports
// ============================================

export * from './types'
export { notificationService, default as NotificationService } from './notification-service'
export {
  sendEmailNotification,
  sendBulkEmailNotifications,
  isEmailEnabled,
} from './email-notification'
export {
  requestPushPermission,
  subscribeToPush,
  unsubscribeFromPush,
  getPushSubscriptionStatus,
  showLocalNotification,
  sendPushNotification,
  isPushSupported,
} from './push-notification'

/**
 * Email Notification Service
 * 이메일 알림 발송 서비스 (Resend 연동)
 */

import type { Notification, NotificationType } from './types';

// 알림 타입별 이메일 템플릿 ID
const EMAIL_TEMPLATES: Record<NotificationType, string> = {
  price_alert: 'tmpl_price_alert',
  trade_executed: 'tmpl_trade_executed',
  strategy_signal: 'tmpl_strategy_signal',
  celebrity_trade: 'tmpl_celebrity_trade',
  portfolio_update: 'tmpl_portfolio_update',
  system: 'tmpl_system',
  achievement: 'tmpl_achievement',
  coaching: 'tmpl_coaching',
};

// 알림 타입별 이메일 제목 프리픽스
const EMAIL_SUBJECTS: Record<NotificationType, string> = {
  price_alert: '🔔 가격 알림',
  trade_executed: '✅ 거래 체결',
  strategy_signal: '📊 전략 시그널',
  celebrity_trade: '👤 셀럽 거래 감지',
  portfolio_update: '📈 포트폴리오 업데이트',
  system: 'ℹ️ 시스템 알림',
  achievement: '🏆 달성!',
  coaching: '💡 코칭 메시지',
};

interface EmailRecipient {
  email: string;
  name?: string;
  userId: string;
}

interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * 이메일 알림 발송
 */
export async function sendEmailNotification(
  recipient: EmailRecipient,
  notification: Notification
): Promise<SendEmailResult> {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  if (!RESEND_API_KEY) {
    console.warn('[EmailNotification] Resend API key not configured');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const subject = `${EMAIL_SUBJECTS[notification.type]} - ${notification.title}`;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'HEPHAITOS <notifications@hephaitos.com>',
        to: [recipient.email],
        subject,
        html: generateEmailHtml(notification, recipient.name),
        tags: [
          { name: 'type', value: notification.type },
          { name: 'userId', value: recipient.userId },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[EmailNotification] Send failed:', error);
      return { success: false, error };
    }

    const data = await response.json();
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error('[EmailNotification] Error:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * 이메일 HTML 생성
 */
function generateEmailHtml(notification: Notification, recipientName?: string): string {
  const greeting = recipientName ? `안녕하세요, ${recipientName}님` : '안녕하세요';

  return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${notification.title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0D0D0F;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 12px;
      padding: 32px;
    }
    .logo {
      text-align: center;
      margin-bottom: 32px;
    }
    .logo h1 {
      color: #5E6AD2;
      font-size: 24px;
      font-weight: 700;
      margin: 0;
    }
    .greeting {
      color: #a1a1aa;
      font-size: 14px;
      margin-bottom: 24px;
    }
    .title {
      color: #ffffff;
      font-size: 20px;
      font-weight: 600;
      margin: 0 0 12px 0;
    }
    .message {
      color: #a1a1aa;
      font-size: 16px;
      line-height: 1.6;
      margin: 0 0 24px 0;
    }
    .button {
      display: inline-block;
      background: #5E6AD2;
      color: #ffffff;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 500;
      font-size: 14px;
    }
    .footer {
      text-align: center;
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
    }
    .footer p {
      color: #52525b;
      font-size: 12px;
      margin: 4px 0;
    }
    .footer a {
      color: #5E6AD2;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">
        <h1>HEPHAITOS</h1>
      </div>

      <p class="greeting">${greeting}</p>

      <h2 class="title">${notification.title}</h2>
      <p class="message">${notification.message}</p>

      ${notification.actionUrl ? `
      <a href="${notification.actionUrl}" class="button">
        ${notification.actionLabel || '자세히 보기'}
      </a>
      ` : ''}

      <div class="footer">
        <p>이 이메일은 HEPHAITOS에서 발송되었습니다.</p>
        <p><a href="https://hephaitos.com/settings/notifications">알림 설정 변경</a></p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * 대량 이메일 발송 (캠페인용)
 */
export async function sendBulkEmailNotifications(
  recipients: EmailRecipient[],
  notification: Omit<Notification, 'id' | 'createdAt' | 'read'>
): Promise<{ total: number; success: number; failed: number }> {
  const results = await Promise.allSettled(
    recipients.map((recipient) =>
      sendEmailNotification(recipient, {
        ...notification,
        id: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        read: false,
      })
    )
  );

  const success = results.filter(
    (r) => r.status === 'fulfilled' && r.value.success
  ).length;

  return {
    total: recipients.length,
    success,
    failed: recipients.length - success,
  };
}

/**
 * 이메일 발송 가능 여부 확인
 */
export function isEmailEnabled(): boolean {
  return !!process.env.RESEND_API_KEY;
}

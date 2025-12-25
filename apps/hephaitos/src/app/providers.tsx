'use client'

import { ReactNode } from 'react'
import { ToastProvider } from '@/components/ui/Toast'
import { Toaster } from '@/components/ui/Toaster'
import { I18nProvider } from '@/i18n/client'
import { FeedbackWidget } from '@/components/feedback/FeedbackWidget'
import { AuthProvider } from '@/lib/auth/context'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      <AuthProvider>
        <ToastProvider>
          {children}
          <Toaster />
          <FeedbackWidget />
        </ToastProvider>
      </AuthProvider>
    </I18nProvider>
  )
}

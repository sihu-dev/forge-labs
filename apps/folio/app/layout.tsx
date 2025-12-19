import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import { DevToolsProvider } from '@/components/dev-tools'

export const metadata: Metadata = {
  title: 'FOLIO - 소상공인 AI SaaS',
  description: '소상공인을 위한 AI 기반 비즈니스 관리 플랫폼',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="antialiased min-h-screen">
        <DevToolsProvider>
          {children}
        </DevToolsProvider>
      </body>
    </html>
  )
}

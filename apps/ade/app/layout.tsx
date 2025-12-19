import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import { DevToolsProvider } from '@/components/dev-tools'

export const metadata: Metadata = {
  title: 'ADE - AI Design Engine',
  description: 'AI 기반 디자인 및 코드 생성 엔진',
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

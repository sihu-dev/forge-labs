import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import { DevToolsProvider } from '@/components/dev-tools'

export const metadata: Metadata = {
  title: 'DRYON - K-슬러지 AI 건조/처리',
  description: 'AI 기반 슬러지 건조 및 처리 최적화 플랫폼',
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

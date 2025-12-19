/**
 * HEPHAITOS - Root Layout
 * Next.js App Router 루트 레이아웃
 */

import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: {
    default: 'HEPHAITOS - 트레이딩 AI 플랫폼',
    template: '%s | HEPHAITOS',
  },
  description: '유튜브 트레이딩 교육자를 위한 No-Code AI 전략 빌더 플랫폼',
  keywords: ['트레이딩', 'AI', '백테스트', '전략', '자동매매'],
  authors: [{ name: 'FORGE LABS' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0A0A0A',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-screen bg-gray-1 text-gray-12 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

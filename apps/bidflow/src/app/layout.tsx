/**
 * BIDFLOW - Root Layout
 * Next.js App Router 루트 레이아웃
 */

import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'BIDFLOW - 입찰 자동화 시스템',
    template: '%s | BIDFLOW',
  },
  description: '제조업 SME 맞춤 입찰 관리 및 자동화 플랫폼',
  keywords: ['입찰', '자동화', '제조업', 'SME', 'B2B'],
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
    <html lang="ko">
      <body className="min-h-screen bg-gray-50 antialiased">
        {children}
      </body>
    </html>
  );
}

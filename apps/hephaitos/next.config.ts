import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@forge/types', '@forge/utils', '@forge/core', '@forge/ui'],

  // 개발 모드 표시기 설정 (Next.js 15.5+)
  devIndicators: {
    position: 'bottom-right',
  },

  // 타입 안전 라우팅 - 개발 중 비활성화
  // typedRoutes: true,

  // 환경 변수
  env: {
    APP_NAME: 'HEPHAITOS',
    APP_PORT: '3000',
  },

  // experimental 설정 - srcDir 사용
  experimental: {
    // typedRoutes: true, // 이미 위에서 설정됨
  },
}

export default nextConfig

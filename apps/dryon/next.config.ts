import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@forge/types', '@forge/utils', '@forge/core', '@forge/ui'],

  devIndicators: {
    position: 'bottom-right',
  },

  typedRoutes: true,

  env: {
    APP_NAME: 'DRYON',
    APP_PORT: '3001',
  },
}

export default nextConfig

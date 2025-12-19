import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@forge/types', '@forge/utils', '@forge/core', '@forge/ui'],

  devIndicators: {
    position: 'bottom-right',
  },

  typedRoutes: true,

  env: {
    APP_NAME: 'ADE',
    APP_PORT: '3003',
  },
}

export default nextConfig

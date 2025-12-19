import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@forge/types', '@forge/utils', '@forge/core', '@forge/ui'],

  devIndicators: {
    position: 'bottom-right',
  },

  typedRoutes: true,

  env: {
    APP_NAME: 'FOLIO',
    APP_PORT: '3002',
  },
}

export default nextConfig

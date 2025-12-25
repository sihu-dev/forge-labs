/**
 * Next.js Bundle Analyzer Configuration
 *
 * Usage:
 *   ANALYZE=true pnpm build
 *
 * This will generate a visual report of your bundle size
 */

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Your existing Next.js config
  reactStrictMode: true,
  swcMinify: true,

  // Optimize bundles
  experimental: {
    optimizePackageImports: [
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-tooltip',
      'lucide-react',
    ],
  },

  // Transpile monorepo packages
  transpilePackages: [
    '@forge/types',
    '@forge/utils',
    '@forge/core',
    '@forge/ui',
    '@forge/crm',
    '@forge/integrations',
    '@forge/workflows',
  ],
};

module.exports = withBundleAnalyzer(nextConfig);

/**
 * Marketing Dashboard Page
 *
 * Next.js page that renders the marketing automation dashboard
 */

import { Metadata } from 'next';
import { MarketingDashboard } from '@/components/marketing-dashboard/MarketingDashboard';

export const metadata: Metadata = {
  title: 'Marketing Analytics | BIDFLOW',
  description: 'Comprehensive sales and marketing automation dashboard with real-time monitoring and AI-powered anomaly detection',
};

export default function MarketingDashboardPage() {
  return <MarketingDashboard />;
}

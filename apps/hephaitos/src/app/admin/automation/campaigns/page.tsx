/**
 * Campaign Management - 캠페인 관리 페이지
 * 이메일, LinkedIn 멀티채널 캠페인 관리
 */

import { CampaignManagement } from '@/components/admin/automation/CampaignManagement';

export const dynamic = 'force-dynamic';

export default function CampaignsPage() {
  return <CampaignManagement />;
}

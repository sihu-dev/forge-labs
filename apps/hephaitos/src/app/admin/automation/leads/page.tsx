/**
 * Lead Management - 리드 관리 페이지
 * 리드 파이프라인, 스코어링, 활동 추적
 */

import { LeadManagement } from '@/components/admin/automation/LeadManagement';

export const dynamic = 'force-dynamic';

export default function LeadsPage() {
  return <LeadManagement />;
}

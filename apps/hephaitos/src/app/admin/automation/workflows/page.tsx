/**
 * Workflow Management - n8n 워크플로우 관리 페이지
 * 자동화 워크플로우 모니터링 및 실행
 */

import { WorkflowManagement } from '@/components/admin/automation/WorkflowManagement';

export const dynamic = 'force-dynamic';

export default function WorkflowsPage() {
  return <WorkflowManagement />;
}

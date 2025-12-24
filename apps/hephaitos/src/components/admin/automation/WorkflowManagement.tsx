'use client';

/**
 * WorkflowManagement - n8n 워크플로우 관리
 * 자동화 워크플로우 모니터링 및 실행
 */

import { useState, useEffect } from 'react';

type WorkflowCategory =
  | 'lead_enrichment'
  | 'lead_scoring'
  | 'email_automation'
  | 'data_sync'
  | 'notification'
  | 'cross_sell'
  | 'bidflow_integration'
  | 'hephaitos_integration';

type WorkflowStatus = 'draft' | 'active' | 'paused' | 'error' | 'archived';

interface Workflow {
  id: string;
  n8nWorkflowId: string;
  name: string;
  description?: string;
  category: WorkflowCategory;
  status: WorkflowStatus;
  trigger: string;
  webhookUrl?: string;
  stats: {
    totalRuns: number;
    successfulRuns: number;
    failedRuns: number;
    avgDurationMs: number;
    lastRunAt?: string;
    lastRunStatus?: 'success' | 'failed';
  };
  createdAt: string;
  updatedAt: string;
}

interface WorkflowExecution {
  id: string;
  workflowId: string;
  workflowName: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'cancelled';
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  errorMessage?: string;
}

const categoryConfig: Record<WorkflowCategory, { label: string; icon: string; color: string }> = {
  lead_enrichment: { label: '리드 강화', icon: '🔍', color: 'bg-blue-500/20 text-blue-400' },
  lead_scoring: { label: '리드 스코어링', icon: '📊', color: 'bg-purple-500/20 text-purple-400' },
  email_automation: { label: '이메일 자동화', icon: '📧', color: 'bg-green-500/20 text-green-400' },
  data_sync: { label: '데이터 동기화', icon: '🔄', color: 'bg-cyan-500/20 text-cyan-400' },
  notification: { label: '알림', icon: '🔔', color: 'bg-yellow-500/20 text-yellow-400' },
  cross_sell: { label: '크로스셀', icon: '🔀', color: 'bg-orange-500/20 text-orange-400' },
  bidflow_integration: { label: 'BIDFLOW', icon: '🎯', color: 'bg-red-500/20 text-red-400' },
  hephaitos_integration: { label: 'HEPHAITOS', icon: '🔥', color: 'bg-pink-500/20 text-pink-400' },
};

const statusConfig: Record<WorkflowStatus, { label: string; color: string }> = {
  draft: { label: '초안', color: 'bg-gray-500/20 text-gray-400' },
  active: { label: '활성', color: 'bg-green-500/20 text-green-400' },
  paused: { label: '일시정지', color: 'bg-yellow-500/20 text-yellow-400' },
  error: { label: '오류', color: 'bg-red-500/20 text-red-400' },
  archived: { label: '보관됨', color: 'bg-gray-500/20 text-gray-400' },
};

export function WorkflowManagement() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<'all' | WorkflowCategory>('all');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setIsLoading(true);
      // TODO: n8n API 연결

      // 임시 데모 데이터
      setWorkflows([
        {
          id: '1',
          n8nWorkflowId: 'wf_lead_enrich_001',
          name: '리드 데이터 자동 강화',
          description: 'Persana AI + Apollo.io를 통한 리드 데이터 강화',
          category: 'lead_enrichment',
          status: 'active',
          trigger: 'new_lead',
          stats: {
            totalRuns: 1247,
            successfulRuns: 1234,
            failedRuns: 13,
            avgDurationMs: 3420,
            lastRunAt: new Date(Date.now() - 300000).toISOString(),
            lastRunStatus: 'success',
          },
          createdAt: '2024-11-01',
          updatedAt: '2024-12-20',
        },
        {
          id: '2',
          n8nWorkflowId: 'wf_lead_score_001',
          name: '리드 스코어 자동 계산',
          description: 'AI 기반 리드 스코어링 (구매력, 적합도, 긴급성)',
          category: 'lead_scoring',
          status: 'active',
          trigger: 'lead_enriched',
          stats: {
            totalRuns: 1189,
            successfulRuns: 1185,
            failedRuns: 4,
            avgDurationMs: 1250,
            lastRunAt: new Date(Date.now() - 600000).toISOString(),
            lastRunStatus: 'success',
          },
          createdAt: '2024-11-05',
          updatedAt: '2024-12-18',
        },
        {
          id: '3',
          n8nWorkflowId: 'wf_outreach_001',
          name: '자동 아웃바운드 시퀀스',
          description: 'Apollo.io 시퀀스 자동 등록 및 관리',
          category: 'email_automation',
          status: 'active',
          trigger: 'lead_qualified',
          stats: {
            totalRuns: 456,
            successfulRuns: 445,
            failedRuns: 11,
            avgDurationMs: 2100,
            lastRunAt: new Date(Date.now() - 1800000).toISOString(),
            lastRunStatus: 'success',
          },
          createdAt: '2024-11-10',
          updatedAt: '2024-12-15',
        },
        {
          id: '4',
          n8nWorkflowId: 'wf_crm_sync_001',
          name: 'CRM 양방향 동기화',
          description: 'Attio CRM 실시간 데이터 동기화',
          category: 'data_sync',
          status: 'active',
          trigger: 'schedule',
          webhookUrl: 'https://n8n.forgelabs.io/webhook/crm-sync',
          stats: {
            totalRuns: 8640,
            successfulRuns: 8625,
            failedRuns: 15,
            avgDurationMs: 890,
            lastRunAt: new Date(Date.now() - 60000).toISOString(),
            lastRunStatus: 'success',
          },
          createdAt: '2024-10-15',
          updatedAt: '2024-12-22',
        },
        {
          id: '5',
          n8nWorkflowId: 'wf_cross_sell_001',
          name: 'BIDFLOW↔HEPHAITOS 크로스셀',
          description: 'AI 기반 크로스셀 기회 자동 감지',
          category: 'cross_sell',
          status: 'active',
          trigger: 'lead_stage_change',
          stats: {
            totalRuns: 234,
            successfulRuns: 228,
            failedRuns: 6,
            avgDurationMs: 4500,
            lastRunAt: new Date(Date.now() - 3600000).toISOString(),
            lastRunStatus: 'success',
          },
          createdAt: '2024-12-01',
          updatedAt: '2024-12-20',
        },
        {
          id: '6',
          n8nWorkflowId: 'wf_bidflow_001',
          name: 'BIDFLOW 입찰 알림',
          description: '새로운 입찰 공고 자동 알림 및 매칭',
          category: 'bidflow_integration',
          status: 'paused',
          trigger: 'webhook',
          webhookUrl: 'https://n8n.forgelabs.io/webhook/bidflow-alert',
          stats: {
            totalRuns: 89,
            successfulRuns: 85,
            failedRuns: 4,
            avgDurationMs: 5200,
            lastRunAt: new Date(Date.now() - 86400000).toISOString(),
            lastRunStatus: 'failed',
          },
          createdAt: '2024-12-10',
          updatedAt: '2024-12-19',
        },
      ]);

      setExecutions([
        {
          id: 'exec_001',
          workflowId: '1',
          workflowName: '리드 데이터 자동 강화',
          status: 'success',
          startedAt: new Date(Date.now() - 300000).toISOString(),
          completedAt: new Date(Date.now() - 296580).toISOString(),
          durationMs: 3420,
        },
        {
          id: 'exec_002',
          workflowId: '4',
          workflowName: 'CRM 양방향 동기화',
          status: 'success',
          startedAt: new Date(Date.now() - 60000).toISOString(),
          completedAt: new Date(Date.now() - 59110).toISOString(),
          durationMs: 890,
        },
        {
          id: 'exec_003',
          workflowId: '2',
          workflowName: '리드 스코어 자동 계산',
          status: 'running',
          startedAt: new Date(Date.now() - 5000).toISOString(),
        },
        {
          id: 'exec_004',
          workflowId: '6',
          workflowName: 'BIDFLOW 입찰 알림',
          status: 'failed',
          startedAt: new Date(Date.now() - 86400000).toISOString(),
          completedAt: new Date(Date.now() - 86395000).toISOString(),
          durationMs: 5000,
          errorMessage: 'API rate limit exceeded',
        },
      ]);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const filteredWorkflows = workflows.filter(
    (w) => selectedCategory === 'all' || w.category === selectedCategory
  );

  const activeCount = workflows.filter((w) => w.status === 'active').length;
  const totalRuns = workflows.reduce((sum, w) => sum + w.stats.totalRuns, 0);
  const overallSuccessRate =
    workflows.length > 0
      ? (
          (workflows.reduce((sum, w) => sum + w.stats.successfulRuns, 0) /
            workflows.reduce((sum, w) => sum + w.stats.totalRuns, 0)) *
          100
        ).toFixed(1)
      : '0';

  return (
    <div className="max-w-7xl mx-auto px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">워크플로우 관리</h1>
          <p className="text-white/60 mt-1">n8n 자동화 워크플로우</p>
        </div>
        <div className="flex gap-3">
          <a
            href="https://n8n.forgelabs.io"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-white/80 transition-colors"
          >
            n8n 열기 ↗
          </a>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm text-white transition-colors">
            + 새 워크플로우
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-6">
        <SummaryCard label="활성 워크플로우" value={activeCount} total={workflows.length} />
        <SummaryCard label="총 실행 횟수" value={totalRuns.toLocaleString()} />
        <SummaryCard label="전체 성공률" value={`${overallSuccessRate}%`} highlight />
        <SummaryCard
          label="오류 워크플로우"
          value={workflows.filter((w) => w.status === 'error').length}
          alert={workflows.some((w) => w.status === 'error')}
        />
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <CategoryButton
          label="전체"
          active={selectedCategory === 'all'}
          onClick={() => setSelectedCategory('all')}
          count={workflows.length}
        />
        {Object.entries(categoryConfig).map(([key, config]) => {
          const count = workflows.filter((w) => w.category === key).length;
          if (count === 0) return null;
          return (
            <CategoryButton
              key={key}
              label={`${config.icon} ${config.label}`}
              active={selectedCategory === key}
              onClick={() => setSelectedCategory(key as WorkflowCategory)}
              count={count}
            />
          );
        })}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-3 gap-6">
        {/* Workflows List */}
        <div className="col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-white">워크플로우 목록</h2>
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-white/5 rounded-xl" />
              ))}
            </div>
          ) : (
            filteredWorkflows.map((workflow) => (
              <WorkflowCard key={workflow.id} workflow={workflow} onRefresh={fetchData} />
            ))
          )}
        </div>

        {/* Recent Executions */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">최근 실행</h2>
          <div className="bg-white/3 border border-white/10 rounded-xl overflow-hidden">
            {executions.map((execution, i) => (
              <ExecutionRow key={execution.id} execution={execution} isLast={i === executions.length - 1} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  total,
  highlight,
  alert,
}: {
  label: string;
  value: string | number;
  total?: number;
  highlight?: boolean;
  alert?: boolean;
}) {
  return (
    <div className={`bg-white/3 border rounded-xl p-5 ${alert ? 'border-red-500/50' : 'border-white/10'}`}>
      <span className="text-sm text-white/60">{label}</span>
      <div className={`mt-2 text-3xl font-bold ${highlight ? 'text-green-400' : alert ? 'text-red-400' : 'text-white'}`}>
        {value}
        {total !== undefined && <span className="text-lg text-white/40">/{total}</span>}
      </div>
    </div>
  );
}

function CategoryButton({
  label,
  active,
  onClick,
  count,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
        active
          ? 'bg-blue-600 text-white'
          : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
      }`}
    >
      {label} ({count})
    </button>
  );
}

function WorkflowCard({ workflow, onRefresh }: { workflow: Workflow; onRefresh: () => void }) {
  const successRate =
    workflow.stats.totalRuns > 0
      ? ((workflow.stats.successfulRuns / workflow.stats.totalRuns) * 100).toFixed(1)
      : '0';

  async function handleToggle() {
    // TODO: API 호출
    console.log(`Toggle workflow: ${workflow.id}`);
    onRefresh();
  }

  async function handleRun() {
    // TODO: API 호출
    console.log(`Run workflow: ${workflow.id}`);
    onRefresh();
  }

  return (
    <div className="bg-white/3 border border-white/10 rounded-xl p-6 hover:bg-white/5 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span className={`px-2 py-1 rounded text-xs ${categoryConfig[workflow.category].color}`}>
              {categoryConfig[workflow.category].icon} {categoryConfig[workflow.category].label}
            </span>
            <span className={`px-2 py-1 rounded text-xs ${statusConfig[workflow.status].color}`}>
              {statusConfig[workflow.status].label}
            </span>
          </div>
          <h3 className="mt-3 text-lg font-semibold text-white">{workflow.name}</h3>
          {workflow.description && (
            <p className="mt-1 text-sm text-white/60">{workflow.description}</p>
          )}
          <div className="mt-2 text-xs text-white/40">
            트리거: <span className="text-white/60">{workflow.trigger}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRun}
            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded-lg text-xs text-white transition-colors"
          >
            실행
          </button>
          <button
            onClick={handleToggle}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-white/80 transition-colors"
          >
            {workflow.status === 'active' ? '일시정지' : '활성화'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-4 gap-4">
        <div>
          <div className="text-xs text-white/40">총 실행</div>
          <div className="text-lg font-semibold text-white">{workflow.stats.totalRuns.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-xs text-white/40">성공률</div>
          <div className={`text-lg font-semibold ${parseFloat(successRate) >= 95 ? 'text-green-400' : parseFloat(successRate) >= 80 ? 'text-yellow-400' : 'text-red-400'}`}>
            {successRate}%
          </div>
        </div>
        <div>
          <div className="text-xs text-white/40">평균 소요</div>
          <div className="text-lg font-semibold text-white">{(workflow.stats.avgDurationMs / 1000).toFixed(1)}s</div>
        </div>
        <div>
          <div className="text-xs text-white/40">마지막 실행</div>
          <div className="text-sm text-white">
            {workflow.stats.lastRunAt
              ? formatRelativeTime(new Date(workflow.stats.lastRunAt))
              : '-'}
          </div>
          {workflow.stats.lastRunStatus && (
            <div className={`text-xs ${workflow.stats.lastRunStatus === 'success' ? 'text-green-400' : 'text-red-400'}`}>
              {workflow.stats.lastRunStatus === 'success' ? '성공' : '실패'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ExecutionRow({ execution, isLast }: { execution: WorkflowExecution; isLast: boolean }) {
  const statusColors: Record<string, string> = {
    pending: 'bg-gray-500',
    running: 'bg-blue-500 animate-pulse',
    success: 'bg-green-500',
    failed: 'bg-red-500',
    cancelled: 'bg-yellow-500',
  };

  return (
    <div className={`px-4 py-3 ${!isLast ? 'border-b border-white/5' : ''}`}>
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${statusColors[execution.status]}`} />
        <div className="flex-1 min-w-0">
          <div className="text-sm text-white truncate">{execution.workflowName}</div>
          <div className="text-xs text-white/40">
            {formatRelativeTime(new Date(execution.startedAt))}
            {execution.durationMs && ` · ${(execution.durationMs / 1000).toFixed(1)}s`}
          </div>
          {execution.errorMessage && (
            <div className="text-xs text-red-400 truncate mt-1">{execution.errorMessage}</div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  return `${days}일 전`;
}

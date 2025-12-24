/**
 * 워크플로우 매니저
 *
 * 워크플로우 등록, 실행, 모니터링 및 에러 핸들링
 */

import type {
  IWorkflowDefinition,
  IWorkflowExecution,
  IWorkflowResult,
  IWorkflowEvent,
  TriggerType,
  UUID,
  Timestamp,
} from './types.js';

export interface IWorkflowManagerConfig {
  maxConcurrentExecutions?: number;
  executionTimeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

export class WorkflowManager {
  private workflows: Map<string, IWorkflowDefinition> = new Map();
  private executions: Map<UUID, IWorkflowExecution> = new Map();
  private config: Required<IWorkflowManagerConfig>;

  constructor(config: IWorkflowManagerConfig = {}) {
    this.config = {
      maxConcurrentExecutions: config.maxConcurrentExecutions ?? 10,
      executionTimeout: config.executionTimeout ?? 300000, // 5분
      retryAttempts: config.retryAttempts ?? 3,
      retryDelay: config.retryDelay ?? 5000, // 5초
    };
  }

  /**
   * 워크플로우 등록
   */
  registerWorkflow(workflow: IWorkflowDefinition): void {
    if (this.workflows.has(workflow.id)) {
      throw new Error(`Workflow ${workflow.id} already registered`);
    }

    // 워크플로우 검증
    this.validateWorkflow(workflow);

    this.workflows.set(workflow.id, workflow);
    console.log(`[WorkflowManager] Registered workflow: ${workflow.name} (${workflow.id})`);
  }

  /**
   * 여러 워크플로우 일괄 등록
   */
  registerWorkflows(workflows: IWorkflowDefinition[]): void {
    for (const workflow of workflows) {
      this.registerWorkflow(workflow);
    }
  }

  /**
   * 워크플로우 검증
   */
  private validateWorkflow(workflow: IWorkflowDefinition): void {
    if (!workflow.id || !workflow.name) {
      throw new Error('Workflow must have id and name');
    }

    if (!workflow.nodes || workflow.nodes.length === 0) {
      throw new Error('Workflow must have at least one node');
    }

    // 노드 ID 중복 체크
    const nodeIds = new Set<string>();
    for (const node of workflow.nodes) {
      if (nodeIds.has(node.id)) {
        throw new Error(`Duplicate node id: ${node.id}`);
      }
      nodeIds.add(node.id);
    }

    // 연결 검증
    for (const [sourceNode, connections] of Object.entries(workflow.connections)) {
      if (!nodeIds.has(sourceNode)) {
        throw new Error(`Connection references non-existent node: ${sourceNode}`);
      }

      for (const outputType of Object.values(connections)) {
        for (const connGroup of outputType) {
          for (const conn of connGroup) {
            if (!nodeIds.has(conn.node)) {
              throw new Error(`Connection references non-existent node: ${conn.node}`);
            }
          }
        }
      }
    }
  }

  /**
   * 워크플로우 실행
   */
  async executeWorkflow(
    workflowId: string,
    mode: IWorkflowExecution['mode'],
    inputData?: unknown
  ): Promise<IWorkflowResult> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    if (!workflow.active) {
      throw new Error(`Workflow is not active: ${workflowId}`);
    }

    // 동시 실행 제한 확인
    const runningExecutions = Array.from(this.executions.values()).filter(
      (e) => e.status === 'running'
    );
    if (runningExecutions.length >= this.config.maxConcurrentExecutions) {
      throw new Error('Maximum concurrent executions reached');
    }

    // 실행 컨텍스트 생성
    const executionId = this.generateExecutionId();
    const execution: IWorkflowExecution = {
      id: executionId,
      workflow_id: workflowId,
      mode,
      status: 'running',
      started_at: new Date().toISOString(),
    };

    this.executions.set(executionId, execution);
    this.emitEvent({
      type: 'workflow.started',
      workflow_id: workflowId,
      execution_id: executionId,
      timestamp: execution.started_at,
      payload: { mode, inputData },
    });

    try {
      // 워크플로우 실행 (실제 n8n 엔진 호출)
      const result = await this.runWorkflowEngine(workflow, inputData);

      // 실행 완료
      execution.status = 'success';
      execution.finished_at = new Date().toISOString();
      execution.data = result;

      this.emitEvent({
        type: 'workflow.completed',
        workflow_id: workflowId,
        execution_id: executionId,
        timestamp: execution.finished_at,
        payload: { duration: this.calculateDuration(execution) },
      });

      return {
        execution_id: executionId,
        workflow_id: workflowId,
        status: 'success',
        data: result,
        duration_ms: this.calculateDuration(execution),
        nodes_executed: this.countExecutedNodes(result),
        timestamp: execution.finished_at,
      };
    } catch (error) {
      // 실행 실패
      execution.status = 'error';
      execution.finished_at = new Date().toISOString();
      execution.error = error instanceof Error ? error.message : String(error);

      this.emitEvent({
        type: 'workflow.failed',
        workflow_id: workflowId,
        execution_id: executionId,
        timestamp: execution.finished_at,
        payload: { error: execution.error },
      });

      return {
        execution_id: executionId,
        workflow_id: workflowId,
        status: 'error',
        error: execution.error,
        duration_ms: this.calculateDuration(execution),
        nodes_executed: 0,
        timestamp: execution.finished_at,
      };
    }
  }

  /**
   * 워크플로우 엔진 실행 (스텁)
   */
  private async runWorkflowEngine(
    workflow: IWorkflowDefinition,
    inputData?: unknown
  ): Promise<unknown> {
    // 실제로는 n8n 엔진 호출
    // 여기서는 시뮬레이션
    console.log(`[WorkflowEngine] Executing workflow: ${workflow.name}`);
    console.log(`[WorkflowEngine] Input data:`, inputData);

    // 각 노드 실행 시뮬레이션
    const runData: Record<string, unknown[]> = {};
    for (const node of workflow.nodes) {
      console.log(`[WorkflowEngine] Executing node: ${node.name} (${node.type})`);
      runData[node.name] = [
        {
          startTime: Date.now(),
          executionTime: Math.random() * 1000,
          data: { main: [[{ json: { result: 'success' } }]] },
        },
      ];

      // 노드 이벤트
      this.emitEvent({
        type: 'node.completed',
        workflow_id: workflow.id,
        timestamp: new Date().toISOString(),
        payload: { node: node.name },
      });
    }

    return {
      resultData: {
        runData,
        lastNodeExecuted: workflow.nodes[workflow.nodes.length - 1]?.name,
      },
    };
  }

  /**
   * 워크플로우 재시도
   */
  async retryWorkflow(executionId: UUID): Promise<IWorkflowResult> {
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error(`Execution not found: ${executionId}`);
    }

    if (execution.status !== 'error') {
      throw new Error(`Can only retry failed executions`);
    }

    console.log(`[WorkflowManager] Retrying execution: ${executionId}`);
    return this.executeWorkflow(execution.workflow_id, execution.mode);
  }

  /**
   * 워크플로우 취소
   */
  async cancelWorkflow(executionId: UUID): Promise<void> {
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error(`Execution not found: ${executionId}`);
    }

    if (execution.status !== 'running') {
      throw new Error(`Can only cancel running executions`);
    }

    execution.status = 'canceled';
    execution.finished_at = new Date().toISOString();

    this.emitEvent({
      type: 'workflow.canceled',
      workflow_id: execution.workflow_id,
      execution_id: executionId,
      timestamp: execution.finished_at,
    });

    console.log(`[WorkflowManager] Canceled execution: ${executionId}`);
  }

  /**
   * 실행 이력 조회
   */
  getExecution(executionId: UUID): IWorkflowExecution | undefined {
    return this.executions.get(executionId);
  }

  /**
   * 워크플로우별 실행 이력
   */
  getWorkflowExecutions(workflowId: string, limit = 50): IWorkflowExecution[] {
    return Array.from(this.executions.values())
      .filter((e) => e.workflow_id === workflowId)
      .sort((a, b) => b.started_at.localeCompare(a.started_at))
      .slice(0, limit);
  }

  /**
   * 워크플로우 목록
   */
  listWorkflows(): IWorkflowDefinition[] {
    return Array.from(this.workflows.values());
  }

  /**
   * 활성 워크플로우만
   */
  listActiveWorkflows(): IWorkflowDefinition[] {
    return Array.from(this.workflows.values()).filter((w) => w.active);
  }

  /**
   * 워크플로우 활성화/비활성화
   */
  setWorkflowActive(workflowId: string, active: boolean): void {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    workflow.active = active;
    console.log(`[WorkflowManager] Workflow ${workflowId} ${active ? 'activated' : 'deactivated'}`);
  }

  /**
   * 실행 시간 계산
   */
  private calculateDuration(execution: IWorkflowExecution): number {
    if (!execution.finished_at) {
      return Date.now() - new Date(execution.started_at).getTime();
    }
    return (
      new Date(execution.finished_at).getTime() - new Date(execution.started_at).getTime()
    );
  }

  /**
   * 실행된 노드 수 계산
   */
  private countExecutedNodes(result: unknown): number {
    if (result && typeof result === 'object' && 'resultData' in result) {
      const resultData = result.resultData as { runData?: Record<string, unknown> };
      return Object.keys(resultData.runData || {}).length;
    }
    return 0;
  }

  /**
   * 실행 ID 생성
   */
  private generateExecutionId(): UUID {
    return `exec_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  /**
   * 이벤트 발행
   */
  private emitEvent(event: IWorkflowEvent): void {
    // 실제로는 이벤트 버스에 발행
    console.log(`[Event] ${event.type}`, event.payload);
  }

  /**
   * 통계
   */
  getStats(): {
    total_workflows: number;
    active_workflows: number;
    total_executions: number;
    running_executions: number;
    success_rate: number;
  } {
    const executions = Array.from(this.executions.values());
    const successCount = executions.filter((e) => e.status === 'success').length;
    const completedCount = executions.filter((e) =>
      ['success', 'error', 'canceled'].includes(e.status)
    ).length;

    return {
      total_workflows: this.workflows.size,
      active_workflows: Array.from(this.workflows.values()).filter((w) => w.active).length,
      total_executions: executions.length,
      running_executions: executions.filter((e) => e.status === 'running').length,
      success_rate: completedCount > 0 ? (successCount / completedCount) * 100 : 0,
    };
  }
}

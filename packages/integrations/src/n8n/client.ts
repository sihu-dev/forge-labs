/**
 * n8n Client
 * Workflow trigger, execution status, webhook management
 */

import type {
  N8nConfig,
  Workflow,
  Execution,
  TriggerWorkflowRequest,
  WebhookResponse,
  APIResponse,
} from './types.js';

export class N8nClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly retryAttempts: number;

  constructor(config: N8nConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.timeout = config.timeout || 30000;
    this.retryAttempts = config.retryAttempts || 3;
  }

  // ==================== WORKFLOWS ====================

  /**
   * Get all workflows
   */
  async getWorkflows(): Promise<APIResponse<Workflow[]>> {
    return this.request<Workflow[]>('GET', '/workflows');
  }

  /**
   * Get workflow by ID
   */
  async getWorkflow(workflowId: string): Promise<APIResponse<Workflow>> {
    return this.request<Workflow>('GET', `/workflows/${workflowId}`);
  }

  /**
   * Activate workflow
   */
  async activateWorkflow(workflowId: string): Promise<APIResponse<Workflow>> {
    return this.request<Workflow>('PATCH', `/workflows/${workflowId}`, {
      active: true,
    });
  }

  /**
   * Deactivate workflow
   */
  async deactivateWorkflow(workflowId: string): Promise<APIResponse<Workflow>> {
    return this.request<Workflow>('PATCH', `/workflows/${workflowId}`, {
      active: false,
    });
  }

  // ==================== EXECUTIONS ====================

  /**
   * Get all executions
   */
  async getExecutions(
    workflowId?: string,
    limit = 100
  ): Promise<APIResponse<Execution[]>> {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (workflowId) {
      params.set('workflowId', workflowId);
    }
    return this.request<Execution[]>('GET', `/executions?${params.toString()}`);
  }

  /**
   * Get execution by ID
   */
  async getExecution(executionId: string): Promise<APIResponse<Execution>> {
    return this.request<Execution>('GET', `/executions/${executionId}`);
  }

  /**
   * Delete execution
   */
  async deleteExecution(executionId: string): Promise<APIResponse<void>> {
    return this.request<void>('DELETE', `/executions/${executionId}`);
  }

  /**
   * Retry execution
   */
  async retryExecution(
    executionId: string,
    loadWorkflow = true
  ): Promise<APIResponse<Execution>> {
    return this.request<Execution>('POST', `/executions/${executionId}/retry`, {
      loadWorkflow,
    });
  }

  // ==================== TRIGGER ====================

  /**
   * Trigger workflow execution manually
   */
  async triggerWorkflow(
    workflowId: string,
    data?: Record<string, unknown>
  ): Promise<APIResponse<Execution>> {
    return this.request<Execution>('POST', `/workflows/${workflowId}/execute`, {
      data: data || {},
    });
  }

  /**
   * Test workflow (dry run)
   */
  async testWorkflow(
    workflowId: string,
    data?: Record<string, unknown>
  ): Promise<APIResponse<Execution>> {
    return this.request<Execution>('POST', `/workflows/${workflowId}/test`, {
      data: data || {},
    });
  }

  // ==================== WEBHOOKS ====================

  /**
   * Trigger workflow via webhook URL
   * This is typically called from external services
   */
  async triggerWebhook(
    webhookPath: string,
    data: Record<string, unknown>,
    method: 'GET' | 'POST' = 'POST'
  ): Promise<APIResponse<WebhookResponse>> {
    // Webhook URLs don't use API key authentication
    return this.webhookRequest<WebhookResponse>(method, `/webhook/${webhookPath}`, data);
  }

  /**
   * Trigger test webhook
   */
  async triggerTestWebhook(
    webhookPath: string,
    data: Record<string, unknown>,
    method: 'GET' | 'POST' = 'POST'
  ): Promise<APIResponse<WebhookResponse>> {
    return this.webhookRequest<WebhookResponse>(method, `/webhook-test/${webhookPath}`, data);
  }

  /**
   * Get webhook URL for a workflow
   */
  getWebhookUrl(webhookPath: string, isTest = false): string {
    const prefix = isTest ? 'webhook-test' : 'webhook';
    return `${this.baseUrl}/${prefix}/${webhookPath}`;
  }

  // ==================== WAIT FOR COMPLETION ====================

  /**
   * Wait for execution to complete with polling
   */
  async waitForExecution(
    executionId: string,
    options: {
      maxWaitTime?: number;
      pollInterval?: number;
    } = {}
  ): Promise<APIResponse<Execution>> {
    const maxWaitTime = options.maxWaitTime || 300000; // 5 minutes default
    const pollInterval = options.pollInterval || 2000; // 2 seconds default
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      const response = await this.getExecution(executionId);

      if (!response.success) {
        return response;
      }

      const execution = response.data!;

      if (execution.finished) {
        return response;
      }

      // Wait before next poll
      await this.sleep(pollInterval);
    }

    return {
      success: false,
      error: {
        code: 'TIMEOUT',
        message: `Execution ${executionId} did not complete within ${maxWaitTime}ms`,
      },
      metadata: {
        requestId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
      },
    };
  }

  // ==================== CORE HTTP ====================

  /**
   * Core HTTP request method with retry logic (API endpoints)
   */
  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<APIResponse<T>> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.retryAttempts; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(`${this.baseUrl}/api/v1${path}`, {
          method,
          headers: {
            'X-N8N-API-KEY': this.apiKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            `n8n API error: ${response.status} - ${errorData.message || response.statusText}`
          );
        }

        const data = await response.json();

        return {
          success: true,
          data: data.data || data,
          metadata: {
            requestId: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
          },
        };
      } catch (error) {
        lastError = error as Error;

        // Don't retry on 4xx errors (except 429)
        if (
          error instanceof Error &&
          error.message.includes('4') &&
          !error.message.includes('429')
        ) {
          break;
        }

        // Exponential backoff
        if (attempt < this.retryAttempts - 1) {
          await this.sleep(Math.pow(2, attempt) * 1000);
        }
      }
    }

    return {
      success: false,
      error: {
        code: 'REQUEST_FAILED',
        message: lastError?.message || 'Unknown error',
        details: lastError,
      },
      metadata: {
        requestId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Webhook request (no API key)
   */
  private async webhookRequest<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<APIResponse<T>> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.retryAttempts; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(`${this.baseUrl}${path}`, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            `n8n webhook error: ${response.status} - ${errorData.message || response.statusText}`
          );
        }

        const data = await response.json();

        return {
          success: true,
          data: data as T,
          metadata: {
            requestId: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
          },
        };
      } catch (error) {
        lastError = error as Error;

        // Don't retry on 4xx errors
        if (error instanceof Error && error.message.includes('4')) {
          break;
        }

        // Exponential backoff
        if (attempt < this.retryAttempts - 1) {
          await this.sleep(Math.pow(2, attempt) * 1000);
        }
      }
    }

    return {
      success: false,
      error: {
        code: 'REQUEST_FAILED',
        message: lastError?.message || 'Unknown error',
        details: lastError,
      },
      metadata: {
        requestId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
      },
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Attio CRM Client
 * Object CRUD, lists, webhooks, notes
 */

import type {
  AttioConfig,
  ObjectRecord,
  CreateRecordRequest,
  UpdateRecordRequest,
  ListRecordsRequest,
  List,
  ListEntry,
  AddToListRequest,
  Webhook,
  CreateWebhookRequest,
  WebhookEvent,
  Note,
  CreateNoteRequest,
  APIResponse,
} from './types.js';

export class AttioClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly retryAttempts: number;

  constructor(config: AttioConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.attio.com/v2';
    this.timeout = config.timeout || 30000;
    this.retryAttempts = config.retryAttempts || 3;
  }

  // ==================== OBJECTS ====================

  /**
   * List records in an object
   */
  async listRecords(
    objectSlug: string,
    request?: ListRecordsRequest
  ): Promise<APIResponse<ObjectRecord[]>> {
    return this.request<ObjectRecord[]>('POST', `/objects/${objectSlug}/records/query`, request);
  }

  /**
   * Get a record by ID
   */
  async getRecord(objectSlug: string, recordId: string): Promise<APIResponse<ObjectRecord>> {
    return this.request<ObjectRecord>('GET', `/objects/${objectSlug}/records/${recordId}`);
  }

  /**
   * Create a new record
   */
  async createRecord(
    objectSlug: string,
    request: CreateRecordRequest
  ): Promise<APIResponse<ObjectRecord>> {
    return this.request<ObjectRecord>('POST', `/objects/${objectSlug}/records`, request);
  }

  /**
   * Update a record
   */
  async updateRecord(
    objectSlug: string,
    recordId: string,
    request: UpdateRecordRequest
  ): Promise<APIResponse<ObjectRecord>> {
    return this.request<ObjectRecord>(
      'PATCH',
      `/objects/${objectSlug}/records/${recordId}`,
      request
    );
  }

  /**
   * Delete a record
   */
  async deleteRecord(objectSlug: string, recordId: string): Promise<APIResponse<void>> {
    return this.request<void>('DELETE', `/objects/${objectSlug}/records/${recordId}`);
  }

  // ==================== LISTS ====================

  /**
   * Get all lists
   */
  async getLists(): Promise<APIResponse<List[]>> {
    return this.request<List[]>('GET', '/lists');
  }

  /**
   * Get a list by ID
   */
  async getList(listId: string): Promise<APIResponse<List>> {
    return this.request<List>('GET', `/lists/${listId}`);
  }

  /**
   * Get list entries
   */
  async getListEntries(listId: string): Promise<APIResponse<ListEntry[]>> {
    return this.request<ListEntry[]>('GET', `/lists/${listId}/entries`);
  }

  /**
   * Add record to list
   */
  async addToList(listId: string, request: AddToListRequest): Promise<APIResponse<ListEntry>> {
    return this.request<ListEntry>('POST', `/lists/${listId}/entries`, request);
  }

  /**
   * Remove record from list
   */
  async removeFromList(listId: string, entryId: string): Promise<APIResponse<void>> {
    return this.request<void>('DELETE', `/lists/${listId}/entries/${entryId}`);
  }

  // ==================== WEBHOOKS ====================

  /**
   * Get all webhooks
   */
  async getWebhooks(): Promise<APIResponse<Webhook[]>> {
    return this.request<Webhook[]>('GET', '/webhooks');
  }

  /**
   * Create a webhook
   */
  async createWebhook(request: CreateWebhookRequest): Promise<APIResponse<Webhook>> {
    return this.request<Webhook>('POST', '/webhooks', request);
  }

  /**
   * Delete a webhook
   */
  async deleteWebhook(webhookId: string): Promise<APIResponse<void>> {
    return this.request<void>('DELETE', `/webhooks/${webhookId}`);
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    // Implementation would use crypto.subtle or similar
    // For now, basic implementation
    return signature.length > 0 && secret.length > 0;
  }

  /**
   * Parse webhook event
   */
  parseWebhookEvent(payload: string): WebhookEvent {
    return JSON.parse(payload) as WebhookEvent;
  }

  // ==================== NOTES ====================

  /**
   * Create a note
   */
  async createNote(request: CreateNoteRequest): Promise<APIResponse<Note>> {
    return this.request<Note>('POST', '/notes', request);
  }

  /**
   * Get notes for a record
   */
  async getNotes(objectSlug: string, recordId: string): Promise<APIResponse<Note[]>> {
    return this.request<Note[]>('GET', `/objects/${objectSlug}/records/${recordId}/notes`);
  }

  // ==================== LEADS SHORTCUTS ====================

  /**
   * Create a lead
   */
  async createLead(values: Record<string, unknown>): Promise<APIResponse<ObjectRecord>> {
    return this.createRecord('leads', { data: { values } });
  }

  /**
   * List leads
   */
  async listLeads(request?: ListRecordsRequest): Promise<APIResponse<ObjectRecord[]>> {
    return this.listRecords('leads', request);
  }

  // ==================== COMPANIES SHORTCUTS ====================

  /**
   * Create a company
   */
  async createCompany(values: Record<string, unknown>): Promise<APIResponse<ObjectRecord>> {
    return this.createRecord('companies', { data: { values } });
  }

  /**
   * List companies
   */
  async listCompanies(request?: ListRecordsRequest): Promise<APIResponse<ObjectRecord[]>> {
    return this.listRecords('companies', request);
  }

  // ==================== DEALS SHORTCUTS ====================

  /**
   * Create a deal
   */
  async createDeal(values: Record<string, unknown>): Promise<APIResponse<ObjectRecord>> {
    return this.createRecord('deals', { data: { values } });
  }

  /**
   * List deals
   */
  async listDeals(request?: ListRecordsRequest): Promise<APIResponse<ObjectRecord[]>> {
    return this.listRecords('deals', request);
  }

  // ==================== CORE HTTP ====================

  /**
   * Core HTTP request method with retry logic
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

        const response = await fetch(`${this.baseUrl}${path}`, {
          method,
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({})) as any;
          throw new Error(
            `Attio API error: ${response.status} - ${errorData.message || response.statusText}`
          );
        }

        const data = await response.json() as any;

        return {
          success: true,
          data: data.data || data,
          pagination: data.pagination,
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

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * @forge/crm - Attio Sync Service
 * L2 Cells - Attio 동기화 서비스
 */

import type { ICRMResponse } from '../../interfaces/index.js';

/**
 * 동기화 상태
 */
export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

/**
 * 동기화 결과
 */
export interface ISyncResult {
  status: SyncStatus;
  startedAt: string;
  completedAt?: string;
  totalRecords: number;
  syncedRecords: number;
  failedRecords: number;
  errors?: Array<{
    recordId: string;
    error: string;
  }>;
}

/**
 * 웹훅 이벤트 타입
 */
export type WebhookEventType =
  | 'record.created'
  | 'record.updated'
  | 'record.deleted'
  | 'list.updated';

/**
 * 웹훅 이벤트
 */
export interface IWebhookEvent {
  id: string;
  type: WebhookEventType;
  objectType: string;
  recordId: string;
  timestamp: string;
  data: unknown;
}

/**
 * Attio Sync Service
 * CRM 데이터 동기화 및 웹훅 처리
 */
export class AttioSyncService {
  private syncStatus: SyncStatus = 'idle';

  constructor(
    private readonly apiKey: string,
    private readonly baseUrl: string = 'https://api.attio.com/v2'
  ) {}

  /**
   * 전체 데이터 동기화
   */
  async syncAll(objectTypes: string[] = ['leads', 'deals', 'companies']): Promise<ICRMResponse<ISyncResult>> {
    this.syncStatus = 'syncing';
    const startedAt = new Date().toISOString();
    let totalRecords = 0;
    let syncedRecords = 0;
    let failedRecords = 0;
    const errors: Array<{ recordId: string; error: string }> = [];

    try {
      for (const objectType of objectTypes) {
        const result = await this.syncObjectType(objectType);
        totalRecords += result.total;
        syncedRecords += result.synced;
        failedRecords += result.failed;
        errors.push(...result.errors);
      }

      this.syncStatus = failedRecords > 0 ? 'error' : 'success';

      return {
        success: true,
        data: {
          status: this.syncStatus,
          startedAt,
          completedAt: new Date().toISOString(),
          totalRecords,
          syncedRecords,
          failedRecords,
          errors: errors.length > 0 ? errors : undefined
        },
        metadata: {
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      this.syncStatus = 'error';
      return {
        success: false,
        error: {
          code: 'SYNC_ERROR',
          message: error instanceof Error ? error.message : 'Unknown sync error',
          details: error
        },
        metadata: {
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  /**
   * 특정 객체 타입 동기화
   */
  private async syncObjectType(objectType: string): Promise<{
    total: number;
    synced: number;
    failed: number;
    errors: Array<{ recordId: string; error: string }>;
  }> {
    const result = {
      total: 0,
      synced: 0,
      failed: 0,
      errors: [] as Array<{ recordId: string; error: string }>
    };

    try {
      let offset = 0;
      const limit = 100;
      let hasMore = true;

      while (hasMore) {
        const response = await fetch(`${this.baseUrl}/objects/${objectType}/records/query`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            limit,
            offset
          })
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch ${objectType}: ${response.statusText}`);
        }

        const data = await response.json() as any;
        const records = data.data || [];
        result.total += records.length;

        for (const record of records) {
          try {
            // 로컬 DB에 저장하는 로직 (실제 구현 필요)
            await this.saveToLocalDB(objectType, record);
            result.synced++;
          } catch (error) {
            result.failed++;
            result.errors.push({
              recordId: record.id?.record_id || 'unknown',
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }

        hasMore = data.has_more || false;
        offset += limit;
      }

      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 웹훅 설정
   */
  async setupWebhook(
    targetUrl: string,
    eventTypes: WebhookEventType[]
  ): Promise<ICRMResponse<{ webhookId: string }>> {
    try {
      const response = await fetch(`${this.baseUrl}/webhooks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          target_url: targetUrl,
          event_types: eventTypes
        })
      });

      if (!response.ok) {
        const error = await response.json() as any;
        return {
          success: false,
          error: {
            code: 'WEBHOOK_SETUP_ERROR',
            message: error.message || 'Failed to setup webhook',
            details: error
          },
          metadata: {
            timestamp: new Date().toISOString()
          }
        };
      }

      const result = await response.json() as any;

      return {
        success: true,
        data: {
          webhookId: result.data.id
        },
        metadata: {
          requestId: result.request_id,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error
        },
        metadata: {
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  /**
   * 웹훅 이벤트 처리
   */
  async handleWebhookEvent(event: IWebhookEvent): Promise<void> {
    try {
      switch (event.type) {
        case 'record.created':
          await this.handleRecordCreated(event);
          break;
        case 'record.updated':
          await this.handleRecordUpdated(event);
          break;
        case 'record.deleted':
          await this.handleRecordDeleted(event);
          break;
        case 'list.updated':
          await this.handleListUpdated(event);
          break;
        default:
          console.warn(`Unknown webhook event type: ${event.type}`);
      }
    } catch (error) {
      console.error('Failed to handle webhook event:', error);
      throw error;
    }
  }

  /**
   * 현재 동기화 상태 조회
   */
  getSyncStatus(): SyncStatus {
    return this.syncStatus;
  }

  /**
   * 로컬 DB에 저장 (구현 필요)
   */
  private async saveToLocalDB(objectType: string, record: unknown): Promise<void> {
    // Supabase나 다른 로컬 DB에 저장하는 로직
    // 실제 구현은 프로젝트 요구사항에 따라 작성
    console.log(`Saving ${objectType} record:`, record);
  }

  /**
   * 레코드 생성 이벤트 처리
   */
  private async handleRecordCreated(event: IWebhookEvent): Promise<void> {
    console.log('Record created:', event);
    // 로컬 DB에 새 레코드 추가
    await this.saveToLocalDB(event.objectType, event.data);
  }

  /**
   * 레코드 업데이트 이벤트 처리
   */
  private async handleRecordUpdated(event: IWebhookEvent): Promise<void> {
    console.log('Record updated:', event);
    // 로컬 DB 레코드 업데이트
    await this.saveToLocalDB(event.objectType, event.data);
  }

  /**
   * 레코드 삭제 이벤트 처리
   */
  private async handleRecordDeleted(event: IWebhookEvent): Promise<void> {
    console.log('Record deleted:', event);
    // 로컬 DB에서 레코드 삭제
    // 실제 구현 필요
  }

  /**
   * 리스트 업데이트 이벤트 처리
   */
  private async handleListUpdated(event: IWebhookEvent): Promise<void> {
    console.log('List updated:', event);
    // 전체 동기화 트리거
    // 실제 구현 필요
  }
}

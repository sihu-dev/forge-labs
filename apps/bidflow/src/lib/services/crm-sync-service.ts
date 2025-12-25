/**
 * CRM Sync Service
 * Supabase leads → Attio CRM 동기화
 */

import { CRMFactory, type Lead, type Deal } from '@forge/crm';
import { createClient } from '@/lib/supabase/server';

export interface CRMSyncConfig {
  provider: 'attio' | 'hubspot';
  apiKey: string;
  autoSync?: boolean;
  syncInterval?: number; // minutes
}

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  skipped: number;
  errors: Array<{
    leadId: string;
    error: string;
  }>;
}

/**
 * CRM 동기화 서비스
 * BIDFLOW의 리드를 외부 CRM으로 자동 동기화
 */
export class CRMSyncService {
  private crm: Awaited<ReturnType<typeof CRMFactory.create>>;
  private config: CRMSyncConfig;

  constructor(config: CRMSyncConfig) {
    this.config = config;
    this.crm = CRMFactory.create({
      provider: config.provider,
      apiKey: config.apiKey,
    });
  }

  /**
   * 초기화
   * CRM 연결 설정
   */
  async initialize(): Promise<void> {
    await this.crm.initialize();
  }

  /**
   * 단일 리드 동기화
   */
  async syncLead(leadData: {
    id: string;
    email: string;
    name?: string;
    title?: string;
    phone?: string;
    organization?: string;
    score?: number;
    source?: string;
  }): Promise<{ success: boolean; crmId?: string; error?: string }> {
    try {
      // CRM Lead 형식으로 변환
      const lead: Lead = {
        email: leadData.email,
        firstName: leadData.name?.split(' ')[0] || '',
        lastName: leadData.name?.split(' ').slice(1).join(' ') || '',
        title: leadData.title,
        phone: leadData.phone,
        company: leadData.organization,
        source: leadData.source || 'bidflow',
        score: leadData.score,
        customFields: {
          bidflow_id: leadData.id,
          bidflow_score: leadData.score?.toString() || '0',
        },
      };

      // CRM에 생성
      const result = await this.crm.leads.create(lead);

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to create lead in CRM');
      }

      return {
        success: true,
        crmId: result.data?.id,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 배치 동기화
   * 여러 리드를 한 번에 CRM으로 전송
   */
  async syncBatch(
    leadIds: string[],
    userId: string
  ): Promise<SyncResult> {
    const supabase = await createClient();
    const result: SyncResult = {
      success: true,
      synced: 0,
      failed: 0,
      skipped: 0,
      errors: [],
    };

    // Supabase에서 리드 조회
    const { data: leads, error } = await supabase
      .from('leads')
      .select('*')
      .in('id', leadIds)
      .eq('user_id', userId);

    if (error || !leads) {
      result.success = false;
      result.errors.push({
        leadId: 'batch',
        error: 'Failed to fetch leads from database',
      });
      return result;
    }

    // 각 리드 동기화
    for (const lead of leads) {
      // 이미 동기화된 리드는 스킵
      if (lead.crm_synced_at) {
        result.skipped++;
        continue;
      }

      const syncResult = await this.syncLead({
        id: lead.id,
        email: lead.email,
        name: lead.name,
        title: lead.title,
        phone: lead.phone,
        organization: lead.organization,
        score: lead.score,
        source: lead.source,
      });

      if (syncResult.success) {
        result.synced++;

        // Supabase 업데이트 (CRM ID 저장)
        await supabase
          .from('leads')
          .update({
            crm_id: syncResult.crmId,
            crm_synced_at: new Date().toISOString(),
          })
          .eq('id', lead.id);
      } else {
        result.failed++;
        result.errors.push({
          leadId: lead.id,
          error: syncResult.error || 'Unknown error',
        });
      }
    }

    result.success = result.failed === 0;
    return result;
  }

  /**
   * 딜 생성
   * 고득점 리드를 자동으로 딜 파이프라인에 추가
   */
  async createDeal(params: {
    leadId: string;
    title: string;
    value: number;
    stage?: string;
    priority?: 'low' | 'medium' | 'high';
  }): Promise<{ success: boolean; dealId?: string; error?: string }> {
    try {
      const supabase = await createClient();

      // 리드 정보 조회
      const { data: lead } = await supabase
        .from('leads')
        .select('*')
        .eq('id', params.leadId)
        .single();

      if (!lead) {
        throw new Error('Lead not found');
      }

      // CRM Deal 생성
      const deal: Deal = {
        title: params.title,
        contactEmail: lead.email,
        contactName: lead.name,
        company: lead.organization,
        stage: params.stage || 'prospect',
        value: params.value,
        currency: 'KRW',
        priority: params.priority || 'medium',
        source: 'bidflow',
        customFields: {
          bidflow_lead_id: params.leadId,
          bidflow_score: lead.score?.toString() || '0',
        },
      };

      const result = await this.crm.deals.create(deal);

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to create deal');
      }

      // Supabase 업데이트
      await supabase
        .from('leads')
        .update({
          deal_created: true,
          deal_id: result.data?.id,
          deal_created_at: new Date().toISOString(),
        })
        .eq('id', params.leadId);

      return {
        success: true,
        dealId: result.data?.id,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 자동 동기화
   * 최근 업데이트된 리드를 주기적으로 CRM에 동기화
   */
  async autoSync(userId: string, since?: Date): Promise<SyncResult> {
    const supabase = await createClient();

    // 미동기화 리드 조회
    let query = supabase
      .from('leads')
      .select('id')
      .eq('user_id', userId)
      .is('crm_synced_at', null);

    if (since) {
      query = query.gte('created_at', since.toISOString());
    }

    const { data: unsyncedLeads, error } = await query;

    if (error || !unsyncedLeads) {
      return {
        success: false,
        synced: 0,
        failed: 0,
        skipped: 0,
        errors: [{ leadId: 'auto-sync', error: 'Failed to fetch unsynced leads' }],
      };
    }

    const leadIds = unsyncedLeads.map((l) => l.id);
    return this.syncBatch(leadIds, userId);
  }

  /**
   * 동기화 상태 확인
   */
  async getSyncStatus(userId: string): Promise<{
    totalLeads: number;
    syncedLeads: number;
    unsyncedLeads: number;
    lastSyncAt?: string;
  }> {
    const supabase = await createClient();

    const { data: leads } = await supabase
      .from('leads')
      .select('id, crm_synced_at')
      .eq('user_id', userId);

    if (!leads) {
      return {
        totalLeads: 0,
        syncedLeads: 0,
        unsyncedLeads: 0,
      };
    }

    const synced = leads.filter((l) => l.crm_synced_at);
    const lastSync = synced.reduce(
      (latest, l) =>
        !latest || (l.crm_synced_at && l.crm_synced_at > latest) ? l.crm_synced_at : latest,
      null as string | null
    );

    return {
      totalLeads: leads.length,
      syncedLeads: synced.length,
      unsyncedLeads: leads.length - synced.length,
      lastSyncAt: lastSync || undefined,
    };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      // CRM 연결 상태 확인
      const result = await this.crm.leads.list({ page: 1, pageSize: 1 });
      return result.success;
    } catch (error) {
      return false;
    }
  }
}

/**
 * CRM Sync Service Factory
 */
export function createCRMSyncService(
  provider: 'attio' | 'hubspot' = 'attio',
  apiKey?: string
): CRMSyncService {
  const key = apiKey || process.env[`${provider.toUpperCase()}_API_KEY`];

  if (!key) {
    throw new Error(`${provider.toUpperCase()}_API_KEY is required`);
  }

  return new CRMSyncService({
    provider,
    apiKey: key,
    autoSync: true,
  });
}

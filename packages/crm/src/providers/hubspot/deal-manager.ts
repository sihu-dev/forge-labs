/**
 * @forge/crm - HubSpot Deal Manager
 * L2 Cells - HubSpot 딜 관리 구현 (Deals API)
 */

import type {
  IDealManager,
  IDeal,
  ICreateDealData,
  IUpdateDealData,
  IDealFilter,
  IDealStats,
  ICRMResponse,
  IPaginatedResponse,
  IPaginationParams,
  DealStage,
  DealPriority
} from '../../interfaces/index.js';

/**
 * HubSpot API Response Types
 */
interface HubSpotDeal {
  id: string;
  properties: {
    dealname?: string;
    description?: string;
    amount?: string;
    dealstage?: string;
    pipeline?: string;
    closedate?: string;
    hs_priority?: string;
    hs_deal_stage_probability?: string;
    createdate?: string;
    hs_lastmodifieddate?: string;
    notes_last_contacted?: string;
    hs_tags?: string;
    [key: string]: string | undefined;
  };
  createdAt: string;
  updatedAt: string;
  archived: boolean;
}

interface HubSpotSearchResponse {
  results: HubSpotDeal[];
  paging?: {
    next?: {
      after: string;
    };
  };
  total: number;
}

/**
 * HubSpot Deal Manager 구현
 */
export class HubSpotDealManager implements IDealManager {
  constructor(
    private readonly apiKey: string,
    private readonly baseUrl: string = 'https://api.hubapi.com'
  ) {}

  private getHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    };
  }

  async create(data: ICreateDealData): Promise<ICRMResponse<IDeal>> {
    try {
      const properties = this.toHubSpotProperties(data);

      const response = await fetch(`${this.baseUrl}/crm/v3/objects/deals`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ properties })
      });

      if (!response.ok) {
        const error = await response.json() as { message?: string };
        return {
          success: false,
          error: {
            code: 'HUBSPOT_API_ERROR',
            message: error.message || 'Failed to create deal',
            details: error
          },
          metadata: { timestamp: new Date().toISOString() }
        };
      }

      const result = await response.json() as HubSpotDeal;
      return {
        success: true,
        data: this.transformHubSpotDeal(result),
        metadata: { timestamp: new Date().toISOString() }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error
        },
        metadata: { timestamp: new Date().toISOString() }
      };
    }
  }

  async getById(id: string): Promise<ICRMResponse<IDeal>> {
    try {
      const properties = 'dealname,description,amount,dealstage,pipeline,closedate,hs_priority,hs_deal_stage_probability,createdate,hs_lastmodifieddate,hs_tags';
      const response = await fetch(
        `${this.baseUrl}/crm/v3/objects/deals/${id}?properties=${properties}`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        const error = await response.json() as { message?: string };
        return {
          success: false,
          error: {
            code: response.status === 404 ? 'NOT_FOUND' : 'HUBSPOT_API_ERROR',
            message: error.message || 'Failed to get deal',
            details: error
          },
          metadata: { timestamp: new Date().toISOString() }
        };
      }

      const result = await response.json() as HubSpotDeal;
      return {
        success: true,
        data: this.transformHubSpotDeal(result),
        metadata: { timestamp: new Date().toISOString() }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error
        },
        metadata: { timestamp: new Date().toISOString() }
      };
    }
  }

  async update(id: string, data: IUpdateDealData): Promise<ICRMResponse<IDeal>> {
    try {
      const properties = this.toHubSpotProperties(data);

      const response = await fetch(`${this.baseUrl}/crm/v3/objects/deals/${id}`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify({ properties })
      });

      if (!response.ok) {
        const error = await response.json() as { message?: string };
        return {
          success: false,
          error: {
            code: 'HUBSPOT_API_ERROR',
            message: error.message || 'Failed to update deal',
            details: error
          },
          metadata: { timestamp: new Date().toISOString() }
        };
      }

      const result = await response.json() as HubSpotDeal;
      return {
        success: true,
        data: this.transformHubSpotDeal(result),
        metadata: { timestamp: new Date().toISOString() }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error
        },
        metadata: { timestamp: new Date().toISOString() }
      };
    }
  }

  async delete(id: string): Promise<ICRMResponse<void>> {
    try {
      const response = await fetch(`${this.baseUrl}/crm/v3/objects/deals/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({})) as { message?: string };
        return {
          success: false,
          error: {
            code: 'HUBSPOT_API_ERROR',
            message: error.message || 'Failed to delete deal',
            details: error
          },
          metadata: { timestamp: new Date().toISOString() }
        };
      }

      return {
        success: true,
        metadata: { timestamp: new Date().toISOString() }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error
        },
        metadata: { timestamp: new Date().toISOString() }
      };
    }
  }

  async list(
    filter?: IDealFilter,
    pagination?: IPaginationParams
  ): Promise<ICRMResponse<IPaginatedResponse<IDeal>>> {
    try {
      const filterGroups = this.buildHubSpotFilter(filter);
      const limit = pagination?.limit || 50;

      const response = await fetch(`${this.baseUrl}/crm/v3/objects/deals/search`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          filterGroups: filterGroups.length > 0 ? filterGroups : undefined,
          properties: ['dealname', 'description', 'amount', 'dealstage', 'pipeline', 'closedate', 'hs_priority', 'hs_deal_stage_probability', 'createdate', 'hs_lastmodifieddate', 'hs_tags'],
          limit,
          after: pagination?.cursor
        })
      });

      if (!response.ok) {
        const error = await response.json() as { message?: string };
        return {
          success: false,
          error: {
            code: 'HUBSPOT_API_ERROR',
            message: error.message || 'Failed to list deals',
            details: error
          },
          metadata: { timestamp: new Date().toISOString() }
        };
      }

      const result = await response.json() as HubSpotSearchResponse;
      const deals = result.results.map(deal => this.transformHubSpotDeal(deal));

      return {
        success: true,
        data: {
          items: deals,
          total: result.total,
          hasMore: !!result.paging?.next,
          nextCursor: result.paging?.next?.after
        },
        metadata: { timestamp: new Date().toISOString() }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error
        },
        metadata: { timestamp: new Date().toISOString() }
      };
    }
  }

  async updateStage(id: string, stage: DealStage): Promise<ICRMResponse<IDeal>> {
    return this.update(id, { stage });
  }

  async updatePriority(id: string, priority: DealPriority): Promise<ICRMResponse<IDeal>> {
    return this.update(id, { priority });
  }

  async addTags(id: string, tags: string[]): Promise<ICRMResponse<IDeal>> {
    const existing = await this.getById(id);
    if (!existing.success || !existing.data) {
      return existing as ICRMResponse<IDeal>;
    }

    const currentTags = existing.data.tags || [];
    const newTags = [...new Set([...currentTags, ...tags])];
    return this.update(id, { tags: newTags });
  }

  async removeTags(id: string, tags: string[]): Promise<ICRMResponse<IDeal>> {
    const existing = await this.getById(id);
    if (!existing.success || !existing.data) {
      return existing as ICRMResponse<IDeal>;
    }

    const currentTags = existing.data.tags || [];
    const newTags = currentTags.filter(tag => !tags.includes(tag));
    return this.update(id, { tags: newTags });
  }

  async getStats(filter?: IDealFilter): Promise<ICRMResponse<IDealStats>> {
    try {
      const listResult = await this.list(filter, { limit: 100 });
      if (!listResult.success || !listResult.data) {
        return {
          success: false,
          error: listResult.error,
          metadata: { timestamp: new Date().toISOString() }
        };
      }

      const deals = listResult.data.items;
      const byStage: Record<DealStage, { count: number; value: number }> = {
        lead: { count: 0, value: 0 },
        qualification: { count: 0, value: 0 },
        proposal: { count: 0, value: 0 },
        negotiation: { count: 0, value: 0 },
        closed_won: { count: 0, value: 0 },
        closed_lost: { count: 0, value: 0 }
      };

      const byPriority: Record<DealPriority, { count: number; value: number }> = {
        low: { count: 0, value: 0 },
        medium: { count: 0, value: 0 },
        high: { count: 0, value: 0 },
        critical: { count: 0, value: 0 }
      };

      let totalValue = 0;
      let totalDaysToClose = 0;
      let closedCount = 0;

      for (const deal of deals) {
        byStage[deal.stage].count++;
        byStage[deal.stage].value += deal.value;
        byPriority[deal.priority].count++;
        byPriority[deal.priority].value += deal.value;
        totalValue += deal.value;

        if (deal.stage === 'closed_won' || deal.stage === 'closed_lost') {
          closedCount++;
          if (deal.actualCloseDate && deal.createdAt) {
            const days = Math.floor((new Date(deal.actualCloseDate).getTime() - new Date(deal.createdAt).getTime()) / (1000 * 60 * 60 * 24));
            totalDaysToClose += days;
          }
        }
      }

      const stats: IDealStats = {
        totalDeals: deals.length,
        totalValue,
        avgValue: deals.length > 0 ? totalValue / deals.length : 0,
        winRate: closedCount > 0 ? (byStage.closed_won.count / closedCount) * 100 : 0,
        avgDaysToClose: closedCount > 0 ? totalDaysToClose / closedCount : 0,
        byStage,
        byPriority
      };

      return {
        success: true,
        data: stats,
        metadata: { timestamp: new Date().toISOString() }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error
        },
        metadata: { timestamp: new Date().toISOString() }
      };
    }
  }

  async markAsWon(id: string, actualCloseDate?: string): Promise<ICRMResponse<IDeal>> {
    return this.update(id, {
      stage: 'closed_won',
      actualCloseDate: actualCloseDate || new Date().toISOString()
    });
  }

  async markAsLost(id: string, reason?: string): Promise<ICRMResponse<IDeal>> {
    return this.update(id, {
      stage: 'closed_lost',
      customFields: reason ? { closed_lost_reason: reason } : undefined
    });
  }

  /**
   * HubSpot Deal을 IDeal로 변환
   */
  private transformHubSpotDeal(deal: HubSpotDeal): IDeal {
    const props = deal.properties;
    return {
      id: deal.id,
      title: props.dealname || '',
      description: props.description,
      value: props.amount ? parseFloat(props.amount) : 0,
      currency: 'USD',
      stage: this.mapHubSpotStage(props.dealstage),
      probability: props.hs_deal_stage_probability ? parseInt(props.hs_deal_stage_probability, 10) : undefined,
      priority: this.mapHubSpotPriority(props.hs_priority),
      expectedCloseDate: props.closedate,
      tags: props.hs_tags?.split(';').filter(Boolean) || [],
      customFields: {},
      createdAt: deal.createdAt || props.createdate || new Date().toISOString(),
      updatedAt: deal.updatedAt || props.hs_lastmodifieddate || new Date().toISOString()
    };
  }

  /**
   * IDeal 데이터를 HubSpot properties로 변환
   */
  private toHubSpotProperties(data: ICreateDealData | IUpdateDealData): Record<string, string> {
    const properties: Record<string, string> = {};

    if ('title' in data && data.title) properties.dealname = data.title;
    if ('description' in data && data.description) properties.description = data.description;
    if ('value' in data && data.value !== undefined) properties.amount = String(data.value);
    if ('stage' in data && data.stage) properties.dealstage = this.mapStageToHubSpot(data.stage);
    if ('priority' in data && data.priority) properties.hs_priority = this.mapPriorityToHubSpot(data.priority);
    if ('expectedCloseDate' in data && data.expectedCloseDate) properties.closedate = data.expectedCloseDate;
    if ('actualCloseDate' in data && data.actualCloseDate) properties.closedate = data.actualCloseDate;
    if (data.tags) properties.hs_tags = data.tags.join(';');

    if (data.customFields) {
      for (const [key, value] of Object.entries(data.customFields)) {
        if (value !== undefined && value !== null) {
          properties[key] = String(value);
        }
      }
    }

    return properties;
  }

  /**
   * HubSpot 스테이지를 DealStage로 매핑
   */
  private mapHubSpotStage(hubSpotStage?: string): DealStage {
    const stageMap: Record<string, DealStage> = {
      'appointmentscheduled': 'lead',
      'qualifiedtobuy': 'qualification',
      'presentationscheduled': 'proposal',
      'decisionmakerboughtin': 'negotiation',
      'contractsent': 'negotiation',
      'closedwon': 'closed_won',
      'closedlost': 'closed_lost'
    };
    return stageMap[hubSpotStage?.toLowerCase() || ''] || 'lead';
  }

  /**
   * DealStage를 HubSpot 스테이지로 매핑
   */
  private mapStageToHubSpot(stage: DealStage): string {
    const stageMap: Record<DealStage, string> = {
      'lead': 'appointmentscheduled',
      'qualification': 'qualifiedtobuy',
      'proposal': 'presentationscheduled',
      'negotiation': 'decisionmakerboughtin',
      'closed_won': 'closedwon',
      'closed_lost': 'closedlost'
    };
    return stageMap[stage] || 'appointmentscheduled';
  }

  /**
   * HubSpot 우선순위를 DealPriority로 매핑
   */
  private mapHubSpotPriority(hubSpotPriority?: string): DealPriority {
    const priorityMap: Record<string, DealPriority> = {
      'low': 'low',
      'medium': 'medium',
      'high': 'high',
      'critical': 'critical'
    };
    return priorityMap[hubSpotPriority?.toLowerCase() || ''] || 'medium';
  }

  /**
   * DealPriority를 HubSpot 우선순위로 매핑
   */
  private mapPriorityToHubSpot(priority: DealPriority): string {
    const priorityMap: Record<DealPriority, string> = {
      'low': 'low',
      'medium': 'medium',
      'high': 'high',
      'critical': 'critical'
    };
    return priorityMap[priority] || 'medium';
  }

  /**
   * IDealFilter를 HubSpot filterGroups로 변환
   */
  private buildHubSpotFilter(filter?: IDealFilter): Array<{ filters: Array<{ propertyName: string; operator: string; value: string }> }> {
    if (!filter) return [];

    const filters: Array<{ propertyName: string; operator: string; value: string }> = [];

    if (filter.stage?.length) {
      filter.stage.forEach(stage => {
        filters.push({
          propertyName: 'dealstage',
          operator: 'EQ',
          value: this.mapStageToHubSpot(stage)
        });
      });
    }

    if (filter.priority?.length) {
      filter.priority.forEach(priority => {
        filters.push({
          propertyName: 'hs_priority',
          operator: 'EQ',
          value: this.mapPriorityToHubSpot(priority)
        });
      });
    }

    if (filter.valueMin !== undefined) {
      filters.push({
        propertyName: 'amount',
        operator: 'GTE',
        value: String(filter.valueMin)
      });
    }

    if (filter.valueMax !== undefined) {
      filters.push({
        propertyName: 'amount',
        operator: 'LTE',
        value: String(filter.valueMax)
      });
    }

    if (filter.expectedCloseAfter) {
      filters.push({
        propertyName: 'closedate',
        operator: 'GTE',
        value: filter.expectedCloseAfter
      });
    }

    if (filter.expectedCloseBefore) {
      filters.push({
        propertyName: 'closedate',
        operator: 'LTE',
        value: filter.expectedCloseBefore
      });
    }

    if (filter.search) {
      return [
        { filters: [{ propertyName: 'dealname', operator: 'CONTAINS_TOKEN', value: filter.search }] }
      ];
    }

    return filters.length > 0 ? [{ filters }] : [];
  }
}

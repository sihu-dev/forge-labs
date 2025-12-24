/**
 * @forge/crm - Attio Deal Manager
 * L2 Cells - Attio 딜 관리 구현
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
 * Attio Deal Manager 구현
 */
export class AttioDealManager implements IDealManager {
  constructor(
    private readonly apiKey: string,
    private readonly baseUrl: string = 'https://api.attio.com/v2'
  ) {}

  async create(data: ICreateDealData): Promise<ICRMResponse<IDeal>> {
    try {
      const response = await fetch(`${this.baseUrl}/objects/deals/records`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data: {
            values: {
              title: data.title,
              description: data.description,
              stage: data.stage,
              priority: data.priority || 'medium',
              value: data.value,
              currency: data.currency || 'KRW',
              probability: data.probability,
              expected_close_date: data.expectedCloseDate,
              contact_id: data.contactId,
              company_id: data.companyId,
              owner_id: data.ownerId,
              tags: data.tags,
              ...data.customFields
            }
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          error: {
            code: 'ATTIO_API_ERROR',
            message: error.message || 'Failed to create deal',
            details: error
          },
          metadata: {
            timestamp: new Date().toISOString()
          }
        };
      }

      const result = await response.json();
      const deal = this.transformAttioDeal(result.data);

      return {
        success: true,
        data: deal,
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

  async getById(id: string): Promise<ICRMResponse<IDeal>> {
    try {
      const response = await fetch(`${this.baseUrl}/objects/deals/records/${id}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          error: {
            code: 'ATTIO_API_ERROR',
            message: error.message || 'Failed to get deal',
            details: error
          },
          metadata: {
            timestamp: new Date().toISOString()
          }
        };
      }

      const result = await response.json();
      const deal = this.transformAttioDeal(result.data);

      return {
        success: true,
        data: deal,
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

  async update(id: string, data: IUpdateDealData): Promise<ICRMResponse<IDeal>> {
    try {
      const response = await fetch(`${this.baseUrl}/objects/deals/records/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data: {
            values: {
              title: data.title,
              description: data.description,
              stage: data.stage,
              priority: data.priority,
              value: data.value,
              currency: data.currency,
              probability: data.probability,
              expected_close_date: data.expectedCloseDate,
              actual_close_date: data.actualCloseDate,
              contact_id: data.contactId,
              company_id: data.companyId,
              owner_id: data.ownerId,
              tags: data.tags,
              ...data.customFields
            }
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          error: {
            code: 'ATTIO_API_ERROR',
            message: error.message || 'Failed to update deal',
            details: error
          },
          metadata: {
            timestamp: new Date().toISOString()
          }
        };
      }

      const result = await response.json();
      const deal = this.transformAttioDeal(result.data);

      return {
        success: true,
        data: deal,
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

  async delete(id: string): Promise<ICRMResponse<void>> {
    try {
      const response = await fetch(`${this.baseUrl}/objects/deals/records/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          error: {
            code: 'ATTIO_API_ERROR',
            message: error.message || 'Failed to delete deal',
            details: error
          },
          metadata: {
            timestamp: new Date().toISOString()
          }
        };
      }

      return {
        success: true,
        metadata: {
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

  async list(
    filter?: IDealFilter,
    pagination?: IPaginationParams
  ): Promise<ICRMResponse<IPaginatedResponse<IDeal>>> {
    try {
      const queryFilter = this.buildAttioFilter(filter);
      const response = await fetch(`${this.baseUrl}/objects/deals/records/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filter: queryFilter,
          limit: pagination?.limit || 50,
          offset: pagination?.offset || 0
        })
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          error: {
            code: 'ATTIO_API_ERROR',
            message: error.message || 'Failed to list deals',
            details: error
          },
          metadata: {
            timestamp: new Date().toISOString()
          }
        };
      }

      const result = await response.json();
      const deals = result.data.map((item: unknown) => this.transformAttioDeal(item));

      return {
        success: true,
        data: {
          items: deals,
          total: result.total || deals.length,
          hasMore: result.has_more || false,
          nextCursor: result.next_cursor
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

  async updateStage(id: string, stage: DealStage): Promise<ICRMResponse<IDeal>> {
    return this.update(id, { stage });
  }

  async updatePriority(id: string, priority: DealPriority): Promise<ICRMResponse<IDeal>> {
    return this.update(id, { priority });
  }

  async addTags(id: string, tags: string[]): Promise<ICRMResponse<IDeal>> {
    const existing = await this.getById(id);
    if (!existing.success || !existing.data) {
      return existing;
    }

    const currentTags = existing.data.tags || [];
    const newTags = [...new Set([...currentTags, ...tags])];
    return this.update(id, { tags: newTags });
  }

  async removeTags(id: string, tags: string[]): Promise<ICRMResponse<IDeal>> {
    const existing = await this.getById(id);
    if (!existing.success || !existing.data) {
      return existing;
    }

    const currentTags = existing.data.tags || [];
    const newTags = currentTags.filter(tag => !tags.includes(tag));
    return this.update(id, { tags: newTags });
  }

  async getStats(filter?: IDealFilter): Promise<ICRMResponse<IDealStats>> {
    // 모든 딜 조회 후 통계 계산
    const listResult = await this.list(filter, { limit: 1000 });
    if (!listResult.success || !listResult.data) {
      return listResult as ICRMResponse<IDealStats>;
    }

    const deals = listResult.data.items;
    const stats = this.calculateStats(deals);

    return {
      success: true,
      data: stats,
      metadata: {
        timestamp: new Date().toISOString()
      }
    };
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
      actualCloseDate: new Date().toISOString(),
      customFields: reason ? { lost_reason: reason } : undefined
    });
  }

  /**
   * Attio 응답을 IDeal로 변환
   */
  private transformAttioDeal(attioData: any): IDeal {
    const values = attioData.values || {};
    return {
      id: attioData.id.record_id,
      title: values.title || '',
      description: values.description,
      stage: values.stage || 'lead',
      priority: values.priority || 'medium',
      value: values.value || 0,
      currency: values.currency || 'KRW',
      probability: values.probability,
      expectedCloseDate: values.expected_close_date,
      actualCloseDate: values.actual_close_date,
      contactId: values.contact_id,
      companyId: values.company_id,
      ownerId: values.owner_id,
      tags: values.tags || [],
      customFields: values.custom_fields || {},
      createdAt: attioData.created_at,
      updatedAt: attioData.updated_at
    };
  }

  /**
   * IDealFilter를 Attio 필터 형식으로 변환
   */
  private buildAttioFilter(filter?: IDealFilter): unknown {
    if (!filter) return {};

    const attioFilter: any = {};

    if (filter.stage?.length) {
      attioFilter.stage = { $in: filter.stage };
    }

    if (filter.priority?.length) {
      attioFilter.priority = { $in: filter.priority };
    }

    if (filter.tags?.length) {
      attioFilter.tags = { $all: filter.tags };
    }

    if (filter.valueMin !== undefined || filter.valueMax !== undefined) {
      attioFilter.value = {};
      if (filter.valueMin !== undefined) {
        attioFilter.value.$gte = filter.valueMin;
      }
      if (filter.valueMax !== undefined) {
        attioFilter.value.$lte = filter.valueMax;
      }
    }

    if (filter.probabilityMin !== undefined || filter.probabilityMax !== undefined) {
      attioFilter.probability = {};
      if (filter.probabilityMin !== undefined) {
        attioFilter.probability.$gte = filter.probabilityMin;
      }
      if (filter.probabilityMax !== undefined) {
        attioFilter.probability.$lte = filter.probabilityMax;
      }
    }

    if (filter.expectedCloseAfter) {
      attioFilter.expected_close_date = { $gte: filter.expectedCloseAfter };
    }

    if (filter.expectedCloseBefore) {
      if (attioFilter.expected_close_date) {
        attioFilter.expected_close_date.$lte = filter.expectedCloseBefore;
      } else {
        attioFilter.expected_close_date = { $lte: filter.expectedCloseBefore };
      }
    }

    if (filter.ownerId) {
      attioFilter.owner_id = { $eq: filter.ownerId };
    }

    if (filter.companyId) {
      attioFilter.company_id = { $eq: filter.companyId };
    }

    if (filter.search) {
      attioFilter.$or = [
        { title: { $contains: filter.search } },
        { description: { $contains: filter.search } }
      ];
    }

    return attioFilter;
  }

  /**
   * 딜 통계 계산
   */
  private calculateStats(deals: IDeal[]): IDealStats {
    const stats: IDealStats = {
      totalDeals: deals.length,
      totalValue: 0,
      avgValue: 0,
      winRate: 0,
      avgDaysToClose: 0,
      byStage: {
        lead: { count: 0, value: 0 },
        qualification: { count: 0, value: 0 },
        proposal: { count: 0, value: 0 },
        negotiation: { count: 0, value: 0 },
        closed_won: { count: 0, value: 0 },
        closed_lost: { count: 0, value: 0 }
      },
      byPriority: {
        low: { count: 0, value: 0 },
        medium: { count: 0, value: 0 },
        high: { count: 0, value: 0 },
        critical: { count: 0, value: 0 }
      }
    };

    let totalDaysToClose = 0;
    let closedDealsCount = 0;
    let wonDealsCount = 0;

    for (const deal of deals) {
      stats.totalValue += deal.value;
      stats.byStage[deal.stage].count++;
      stats.byStage[deal.stage].value += deal.value;
      stats.byPriority[deal.priority].count++;
      stats.byPriority[deal.priority].value += deal.value;

      if (deal.stage === 'closed_won' || deal.stage === 'closed_lost') {
        closedDealsCount++;
        if (deal.stage === 'closed_won') {
          wonDealsCount++;
        }

        if (deal.actualCloseDate) {
          const created = new Date(deal.createdAt);
          const closed = new Date(deal.actualCloseDate);
          const days = Math.floor((closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
          totalDaysToClose += days;
        }
      }
    }

    stats.avgValue = deals.length > 0 ? stats.totalValue / deals.length : 0;
    stats.winRate = closedDealsCount > 0 ? (wonDealsCount / closedDealsCount) * 100 : 0;
    stats.avgDaysToClose = closedDealsCount > 0 ? totalDaysToClose / closedDealsCount : 0;

    return stats;
  }
}

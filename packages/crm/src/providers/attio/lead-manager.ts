/**
 * @forge/crm - Attio Lead Manager
 * L2 Cells - Attio 리드 관리 구현
 */

import type {
  ILeadManager,
  ILead,
  ICreateLeadData,
  IUpdateLeadData,
  ILeadFilter,
  ICRMResponse,
  IPaginatedResponse,
  IPaginationParams,
  LeadStatus
} from '../../interfaces/index.js';

/**
 * Attio Lead Manager 구현
 */
export class AttioLeadManager implements ILeadManager {
  constructor(
    private readonly apiKey: string,
    private readonly baseUrl: string = 'https://api.attio.com/v2'
  ) {}

  async create(data: ICreateLeadData): Promise<ICRMResponse<ILead>> {
    try {
      // Attio API 호출
      const response = await fetch(`${this.baseUrl}/objects/leads/records`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data: {
            values: {
              email_addresses: [{ email_address: data.email }],
              first_name: data.firstName,
              last_name: data.lastName,
              phone_numbers: data.phone ? [{ phone_number: data.phone }] : undefined,
              company: data.company,
              job_title: data.jobTitle,
              source: data.source,
              tags: data.tags,
              ...data.customFields
            }
          }
        })
      });

      if (!response.ok) {
        const error = await response.json() as any;
        return {
          success: false,
          error: {
            code: 'ATTIO_API_ERROR',
            message: error.message || 'Failed to create lead',
            details: error
          },
          metadata: {
            timestamp: new Date().toISOString()
          }
        };
      }

      const result = await response.json() as any;
      const lead = this.transformAttioLead(result.data);

      return {
        success: true,
        data: lead,
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

  async getById(id: string): Promise<ICRMResponse<ILead>> {
    try {
      const response = await fetch(`${this.baseUrl}/objects/leads/records/${id}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        const error = await response.json() as any;
        return {
          success: false,
          error: {
            code: 'ATTIO_API_ERROR',
            message: error.message || 'Failed to get lead',
            details: error
          },
          metadata: {
            timestamp: new Date().toISOString()
          }
        };
      }

      const result = await response.json() as any;
      const lead = this.transformAttioLead(result.data);

      return {
        success: true,
        data: lead,
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

  async getByEmail(email: string): Promise<ICRMResponse<ILead | null>> {
    try {
      const response = await fetch(`${this.baseUrl}/objects/leads/records/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filter: {
            email_addresses: {
              $any: {
                email_address: { $eq: email }
              }
            }
          }
        })
      });

      if (!response.ok) {
        const error = await response.json() as any;
        return {
          success: false,
          error: {
            code: 'ATTIO_API_ERROR',
            message: error.message || 'Failed to query lead',
            details: error
          },
          metadata: {
            timestamp: new Date().toISOString()
          }
        };
      }

      const result = await response.json() as any;
      const lead = result.data.length > 0 ? this.transformAttioLead(result.data[0]) : null;

      return {
        success: true,
        data: lead,
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

  async update(id: string, data: IUpdateLeadData): Promise<ICRMResponse<ILead>> {
    try {
      const response = await fetch(`${this.baseUrl}/objects/leads/records/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data: {
            values: {
              email_addresses: data.email ? [{ email_address: data.email }] : undefined,
              first_name: data.firstName,
              last_name: data.lastName,
              phone_numbers: data.phone ? [{ phone_number: data.phone }] : undefined,
              company: data.company,
              job_title: data.jobTitle,
              status: data.status,
              source: data.source,
              score: data.score,
              tags: data.tags,
              ...data.customFields
            }
          }
        })
      });

      if (!response.ok) {
        const error = await response.json() as any;
        return {
          success: false,
          error: {
            code: 'ATTIO_API_ERROR',
            message: error.message || 'Failed to update lead',
            details: error
          },
          metadata: {
            timestamp: new Date().toISOString()
          }
        };
      }

      const result = await response.json() as any;
      const lead = this.transformAttioLead(result.data);

      return {
        success: true,
        data: lead,
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
      const response = await fetch(`${this.baseUrl}/objects/leads/records/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        const error = await response.json() as any;
        return {
          success: false,
          error: {
            code: 'ATTIO_API_ERROR',
            message: error.message || 'Failed to delete lead',
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
    filter?: ILeadFilter,
    pagination?: IPaginationParams
  ): Promise<ICRMResponse<IPaginatedResponse<ILead>>> {
    try {
      const queryFilter = this.buildAttioFilter(filter);
      const response = await fetch(`${this.baseUrl}/objects/leads/records/query`, {
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
        const error = await response.json() as any;
        return {
          success: false,
          error: {
            code: 'ATTIO_API_ERROR',
            message: error.message || 'Failed to list leads',
            details: error
          },
          metadata: {
            timestamp: new Date().toISOString()
          }
        };
      }

      const result = await response.json() as any;
      const leads = result.data.map((item: unknown) => this.transformAttioLead(item));

      return {
        success: true,
        data: {
          items: leads,
          total: result.total || leads.length,
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

  async updateStatus(id: string, status: LeadStatus): Promise<ICRMResponse<ILead>> {
    return this.update(id, { status });
  }

  async updateScore(id: string, score: number): Promise<ICRMResponse<ILead>> {
    return this.update(id, { score });
  }

  async addTags(id: string, tags: string[]): Promise<ICRMResponse<ILead>> {
    // 기존 태그 조회 후 병합
    const existing = await this.getById(id);
    if (!existing.success || !existing.data) {
      return existing;
    }

    const currentTags = existing.data.tags || [];
    const newTags = [...new Set([...currentTags, ...tags])];
    return this.update(id, { tags: newTags });
  }

  async removeTags(id: string, tags: string[]): Promise<ICRMResponse<ILead>> {
    const existing = await this.getById(id);
    if (!existing.success || !existing.data) {
      return existing;
    }

    const currentTags = existing.data.tags || [];
    const newTags = currentTags.filter(tag => !tags.includes(tag));
    return this.update(id, { tags: newTags });
  }

  async convertToDeal(
    id: string,
    dealData?: Record<string, unknown>
  ): Promise<ICRMResponse<{ leadId: string; dealId: string }>> {
    // Attio 딜 생성 API 호출
    // 실제 구현은 Attio API 문서에 따라 조정 필요
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
              lead_id: id,
              ...dealData
            }
          }
        })
      });

      if (!response.ok) {
        const error = await response.json() as any;
        return {
          success: false,
          error: {
            code: 'ATTIO_API_ERROR',
            message: error.message || 'Failed to convert lead to deal',
            details: error
          },
          metadata: {
            timestamp: new Date().toISOString()
          }
        };
      }

      const result = await response.json() as any;

      // 리드 상태를 'converted'로 업데이트
      await this.updateStatus(id, 'converted');

      return {
        success: true,
        data: {
          leadId: id,
          dealId: result.data.id.record_id
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
   * Attio 응답을 ILead로 변환
   */
  private transformAttioLead(attioData: any): ILead {
    const values = attioData.values || {};
    return {
      id: attioData.id.record_id,
      email: values.email_addresses?.[0]?.email_address || '',
      firstName: values.first_name,
      lastName: values.last_name,
      fullName: values.name,
      phone: values.phone_numbers?.[0]?.phone_number,
      company: values.company,
      jobTitle: values.job_title,
      status: values.status || 'new',
      source: values.source || 'other',
      score: values.score,
      tags: values.tags || [],
      customFields: values.custom_fields || {},
      createdAt: attioData.created_at,
      updatedAt: attioData.updated_at,
      convertedAt: values.converted_at,
      lastContactedAt: values.last_contacted_at
    };
  }

  /**
   * ILeadFilter를 Attio 필터 형식으로 변환
   */
  private buildAttioFilter(filter?: ILeadFilter): unknown {
    if (!filter) return {};

    const attioFilter: any = {};

    if (filter.status?.length) {
      attioFilter.status = { $in: filter.status };
    }

    if (filter.source?.length) {
      attioFilter.source = { $in: filter.source };
    }

    if (filter.tags?.length) {
      attioFilter.tags = { $all: filter.tags };
    }

    if (filter.scoreMin !== undefined || filter.scoreMax !== undefined) {
      attioFilter.score = {};
      if (filter.scoreMin !== undefined) {
        attioFilter.score.$gte = filter.scoreMin;
      }
      if (filter.scoreMax !== undefined) {
        attioFilter.score.$lte = filter.scoreMax;
      }
    }

    if (filter.createdAfter) {
      attioFilter.created_at = { $gte: filter.createdAfter };
    }

    if (filter.createdBefore) {
      if (attioFilter.created_at) {
        attioFilter.created_at.$lte = filter.createdBefore;
      } else {
        attioFilter.created_at = { $lte: filter.createdBefore };
      }
    }

    if (filter.search) {
      attioFilter.$or = [
        { email_addresses: { $any: { email_address: { $contains: filter.search } } } },
        { first_name: { $contains: filter.search } },
        { last_name: { $contains: filter.search } },
        { company: { $contains: filter.search } }
      ];
    }

    return attioFilter;
  }
}

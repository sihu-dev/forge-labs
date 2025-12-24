/**
 * @forge/crm - Attio Company Manager
 * L2 Cells - Attio 회사 관리 구현
 */

import type {
  ICompanyManager,
  ICompany,
  ICreateCompanyData,
  IUpdateCompanyData,
  ICompanyFilter,
  ICRMResponse,
  IPaginatedResponse,
  IPaginationParams,
  CompanyStatus
} from '../../interfaces/index.js';

/**
 * Attio Company Manager 구현
 */
export class AttioCompanyManager implements ICompanyManager {
  constructor(
    private readonly apiKey: string,
    private readonly baseUrl: string = 'https://api.attio.com/v2'
  ) {}

  async create(data: ICreateCompanyData): Promise<ICRMResponse<ICompany>> {
    try {
      const response = await fetch(`${this.baseUrl}/objects/companies/records`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data: {
            values: {
              name: data.name,
              domain: data.domain,
              description: data.description,
              industry: data.industry,
              size: data.size,
              website: data.website,
              phone: data.phone,
              address: data.address,
              employee_count: data.employeeCount,
              annual_revenue: data.annualRevenue,
              currency: data.currency || 'KRW',
              founded_year: data.foundedYear,
              tags: data.tags,
              social_profiles: data.socialProfiles,
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
            message: error.message || 'Failed to create company',
            details: error
          },
          metadata: {
            timestamp: new Date().toISOString()
          }
        };
      }

      const result = await response.json();
      const company = this.transformAttioCompany(result.data);

      return {
        success: true,
        data: company,
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

  async getById(id: string): Promise<ICRMResponse<ICompany>> {
    try {
      const response = await fetch(`${this.baseUrl}/objects/companies/records/${id}`, {
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
            message: error.message || 'Failed to get company',
            details: error
          },
          metadata: {
            timestamp: new Date().toISOString()
          }
        };
      }

      const result = await response.json();
      const company = this.transformAttioCompany(result.data);

      return {
        success: true,
        data: company,
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

  async getByDomain(domain: string): Promise<ICRMResponse<ICompany | null>> {
    try {
      const response = await fetch(`${this.baseUrl}/objects/companies/records/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filter: {
            domain: { $eq: domain }
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          error: {
            code: 'ATTIO_API_ERROR',
            message: error.message || 'Failed to query company',
            details: error
          },
          metadata: {
            timestamp: new Date().toISOString()
          }
        };
      }

      const result = await response.json();
      const company = result.data.length > 0 ? this.transformAttioCompany(result.data[0]) : null;

      return {
        success: true,
        data: company,
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

  async update(id: string, data: IUpdateCompanyData): Promise<ICRMResponse<ICompany>> {
    try {
      const response = await fetch(`${this.baseUrl}/objects/companies/records/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data: {
            values: {
              name: data.name,
              domain: data.domain,
              description: data.description,
              industry: data.industry,
              size: data.size,
              status: data.status,
              website: data.website,
              phone: data.phone,
              address: data.address,
              employee_count: data.employeeCount,
              annual_revenue: data.annualRevenue,
              currency: data.currency,
              founded_year: data.foundedYear,
              tags: data.tags,
              social_profiles: data.socialProfiles,
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
            message: error.message || 'Failed to update company',
            details: error
          },
          metadata: {
            timestamp: new Date().toISOString()
          }
        };
      }

      const result = await response.json();
      const company = this.transformAttioCompany(result.data);

      return {
        success: true,
        data: company,
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
      const response = await fetch(`${this.baseUrl}/objects/companies/records/${id}`, {
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
            message: error.message || 'Failed to delete company',
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
    filter?: ICompanyFilter,
    pagination?: IPaginationParams
  ): Promise<ICRMResponse<IPaginatedResponse<ICompany>>> {
    try {
      const queryFilter = this.buildAttioFilter(filter);
      const response = await fetch(`${this.baseUrl}/objects/companies/records/query`, {
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
            message: error.message || 'Failed to list companies',
            details: error
          },
          metadata: {
            timestamp: new Date().toISOString()
          }
        };
      }

      const result = await response.json();
      const companies = result.data.map((item: unknown) => this.transformAttioCompany(item));

      return {
        success: true,
        data: {
          items: companies,
          total: result.total || companies.length,
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

  async updateStatus(id: string, status: CompanyStatus): Promise<ICRMResponse<ICompany>> {
    return this.update(id, { status });
  }

  async addTags(id: string, tags: string[]): Promise<ICRMResponse<ICompany>> {
    const existing = await this.getById(id);
    if (!existing.success || !existing.data) {
      return existing;
    }

    const currentTags = existing.data.tags || [];
    const newTags = [...new Set([...currentTags, ...tags])];
    return this.update(id, { tags: newTags });
  }

  async removeTags(id: string, tags: string[]): Promise<ICRMResponse<ICompany>> {
    const existing = await this.getById(id);
    if (!existing.success || !existing.data) {
      return existing;
    }

    const currentTags = existing.data.tags || [];
    const newTags = currentTags.filter(tag => !tags.includes(tag));
    return this.update(id, { tags: newTags });
  }

  async getContacts(id: string): Promise<ICRMResponse<unknown[]>> {
    try {
      const response = await fetch(`${this.baseUrl}/objects/companies/records/${id}/entries/people`, {
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
            message: error.message || 'Failed to get company contacts',
            details: error
          },
          metadata: {
            timestamp: new Date().toISOString()
          }
        };
      }

      const result = await response.json();

      return {
        success: true,
        data: result.data || [],
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

  async getDeals(id: string): Promise<ICRMResponse<unknown[]>> {
    try {
      const response = await fetch(`${this.baseUrl}/objects/companies/records/${id}/entries/deals`, {
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
            message: error.message || 'Failed to get company deals',
            details: error
          },
          metadata: {
            timestamp: new Date().toISOString()
          }
        };
      }

      const result = await response.json();

      return {
        success: true,
        data: result.data || [],
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

  async enrichByDomain(domain: string): Promise<ICRMResponse<Partial<ICompany>>> {
    // Attio의 enrichment API 사용 (실제 구현은 Attio API 문서 참조)
    try {
      const response = await fetch(`${this.baseUrl}/enrichment/companies`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ domain })
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          error: {
            code: 'ATTIO_API_ERROR',
            message: error.message || 'Failed to enrich company',
            details: error
          },
          metadata: {
            timestamp: new Date().toISOString()
          }
        };
      }

      const result = await response.json();

      return {
        success: true,
        data: {
          name: result.name,
          domain: result.domain,
          description: result.description,
          website: result.website,
          employeeCount: result.employee_count,
          annualRevenue: result.annual_revenue,
          foundedYear: result.founded_year,
          socialProfiles: result.social_profiles
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
   * Attio 응답을 ICompany로 변환
   */
  private transformAttioCompany(attioData: any): ICompany {
    const values = attioData.values || {};
    return {
      id: attioData.id.record_id,
      name: values.name || '',
      domain: values.domain,
      description: values.description,
      industry: values.industry,
      size: values.size,
      status: values.status || 'active',
      website: values.website,
      phone: values.phone,
      address: values.address,
      employeeCount: values.employee_count,
      annualRevenue: values.annual_revenue,
      currency: values.currency || 'KRW',
      foundedYear: values.founded_year,
      tags: values.tags || [],
      socialProfiles: values.social_profiles || {},
      customFields: values.custom_fields || {},
      createdAt: attioData.created_at,
      updatedAt: attioData.updated_at
    };
  }

  /**
   * ICompanyFilter를 Attio 필터 형식으로 변환
   */
  private buildAttioFilter(filter?: ICompanyFilter): unknown {
    if (!filter) return {};

    const attioFilter: any = {};

    if (filter.status?.length) {
      attioFilter.status = { $in: filter.status };
    }

    if (filter.industry?.length) {
      attioFilter.industry = { $in: filter.industry };
    }

    if (filter.size?.length) {
      attioFilter.size = { $in: filter.size };
    }

    if (filter.tags?.length) {
      attioFilter.tags = { $all: filter.tags };
    }

    if (filter.employeeCountMin !== undefined || filter.employeeCountMax !== undefined) {
      attioFilter.employee_count = {};
      if (filter.employeeCountMin !== undefined) {
        attioFilter.employee_count.$gte = filter.employeeCountMin;
      }
      if (filter.employeeCountMax !== undefined) {
        attioFilter.employee_count.$lte = filter.employeeCountMax;
      }
    }

    if (filter.revenueMin !== undefined || filter.revenueMax !== undefined) {
      attioFilter.annual_revenue = {};
      if (filter.revenueMin !== undefined) {
        attioFilter.annual_revenue.$gte = filter.revenueMin;
      }
      if (filter.revenueMax !== undefined) {
        attioFilter.annual_revenue.$lte = filter.revenueMax;
      }
    }

    if (filter.country) {
      attioFilter['address.country'] = { $eq: filter.country };
    }

    if (filter.search) {
      attioFilter.$or = [
        { name: { $contains: filter.search } },
        { domain: { $contains: filter.search } }
      ];
    }

    return attioFilter;
  }
}

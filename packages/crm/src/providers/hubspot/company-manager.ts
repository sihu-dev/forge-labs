/**
 * @forge/crm - HubSpot Company Manager
 * L2 Cells - HubSpot 회사 관리 구현 (Companies API)
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
  CompanyStatus,
  CompanyIndustry
} from '../../interfaces/index.js';

/**
 * HubSpot API Response Types
 */
interface HubSpotCompany {
  id: string;
  properties: {
    name?: string;
    domain?: string;
    industry?: string;
    numberofemployees?: string;
    annualrevenue?: string;
    city?: string;
    state?: string;
    country?: string;
    phone?: string;
    website?: string;
    description?: string;
    hs_lead_status?: string;
    createdate?: string;
    hs_lastmodifieddate?: string;
    hs_tags?: string;
    [key: string]: string | undefined;
  };
  createdAt: string;
  updatedAt: string;
  archived: boolean;
}

interface HubSpotSearchResponse {
  results: HubSpotCompany[];
  paging?: {
    next?: {
      after: string;
    };
  };
  total: number;
}

/**
 * HubSpot Company Manager 구현
 */
export class HubSpotCompanyManager implements ICompanyManager {
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

  async create(data: ICreateCompanyData): Promise<ICRMResponse<ICompany>> {
    try {
      const properties = this.toHubSpotProperties(data);

      const response = await fetch(`${this.baseUrl}/crm/v3/objects/companies`, {
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
            message: error.message || 'Failed to create company',
            details: error
          },
          metadata: { timestamp: new Date().toISOString() }
        };
      }

      const result = await response.json() as HubSpotCompany;
      return {
        success: true,
        data: this.transformHubSpotCompany(result),
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

  async getById(id: string): Promise<ICRMResponse<ICompany>> {
    try {
      const properties = 'name,domain,industry,numberofemployees,annualrevenue,city,state,country,phone,website,description,hs_lead_status,createdate,hs_lastmodifieddate,hs_tags';
      const response = await fetch(
        `${this.baseUrl}/crm/v3/objects/companies/${id}?properties=${properties}`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        const error = await response.json() as { message?: string };
        return {
          success: false,
          error: {
            code: response.status === 404 ? 'NOT_FOUND' : 'HUBSPOT_API_ERROR',
            message: error.message || 'Failed to get company',
            details: error
          },
          metadata: { timestamp: new Date().toISOString() }
        };
      }

      const result = await response.json() as HubSpotCompany;
      return {
        success: true,
        data: this.transformHubSpotCompany(result),
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

  async getByDomain(domain: string): Promise<ICRMResponse<ICompany | null>> {
    try {
      const response = await fetch(`${this.baseUrl}/crm/v3/objects/companies/search`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          filterGroups: [{
            filters: [{
              propertyName: 'domain',
              operator: 'EQ',
              value: domain
            }]
          }],
          properties: ['name', 'domain', 'industry', 'numberofemployees', 'annualrevenue', 'city', 'state', 'country', 'phone', 'website', 'description', 'hs_lead_status', 'hs_tags']
        })
      });

      if (!response.ok) {
        const error = await response.json() as { message?: string };
        return {
          success: false,
          error: {
            code: 'HUBSPOT_API_ERROR',
            message: error.message || 'Failed to search company',
            details: error
          },
          metadata: { timestamp: new Date().toISOString() }
        };
      }

      const result = await response.json() as HubSpotSearchResponse;
      const company = result.results.length > 0 ? this.transformHubSpotCompany(result.results[0]) : null;

      return {
        success: true,
        data: company,
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

  async update(id: string, data: IUpdateCompanyData): Promise<ICRMResponse<ICompany>> {
    try {
      const properties = this.toHubSpotProperties(data);

      const response = await fetch(`${this.baseUrl}/crm/v3/objects/companies/${id}`, {
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
            message: error.message || 'Failed to update company',
            details: error
          },
          metadata: { timestamp: new Date().toISOString() }
        };
      }

      const result = await response.json() as HubSpotCompany;
      return {
        success: true,
        data: this.transformHubSpotCompany(result),
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
      const response = await fetch(`${this.baseUrl}/crm/v3/objects/companies/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({})) as { message?: string };
        return {
          success: false,
          error: {
            code: 'HUBSPOT_API_ERROR',
            message: error.message || 'Failed to delete company',
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
    filter?: ICompanyFilter,
    pagination?: IPaginationParams
  ): Promise<ICRMResponse<IPaginatedResponse<ICompany>>> {
    try {
      const filterGroups = this.buildHubSpotFilter(filter);
      const limit = pagination?.limit || 50;

      const response = await fetch(`${this.baseUrl}/crm/v3/objects/companies/search`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          filterGroups: filterGroups.length > 0 ? filterGroups : undefined,
          properties: ['name', 'domain', 'industry', 'numberofemployees', 'annualrevenue', 'city', 'state', 'country', 'phone', 'website', 'description', 'hs_lead_status', 'createdate', 'hs_lastmodifieddate', 'hs_tags'],
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
            message: error.message || 'Failed to list companies',
            details: error
          },
          metadata: { timestamp: new Date().toISOString() }
        };
      }

      const result = await response.json() as HubSpotSearchResponse;
      const companies = result.results.map(company => this.transformHubSpotCompany(company));

      return {
        success: true,
        data: {
          items: companies,
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

  async updateStatus(id: string, status: CompanyStatus): Promise<ICRMResponse<ICompany>> {
    return this.update(id, { status });
  }

  async addTags(id: string, tags: string[]): Promise<ICRMResponse<ICompany>> {
    const existing = await this.getById(id);
    if (!existing.success || !existing.data) {
      return existing as ICRMResponse<ICompany>;
    }

    const currentTags = existing.data.tags || [];
    const newTags = [...new Set([...currentTags, ...tags])];
    return this.update(id, { tags: newTags });
  }

  async removeTags(id: string, tags: string[]): Promise<ICRMResponse<ICompany>> {
    const existing = await this.getById(id);
    if (!existing.success || !existing.data) {
      return existing as ICRMResponse<ICompany>;
    }

    const currentTags = existing.data.tags || [];
    const newTags = currentTags.filter(tag => !tags.includes(tag));
    return this.update(id, { tags: newTags });
  }

  async getContacts(id: string): Promise<ICRMResponse<unknown[]>> {
    try {
      const response = await fetch(
        `${this.baseUrl}/crm/v3/objects/companies/${id}/associations/contacts`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        const error = await response.json() as { message?: string };
        return {
          success: false,
          error: {
            code: 'HUBSPOT_API_ERROR',
            message: error.message || 'Failed to get company contacts',
            details: error
          },
          metadata: { timestamp: new Date().toISOString() }
        };
      }

      const result = await response.json() as { results: unknown[] };
      return {
        success: true,
        data: result.results,
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

  async getDeals(id: string): Promise<ICRMResponse<unknown[]>> {
    try {
      const response = await fetch(
        `${this.baseUrl}/crm/v3/objects/companies/${id}/associations/deals`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        const error = await response.json() as { message?: string };
        return {
          success: false,
          error: {
            code: 'HUBSPOT_API_ERROR',
            message: error.message || 'Failed to get company deals',
            details: error
          },
          metadata: { timestamp: new Date().toISOString() }
        };
      }

      const result = await response.json() as { results: unknown[] };
      return {
        success: true,
        data: result.results,
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

  async enrichByDomain(domain: string): Promise<ICRMResponse<Partial<ICompany>>> {
    // HubSpot Insights API 사용 (CRM Enrichment)
    try {
      const response = await fetch(
        `${this.baseUrl}/companies/v2/domains/${domain}/companies`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: 'HUBSPOT_API_ERROR',
            message: 'Domain enrichment not available',
            details: { domain }
          },
          metadata: { timestamp: new Date().toISOString() }
        };
      }

      const result = await response.json() as { results: HubSpotCompany[] };
      if (result.results.length === 0) {
        return {
          success: true,
          data: {},
          metadata: { timestamp: new Date().toISOString() }
        };
      }

      const company = this.transformHubSpotCompany(result.results[0]);
      return {
        success: true,
        data: company,
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

  /**
   * HubSpot Company를 ICompany로 변환
   */
  private transformHubSpotCompany(company: HubSpotCompany): ICompany {
    const props = company.properties;
    return {
      id: company.id,
      name: props.name || '',
      domain: props.domain,
      industry: this.mapHubSpotIndustry(props.industry),
      employeeCount: props.numberofemployees ? parseInt(props.numberofemployees, 10) : undefined,
      annualRevenue: props.annualrevenue ? parseFloat(props.annualrevenue) : undefined,
      address: {
        city: props.city,
        state: props.state,
        country: props.country
      },
      phone: props.phone,
      website: props.website,
      description: props.description,
      status: this.mapHubSpotStatus(props.hs_lead_status),
      tags: props.hs_tags?.split(';').filter(Boolean) || [],
      customFields: {},
      createdAt: company.createdAt || props.createdate || new Date().toISOString(),
      updatedAt: company.updatedAt || props.hs_lastmodifieddate || new Date().toISOString()
    };
  }

  /**
   * ICompany 데이터를 HubSpot properties로 변환
   */
  private toHubSpotProperties(data: ICreateCompanyData | IUpdateCompanyData): Record<string, string> {
    const properties: Record<string, string> = {};

    if (data.name) properties.name = data.name;
    if (data.domain) properties.domain = data.domain;
    if (data.industry) properties.industry = data.industry;
    if (data.employeeCount !== undefined) properties.numberofemployees = String(data.employeeCount);
    if (data.annualRevenue !== undefined) properties.annualrevenue = String(data.annualRevenue);
    if (data.phone) properties.phone = data.phone;
    if (data.website) properties.website = data.website;
    if (data.description) properties.description = data.description;

    if (data.address) {
      if (data.address.city) properties.city = data.address.city;
      if (data.address.state) properties.state = data.address.state;
      if (data.address.country) properties.country = data.address.country;
    }

    if ('status' in data && data.status) {
      properties.hs_lead_status = this.mapStatusToHubSpot(data.status);
    }

    if (data.tags) {
      properties.hs_tags = data.tags.join(';');
    }

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
   * HubSpot 산업을 CompanyIndustry로 매핑
   */
  private mapHubSpotIndustry(hubSpotIndustry?: string): CompanyIndustry | undefined {
    if (!hubSpotIndustry) return undefined;
    const industryMap: Record<string, CompanyIndustry> = {
      'technology': 'technology',
      'it': 'technology',
      'software': 'technology',
      'finance': 'finance',
      'financial_services': 'finance',
      'banking': 'finance',
      'healthcare': 'healthcare',
      'medical': 'healthcare',
      'education': 'education',
      'retail': 'retail',
      'ecommerce': 'retail',
      'manufacturing': 'manufacturing',
      'services': 'services',
      'consulting': 'services',
      'professional_services': 'services'
    };
    return industryMap[hubSpotIndustry.toLowerCase()] || 'other';
  }

  /**
   * HubSpot 상태를 CompanyStatus로 매핑
   */
  private mapHubSpotStatus(hubSpotStatus?: string): CompanyStatus {
    const statusMap: Record<string, CompanyStatus> = {
      'prospect': 'prospect',
      'active': 'active',
      'customer': 'customer',
      'inactive': 'inactive',
      'churned': 'churned'
    };
    return statusMap[hubSpotStatus?.toLowerCase() || ''] || 'prospect';
  }

  /**
   * CompanyStatus를 HubSpot 상태로 매핑
   */
  private mapStatusToHubSpot(status: CompanyStatus): string {
    const statusMap: Record<CompanyStatus, string> = {
      'prospect': 'PROSPECT',
      'active': 'ACTIVE',
      'customer': 'CUSTOMER',
      'inactive': 'INACTIVE',
      'churned': 'CHURNED'
    };
    return statusMap[status] || 'PROSPECT';
  }

  /**
   * ICompanyFilter를 HubSpot filterGroups로 변환
   */
  private buildHubSpotFilter(filter?: ICompanyFilter): Array<{ filters: Array<{ propertyName: string; operator: string; value: string }> }> {
    if (!filter) return [];

    const filters: Array<{ propertyName: string; operator: string; value: string }> = [];

    if (filter.status?.length) {
      filter.status.forEach(status => {
        filters.push({
          propertyName: 'hs_lead_status',
          operator: 'EQ',
          value: this.mapStatusToHubSpot(status)
        });
      });
    }

    if (filter.industry?.length) {
      filter.industry.forEach(industry => {
        filters.push({
          propertyName: 'industry',
          operator: 'EQ',
          value: industry
        });
      });
    }

    if (filter.employeeCountMin !== undefined) {
      filters.push({
        propertyName: 'numberofemployees',
        operator: 'GTE',
        value: String(filter.employeeCountMin)
      });
    }

    if (filter.employeeCountMax !== undefined) {
      filters.push({
        propertyName: 'numberofemployees',
        operator: 'LTE',
        value: String(filter.employeeCountMax)
      });
    }

    if (filter.revenueMin !== undefined) {
      filters.push({
        propertyName: 'annualrevenue',
        operator: 'GTE',
        value: String(filter.revenueMin)
      });
    }

    if (filter.revenueMax !== undefined) {
      filters.push({
        propertyName: 'annualrevenue',
        operator: 'LTE',
        value: String(filter.revenueMax)
      });
    }

    if (filter.country) {
      filters.push({
        propertyName: 'country',
        operator: 'EQ',
        value: filter.country
      });
    }

    if (filter.search) {
      return [
        { filters: [{ propertyName: 'name', operator: 'CONTAINS_TOKEN', value: filter.search }] },
        { filters: [{ propertyName: 'domain', operator: 'CONTAINS_TOKEN', value: filter.search }] }
      ];
    }

    return filters.length > 0 ? [{ filters }] : [];
  }
}

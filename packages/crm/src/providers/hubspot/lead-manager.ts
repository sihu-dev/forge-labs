/**
 * @forge/crm - HubSpot Lead Manager
 * L2 Cells - HubSpot 리드 관리 구현 (Contacts API)
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
  LeadStatus,
  LeadSource
} from '../../interfaces/index.js';

/**
 * HubSpot API Response Types
 */
interface HubSpotContact {
  id: string;
  properties: {
    email?: string;
    firstname?: string;
    lastname?: string;
    phone?: string;
    company?: string;
    jobtitle?: string;
    lifecyclestage?: string;
    leadsource?: string;
    hs_lead_status?: string;
    hubspot_score?: string;
    hs_object_id?: string;
    createdate?: string;
    lastmodifieddate?: string;
    notes_last_contacted?: string;
    hs_tags?: string;
    [key: string]: string | undefined;
  };
  createdAt: string;
  updatedAt: string;
  archived: boolean;
}

interface HubSpotSearchResponse {
  results: HubSpotContact[];
  paging?: {
    next?: {
      after: string;
    };
  };
  total: number;
}

/**
 * HubSpot Lead Manager 구현
 * HubSpot Contacts API를 사용하여 리드 관리
 */
export class HubSpotLeadManager implements ILeadManager {
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

  async create(data: ICreateLeadData): Promise<ICRMResponse<ILead>> {
    try {
      const properties = this.toHubSpotProperties(data);

      const response = await fetch(`${this.baseUrl}/crm/v3/objects/contacts`, {
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
            message: error.message || 'Failed to create contact',
            details: error
          },
          metadata: { timestamp: new Date().toISOString() }
        };
      }

      const result = await response.json() as HubSpotContact;
      return {
        success: true,
        data: this.transformHubSpotContact(result),
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

  async getById(id: string): Promise<ICRMResponse<ILead>> {
    try {
      const properties = 'email,firstname,lastname,phone,company,jobtitle,lifecyclestage,leadsource,hs_lead_status,hubspot_score,createdate,lastmodifieddate,notes_last_contacted,hs_tags';
      const response = await fetch(
        `${this.baseUrl}/crm/v3/objects/contacts/${id}?properties=${properties}`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        const error = await response.json() as { message?: string };
        return {
          success: false,
          error: {
            code: response.status === 404 ? 'NOT_FOUND' : 'HUBSPOT_API_ERROR',
            message: error.message || 'Failed to get contact',
            details: error
          },
          metadata: { timestamp: new Date().toISOString() }
        };
      }

      const result = await response.json() as HubSpotContact;
      return {
        success: true,
        data: this.transformHubSpotContact(result),
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

  async getByEmail(email: string): Promise<ICRMResponse<ILead | null>> {
    try {
      const response = await fetch(`${this.baseUrl}/crm/v3/objects/contacts/search`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          filterGroups: [{
            filters: [{
              propertyName: 'email',
              operator: 'EQ',
              value: email
            }]
          }],
          properties: ['email', 'firstname', 'lastname', 'phone', 'company', 'jobtitle', 'lifecyclestage', 'leadsource', 'hs_lead_status', 'hubspot_score', 'hs_tags']
        })
      });

      if (!response.ok) {
        const error = await response.json() as { message?: string };
        return {
          success: false,
          error: {
            code: 'HUBSPOT_API_ERROR',
            message: error.message || 'Failed to search contact',
            details: error
          },
          metadata: { timestamp: new Date().toISOString() }
        };
      }

      const result = await response.json() as HubSpotSearchResponse;
      const lead = result.results.length > 0 ? this.transformHubSpotContact(result.results[0]) : null;

      return {
        success: true,
        data: lead,
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

  async update(id: string, data: IUpdateLeadData): Promise<ICRMResponse<ILead>> {
    try {
      const properties = this.toHubSpotProperties(data);

      const response = await fetch(`${this.baseUrl}/crm/v3/objects/contacts/${id}`, {
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
            message: error.message || 'Failed to update contact',
            details: error
          },
          metadata: { timestamp: new Date().toISOString() }
        };
      }

      const result = await response.json() as HubSpotContact;
      return {
        success: true,
        data: this.transformHubSpotContact(result),
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
      const response = await fetch(`${this.baseUrl}/crm/v3/objects/contacts/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({})) as { message?: string };
        return {
          success: false,
          error: {
            code: 'HUBSPOT_API_ERROR',
            message: error.message || 'Failed to delete contact',
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
    filter?: ILeadFilter,
    pagination?: IPaginationParams
  ): Promise<ICRMResponse<IPaginatedResponse<ILead>>> {
    try {
      const filterGroups = this.buildHubSpotFilter(filter);
      const limit = pagination?.limit || 50;

      const response = await fetch(`${this.baseUrl}/crm/v3/objects/contacts/search`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          filterGroups: filterGroups.length > 0 ? filterGroups : undefined,
          properties: ['email', 'firstname', 'lastname', 'phone', 'company', 'jobtitle', 'lifecyclestage', 'leadsource', 'hs_lead_status', 'hubspot_score', 'createdate', 'lastmodifieddate', 'hs_tags'],
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
            message: error.message || 'Failed to list contacts',
            details: error
          },
          metadata: { timestamp: new Date().toISOString() }
        };
      }

      const result = await response.json() as HubSpotSearchResponse;
      const leads = result.results.map(contact => this.transformHubSpotContact(contact));

      return {
        success: true,
        data: {
          items: leads,
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

  async updateStatus(id: string, status: LeadStatus): Promise<ICRMResponse<ILead>> {
    return this.update(id, { status });
  }

  async updateScore(id: string, score: number): Promise<ICRMResponse<ILead>> {
    return this.update(id, { score });
  }

  async addTags(id: string, tags: string[]): Promise<ICRMResponse<ILead>> {
    const existing = await this.getById(id);
    if (!existing.success || !existing.data) {
      return existing as ICRMResponse<ILead>;
    }

    const currentTags = existing.data.tags || [];
    const newTags = [...new Set([...currentTags, ...tags])];
    return this.update(id, { tags: newTags });
  }

  async removeTags(id: string, tags: string[]): Promise<ICRMResponse<ILead>> {
    const existing = await this.getById(id);
    if (!existing.success || !existing.data) {
      return existing as ICRMResponse<ILead>;
    }

    const currentTags = existing.data.tags || [];
    const newTags = currentTags.filter(tag => !tags.includes(tag));
    return this.update(id, { tags: newTags });
  }

  async convertToDeal(
    id: string,
    dealData?: Record<string, unknown>
  ): Promise<ICRMResponse<{ leadId: string; dealId: string }>> {
    try {
      // 딜 생성
      const dealResponse = await fetch(`${this.baseUrl}/crm/v3/objects/deals`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          properties: {
            dealname: dealData?.name || `Deal from Lead ${id}`,
            amount: dealData?.amount || '0',
            dealstage: dealData?.stage || 'appointmentscheduled',
            pipeline: dealData?.pipeline || 'default'
          }
        })
      });

      if (!dealResponse.ok) {
        const error = await dealResponse.json() as { message?: string };
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

      const deal = await dealResponse.json() as { id: string };

      // 딜과 컨택 연결
      await fetch(`${this.baseUrl}/crm/v3/objects/deals/${deal.id}/associations/contacts/${id}/deal_to_contact`, {
        method: 'PUT',
        headers: this.getHeaders()
      });

      // 리드 상태를 converted로 업데이트
      await this.updateStatus(id, 'converted');

      return {
        success: true,
        data: {
          leadId: id,
          dealId: deal.id
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

  /**
   * HubSpot Contact를 ILead로 변환
   */
  private transformHubSpotContact(contact: HubSpotContact): ILead {
    const props = contact.properties;
    return {
      id: contact.id,
      email: props.email || '',
      firstName: props.firstname,
      lastName: props.lastname,
      fullName: [props.firstname, props.lastname].filter(Boolean).join(' ') || undefined,
      phone: props.phone,
      company: props.company,
      jobTitle: props.jobtitle,
      status: this.mapHubSpotStatus(props.hs_lead_status || props.lifecyclestage),
      source: this.mapHubSpotSource(props.leadsource),
      score: props.hubspot_score ? parseInt(props.hubspot_score, 10) : undefined,
      tags: props.hs_tags?.split(';').filter(Boolean) || [],
      customFields: {},
      createdAt: contact.createdAt || props.createdate || new Date().toISOString(),
      updatedAt: contact.updatedAt || props.lastmodifieddate || new Date().toISOString(),
      lastContactedAt: props.notes_last_contacted
    };
  }

  /**
   * ILead 데이터를 HubSpot properties로 변환
   */
  private toHubSpotProperties(data: ICreateLeadData | IUpdateLeadData): Record<string, string> {
    const properties: Record<string, string> = {};

    if (data.email) properties.email = data.email;
    if (data.firstName) properties.firstname = data.firstName;
    if (data.lastName) properties.lastname = data.lastName;
    if (data.phone) properties.phone = data.phone;
    if (data.company) properties.company = data.company;
    if (data.jobTitle) properties.jobtitle = data.jobTitle;

    if ('source' in data && data.source) {
      properties.leadsource = this.mapSourceToHubSpot(data.source);
    }

    if ('status' in data && data.status) {
      properties.hs_lead_status = this.mapStatusToHubSpot(data.status);
    }

    if ('score' in data && data.score !== undefined) {
      properties.hubspot_score = String(data.score);
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
   * HubSpot 상태를 LeadStatus로 매핑
   */
  private mapHubSpotStatus(hubSpotStatus?: string): LeadStatus {
    const statusMap: Record<string, LeadStatus> = {
      'new': 'new',
      'open': 'new',
      'in_progress': 'contacted',
      'contacted': 'contacted',
      'open_deal': 'qualified',
      'qualified': 'qualified',
      'unqualified': 'unqualified',
      'bad_timing': 'nurturing',
      'nurturing': 'nurturing',
      'customer': 'converted',
      'converted': 'converted',
      'closed_lost': 'lost',
      'lost': 'lost'
    };
    return statusMap[hubSpotStatus?.toLowerCase() || ''] || 'new';
  }

  /**
   * LeadStatus를 HubSpot 상태로 매핑
   */
  private mapStatusToHubSpot(status: LeadStatus): string {
    const statusMap: Record<LeadStatus, string> = {
      'new': 'NEW',
      'contacted': 'IN_PROGRESS',
      'qualified': 'QUALIFIED',
      'unqualified': 'UNQUALIFIED',
      'nurturing': 'BAD_TIMING',
      'converted': 'CUSTOMER',
      'lost': 'CLOSED_LOST'
    };
    return statusMap[status] || 'NEW';
  }

  /**
   * HubSpot 소스를 LeadSource로 매핑
   */
  private mapHubSpotSource(hubSpotSource?: string): LeadSource {
    const sourceMap: Record<string, LeadSource> = {
      'direct_traffic': 'website',
      'organic_search': 'website',
      'paid_search': 'website',
      'referral': 'referral',
      'social_media': 'social',
      'email_marketing': 'outbound',
      'event': 'event',
      'partner': 'partner',
      'offline_sources': 'other'
    };
    return sourceMap[hubSpotSource?.toLowerCase() || ''] || 'other';
  }

  /**
   * LeadSource를 HubSpot 소스로 매핑
   */
  private mapSourceToHubSpot(source: LeadSource): string {
    const sourceMap: Record<LeadSource, string> = {
      'website': 'DIRECT_TRAFFIC',
      'referral': 'REFERRAL',
      'social': 'SOCIAL_MEDIA',
      'event': 'EVENT',
      'outbound': 'EMAIL_MARKETING',
      'partner': 'PARTNER',
      'other': 'OFFLINE_SOURCES'
    };
    return sourceMap[source] || 'OFFLINE_SOURCES';
  }

  /**
   * ILeadFilter를 HubSpot filterGroups로 변환
   */
  private buildHubSpotFilter(filter?: ILeadFilter): Array<{ filters: Array<{ propertyName: string; operator: string; value: string }> }> {
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

    if (filter.source?.length) {
      filter.source.forEach(source => {
        filters.push({
          propertyName: 'leadsource',
          operator: 'EQ',
          value: this.mapSourceToHubSpot(source)
        });
      });
    }

    if (filter.scoreMin !== undefined) {
      filters.push({
        propertyName: 'hubspot_score',
        operator: 'GTE',
        value: String(filter.scoreMin)
      });
    }

    if (filter.scoreMax !== undefined) {
      filters.push({
        propertyName: 'hubspot_score',
        operator: 'LTE',
        value: String(filter.scoreMax)
      });
    }

    if (filter.createdAfter) {
      filters.push({
        propertyName: 'createdate',
        operator: 'GTE',
        value: filter.createdAfter
      });
    }

    if (filter.createdBefore) {
      filters.push({
        propertyName: 'createdate',
        operator: 'LTE',
        value: filter.createdBefore
      });
    }

    if (filter.search) {
      return [
        { filters: [{ propertyName: 'email', operator: 'CONTAINS_TOKEN', value: filter.search }] },
        { filters: [{ propertyName: 'firstname', operator: 'CONTAINS_TOKEN', value: filter.search }] },
        { filters: [{ propertyName: 'lastname', operator: 'CONTAINS_TOKEN', value: filter.search }] },
        { filters: [{ propertyName: 'company', operator: 'CONTAINS_TOKEN', value: filter.search }] }
      ];
    }

    return filters.length > 0 ? [{ filters }] : [];
  }
}

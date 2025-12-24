/**
 * @forge/core - HubSpot API Client (L2 - Cells)
 *
 * HubSpot CRM API integration client
 * Handles authentication, rate limiting, and API calls
 */

import type { IResult } from '@forge/types';

// ============================================
// HubSpot Client Configuration
// ============================================

export interface HubSpotConfig {
  apiKey: string;
  baseUrl?: string;
  rateLimit?: {
    requestsPer10s: number;
    burstLimit: number;
  };
}

export interface HubSpotContact {
  id: string;
  properties: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  archived: boolean;
}

export interface HubSpotCompany {
  id: string;
  properties: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  archived: boolean;
}

export interface HubSpotDeal {
  id: string;
  properties: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  archived: boolean;
}

export interface HubSpotEngagement {
  id: string;
  type: 'NOTE' | 'TASK' | 'MEETING' | 'CALL' | 'EMAIL';
  metadata: Record<string, unknown>;
  associations: {
    contactIds?: string[];
    companyIds?: string[];
    dealIds?: string[];
  };
  timestamp: number;
}

// ============================================
// HubSpot Client
// ============================================

export class HubSpotClient {
  private config: HubSpotConfig;
  private baseUrl: string;
  private requestQueue: Array<() => Promise<unknown>> = [];
  private isProcessing = false;

  constructor(config: HubSpotConfig) {
    this.config = {
      ...config,
      baseUrl: config.baseUrl || 'https://api.hubapi.com',
      rateLimit: config.rateLimit || {
        requestsPer10s: 100,
        burstLimit: 150,
      },
    };
    this.baseUrl = this.config.baseUrl!;
  }

  // ============================================
  // Contacts
  // ============================================

  /**
   * Search contacts by query
   */
  async searchContacts(
    query: string,
    limit: number = 100
  ): Promise<IResult<HubSpotContact[]>> {
    const startTime = Date.now();

    try {
      const response = await this.request<{ results: HubSpotContact[] }>(
        'POST',
        '/crm/v3/objects/contacts/search',
        {
          filterGroups: [
            {
              filters: [
                {
                  propertyName: 'email',
                  operator: 'CONTAINS_TOKEN',
                  value: query,
                },
              ],
            },
          ],
          limit,
        }
      );

      return {
        success: true,
        data: response.results,
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * Get contact by ID
   */
  async getContact(contactId: string): Promise<IResult<HubSpotContact>> {
    const startTime = Date.now();

    try {
      const contact = await this.request<HubSpotContact>(
        'GET',
        `/crm/v3/objects/contacts/${contactId}`
      );

      return {
        success: true,
        data: contact,
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * Create contact
   */
  async createContact(
    properties: Record<string, string>
  ): Promise<IResult<HubSpotContact>> {
    const startTime = Date.now();

    try {
      const contact = await this.request<HubSpotContact>(
        'POST',
        '/crm/v3/objects/contacts',
        { properties }
      );

      return {
        success: true,
        data: contact,
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * Update contact
   */
  async updateContact(
    contactId: string,
    properties: Record<string, string>
  ): Promise<IResult<HubSpotContact>> {
    const startTime = Date.now();

    try {
      const contact = await this.request<HubSpotContact>(
        'PATCH',
        `/crm/v3/objects/contacts/${contactId}`,
        { properties }
      );

      return {
        success: true,
        data: contact,
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * Get recently modified contacts
   */
  async getRecentlyModifiedContacts(
    since: Date,
    limit: number = 100
  ): Promise<IResult<HubSpotContact[]>> {
    const startTime = Date.now();

    try {
      const response = await this.request<{ results: HubSpotContact[] }>(
        'POST',
        '/crm/v3/objects/contacts/search',
        {
          filterGroups: [
            {
              filters: [
                {
                  propertyName: 'lastmodifieddate',
                  operator: 'GTE',
                  value: since.getTime().toString(),
                },
              ],
            },
          ],
          sorts: [{ propertyName: 'lastmodifieddate', direction: 'DESCENDING' }],
          limit,
        }
      );

      return {
        success: true,
        data: response.results,
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    }
  }

  // ============================================
  // Companies
  // ============================================

  /**
   * Get company by ID
   */
  async getCompany(companyId: string): Promise<IResult<HubSpotCompany>> {
    const startTime = Date.now();

    try {
      const company = await this.request<HubSpotCompany>(
        'GET',
        `/crm/v3/objects/companies/${companyId}`
      );

      return {
        success: true,
        data: company,
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * Create company
   */
  async createCompany(
    properties: Record<string, string>
  ): Promise<IResult<HubSpotCompany>> {
    const startTime = Date.now();

    try {
      const company = await this.request<HubSpotCompany>(
        'POST',
        '/crm/v3/objects/companies',
        { properties }
      );

      return {
        success: true,
        data: company,
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    }
  }

  // ============================================
  // Deals
  // ============================================

  /**
   * Get deal by ID
   */
  async getDeal(dealId: string): Promise<IResult<HubSpotDeal>> {
    const startTime = Date.now();

    try {
      const deal = await this.request<HubSpotDeal>(
        'GET',
        `/crm/v3/objects/deals/${dealId}`
      );

      return {
        success: true,
        data: deal,
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * Create deal
   */
  async createDeal(
    properties: Record<string, string>,
    associations?: {
      contactIds?: string[];
      companyIds?: string[];
    }
  ): Promise<IResult<HubSpotDeal>> {
    const startTime = Date.now();

    try {
      const deal = await this.request<HubSpotDeal>(
        'POST',
        '/crm/v3/objects/deals',
        {
          properties,
          associations: associations
            ? [
                ...(associations.contactIds?.map((id) => ({
                  to: { id },
                  types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 3 }],
                })) || []),
                ...(associations.companyIds?.map((id) => ({
                  to: { id },
                  types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 5 }],
                })) || []),
              ]
            : undefined,
        }
      );

      return {
        success: true,
        data: deal,
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * Update deal
   */
  async updateDeal(
    dealId: string,
    properties: Record<string, string>
  ): Promise<IResult<HubSpotDeal>> {
    const startTime = Date.now();

    try {
      const deal = await this.request<HubSpotDeal>(
        'PATCH',
        `/crm/v3/objects/deals/${dealId}`,
        { properties }
      );

      return {
        success: true,
        data: deal,
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    }
  }

  // ============================================
  // Engagements (Activities)
  // ============================================

  /**
   * Create engagement (activity)
   */
  async createEngagement(
    engagement: Partial<HubSpotEngagement>
  ): Promise<IResult<HubSpotEngagement>> {
    const startTime = Date.now();

    try {
      const created = await this.request<HubSpotEngagement>(
        'POST',
        '/engagements/v1/engagements',
        {
          engagement: {
            type: engagement.type,
            timestamp: engagement.timestamp || Date.now(),
          },
          metadata: engagement.metadata,
          associations: engagement.associations,
        }
      );

      return {
        success: true,
        data: created,
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    }
  }

  // ============================================
  // Batch Operations
  // ============================================

  /**
   * Batch create/update contacts
   */
  async batchUpsertContacts(
    contacts: Array<{
      id?: string;
      properties: Record<string, string>;
    }>
  ): Promise<IResult<HubSpotContact[]>> {
    const startTime = Date.now();

    try {
      const response = await this.request<{ results: HubSpotContact[] }>(
        'POST',
        '/crm/v3/objects/contacts/batch/upsert',
        {
          inputs: contacts.map((c) => ({
            id: c.id,
            properties: c.properties,
          })),
        }
      );

      return {
        success: true,
        data: response.results,
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    }
  }

  // ============================================
  // Private Methods
  // ============================================

  /**
   * Make rate-limited API request
   */
  private async request<T>(
    method: string,
    endpoint: string,
    body?: unknown
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const url = `${this.baseUrl}${endpoint}`;
          const headers = {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.config.apiKey}`,
          };

          const options: RequestInit = {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
          };

          const response = await fetch(url, options);

          if (!response.ok) {
            const error = await response.json();
            throw new Error(
              `HubSpot API error: ${error.message || response.statusText}`
            );
          }

          const data = await response.json();
          resolve(data as T);
        } catch (error) {
          reject(error);
        }
      });

      this.processQueue();
    });
  }

  /**
   * Process request queue with rate limiting
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    const batchSize = this.config.rateLimit!.requestsPer10s;
    const batchDelay = 10000; // 10 seconds

    while (this.requestQueue.length > 0) {
      const batch = this.requestQueue.splice(0, batchSize);

      await Promise.all(batch.map((fn) => fn()));

      if (this.requestQueue.length > 0) {
        await new Promise((resolve) => setTimeout(resolve, batchDelay));
      }
    }

    this.isProcessing = false;
  }
}

/**
 * Create HubSpot client instance
 */
export function createHubSpotClient(config: HubSpotConfig): HubSpotClient {
  return new HubSpotClient(config);
}

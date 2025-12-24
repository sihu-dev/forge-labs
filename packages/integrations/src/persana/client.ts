/**
 * Persana AI Client
 * Lead enrichment, company intelligence, tech stack analysis
 */

import type {
  PersanaConfig,
  EnrichmentRequest,
  PersonEnrichment,
  CompanyEnrichment,
  TechStackAnalysis,
  APIResponse,
} from './types.js';

export class PersanaClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly retryAttempts: number;

  constructor(config: PersanaConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.persana.ai/v1';
    this.timeout = config.timeout || 30000;
    this.retryAttempts = config.retryAttempts || 3;
  }

  /**
   * Enrich person data from email or LinkedIn URL
   */
  async enrichPerson(
    request: EnrichmentRequest
  ): Promise<APIResponse<PersonEnrichment>> {
    return this.request<PersonEnrichment>('POST', '/enrich/person', request);
  }

  /**
   * Enrich company data from domain or company name
   */
  async enrichCompany(
    request: EnrichmentRequest
  ): Promise<APIResponse<CompanyEnrichment>> {
    return this.request<CompanyEnrichment>('POST', '/enrich/company', request);
  }

  /**
   * Analyze company tech stack
   */
  async analyzeTechStack(domain: string): Promise<APIResponse<TechStackAnalysis>> {
    return this.request<TechStackAnalysis>('GET', `/tech-stack/${domain}`);
  }

  /**
   * Batch enrich multiple people
   */
  async batchEnrichPeople(
    requests: EnrichmentRequest[]
  ): Promise<APIResponse<PersonEnrichment[]>> {
    return this.request<PersonEnrichment[]>('POST', '/enrich/person/batch', {
      requests,
    });
  }

  /**
   * Batch enrich multiple companies
   */
  async batchEnrichCompanies(
    requests: EnrichmentRequest[]
  ): Promise<APIResponse<CompanyEnrichment[]>> {
    return this.request<CompanyEnrichment[]>('POST', '/enrich/company/batch', {
      requests,
    });
  }

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
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            `Persana API error: ${response.status} - ${errorData.message || response.statusText}`
          );
        }

        const data = await response.json();
        return {
          success: true,
          data: data.data || data,
          metadata: {
            requestId: data.requestId || crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            credits: data.credits,
          },
        };
      } catch (error) {
        lastError = error as Error;

        // Don't retry on 4xx errors
        if (error instanceof Error && error.message.includes('4')) {
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

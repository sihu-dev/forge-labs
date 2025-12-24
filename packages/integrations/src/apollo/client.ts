/**
 * Apollo.io Client
 * Contact search, email verification, sequence management
 */

import type {
  ApolloConfig,
  ContactSearchRequest,
  Contact,
  EmailVerificationRequest,
  EmailVerificationResult,
  Sequence,
  SequenceContact,
  AddToSequenceRequest,
  APIResponse,
} from './types.js';

export class ApolloClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly retryAttempts: number;

  constructor(config: ApolloConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.apollo.io/v1';
    this.timeout = config.timeout || 30000;
    this.retryAttempts = config.retryAttempts || 3;
  }

  /**
   * Search for contacts
   */
  async searchContacts(
    request: ContactSearchRequest
  ): Promise<APIResponse<Contact[]>> {
    return this.request<Contact[]>('POST', '/mixed_people/search', request);
  }

  /**
   * Get contact by ID
   */
  async getContact(contactId: string): Promise<APIResponse<Contact>> {
    return this.request<Contact>('GET', `/people/${contactId}`);
  }

  /**
   * Verify email address
   */
  async verifyEmail(
    request: EmailVerificationRequest
  ): Promise<APIResponse<EmailVerificationResult>> {
    return this.request<EmailVerificationResult>(
      'POST',
      '/email_verification',
      request
    );
  }

  /**
   * Batch verify emails
   */
  async batchVerifyEmails(
    emails: string[]
  ): Promise<APIResponse<EmailVerificationResult[]>> {
    return this.request<EmailVerificationResult[]>(
      'POST',
      '/email_verification/batch',
      { emails }
    );
  }

  /**
   * List sequences
   */
  async listSequences(): Promise<APIResponse<Sequence[]>> {
    return this.request<Sequence[]>('GET', '/emailer_campaigns');
  }

  /**
   * Get sequence by ID
   */
  async getSequence(sequenceId: string): Promise<APIResponse<Sequence>> {
    return this.request<Sequence>('GET', `/emailer_campaigns/${sequenceId}`);
  }

  /**
   * Add contacts to sequence
   */
  async addToSequence(
    request: AddToSequenceRequest
  ): Promise<APIResponse<SequenceContact[]>> {
    return this.request<SequenceContact[]>(
      'POST',
      '/emailer_campaigns/add_contact_ids',
      request
    );
  }

  /**
   * Remove contact from sequence
   */
  async removeFromSequence(
    sequenceId: string,
    contactId: string
  ): Promise<APIResponse<void>> {
    return this.request<void>(
      'DELETE',
      `/emailer_campaigns/${sequenceId}/contacts/${contactId}`
    );
  }

  /**
   * Get sequence contacts
   */
  async getSequenceContacts(
    sequenceId: string
  ): Promise<APIResponse<SequenceContact[]>> {
    return this.request<SequenceContact[]>(
      'GET',
      `/emailer_campaigns/${sequenceId}/contacts`
    );
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

        const url = new URL(`${this.baseUrl}${path}`);
        url.searchParams.set('api_key', this.apiKey);

        const response = await fetch(url.toString(), {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            `Apollo API error: ${response.status} - ${errorData.message || response.statusText}`
          );
        }

        const data = await response.json();

        return {
          success: true,
          data: data.contacts || data.people || data.campaign || data,
          pagination: data.pagination,
          metadata: {
            requestId: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
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

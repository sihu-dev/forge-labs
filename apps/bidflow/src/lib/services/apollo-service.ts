/**
 * Apollo.io Service
 * Contact search, enrichment, and sequence management
 *
 * NOTE: This service wraps the @forge/integrations Apollo client.
 * Some features may have limited functionality due to API constraints.
 */

import {
  ApolloClient,
  type ContactSearchRequest,
  type Contact,
  type EmailVerificationResult,
  type AddToSequenceRequest,
} from '@forge/integrations';

export interface ApolloServiceConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface ContactEnrichmentResult {
  contact: Contact;
  confidence: number;
  source: 'apollo';
  enrichedAt: string;
}

export interface OrganizationSearchResult {
  contacts: Contact[];
  totalFound: number;
  searchQuery: string;
}

/**
 * Apollo.io 서비스 래퍼
 * BIDFLOW 비즈니스 로직과 Apollo API 연동
 */
export class ApolloService {
  private client: ApolloClient;

  constructor(config: ApolloServiceConfig) {
    this.client = new ApolloClient({
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
    });
  }

  /**
   * 조직명으로 담당자 검색
   * 입찰 발주 기관의 담당자를 찾는 핵심 기능
   */
  async searchContactsByOrganization(
    organizationName: string,
    options: {
      titles?: string[]; // e.g. ['구매담당', '조달담당', '시설담당']
      departments?: string[]; // e.g. ['구매부', '시설관리부']
      limit?: number;
    } = {}
  ): Promise<OrganizationSearchResult> {
    // Use q_keywords for organization name search since organization_names is not in the type
    const searchRequest: ContactSearchRequest = {
      q_keywords: organizationName,
      person_titles: options.titles || [
        '구매',
        '조달',
        '시설',
        '자재',
        '구매담당',
        '조달담당',
        '구매팀장',
      ],
      page: 1,
      per_page: options.limit || 25,
    };

    const response = await this.client.searchContacts(searchRequest);

    if (!response.success || !response.data) {
      throw new Error(
        `Apollo contact search failed: ${response.error?.message || 'Unknown error'}`
      );
    }

    // Response data is Contact[] with pagination in the response
    const contacts = response.data as unknown as Contact[];

    return {
      contacts,
      totalFound: response.pagination?.total_entries || contacts.length,
      searchQuery: organizationName,
    };
  }

  /**
   * 이메일 검증
   * 찾은 연락처의 이메일이 유효한지 확인
   */
  async verifyEmail(email: string): Promise<{
    valid: boolean;
    status: 'valid' | 'invalid' | 'unknown' | 'risky';
    confidence: number;
  }> {
    const response = await this.client.verifyEmail({ email });

    if (!response.success || !response.data) {
      return {
        valid: false,
        status: 'unknown',
        confidence: 0,
      };
    }

    const result = response.data as EmailVerificationResult;

    // Map Apollo status to our simplified status
    let status: 'valid' | 'invalid' | 'unknown' | 'risky' = 'unknown';
    if (result.status === 'valid') {
      status = 'valid';
    } else if (result.status === 'invalid') {
      status = 'invalid';
    } else if (result.status === 'accept_all' || result.status === 'disposable') {
      status = 'risky';
    }

    // Calculate confidence based on deliverability
    const confidence = result.is_deliverable ? 0.9 : 0.3;

    return {
      valid: result.status === 'valid',
      status,
      confidence,
    };
  }

  /**
   * 담당자를 아웃리치 시퀀스에 추가
   * 자동 팔로업 이메일 발송을 위한 기능
   */
  async addContactToSequence(
    contactId: string,
    sequenceId: string,
    options: {
      mailboxId?: string;
      sendEmail?: boolean;
    } = {}
  ): Promise<boolean> {
    const request: AddToSequenceRequest = {
      contact_ids: [contactId],
      sequence_id: sequenceId,
      emailer_id: options.mailboxId,
      send_on_behalf_of_email: options.sendEmail ? options.mailboxId : undefined,
    };

    const response = await this.client.addToSequence(request);

    return response.success;
  }

  /**
   * 연락처 상세 정보 조회
   * Note: Apollo API doesn't support querying by contact ID directly,
   * this method uses keyword search as a workaround
   */
  async getContactDetails(contactId: string): Promise<Contact | null> {
    // Apollo API doesn't support direct contact ID lookup in search
    // This is a limitation - we'd need a different API endpoint
    console.warn(
      '[ApolloService] getContactDetails: Direct contact ID lookup not supported, ' +
        'contact ID: ' +
        contactId
    );
    return null;
  }

  /**
   * 배치 이메일 검증
   * 여러 이메일을 한 번에 검증
   */
  async verifyEmailsBatch(
    emails: string[]
  ): Promise<Array<{ email: string; valid: boolean; status: string }>> {
    const results = await Promise.all(
      emails.map(async (email) => {
        const result = await this.verifyEmail(email);
        return {
          email,
          valid: result.valid,
          status: result.status,
        };
      })
    );

    return results;
  }

  /**
   * 연락처 강화 (enrichment)
   * 기본 정보를 Apollo 데이터로 보강
   * Note: Uses email keyword search as a workaround
   */
  async enrichContact(
    email: string,
    organizationName?: string
  ): Promise<ContactEnrichmentResult | null> {
    const searchRequest: ContactSearchRequest = {
      q_keywords: organizationName ? `${email} ${organizationName}` : email,
      page: 1,
      per_page: 1,
    };

    const response = await this.client.searchContacts(searchRequest);

    if (!response.success || !response.data) {
      return null;
    }

    const contacts = response.data as unknown as Contact[];
    if (contacts.length === 0) {
      return null;
    }

    const contact = contacts[0];

    return {
      contact,
      confidence: 0.9, // Apollo는 매치 신뢰도가 높음
      source: 'apollo',
      enrichedAt: new Date().toISOString(),
    };
  }

  /**
   * 직책별 담당자 검색
   * 특정 직책을 가진 사람들을 찾음
   */
  async searchByTitle(
    title: string,
    organizationName?: string,
    limit: number = 10
  ): Promise<Contact[]> {
    const searchRequest: ContactSearchRequest = {
      person_titles: [title],
      q_keywords: organizationName,
      page: 1,
      per_page: limit,
    };

    const response = await this.client.searchContacts(searchRequest);

    if (!response.success || !response.data) {
      return [];
    }

    return response.data as unknown as Contact[];
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      // 최소한의 검색으로 API 연결 확인
      const response = await this.client.searchContacts({
        page: 1,
        per_page: 1,
      });
      return response.success;
    } catch (error) {
      return false;
    }
  }
}

/**
 * Apollo Service Factory
 * 환경변수에서 설정을 로드하여 인스턴스 생성
 */
export function createApolloService(apiKey?: string): ApolloService {
  const key = apiKey || process.env.APOLLO_API_KEY;

  if (!key) {
    throw new Error('APOLLO_API_KEY is required');
  }

  return new ApolloService({ apiKey: key });
}

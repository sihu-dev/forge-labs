/**
 * Apollo.io Service
 * Contact search, enrichment, and sequence management
 */

import { ApolloClient, type ContactSearchRequest, type Contact } from '@forge/integrations';

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
    const searchRequest: ContactSearchRequest = {
      organization_names: [organizationName],
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

    return {
      contacts: response.data.contacts,
      totalFound: response.data.pagination.total_entries,
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

    const result = response.data;

    return {
      valid: result.status === 'valid',
      status: result.status,
      confidence: result.confidence_score,
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
    const response = await this.client.addToSequence({
      contact_id: contactId,
      sequence_id: sequenceId,
      mailbox_id: options.mailboxId,
      send_email_from_email_account_id: options.sendEmail ? options.mailboxId : undefined,
    });

    return response.success;
  }

  /**
   * 연락처 상세 정보 조회
   */
  async getContactDetails(contactId: string): Promise<Contact | null> {
    const response = await this.client.searchContacts({
      contact_ids: [contactId],
      page: 1,
      per_page: 1,
    });

    if (!response.success || !response.data?.contacts.length) {
      return null;
    }

    return response.data.contacts[0];
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
   */
  async enrichContact(
    email: string,
    organizationName?: string
  ): Promise<ContactEnrichmentResult | null> {
    const searchRequest: ContactSearchRequest = {
      emails: [email],
      organization_names: organizationName ? [organizationName] : undefined,
      page: 1,
      per_page: 1,
    };

    const response = await this.client.searchContacts(searchRequest);

    if (!response.success || !response.data?.contacts.length) {
      return null;
    }

    const contact = response.data.contacts[0];

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
      organization_names: organizationName ? [organizationName] : undefined,
      page: 1,
      per_page: limit,
    };

    const response = await this.client.searchContacts(searchRequest);

    if (!response.success || !response.data) {
      return [];
    }

    return response.data.contacts;
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

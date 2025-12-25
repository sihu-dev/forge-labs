/**
 * Persana AI Service
 * Lead enrichment with company intelligence and tech stack analysis
 *
 * NOTE: This service wraps the @forge/integrations Persana client.
 */

import {
  PersanaClient,
  type EnrichmentRequest,
  type PersonEnrichment,
  type CompanyEnrichment,
} from '@forge/integrations';

export interface PersanaServiceConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface EnrichedLead {
  person?: PersonEnrichment;
  company?: CompanyEnrichment;
  score: number;
  signals: LeadSignal[];
  enrichedAt: string;
}

export interface LeadSignal {
  type: 'funding' | 'hiring' | 'tech_stack' | 'news' | 'growth';
  strength: 'strong' | 'medium' | 'weak';
  description: string;
  detectedAt: string;
}

/**
 * Persana AI 서비스 래퍼
 * 리드 강화 및 인텔리전스 수집
 */
export class PersanaService {
  private client: PersanaClient;

  constructor(config: PersanaServiceConfig) {
    this.client = new PersanaClient({
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
    });
  }

  /**
   * 사람 정보 강화
   * 이메일이나 LinkedIn으로 상세 정보 수집
   */
  async enrichPerson(params: {
    email?: string;
    linkedinUrl?: string;
    name?: string;
    company?: string;
  }): Promise<PersonEnrichment | null> {
    const request: EnrichmentRequest = {
      email: params.email,
      linkedinUrl: params.linkedinUrl,
      companyName: params.company,
    };

    const response = await this.client.enrichPerson(request);

    if (!response.success || !response.data) {
      return null;
    }

    return response.data;
  }

  /**
   * 회사 정보 강화
   * 도메인이나 회사명으로 기업 인텔리전스 수집
   */
  async enrichCompany(params: {
    domain?: string;
    name?: string;
    website?: string;
  }): Promise<CompanyEnrichment | null> {
    const request: EnrichmentRequest = {
      domain: params.domain,
      companyName: params.name,
    };

    const response = await this.client.enrichCompany(request);

    if (!response.success || !response.data) {
      return null;
    }

    return response.data;
  }

  /**
   * 기술 스택 분석
   * 회사가 사용하는 기술을 파악하여 영업 전략 수립
   */
  async analyzeTechStack(domain: string): Promise<{
    technologies: Array<{
      name: string;
      category: string;
      confidence: number;
    }>;
    totalCount: number;
  }> {
    const response = await this.client.analyzeTechStack(domain);

    if (!response.success || !response.data) {
      return { technologies: [], totalCount: 0 };
    }

    const techStack = response.data;

    return {
      technologies: techStack.technologies.map((tech) => ({
        name: tech.name,
        category: tech.category,
        confidence: tech.confidence || 0.85, // Persana의 기술 스택 정확도
      })),
      totalCount: techStack.technologies.length,
    };
  }

  /**
   * 완전한 리드 강화
   * 사람 + 회사 정보를 모두 수집하여 종합 분석
   */
  async enrichLead(params: {
    email?: string;
    name?: string;
    company?: string;
    domain?: string;
  }): Promise<EnrichedLead> {
    const [person, company] = await Promise.all([
      params.email || params.name
        ? this.enrichPerson({
            email: params.email,
            name: params.name,
            company: params.company,
          })
        : null,
      params.domain || params.company
        ? this.enrichCompany({
            domain: params.domain,
            name: params.company,
          })
        : null,
    ]);

    // 리드 스코어 계산
    const score = this.calculateLeadScore({ person, company });

    // 구매 시그널 탐지
    const signals = this.detectBuyingSignals({ person, company });

    return {
      person: person || undefined,
      company: company || undefined,
      score,
      signals,
      enrichedAt: new Date().toISOString(),
    };
  }

  /**
   * 리드 스코어 계산
   * 0-100 점수로 리드의 잠재 가치 평가
   */
  private calculateLeadScore(data: {
    person?: PersonEnrichment | null;
    company?: CompanyEnrichment | null;
  }): number {
    let score = 0;

    // 개인 정보 기반 점수
    if (data.person) {
      // 현재 직위가 의사결정권자면 +30
      const seniorTitles = ['담당', '팀장', '부장', '이사', '대표', 'director', 'manager', 'head'];
      if (
        data.person.title &&
        seniorTitles.some((t) => data.person!.title!.toLowerCase().includes(t))
      ) {
        score += 30;
      }

      // 경력이 있으면 +10
      if (data.person.experience && data.person.experience.length > 0) {
        score += 10;
      }

      // LinkedIn이 있으면 +10 (연락 가능성 높음)
      if (data.person.linkedinUrl) {
        score += 10;
      }
    }

    // 회사 정보 기반 점수
    if (data.company) {
      // 직원 수가 많으면 잠재 거래액 큼
      if (data.company.employees) {
        if (data.company.employees > 1000) score += 20;
        else if (data.company.employees > 100) score += 15;
        else if (data.company.employees > 10) score += 10;
      }

      // 펀딩을 받았으면 +20 (구매력 있음)
      if (data.company.funding && data.company.funding.totalRaised) {
        score += 20;
      }

      // 산업이 타겟 업종이면 +10
      const targetIndustries = ['manufacturing', '제조', 'construction', '건설', 'water', '상하수도'];
      if (
        data.company.industry &&
        targetIndustries.some((ind) => data.company!.industry!.toLowerCase().includes(ind))
      ) {
        score += 10;
      }
    }

    return Math.min(score, 100);
  }

  /**
   * 구매 시그널 탐지
   * 회사의 최근 활동에서 구매 의사를 추론
   */
  private detectBuyingSignals(data: {
    person?: PersonEnrichment | null;
    company?: CompanyEnrichment | null;
  }): LeadSignal[] {
    const signals: LeadSignal[] = [];
    const now = new Date();

    // 펀딩 시그널
    if (data.company?.funding?.latestRoundDate) {
      const fundingDate = new Date(data.company.funding.latestRoundDate);
      const monthsAgo = (now.getTime() - fundingDate.getTime()) / (1000 * 60 * 60 * 24 * 30);

      if (monthsAgo < 6) {
        const amount = data.company.funding.latestRoundAmount
          ? `$${(data.company.funding.latestRoundAmount / 1000000).toFixed(1)}M`
          : 'undisclosed';
        signals.push({
          type: 'funding',
          strength: 'strong',
          description: `최근 ${data.company.funding.latestRound} 펀딩 ${amount} 유치`,
          detectedAt: data.company.funding.latestRoundDate,
        });
      }
    }

    // 채용 시그널 (성장 중)
    if (data.company?.employees && data.company.employees > 50) {
      signals.push({
        type: 'hiring',
        strength: 'medium',
        description: `직원 ${data.company.employees}명 규모 - 성장 중`,
        detectedAt: now.toISOString(),
      });
    }

    // 기술 스택 시그널
    // (실제로는 analyzeTechStack 결과를 사용)

    return signals;
  }

  /**
   * 배치 강화
   * 여러 리드를 한 번에 처리
   */
  async enrichLeadsBatch(
    leads: Array<{
      email?: string;
      name?: string;
      company?: string;
      domain?: string;
    }>
  ): Promise<EnrichedLead[]> {
    const results = await Promise.all(leads.map((lead) => this.enrichLead(lead)));
    return results;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      // 간단한 요청으로 API 연결 확인
      await this.enrichCompany({ domain: 'example.com' });
      return true;
    } catch (error) {
      return false;
    }
  }
}

/**
 * Persana Service Factory
 */
export function createPersanaService(apiKey?: string): PersanaService {
  const key = apiKey || process.env.PERSANA_API_KEY;

  if (!key) {
    throw new Error('PERSANA_API_KEY is required');
  }

  return new PersanaService({ apiKey: key });
}

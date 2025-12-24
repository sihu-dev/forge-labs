/**
 * Persana AI Integration Types
 * API 문서: https://docs.persana.ai/
 */

export interface PersanaConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  retryAttempts?: number;
}

export interface EnrichmentRequest {
  email?: string;
  domain?: string;
  linkedinUrl?: string;
  companyName?: string;
}

export interface PersonEnrichment {
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  title?: string;
  company?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  location?: string;
  bio?: string;
  skills?: string[];
  experience?: WorkExperience[];
  education?: Education[];
  confidence: number;
}

export interface WorkExperience {
  company: string;
  title: string;
  startDate?: string;
  endDate?: string;
  current: boolean;
  description?: string;
}

export interface Education {
  school: string;
  degree?: string;
  field?: string;
  startYear?: number;
  endYear?: number;
}

export interface CompanyEnrichment {
  domain: string;
  name: string;
  description?: string;
  industry?: string;
  size?: string;
  founded?: number;
  location?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  employees?: number;
  revenue?: string;
  funding?: FundingInfo;
  technologies?: string[];
  confidence: number;
}

export interface FundingInfo {
  totalRaised?: number;
  latestRound?: string;
  latestRoundAmount?: number;
  latestRoundDate?: string;
  investors?: string[];
}

export interface TechStackAnalysis {
  domain: string;
  technologies: Technology[];
  categories: TechCategory[];
  updatedAt: string;
}

export interface Technology {
  name: string;
  category: string;
  description?: string;
  confidence: number;
}

export interface TechCategory {
  name: string;
  technologies: string[];
  count: number;
}

export interface PersanaError {
  code: string;
  message: string;
  details?: unknown;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: PersanaError;
  metadata?: {
    requestId: string;
    timestamp: string;
    credits?: number;
  };
}

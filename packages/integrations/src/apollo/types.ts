/**
 * Apollo.io Integration Types
 * API 문서: https://apolloio.github.io/apollo-api-docs/
 */

export interface ApolloConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  retryAttempts?: number;
}

export interface ContactSearchRequest {
  q_keywords?: string;
  person_titles?: string[];
  person_locations?: string[];
  person_seniorities?: string[];
  organization_ids?: string[];
  organization_num_employees_ranges?: string[];
  page?: number;
  per_page?: number;
}

export interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  name: string;
  title: string;
  email: string;
  email_status: 'verified' | 'guessed' | 'unavailable' | 'bounced';
  linkedin_url?: string;
  twitter_url?: string;
  phone_numbers?: PhoneNumber[];
  organization: Organization;
  city?: string;
  state?: string;
  country?: string;
  departments?: string[];
  subdepartments?: string[];
  seniority?: string;
  functions?: string[];
  employment_history?: EmploymentHistory[];
}

export interface PhoneNumber {
  raw_number: string;
  sanitized_number: string;
  type: 'work' | 'mobile' | 'home' | 'other';
  position: number;
  status: 'valid' | 'invalid' | 'unverified';
}

export interface Organization {
  id: string;
  name: string;
  website_url?: string;
  blog_url?: string;
  angellist_url?: string;
  linkedin_url?: string;
  twitter_url?: string;
  facebook_url?: string;
  primary_phone?: PhoneNumber;
  languages?: string[];
  alexa_ranking?: number;
  phone?: string;
  linkedin_uid?: string;
  founded_year?: number;
  publicly_traded_symbol?: string;
  publicly_traded_exchange?: string;
  logo_url?: string;
  crunchbase_url?: string;
  primary_domain?: string;
  industry?: string;
  keywords?: string[];
  estimated_num_employees?: number;
  industries?: string[];
  secondary_industries?: string[];
  snippets_loaded?: boolean;
  industry_tag_id?: string;
  retail_location_count?: number;
  raw_address?: string;
  street_address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

export interface EmploymentHistory {
  organization_id?: string;
  organization_name: string;
  title: string;
  start_date?: string;
  end_date?: string;
  current: boolean;
}

export interface EmailVerificationRequest {
  email: string;
}

export interface EmailVerificationResult {
  email: string;
  status: 'valid' | 'invalid' | 'accept_all' | 'unknown' | 'disposable';
  is_deliverable: boolean;
  is_catch_all: boolean;
  is_role_account: boolean;
  is_free_email: boolean;
  is_disposable: boolean;
}

export interface Sequence {
  id: string;
  name: string;
  active: boolean;
  num_steps: number;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface SequenceContact {
  id: string;
  contact_id: string;
  sequence_id: string;
  state: 'active' | 'paused' | 'finished' | 'bounced' | 'unsubscribed';
  current_step: number;
  added_at: string;
  finished_at?: string;
}

export interface AddToSequenceRequest {
  contact_ids: string[];
  sequence_id: string;
  emailer_id?: string;
  send_on_behalf_of_email?: string;
}

export interface ApolloError {
  code: string;
  message: string;
  details?: unknown;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: ApolloError;
  pagination?: {
    page: number;
    per_page: number;
    total_entries: number;
    total_pages: number;
  };
  metadata?: {
    requestId: string;
    timestamp: string;
  };
}

/**
 * @forge/utils - CRM Entity Mapper (L1 - Molecules)
 *
 * Maps entities between different CRM platforms
 * Handles field transformations and data normalization
 */

import type { CRMTypes } from '@forge/types';
import type { Timestamp } from '@forge/types';

type IContact = CRMTypes.IContact;
type ICompany = CRMTypes.ICompany;
type IDeal = CRMTypes.IDeal;
type IActivity = CRMTypes.IActivity;
type CRMPlatform = CRMTypes.CRMPlatform;

// ============================================
// HubSpot Mappers
// ============================================

/**
 * Map HubSpot contact to unified contact
 */
export function mapHubSpotContactToUnified(
  hubspotContact: HubSpotContact,
  tenantId: string
): Partial<IContact> {
  const props = hubspotContact.properties;

  return {
    tenant_id: tenantId,
    email: props.email || '',
    first_name: props.firstname || null,
    last_name: props.lastname || null,
    phone: props.phone || null,
    job_title: props.jobtitle || null,
    lifecycle_stage: mapHubSpotLifecycleStage(props.lifecyclestage),
    lead_source: props.hs_lead_source || null,
    address: {
      street: props.address || null,
      city: props.city || null,
      state: props.state || null,
      postal_code: props.zip || null,
      country: props.country || null,
    },
    linkedin_url: props.hs_linkedin_url || null,
    twitter_handle: props.twitterhandle || null,
    custom_fields: extractHubSpotCustomFields(props),
    external_ids: [
      {
        platform: 'hubspot' as CRMPlatform,
        external_id: hubspotContact.id.toString(),
        last_synced_at: new Date().toISOString(),
      },
    ],
    last_activity_at: props.notes_last_updated
      ? new Date(parseInt(props.notes_last_updated)).toISOString()
      : null,
  };
}

/**
 * Map unified contact to HubSpot format
 */
export function mapUnifiedContactToHubSpot(
  contact: IContact
): HubSpotContactProperties {
  return {
    email: contact.email,
    firstname: contact.first_name || undefined,
    lastname: contact.last_name || undefined,
    phone: contact.phone || undefined,
    jobtitle: contact.job_title || undefined,
    lifecyclestage: mapUnifiedLifecycleStageToHubSpot(contact.lifecycle_stage),
    hs_lead_source: contact.lead_source || undefined,
    address: contact.address?.street || undefined,
    city: contact.address?.city || undefined,
    state: contact.address?.state || undefined,
    zip: contact.address?.postal_code || undefined,
    country: contact.address?.country || undefined,
    hs_linkedin_url: contact.linkedin_url || undefined,
    twitterhandle: contact.twitter_handle || undefined,
    ...flattenCustomFields(contact.custom_fields, 'hs_'),
  };
}

/**
 * Map HubSpot company to unified company
 */
export function mapHubSpotCompanyToUnified(
  hubspotCompany: HubSpotCompany,
  tenantId: string
): Partial<ICompany> {
  const props = hubspotCompany.properties;

  return {
    tenant_id: tenantId,
    name: props.name || '',
    domain: props.domain || null,
    industry: props.industry || null,
    description: props.description || null,
    employee_count: props.numberofemployees
      ? parseInt(props.numberofemployees)
      : null,
    company_size: mapHubSpotCompanySize(props.numberofemployees),
    annual_revenue: props.annualrevenue
      ? parseFloat(props.annualrevenue)
      : null,
    website: props.website || null,
    phone: props.phone || null,
    address: {
      street: props.address || null,
      city: props.city || null,
      state: props.state || null,
      postal_code: props.zip || null,
      country: props.country || null,
    },
    custom_fields: extractHubSpotCustomFields(props),
    external_ids: [
      {
        platform: 'hubspot' as CRMPlatform,
        external_id: hubspotCompany.id.toString(),
        last_synced_at: new Date().toISOString(),
      },
    ],
  };
}

/**
 * Map HubSpot deal to unified deal
 */
export function mapHubSpotDealToUnified(
  hubspotDeal: HubSpotDeal,
  tenantId: string,
  contactId: string,
  ownerId: string
): Partial<IDeal> {
  const props = hubspotDeal.properties;

  return {
    tenant_id: tenantId,
    name: props.dealname || '',
    amount: props.amount ? parseFloat(props.amount) : 0,
    currency: props.deal_currency_code || 'USD',
    stage: mapHubSpotDealStage(props.dealstage),
    probability: props.hs_probability
      ? parseInt(props.hs_probability)
      : calculateDefaultProbability(props.dealstage),
    contact_id: contactId,
    owner_id: ownerId,
    close_date: props.closedate
      ? new Date(props.closedate).toISOString()
      : null,
    custom_fields: extractHubSpotCustomFields(props),
    external_ids: [
      {
        platform: 'hubspot' as CRMPlatform,
        external_id: hubspotDeal.id.toString(),
        last_synced_at: new Date().toISOString(),
      },
    ],
  };
}

// ============================================
// Pipedrive Mappers
// ============================================

/**
 * Map Pipedrive person to unified contact
 */
export function mapPipedrivePersonToUnified(
  pipedrivePerson: PipedrivePerson,
  tenantId: string
): Partial<IContact> {
  const email =
    pipedrivePerson.email && pipedrivePerson.email.length > 0
      ? pipedrivePerson.email[0].value
      : '';
  const phone =
    pipedrivePerson.phone && pipedrivePerson.phone.length > 0
      ? pipedrivePerson.phone[0].value
      : null;

  return {
    tenant_id: tenantId,
    email,
    first_name: pipedrivePerson.first_name || null,
    last_name: pipedrivePerson.last_name || null,
    phone,
    company_id: pipedrivePerson.org_id?.value || null,
    custom_fields: extractPipedriveCustomFields(pipedrivePerson),
    external_ids: [
      {
        platform: 'pipedrive' as CRMPlatform,
        external_id: pipedrivePerson.id.toString(),
        last_synced_at: new Date().toISOString(),
      },
    ],
    last_activity_at: pipedrivePerson.last_activity_date
      ? new Date(pipedrivePerson.last_activity_date).toISOString()
      : null,
  };
}

/**
 * Map Pipedrive organization to unified company
 */
export function mapPipedriveOrgToUnified(
  pipedriveOrg: PipedriveOrganization,
  tenantId: string
): Partial<ICompany> {
  return {
    tenant_id: tenantId,
    name: pipedriveOrg.name || '',
    domain: pipedriveOrg.address || null,
    employee_count: pipedriveOrg.people_count || null,
    custom_fields: extractPipedriveCustomFields(pipedriveOrg),
    external_ids: [
      {
        platform: 'pipedrive' as CRMPlatform,
        external_id: pipedriveOrg.id.toString(),
        last_synced_at: new Date().toISOString(),
      },
    ],
  };
}

/**
 * Map Pipedrive deal to unified deal
 */
export function mapPipedriveDealToUnified(
  pipedriveDeal: PipedriveDeal,
  tenantId: string,
  contactId: string
): Partial<IDeal> {
  return {
    tenant_id: tenantId,
    name: pipedriveDeal.title || '',
    amount: pipedriveDeal.value || 0,
    currency: pipedriveDeal.currency || 'USD',
    probability: pipedriveDeal.probability || 0,
    contact_id: contactId,
    owner_id: pipedriveDeal.user_id?.id?.toString() || '',
    close_date: pipedriveDeal.expected_close_date
      ? new Date(pipedriveDeal.expected_close_date).toISOString()
      : null,
    custom_fields: extractPipedriveCustomFields(pipedriveDeal),
    external_ids: [
      {
        platform: 'pipedrive' as CRMPlatform,
        external_id: pipedriveDeal.id.toString(),
        last_synced_at: new Date().toISOString(),
      },
    ],
  };
}

// ============================================
// Helper Functions
// ============================================

/**
 * Map HubSpot lifecycle stage to unified
 */
function mapHubSpotLifecycleStage(
  stage: string | undefined
): CRMTypes.LifecycleStage {
  const mapping: Record<string, CRMTypes.LifecycleStage> = {
    subscriber: 'subscriber',
    lead: 'lead',
    marketingqualifiedlead: 'marketing_qualified_lead',
    salesqualifiedlead: 'sales_qualified_lead',
    opportunity: 'opportunity',
    customer: 'customer',
    evangelist: 'evangelist',
  };

  return mapping[stage?.toLowerCase() || ''] || 'other';
}

/**
 * Map unified lifecycle stage to HubSpot
 */
function mapUnifiedLifecycleStageToHubSpot(
  stage: CRMTypes.LifecycleStage
): string {
  const mapping: Record<CRMTypes.LifecycleStage, string> = {
    subscriber: 'subscriber',
    lead: 'lead',
    marketing_qualified_lead: 'marketingqualifiedlead',
    sales_qualified_lead: 'salesqualifiedlead',
    opportunity: 'opportunity',
    customer: 'customer',
    evangelist: 'evangelist',
    other: 'other',
  };

  return mapping[stage] || 'other';
}

/**
 * Map HubSpot company size to unified
 */
function mapHubSpotCompanySize(
  employees: string | undefined
): CRMTypes.CompanySize | null {
  if (!employees) return null;

  const count = parseInt(employees);
  if (count <= 10) return '1-10';
  if (count <= 50) return '11-50';
  if (count <= 200) return '51-200';
  if (count <= 500) return '201-500';
  if (count <= 1000) return '501-1000';
  if (count <= 5000) return '1001-5000';
  return '5001+';
}

/**
 * Map HubSpot deal stage to unified
 */
function mapHubSpotDealStage(stage: string | undefined): CRMTypes.DealStage {
  const mapping: Record<string, CRMTypes.DealStage> = {
    appointmentscheduled: 'appointment_scheduled',
    qualifiedtobuy: 'qualified_to_buy',
    presentationscheduled: 'presentation_scheduled',
    decisionmakerboughtin: 'decision_maker_bought_in',
    contractsent: 'contract_sent',
    closedwon: 'closed_won',
    closedlost: 'closed_lost',
  };

  return (
    mapping[stage?.toLowerCase().replace(/\s/g, '') || ''] ||
    'appointment_scheduled'
  );
}

/**
 * Calculate default probability based on stage
 */
function calculateDefaultProbability(stage: string | undefined): number {
  const mapping: Record<string, number> = {
    appointmentscheduled: 10,
    qualifiedtobuy: 20,
    presentationscheduled: 40,
    decisionmakerboughtin: 60,
    contractsent: 80,
    closedwon: 100,
    closedlost: 0,
  };

  return mapping[stage?.toLowerCase().replace(/\s/g, '') || ''] || 10;
}

/**
 * Extract custom fields from HubSpot properties
 */
function extractHubSpotCustomFields(
  props: Record<string, string | undefined>
): Record<string, unknown> {
  const custom: Record<string, unknown> = {};

  // HubSpot custom properties start with specific prefixes
  for (const [key, value] of Object.entries(props)) {
    if (
      key.startsWith('hs_') &&
      !HUBSPOT_STANDARD_FIELDS.includes(key) &&
      value !== undefined
    ) {
      custom[key] = value;
    }
  }

  return custom;
}

/**
 * Extract custom fields from Pipedrive object
 */
function extractPipedriveCustomFields(
  obj: Record<string, unknown>
): Record<string, unknown> {
  const custom: Record<string, unknown> = {};

  // Pipedrive custom fields are typically prefixed with hash (#)
  for (const [key, value] of Object.entries(obj)) {
    if (key.includes('#') && value !== undefined) {
      custom[key] = value;
    }
  }

  return custom;
}

/**
 * Flatten custom fields for API submission
 */
function flattenCustomFields(
  customFields: Record<string, unknown>,
  prefix: string = ''
): Record<string, string | undefined> {
  const flattened: Record<string, string | undefined> = {};

  for (const [key, value] of Object.entries(customFields)) {
    const fieldKey = key.startsWith(prefix) ? key : `${prefix}${key}`;
    flattened[fieldKey] =
      typeof value === 'object' ? JSON.stringify(value) : String(value);
  }

  return flattened;
}

/**
 * HubSpot standard fields (not custom)
 */
const HUBSPOT_STANDARD_FIELDS = [
  'hs_lead_source',
  'hs_linkedin_url',
  'hs_probability',
  'hs_object_id',
  'hs_createdate',
  'hs_lastmodifieddate',
];

// ============================================
// Type Definitions (External Platforms)
// ============================================

interface HubSpotContact {
  id: number | string;
  properties: Record<string, string | undefined>;
  createdAt: string;
  updatedAt: string;
}

interface HubSpotContactProperties {
  email: string;
  firstname?: string;
  lastname?: string;
  phone?: string;
  jobtitle?: string;
  lifecyclestage?: string;
  hs_lead_source?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  hs_linkedin_url?: string;
  twitterhandle?: string;
  [key: string]: string | undefined;
}

interface HubSpotCompany {
  id: number | string;
  properties: Record<string, string | undefined>;
  createdAt: string;
  updatedAt: string;
}

interface HubSpotDeal {
  id: number | string;
  properties: Record<string, string | undefined>;
  createdAt: string;
  updatedAt: string;
}

interface PipedrivePerson {
  id: number;
  first_name: string;
  last_name: string;
  email: Array<{ value: string; primary: boolean }>;
  phone: Array<{ value: string; primary: boolean }>;
  org_id: { value: string } | null;
  last_activity_date: string | null;
  [key: string]: unknown;
}

interface PipedriveOrganization {
  id: number;
  name: string;
  address: string | null;
  people_count: number | null;
  [key: string]: unknown;
}

interface PipedriveDeal {
  id: number;
  title: string;
  value: number;
  currency: string;
  probability: number;
  user_id: { id: number } | null;
  expected_close_date: string | null;
  [key: string]: unknown;
}

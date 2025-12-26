// @ts-nocheck
/**
 * @route POST /api/v1/leads/enrich
 * @description Lead Enrichment API
 *
 * 입찰 공고에서 발주 기관 담당자를 자동으로 찾고 정보를 강화합니다.
 *
 * Flow:
 * 1. 입찰 공고 정보 로드 (bidId)
 * 2. Apollo로 담당자 검색
 * 3. Persana로 회사/담당자 정보 강화
 * 4. 리드 스코어 계산
 * 5. Supabase에 저장
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createApolloService } from '@/lib/services/apollo-service';
import { createPersanaService } from '@/lib/services/persana-service';

// ============================================================================
// 요청 스키마
// ============================================================================

const EnrichRequestSchema = z.object({
  // Option 1: 입찰 ID로 조회
  bidId: z.string().uuid().optional(),

  // Option 2: 직접 입력
  organizationName: z.string().optional(),
  domain: z.string().optional(),

  // 옵션
  titles: z.array(z.string()).optional(), // 검색할 직책들
  saveToCRM: z.boolean().default(true), // CRM에 자동 저장 여부
  autoSequence: z.boolean().default(false), // 자동으로 시퀀스에 추가
}).refine(
  (data) => data.bidId || data.organizationName,
  { message: 'bidId 또는 organizationName이 필요합니다' }
);

// ============================================================================
// 타입 정의
// ============================================================================

interface EnrichedContact {
  id: string;
  name: string;
  email: string;
  title?: string;
  phone?: string;
  linkedin?: string;
  organization: string;
  department?: string;
  score: number;
  source: 'apollo' | 'persana';
  verified: boolean;
  signals: Array<{
    type: string;
    description: string;
    strength: string;
  }>;
}

interface EnrichmentResponse {
  success: boolean;
  data?: {
    organizationName: string;
    contacts: EnrichedContact[];
    companyInfo?: {
      industry?: string;
      employeeCount?: number;
      funding?: number;
      technologies?: string[];
    };
    totalFound: number;
    enrichedCount: number;
    savedToDb: boolean;
  };
  error?: string;
}

// ============================================================================
// POST Handler
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse<EnrichmentResponse>> {
  try {
    const supabase = await createClient();

    // 1. 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: '인증이 필요합니다',
        },
        { status: 401 }
      );
    }

    // 2. 요청 검증
    const body = await request.json();
    const validationResult = EnrichRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: validationResult.error.errors[0].message,
        },
        { status: 400 }
      );
    }

    const params = validationResult.data;

    // 3. 입찰 정보 로드 (bidId가 있는 경우)
    let organizationName = params.organizationName;
    let domain = params.domain;

    if (params.bidId) {
      const { data: bid, error: bidError } = await supabase
        .from('bids')
        .select('organization, organization_domain')
        .eq('id', params.bidId)
        .single();

      if (bidError || !bid) {
        return NextResponse.json(
          {
            success: false,
            error: '입찰 정보를 찾을 수 없습니다',
          },
          { status: 404 }
        );
      }

      organizationName = bid.organization;
      domain = bid.organization_domain;
    }

    if (!organizationName) {
      return NextResponse.json(
        {
          success: false,
          error: 'organizationName이 필요합니다',
        },
        { status: 400 }
      );
    }

    // 4. Apollo로 담당자 검색
    const apolloService = createApolloService();
    const apolloResult = await apolloService.searchContactsByOrganization(organizationName, {
      titles: params.titles || ['구매', '조달', '시설', '자재'],
      limit: 10,
    });

    // 5. Persana로 회사 정보 강화
    const persanaService = createPersanaService();
    const companyEnrichment = domain
      ? await persanaService.enrichCompany({ domain, name: organizationName })
      : null;

    // 6. 각 담당자 정보 강화
    const enrichedContacts: EnrichedContact[] = [];

    for (const contact of apolloResult.contacts.slice(0, 5)) {
      // 상위 5명만
      // 이메일 검증
      const emailVerification = contact.email
        ? await apolloService.verifyEmail(contact.email)
        : { valid: false, status: 'unknown' as const, confidence: 0 };

      // Persana로 개인 정보 강화
      const personEnrichment = contact.email
        ? await persanaService.enrichPerson({
            email: contact.email,
            name: contact.name,
            company: organizationName,
          })
        : null;

      // 리드 강화 결과
      const leadEnrichment = await persanaService.enrichLead({
        email: contact.email || undefined,
        name: contact.name,
        company: organizationName,
        domain: domain || undefined,
      });

      enrichedContacts.push({
        id: contact.id,
        name: contact.name,
        email: contact.email || '',
        title: contact.title || personEnrichment?.title,
        phone: contact.phone_numbers?.[0]?.raw_number,
        linkedin: contact.linkedin_url || personEnrichment?.linkedin_url,
        organization: organizationName,
        department: contact.departments?.[0],
        score: leadEnrichment.score,
        source: 'apollo',
        verified: emailVerification.valid,
        signals: leadEnrichment.signals.map((s) => ({
          type: s.type,
          description: s.description,
          strength: s.strength,
        })),
      });
    }

    // 7. Supabase에 저장 (saveToCRM = true인 경우)
    let savedToDb = false;

    if (params.saveToCRM && enrichedContacts.length > 0) {
      const leadsToInsert = enrichedContacts.map((contact) => ({
        user_id: user.id,
        bid_id: params.bidId || null,
        name: contact.name,
        email: contact.email,
        title: contact.title,
        phone: contact.phone,
        linkedin_url: contact.linkedin,
        organization: contact.organization,
        department: contact.department,
        score: contact.score,
        source: contact.source,
        verified: contact.verified,
        signals: contact.signals,
        enriched_at: new Date().toISOString(),
      }));

      const { error: insertError } = await supabase.from('leads').upsert(leadsToInsert, {
        onConflict: 'email',
        ignoreDuplicates: false,
      });

      if (!insertError) {
        savedToDb = true;
      }
    }

    // 8. 응답 반환
    return NextResponse.json({
      success: true,
      data: {
        organizationName,
        contacts: enrichedContacts,
        companyInfo: companyEnrichment
          ? {
              industry: companyEnrichment.industry,
              employeeCount: companyEnrichment.employee_count,
              funding:
                companyEnrichment.funding?.reduce((sum, f) => sum + (f.amount_raised || 0), 0) ||
                0,
              technologies: [], // Tech stack은 별도 호출 필요
            }
          : undefined,
        totalFound: apolloResult.totalFound,
        enrichedCount: enrichedContacts.length,
        savedToDb,
      },
    });
  } catch (error) {
    console.error('Lead enrichment error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET Handler - 저장된 리드 조회
// ============================================================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const bidId = searchParams.get('bidId');

    let query = supabase.from('leads').select('*').eq('user_id', user.id).order('score', { ascending: false });

    if (bidId) {
      query = query.eq('bid_id', bidId);
    }

    const { data: leads, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: leads,
      total: leads.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch leads',
      },
      { status: 500 }
    );
  }
}

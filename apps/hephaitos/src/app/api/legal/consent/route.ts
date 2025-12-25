/**
 * Legal Consent API
 * QRY-023: 사용자 동의 관리 엔드포인트
 *
 * ⚠️ 본 서비스는 교육 목적이며, 투자 조언이 아닙니다.
 */

import { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies, headers } from 'next/headers'
import { withApiMiddleware, createApiResponse, ApiError } from '@/lib/api/middleware'
import { safeLogger } from '@/lib/utils/safe-logger'
import {
  complianceService,
  DISCLAIMERS,
  CONSENT_REQUIREMENTS,
  type ConsentType,
} from '@/lib/legal'

export const dynamic = 'force-dynamic'

/**
 * GET /api/legal/consent
 * 동의 상태 및 요구사항 조회
 */
export const GET = withApiMiddleware(
  async (request: NextRequest) => {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    // 로그인하지 않은 사용자도 요구사항 조회 가능
    if (type === 'requirements') {
      return createApiResponse({
        success: true,
        requirements: CONSENT_REQUIREMENTS,
        disclaimers: DISCLAIMERS,
      })
    }

    if (!user) {
      return createApiResponse(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      )
    }

    try {
      const status = await complianceService.getConsentStatus(user.id)

      return createApiResponse({
        success: true,
        ...status,
        requirements: CONSENT_REQUIREMENTS,
      })
    } catch (error) {
      safeLogger.error('[Legal API] Failed to get consent status', { error })
      throw new ApiError('동의 상태 조회에 실패했습니다', 500)
    }
  },
  {
    rateLimit: { category: 'api' },
    errorHandler: { logErrors: true },
  }
)

/**
 * POST /api/legal/consent
 * 동의 기록 / 철회
 */
export const POST = withApiMiddleware(
  async (request: NextRequest) => {
    const cookieStore = await cookies()
    const headersList = await headers()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return createApiResponse(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      )
    }

    let body
    try {
      body = await request.json()
    } catch {
      return createApiResponse({ error: 'Invalid request body' }, { status: 400 })
    }

    const { action, consentType, consentTypes } = body

    // IP 및 User-Agent 수집 (감사 추적용)
    const ipAddress = headersList.get('x-forwarded-for')?.split(',')[0] ||
                      headersList.get('x-real-ip') ||
                      'unknown'
    const userAgent = headersList.get('user-agent') || 'unknown'

    try {
      switch (action) {
        case 'agree': {
          if (!consentType) {
            return createApiResponse({ error: 'consentType is required' }, { status: 400 })
          }

          const result = await complianceService.recordConsent(
            user.id,
            consentType as ConsentType,
            ipAddress,
            userAgent
          )

          if (!result.success) {
            return createApiResponse({ error: result.error }, { status: 400 })
          }

          safeLogger.info('[Legal API] Consent recorded', {
            userId: user.id,
            consentType,
          })

          return createApiResponse({
            success: true,
            message: '동의가 기록되었습니다',
          })
        }

        case 'agree_multiple': {
          if (!consentTypes || !Array.isArray(consentTypes)) {
            return createApiResponse({ error: 'consentTypes array is required' }, { status: 400 })
          }

          const results = await Promise.all(
            consentTypes.map((ct: ConsentType) =>
              complianceService.recordConsent(user.id, ct, ipAddress, userAgent)
            )
          )

          const failed = results.filter(r => !r.success)
          if (failed.length > 0) {
            return createApiResponse({
              success: false,
              message: `${failed.length}개의 동의 기록에 실패했습니다`,
              errors: failed.map(f => f.error),
            }, { status: 400 })
          }

          return createApiResponse({
            success: true,
            message: `${consentTypes.length}개의 동의가 기록되었습니다`,
          })
        }

        case 'revoke': {
          if (!consentType) {
            return createApiResponse({ error: 'consentType is required' }, { status: 400 })
          }

          const result = await complianceService.revokeConsent(
            user.id,
            consentType as ConsentType
          )

          if (!result.success) {
            return createApiResponse({ error: result.error }, { status: 400 })
          }

          safeLogger.info('[Legal API] Consent revoked', {
            userId: user.id,
            consentType,
          })

          return createApiResponse({
            success: true,
            message: '동의가 철회되었습니다',
          })
        }

        case 'check_feature': {
          const { feature } = body
          if (!feature) {
            return createApiResponse({ error: 'feature is required' }, { status: 400 })
          }

          const result = await complianceService.canUseFeature(user.id, feature)

          return createApiResponse({
            success: true,
            ...result,
          })
        }

        default:
          return createApiResponse({ error: 'Unknown action' }, { status: 400 })
      }
    } catch (error) {
      safeLogger.error('[Legal API] Error', { error, action })
      throw new ApiError('요청 처리에 실패했습니다', 500)
    }
  },
  {
    rateLimit: { category: 'api' },
    errorHandler: { logErrors: true },
  }
)
